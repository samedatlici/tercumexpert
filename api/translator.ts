import { matchesTranslator, computePayout, estimatePages } from './_pool-logic'

/**
 * Tercüman paneli SUNUCU uç noktası (Edge). GÜVENLİK: tercümanlara doğrudan yazma
 * izni YOKTUR; para/iş durumu yalnızca burada (service role) değişir. Her istek,
 * çağıranın Supabase erişim jetonuyla doğrulanır; onaylı tercüman değilse reddedilir.
 *
 * Faz 3 eylemleri: 'pool' (uzmanlık+dil'e uyan available siparişler + dosya + kazanç),
 *                  'claim' (işi üstlen; payout server'da kilitlenir).
 * Sonraki fazlar: submit / ship / (admin) approve / complete / pay burada eklenecek.
 */
export const config = { runtime: 'edge' }

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://xtqymenxaozzwmqfssod.supabase.co'
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

function svcHeaders(extra?: Record<string, string>): Record<string, string> {
  return { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}`, ...(extra ?? {}) }
}
function json(obj: unknown, status = 200): Response {
  return new Response(JSON.stringify(obj), { status, headers: { 'content-type': 'application/json' } })
}

/** Erişim jetonundan kullanıcıyı doğrular. */
async function getUser(token: string): Promise<{ id: string; email: string } | null> {
  try {
    const res = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
      headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${token}` },
    })
    if (!res.ok) return null
    const u = (await res.json()) as { id?: string; email?: string }
    return u?.id ? { id: u.id, email: (u.email || '').toLowerCase() } : null
  } catch {
    return null
  }
}

interface TranslatorRow {
  id: string
  expertise: string[]
  language_pairs: { source: string; target: string }[]
}
async function getApprovedTranslator(userId: string): Promise<TranslatorRow | null> {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/translators?user_id=eq.${userId}&status=eq.approved&select=id,expertise,language_pairs`,
    { headers: svcHeaders() },
  )
  if (!res.ok) return null
  const rows = (await res.json()) as TranslatorRow[]
  return rows[0] ?? null
}

async function signedUrl(bucket: string, path: string, expiresIn = 3600): Promise<string | null> {
  try {
    const res = await fetch(`${SUPABASE_URL}/storage/v1/object/sign/${bucket}/${path}`, {
      method: 'POST',
      headers: svcHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ expiresIn }),
    })
    if (!res.ok) return null
    const d = (await res.json()) as { signedURL?: string }
    return d?.signedURL ? `${SUPABASE_URL}/storage/v1${d.signedURL}` : null
  } catch {
    return null
  }
}

const ORDER_COLS =
  'id,order_no,service,source_lang,target_lang,document_type,word_count,urgent,sworn,notarization,apostille,physical_delivery,input_mode,source_text,note,delivery_days,created_at,' +
  'contact_name,contact_email,contact_phone,delivery_address,delivery_city,delivery_postal_code,delivery_country'

export default async function handler(req: Request): Promise<Response> {
  if (req.method !== 'POST') return json({ error: 'method' }, 405)
  if (!SERVICE_KEY) return json({ error: 'server_config' }, 500)

  const token = (req.headers.get('authorization') || '').replace(/^Bearer\s+/i, '').trim()
  if (!token) return json({ error: 'no_auth' }, 401)

  let body: { action?: string; orderId?: string }
  try {
    body = await req.json()
  } catch {
    return json({ error: 'bad_json' }, 400)
  }

  const user = await getUser(token)
  if (!user) return json({ error: 'invalid_token' }, 401)

  const translator = await getApprovedTranslator(user.id)
  if (!translator) return json({ error: 'not_translator' }, 403)

  const action = body.action

  // -------- Havuz: uyan available siparişler + dosya/metin + kazanç --------
  if (action === 'pool') {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/orders?work_status=eq.available&select=${ORDER_COLS}&order=created_at.desc`,
      { headers: svcHeaders() },
    )
    if (!res.ok) return json({ error: 'load' }, 200)
    const orders = (await res.json()) as Array<Record<string, unknown>>
    const matched = orders.filter((o) =>
      matchesTranslator(o as unknown as Parameters<typeof matchesTranslator>[0], translator),
    )
    const out = []
    for (const o of matched) {
      const files: Array<{ name: string; url: string | null }> = []
      const fRes = await fetch(
        `${SUPABASE_URL}/rest/v1/order_files?order_id=eq.${o.id}&select=file_name,storage_path`,
        { headers: svcHeaders() },
      )
      if (fRes.ok) {
        const rows = (await fRes.json()) as Array<{ file_name: string; storage_path: string }>
        for (const f of rows) files.push({ name: f.file_name, url: await signedUrl('order-files', f.storage_path) })
      }
      out.push({
        ...o,
        payout: computePayout(o as unknown as Parameters<typeof computePayout>[0]),
        pages: estimatePages(Number(o.word_count) || 0),
        files,
      })
    }
    return json({ orders: out })
  }

  // -------- İşi üstlen (claim) --------
  if (action === 'claim') {
    const orderId = body.orderId
    if (!orderId) return json({ error: 'no_order' }, 400)
    const oRes = await fetch(`${SUPABASE_URL}/rest/v1/orders?id=eq.${orderId}&select=${ORDER_COLS},work_status`, {
      headers: svcHeaders(),
    })
    const order = ((await oRes.json()) as Array<Record<string, unknown>>)[0]
    if (!order) return json({ error: 'not_found' }, 404)
    if (order.work_status !== 'available') return json({ error: 'unavailable' }, 409)
    if (!matchesTranslator(order as unknown as Parameters<typeof matchesTranslator>[0], translator)) {
      return json({ error: 'not_allowed' }, 403)
    }
    const payout = computePayout(order as unknown as Parameters<typeof computePayout>[0])
    // Koşullu güncelleme: yalnızca hâlâ 'available' ise (yarış durumunu önler).
    const uRes = await fetch(
      `${SUPABASE_URL}/rest/v1/orders?id=eq.${orderId}&work_status=eq.available`,
      {
        method: 'PATCH',
        headers: svcHeaders({ 'Content-Type': 'application/json', Prefer: 'return=representation' }),
        body: JSON.stringify({
          translator_id: translator.id,
          work_status: 'claimed',
          translator_payout: payout,
          claimed_at: new Date().toISOString(),
        }),
      },
    )
    const updated = (await uRes.json()) as unknown[]
    if (!Array.isArray(updated) || updated.length === 0) return json({ error: 'race' }, 409)
    return json({ ok: true, payout })
  }

  return json({ error: 'unknown_action' }, 400)
}

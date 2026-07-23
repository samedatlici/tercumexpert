import { sendOrderEmail } from './_email'

/**
 * Müşteri sipariş bildirimleri (şimdilik yalnızca 'received' = sipariş alındı).
 * Sipariş oluşturma istemci tarafında olduğundan, oluşturduktan sonra bu uç çağrılır.
 * GÜVENLİK: siparişin çağıran kullanıcıya ait olduğu erişim jetonuyla doğrulanır.
 */
export const config = { runtime: 'edge' }

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://xtqymenxaozzwmqfssod.supabase.co'
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

function json(obj: unknown, status = 200): Response {
  return new Response(JSON.stringify(obj), { status, headers: { 'content-type': 'application/json' } })
}

async function getUser(token: string): Promise<{ id: string } | null> {
  try {
    const res = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
      headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${token}` },
    })
    if (!res.ok) return null
    const u = (await res.json()) as { id?: string }
    return u?.id ? { id: u.id } : null
  } catch {
    return null
  }
}

export default async function handler(req: Request): Promise<Response> {
  if (req.method !== 'POST') return json({ error: 'method' }, 405)
  if (!SERVICE_KEY) return json({ ok: false, error: 'server_config' }, 200)

  const token = (req.headers.get('authorization') || '').replace(/^Bearer\s+/i, '').trim()
  if (!token) return json({ ok: false, error: 'no_auth' }, 200)

  let body: { orderId?: unknown; event?: unknown }
  try {
    body = await req.json()
  } catch {
    return json({ error: 'bad_json' }, 400)
  }
  const orderId = typeof body.orderId === 'string' ? body.orderId : ''
  // İstemciden yalnızca 'received' kabul edilir; diğer olaylar sunucu iş akışında (translator.ts) tetiklenir.
  const event = body.event === 'received' ? 'received' : ''
  if (!orderId || !event) return json({ ok: false, error: 'invalid' }, 200)

  const user = await getUser(token)
  if (!user) return json({ ok: false, error: 'invalid_token' }, 200)

  const r = await fetch(
    `${SUPABASE_URL}/rest/v1/orders?id=eq.${orderId}&select=order_no,contact_name,contact_email,locale,user_id`,
    { headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}` } },
  )
  if (!r.ok) return json({ ok: false, error: 'load' }, 200)
  const ord = ((await r.json()) as Array<{ user_id?: string; contact_email?: string | null }>)[0]
  if (!ord || ord.user_id !== user.id) return json({ ok: false, error: 'not_found' }, 200)

  const res = await sendOrderEmail('received', ord as Parameters<typeof sendOrderEmail>[1])
  return json({ ok: res.ok, skipped: res.skipped ?? false })
}

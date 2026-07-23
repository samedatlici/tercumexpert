/**
 * Sipariş takip verisi (EDGE). GÜVENLİK: bir siparişi YALNIZCA onu veren müşteri
 * görebilir. Sunucu, çağıranın erişim jetonundaki kullanıcıyla siparişin user_id'sini
 * karşılaştırır; eşleşmezse (başka müşteri kod deneme dahil) BOŞ döner → sayfa "bulunamadı".
 * RLS'ten bağımsız kesin kontrol (service role ile okunur, sahiplik kodda doğrulanır).
 */
export const config = { runtime: 'edge' }

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://xtqymenxaozzwmqfssod.supabase.co'
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

const COLS =
  'id,order_no,created_at,status,service,source_lang,target_lang,document_type,word_count,urgent,' +
  'notarization,physical_delivery,total,delivery_days,input_mode,note,tracking_url,carrier,contact_phone,' +
  'delivery_address,delivery_city,delivery_postal_code,delivery_country,user_id'

function json(obj: unknown, status = 200): Response {
  return new Response(JSON.stringify(obj), { status, headers: { 'content-type': 'application/json' } })
}
async function getUserId(token: string): Promise<string | null> {
  try {
    const res = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
      headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${token}` },
    })
    if (!res.ok) return null
    const u = (await res.json()) as { id?: string }
    return u?.id ?? null
  } catch {
    return null
  }
}

export default async function handler(req: Request): Promise<Response> {
  if (req.method !== 'POST') return json({ error: 'method' }, 405)
  if (!SERVICE_KEY) return json({ error: 'server_config' }, 200)

  const token = (req.headers.get('authorization') || '').replace(/^Bearer\s+/i, '').trim()
  if (!token) return json({}, 200) // giriş yok → bulunamadı gibi davran

  let body: { orderNo?: unknown }
  try {
    body = await req.json()
  } catch {
    return json({ error: 'bad_json' }, 400)
  }
  const orderNo = Number.parseInt(String(body.orderNo ?? ''), 10)
  if (!Number.isFinite(orderNo)) return json({}, 200)

  const userId = await getUserId(token)
  if (!userId) return json({}, 200)

  const r = await fetch(`${SUPABASE_URL}/rest/v1/orders?order_no=eq.${orderNo}&select=${COLS}`, {
    headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}` },
  })
  if (!r.ok) return json({ error: 'load' }, 200)
  const ord = ((await r.json()) as Array<Record<string, unknown>>)[0]
  // Sahiplik kontrolü: sipariş yoksa VEYA başkasına aitse → boş (bulunamadı).
  if (!ord || ord.user_id !== userId) return json({}, 200)
  delete ord.user_id // istemciye sızdırma
  return json({ order: ord })
}

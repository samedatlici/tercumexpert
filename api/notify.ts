import { sendOrderEmail, buildEmail, sendEmail, emailExtra, orderUrl } from './_email'

/**
 * Sipariş bildirimleri (EDGE — güvenilir, hafif; chromium/PDF YOK).
 * Sipariş oluşunca istemci çağırır:
 *  - Müşteriye "Siparişiniz alındı" (kendi dilinde).
 *  - admin@tercumexpert.com'a "Yeni sipariş aldınız" (TR) + detay tablosu.
 * PDF fatura ayrı/isteğe bağlıdır; bu uç mailleri HER ZAMAN gönderir.
 * GÜVENLİK: siparişin çağıran kullanıcıya ait olduğu erişim jetonuyla doğrulanır.
 */
export const config = { runtime: 'edge' }

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://xtqymenxaozzwmqfssod.supabase.co'
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
const ADMIN_EMAIL = 'admin@tercumexpert.com'
const ADMIN_LOCALE = 'tr'

function json(obj: unknown, status = 200): Response {
  return new Response(JSON.stringify(obj), { status, headers: { 'content-type': 'application/json' } })
}
function money(n: number): string {
  try {
    return new Intl.NumberFormat(ADMIN_LOCALE, { style: 'currency', currency: 'TRY' }).format(n || 0)
  } catch {
    return `${(n || 0).toFixed(2)} TRY`
  }
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

interface OrderRow {
  order_no: number
  contact_name: string | null
  contact_email: string | null
  contact_phone: string | null
  locale: string | null
  source_lang: string | null
  target_lang: string | null
  total: number | null
  user_id?: string
}

export default async function handler(req: Request): Promise<Response> {
  if (req.method !== 'POST') return json({ error: 'method' }, 405)
  if (!SERVICE_KEY) return json({ ok: false, error: 'server_config' }, 200)

  const token = (req.headers.get('authorization') || '').replace(/^Bearer\s+/i, '').trim()
  if (!token) return json({ ok: false, error: 'no_auth' }, 200)

  let body: { orderId?: unknown }
  try {
    body = await req.json()
  } catch {
    return json({ error: 'bad_json' }, 400)
  }
  const orderId = typeof body.orderId === 'string' ? body.orderId : ''
  if (!orderId) return json({ ok: false, error: 'invalid' }, 200)

  const user = await getUser(token)
  if (!user) return json({ ok: false, error: 'invalid_token' }, 200)

  const cols = 'order_no,contact_name,contact_email,contact_phone,locale,source_lang,target_lang,total,user_id'
  const r = await fetch(`${SUPABASE_URL}/rest/v1/orders?id=eq.${orderId}&select=${cols}`, {
    headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}` },
  })
  if (!r.ok) return json({ ok: false, error: 'load' }, 200)
  const ord = ((await r.json()) as OrderRow[])[0]
  if (!ord || ord.user_id !== user.id) return json({ ok: false, error: 'not_found' }, 200)

  // 1) Müşteriye "sipariş alındı".
  let customerOk = false
  try {
    const res = await sendOrderEmail('received', ord as Parameters<typeof sendOrderEmail>[1])
    customerOk = res.ok
  } catch {
    /* yut */
  }

  // 2) Admine "yeni sipariş" + detaylar.
  let adminOk = false
  try {
    const ex = emailExtra(ADMIN_LOCALE)
    const langs = `${(ord.source_lang || '').toUpperCase()} → ${(ord.target_lang || '').toUpperCase()}`
    const mail = buildEmail({
      event: 'admin_new_order',
      locale: ADMIN_LOCALE,
      name: '',
      orderNo: ord.order_no,
      orderUrl: orderUrl(ADMIN_LOCALE, ord.order_no),
      details: [
        { label: ex.lblCustomer, value: ord.contact_name || '—' },
        { label: 'E-posta', value: ord.contact_email || '—' },
        { label: 'Telefon', value: ord.contact_phone || '—' },
        { label: ex.lblLangs, value: langs },
        { label: ex.lblTotal, value: money(Number(ord.total) || 0) },
      ],
    })
    const res = await sendEmail(ADMIN_EMAIL, mail.subject, mail.html)
    adminOk = res.ok
  } catch {
    /* yut */
  }

  return json({ ok: true, customer: customerOk, admin: adminOk })
}

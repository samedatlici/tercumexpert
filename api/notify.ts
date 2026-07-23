import { sendEmail, buildEmail, emailExtra, orderUrl, panelUrl, type EmailAttachment } from './_email'
import { buildInvoiceHtml, invoiceNumber, type InvoiceOrder } from './_invoice'

/**
 * Sipariş bildirimleri (EDGE — güvenilir, hafif; chromium YOK).
 * Sipariş oluşunca istemci çağırır:
 *  - Müşteriye "Siparişiniz alındı" (kendi dilinde) + FATURA (HTML eki, kendi dilinde).
 *  - admin@tercumexpert.com'a "Yeni sipariş aldınız" (TR) + detay + SATICI faturası (HTML eki).
 * Fatura HTML olarak eklenir (tarayıcıda açılır / "Yazdır → PDF"). Üretimi best-effort:
 * başarısız olsa bile mailler HER ZAMAN eksiz gider.
 * GÜVENLİK: siparişin çağıran kullanıcıya ait olduğu erişim jetonuyla doğrulanır.
 */
export const config = { runtime: 'edge' }

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://xtqymenxaozzwmqfssod.supabase.co'
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
const ADMIN_EMAIL = 'admin@tercumexpert.com'
const ADMIN_LOCALE = 'tr'
// PDFShift ile HTML→PDF (env: PDFSHIFT_API_KEY). Yoksa/başarısızsa HTML eke düşer.
const PDFSHIFT_KEY = process.env.PDFSHIFT_API_KEY || ''

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
/** UTF-8 güvenli base64 (Edge'de Buffer yok; btoa ham binary ister). */
function toBase64Utf8(str: string): string {
  return bytesToBase64(new TextEncoder().encode(str))
}
function bytesToBase64(bytes: Uint8Array): string {
  let bin = ''
  const chunk = 0x8000
  for (let i = 0; i < bytes.length; i += chunk) {
    bin += String.fromCharCode.apply(null, Array.from(bytes.subarray(i, i + chunk)))
  }
  return btoa(bin)
}

/** HTML'i PDFShift ile gerçek PDF'e çevirir → base64. Anahtar yoksa/hata olursa null. */
async function htmlToPdfBase64(html: string): Promise<string | null> {
  if (!PDFSHIFT_KEY) return null
  try {
    const res = await fetch('https://api.pdfshift.io/v3/convert/pdf', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${btoa(`api:${PDFSHIFT_KEY}`)}`,
      },
      body: JSON.stringify({ source: html, format: 'A4', margin: '0', delay: 400 }),
    })
    if (!res.ok) return null
    return bytesToBase64(new Uint8Array(await res.arrayBuffer()))
  } catch {
    return null
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

/** Faturayı üretir: önce gerçek PDF (PDFShift), olmazsa HTML eke düşer. Best-effort. */
async function invoiceAttachment(
  order: InvoiceOrder,
  locale: string,
  isSellerCopy: boolean,
  suffix: string,
): Promise<EmailAttachment | null> {
  try {
    const html = buildInvoiceHtml({ order, locale, isSellerCopy })
    const base = `${invoiceNumber(order)}${suffix}`
    const pdf = await htmlToPdfBase64(html)
    if (pdf) return { filename: `${base}.pdf`, content: pdf }
    return { filename: `${base}.html`, content: toBase64Utf8(html) } // güvenli yedek
  } catch {
    return null
  }
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

  const cols =
    'order_no,created_at,locale,source_lang,target_lang,total,tax,physical_delivery,contact_name,contact_email,contact_phone,' +
    'delivery_address,delivery_city,delivery_postal_code,delivery_country,user_id'
  const r = await fetch(`${SUPABASE_URL}/rest/v1/orders?id=eq.${orderId}&select=${cols}`, {
    headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}` },
  })
  if (!r.ok) return json({ ok: false, error: 'load' }, 200)
  const ord = ((await r.json()) as Array<InvoiceOrder & { user_id?: string }>)[0]
  if (!ord || ord.user_id !== user.id) return json({ ok: false, error: 'not_found' }, 200)

  const custLocale = ord.locale || 'tr'

  // 1) Müşteriye "sipariş alındı" + müşteri faturası (kendi dilinde).
  let customerOk = false
  try {
    const att = await invoiceAttachment(ord, custLocale, false, '')
    const mail = buildEmail({
      event: 'received',
      locale: custLocale,
      name: ord.contact_name || '',
      orderNo: ord.order_no,
      orderUrl: orderUrl(custLocale, ord.order_no),
      invoiceNote: !!att,
    })
    if (ord.contact_email) {
      const res = await sendEmail(ord.contact_email, mail.subject, mail.html, att ? [att] : [])
      customerOk = res.ok
    }
  } catch {
    /* yut */
  }

  // 2) Admine "yeni sipariş" + detaylar + satıcı faturası (TR).
  let adminOk = false
  try {
    const ex = emailExtra(ADMIN_LOCALE)
    const langs = `${(ord.source_lang || '').toUpperCase()} → ${(ord.target_lang || '').toUpperCase()}`
    const att = await invoiceAttachment(ord, ADMIN_LOCALE, true, '-satici')
    const mail = buildEmail({
      event: 'admin_new_order',
      locale: ADMIN_LOCALE,
      name: '',
      orderNo: ord.order_no,
      orderUrl: orderUrl(ADMIN_LOCALE, ord.order_no),
      // Admin butonu müşteri sipariş sayfasına DEĞİL, tercüme havuzuna gitsin.
      ctaUrl: panelUrl(ADMIN_LOCALE),
      ctaLabel: 'Tercüme Havuzuna Git',
      invoiceNote: !!att,
      details: [
        { label: ex.lblCustomer, value: ord.contact_name || '—' },
        { label: 'E-posta', value: ord.contact_email || '—' },
        { label: 'Telefon', value: ord.contact_phone || '—' },
        { label: ex.lblLangs, value: langs },
        { label: ex.lblTotal, value: money(Number(ord.total) || 0) },
      ],
    })
    const res = await sendEmail(ADMIN_EMAIL, mail.subject, mail.html, att ? [att] : [])
    adminOk = res.ok
  } catch {
    /* yut */
  }

  return json({ ok: true, customer: customerOk, admin: adminOk })
}

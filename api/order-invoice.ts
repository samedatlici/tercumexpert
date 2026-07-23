import chromium from '@sparticuz/chromium'
import puppeteer from 'puppeteer-core'
import { buildInvoiceHtml, invoiceNumber, type InvoiceOrder } from './_invoice'
import { buildEmail, sendEmail, emailExtra, orderUrl, type EmailAttachment } from './_email'

/**
 * Sipariş oluşturulunca çağrılır (istemci createOrder sonrası).
 *  1) Müşteri faturası (müşterinin dilinde) PDF → "Siparişiniz alındı" mailine ek.
 *  2) Satıcı nüshası fatura (admin dilinde=TR) PDF → admin@tercumexpert.com'a
 *     "yeni sipariş aldınız" maili + ek.
 * PDF üretimi best-effort: başarısız olursa mailler eksiz yine de gider.
 * NOT: Node runtime (Edge DEĞİL) — chromium gerektirir.
 */
export const maxDuration = 60

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://xtqymenxaozzwmqfssod.supabase.co'
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
const ADMIN_EMAIL = 'admin@tercumexpert.com'
const ADMIN_LOCALE = 'tr' // admin'in ana dili

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

let _browserPromise: ReturnType<typeof puppeteer.launch> | null = null
async function htmlToPdfBase64(html: string): Promise<string | null> {
  try {
    if (!_browserPromise) {
      _browserPromise = puppeteer.launch({
        args: chromium.args,
        executablePath: await chromium.executablePath(),
        headless: true,
        defaultViewport: { width: 794, height: 1123, deviceScaleFactor: 2 },
      })
    }
    const browser = await _browserPromise
    const page = await browser.newPage()
    await page.setContent(html, { waitUntil: 'networkidle0', timeout: 20000 })
    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '0', right: '0', bottom: '0', left: '0' },
    })
    await page.close()
    return Buffer.from(pdf).toString('base64')
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

  const userId = await getUserId(token)
  if (!userId) return json({ ok: false, error: 'invalid_token' }, 200)

  const cols =
    'order_no,created_at,locale,source_lang,target_lang,total,tax,contact_name,contact_email,contact_phone,delivery_address,delivery_city,delivery_postal_code,delivery_country,user_id'
  const r = await fetch(`${SUPABASE_URL}/rest/v1/orders?id=eq.${orderId}&select=${cols}`, {
    headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}` },
  })
  if (!r.ok) return json({ ok: false, error: 'load' }, 200)
  const order = ((await r.json()) as Array<InvoiceOrder & { user_id?: string }>)[0]
  if (!order || order.user_id !== userId) return json({ ok: false, error: 'not_found' }, 200)

  const custLocale = order.locale || 'tr'
  const total = Number(order.total) || 0
  const langs = `${(order.source_lang || '').toUpperCase()} → ${(order.target_lang || '').toUpperCase()}`

  // 1) Faturaları PDF'e çevir (best-effort).
  const custPdf = await htmlToPdfBase64(buildInvoiceHtml({ order, locale: custLocale, isSellerCopy: false }))
  const sellerPdf = await htmlToPdfBase64(buildInvoiceHtml({ order, locale: ADMIN_LOCALE, isSellerCopy: true }))
  const fileNo = invoiceNumber(order)

  // 2) Müşteri maili (received + fatura eki + "faturanız ektedir").
  const custMail = buildEmail({
    event: 'received',
    locale: custLocale,
    name: order.contact_name || '',
    orderNo: order.order_no,
    orderUrl: orderUrl(custLocale, order.order_no),
    invoiceNote: !!custPdf,
  })
  const custAtt: EmailAttachment[] = custPdf ? [{ filename: `${fileNo}.pdf`, content: custPdf }] : []
  if (order.contact_email) await sendEmail(order.contact_email, custMail.subject, custMail.html, custAtt)

  // 3) Admin maili (yeni sipariş + satıcı faturası eki).
  const ex = emailExtra(ADMIN_LOCALE)
  const adminMail = buildEmail({
    event: 'admin_new_order',
    locale: ADMIN_LOCALE,
    name: '',
    orderNo: order.order_no,
    orderUrl: orderUrl(ADMIN_LOCALE, order.order_no),
    invoiceNote: !!sellerPdf,
    details: [
      { label: ex.lblCustomer, value: order.contact_name || '—' },
      { label: 'E-posta', value: order.contact_email || '—' },
      { label: 'Telefon', value: order.contact_phone || '—' },
      { label: ex.lblLangs, value: langs },
      { label: ex.lblTotal, value: money(total) },
    ],
  })
  const sellerAtt: EmailAttachment[] = sellerPdf ? [{ filename: `${fileNo}-satici.pdf`, content: sellerPdf }] : []
  await sendEmail(ADMIN_EMAIL, adminMail.subject, adminMail.html, sellerAtt)

  return json({ ok: true, invoice: !!custPdf })
}

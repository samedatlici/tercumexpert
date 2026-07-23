import { buildInvoiceHtml, invoiceNumber, type InvoiceOrder } from './_invoice'
import { buildEmail, sendEmail, emailExtra, orderUrl, type EmailAttachment } from './_email'

/**
 * Sipariş oluşunca çağrılır. ÖNCELİK: mailler HER ZAMAN gider.
 *  - Müşteriye "Siparişiniz alındı" (+ varsa fatura PDF eki, kendi dilinde).
 *  - admin@tercumexpert.com'a "Yeni sipariş" (+ varsa satıcı faturası eki, TR).
 * PDF üretimi (chromium) İZOLE ve best-effort: modül yüklenemese/çökse/zaman aşsa bile
 * mailler eksiz gönderilir. chromium/puppeteer ÜST DÜZEYDE import EDİLMEZ (dinamik).
 * Node runtime (Edge değil).
 */
export const maxDuration = 60

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

/** İki faturayı da tek tarayıcıda PDF'e çevirir. Chromium DİNAMİK yüklenir; her hata yutulur. */
async function renderInvoicePdfs(
  htmlCustomer: string,
  htmlSeller: string,
): Promise<{ customer: string | null; seller: string | null }> {
  const empty = { customer: null, seller: null }
  try {
    const chromium = (await import('@sparticuz/chromium')).default
    const puppeteer = (await import('puppeteer-core')).default
    const browser = await puppeteer.launch({
      args: chromium.args,
      executablePath: await chromium.executablePath(),
      headless: true,
      defaultViewport: { width: 794, height: 1123, deviceScaleFactor: 2 },
    })
    try {
      const one = async (html: string): Promise<string | null> => {
        try {
          const page = await browser.newPage()
          await page.setContent(html, { waitUntil: 'networkidle0', timeout: 15000 })
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
      const customer = await one(htmlCustomer)
      const seller = await one(htmlSeller)
      return { customer, seller }
    } finally {
      await browser.close().catch(() => {})
    }
  } catch {
    return empty
  }
}

function withTimeout<T>(p: Promise<T>, ms: number, fallback: T): Promise<T> {
  return Promise.race([p, new Promise<T>((res) => setTimeout(() => res(fallback), ms))])
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
  let order: (InvoiceOrder & { user_id?: string }) | undefined
  try {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/orders?id=eq.${orderId}&select=${cols}`, {
      headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}` },
    })
    if (r.ok) order = ((await r.json()) as Array<InvoiceOrder & { user_id?: string }>)[0]
  } catch {
    /* aşağıda kontrol */
  }
  if (!order || order.user_id !== userId) return json({ ok: false, error: 'not_found' }, 200)

  const custLocale = order.locale || 'tr'
  const total = Number(order.total) || 0
  const langs = `${(order.source_lang || '').toUpperCase()} → ${(order.target_lang || '').toUpperCase()}`
  const fileNo = invoiceNumber(order)

  // 1) PDF üretimi — İZOLE + zaman aşımlı. Başarısızsa mailler eksiz gider.
  let pdfs: { customer: string | null; seller: string | null } = { customer: null, seller: null }
  try {
    const custHtml = buildInvoiceHtml({ order, locale: custLocale, isSellerCopy: false })
    const sellerHtml = buildInvoiceHtml({ order, locale: ADMIN_LOCALE, isSellerCopy: true })
    pdfs = await withTimeout(renderInvoicePdfs(custHtml, sellerHtml), 35000, { customer: null, seller: null })
  } catch {
    pdfs = { customer: null, seller: null }
  }

  // 2) Müşteri maili (HER ZAMAN) — varsa fatura eki.
  try {
    if (order.contact_email) {
      const custMail = buildEmail({
        event: 'received',
        locale: custLocale,
        name: order.contact_name || '',
        orderNo: order.order_no,
        orderUrl: orderUrl(custLocale, order.order_no),
        invoiceNote: !!pdfs.customer,
      })
      const att: EmailAttachment[] = pdfs.customer ? [{ filename: `${fileNo}.pdf`, content: pdfs.customer }] : []
      await sendEmail(order.contact_email, custMail.subject, custMail.html, att)
    }
  } catch {
    /* mail hatası akışı bozmaz */
  }

  // 3) Admin maili (HER ZAMAN) — varsa satıcı faturası eki.
  try {
    const ex = emailExtra(ADMIN_LOCALE)
    const adminMail = buildEmail({
      event: 'admin_new_order',
      locale: ADMIN_LOCALE,
      name: '',
      orderNo: order.order_no,
      orderUrl: orderUrl(ADMIN_LOCALE, order.order_no),
      invoiceNote: !!pdfs.seller,
      details: [
        { label: ex.lblCustomer, value: order.contact_name || '—' },
        { label: 'E-posta', value: order.contact_email || '—' },
        { label: 'Telefon', value: order.contact_phone || '—' },
        { label: ex.lblLangs, value: langs },
        { label: ex.lblTotal, value: money(total) },
      ],
    })
    const att: EmailAttachment[] = pdfs.seller ? [{ filename: `${fileNo}-satici.pdf`, content: pdfs.seller }] : []
    await sendEmail(ADMIN_EMAIL, adminMail.subject, adminMail.html, att)
  } catch {
    /* mail hatası akışı bozmaz */
  }

  return json({ ok: true, invoice: !!pdfs.customer })
}

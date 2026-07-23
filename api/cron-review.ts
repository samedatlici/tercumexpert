import { sendOrderEmail, GOOGLE_REVIEW_URL } from './_email'

/**
 * Günlük zamanlanmış görev (Vercel Cron): teslimden 10 gün sonra müşteriye
 * "hizmetimizden memnun kaldınız mı? Bizi değerlendirin" (Google) maili gönderir.
 * Her sipariş için YALNIZCA BİR KEZ (orders.review_email_sent bayrağı).
 * GOOGLE_REVIEW_URL boşsa mail atılmaz ve bayrak işaretlenmez (link eklenince gönderilir).
 *
 * Güvenlik: CRON_SECRET tanımlıysa Vercel'in gönderdiği Bearer ile eşleşmeli;
 * tanımlı değilse yalnızca Vercel Cron user-agent'ı kabul edilir.
 */
export const config = { runtime: 'edge' }

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://xtqymenxaozzwmqfssod.supabase.co'
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
const CRON_SECRET = process.env.CRON_SECRET || ''
const TEN_DAYS_MS = 10 * 24 * 60 * 60 * 1000

function json(obj: unknown, status = 200): Response {
  return new Response(JSON.stringify(obj), { status, headers: { 'content-type': 'application/json' } })
}
function svc(extra?: Record<string, string>): Record<string, string> {
  return { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}`, ...(extra ?? {}) }
}

export default async function handler(req: Request): Promise<Response> {
  if (!SERVICE_KEY) return json({ ok: false, error: 'server_config' }, 200)

  // Yetki: CRON_SECRET varsa onunla; yoksa Vercel Cron user-agent'ı.
  const auth = req.headers.get('authorization') || ''
  const ua = req.headers.get('user-agent') || ''
  const allowed = CRON_SECRET ? auth === `Bearer ${CRON_SECRET}` : /vercel-cron/i.test(ua)
  if (!allowed) return json({ ok: false, error: 'forbidden' }, 403)

  if (!GOOGLE_REVIEW_URL) return json({ ok: true, skipped: true, reason: 'no_review_url', sent: 0 }, 200)

  const cutoff = new Date(Date.now() - TEN_DAYS_MS).toISOString()
  const url =
    `${SUPABASE_URL}/rest/v1/orders?work_status=eq.completed&review_email_sent=eq.false` +
    `&completed_at=lte.${cutoff}&contact_email=not.is.null` +
    `&select=id,order_no,contact_name,contact_email,locale&order=completed_at.asc&limit=50`
  const r = await fetch(url, { headers: svc() })
  if (!r.ok) return json({ ok: false, error: 'load' }, 200)
  const rows = (await r.json()) as Array<{ id: string; order_no: number; contact_name: string | null; contact_email: string | null; locale: string | null }>

  let sent = 0
  for (const ord of rows) {
    const res = await sendOrderEmail('review', ord as Parameters<typeof sendOrderEmail>[1])
    if (res.ok) {
      // Yalnızca gerçekten gönderilince işaretle (aksi halde bir sonraki turda tekrar denenir).
      await fetch(`${SUPABASE_URL}/rest/v1/orders?id=eq.${ord.id}`, {
        method: 'PATCH',
        headers: svc({ 'Content-Type': 'application/json', Prefer: 'return=minimal' }),
        body: JSON.stringify({ review_email_sent: true }),
      })
      sent++
    }
  }
  return json({ ok: true, sent, scanned: rows.length }, 200)
}

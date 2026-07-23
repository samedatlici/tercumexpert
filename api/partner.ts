import { buildPartnerVerify, sendEmail } from './_email'

/**
 * Partner (İş Ortağı) SUNUCU uç noktası (Edge). GÜVENLİK: hassas alanlar (status,
 * iban_verified, email_verified) ve referral atıfları yalnızca burada (service role)
 * değişir. Her istek çağıranın Supabase erişim jetonuyla doğrulanır.
 *
 * Faz 1 eylemleri:
 *  - attribute      : davet koduyla gelen YENİ üyeyi partnere bağlar (kalıcı, ilk üyelikte).
 *  - emailSendCode  : partner e-postasına markalı doğrulama kodu gönderir.
 *  - emailVerify    : kodu doğrular → partners.email_verified = true.
 */
export const config = { runtime: 'edge' }

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://xtqymenxaozzwmqfssod.supabase.co'
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
const CODE_TTL_MS = 15 * 60 * 1000

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
interface PartnerRow {
  id: string
  user_id: string
  email: string | null
  contact_name: string | null
  status: string
}
async function getPartner(userId: string): Promise<PartnerRow | null> {
  const r = await fetch(
    `${SUPABASE_URL}/rest/v1/partners?user_id=eq.${userId}&select=id,user_id,email,contact_name,status`,
    { headers: svcHeaders() },
  )
  if (!r.ok) return null
  const rows = (await r.json()) as PartnerRow[]
  return rows[0] ?? null
}
function gen6(): string {
  return String(Math.floor(100000 + Math.random() * 900000))
}

export default async function handler(req: Request): Promise<Response> {
  if (req.method !== 'POST') return json({ error: 'method' }, 405)
  if (!SERVICE_KEY) return json({ error: 'server_config' }, 200)

  const token = (req.headers.get('authorization') || '').replace(/^Bearer\s+/i, '').trim()
  if (!token) return json({ error: 'auth' }, 401)
  const user = await getUser(token)
  if (!user) return json({ error: 'auth' }, 401)

  let body: { action?: string; ref?: string; email?: string; code?: string; locale?: string }
  try {
    body = await req.json()
  } catch {
    return json({ error: 'bad_json' }, 400)
  }
  const action = body.action

  // ---------- Referral atıfı (davet koduyla gelen üye → partner) ----------
  if (action === 'attribute') {
    const ref = String(body.ref || '').trim().toUpperCase()
    if (!ref) return json({ ok: false, reason: 'invalid' })
    // Kod onaylı bir partnere mi ait?
    const pr = await fetch(
      `${SUPABASE_URL}/rest/v1/partners?ref_code=eq.${encodeURIComponent(ref)}&status=eq.approved&select=id,user_id`,
      { headers: svcHeaders() },
    )
    if (!pr.ok) return json({ ok: false, reason: 'invalid' })
    const partner = ((await pr.json()) as Array<{ id: string; user_id: string }>)[0]
    if (!partner) return json({ ok: false, reason: 'invalid' })
    if (partner.user_id === user.id) return json({ ok: false, reason: 'self' })
    // Zaten atanmış mı? (ilk üyelik kalıcı)
    const ex = await fetch(
      `${SUPABASE_URL}/rest/v1/partner_referrals?user_id=eq.${user.id}&select=user_id`,
      { headers: svcHeaders() },
    )
    if (ex.ok && ((await ex.json()) as unknown[]).length) return json({ ok: true, already: true })
    // Atıfı ekle (çakışmayı yok say → idempotent).
    await fetch(`${SUPABASE_URL}/rest/v1/partner_referrals`, {
      method: 'POST',
      headers: svcHeaders({ 'content-type': 'application/json', Prefer: 'resolution=ignore-duplicates' }),
      body: JSON.stringify({ user_id: user.id, partner_id: partner.id }),
    })
    return json({ ok: true })
  }

  // ---------- E-posta doğrulama kodu gönder ----------
  if (action === 'emailSendCode') {
    const partner = await getPartner(user.id)
    if (!partner) return json({ error: 'no_partner' }, 404)
    const target = (String(body.email || '').trim() || partner.email || user.email || '').trim()
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(target)) return json({ ok: false, reason: 'email' })
    const code = gen6()
    const expires = new Date(Date.now() + CODE_TTL_MS).toISOString()
    // upsert (user_id PK) → tek aktif kod.
    const up = await fetch(`${SUPABASE_URL}/rest/v1/partner_email_codes`, {
      method: 'POST',
      headers: svcHeaders({ 'content-type': 'application/json', Prefer: 'resolution=merge-duplicates' }),
      body: JSON.stringify({ user_id: user.id, code, email: target, expires_at: expires }),
    })
    if (!up.ok) return json({ ok: false, reason: 'store' })
    const mail = buildPartnerVerify(body.locale || 'tr', partner.contact_name || '', code)
    await sendEmail(target, mail.subject, mail.html)
    return json({ ok: true })
  }

  // ---------- E-posta doğrulama kodunu onayla ----------
  if (action === 'emailVerify') {
    const code = String(body.code || '').trim()
    if (!code) return json({ ok: false, reason: 'code' })
    const r = await fetch(
      `${SUPABASE_URL}/rest/v1/partner_email_codes?user_id=eq.${user.id}&select=code,email,expires_at`,
      { headers: svcHeaders() },
    )
    if (!r.ok) return json({ ok: false, reason: 'store' })
    const row = ((await r.json()) as Array<{ code: string; email: string; expires_at: string }>)[0]
    if (!row) return json({ ok: false, reason: 'expired' })
    if (new Date(row.expires_at).getTime() < Date.now()) return json({ ok: false, reason: 'expired' })
    if (row.code !== code) return json({ ok: false, reason: 'mismatch' })
    // Doğrulandı → email_verified=true (service role → koruma tetikleyicisi izin verir).
    const patch = await fetch(`${SUPABASE_URL}/rest/v1/partners?user_id=eq.${user.id}`, {
      method: 'PATCH',
      headers: svcHeaders({ 'content-type': 'application/json', Prefer: 'return=minimal' }),
      body: JSON.stringify({ email_verified: true, email: row.email }),
    })
    if (!patch.ok) return json({ ok: false, reason: 'update' })
    await fetch(`${SUPABASE_URL}/rest/v1/partner_email_codes?user_id=eq.${user.id}`, {
      method: 'DELETE',
      headers: svcHeaders(),
    })
    return json({ ok: true })
  }

  return json({ error: 'unknown_action' }, 400)
}

/**
 * SMS telefon doğrulama uç noktası (EDGE).
 *   POST { action: 'send',   phone }         → telefona 6 haneli kod gönderir.
 *   POST { action: 'verify', phone, code }   → kodu doğrular; başarılıysa
 *                                              verified_phones'a (user_id, phone) yazar.
 * Kimlik: Authorization: Bearer <access_token> (giriş yapan kullanıcı).
 * Güvenlik: kod hash'lenerek saklanır, 5 dk geçerli, en çok 5 deneme, 60 sn tekrar-gönderim kilidi.
 * Sağlayıcı env ile seçilir (bkz. api/_sms.ts). SMS_DEV_MODE=1 → kod yanıt içinde döner (test).
 */
export const config = { runtime: 'edge' }

import {
  sendSms, genCode, hashCode, e164, smsText, smsConfigured, isDevMode,
  isTwilioVerify, twilioVerifyStart, twilioVerifyCheck,
} from './_sms'

const SUPABASE_URL = (process.env.SUPABASE_URL || 'https://xtqymenxaozzwmqfssod.supabase.co').replace(/\/+$/, '')
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
const CODE_TTL_MS = 5 * 60 * 1000
const RESEND_LOCK_MS = 60 * 1000
const MAX_ATTEMPTS = 5

function json(obj: unknown, status = 200): Response {
  return new Response(JSON.stringify(obj), { status, headers: { 'content-type': 'application/json' } })
}
function svcHeaders(extra?: Record<string, string>): Record<string, string> {
  return { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}`, 'content-type': 'application/json', ...(extra || {}) }
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
const phoneOk = (p: string) => /\d{6,}/.test((p || '').replace(/\D/g, ''))

interface OtpRow {
  user_id: string
  phone: string
  code_hash: string
  expires_at: string
  attempts: number
  sent_at: string
}

async function getOtp(userId: string): Promise<OtpRow | null> {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/sms_otps?user_id=eq.${userId}&select=*`, { headers: svcHeaders() })
  if (!r.ok) return null
  const rows = (await r.json()) as OtpRow[]
  return rows[0] ?? null
}

export default async function handler(req: Request): Promise<Response> {
  if (req.method !== 'POST') return json({ error: 'method' }, 405)
  if (!SERVICE_KEY) return json({ error: 'server_config' }, 200)

  const token = (req.headers.get('authorization') || '').replace(/^Bearer\s+/i, '').trim()
  if (!token) return json({ error: 'unauthorized' }, 401)
  const userId = await getUserId(token)
  if (!userId) return json({ error: 'unauthorized' }, 401)

  let body: { action?: string; phone?: string; code?: string; locale?: string }
  try {
    body = await req.json()
  } catch {
    return json({ error: 'bad_json' }, 400)
  }
  const action = body.action
  const phone = String(body.phone ?? '').trim()
  const locale = typeof body.locale === 'string' ? body.locale : 'en'
  if (!phoneOk(phone)) return json({ error: 'bad_phone' }, 200)
  // Twilio Verify modu: kodu ve dilini Twilio yönetir (dev modda yerel akış kullanılır).
  const useVerify = isTwilioVerify() && !isDevMode()

  async function markVerified(): Promise<void> {
    await fetch(`${SUPABASE_URL}/rest/v1/verified_phones`, {
      method: 'POST',
      headers: svcHeaders({ Prefer: 'resolution=merge-duplicates' }),
      body: JSON.stringify({ user_id: userId, phone }),
    })
  }

  // ——— KOD GÖNDER ———
  if (action === 'send') {
    if (!smsConfigured()) return json({ error: 'not_configured' }, 200)

    if (useVerify) {
      // Twilio Verify: tekrar-gönderim/oran sınırlaması Twilio tarafında yönetilir.
      const r = await twilioVerifyStart(e164(phone), locale)
      if (!r.ok) return json({ error: 'send_failed' }, 200)
      return json({ ok: true })
    }

    const now = Date.now()
    const existing = await getOtp(userId)
    if (existing && now - new Date(existing.sent_at).getTime() < RESEND_LOCK_MS) {
      return json({ error: 'rate_limited' }, 200)
    }
    const code = genCode()
    const codeHash = await hashCode(code, SERVICE_KEY)
    const expiresAt = new Date(now + CODE_TTL_MS).toISOString()
    const nowIso = new Date(now).toISOString()
    // Upsert (PK user_id): tek aktif kod.
    const up = await fetch(`${SUPABASE_URL}/rest/v1/sms_otps`, {
      method: 'POST',
      headers: svcHeaders({ Prefer: 'resolution=merge-duplicates' }),
      body: JSON.stringify({ user_id: userId, phone, code_hash: codeHash, expires_at: expiresAt, attempts: 0, sent_at: nowIso }),
    })
    if (!up.ok) return json({ error: 'store_failed' }, 200)

    if (isDevMode()) return json({ ok: true, dev: true, code }) // TEST: kodu ekranda göster
    const r = await sendSms(e164(phone), smsText(code, locale))
    if (!r.ok) return json({ error: 'send_failed' }, 200)
    return json({ ok: true })
  }

  // ——— KODU DOĞRULA ———
  if (action === 'verify') {
    const code = String(body.code ?? '').replace(/\D/g, '')
    if (code.length < 6) return json({ error: 'otp_invalid' }, 200)

    if (useVerify) {
      const r = await twilioVerifyCheck(e164(phone), code)
      if (!r.ok || !r.approved) return json({ error: 'otp_invalid' }, 200)
      await markVerified()
      return json({ ok: true, verified: true })
    }

    const row = await getOtp(userId)
    if (!row || row.phone !== phone) return json({ error: 'otp_invalid' }, 200)
    if (Date.now() > new Date(row.expires_at).getTime()) return json({ error: 'otp_expired' }, 200)
    if (row.attempts >= MAX_ATTEMPTS) return json({ error: 'otp_invalid' }, 200)

    const codeHash = await hashCode(code, SERVICE_KEY)
    if (codeHash !== row.code_hash) {
      // Deneme sayacını artır.
      await fetch(`${SUPABASE_URL}/rest/v1/sms_otps?user_id=eq.${userId}`, {
        method: 'PATCH',
        headers: svcHeaders(),
        body: JSON.stringify({ attempts: row.attempts + 1 }),
      })
      return json({ error: 'otp_invalid' }, 200)
    }
    // Başarılı → doğrulanmış telefonu yaz, OTP'yi sil.
    await markVerified()
    await fetch(`${SUPABASE_URL}/rest/v1/sms_otps?user_id=eq.${userId}`, { method: 'DELETE', headers: svcHeaders() })
    return json({ ok: true, verified: true })
  }

  return json({ error: 'bad_action' }, 400)
}

// =====================================================================
// TercümExpert — SMS gönderim modülü (Edge için KENDİ KENDİNE YETEN).
// Sağlayıcı SMS_PROVIDER ile seçilir:
//   twilio-verify : Twilio Verify (ÖNERİLEN — global, ana dilde OTP, uyumluluk Twilio'da)
//   twilio        : Twilio Messages (kendi kodumuz + kendi metnimiz)
//   vonage        : Vonage/Nexmo (global)
//   netgsm        : Netgsm (ağırlıklı Türkiye)
// Test için SMS_DEV_MODE=1 → gerçek SMS gönderilmez, kod ekranda gösterilir.
//
// ORTAM DEĞİŞKENLERİ (Vercel → Settings → Environment Variables):
//   SMS_PROVIDER, SMS_DEV_MODE (opsiyonel)
//   twilio-verify : TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_VERIFY_SERVICE_SID
//   twilio        : TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM
//   vonage        : VONAGE_API_KEY, VONAGE_API_SECRET, VONAGE_FROM
//   netgsm        : NETGSM_USERCODE, NETGSM_PASSWORD, NETGSM_HEADER
// =====================================================================

const PROVIDER = (process.env.SMS_PROVIDER || '').toLowerCase()

export interface SmsResult {
  ok: boolean
  error?: string
}

export function isDevMode(): boolean {
  return process.env.SMS_DEV_MODE === '1'
}
export function isTwilioVerify(): boolean {
  return PROVIDER === 'twilio-verify'
}

/** Sağlayıcı (veya test modu) yapılandırılmış mı? */
export function smsConfigured(): boolean {
  if (isDevMode()) return true
  if (PROVIDER === 'twilio-verify')
    return !!(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_VERIFY_SERVICE_SID)
  if (PROVIDER === 'twilio')
    return !!(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_FROM)
  if (PROVIDER === 'vonage')
    return !!(process.env.VONAGE_API_KEY && process.env.VONAGE_API_SECRET && process.env.VONAGE_FROM)
  if (PROVIDER === 'netgsm')
    return !!(process.env.NETGSM_USERCODE && process.env.NETGSM_PASSWORD && process.env.NETGSM_HEADER)
  return false
}

/** "+90 5xx xxx xx xx" → "+905xxxxxxxxx" (E.164). */
export function e164(phone: string): string {
  const p = (phone || '').replace(/[^\d+]/g, '')
  return p.startsWith('+') ? p : '+' + p
}

/** 6 haneli güvenli kod. */
export function genCode(): string {
  const arr = new Uint32Array(1)
  crypto.getRandomValues(arr)
  return String(arr[0] % 1000000).padStart(6, '0')
}

/** Kodu tuzlayıp SHA-256 ile özetler (düz kod DB'ye yazılmaz). */
export async function hashCode(code: string, salt: string): Promise<string> {
  const data = new TextEncoder().encode(`${salt}:${code}`)
  const buf = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

// ——— 14 dilde SMS metni (kendi-kod gönderen sağlayıcılar için; Twilio Verify kendi metnini üretir) ———
const SMS_TEXT: Record<string, string> = {
  tr: 'TercümExpert doğrulama kodunuz: {code} (5 dakika geçerli).',
  en: 'Your TercümExpert verification code: {code} (valid 5 min).',
  fr: 'Votre code de vérification TercümExpert : {code} (valable 5 min).',
  de: 'Ihr TercümExpert-Bestätigungscode: {code} (5 Min. gültig).',
  nl: 'Uw TercümExpert-verificatiecode: {code} (5 min geldig).',
  es: 'Su código de verificación TercümExpert: {code} (válido 5 min).',
  ar: 'رمز التحقق TercümExpert الخاص بك: {code} (صالح 5 دقائق).',
  ru: 'Ваш код подтверждения TercümExpert: {code} (действует 5 мин).',
  az: 'TercümExpert təsdiq kodunuz: {code} (5 dəqiqə etibarlı).',
  pl: 'Twój kod weryfikacyjny TercümExpert: {code} (ważny 5 min).',
  bg: 'Вашият код за потвърждение TercümExpert: {code} (валиден 5 мин).',
  pt: 'O seu código de verificação TercümExpert: {code} (válido 5 min).',
  da: 'Din TercümExpert-bekræftelseskode: {code} (gyldig 5 min).',
  it: 'Il tuo codice di verifica TercümExpert: {code} (valido 5 min).',
}
export function smsText(code: string, locale: string): string {
  const tpl = SMS_TEXT[(locale || '').toLowerCase()] ?? SMS_TEXT.en
  return tpl.replace('{code}', code)
}

// Twilio Verify desteklenen locale eşlemesi (desteklenmeyen → en).
const VERIFY_LOCALE: Record<string, string> = {
  tr: 'tr', en: 'en', fr: 'fr', de: 'de', nl: 'nl', es: 'es', ar: 'ar',
  ru: 'ru', az: 'en', pl: 'pl', bg: 'en', pt: 'pt', da: 'da', it: 'it',
}
export function verifyLocale(locale: string): string {
  return VERIFY_LOCALE[(locale || '').toLowerCase()] ?? 'en'
}

// ——— Twilio Verify (ÖNERİLEN — global OTP; kodu ve dilini Twilio yönetir) ———
export async function twilioVerifyStart(phone: string, locale: string): Promise<SmsResult> {
  const sid = process.env.TWILIO_ACCOUNT_SID || ''
  const token = process.env.TWILIO_AUTH_TOKEN || ''
  const svc = process.env.TWILIO_VERIFY_SERVICE_SID || ''
  const auth = btoa(`${sid}:${token}`)
  const body = new URLSearchParams({ To: phone, Channel: 'sms', Locale: verifyLocale(locale) })
  const res = await fetch(`https://verify.twilio.com/v2/Services/${svc}/Verifications`, {
    method: 'POST',
    headers: { Authorization: `Basic ${auth}`, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  })
  return { ok: res.ok }
}
export async function twilioVerifyCheck(phone: string, code: string): Promise<{ ok: boolean; approved: boolean }> {
  const sid = process.env.TWILIO_ACCOUNT_SID || ''
  const token = process.env.TWILIO_AUTH_TOKEN || ''
  const svc = process.env.TWILIO_VERIFY_SERVICE_SID || ''
  const auth = btoa(`${sid}:${token}`)
  const body = new URLSearchParams({ To: phone, Code: code })
  const res = await fetch(`https://verify.twilio.com/v2/Services/${svc}/VerificationCheck`, {
    method: 'POST',
    headers: { Authorization: `Basic ${auth}`, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  })
  if (!res.ok) return { ok: false, approved: false }
  const d = (await res.json()) as { status?: string }
  return { ok: true, approved: d.status === 'approved' }
}

/** Kendi kodumuzu gönderen sağlayıcılar (twilio/vonage/netgsm). Dev modda gerçek gönderim yok. */
export async function sendSms(to: string, text: string): Promise<SmsResult> {
  if (isDevMode()) return { ok: true }
  try {
    if (PROVIDER === 'netgsm') return await sendNetgsm(to, text)
    if (PROVIDER === 'twilio') return await sendTwilio(to, text)
    if (PROVIDER === 'vonage') return await sendVonage(to, text)
    return { ok: false, error: 'no_provider' }
  } catch {
    return { ok: false, error: 'send_failed' }
  }
}

// ——— Netgsm (REST v2 JSON) ———
async function sendNetgsm(to: string, text: string): Promise<SmsResult> {
  const usercode = process.env.NETGSM_USERCODE || ''
  const password = process.env.NETGSM_PASSWORD || ''
  const header = process.env.NETGSM_HEADER || ''
  const auth = btoa(`${usercode}:${password}`)
  const res = await fetch('https://api.netgsm.com.tr/sms/rest/v2/send', {
    method: 'POST',
    headers: { Authorization: `Basic ${auth}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ msgheader: header, encoding: 'TR', messages: [{ msg: text, no: to.replace(/^\+/, '') }] }),
  })
  return { ok: res.ok }
}

// ——— Twilio (Messages API) ———
async function sendTwilio(to: string, text: string): Promise<SmsResult> {
  const sid = process.env.TWILIO_ACCOUNT_SID || ''
  const token = process.env.TWILIO_AUTH_TOKEN || ''
  const from = process.env.TWILIO_FROM || ''
  const auth = btoa(`${sid}:${token}`)
  const body = new URLSearchParams({ To: to, From: from, Body: text })
  const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
    method: 'POST',
    headers: { Authorization: `Basic ${auth}`, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  })
  return { ok: res.ok }
}

// ——— Vonage (SMS API) ———
async function sendVonage(to: string, text: string): Promise<SmsResult> {
  const key = process.env.VONAGE_API_KEY || ''
  const secret = process.env.VONAGE_API_SECRET || ''
  const from = process.env.VONAGE_FROM || ''
  const body = new URLSearchParams({ api_key: key, api_secret: secret, to: to.replace(/^\+/, ''), from, text })
  const res = await fetch('https://rest.nexmo.com/sms/json', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  })
  if (!res.ok) return { ok: false }
  const d = (await res.json()) as { messages?: Array<{ status?: string }> }
  return { ok: !!d.messages && d.messages[0]?.status === '0' }
}

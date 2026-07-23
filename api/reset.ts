/**
 * Şifre sıfırlama e-postası (EDGE). Supabase admin generate_link (recovery) ile
 * tek kullanımlık bir bağlantı üretir ve TercümExpert kurumsal şablonuyla, kullanıcının
 * dilinde, noreply adresinden gönderir. "Merhaba (isim)," ile başlar.
 *
 * GÜVENLİK: E-postanın kayıtlı olup olmadığını SIZDIRMAMAK için her durumda { ok: true }
 * döner (kullanıcı yoksa da). Böylece hesap keşfi (account enumeration) engellenir.
 *
 * GEREKLİ ORTAM DEĞİŞKENLERİ:
 *   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY  : admin generate_link için.
 *   RESEND_API_KEY, EMAIL_FROM, PUBLIC_SITE_URL : _email.ts üzerinden mail gönderimi.
 */
export const config = { runtime: 'edge' }

import { buildEmail, sendEmail } from './_email'

const SUPABASE_URL = (process.env.SUPABASE_URL || 'https://xtqymenxaozzwmqfssod.supabase.co').replace(/\/+$/, '')
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

function json(obj: unknown, status = 200): Response {
  return new Response(JSON.stringify(obj), { status, headers: { 'content-type': 'application/json' } })
}
const emailOk = (v: string) => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v)

export default async function handler(req: Request): Promise<Response> {
  if (req.method !== 'POST') return json({ error: 'method' }, 405)

  let body: { email?: unknown; locale?: unknown; redirectTo?: unknown }
  try {
    body = await req.json()
  } catch {
    return json({ ok: true }) // sessizce başarı gibi davran (enumeration önleme)
  }

  const email = String(body.email ?? '').trim().toLowerCase()
  const clientLocale = typeof body.locale === 'string' ? body.locale : 'tr'
  const redirectTo = typeof body.redirectTo === 'string' ? body.redirectTo : ''

  // Geçersiz e-posta veya eksik yapılandırma → yine ok döneriz (bilgi sızdırma yok).
  if (!email || !emailOk(email) || !SERVICE_KEY) return json({ ok: true })

  try {
    // 1) Tek kullanımlık recovery bağlantısı üret.
    const genRes = await fetch(`${SUPABASE_URL}/auth/v1/admin/generate_link`, {
      method: 'POST',
      headers: {
        apikey: SERVICE_KEY,
        Authorization: `Bearer ${SERVICE_KEY}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        type: 'recovery',
        email,
        ...(redirectTo ? { options: { redirect_to: redirectTo } } : {}),
      }),
    })

    // Kullanıcı yoksa / hata olursa: sessizce ok (mail göndermeyiz ama bilgi sızdırmayız).
    if (!genRes.ok) return json({ ok: true })

    const data = (await genRes.json()) as Record<string, any>
    const link: string =
      (typeof data.action_link === 'string' && data.action_link) ||
      (data.properties && typeof data.properties.action_link === 'string' && data.properties.action_link) ||
      ''
    if (!link) return json({ ok: true })

    // 2) İsim + dil: kullanıcı meta verisinden al (yoksa istemci dilini kullan).
    const meta: Record<string, any> =
      (data.user_metadata as Record<string, any>) ||
      (data.user && (data.user.user_metadata as Record<string, any>)) ||
      {}
    const firstName: string =
      (typeof meta.first_name === 'string' && meta.first_name) ||
      (typeof meta.full_name === 'string' && meta.full_name.trim().split(/\s+/)[0]) ||
      ''
    const locale = typeof meta.locale === 'string' && meta.locale ? meta.locale : clientLocale

    // 3) Markalı e-postayı oluştur ve gönder.
    const { subject, html } = buildEmail({
      event: 'password_reset',
      locale,
      name: firstName,
      orderNo: '',
      orderUrl: '',
      ctaUrl: link,
    })
    await sendEmail(email, subject, html)
  } catch {
    // yut — güvenlik gereği yine ok döneriz
  }

  return json({ ok: true })
}

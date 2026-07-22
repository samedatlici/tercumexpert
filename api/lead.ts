/** Müşteri iletişim talebi (lead) kaydı — Vercel Edge Function, service role ile. */
export const config = { runtime: 'edge' }

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://xtqymenxaozzwmqfssod.supabase.co'

function json(obj: unknown, status: number): Response {
  return new Response(JSON.stringify(obj), { status, headers: { 'content-type': 'application/json' } })
}

export default async function handler(req: Request): Promise<Response> {
  if (req.method !== 'POST') return json({ error: 'method' }, 405)

  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!key) return json({ ok: false, error: 'no_key' }, 200)

  let body: {
    conversationId?: unknown
    name?: unknown
    email?: unknown
    phone?: unknown
    message?: unknown
    locale?: unknown
    wantsContact?: unknown
  }
  try {
    body = await req.json()
  } catch {
    return json({ error: 'bad_json' }, 400)
  }

  const id = typeof body.conversationId === 'string' ? body.conversationId : ''
  const name = typeof body.name === 'string' ? body.name.slice(0, 120) : null
  const email = typeof body.email === 'string' ? body.email.slice(0, 160) : null
  const phone = typeof body.phone === 'string' ? body.phone.slice(0, 60) : null
  const message = typeof body.message === 'string' ? body.message.slice(0, 2000) : null
  const locale = typeof body.locale === 'string' ? body.locale : 'tr'
  // Onboarding kimlik kaydında false gelir; açık "iletişim talebi"nde true (varsayılan).
  const wantsContact = body.wantsContact === false ? false : true

  if (!id || (!email && !phone)) return json({ ok: false, error: 'invalid' }, 400)

  try {
    const resp = await fetch(`${SUPABASE_URL}/rest/v1/chat_conversations?on_conflict=id`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: key,
        Authorization: `Bearer ${key}`,
        Prefer: 'resolution=merge-duplicates,return=minimal',
      },
      body: JSON.stringify({
        id,
        locale,
        wants_contact: wantsContact,
        lead_name: name,
        lead_email: email,
        lead_phone: phone,
        lead_message: message,
        updated_at: new Date().toISOString(),
      }),
    })
    if (!resp.ok) {
      const detail = await resp.text()
      return json({ ok: false, error: 'upstream', detail: detail.slice(0, 200) }, 200)
    }
    return json({ ok: true }, 200)
  } catch {
    return json({ ok: false, error: 'exception' }, 200)
  }
}

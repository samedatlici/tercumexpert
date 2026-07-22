import { FAQ_ITEMS, type FaqItem } from '../src/content/faq-data'
import { COMPANY_FACTS, CUSTOM_QA } from './_knowledge'

/** Vercel Edge Function — hızlı, ucuz, Node bağımlılığı yok. */
export const config = { runtime: 'edge' }

const LANG_NAMES: Record<string, string> = {
  tr: 'Turkish', en: 'English', de: 'German', fr: 'French', es: 'Spanish',
  it: 'Italian', nl: 'Dutch', ru: 'Russian', az: 'Azerbaijani', pl: 'Polish',
  bg: 'Bulgarian', pt: 'Portuguese', da: 'Danish', ar: 'Arabic',
}

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://xtqymenxaozzwmqfssod.supabase.co'

/** Sohbeti Supabase'e (service role ile) kaydeder. Hata olsa da yanıtı etkilemez. */
async function logConversation(id: string, locale: string, messages: InMsg[]): Promise<void> {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!key || !id) return
  try {
    await fetch(`${SUPABASE_URL}/rest/v1/chat_conversations?on_conflict=id`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: key,
        Authorization: `Bearer ${key}`,
        Prefer: 'resolution=merge-duplicates,return=minimal',
      },
      body: JSON.stringify({ id, locale, messages, updated_at: new Date().toISOString() }),
    })
  } catch {
    /* kayıt başarısız olsa da sohbet yanıtı verilmeye devam eder */
  }
}

function norm(s: string): string {
  return s.toLowerCase()
}

/** Kullanıcı sorusuna göre SSS'den anahtar-kelime eşleşen maddeleri getirir. */
function retrieve(query: string, k: number): FaqItem[] {
  const words = norm(query).split(/[^\p{L}\p{N}]+/u).filter((w) => w.length > 2)
  if (words.length === 0) return []
  return FAQ_ITEMS.map((item) => {
    const hay = norm(item.q + ' ' + item.keywords.join(' '))
    let score = 0
    for (const w of words) if (hay.includes(w)) score++
    return { item, score }
  })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score || a.item.priority - b.item.priority)
    .slice(0, k)
    .map((x) => x.item)
}

/** Bilgi tabanı: kurumsal gerçekler + özel Q&A + (öncelikli SSS ∪ soruya özel SSS). */
function buildKnowledge(query: string): string {
  const core = [...FAQ_ITEMS].sort((a, b) => a.priority - b.priority).slice(0, 45)
  const extra = retrieve(query, 8).filter((e) => !core.some((c) => c.id === e.id))
  const faqText = [...core, ...extra].map((i) => `S: ${i.q}\nC: ${i.a}`).join('\n\n')
  const customText = CUSTOM_QA.map((q) => `S: ${q.q}\nC: ${q.a}`).join('\n\n')
  return `${COMPANY_FACTS}\n\n=== ÖZEL SORU-CEVAPLAR ===\n${customText}\n\n=== SIK SORULAN SORULAR (SSS) ===\n${faqText}`
}

function json(obj: unknown, status: number): Response {
  return new Response(JSON.stringify(obj), { status, headers: { 'content-type': 'application/json' } })
}

interface InMsg { role: 'user' | 'assistant'; content: string }

export default async function handler(req: Request): Promise<Response> {
  if (req.method !== 'POST') return json({ error: 'method' }, 405)

  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) return json({ reply: null, error: 'no_key' }, 200)

  let body: { messages?: unknown; locale?: unknown; conversationId?: unknown }
  try {
    body = await req.json()
  } catch {
    return json({ error: 'bad_json' }, 400)
  }

  const locale = typeof body.locale === 'string' ? body.locale : 'tr'
  const conversationId = typeof body.conversationId === 'string' ? body.conversationId : ''
  const incoming = Array.isArray(body.messages) ? body.messages : []
  const history: InMsg[] = incoming
    .filter(
      (m): m is InMsg =>
        !!m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string',
    )
    .slice(-8)
    .map((m) => ({ role: m.role, content: m.content.slice(0, 2000) }))

  if (history.length === 0) return json({ error: 'no_messages' }, 400)

  const lastUser = [...history].reverse().find((m) => m.role === 'user')?.content ?? ''
  const langName = LANG_NAMES[locale] ?? 'Turkish'
  const knowledge = buildKnowledge(lastUser)

  const system = `You are the customer-support assistant for "TercümExpert", a professional translation company (sworn, notarized, apostille and corporate translation). Speak in the brand's warm, professional, corporate tone.

HOW TO RESPOND:
- Be genuinely helpful and conversational, like a knowledgeable representative. Greet back, make light small talk when appropriate, and answer naturally.
- Use the KNOWLEDGE below (company facts, custom Q&A, FAQ) as your PRIMARY source. You may also answer general, reasonable questions about translation, languages, documents and the sector using common knowledge — as long as you do NOT invent company-specific facts (exact prices, deadlines, guarantees, office/staff details).
- For greetings, thanks, small talk, or general questions you can reasonably answer: just respond helpfully and naturally. Do NOT push WhatsApp or "contact a representative" for these.
- Suggest contacting a human (WhatsApp) ONLY when the question is highly specific/technical and its answer is genuinely NOT available in the KNOWLEDGE and cannot be reasonably answered — for example a precise legal requirement of a specific institution, an account/order-specific problem, or a custom case. Even then, first answer whatever you can, THEN offer WhatsApp. Do not offer WhatsApp in most messages.
- If the user asks how to reach us, give the contact details from the KNOWLEDGE (email, phone, WhatsApp) clearly.
- If the user wants US to contact THEM (e.g. "call me", "have someone reach out"), tell them to use the "leave your contact details" button in the chat window.

RULES:
- Respond ONLY in ${langName}, regardless of the language of the knowledge base.
- Be concise (usually 2-5 sentences). No emojis.
- Never guarantee that a document will be accepted by any institution. Keep the distinction between sworn / notarized / apostille. Do not claim certifications or 24/7 human support.
- Never ask for sensitive personal data or documents in the chat; if needed, direct the user to upload documents on the secure quote ("Fiyat Hesapla") page.
- When relevant, guide the user to a helpful next step (quote page for pricing, corporate page, etc.).

KNOWLEDGE:
${knowledge}`

  const model = process.env.OPENAI_MODEL || 'gpt-4o'

  try {
    const resp = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model,
        temperature: 0.3,
        max_tokens: 600,
        messages: [{ role: 'system', content: system }, ...history],
      }),
    })
    if (!resp.ok) {
      const detail = await resp.text()
      return json({ reply: null, error: 'upstream', detail: detail.slice(0, 300) }, 200)
    }
    const data = (await resp.json()) as { choices?: Array<{ message?: { content?: string } }> }
    const reply = data.choices?.[0]?.message?.content?.trim() || null
    if (reply) await logConversation(conversationId, locale, [...history, { role: 'assistant', content: reply }])
    return json({ reply }, 200)
  } catch (e) {
    return json({ reply: null, error: 'exception', detail: String((e as Error)?.message ?? e).slice(0, 200) }, 200)
  }
}

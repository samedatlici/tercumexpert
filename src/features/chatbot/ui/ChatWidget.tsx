import { useEffect, useRef, useState } from 'react'
import { Icon } from '@/components/common/Icon'
import { WhatsAppIcon } from '@/components/common/WhatsAppIcon'
import { useI18n } from '@/hooks/useI18n'
import { whatsappLink } from '@/app/config/site.config'
import { cn } from '@/lib/cn'

interface Message {
  role: 'user' | 'assistant'
  text: string
}

/**
 * Sağ altta sabit AI sohbet balonu (§ marka: siyah/beyaz). Gerçek AI motoru:
 * `/api/chat` Edge fonksiyonu SSS + özel bilgiyle beslenir, kullanıcının dilinde
 * yanıtlar. Bilmediğini uydurmaz; WhatsApp'a yönlendirir.
 */
export function ChatWidget() {
  const { locale, dict } = useI18n()
  const c = dict.chatbot
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [showNudge, setShowNudge] = useState(false)
  const [nudgeDone, setNudgeDone] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (open && messages.length === 0) {
      setMessages([{ role: 'assistant', text: c.welcome }])
    }
  }, [open, messages.length, c.welcome])

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, loading])

  // 30 sn sonra dikkat çekmek için davet baloncuğu (yalnızca bir kez gösterilir).
  useEffect(() => {
    const t = setTimeout(() => setShowNudge(true), 30000)
    return () => clearTimeout(t)
  }, [])

  const openChat = () => {
    setOpen(true)
    setNudgeDone(true)
  }

  const sendToApi = async (userText: string) => {
    const text = userText.trim()
    if (!text || loading) return
    const next: Message[] = [...messages, { role: 'user', text }]
    setMessages(next)
    setInput('')
    setLoading(true)
    try {
      const resp = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          locale,
          messages: next.map((m) => ({ role: m.role, content: m.text })),
        }),
      })
      const data = (await resp.json().catch(() => ({}))) as { reply?: string | null }
      setMessages((m) => [...m, { role: 'assistant', text: data.reply || c.fallback }])
    } catch {
      setMessages((m) => [...m, { role: 'assistant', text: c.fallback }])
    } finally {
      setLoading(false)
    }
  }

  const clear = () => {
    setLoading(false)
    setMessages([{ role: 'assistant', text: c.welcome }])
  }

  const showStarters = messages.length <= 1 && !loading

  return (
    <>
      {/* 30 sn sonra: dikkat çekici davet baloncuğu */}
      {!open && showNudge && !nudgeDone && (
        <div className="fixed bottom-24 end-5 z-40 w-[220px]">
          <div className="relative rounded-2xl rounded-br-sm border border-border bg-surface px-4 py-3 shadow-lg">
            <button
              type="button"
              onClick={openChat}
              className="block w-full pe-4 text-start text-sm font-medium text-text-primary"
            >
              {c.nudge}
            </button>
            <button
              type="button"
              onClick={() => setNudgeDone(true)}
              aria-label={c.close}
              className="absolute end-1.5 top-1.5 rounded p-0.5 text-text-muted hover:bg-surface-muted"
            >
              <Icon name="X" className="size-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Balon (launcher) */}
      {!open && (
        <button
          type="button"
          onClick={openChat}
          aria-label={c.open}
          className="fixed bottom-5 end-5 z-40 flex size-14 items-center justify-center rounded-full bg-secondary text-secondary-foreground shadow-lg transition-transform hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary focus-visible:ring-offset-2"
        >
          <Icon name="MessageCircle" className="size-6" />
        </button>
      )}

      {/* Panel */}
      {open && (
        <div className="fixed inset-x-0 bottom-0 z-50 flex justify-center sm:inset-x-auto sm:bottom-5 sm:end-5 sm:justify-end">
          <div className="flex h-[80vh] w-full flex-col overflow-hidden rounded-t-2xl border border-border bg-surface shadow-xl sm:h-[560px] sm:max-h-[80vh] sm:w-[380px] sm:rounded-2xl">
            {/* Başlık (siyah) */}
            <div className="flex items-center justify-between gap-2 bg-secondary px-4 py-3 text-secondary-foreground">
              <div className="flex items-center gap-2">
                <span className="flex size-8 items-center justify-center rounded-full bg-white/15">
                  <Icon name="MessageCircle" className="size-4" />
                </span>
                <span className="text-sm font-semibold">{c.title}</span>
              </div>
              <div className="flex items-center gap-1">
                <a
                  href={whatsappLink()}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={c.handoff}
                  title={c.handoff}
                  className="rounded-md p-1.5 text-secondary-foreground/80 hover:bg-white/10 hover:text-secondary-foreground"
                >
                  <WhatsAppIcon className="size-4" />
                </a>
                <button
                  type="button"
                  onClick={clear}
                  aria-label={c.clear}
                  title={c.clear}
                  className="rounded-md p-1.5 text-secondary-foreground/80 hover:bg-white/10 hover:text-secondary-foreground"
                >
                  <Icon name="Settings" className="size-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  aria-label={c.close}
                  className="rounded-md p-1.5 text-secondary-foreground/80 hover:bg-white/10 hover:text-secondary-foreground"
                >
                  <Icon name="X" className="size-5" />
                </button>
              </div>
            </div>

            {/* Mesajlar */}
            <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto bg-surface-muted/40 px-3 py-4">
              {messages.map((m, idx) => (
                <div
                  key={idx}
                  className={cn(
                    'max-w-[85%] whitespace-pre-wrap rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed',
                    m.role === 'user'
                      ? 'ms-auto bg-secondary text-secondary-foreground'
                      : 'me-auto border border-border bg-surface text-text-primary',
                  )}
                >
                  {m.text}
                </div>
              ))}
              {loading && (
                <div className="me-auto max-w-[85%]">
                  <div className="inline-flex items-center gap-1 rounded-2xl border border-border bg-surface px-3.5 py-3">
                    <span className="size-1.5 animate-bounce rounded-full bg-text-muted [animation-delay:-0.2s]" />
                    <span className="size-1.5 animate-bounce rounded-full bg-text-muted [animation-delay:-0.1s]" />
                    <span className="size-1.5 animate-bounce rounded-full bg-text-muted" />
                  </div>
                </div>
              )}
            </div>

            {/* Başlangıç soruları (yalnızca konuşma başında) */}
            {showStarters && (
              <div className="flex gap-2 overflow-x-auto border-t border-border bg-surface px-3 py-2">
                {c.quickQuestions.map((q, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => sendToApi(q)}
                    className="shrink-0 whitespace-nowrap rounded-full border border-border-strong bg-surface px-3 py-1.5 text-xs font-medium text-text-secondary transition-colors hover:bg-surface-muted"
                  >
                    {q}
                  </button>
                ))}
              </div>
            )}

            {/* Girdi */}
            <div className="border-t border-border bg-surface px-3 py-2.5">
              <form
                className="flex items-center gap-2"
                onSubmit={(e) => {
                  e.preventDefault()
                  sendToApi(input)
                }}
              >
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={c.inputPlaceholder}
                  aria-label={c.inputPlaceholder}
                  disabled={loading}
                  className="min-h-[42px] flex-1 rounded-full border border-border bg-surface px-4 text-sm outline-none focus:border-border-strong disabled:opacity-60"
                />
                <button
                  type="submit"
                  aria-label={c.send}
                  disabled={loading || !input.trim()}
                  className="flex size-10 shrink-0 items-center justify-center rounded-full bg-secondary text-secondary-foreground transition-opacity hover:opacity-90 disabled:opacity-40"
                >
                  <Icon name="ArrowRight" className="size-5" />
                </button>
              </form>
              <p className="mt-1.5 px-1 text-[11px] leading-snug text-text-muted">{c.sensitiveWarning}</p>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

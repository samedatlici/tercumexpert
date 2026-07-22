import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Icon } from '@/components/common/Icon'
import { WhatsAppIcon } from '@/components/common/WhatsAppIcon'
import { PhoneInput } from '@/components/common/PhoneInput'
import { useI18n } from '@/hooks/useI18n'
import { company, whatsappLink } from '@/app/config/site.config'
import { cn } from '@/lib/cn'

interface Message {
  role: 'user' | 'assistant'
  text: string
}

function makeId(): string {
  const c = globalThis.crypto as Crypto | undefined
  if (c?.randomUUID) return c.randomUUID()
  return `c-${Date.now()}-${Math.random().toString(36).slice(2)}`
}

/** Bot mesajındaki e-posta ve telefonları tıklanabilir bağlantıya çevirir. */
function linkify(text: string): ReactNode[] {
  const out: ReactNode[] = []
  const re = /([\w.+-]+@[\w-]+\.[\w.-]+)|(\+?\d[\d\s().-]{7,}\d)/g
  let last = 0
  let m: RegExpExecArray | null
  let i = 0
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) out.push(text.slice(last, m.index))
    const token = m[0]
    if (m[1]) {
      out.push(<a key={i++} href={`mailto:${token}`} className="font-medium underline">{token}</a>)
    } else {
      const tel = token.replace(/[^\d+]/g, '')
      out.push(<a key={i++} href={`tel:${tel}`} className="font-medium underline">{token}</a>)
    }
    last = m.index + token.length
  }
  if (last < text.length) out.push(text.slice(last))
  return out
}

/**
 * Sağ altta sabit AI sohbet balonu (§ marka: siyah/beyaz). Gerçek AI (`/api/chat`),
 * tıklanabilir iletişim, "iletişim bırak" formu (`/api/lead`) ve sohbet kaydı.
 */
export function ChatWidget() {
  const { locale, dict } = useI18n()
  const c = dict.chatbot
  const cc = c.contact
  const [convId] = useState(makeId)
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [showNudge, setShowNudge] = useState(false)
  const [nudgeDone, setNudgeDone] = useState(false)
  const [leadOpen, setLeadOpen] = useState(false)
  const [leadName, setLeadName] = useState('')
  const [leadEmail, setLeadEmail] = useState('')
  const [leadPhone, setLeadPhone] = useState('')
  const [leadMsg, setLeadMsg] = useState('')
  const [leadBusy, setLeadBusy] = useState(false)
  const [leadErr, setLeadErr] = useState(false)
  const [started, setStarted] = useState(false)
  const [identName, setIdentName] = useState('')
  const [identEmail, setIdentEmail] = useState('')
  const [identPhone, setIdentPhone] = useState('')
  const [identBusy, setIdentBusy] = useState(false)
  const [identErr, setIdentErr] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [vp, setVp] = useState<{ top: number; height: number } | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  const emailHref = `mailto:${company.email.value}`
  const telHref = `tel:${company.phone.value.replace(/[^\d+]/g, '')}`

  useEffect(() => {
    if (open && started && messages.length === 0) {
      setMessages([{ role: 'assistant', text: c.welcome }])
    }
  }, [open, started, messages.length, c.welcome])

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, loading])

  // 30 sn sonra dikkat çekmek için davet baloncuğu (yalnızca bir kez).
  useEffect(() => {
    const t = setTimeout(() => setShowNudge(true), 30000)
    return () => clearTimeout(t)
  }, [])

  // Mobil algılama.
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 639px)')
    const on = () => setIsMobile(mq.matches)
    on()
    mq.addEventListener('change', on)
    return () => mq.removeEventListener('change', on)
  }, [])

  // Mobilde klavye açılınca paneli görünür alana (klavyenin üstüne) sığdır.
  useEffect(() => {
    const vv = window.visualViewport
    if (!vv || !open) {
      setVp(null)
      return
    }
    const update = () => setVp({ top: vv.offsetTop, height: vv.height })
    update()
    vv.addEventListener('resize', update)
    vv.addEventListener('scroll', update)
    return () => {
      vv.removeEventListener('resize', update)
      vv.removeEventListener('scroll', update)
    }
  }, [open])

  // Mobilde panel açıkken arka planın kaymasını engelle.
  useEffect(() => {
    if (!(open && isMobile)) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [open, isMobile])

  const openChat = () => {
    setOpen(true)
    setNudgeDone(true)
  }

  // Karşılama: ziyaretçinin adını + e-postasını alır (panelde kimliklenir).
  const submitIdentity = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!identName.trim() || !identEmail.trim()) {
      setIdentErr(true)
      return
    }
    setIdentErr(false)
    setIdentBusy(true)
    try {
      await fetch('/api/lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId: convId,
          locale,
          name: identName.trim(),
          email: identEmail.trim(),
          phone: identPhone.trim(),
          wantsContact: false,
        }),
      })
    } catch {
      /* kimlik kaydı en iyi çabayla */
    } finally {
      setIdentBusy(false)
      setStarted(true)
      setMessages([{ role: 'assistant', text: c.welcome }])
    }
  }

  const openLead = () => {
    setLeadName(identName)
    setLeadEmail(identEmail)
    setLeadPhone(identPhone)
    setLeadOpen(true)
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
          conversationId: convId,
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

  const submitLead = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!leadEmail.trim() && !leadPhone.trim()) {
      setLeadErr(true)
      return
    }
    setLeadErr(false)
    setLeadBusy(true)
    try {
      await fetch('/api/lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId: convId,
          locale,
          name: leadName.trim(),
          email: leadEmail.trim(),
          phone: leadPhone.trim(),
          message: leadMsg.trim(),
        }),
      })
    } catch {
      /* yine de teşekkür göster; kayıt en iyi çabayla */
    } finally {
      setLeadBusy(false)
      setLeadOpen(false)
      setLeadName('')
      setLeadEmail('')
      setLeadPhone('')
      setLeadMsg('')
      setMessages((m) => [...m, { role: 'assistant', text: cc.thanks }])
    }
  }

  const clear = () => {
    setLoading(false)
    setLeadOpen(false)
    setMessages([{ role: 'assistant', text: c.welcome }])
  }

  const showStarters = messages.length <= 1 && !loading && !leadOpen

  const mobileStyle = isMobile
    ? vp
      ? { top: `${vp.top}px`, height: `${vp.height}px`, bottom: 'auto' }
      : { height: '85dvh' }
    : undefined

  return (
    <>
      {/* 30 sn sonra: dikkat çekici davet baloncuğu */}
      {!open && showNudge && !nudgeDone && (
        <div className="fixed bottom-24 end-5 z-40 w-[220px]">
          <div className="relative rounded-2xl rounded-br-sm border border-border bg-surface px-4 py-3 shadow-lg">
            <button type="button" onClick={openChat} className="block w-full pe-4 text-start text-sm font-medium text-text-primary">
              {c.nudge}
            </button>
            <button type="button" onClick={() => setNudgeDone(true)} aria-label={c.close} className="absolute end-1.5 top-1.5 rounded p-0.5 text-text-muted hover:bg-surface-muted">
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
        <div className="fixed inset-x-0 bottom-0 z-50 flex justify-center sm:inset-x-auto sm:bottom-5 sm:end-5 sm:justify-end" style={mobileStyle}>
          <div className="flex h-full w-full flex-col overflow-hidden rounded-t-2xl border border-border bg-surface shadow-xl sm:h-[560px] sm:max-h-[80vh] sm:w-[380px] sm:rounded-2xl">
            {/* Başlık (siyah) */}
            <div className="flex items-center justify-between gap-2 bg-secondary px-4 py-3 text-secondary-foreground">
              <div className="flex items-center gap-2">
                <span className="flex size-8 items-center justify-center rounded-full bg-white/15">
                  <Icon name="MessageCircle" className="size-4" />
                </span>
                <span className="text-sm font-semibold">{c.title}</span>
              </div>
              <div className="flex items-center gap-1">
                <button type="button" onClick={clear} aria-label={c.clear} title={c.clear} className="rounded-md p-1.5 text-secondary-foreground/80 hover:bg-white/10 hover:text-secondary-foreground">
                  <Icon name="Settings" className="size-4" />
                </button>
                <button type="button" onClick={() => setOpen(false)} aria-label={c.close} className="rounded-md p-1.5 text-secondary-foreground/80 hover:bg-white/10 hover:text-secondary-foreground">
                  <Icon name="X" className="size-5" />
                </button>
              </div>
            </div>

            {/* Hızlı iletişim çubuğu (tıklanabilir) */}
            <div className="flex items-center gap-1.5 overflow-x-auto border-b border-border bg-surface px-2 py-1.5">
              <a href={whatsappLink()} target="_blank" rel="noopener noreferrer" className="inline-flex shrink-0 items-center gap-1 rounded-full bg-[#25D366]/10 px-2.5 py-1 text-xs font-medium text-[#128C7E] hover:bg-[#25D366]/20">
                <WhatsAppIcon className="size-3.5" /> {cc.whatsapp}
              </a>
              <a href={emailHref} className="inline-flex shrink-0 items-center gap-1 rounded-full border border-border px-2.5 py-1 text-xs font-medium text-text-secondary hover:bg-surface-muted">
                <Icon name="Mail" className="size-3.5" /> {cc.email}
              </a>
              <a href={telHref} className="inline-flex shrink-0 items-center gap-1 rounded-full border border-border px-2.5 py-1 text-xs font-medium text-text-secondary hover:bg-surface-muted">
                <Icon name="Phone" className="size-3.5" /> {cc.phone}
              </a>
              {started && (
                <button type="button" onClick={openLead} className="inline-flex shrink-0 items-center gap-1 rounded-full bg-secondary px-2.5 py-1 text-xs font-medium text-secondary-foreground hover:bg-secondary-hover">
                  <Icon name="Users" className="size-3.5" /> {cc.leaveInfo}
                </button>
              )}
            </div>

            {!started ? (
              /* Karşılama: isim + e-posta (kayıt panelde kimliklenir) */
              <form onSubmit={submitIdentity} className="flex flex-1 flex-col gap-3 overflow-y-auto p-4">
                <div>
                  <h3 className="text-base font-bold">{cc.introTitle}</h3>
                  <p className="mt-1 text-sm text-text-secondary">{cc.introDesc}</p>
                </div>
                <input value={identName} onChange={(e) => setIdentName(e.target.value)} placeholder={cc.name} autoComplete="name" className="min-h-[42px] rounded-md border border-border bg-surface px-3 text-base outline-none focus:border-border-strong" />
                <input value={identEmail} onChange={(e) => setIdentEmail(e.target.value)} type="email" placeholder={cc.emailField} autoComplete="email" className="min-h-[42px] rounded-md border border-border bg-surface px-3 text-base outline-none focus:border-border-strong" />
                <PhoneInput onChange={setIdentPhone} placeholder={cc.phoneField} />
                {identErr && <p className="text-xs text-danger">{cc.introError}</p>}
                <button type="submit" disabled={identBusy} className="mt-auto min-h-[44px] rounded-md bg-secondary px-4 text-sm font-semibold text-secondary-foreground hover:bg-secondary-hover disabled:opacity-50">
                  {identBusy ? cc.submitting : cc.start}
                </button>
              </form>
            ) : leadOpen ? (
              /* İletişim bırak formu */
              <form onSubmit={submitLead} className="flex flex-1 flex-col gap-3 overflow-y-auto p-4">
                <div>
                  <h3 className="text-base font-bold">{cc.formTitle}</h3>
                  <p className="mt-1 text-sm text-text-secondary">{cc.formDesc}</p>
                </div>
                <input value={leadName} onChange={(e) => setLeadName(e.target.value)} placeholder={cc.name} autoComplete="name" className="min-h-[42px] rounded-md border border-border bg-surface px-3 text-base outline-none focus:border-border-strong" />
                <input value={leadEmail} onChange={(e) => setLeadEmail(e.target.value)} type="email" placeholder={cc.emailField} autoComplete="email" className="min-h-[42px] rounded-md border border-border bg-surface px-3 text-base outline-none focus:border-border-strong" />
                <PhoneInput onChange={setLeadPhone} placeholder={cc.phoneField} />
                <textarea value={leadMsg} onChange={(e) => setLeadMsg(e.target.value)} placeholder={cc.message} rows={3} className="rounded-md border border-border bg-surface px-3 py-2 text-base outline-none focus:border-border-strong" />
                {leadErr && <p className="text-xs text-danger">{cc.errorRequired}</p>}
                <div className="mt-auto flex gap-2">
                  <button type="button" onClick={() => setLeadOpen(false)} className="min-h-[44px] flex-1 rounded-md border border-border-strong bg-surface px-4 text-sm font-medium text-text-primary hover:bg-surface-muted">
                    {cc.back}
                  </button>
                  <button type="submit" disabled={leadBusy} className="min-h-[44px] flex-[2] rounded-md bg-secondary px-4 text-sm font-semibold text-secondary-foreground hover:bg-secondary-hover disabled:opacity-50">
                    {leadBusy ? cc.submitting : cc.submit}
                  </button>
                </div>
              </form>
            ) : (
              <>
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
                      {m.role === 'assistant' ? linkify(m.text) : m.text}
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

                {/* Başlangıç: hızlı sorular + iletişim bırak */}
                {showStarters && (
                  <div className="flex gap-2 overflow-x-auto border-t border-border bg-surface px-3 py-2">
                    {c.quickQuestions.map((q, i) => (
                      <button key={i} type="button" onClick={() => sendToApi(q)} className="shrink-0 whitespace-nowrap rounded-full border border-border-strong bg-surface px-3 py-1.5 text-xs font-medium text-text-secondary transition-colors hover:bg-surface-muted">
                        {q}
                      </button>
                    ))}
                  </div>
                )}

                {/* Girdi */}
                <div className="border-t border-border bg-surface px-3 py-2.5">
                  <form className="flex items-center gap-2" onSubmit={(e) => { e.preventDefault(); sendToApi(input) }}>
                    <input
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      placeholder={c.inputPlaceholder}
                      aria-label={c.inputPlaceholder}
                      disabled={loading}
                      className="min-h-[42px] flex-1 rounded-full border border-border bg-surface px-4 text-base outline-none focus:border-border-strong disabled:opacity-60"
                    />
                    <button type="submit" aria-label={c.send} disabled={loading || !input.trim()} className="flex size-10 shrink-0 items-center justify-center rounded-full bg-secondary text-secondary-foreground transition-opacity hover:opacity-90 disabled:opacity-40">
                      <Icon name="ArrowRight" className="size-5" />
                    </button>
                  </form>
                  <p className="mt-1.5 px-1 text-[11px] leading-snug text-text-muted">{c.sensitiveWarning}</p>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  )
}

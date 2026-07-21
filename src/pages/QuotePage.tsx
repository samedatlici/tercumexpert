import { useEffect, useId, useRef, useState, type FormEvent, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/common/Button'
import { Icon } from '@/components/common/Icon'
import { WhatsAppIcon } from '@/components/common/WhatsAppIcon'
import { PageHero } from '@/components/common/PageHero'
import { Seo } from '@/components/seo/Seo'
import { useI18n } from '@/hooks/useI18n'
import { useAuth } from '@/app/providers/AuthProvider'
import { buildPath } from '@/app/router/routes'
import { createOrder } from '@/features/orders/model/create-order'
import { cn } from '@/lib/cn'
import { calculateQuote } from '@/features/quote-calculator/model/calculate'
import type { QuoteBreakdown } from '@/features/quote-calculator/model/types'
import {
  countWords,
  extractWordCount,
  type ExtractStatus,
} from '@/features/file-upload/model/extract-word-count'
import { SERVICES, type ServiceId } from '@/app/config/services'
import { DOCUMENT_TYPES, QUOTE_LANGUAGES, type DocumentTypeId } from '@/app/config/pricing.config'
import { whatsappLink } from '@/app/config/site.config'

const fieldClass =
  'h-11 w-full rounded-md border border-border bg-surface px-3 text-base focus-visible:outline-none'

const MAX_SIZE = 100 * 1024 * 1024 // 100MB
const ACCEPT =
  '.txt,.doc,.docx,.odt,.rtf,.dot,.dotx,.pdf,.ppt,.pptx,.pps,.ppsx,.odp,.xls,.xlsx,.xlsm,.csv,.ods,' +
  '.jpg,.jpeg,.png,.gif,.tif,.tiff,.bmp,.htm,.html,.xhtml,.xml,.json,.srt,.po,.strings,.md,' +
  '.m4a,.mp3,.wav,.ogg,.wma,.aac,.mp4,.m4v,.mov,.avi,.wmv,.mpg'

type Mode = 'file' | 'text'

interface FileEntry {
  key: string
  file: File
  name: string
  words: number
  status: ExtractStatus | 'pending'
}

export default function QuotePage() {
  const { locale, dict, formatCurrency } = useI18n()
  const { user } = useAuth()
  const q = dict.quote
  const u = q.upload
  const ids = useId()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const keyCounter = useRef(0)
  const pendingRef = useRef<QuoteBreakdown | null>(null)

  const [mode, setMode] = useState<Mode>('file')
  const [files, setFiles] = useState<FileEntry[]>([])
  const [sizeError, setSizeError] = useState(false)
  const [text, setText] = useState('')

  const [service, setService] = useState<ServiceId>('sworn')
  const [sourceLang, setSourceLang] = useState('tr')
  const [targetLang, setTargetLang] = useState('en')
  const [documentType, setDocumentType] = useState<DocumentTypeId>('diploma')
  const [urgent, setUrgent] = useState(false)
  const [notarization, setNotarization] = useState(false)
  const [physicalDelivery, setPhysicalDelivery] = useState(false)
  const [result, setResult] = useState<QuoteBreakdown | null>(null)
  const [gateOpen, setGateOpen] = useState(false)
  const [needInput, setNeedInput] = useState(false)
  const [ordering, setOrdering] = useState(false)
  const [orderNo, setOrderNo] = useState<number | null>(null)
  const [orderError, setOrderError] = useState<string | null>(null)

  // Kullanıcı giriş yapınca (veya misafir doğrulaması tamamlanınca) bekleyen fiyatı göster.
  useEffect(() => {
    if (user && gateOpen && pendingRef.current) {
      setResult(pendingRef.current)
      setGateOpen(false)
    }
  }, [user, gateOpen])

  const textWords = countWords(text)
  const fileWords = files.reduce((sum, f) => sum + (f.status === 'ok' ? f.words : 0), 0)
  const anyExtracting = files.some((f) => f.status === 'pending')
  const wordCount = mode === 'file' ? fileWords : textWords

  const processFiles = (list: FileList | File[]) => {
    setResult(null)
    setSizeError(false)
    for (const f of Array.from(list)) {
      if (f.size > MAX_SIZE) {
        setSizeError(true)
        continue
      }
      keyCounter.current += 1
      const key = `f${keyCounter.current}`
      setFiles((prev) => [...prev, { key, file: f, name: f.name, words: 0, status: 'pending' }])
      extractWordCount(f)
        .then((res) =>
          setFiles((prev) =>
            prev.map((e) =>
              e.key === key ? { ...e, words: res.status === 'ok' ? res.words : 0, status: res.status } : e,
            ),
          ),
        )
        .catch(() =>
          setFiles((prev) => prev.map((e) => (e.key === key ? { ...e, status: 'error' as const } : e))),
        )
    }
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const removeFile = (key: string) => {
    setFiles((prev) => prev.filter((e) => e.key !== key))
    setResult(null)
  }

  const handleCalculate = () => {
    if (wordCount <= 0) {
      setNeedInput(true)
      setResult(null)
      setGateOpen(false)
      return
    }
    setNeedInput(false)
    const breakdown = calculateQuote({
      service,
      documentType,
      sourceLang,
      targetLang,
      wordCount,
      urgent,
      notarization,
      physicalDelivery,
    })
    if (user) {
      // Giriş yapılmışsa fiyatı doğrudan göster.
      setResult(breakdown)
      setGateOpen(false)
    } else {
      // Giriş yoksa fiyatı gizle; kapıyı aç (giriş veya misafir doğrulaması).
      pendingRef.current = breakdown
      setResult(null)
      setGateOpen(true)
    }
  }

  const handleOrder = async () => {
    if (!user || !result || ordering) return
    setOrdering(true)
    setOrderError(null)
    const res = await createOrder({
      userId: user.id,
      service,
      sourceLang,
      targetLang,
      documentType,
      wordCount,
      urgent,
      notarization,
      physicalDelivery,
      breakdown: result,
      inputMode: mode,
      sourceText: mode === 'text' ? text : undefined,
      files: files.map((f) => ({ file: f.file, words: f.status === 'ok' ? f.words : 0 })),
      contactName: (user.user_metadata?.full_name as string | undefined) ?? null,
      contactEmail: user.email ?? null,
    })
    setOrdering(false)
    if (res.error || res.orderNo == null) {
      setOrderError(q.orderConfirm.error)
      return
    }
    setOrderNo(res.orderNo)
  }

  const wa = whatsappLink('Merhaba, fiyat teklifi hakkında bilgi almak istiyorum.')

  return (
    <>
      <Seo title={q.seo.title} description={q.seo.description} routeId="quote" />
      <PageHero title={q.hero.title} subtitle={q.hero.subtitle} />

      <section className="section">
        <div className="container-base grid gap-8 lg:grid-cols-[1.3fr_1fr] lg:items-start">
          {/* SOL: form */}
          <form
            className="space-y-6"
            onSubmit={(e) => {
              e.preventDefault()
              handleCalculate()
            }}
          >
            {/* Belge / metin girişi */}
            <div className="rounded-lg border border-border bg-surface p-6">
              <div className="mb-4 flex flex-wrap items-start justify-between gap-2">
                <h2 className="text-lg font-bold">
                  {u.heading} <span className="text-danger">*</span>
                </h2>
                <span className="inline-flex items-center gap-1.5 text-sm text-text-muted">
                  <Icon name="Lock" className="size-4 text-success" />
                  {u.privacy}
                </span>
              </div>

              {/* Sekmeler */}
              <div
                role="tablist"
                aria-label={u.heading}
                className="grid grid-cols-2 rounded-md border border-border p-1"
              >
                <TabButton active={mode === 'file'} onClick={() => setMode('file')} icon="Upload">
                  {u.tabFile}
                </TabButton>
                <TabButton active={mode === 'text'} onClick={() => setMode('text')} icon="FileText">
                  {u.tabText}
                </TabButton>
              </div>

              {/* Dosya sekmesi */}
              {mode === 'file' && (
                <div className="mt-4">
                  <div
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      e.preventDefault()
                      if (e.dataTransfer.files?.length) processFiles(e.dataTransfer.files)
                    }}
                    className="flex flex-col items-center gap-3 rounded-md border border-dashed border-border-strong p-6 text-center"
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept={ACCEPT}
                      multiple
                      className="hidden"
                      onChange={(e) => {
                        if (e.target.files?.length) processFiles(e.target.files)
                      }}
                    />
                    <Button
                      intent="secondary"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Icon name="Upload" className="size-5" /> {u.chooseFile}
                    </Button>
                    <p className="text-xs text-text-muted">{u.dropHint}</p>
                    <p className="text-xs text-text-muted">{u.formats}</p>
                  </div>

                  {sizeError && <p className="mt-3 text-sm text-danger">{u.tooLarge}</p>}

                  {files.length > 0 && (
                    <ul className="mt-3 space-y-2">
                      {files.map((f) => (
                        <li
                          key={f.key}
                          className="flex items-center justify-between gap-3 rounded-md border border-border bg-surface-muted px-4 py-3"
                        >
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium">{f.name}</p>
                            <p className="text-xs text-text-muted">
                              {f.status === 'pending'
                                ? u.extracting
                                : f.status === 'ok'
                                  ? `${f.words} ${u.wordsUnit}`
                                  : f.status === 'unsupported'
                                    ? u.unsupported
                                    : f.status === 'empty'
                                      ? u.empty
                                      : u.error}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeFile(f.key)}
                            aria-label={u.remove}
                            className="inline-flex size-9 shrink-0 items-center justify-center rounded-md text-danger hover:bg-surface"
                          >
                            <Icon name="X" className="size-5" />
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}

                  {files.length > 0 && (
                    <div className="mt-3 flex items-center justify-between border-t border-border pt-3 text-sm">
                      <span className="text-text-secondary">{u.totalWords}:</span>
                      <span className="font-semibold">
                        {anyExtracting ? u.extracting : `${fileWords} ${u.wordsUnit}`}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Metin sekmesi */}
              {mode === 'text' && (
                <div className="mt-4">
                  <textarea
                    rows={7}
                    value={text}
                    onChange={(e) => {
                      setText(e.target.value)
                      setResult(null)
                    }}
                    placeholder={u.textPlaceholder}
                    className="w-full rounded-md border border-border bg-surface p-3 text-base focus-visible:outline-none"
                  />
                  <div className="mt-2 flex items-center justify-between text-sm">
                    <span className="text-text-secondary">{u.totalWords}:</span>
                    <span className="font-semibold">{textWords}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Diller */}
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label={q.fields.sourceLang} htmlFor={`${ids}-src`}>
                <select id={`${ids}-src`} className={fieldClass} value={sourceLang} onChange={(e) => setSourceLang(e.target.value)}>
                  {QUOTE_LANGUAGES.map((l) => (
                    <option key={l.code} value={l.code}>{l.labelTr}</option>
                  ))}
                </select>
              </Field>
              <Field label={q.fields.targetLang} htmlFor={`${ids}-tgt`}>
                <select id={`${ids}-tgt`} className={fieldClass} value={targetLang} onChange={(e) => setTargetLang(e.target.value)}>
                  {QUOTE_LANGUAGES.map((l) => (
                    <option key={l.code} value={l.code}>{l.labelTr}</option>
                  ))}
                </select>
              </Field>
            </div>

            <Field label={q.fields.serviceType} htmlFor={`${ids}-svc`}>
              <select id={`${ids}-svc`} className={fieldClass} value={service} onChange={(e) => setService(e.target.value as ServiceId)}>
                {[...SERVICES].map((s) => (
                  <option key={s.id} value={s.id}>{dict.serviceItems[s.id].name}</option>
                ))}
              </select>
            </Field>

            <Field label={q.fields.documentType} htmlFor={`${ids}-doc`}>
              <select id={`${ids}-doc`} className={fieldClass} value={documentType} onChange={(e) => setDocumentType(e.target.value as DocumentTypeId)}>
                {DOCUMENT_TYPES.map((d) => (
                  <option key={d.id} value={d.id}>{d.labelTr}</option>
                ))}
              </select>
            </Field>

            <fieldset className="space-y-2">
              <legend className="mb-1 text-sm font-medium">{q.fields.options}</legend>
              <Checkbox label={q.options.urgent} checked={urgent} onChange={setUrgent} />
              <Checkbox label={q.options.notarization} checked={notarization} onChange={setNotarization} />
              <Checkbox label={q.options.physicalDelivery} checked={physicalDelivery} onChange={setPhysicalDelivery} />
            </fieldset>

            {needInput && wordCount <= 0 && <p className="text-sm text-danger">{u.needInput}</p>}

            <Button type="submit" intent="secondary" size="lg" block>
              {q.fields.calculate}
            </Button>
          </form>

          {/* SAĞ: sonuç */}
          <div aria-live="polite" className="lg:sticky lg:top-24">
            {orderNo != null ? (
              <div className="rounded-lg border border-border bg-surface p-6 text-center">
                <span className="mx-auto inline-flex size-14 items-center justify-center rounded-full bg-success/10 text-success">
                  <Icon name="CircleCheck" className="size-8" />
                </span>
                <h2 className="mt-4 text-xl font-bold">{q.orderConfirm.title}</h2>
                <p className="mt-2 text-sm text-text-secondary">{q.orderConfirm.desc}</p>
                <p className="mt-4 rounded-md border border-border bg-surface-muted px-4 py-3 text-sm">
                  {q.orderConfirm.number}: <span className="font-bold">#{orderNo}</span>
                </p>
                <div className="mt-5 space-y-2">
                  <Link to={buildPath(locale, 'auth')}>
                    <Button intent="secondary" block>{q.orderConfirm.viewOrders}</Button>
                  </Link>
                  {wa && (
                    <a href={wa} target="_blank" rel="noopener noreferrer">
                      <Button intent="whatsapp" block><WhatsAppIcon className="size-5" /> {q.result.whatsapp}</Button>
                    </a>
                  )}
                </div>
              </div>
            ) : result ? (
              <div className="rounded-lg border border-border bg-surface p-6">
                <h2 className="text-xl font-semibold">{q.result.title}</h2>
                <p className="mt-1 text-sm text-text-muted">{wordCount} {u.wordsUnit}</p>
                <dl className="mt-4 space-y-2 text-sm">
                  <Row label={q.result.basePrice} value={formatCurrency(result.basePrice)} />
                  <Row label={q.result.wordPrice} value={formatCurrency(result.wordPrice)} />
                  <Row label={q.result.addons} value={formatCurrency(result.addonsPrice)} />
                  <div className="my-2 border-t border-border" />
                  <Row label="KDV" value={formatCurrency(result.tax)} />
                  <Row label={q.result.total} value={formatCurrency(result.total)} strong />
                  <Row label={q.result.delivery} value={`${result.deliveryDays} ${q.result.deliveryUnit}`} />
                </dl>
                {orderError && <p className="mt-3 text-sm text-danger">{orderError}</p>}
                <div className="mt-5 space-y-2">
                  <Button intent="secondary" block onClick={() => void handleOrder()} disabled={ordering}>
                    {ordering ? q.orderConfirm.submitting : q.result.order}
                  </Button>
                  {wa && (
                    <a href={wa} target="_blank" rel="noopener noreferrer">
                      <Button intent="whatsapp" block><WhatsAppIcon className="size-5" /> {q.result.whatsapp}</Button>
                    </a>
                  )}
                </div>
              </div>
            ) : gateOpen && !user ? (
              <PriceGate />
            ) : (
              <div className="rounded-lg border border-dashed border-border p-6 text-sm text-text-secondary">
                {q.hero.subtitle}
              </div>
            )}
          </div>
        </div>
      </section>
    </>
  )
}

/** Fiyat kapısı: giriş yoksa fiyatı gösterir yerine giriş / misafir doğrulaması ister. */
function PriceGate() {
  const { locale, dict } = useI18n()
  const g = dict.quote.gate
  const { sendGuestCode, verifyGuestCode } = useAuth()
  const [step, setStep] = useState<'info' | 'code'>('info')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const emailOk = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)

  const onSend = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setInfo(null)
    if (firstName.trim().length < 2 || lastName.trim().length < 2) return setError(g.errNames)
    if (!emailOk(email)) return setError(g.errEmail)
    setBusy(true)
    const res = await sendGuestCode(email, firstName, lastName)
    setBusy(false)
    if (res.error) return setError(res.error)
    setStep('code')
  }

  const onVerify = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    if (code.trim().length < 6) return setError(g.errCode)
    setBusy(true)
    const res = await verifyGuestCode(email, code.trim())
    setBusy(false)
    if (res.error) return setError(res.error)
    // Başarılı → oturum açılır; üst bileşendeki effect fiyatı gösterir.
  }

  const onResend = async () => {
    setError(null)
    setInfo(null)
    setBusy(true)
    const res = await sendGuestCode(email, firstName, lastName)
    setBusy(false)
    if (res.error) return setError(res.error)
    setInfo(g.resent)
  }

  return (
    <div className="rounded-lg border border-border bg-surface p-6">
      <div className="flex items-center gap-2">
        <Icon name="Lock" className="size-5 text-primary" />
        <h2 className="text-lg font-bold">{g.title}</h2>
      </div>
      <p className="mt-1 text-sm text-text-secondary">{g.subtitle}</p>

      <Link to={buildPath(locale, 'auth')} className="mt-4 block">
        <Button intent="secondary" block>{g.loginCta}</Button>
      </Link>

      <div className="my-4 flex items-center gap-3 text-xs text-text-muted">
        <span className="h-px flex-1 bg-border" /> {g.or} <span className="h-px flex-1 bg-border" />
      </div>

      {step === 'info' ? (
        <form className="space-y-3" onSubmit={onSend} noValidate>
          <div className="grid grid-cols-2 gap-3">
            <input className={fieldClass} placeholder={g.firstName} autoComplete="given-name" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
            <input className={fieldClass} placeholder={g.lastName} autoComplete="family-name" value={lastName} onChange={(e) => setLastName(e.target.value)} />
          </div>
          <input type="email" className={fieldClass} placeholder={g.email} autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          {error && <p className="text-sm text-danger">{error}</p>}
          <Button type="submit" intent="outline" block disabled={busy}>{g.sendCode}</Button>
          <p className="text-xs text-text-muted">{g.note}</p>
        </form>
      ) : (
        <form className="space-y-3" onSubmit={onVerify} noValidate>
          <p className="text-sm text-text-secondary">
            <span className="font-medium text-text-primary">{email}</span> {g.codeSentA}
          </p>
          <input
            className={cn(fieldClass, 'text-center tracking-[0.4em]')}
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={8}
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
            placeholder="______"
            aria-label={g.codeLabel}
          />
          {error && <p className="text-sm text-danger">{error}</p>}
          {info && <p className="text-sm text-success">{info}</p>}
          <Button type="submit" intent="secondary" block disabled={busy}>{g.verify}</Button>
          <div className="flex items-center justify-between text-xs">
            <button type="button" onClick={() => { setStep('info'); setError(null) }} className="text-text-secondary underline underline-offset-4 hover:text-text-primary">
              {g.back}
            </button>
            <button type="button" onClick={() => void onResend()} disabled={busy} className="text-text-secondary underline underline-offset-4 hover:text-text-primary">
              {g.resend}
            </button>
          </div>
        </form>
      )}
    </div>
  )
}

function TabButton({
  active,
  onClick,
  icon,
  children,
}: {
  active: boolean
  onClick: () => void
  icon: 'Upload' | 'FileText'
  children: ReactNode
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={cn(
        'inline-flex min-h-[44px] items-center justify-center gap-2 rounded-[4px] text-sm font-medium transition-colors',
        active ? 'bg-surface-muted text-text-primary shadow-xs' : 'text-text-secondary hover:text-text-primary',
      )}
    >
      <Icon name={icon} className="size-4" />
      {children}
    </button>
  )
}

function Field({ label, htmlFor, children }: { label: string; htmlFor: string; children: ReactNode }) {
  return (
    <div>
      <label htmlFor={htmlFor} className="mb-1.5 block text-sm font-medium">
        {label}
      </label>
      {children}
    </div>
  )
}

function Checkbox({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex min-h-[44px] cursor-pointer items-center gap-3 rounded-md border border-border px-3">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="size-4 accent-black" />
      <span className="text-sm">{label}</span>
    </label>
  )
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <dt className="text-text-secondary">{label}</dt>
      <dd className={strong ? 'text-lg font-bold' : 'font-medium'}>{value}</dd>
    </div>
  )
}

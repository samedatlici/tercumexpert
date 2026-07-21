import { useId, useRef, useState, type ReactNode } from 'react'
import { Button } from '@/components/common/Button'
import { Icon } from '@/components/common/Icon'
import { WhatsAppIcon } from '@/components/common/WhatsAppIcon'
import { PageHero } from '@/components/common/PageHero'
import { Seo } from '@/components/seo/Seo'
import { useI18n } from '@/hooks/useI18n'
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

export default function QuotePage() {
  const { dict, formatCurrency } = useI18n()
  const q = dict.quote
  const u = q.upload
  const ids = useId()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [mode, setMode] = useState<Mode>('file')
  const [file, setFile] = useState<File | null>(null)
  const [fileWords, setFileWords] = useState<number | null>(null)
  const [fileStatus, setFileStatus] = useState<ExtractStatus | null>(null)
  const [extracting, setExtracting] = useState(false)
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
  const [needInput, setNeedInput] = useState(false)

  const textWords = countWords(text)
  const wordCount = mode === 'file' ? (fileWords ?? 0) : textWords

  const processFile = async (f: File) => {
    setSizeError(false)
    setResult(null)
    if (f.size > MAX_SIZE) {
      setFile(null)
      setFileWords(null)
      setFileStatus(null)
      setSizeError(true)
      return
    }
    setFile(f)
    setFileWords(null)
    setFileStatus(null)
    setExtracting(true)
    const res = await extractWordCount(f)
    setExtracting(false)
    setFileStatus(res.status)
    setFileWords(res.status === 'ok' ? res.words : 0)
  }

  const clearFile = () => {
    setFile(null)
    setFileWords(null)
    setFileStatus(null)
    setSizeError(false)
    setResult(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleCalculate = () => {
    if (wordCount <= 0) {
      setNeedInput(true)
      setResult(null)
      return
    }
    setNeedInput(false)
    setResult(
      calculateQuote({
        service,
        documentType,
        sourceLang,
        targetLang,
        wordCount,
        urgent,
        notarization,
        physicalDelivery,
      }),
    )
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
                      const f = e.dataTransfer.files?.[0]
                      if (f) void processFile(f)
                    }}
                    className="flex flex-col items-center gap-3 rounded-md border border-dashed border-border-strong p-6 text-center"
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept={ACCEPT}
                      className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0]
                        if (f) void processFile(f)
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

                  {file && (
                    <div className="mt-3 flex items-center justify-between gap-3 rounded-md border border-border bg-surface-muted px-4 py-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{file.name}</p>
                        <p className="text-xs text-text-muted">
                          {extracting
                            ? u.extracting
                            : fileStatus === 'ok'
                              ? `${fileWords} ${u.wordsUnit}`
                              : fileStatus === 'unsupported'
                                ? u.unsupported
                                : fileStatus === 'empty'
                                  ? u.empty
                                  : u.error}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={clearFile}
                        aria-label={u.remove}
                        className="inline-flex size-9 shrink-0 items-center justify-center rounded-md text-danger hover:bg-surface"
                      >
                        <Icon name="X" className="size-5" />
                      </button>
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
            {result ? (
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
                <div className="mt-5 space-y-2">
                  <Button intent="secondary" block>{q.result.order}</Button>
                  {wa && (
                    <a href={wa} target="_blank" rel="noopener noreferrer">
                      <Button intent="whatsapp" block><WhatsAppIcon className="size-5" /> {q.result.whatsapp}</Button>
                    </a>
                  )}
                </div>
                <p className="mt-3 text-center text-xs text-text-muted">{dict.common.states.demoNotice}</p>
              </div>
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

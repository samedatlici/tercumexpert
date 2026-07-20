import { useId, useState, type ReactNode } from 'react'
import { Button } from '@/components/common/Button'
import { PageHero } from '@/components/common/PageHero'
import { Seo } from '@/components/seo/Seo'
import { useI18n } from '@/hooks/useI18n'
import { calculateQuote } from '@/features/quote-calculator/model/calculate'
import type { QuoteBreakdown } from '@/features/quote-calculator/model/types'
import { SERVICES, type ServiceId } from '@/app/config/services'
import {
  DOCUMENT_TYPES,
  QUOTE_LANGUAGES,
  WORD_COUNT,
  type DocumentTypeId,
} from '@/app/config/pricing.config'
import { whatsappLink } from '@/app/config/site.config'

const fieldClass =
  'h-11 w-full rounded-md border border-border bg-surface px-3 text-base focus-visible:outline-none'

export default function QuotePage() {
  const { dict, formatCurrency } = useI18n()
  const q = dict.quote
  const ids = useId()

  const [service, setService] = useState<ServiceId>('sworn')
  const [sourceLang, setSourceLang] = useState('tr')
  const [targetLang, setTargetLang] = useState('en')
  const [documentType, setDocumentType] = useState<DocumentTypeId>('diploma')
  const [wordCount, setWordCount] = useState<number>(WORD_COUNT.default)
  const [urgent, setUrgent] = useState(false)
  const [notarization, setNotarization] = useState(false)
  const [physicalDelivery, setPhysicalDelivery] = useState(false)
  const [result, setResult] = useState<QuoteBreakdown | null>(null)

  const handleCalculate = () => {
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
          {/* Form */}
          <form
            className="space-y-5 rounded-lg border border-border bg-surface p-6"
            onSubmit={(e) => {
              e.preventDefault()
              handleCalculate()
            }}
          >
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

            <Field label={`${q.fields.wordCount}: ${wordCount}`} htmlFor={`${ids}-wc`} hint={q.fields.wordCountHint}>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min={WORD_COUNT.min}
                  max={WORD_COUNT.max}
                  step={WORD_COUNT.step}
                  value={wordCount}
                  onChange={(e) => setWordCount(Number(e.target.value))}
                  className="flex-1"
                  aria-label={q.fields.wordCount}
                />
                <input
                  id={`${ids}-wc`}
                  type="number"
                  min={WORD_COUNT.min}
                  max={WORD_COUNT.max}
                  value={wordCount}
                  onChange={(e) => setWordCount(Number(e.target.value))}
                  className={`${fieldClass} w-28`}
                />
              </div>
            </Field>

            <fieldset className="space-y-2">
              <legend className="mb-1 text-sm font-medium">{q.fields.options}</legend>
              <Checkbox label={q.options.urgent} checked={urgent} onChange={setUrgent} />
              <Checkbox label={q.options.notarization} checked={notarization} onChange={setNotarization} />
              <Checkbox label={q.options.physicalDelivery} checked={physicalDelivery} onChange={setPhysicalDelivery} />
            </fieldset>

            <Button type="submit" intent="primary" size="lg" block>
              {q.fields.calculate}
            </Button>
          </form>

          {/* Sonuç */}
          <div aria-live="polite" className="lg:sticky lg:top-24">
            {result ? (
              <div className="rounded-lg border border-border bg-surface p-6">
                <h2 className="text-xl font-semibold">{q.result.title}</h2>
                <dl className="mt-4 space-y-2 text-sm">
                  <Row label={q.result.basePrice} value={formatCurrency(result.basePrice)} />
                  <Row label={q.result.wordPrice} value={formatCurrency(result.wordPrice)} />
                  <Row label={q.result.addons} value={formatCurrency(result.addonsPrice)} />
                  <div className="my-2 border-t border-border" />
                  <Row label="KDV" value={formatCurrency(result.tax)} />
                  <Row label={q.result.total} value={formatCurrency(result.total)} strong />
                  <Row label={q.result.delivery} value={`${result.deliveryDays} ${q.result.deliveryUnit}`} />
                </dl>
                <p className="mt-4 rounded-md bg-surface-muted p-3 text-xs text-text-secondary">
                  {q.result.disclaimer}
                </p>
                <div className="mt-4 space-y-2">
                  <Button intent="primary" block>{q.result.order}</Button>
                  {wa && (
                    <a href={wa} target="_blank" rel="noopener noreferrer">
                      <Button intent="whatsapp" block>{q.result.whatsapp}</Button>
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

function Field({
  label,
  htmlFor,
  hint,
  children,
}: {
  label: string
  htmlFor: string
  hint?: string
  children: ReactNode
}) {
  return (
    <div>
      <label htmlFor={htmlFor} className="mb-1.5 block text-sm font-medium">
        {label}
      </label>
      {children}
      {hint && <p className="mt-1 text-xs text-text-muted">{hint}</p>}
    </div>
  )
}

function Checkbox({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex min-h-[44px] cursor-pointer items-center gap-3 rounded-md border border-border px-3">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="size-4" />
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

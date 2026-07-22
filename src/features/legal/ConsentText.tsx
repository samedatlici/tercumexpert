import { Fragment, useState } from 'react'
import { Icon } from '@/components/common/Icon'
import { useI18n } from '@/hooks/useI18n'

type LegalKey = 'kvkk' | 'privacy' | 'partnership'

interface Part {
  type: 'text' | LegalKey
  value: string
}

/**
 * Onay metnini render eder; <kvkk>...</kvkk> ve <privacy>...</privacy> etiketleriyle
 * işaretli yasal terimleri tıklanabilir yapar. Tıklanınca ilgili metni açılır
 * pencerede (modal) gösterir. Terim metni dile göre değişir (Türkçe görünmez).
 */
export function ConsentText({ text, className }: { text: string; className?: string }) {
  const [openKey, setOpenKey] = useState<LegalKey | null>(null)

  const parts: Part[] = []
  const re = /<(kvkk|privacy|partnership)>([\s\S]*?)<\/\1>/g
  let last = 0
  let m: RegExpExecArray | null
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) parts.push({ type: 'text', value: text.slice(last, m.index) })
    parts.push({ type: m[1] as LegalKey, value: m[2] })
    last = m.index + m[0].length
  }
  if (last < text.length) parts.push({ type: 'text', value: text.slice(last) })

  return (
    <>
      <span className={className}>
        {parts.map((p, i) =>
          p.type === 'text' ? (
            <Fragment key={i}>{p.value}</Fragment>
          ) : (
            <button
              key={i}
              type="button"
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                setOpenKey(p.type as LegalKey)
              }}
              className="font-semibold underline underline-offset-2 hover:opacity-80"
            >
              {p.value}
            </button>
          ),
        )}
      </span>
      {openKey && <LegalModal docKey={openKey} onClose={() => setOpenKey(null)} />}
    </>
  )
}

function LegalModal({ docKey, onClose }: { docKey: LegalKey; onClose: () => void }) {
  const { dict } = useI18n()
  const doc = dict.legal[docKey]
  return (
    <div
      className="fixed inset-0 z-drawer flex items-end justify-center bg-black/40 sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label={doc.title}
      onClick={onClose}
    >
      <div
        className="flex max-h-[85vh] w-full max-w-lg flex-col overflow-hidden rounded-t-2xl bg-surface shadow-lg sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-4">
          <h2 className="text-lg font-bold">{doc.title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label={dict.quote.checkout.cancel}
            className="inline-flex size-9 shrink-0 items-center justify-center rounded-md text-text-secondary hover:bg-surface-muted"
          >
            <Icon name="X" className="size-5" />
          </button>
        </div>
        <div className="space-y-4 overflow-y-auto px-5 py-4">
          {doc.sections.map((s) => (
            <section key={s.heading}>
              <h3 className="text-sm font-semibold text-text-primary">{s.heading}</h3>
              <p className="mt-1 text-sm leading-relaxed text-text-secondary">{s.body}</p>
            </section>
          ))}
        </div>
      </div>
    </div>
  )
}

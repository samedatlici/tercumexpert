import { useMemo, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/common/Button'
import { Icon } from '@/components/common/Icon'
import { WhatsAppIcon } from '@/components/common/WhatsAppIcon'
import { PageHero } from '@/components/common/PageHero'
import { Seo } from '@/components/seo/Seo'
import { useI18n } from '@/hooks/useI18n'
import { cn } from '@/lib/cn'
import { buildPath } from '@/app/router/routes'
import { whatsappLink } from '@/app/config/site.config'

/** Türkçe metni aksan/karakter duyarsız hâle getirir; "tercume" -> "tercüme" araması için. */
function normalize(s: string): string {
  return s
    .replace(/İ/g, 'i')
    .replace(/I/g, 'ı')
    .toLowerCase()
    .replace(/ı/g, 'i')
    .replace(/ğ/g, 'g')
    .replace(/ü/g, 'u')
    .replace(/ş/g, 's')
    .replace(/ö/g, 'o')
    .replace(/ç/g, 'c')
    .replace(/â/g, 'a')
    .replace(/î/g, 'i')
    .replace(/û/g, 'u')
    .trim()
}

export default function FaqPage() {
  const { locale, dict } = useI18n()
  const f = dict.faq
  const [activeCat, setActiveCat] = useState<string>('all')
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState<Set<string>>(new Set())

  const items = useMemo(() => {
    const q = normalize(query)
    const list = [...f.items].sort((a, b) => a.priority - b.priority)
    if (q) {
      // Arama varsa tüm kategorilerde ara (soru + cevap + anahtar kelimeler)
      return list.filter((i) =>
        normalize(`${i.q} ${i.a} ${i.keywords.join(' ')}`).includes(q),
      )
    }
    return activeCat === 'all' ? list : list.filter((i) => i.category === activeCat)
  }, [activeCat, query, f.items])

  // FAQ schema yalnız gösterilen sorulardan (§21)
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((i) => ({
      '@type': 'Question',
      name: i.q,
      acceptedAnswer: { '@type': 'Answer', text: i.a },
    })),
  }

  const toggle = (key: string) =>
    setOpen((prev) => {
      const next = new Set(prev)
      next.has(key) ? next.delete(key) : next.add(key)
      return next
    })

  const wa = whatsappLink(f.whatsappMsg)

  return (
    <>
      <Seo title={f.seo.title} description={f.seo.description} routeId="faq" jsonLd={jsonLd} />
      <PageHero title={f.hero.title} subtitle={f.hero.subtitle} />

      <section className="section">
        <div className="container-base">
          {/* Arama */}
          <div className="relative mb-6">
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={f.searchPlaceholder}
              aria-label={f.searchPlaceholder}
              className="h-12 w-full rounded-md border border-border bg-surface px-4 text-base focus-visible:outline-none focus-visible:border-border-strong"
            />
          </div>

          {/* Kategori filtreleri (arama sırasında gizli) */}
          {!query && (
            <div className="mb-6 flex flex-wrap gap-2" role="tablist" aria-label={f.categoriesTitle}>
              <CategoryChip active={activeCat === 'all'} onClick={() => setActiveCat('all')}>
                {dict.blog.allCategories}
              </CategoryChip>
              {f.categories.map((c) => (
                <CategoryChip key={c.key} active={activeCat === c.key} onClick={() => setActiveCat(c.key)}>
                  {c.label}
                </CategoryChip>
              ))}
            </div>
          )}

          {/* Accordion */}
          {items.length === 0 ? (
            <p className="rounded-lg border border-border bg-surface-muted p-6 text-center text-text-secondary">
              {f.empty}
            </p>
          ) : (
            <ul className="divide-y divide-border overflow-hidden rounded-lg border border-border">
              {items.map((item) => {
                const isOpen = open.has(item.id)
                return (
                  <li key={item.id}>
                    <h2>
                      <button
                        type="button"
                        onClick={() => toggle(item.id)}
                        aria-expanded={isOpen}
                        aria-controls={`faq-${item.id}`}
                        className="flex w-full items-center justify-between gap-4 bg-surface px-5 py-4 text-start hover:bg-surface-muted"
                      >
                        <span className="font-medium">{item.q}</span>
                        <Icon name="ChevronDown" className={cn('size-5 shrink-0 transition-transform', isOpen && 'rotate-180')} />
                      </button>
                    </h2>
                    <div id={`faq-${item.id}`} role="region" hidden={!isOpen} className="bg-surface px-5 pb-4 text-sm leading-relaxed text-text-secondary">
                      {item.a}
                    </div>
                  </li>
                )
              })}
            </ul>
          )}

          {/* CTA */}
          <div className="mt-10 rounded-lg border border-border bg-surface-muted p-6 text-center">
            <p className="text-lg font-semibold">{f.notFound.title}</p>
            <div className="mt-4 flex flex-col justify-center gap-3 sm:flex-row">
              <Link to={buildPath(locale, 'contact')}>
                <Button intent="secondary">{f.notFound.contact}</Button>
              </Link>
              {wa && (
                <a href={wa} target="_blank" rel="noopener noreferrer">
                  <Button intent="whatsapp"><WhatsAppIcon className="size-5" /> {f.notFound.whatsapp}</Button>
                </a>
              )}
            </div>
          </div>
        </div>
      </section>
    </>
  )
}

function CategoryChip({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={cn(
        'min-h-[40px] rounded-md border px-3 text-sm font-medium',
        active ? 'border-secondary bg-secondary text-secondary-foreground' : 'border-border bg-surface hover:bg-surface-muted',
      )}
    >
      {children}
    </button>
  )
}

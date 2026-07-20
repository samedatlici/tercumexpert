import { useMemo, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/common/Button'
import { Icon } from '@/components/common/Icon'
import { PageHero } from '@/components/common/PageHero'
import { Seo } from '@/components/seo/Seo'
import { useI18n } from '@/hooks/useI18n'
import { cn } from '@/lib/cn'
import { buildPath } from '@/app/router/routes'
import { whatsappLink } from '@/app/config/site.config'

export default function FaqPage() {
  const { locale, dict } = useI18n()
  const f = dict.faq
  const [activeCat, setActiveCat] = useState<string>('all')
  const [open, setOpen] = useState<Set<string>>(new Set())

  const items = useMemo(
    () => (activeCat === 'all' ? f.items : f.items.filter((i) => i.category === activeCat)),
    [activeCat, f.items],
  )

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

  const wa = whatsappLink('Merhaba, bir sorum var.')

  return (
    <>
      <Seo title={f.seo.title} description={f.seo.description} routeId="faq" jsonLd={jsonLd} />
      <PageHero title={f.hero.title} subtitle={f.hero.subtitle} />

      <section className="section">
        <div className="container-base">
          {/* Kategori filtreleri */}
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

          {/* Accordion */}
          <ul className="divide-y divide-border overflow-hidden rounded-lg border border-border">
            {items.map((item) => {
              const isOpen = open.has(item.key)
              return (
                <li key={item.key}>
                  <h2>
                    <button
                      type="button"
                      onClick={() => toggle(item.key)}
                      aria-expanded={isOpen}
                      aria-controls={`faq-${item.key}`}
                      className="flex w-full items-center justify-between gap-4 bg-surface px-5 py-4 text-start hover:bg-surface-muted"
                    >
                      <span className="font-medium">{item.q}</span>
                      <Icon name="ChevronDown" className={cn('size-5 shrink-0 transition-transform', isOpen && 'rotate-180')} />
                    </button>
                  </h2>
                  <div id={`faq-${item.key}`} role="region" hidden={!isOpen} className="bg-surface px-5 pb-4 text-sm text-text-secondary">
                    {item.a}
                  </div>
                </li>
              )
            })}
          </ul>

          {/* CTA */}
          <div className="mt-10 rounded-lg border border-border bg-surface-muted p-6 text-center">
            <p className="text-lg font-semibold">{f.notFound.title}</p>
            <div className="mt-4 flex flex-col justify-center gap-3 sm:flex-row">
              <Link to={buildPath(locale, 'contact')}>
                <Button intent="primary">{f.notFound.contact}</Button>
              </Link>
              {wa && (
                <a href={wa} target="_blank" rel="noopener noreferrer">
                  <Button intent="whatsapp">{f.notFound.whatsapp}</Button>
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
        active ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-surface hover:bg-surface-muted',
      )}
    >
      {children}
    </button>
  )
}

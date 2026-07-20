import { Button } from '@/components/common/Button'
import { Icon } from '@/components/common/Icon'
import { PageHero, SectionHeading } from '@/components/common/PageHero'
import { Seo } from '@/components/seo/Seo'
import { useI18n } from '@/hooks/useI18n'
import { PARTNERSHIP, partnerEarning } from '@/app/config/partnership'

export default function PartnershipPage() {
  const { dict, formatCurrency } = useI18n()
  const p = dict.partnership

  return (
    <>
      <Seo title={p.seo.title} description={p.seo.description} routeId="partnership" />
      <PageHero title={p.hero.title} subtitle={p.hero.value}>
        <p className="mb-4 text-text-secondary">{p.hero.subtitle}</p>
        <Button intent="primary" size="lg">{p.hero.cta}</Button>
      </PageHero>

      {/* Avantajlar */}
      <section className="section">
        <div className="container-wide grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {p.advantages.items.map((a) => (
            <article key={a.key} className="rounded-lg border border-border bg-surface p-5">
              <h2 className="text-base font-semibold">{a.title}</h2>
              <p className="mt-1 text-sm text-text-secondary">{a.desc}</p>
            </article>
          ))}
        </div>
      </section>

      {/* Nasıl çalışır (timeline) */}
      <section className="section bg-surface-muted">
        <div className="container-wide">
          <SectionHeading title={p.howItWorks.title} />
          <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {p.howItWorks.steps.map((s, i) => (
              <li key={s.title} className="rounded-lg border border-border bg-surface p-5">
                <span className="text-sm font-semibold text-primary">{String(i + 1).padStart(2, '0')}</span>
                <p className="mt-1 font-semibold">{s.title}</p>
                <p className="mt-1 text-sm text-text-secondary">{s.desc}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Sektörler + komisyon */}
      <section className="section">
        <div className="container-wide grid gap-8 lg:grid-cols-2">
          <div>
            <SectionHeading title={p.sectors.title} />
            <ul className="grid grid-cols-2 gap-3">
              {p.sectors.items.map((s) => (
                <li key={s} className="flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm">
                  <Icon name="Check" className="size-4 shrink-0 text-primary" />
                  {s}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <SectionHeading title={p.commission.title} />
            <ul className="space-y-2">
              {p.commission.items.map((i) => (
                <li key={i} className="flex items-center gap-2 text-sm text-text-secondary">
                  <Icon name="Check" className="size-4 shrink-0 text-primary" />
                  {i}
                </li>
              ))}
            </ul>
            <p className="mt-3 text-xs text-text-muted">{p.commission.note}</p>

            {/* Örnek kazanç (dinamik) */}
            <div className="mt-5 rounded-lg border border-border bg-surface-muted p-5">
              <p className="font-semibold">{p.commission.exampleTitle}</p>
              <dl className="mt-3 space-y-1 text-sm">
                <div className="flex justify-between">
                  <dt className="text-text-secondary">{p.commission.exampleOrderLabel}</dt>
                  <dd>{formatCurrency(PARTNERSHIP.exampleOrderAmount)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-text-secondary">{p.commission.exampleRateLabel}</dt>
                  <dd>%{Math.round(PARTNERSHIP.commissionRate * 100)}</dd>
                </div>
                <div className="flex justify-between border-t border-border pt-1 font-semibold">
                  <dt>{p.commission.exampleEarningLabel}</dt>
                  <dd>{formatCurrency(partnerEarning(PARTNERSHIP.exampleOrderAmount))}</dd>
                </div>
              </dl>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}

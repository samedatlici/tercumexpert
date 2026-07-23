import { Link } from 'react-router-dom'
import { Button } from '@/components/common/Button'
import { Icon, type IconName } from '@/components/common/Icon'
import { PageHero, SectionHeading } from '@/components/common/PageHero'
import { Seo } from '@/components/seo/Seo'
import { useI18n } from '@/hooks/useI18n'
import { buildPath } from '@/app/router/routes'
import { PARTNERSHIP, partnerEarning } from '@/app/config/partnership'

export default function PartnershipPage() {
  const { locale, dict, formatCurrency } = useI18n()
  const p = dict.partnership
  const rate = Math.round(PARTNERSHIP.commissionRate * 100)
  const applyPath = buildPath(locale, 'partnerPanel')

  return (
    <>
      <Seo title={p.seo.title} description={p.seo.description} routeId="partnership" noindex />
      <PageHero title={p.hero.title} subtitle={p.hero.value}>
        <p className="mb-4 text-text-secondary">{p.hero.subtitle}</p>
        <Link to={applyPath}>
          <Button intent="secondary" size="lg">{p.hero.cta}</Button>
        </Link>
      </PageHero>

      {/* Partner avantajları */}
      <section className="section">
        <div className="container-wide">
          <SectionHeading title={p.advantages.title} subtitle={p.advantages.subtitle} />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {p.advantages.items.map((a) => (
              <article key={a.key} className="rounded-lg border border-border bg-surface p-6">
                <Icon name={a.icon as IconName} className="size-10 text-primary" />
                <h3 className="mt-4 text-base font-semibold">{a.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-text-secondary">{a.desc}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Nasıl çalışır */}
      <section className="section bg-surface-muted">
        <div className="container-wide">
          <SectionHeading title={p.howItWorks.title} />
          <ol className="space-y-4">
            {p.howItWorks.steps.map((s, i) => (
              <li key={s.title} className="flex gap-4 rounded-lg border border-border bg-surface p-6">
                <span className="flex size-12 shrink-0 items-center justify-center rounded-md bg-secondary text-lg font-bold text-secondary-foreground">
                  {i + 1}
                </span>
                <div>
                  <h3 className="text-lg font-semibold">{s.title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-text-secondary">{s.desc}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Hedef sektörler */}
      <section className="section">
        <div className="container-wide">
          <SectionHeading title={p.sectors.title} subtitle={p.sectors.subtitle} />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {p.sectors.items.map((s) => (
              <article key={s.key} className="rounded-lg border border-border bg-surface p-6">
                <Icon name={s.icon as IconName} className="size-10 text-primary" />
                <h3 className="mt-4 text-base font-semibold">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-text-secondary">{s.desc}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Komisyon yapısı (koyu bant) */}
      <section className="section bg-secondary text-text-inverse">
        <div className="container-base">
          <h2 className="text-center text-3xl font-bold tracking-tight">{p.commission.title}</h2>

          <div className="mt-10 grid grid-cols-1 gap-8 sm:grid-cols-3">
            <div className="text-center">
              <p className="text-5xl font-bold">%{rate}</p>
              <p className="mt-2 text-lg">{p.commission.stats.commissionLabel}</p>
              <p className="mt-1 text-sm text-white/60">{p.commission.stats.commissionSub}</p>
            </div>
            <div className="text-center">
              <p className="text-5xl font-bold">{PARTNERSHIP.paymentPeriodDays}</p>
              <p className="mt-2 text-lg">{p.commission.stats.periodUnit}</p>
              <p className="mt-1 text-sm text-white/60">{p.commission.stats.periodLabel}</p>
            </div>
            <div className="text-center">
              <p className="text-5xl font-bold">{formatCurrency(PARTNERSHIP.startupFee)}</p>
              <p className="mt-2 text-lg">{p.commission.stats.feeLabel}</p>
              <p className="mt-1 text-sm text-white/60">{p.commission.stats.feeSub}</p>
            </div>
          </div>

          {/* Örnek kazanç (dinamik) */}
          <div className="mx-auto mt-12 max-w-2xl rounded-lg border border-white/10 bg-white/5 p-6">
            <p className="text-lg font-semibold">{p.commission.exampleTitle}</p>
            <dl className="mt-4 space-y-3 text-sm">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <dt className="text-white/70">{p.commission.exampleOrderLabel}</dt>
                <dd className="font-semibold">{formatCurrency(PARTNERSHIP.exampleOrderAmount)}</dd>
              </div>
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <dt className="text-white/70">{p.commission.exampleRateLabel}</dt>
                <dd className="font-semibold">%{rate}</dd>
              </div>
              <div className="flex items-center justify-between pt-1">
                <dt className="text-base font-semibold">{p.commission.exampleEarningLabel}</dt>
                <dd className="text-2xl font-bold text-success">{formatCurrency(partnerEarning(PARTNERSHIP.exampleOrderAmount))}</dd>
              </div>
            </dl>
          </div>
          <p className="mx-auto mt-4 max-w-2xl text-center text-xs text-white/50">{p.commission.note}</p>
        </div>
      </section>

      {/* Başvuru çağrısı → partner paneli (gerçek başvuru orada) */}
      <section id="partner-basvuru" className="section scroll-mt-24">
        <div className="container-base">
          <div className="mx-auto max-w-2xl rounded-lg border border-border bg-surface p-8 text-center sm:p-10">
            <h2 className="text-3xl font-bold tracking-tight">{p.form.title}</h2>
            <p className="mx-auto mt-2 max-w-xl text-text-secondary">{p.form.subtitle}</p>
            <Link to={applyPath} className="mt-6 inline-block">
              <Button intent="secondary" size="lg">{p.hero.cta}</Button>
            </Link>
            <p className="mt-3 text-xs text-text-muted">{p.form.note}</p>
          </div>
        </div>
      </section>
    </>
  )
}

import { Link } from 'react-router-dom'
import { Button } from '@/components/common/Button'
import { Icon } from '@/components/common/Icon'
import { PageHero, SectionHeading } from '@/components/common/PageHero'
import { Seo } from '@/components/seo/Seo'
import { useI18n } from '@/hooks/useI18n'
import { buildPath } from '@/app/router/routes'
import { CORPORATE_STATS, statDisplay } from '@/app/config/statistics'

export default function CorporatePage() {
  const { locale, dict } = useI18n()
  const c = dict.corporate

  return (
    <>
      <Seo title={c.seo.title} description={c.seo.description} routeId="corporate" />
      <PageHero title={c.hero.title} subtitle={c.hero.subtitle}>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Link to={buildPath(locale, 'contact')}>
            <Button intent="primary" size="lg">{c.hero.primaryCta}</Button>
          </Link>
          <Link to={buildPath(locale, 'contact')}>
            <Button intent="outline" size="lg">{c.hero.secondaryCta}</Button>
          </Link>
        </div>
      </PageHero>

      {/* İstatistik (doğrulanmamış -> güvenli gösterim) */}
      <section className="section-sm bg-secondary text-text-inverse">
        <div className="container-wide grid grid-cols-1 gap-6 sm:grid-cols-3">
          {CORPORATE_STATS.map((s) => (
            <div key={s.key} className="text-center">
              <p className="text-3xl font-bold">{statDisplay(s)}</p>
              <p className="mt-1 text-sm opacity-80">{s.labelTr}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Özellikler */}
      <section className="section">
        <div className="container-wide">
          <SectionHeading title={c.features.title} />
          <div className="grid gap-4 md:grid-cols-3">
            {c.features.items.map((f) => (
              <article key={f.key} className="rounded-lg border border-border bg-surface p-6">
                <h3 className="text-lg font-semibold">{f.title}</h3>
                <ul className="mt-3 space-y-2">
                  {f.points.map((p) => (
                    <li key={p} className="flex items-start gap-2 text-sm text-text-secondary">
                      <Icon name="Check" className="mt-0.5 size-4 shrink-0 text-primary" />
                      {p}
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Neden kurumsal paket */}
      <section className="section bg-surface-muted">
        <div className="container-wide">
          <SectionHeading title={c.whyPackage.title} />
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {c.whyPackage.items.map((i) => (
              <li key={i} className="flex items-center gap-2 rounded-md border border-border bg-surface px-4 py-3 text-sm">
                <Icon name="Check" className="size-4 shrink-0 text-primary" />
                {i}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Ödeme seçenekleri */}
      <section className="section">
        <div className="container-wide">
          <SectionHeading title={c.payment.title} />
          <div className="grid gap-4 md:grid-cols-3">
            {c.payment.options.map((o) => (
              <article key={o.key} className="rounded-lg border border-border p-6">
                <h3 className="text-lg font-semibold">{o.title}</h3>
                <ul className="mt-3 space-y-2">
                  {o.points.map((p) => (
                    <li key={p} className="flex items-start gap-2 text-sm text-text-secondary">
                      <Icon name="Check" className="mt-0.5 size-4 shrink-0 text-primary" />
                      {p}
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
          <div className="mt-8">
            <Link to={buildPath(locale, 'contact')}>
              <Button intent="secondary" size="lg">{c.hero.primaryCta}</Button>
            </Link>
          </div>
        </div>
      </section>
    </>
  )
}

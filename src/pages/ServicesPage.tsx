import { Link } from 'react-router-dom'
import { Button } from '@/components/common/Button'
import { Icon, type IconName } from '@/components/common/Icon'
import { PageHero, SectionHeading } from '@/components/common/PageHero'
import { Seo } from '@/components/seo/Seo'
import { useI18n } from '@/hooks/useI18n'
import { buildPath } from '@/app/router/routes'
import { SERVICES } from '@/app/config/services'

export default function ServicesPage() {
  const { locale, dict } = useI18n()
  const s = dict.services

  return (
    <>
      <Seo title={s.seo.title} description={s.seo.description} routeId="services" />
      <PageHero title={s.hero.title} subtitle={s.hero.subtitle} />

      {/* Hizmet kategorileri */}
      <section className="section">
        <div className="container-wide grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[...SERVICES].map((svc) => {
            const item = dict.serviceItems[svc.id]
            return (
              <article key={svc.id} className="flex flex-col rounded-lg border border-border bg-surface p-5">
                <Icon name={svc.icon as IconName} className="size-7 text-primary" />
                <h2 className="mt-3 text-lg font-semibold">{item.name}</h2>
                <p className="mt-1 flex-1 text-sm text-text-secondary">{item.short}</p>
                <ul className="mt-3 space-y-1">
                  {item.benefits.map((b) => (
                    <li key={b} className="flex items-start gap-2 text-sm text-text-secondary">
                      <Icon name="Check" className="mt-0.5 size-4 shrink-0 text-primary" />
                      {b}
                    </li>
                  ))}
                </ul>
              </article>
            )
          })}
        </div>
      </section>

      {/* Süreç */}
      <section className="section bg-surface-muted">
        <div className="container-wide">
          <SectionHeading title={s.process.title} />
          <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {s.process.steps.map((step, i) => (
              <li key={step.title} className="rounded-lg border border-border bg-surface p-5">
                <span className="text-sm font-semibold text-primary">{String(i + 1).padStart(2, '0')}</span>
                <p className="mt-1 font-semibold">{step.title}</p>
                <p className="mt-1 text-sm text-text-secondary">{step.desc}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Teslim + Noter/Apostil + Dil çiftleri */}
      <section className="section">
        <div className="container-wide grid gap-8 lg:grid-cols-3">
          <div className="rounded-lg border border-border p-6">
            <h2 className="text-xl font-semibold">{s.delivery.title}</h2>
            <ul className="mt-4 space-y-2">
              {s.delivery.items.map((d) => (
                <li key={d} className="flex items-start gap-2 text-sm text-text-secondary">
                  <Icon name="Check" className="mt-0.5 size-4 shrink-0 text-primary" />
                  {d}
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-lg border border-border p-6">
            <h2 className="text-xl font-semibold">{s.notaryApostille.title}</h2>
            <p className="mt-4 text-sm leading-relaxed text-text-secondary">{s.notaryApostille.desc}</p>
          </div>
          <div className="rounded-lg border border-border p-6">
            <h2 className="text-xl font-semibold">{s.fullService.title}</h2>
            <p className="mt-4 text-sm leading-relaxed text-text-secondary">{s.fullService.note}</p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="section-sm bg-secondary text-text-inverse">
        <div className="container-wide text-center">
          <h2 className="text-3xl font-bold">{s.cta.title}</h2>
          <p className="mx-auto mt-3 max-w-prose opacity-80">{s.cta.desc}</p>
          <div className="mt-6">
            <Link to={buildPath(locale, 'quote')}>
              <Button intent="primary" size="lg">{dict.common.actions.calculatePrice}</Button>
            </Link>
          </div>
        </div>
      </section>
    </>
  )
}

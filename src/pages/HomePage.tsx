import { Link } from 'react-router-dom'
import { Button } from '@/components/common/Button'
import { Icon, type IconName } from '@/components/common/Icon'
import { Seo } from '@/components/seo/Seo'
import { useI18n } from '@/hooks/useI18n'
import { buildPath } from '@/app/router/routes'
import { SERVICES } from '@/app/config/services'
import { STATISTICS, statDisplay } from '@/app/config/statistics'

export default function HomePage() {
  const { locale, dict } = useI18n()
  const home = dict.home
  const featured = SERVICES.filter((s) => s.homeFeatured)

  return (
    <>
      <Seo title={home.seo.title} description={home.seo.description} routeId="home" />

      {/* Hero */}
      <section className="section-sm bg-surface">
        <div className="container-wide grid items-center gap-10 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <p className="mb-4 inline-flex items-center gap-2 rounded-md border border-border px-3 py-1 text-sm text-text-secondary">
              <Icon name="ShieldCheck" className="size-4 text-primary" />
              {home.hero.support}
            </p>
            <h1 className="text-5xl font-bold tracking-tight text-text-primary">{home.hero.title}</h1>
            <p className="mt-4 max-w-prose text-lg text-text-secondary">{home.hero.subtitle}</p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Link to={buildPath(locale, 'quote')} className="sm:w-auto">
                <Button intent="primary" size="lg" block>
                  <Icon name="Upload" className="size-5" /> {dict.common.actions.uploadDocument}
                </Button>
              </Link>
              <div className="grid grid-cols-2 gap-3 sm:flex">
                <Link to={buildPath(locale, 'quote')}>
                  <Button intent="outline" size="lg" block>
                    {dict.common.actions.calculatePrice}
                  </Button>
                </Link>
                <Link to={buildPath(locale, 'contact')}>
                  <Button intent="whatsapp" size="lg" block>
                    {dict.common.actions.whatsapp}
                  </Button>
                </Link>
              </div>
            </div>
          </div>
          {/* Soyut belge motifi (görsel yerine geometrik desen — §27) */}
          <div aria-hidden="true" className="hidden lg:block">
            <div className="relative aspect-[4/3] rounded-lg border border-border bg-surface-muted p-6">
              <div className="grid h-full grid-cols-6 grid-rows-6 gap-2 opacity-70">
                {Array.from({ length: 36 }).map((_, i) => (
                  <div key={i} className="rounded-sm border border-border" />
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Güven maddeleri */}
      <section className="border-y border-border bg-surface-muted py-6">
        <div className="container-wide grid grid-cols-2 gap-4 md:grid-cols-4">
          {home.trust.items.map((t) => (
            <div key={t.key} className="flex items-center gap-2 text-sm font-medium text-text-secondary">
              <Icon name="Check" className="size-4 shrink-0 text-primary" />
              {t.label}
            </div>
          ))}
        </div>
      </section>

      {/* Nasıl çalışır */}
      <section className="section">
        <div className="container-wide">
          <SectionHeading title={home.howItWorks.title} subtitle={home.howItWorks.subtitle} />
          <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {home.howItWorks.steps.map((step, i) => (
              <li key={step.key} className="rounded-lg border border-border bg-surface p-5">
                <span className="text-sm font-semibold text-primary">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <p className="mt-1 font-semibold">{step.title}</p>
                <p className="mt-1 text-sm text-text-secondary">{step.desc}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Hizmetler (öne çıkan) */}
      <section className="section bg-surface-muted">
        <div className="container-wide">
          <SectionHeading title={home.services.title} subtitle={home.services.subtitle} />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {featured.map((s) => {
              const item = dict.serviceItems[s.id]
              return (
                <article key={s.id} className="flex flex-col rounded-lg border border-border bg-surface p-5">
                  <Icon name={s.icon as IconName} className="size-7 text-primary" />
                  <h3 className="mt-3 text-lg font-semibold">{item.name}</h3>
                  <p className="mt-1 flex-1 text-sm text-text-secondary">{item.short}</p>
                  <Link
                    to={buildPath(locale, 'services')}
                    className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
                  >
                    {dict.common.actions.learnMore} <Icon name="ArrowRight" className="size-4" />
                  </Link>
                </article>
              )
            })}
          </div>
          <div className="mt-6 text-center">
            <Link to={buildPath(locale, 'services')}>
              <Button intent="outline">{dict.common.actions.viewAll}</Button>
            </Link>
          </div>
        </div>
      </section>

      {/* İstatistik (siyah alan) — doğrulanmamış değerler ham iddia gösterilmez */}
      <section className="section-sm bg-secondary text-text-inverse">
        <div className="container-wide">
          <h2 className="sr-only">{home.stats.title}</h2>
          <div className="grid grid-cols-2 gap-6 lg:grid-cols-4">
            {STATISTICS.map((s) => (
              <div key={s.key} className="text-center">
                <p className="text-3xl font-bold">{statDisplay(s)}</p>
                <p className="mt-1 text-sm opacity-80">{s.labelTr}</p>
              </div>
            ))}
          </div>
          <p className="mt-6 text-center text-xs opacity-60">{home.stats.note}</p>
        </div>
      </section>

      {/* Kurumsal CTA */}
      <section className="section">
        <div className="container-wide rounded-lg border border-border bg-surface p-8 lg:p-12">
          <div className="grid items-center gap-6 lg:grid-cols-[1.5fr_1fr]">
            <div>
              <h2 className="text-3xl font-bold">{home.corporateCta.title}</h2>
              <p className="mt-3 max-w-prose text-text-secondary">{home.corporateCta.desc}</p>
            </div>
            <div className="lg:justify-self-end">
              <Link to={buildPath(locale, 'corporate')}>
                <Button intent="secondary" size="lg">
                  {home.corporateCta.action}
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Son CTA */}
      <section className="section-sm bg-surface-muted">
        <div className="container-wide text-center">
          <h2 className="text-3xl font-bold">{home.finalCta.title}</h2>
          <p className="mx-auto mt-3 max-w-prose text-text-secondary">{home.finalCta.desc}</p>
          <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
            <Link to={buildPath(locale, 'quote')}>
              <Button intent="primary" size="lg">{dict.common.actions.calculatePrice}</Button>
            </Link>
            <Link to={buildPath(locale, 'contact')}>
              <Button intent="outline" size="lg">{dict.common.actions.contactUs}</Button>
            </Link>
          </div>
        </div>
      </section>
    </>
  )
}

function SectionHeading({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-8 max-w-2xl">
      <h2 className="text-3xl font-bold tracking-tight">{title}</h2>
      {subtitle && <p className="mt-2 text-text-secondary">{subtitle}</p>}
    </div>
  )
}

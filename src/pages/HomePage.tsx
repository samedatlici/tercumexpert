import { Link } from 'react-router-dom'
import { Button } from '@/components/common/Button'
import { Icon, type IconName } from '@/components/common/Icon'
import { WhatsAppIcon } from '@/components/common/WhatsAppIcon'
import { Seo } from '@/components/seo/Seo'
import { useI18n } from '@/hooks/useI18n'
import { buildPath } from '@/app/router/routes'
import { SERVICES } from '@/app/config/services'
import { STATISTICS, CORPORATE_STATS, statDisplay } from '@/app/config/statistics'
import { whatsappLink } from '@/app/config/site.config'

const HOW_ICONS: Record<string, IconName> = {
  upload: 'Upload',
  select: 'Settings',
  confirm: 'CircleCheck',
  track: 'Activity',
  receive: 'PackageCheck',
}
const WHY_ICONS: Record<string, IconName> = {
  autoQuote: 'TrendingUp',
  whatsapp: 'MessageSquare',
  terminology: 'Languages',
  revision: 'CircleCheck',
  languages: 'Globe',
  terms: 'Building2',
}
const TEASER_ICONS: Record<string, IconName> = { commission: 'Wallet', qr: 'QrCode' }

export default function HomePage() {
  const { locale, dict } = useI18n()
  const home = dict.home
  const wa = whatsappLink('Merhaba, çeviri hizmeti hakkında bilgi almak istiyorum.')

  return (
    <>
      <Seo title={home.seo.title} description={home.seo.description} routeId="home" />

      {/* ============ HERO ============ */}
      <section className="section-sm bg-surface">
        <div className="container-base flex flex-col items-center text-center">
          <p className="mb-5 inline-flex items-center gap-2 rounded-md border border-border px-3 py-1.5 text-sm font-medium text-text-secondary">
            <Icon name="ShieldCheck" className="size-4 text-primary" />
            {home.hero.support}
          </p>
          <h1 className="max-w-4xl text-5xl font-extrabold leading-tight tracking-tight md:text-6xl">
            {home.hero.title} <span className="text-text-secondary">{home.hero.titleAccent}</span>
          </h1>
          <p className="mt-5 max-w-xl text-lg text-text-secondary">{home.hero.subtitle}</p>

          <div className="mt-8 flex w-full max-w-2xl flex-col gap-3 sm:flex-row sm:justify-center">
            <Link to={buildPath(locale, 'quote')} className="sm:w-auto">
              <Button intent="secondary" size="lg" block>
                <Icon name="Upload" className="size-5" /> {dict.common.actions.uploadDocument}
              </Button>
            </Link>
            {wa && (
              <a href={wa} target="_blank" rel="noopener noreferrer" className="sm:w-auto">
                <Button intent="whatsapp" size="lg" block>
                  <WhatsAppIcon className="size-5" /> WhatsApp
                </Button>
              </a>
            )}
            <Link to={buildPath(locale, 'quote')} className="sm:w-auto">
              <Button intent="primary" size="lg" block>
                {dict.common.actions.calculatePrice}
              </Button>
            </Link>
          </div>

          <ul className="mt-10 grid w-full max-w-3xl grid-cols-2 gap-4 md:grid-cols-4">
            {home.trust.items.map((t) => (
              <li key={t.key} className="flex items-center justify-center gap-2 text-sm font-medium text-text-secondary">
                <Icon name="CircleCheck" className="size-5 shrink-0 text-success" />
                {t.label}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ============ STATS (siyah bant) ============ */}
      <section className="bg-secondary py-14 text-text-inverse">
        <div className="container-wide grid grid-cols-2 gap-8 lg:grid-cols-4">
          {STATISTICS.map((s) => (
            <div key={s.key} className="flex flex-col items-center text-center">
              <Icon name={(s.icon ?? 'BarChart3') as IconName} className="mb-3 size-12 opacity-90" />
              <p className="text-4xl font-extrabold">{statDisplay(s)}</p>
              <p className="mt-1 text-sm opacity-70">{s.labelTr}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ============ NASIL ÇALIŞIR ============ */}
      <section className="section">
        <div className="container-wide">
          <SectionHead title={home.howItWorks.title} subtitle={home.howItWorks.subtitle} />
          <ol className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
            {home.howItWorks.steps.map((step, i) => (
              <li key={step.key} className="flex flex-col items-center rounded-lg border border-border bg-surface p-5 text-center">
                <Icon name={HOW_ICONS[step.key] ?? 'FileText'} className="size-12 text-primary" />
                <span className="mt-3 text-lg font-bold">{i + 1}</span>
                <p className="mt-1 font-semibold">{step.title}</p>
                <p className="mt-1 text-sm text-text-secondary">{step.desc}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ============ HİZMETLER (8 kart) ============ */}
      <section className="section bg-surface-muted">
        <div className="container-wide">
          <SectionHead title={home.services.title} subtitle={home.services.subtitle} />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[...SERVICES].map((s) => {
              const item = dict.serviceItems[s.id]
              return (
                <article key={s.id} className="flex flex-col rounded-lg border border-border bg-surface p-6">
                  <Icon name={s.icon as IconName} className="size-12 text-primary" />
                  <h3 className="mt-4 text-lg font-bold">{item.name}</h3>
                  <p className="mt-2 text-sm text-text-secondary">{item.short}</p>
                  <ul className="mt-3 flex-1 space-y-1.5">
                    {item.benefits.map((b) => (
                      <li key={b} className="flex items-start gap-2 text-sm text-text-secondary">
                        <Icon name="CircleCheck" className="mt-0.5 size-4 shrink-0 text-success" />
                        {b}
                      </li>
                    ))}
                  </ul>
                  <div className="mt-5 flex gap-2">
                    <Link to={buildPath(locale, 'services')} className="flex-1">
                      <Button intent="secondary" size="sm" block>
                        {dict.common.actions.learnMore}
                      </Button>
                    </Link>
                    <Link to={buildPath(locale, 'quote')} className="flex-1">
                      <Button intent="primary" size="sm" block>
                        {dict.common.actions.getQuote}
                      </Button>
                    </Link>
                  </div>
                </article>
              )
            })}
          </div>
        </div>
      </section>

      {/* ============ NEDEN TERCÜMEXPERT (çizgi ikon) ============ */}
      <section className="section">
        <div className="container-wide">
          <SectionHead title={home.why.title} subtitle="Rakiplerimizden bizi ayıran özellikler" />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {home.why.features.map((f) => (
              <article key={f.key} className="rounded-lg border border-border bg-surface p-6">
                {f.key === 'whatsapp' ? (
                  <WhatsAppIcon className="size-12" />
                ) : (
                  <Icon name={WHY_ICONS[f.key] ?? 'CircleCheck'} className="size-12" />
                )}
                <h3 className="mt-4 text-lg font-bold">{f.title}</h3>
                <p className="mt-2 text-sm text-text-secondary">{f.desc}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ============ KURUMSAL (siyah bant) ============ */}
      <section className="bg-secondary py-16 text-text-inverse lg:py-20">
        <div className="container-base flex flex-col items-center text-center">
          <h2 className="text-3xl font-bold md:text-4xl">{home.corporateCta.title}</h2>
          <p className="mt-3 max-w-2xl opacity-80">{home.corporateCta.desc}</p>
          <div className="mt-8 grid w-full max-w-2xl grid-cols-3 gap-6">
            {CORPORATE_STATS.map((s) => (
              <div key={s.key}>
                <p className="text-3xl font-extrabold">{statDisplay(s)}</p>
                <p className="mt-1 text-sm opacity-70">{s.labelTr}</p>
              </div>
            ))}
          </div>
          <Link to={buildPath(locale, 'corporate')} className="mt-8">
            <Button intent="primary" size="lg">{home.corporateCta.action}</Button>
          </Link>
        </div>
      </section>

      {/* ============ İŞ ORTAKLIĞI TEASER ============ */}
      <section className="section bg-surface-muted">
        <div className="container-base">
          <SectionHead title={home.partnershipTeaser.title} subtitle={home.partnershipTeaser.subtitle} />
          <div className="mx-auto grid max-w-3xl gap-4 sm:grid-cols-2">
            {home.partnershipTeaser.items.map((i) => (
              <article key={i.key} className="rounded-lg border border-border bg-surface p-6">
                <Icon name={TEASER_ICONS[i.key] ?? 'Wallet'} className="size-12 text-primary" />
                <h3 className="mt-4 text-lg font-bold">{i.title}</h3>
                <p className="mt-2 text-sm text-text-secondary">{i.desc}</p>
              </article>
            ))}
          </div>
          <div className="mt-8 text-center">
            <Link to={buildPath(locale, 'partnership')}>
              <Button intent="secondary" size="lg">{home.partnershipTeaser.cta}</Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ============ FINAL CTA (siyah bant) ============ */}
      <section className="bg-secondary py-16 text-text-inverse lg:py-20">
        <div className="container-base flex flex-col items-center text-center">
          <h2 className="text-3xl font-bold md:text-4xl">{home.finalCta.title}</h2>
          <p className="mt-3 max-w-2xl opacity-80">{home.finalCta.desc}</p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link to={buildPath(locale, 'quote')}>
              <Button intent="primary" size="lg">{home.finalCta.primary}</Button>
            </Link>
            <Link to={buildPath(locale, 'contact')}>
              <Button intent="outline" size="lg" className="border-white/40 bg-transparent text-text-inverse hover:bg-white/10">
                {home.finalCta.secondary}
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </>
  )
}

function SectionHead({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mx-auto mb-10 max-w-2xl text-center">
      <h2 className="text-3xl font-bold tracking-tight md:text-4xl">{title}</h2>
      {subtitle && <p className="mt-3 text-text-secondary">{subtitle}</p>}
    </div>
  )
}

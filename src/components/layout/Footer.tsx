import { Link } from 'react-router-dom'
import { Icon } from '@/components/common/Icon'
import { useI18n } from '@/hooks/useI18n'
import { company, siteConfig } from '@/app/config/site.config'
import { buildPath, type RouteId } from '@/app/router/routes'

const isPlaceholder = (v: string) => v.trim().startsWith('[')

/**
 * Çok sütunlu footer (§9). Mobilde kompakt; hukuk linkleri 2 sütun; safe-area padding.
 * Emergent branding YOK (§32). İletişim değerleri yalnız doğrulanmışsa gösterilir.
 */
export function Footer() {
  const { locale, dict } = useI18n()
  const year = new Date().getFullYear()

  const quickLinks: { label: string; routeId: RouteId }[] = [
    { label: dict.footer.quickLinks.corporate, routeId: 'corporate' },
    { label: dict.footer.quickLinks.services, routeId: 'services' },
    { label: dict.footer.quickLinks.quote, routeId: 'quote' },
    { label: dict.footer.quickLinks.blog, routeId: 'blog' },
    { label: dict.footer.quickLinks.faq, routeId: 'faq' },
    { label: dict.footer.quickLinks.contact, routeId: 'contact' },
  ]

  const legalLinks: { label: string; routeId: RouteId }[] = [
    { label: dict.footer.legal.kvkk, routeId: 'legalKvkk' },
    { label: dict.footer.legal.privacy, routeId: 'legalPrivacy' },
    { label: dict.footer.legal.distanceSales, routeId: 'legalDistanceSales' },
    { label: dict.footer.legal.cookies, routeId: 'legalCookies' },
  ]

  const socials = [
    { key: 'facebook', url: siteConfig.social.facebook, label: 'Facebook' },
    { key: 'x', url: siteConfig.social.x, label: 'X' },
    { key: 'linkedin', url: siteConfig.social.linkedin, label: 'LinkedIn' },
    { key: 'instagram', url: siteConfig.social.instagram, label: 'Instagram' },
  ].filter((s) => s.url)

  return (
    <footer className="mt-auto border-t border-border bg-surface-muted">
      <div className="container-wide grid gap-8 py-12 sm:grid-cols-2 lg:grid-cols-4 lg:py-16">
        {/* Marka + sosyal */}
        <div className="sm:col-span-2 lg:col-span-1">
          <p className="text-lg font-bold">{dict.common.brand}</p>
          <p className="mt-2 max-w-xs text-sm text-text-secondary">{dict.footer.tagline}</p>
          {socials.length > 0 && (
            <ul className="mt-4 flex gap-2">
              {socials.map((s) => (
                <li key={s.key}>
                  <a
                    href={s.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex size-10 items-center justify-center rounded-md border border-border hover:bg-surface"
                    aria-label={s.label}
                  >
                    <span className="text-xs font-semibold">{s.label.slice(0, 2)}</span>
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Hızlı bağlantılar */}
        <nav aria-label={dict.footer.columns.quickLinks}>
          <p className="mb-3 text-sm font-semibold">{dict.footer.columns.quickLinks}</p>
          <ul className="space-y-2 text-sm text-text-secondary">
            {quickLinks.map((l) => (
              <li key={l.routeId}>
                <Link to={buildPath(locale, l.routeId)} className="hover:text-text-primary">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* Hizmetler */}
        <nav aria-label={dict.footer.columns.services}>
          <p className="mb-3 text-sm font-semibold">{dict.footer.columns.services}</p>
          <ul className="space-y-2 text-sm text-text-secondary">
            <li><Link to={buildPath(locale, 'services')} className="hover:text-text-primary">{dict.footer.serviceLinks.sworn}</Link></li>
            <li><Link to={buildPath(locale, 'services')} className="hover:text-text-primary">{dict.footer.serviceLinks.notarized}</Link></li>
            <li><Link to={buildPath(locale, 'services')} className="hover:text-text-primary">{dict.footer.serviceLinks.apostille}</Link></li>
            <li><Link to={buildPath(locale, 'corporate')} className="hover:text-text-primary">{dict.footer.serviceLinks.corporate}</Link></li>
            <li><Link to={buildPath(locale, 'partnership')} className="hover:text-text-primary">{dict.footer.serviceLinks.partnership}</Link></li>
          </ul>
        </nav>

        {/* İletişim */}
        <div>
          <p className="mb-3 text-sm font-semibold">{dict.footer.columns.contact}</p>
          <ul className="space-y-2 text-sm text-text-secondary">
            {!isPlaceholder(company.address.value) && (
              <li className="flex gap-2"><Icon name="MapPin" className="mt-0.5 size-4 shrink-0" />{company.address.value}</li>
            )}
            {!isPlaceholder(company.phone.value) && (
              <li><a href={`tel:${company.phone.value}`} className="inline-flex items-center gap-2 hover:text-text-primary"><Icon name="Phone" className="size-4" />{company.phone.value}</a></li>
            )}
            {!isPlaceholder(company.email.value) && (
              <li><a href={`mailto:${company.email.value}`} className="inline-flex items-center gap-2 hover:text-text-primary"><Icon name="Mail" className="size-4" />{company.email.value}</a></li>
            )}
            <li className="text-text-muted">{company.workingHours.value}</li>
          </ul>
        </div>
      </div>

      {/* Alt bar: hukuk + telif (safe-area) */}
      <div className="border-t border-border">
        <div
          className="container-wide flex flex-col gap-3 py-5 text-sm text-text-secondary sm:flex-row sm:items-center sm:justify-between"
          style={{ paddingBottom: 'max(1.25rem, env(safe-area-inset-bottom))' }}
        >
          <ul className="grid grid-cols-2 gap-x-6 gap-y-2 sm:flex sm:flex-wrap">
            {legalLinks.map((l) => (
              <li key={l.routeId}>
                <Link to={buildPath(locale, l.routeId)} className="hover:text-text-primary">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
          <p className="text-text-muted">
            © {year} {dict.common.brand}. {dict.footer.rights}
          </p>
        </div>
      </div>
    </footer>
  )
}

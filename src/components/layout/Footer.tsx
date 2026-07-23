import { Link } from 'react-router-dom'
import { Icon } from '@/components/common/Icon'
import { WhatsAppIcon } from '@/components/common/WhatsAppIcon'
import { Button } from '@/components/common/Button'
import { useI18n } from '@/hooks/useI18n'
import { company, siteConfig, whatsappLink } from '@/app/config/site.config'
import { buildPath, type RouteId } from '@/app/router/routes'

/**
 * Siyah çok sütunlu footer (§9). Emergent branding YOK (§32). Mobilde kompakt;
 * hukuk linkleri alt barda; safe-area padding. İletişim değerleri DEMO/placeholder.
 */
export function Footer() {
  const { locale, dict } = useI18n()
  const year = new Date().getFullYear()
  const wa = whatsappLink('Merhaba, destek almak istiyorum.')

  const quickLinks: { label: string; routeId: RouteId }[] = [
    { label: dict.footer.quickLinks.corporate, routeId: 'corporate' },
    { label: dict.footer.quickLinks.services, routeId: 'services' },
    { label: dict.footer.quickLinks.quote, routeId: 'quote' },
    { label: dict.footer.quickLinks.blog, routeId: 'blog' },
    { label: dict.footer.quickLinks.faq, routeId: 'faq' },
    { label: dict.footer.quickLinks.contact, routeId: 'contact' },
  ]
  const serviceLinks: { label: string; routeId: RouteId }[] = [
    { label: dict.footer.serviceLinks.sworn, routeId: 'services' },
    { label: dict.footer.serviceLinks.notarized, routeId: 'services' },
    { label: dict.footer.serviceLinks.apostille, routeId: 'services' },
    { label: dict.footer.serviceLinks.corporate, routeId: 'corporate' },
    // 'partnership' (İş Ortaklığı Programı) footer'dan kaldırıldı — sayfa gizli, yalnız doğrudan bağlantıyla.
  ]
  const legalLinks: { label: string; routeId: RouteId }[] = [
    { label: dict.footer.legal.kvkk, routeId: 'legalKvkk' },
    { label: dict.footer.legal.privacy, routeId: 'legalPrivacy' },
    { label: dict.footer.legal.distanceSales, routeId: 'legalDistanceSales' },
    { label: dict.footer.legal.cookies, routeId: 'legalCookies' },
  ]
  // Sosyal ikonlar inline SVG (Lucide marka ikonlarını kaldırdı). X = güncel logo.
  const socials: { key: string; url: string; label: string; path: string }[] = [
    {
      key: 'facebook',
      url: siteConfig.social.facebook,
      label: 'Facebook',
      path: 'M24 12.07C24 5.4 18.63 0 12 0S0 5.4 0 12.07C0 18.1 4.39 23.1 10.13 24v-8.44H7.08v-3.49h3.05V9.41c0-3.02 1.79-4.68 4.53-4.68 1.31 0 2.68.23 2.68.23v2.97h-1.51c-1.49 0-1.95.93-1.95 1.88v2.26h3.32l-.53 3.49h-2.79V24C19.61 23.1 24 18.1 24 12.07',
    },
    {
      key: 'x',
      url: siteConfig.social.x,
      label: 'X',
      path: 'M18.9 1.5h3.68l-8.04 9.19L24 22.5h-7.41l-5.8-7.58-6.64 7.58H.47l8.6-9.83L0 1.5h7.59l5.24 6.93L18.9 1.5Zm-1.29 18.8h2.04L6.49 3.6H4.3L17.61 20.3Z',
    },
    {
      key: 'linkedin',
      url: siteConfig.social.linkedin,
      label: 'LinkedIn',
      path: 'M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.13 1.45-2.13 2.94v5.67H9.35V9h3.42v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.45v6.29ZM5.34 7.43a2.06 2.06 0 1 1 0-4.12 2.06 2.06 0 0 1 0 4.12ZM7.12 20.45H3.55V9h3.57v11.45ZM22.22 0H1.77C.79 0 0 .77 0 1.72v20.56C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.72V1.72C24 .77 23.2 0 22.22 0Z',
    },
    {
      key: 'instagram',
      url: siteConfig.social.instagram,
      label: 'Instagram',
      path: 'M12 2.16c3.2 0 3.58.01 4.85.07 1.17.05 1.8.25 2.23.41.56.22.96.48 1.38.9.42.42.68.82.9 1.38.16.42.36 1.06.41 2.23.06 1.27.07 1.65.07 4.85s-.01 3.58-.07 4.85c-.05 1.17-.25 1.8-.41 2.23-.22.56-.48.96-.9 1.38-.42.42-.82.68-1.38.9-.42.16-1.06.36-2.23.41-1.27.06-1.65.07-4.85.07s-3.58-.01-4.85-.07c-1.17-.05-1.8-.25-2.23-.41a3.7 3.7 0 0 1-1.38-.9 3.7 3.7 0 0 1-.9-1.38c-.16-.42-.36-1.06-.41-2.23-.06-1.27-.07-1.65-.07-4.85s.01-3.58.07-4.85c.05-1.17.25-1.8.41-2.23.22-.56.48-.96.9-1.38.42-.42.82-.68 1.38-.9.43-.16 1.06-.36 2.23-.41C8.42 2.17 8.8 2.16 12 2.16Zm0 1.95c-3.15 0-3.5.01-4.75.07-1.15.05-1.77.24-2.19.4-.55.21-.94.47-1.35.88-.41.41-.67.8-.88 1.35-.16.42-.35 1.04-.4 2.19-.06 1.25-.07 1.6-.07 4.75s.01 3.5.07 4.75c.05 1.15.24 1.77.4 2.19.21.55.47.94.88 1.35.41.41.8.67 1.35.88.42.16 1.04.35 2.19.4 1.25.06 1.6.07 4.75.07s3.5-.01 4.75-.07c1.15-.05 1.77-.24 2.19-.4.55-.21.94-.47 1.35-.88.41-.41.67-.8.88-1.35.16-.42.35-1.04.4-2.19.06-1.25.07-1.6.07-4.75s-.01-3.5-.07-4.75c-.05-1.15-.24-1.77-.4-2.19a3.6 3.6 0 0 0-.88-1.35 3.6 3.6 0 0 0-1.35-.88c-.42-.16-1.04-.35-2.19-.4-1.25-.06-1.6-.07-4.75-.07Zm0 3.32a4.57 4.57 0 1 1 0 9.14 4.57 4.57 0 0 1 0-9.14Zm0 7.54a2.97 2.97 0 1 0 0-5.94 2.97 2.97 0 0 0 0 5.94Zm5.82-7.74a1.07 1.07 0 1 1-2.14 0 1.07 1.07 0 0 1 2.14 0Z',
    },
  ].filter((s) => s.url)

  return (
    <footer className="mt-auto bg-secondary text-white">
      <div className="container-wide grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-4 lg:py-16">
        {/* Marka + sosyal */}
        <div>
          <p className="text-xl font-extrabold">{dict.common.brand}</p>
          <p className="mt-3 max-w-xs text-sm text-white/60">{dict.footer.tagline}</p>
          {socials.length > 0 && (
            <ul className="mt-5 flex gap-3">
              {socials.map((s) => (
                <li key={s.key}>
                  <a
                    href={s.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex size-10 items-center justify-center rounded-md text-white/70 transition-colors hover:bg-white/10 hover:text-white"
                    aria-label={s.label}
                  >
                    {s.key === 'instagram' ? (
                      // Instagram: kalın (stroked) çizim — diğerleriyle görsel ağırlık dengesi
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={2.2}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="size-5"
                        aria-hidden="true"
                      >
                        <rect x="2" y="2" width="20" height="20" rx="5.5" />
                        <circle cx="12" cy="12" r="4.2" />
                        <circle cx="17.7" cy="6.3" r="0.9" fill="currentColor" stroke="none" />
                      </svg>
                    ) : (
                      <svg viewBox="0 0 24 24" fill="currentColor" className="size-5" aria-hidden="true">
                        <path d={s.path} />
                      </svg>
                    )}
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Hızlı bağlantılar */}
        <nav aria-label={dict.footer.columns.quickLinks}>
          <p className="mb-4 font-bold">{dict.footer.columns.quickLinks}</p>
          <ul className="space-y-3 text-sm text-white/60">
            {quickLinks.map((l) => (
              <li key={l.label}>
                <Link to={buildPath(locale, l.routeId)} className="hover:text-white">{l.label}</Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* Hizmetler */}
        <nav aria-label={dict.footer.columns.services}>
          <p className="mb-4 font-bold">{dict.footer.columns.services}</p>
          <ul className="space-y-3 text-sm text-white/60">
            {serviceLinks.map((l) => (
              <li key={l.label}>
                <Link to={buildPath(locale, l.routeId)} className="hover:text-white">{l.label}</Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* İletişim */}
        <div>
          <p className="mb-4 font-bold">{dict.footer.columns.contact}</p>
          <ul className="space-y-3 text-sm text-white/60">
            <li className="flex items-start gap-2"><Icon name="MapPin" className="mt-0.5 size-4 shrink-0" />{company.address.value}</li>
            <li><a href={`tel:${company.phone.value}`} className="inline-flex items-center gap-2 hover:text-white"><Icon name="Phone" className="size-4" /><span dir="ltr">{company.phone.value}</span></a></li>
            <li><a href={`mailto:${company.email.value}`} className="inline-flex items-center gap-2 hover:text-white"><Icon name="Mail" className="size-4" />{company.email.value}</a></li>
          </ul>
          {wa && (
            <a href={wa} target="_blank" rel="noopener noreferrer" className="mt-4 block">
              <Button intent="whatsapp" block>
                <WhatsAppIcon className="size-5" /> {dict.footer.whatsapp}
              </Button>
            </a>
          )}
        </div>
      </div>

      {/* Alt bar */}
      <div className="border-t border-white/10">
        <div
          className="container-wide flex flex-col gap-3 py-5 text-sm text-white/50 sm:flex-row sm:items-center sm:justify-between"
          style={{ paddingBottom: 'max(1.25rem, env(safe-area-inset-bottom))' }}
        >
          <p>© {year} {dict.common.brand}. {dict.footer.rights}</p>
          <ul className="grid grid-cols-2 gap-x-6 gap-y-2 sm:flex sm:flex-wrap">
            {legalLinks.map((l) => (
              <li key={l.label}>
                <Link to={buildPath(locale, l.routeId)} className="hover:text-white">{l.label}</Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </footer>
  )
}

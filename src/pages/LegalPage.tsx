import { useLocation, useParams } from 'react-router-dom'
import { PageHero } from '@/components/common/PageHero'
import { Seo } from '@/components/seo/Seo'
import { useI18n } from '@/hooks/useI18n'
import { isLocale, type Locale } from '@/app/config/locales'
import { resolveRouteId, type RouteId } from '@/app/router/routes'

const LEGAL_MAP = {
  legalKvkk: 'kvkk',
  legalPrivacy: 'privacy',
  legalDistanceSales: 'distanceSales',
  legalCookies: 'cookies',
} as const

type LegalRouteId = keyof typeof LEGAL_MAP

/**
 * Legal sayfaları (§19). Taslak yapı; şirket bilgileri ve nihai metin DOĞRULANMAMIŞ
 * -> draftNotice gösterilir, checklist'te takip edilir. Avukat onayı gerektirir.
 */
export default function LegalPage() {
  const { locale, dict } = useI18n()
  const { lang } = useParams()
  const location = useLocation()

  const activeLang: Locale = isLocale(lang) ? lang : locale
  const splat = location.pathname.replace(new RegExp(`^/${activeLang}/?`), '')
  const routeId = (resolveRouteId(activeLang, splat)?.routeId ?? 'legalKvkk') as RouteId
  const legalKey = LEGAL_MAP[routeId as LegalRouteId] ?? 'kvkk'
  const doc = dict.legal[legalKey]

  return (
    <>
      <Seo title={doc.seo.title} description={doc.seo.description} routeId={routeId} />
      <PageHero title={doc.title} />
      <section className="section">
        <div className="container-narrow">
          <div className="mb-6 rounded-md border border-warning/40 bg-warning/10 p-4 text-sm text-text-secondary">
            {dict.legal.draftNotice}
          </div>
          <div className="space-y-6">
            {doc.sections.map((s) => (
              <section key={s.heading}>
                <h2 className="text-xl font-semibold">{s.heading}</h2>
                <p className="mt-2 text-text-secondary">{s.body}</p>
              </section>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}

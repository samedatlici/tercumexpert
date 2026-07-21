import { useTranslation } from 'react-i18next'

/**
 * Hizmetler — İSKELET. Derin/kategorize hizmet detayları tasarım aşamasında (PROJECT_RULES §13).
 */
export default function ServicesPage() {
  const { t } = useTranslation()
  return (
    <section className="container py-24">
      <h1 className="text-4xl font-bold tracking-tight">{t('nav.services')}</h1>
      <p className="mt-4 max-w-prose text-muted-foreground">
        Hizmet kategorileri (yeminli, teknik, hukuki, tıbbi, akademik, lokalizasyon…) burada
        detaylanacak.
      </p>
    </section>
  )
}

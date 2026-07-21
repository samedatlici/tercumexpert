import { useTranslation } from 'react-i18next'

/**
 * İletişim — İSKELET. İletişim formu (RHF + Zod) tasarım aşamasında eklenecek.
 */
export default function ContactPage() {
  const { t } = useTranslation()
  return (
    <section className="container py-24">
      <h1 className="text-4xl font-bold tracking-tight">{t('nav.contact')}</h1>
      <p className="mt-4 max-w-prose text-muted-foreground">
        İletişim formu ve bilgileri burada yer alacak.
      </p>
    </section>
  )
}

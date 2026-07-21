import { useTranslation } from 'react-i18next'

/**
 * Hakkımızda — İSKELET. Özgün içerik taslağı: CONTENT_ABOUT_DRAFT.md (PROJECT_RULES §13).
 */
export default function AboutPage() {
  const { t } = useTranslation()
  return (
    <section className="container py-24">
      <h1 className="text-4xl font-bold tracking-tight">{t('nav.about')}</h1>
      <p className="mt-4 max-w-prose text-muted-foreground">
        Biz kimiz, misyon/ideal, vizyon ve değerler — CONTENT_ABOUT_DRAFT.md taslağından işlenecek.
      </p>
    </section>
  )
}

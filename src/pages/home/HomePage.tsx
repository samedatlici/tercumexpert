import { useTranslation } from 'react-i18next'
import { Button } from '@/shared/ui'

/**
 * Anasayfa — İSKELET. Tasarım aşamasında hero/servis özeti/sosyal kanıt/CTA eklenecek.
 * (PROJECT_RULES §13: özet + dönüşüm odaklı; derin detay Hizmetler'de.)
 */
export default function HomePage() {
  const { t } = useTranslation()
  return (
    <section className="container flex flex-col items-center gap-6 py-24 text-center">
      <span className="rounded-full bg-muted px-3 py-1 text-sm text-muted-foreground">
        {t('brand')}
      </span>
      <h1 className="max-w-2xl text-balance text-4xl font-bold tracking-tight sm:text-5xl">
        {t('nav.home')}
      </h1>
      <p className="max-w-prose text-muted-foreground">
        İskelet hazır. İçerik ve tasarım bir sonraki aşamada eklenecek.
      </p>
      <Button intent="primary" size="lg">
        {t('actions.getQuote')}
      </Button>
    </section>
  )
}

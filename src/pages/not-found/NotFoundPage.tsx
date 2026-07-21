import { Link } from 'react-router-dom'
import { DEFAULT_LOCALE } from '@/shared/config/i18n.config'

/**
 * 404 — yardımcı, anasayfaya dönüş sunar.
 */
export default function NotFoundPage() {
  return (
    <section className="container flex min-h-dvh flex-col items-center justify-center gap-4 py-24 text-center">
      <p className="text-6xl font-bold text-primary">404</p>
      <h1 className="text-2xl font-semibold">Sayfa bulunamadı</h1>
      <Link to={`/${DEFAULT_LOCALE}`} className="text-primary underline underline-offset-4">
        Anasayfaya dön
      </Link>
    </section>
  )
}

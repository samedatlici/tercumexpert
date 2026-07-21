import { useEffect } from 'react'
import { Navigate, Outlet, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { isLocale, DEFAULT_LOCALE } from '@/shared/config/i18n.config'

/**
 * Dil-farkındalıklı kök layout. :lang parametresini doğrular ve i18next'i senkronlar.
 * Geçersiz dil -> varsayılana yönlendirir.
 * (Header/Footer widget'ları tasarım aşamasında buraya eklenecek.)
 */
export function RootLayout() {
  const { lang } = useParams()
  const { i18n } = useTranslation()

  const valid = typeof lang === 'string' && isLocale(lang)

  useEffect(() => {
    if (valid && lang && i18n.language !== lang) {
      void i18n.changeLanguage(lang)
    }
  }, [valid, lang, i18n])

  if (!valid) {
    return <Navigate to={`/${DEFAULT_LOCALE}`} replace />
  }

  return (
    <div className="flex min-h-dvh flex-col bg-background text-foreground">
      {/* TODO(tasarım): <Header /> */}
      <main className="flex-1">
        <Outlet />
      </main>
      {/* TODO(tasarım): <Footer /> */}
    </div>
  )
}

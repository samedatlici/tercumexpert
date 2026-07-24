import { Suspense, useEffect } from 'react'
import { Navigate, Outlet, useParams } from 'react-router-dom'
import { I18nProvider } from '@/app/providers/I18nProvider'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { ChatWidget } from '@/features/chatbot/ui/ChatWidget'
import { SkipLink } from '@/components/common/SkipLink'
import { isLocale, DEFAULT_LOCALE } from '@/app/config/locales'
import { saveLocale } from '@/lib/locale-detect'
import { useI18n } from '@/hooks/useI18n'

function PageFallback() {
  const { dict } = useI18n() // I18nProvider içinde render edilir → güvenli
  return (
    <div className="section flex min-h-[50vh] items-center justify-center">
      <div className="size-8 animate-spin rounded-full border-2 border-border border-t-primary" aria-label={dict.common.states.loading} />
    </div>
  )
}

/**
 * Dil-farkındalıklı kök layout. Geçersiz :lang -> varsayılana yönlendirir.
 * I18nProvider burada sarılır (locale route param'ından gelir).
 */
export function LocaleLayout() {
  const { lang } = useParams()

  // Aktif dili kaydet: bir sonraki kök (/) ziyaretinde otomatik olarak
  // bu dile yönlendirilir (manuel dil seçimi de böylece hatırlanır).
  useEffect(() => {
    if (isLocale(lang)) saveLocale(lang)
  }, [lang])

  if (!isLocale(lang)) {
    return <Navigate to={`/${DEFAULT_LOCALE}`} replace />
  }

  return (
    <I18nProvider locale={lang}>
      <div className="flex min-h-dvh flex-col">
        <SkipLink />
        <Header />
        <main id="main" className="flex-1">
          <Suspense fallback={<PageFallback />}>
            <Outlet />
          </Suspense>
        </main>
        <Footer />
        <ChatWidget />
      </div>
    </I18nProvider>
  )
}

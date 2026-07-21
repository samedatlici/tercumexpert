import { useEffect, type ReactNode } from 'react'
import { analyticsConfig } from '@/shared/config/analytics.config'

/**
 * Analytics — sadece ilgili ENV ID'si DOLU ise ilgili script yüklenir.
 * Boşsa hiçbir script eklenmez (performans + gizlilik). ARCHITECTURE.md §10.
 *
 * NOT: Pazarlama script'leri (Pixel) ileride cookie-consent onayına bağlanacak.
 * Script'ler LCP'yi bloklamasın diye idle'da yüklenir.
 */
export function AnalyticsProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    const providers = Object.entries(analyticsConfig)
      .filter(([, cfg]) => cfg.enabled)
      .map(([name]) => name)

    if (providers.length === 0) return

    const run = () => {
      // Gerçek script enjeksiyonu tasarım/entegrasyon aşamasında eklenecek.
      // Şimdilik yalnızca hangi sağlayıcıların aktif olacağını doğrularız.
      // eslint-disable-next-line no-console
      console.info('[analytics] aktif sağlayıcılar:', providers.join(', '))
    }

    const w = window as typeof window & { requestIdleCallback?: (cb: () => void) => void }
    if (typeof w.requestIdleCallback === 'function') {
      w.requestIdleCallback(run)
    } else {
      const id = window.setTimeout(run, 2000)
      return () => window.clearTimeout(id)
    }
    return undefined
  }, [])

  return <>{children}</>
}

import { useEffect, type ReactNode } from 'react'
import { QueryProvider } from './QueryProvider'
import { ThemeProvider } from './ThemeProvider'
import { AuthProvider } from './AuthProvider'
import { ConsentProvider } from '@/features/legal/ConsentProvider'
import { captureRefFromUrl, usePartnerReferral } from '@/features/partner/model/referral'

/**
 * Partner davet kodu: yükleme anında URL'den yakalanır; kullanıcı üye olunca sunucuya
 * gönderilir (müşteri → partner atıfı). AuthProvider içinde çalışması gerektiğinden
 * ayrı bir görünmez bileşendir.
 */
function PartnerReferralWatcher() {
  useEffect(() => {
    captureRefFromUrl()
  }, [])
  usePartnerReferral()
  return null
}

/**
 * Global provider'lar (locale'den bağımsız). I18nProvider, locale route param'ına
 * bağlı olduğundan LocaleLayout içinde sarılır.
 */
export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <QueryProvider>
        <AuthProvider>
          <PartnerReferralWatcher />
          <ConsentProvider>{children}</ConsentProvider>
        </AuthProvider>
      </QueryProvider>
    </ThemeProvider>
  )
}

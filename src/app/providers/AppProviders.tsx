import type { ReactNode } from 'react'
import { QueryProvider } from './QueryProvider'
import { ThemeProvider } from './ThemeProvider'
import { ConsentProvider } from '@/features/legal/ConsentProvider'

/**
 * Global provider'lar (locale'den bağımsız). I18nProvider, locale route param'ına
 * bağlı olduğundan LocaleLayout içinde sarılır.
 */
export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <QueryProvider>
        <ConsentProvider>{children}</ConsentProvider>
      </QueryProvider>
    </ThemeProvider>
  )
}

import { useEffect, type ReactNode } from 'react'
import { env } from '@/app/config/env'

/**
 * Dark mode altyapısı HAZIR ama VITE_FEATURE_DARK_MODE=false iken 'light'e kilitli
 * (§6). Açmak için: flag'i true yap + toggle ekle. Component kodu değişmez (semantic token).
 */
export function ThemeProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    const root = document.documentElement
    // Bugün .dark hiç eklenmiyor -> görünüm hep light.
    if (!env.VITE_FEATURE_DARK_MODE) root.classList.remove('dark')
  }, [])
  return <>{children}</>
}

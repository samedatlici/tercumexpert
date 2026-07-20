import { use } from 'react'
import { I18nContext, type I18nValue } from '@/app/providers/I18nProvider'

/** Aktif dil sözlüğüne ve formatlayıcılara erişim. Tip-güvenli: dict.home.hero.title */
export function useI18n(): I18nValue {
  const ctx = use(I18nContext)
  if (!ctx) throw new Error('useI18n, I18nProvider içinde kullanılmalıdır.')
  return ctx
}

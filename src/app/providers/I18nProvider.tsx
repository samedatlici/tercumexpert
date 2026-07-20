import { createContext, useEffect, useMemo, type ReactNode } from 'react'
import { getDictionary } from '@/content'
import { formatCurrency, formatDate, formatNumber } from '@/lib/format'
import { getDirection, type Locale, type TextDirection } from '@/app/config/locales'
import type { Dictionary } from '@/types/i18n'

export interface I18nValue {
  locale: Locale
  dir: TextDirection
  dict: Dictionary
  formatCurrency: (amount: number) => string
  formatNumber: (value: number) => string
  formatDate: (date: Date | string) => string
}

export const I18nContext = createContext<I18nValue | null>(null)

/**
 * Aktif locale'in tam sözlüğünü sağlar ve <html lang>/<dir>'i senkronlar (RTL dahil).
 * Sözlük fallback zinciriyle tamamlanmıştır -> eksik çeviri görünmez.
 */
export function I18nProvider({ locale, children }: { locale: Locale; children: ReactNode }) {
  const dir = getDirection(locale)

  useEffect(() => {
    const root = document.documentElement
    root.lang = locale
    root.dir = dir
  }, [locale, dir])

  const value = useMemo<I18nValue>(
    () => ({
      locale,
      dir,
      dict: getDictionary(locale),
      formatCurrency: (amount) => formatCurrency(amount, locale),
      formatNumber: (value_) => formatNumber(value_, locale),
      formatDate: (date) => formatDate(date, locale),
    }),
    [locale, dir],
  )

  return <I18nContext value={value}>{children}</I18nContext>
}

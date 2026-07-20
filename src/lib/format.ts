import { getLocaleMeta, type Locale } from '@/app/config/locales'

const CURRENCY = 'TRY'

/** Para birimi (TRY) — locale'e göre gruplama. "80₺" gibi elle format YASAK (§13). */
export function formatCurrency(amount: number, locale: Locale): string {
  const tag = getLocaleMeta(locale).htmlLang
  return new Intl.NumberFormat(tag, {
    style: 'currency',
    currency: CURRENCY,
    maximumFractionDigits: 0,
  }).format(amount)
}

export function formatNumber(value: number, locale: Locale): string {
  return new Intl.NumberFormat(getLocaleMeta(locale).htmlLang).format(value)
}

export function formatDate(date: Date | string, locale: Locale): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return new Intl.DateTimeFormat(getLocaleMeta(locale).htmlLang, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(d)
}

/**
 * Desteklenen diller (8) — tek kaynak.
 * i18n, routing ve hreflang buradan beslenir. Arapça RTL'dir.
 */
export const LOCALES = [
  { code: 'tr', label: 'Türkçe', dir: 'ltr' },
  { code: 'en', label: 'English', dir: 'ltr' },
  { code: 'de', label: 'Deutsch', dir: 'ltr' },
  { code: 'fr', label: 'Français', dir: 'ltr' },
  { code: 'es', label: 'Español', dir: 'ltr' },
  { code: 'ar', label: 'العربية', dir: 'rtl' },
  { code: 'it', label: 'Italiano', dir: 'ltr' },
  { code: 'nl', label: 'Nederlands', dir: 'ltr' },
] as const

export type Locale = (typeof LOCALES)[number]['code']
export type TextDirection = 'ltr' | 'rtl'

export const DEFAULT_LOCALE: Locale = 'tr'
export const LOCALE_CODES = LOCALES.map((l) => l.code)

export function isLocale(value: string): value is Locale {
  return LOCALE_CODES.includes(value as Locale)
}

export function getDirection(code: Locale): TextDirection {
  return LOCALES.find((l) => l.code === code)?.dir ?? 'ltr'
}

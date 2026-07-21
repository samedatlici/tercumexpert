/**
 * Desteklenen diller (Şartname §10): tr, en, fr, de, es, ar, ru, it.
 * Tek kaynak — i18n, routing, hreflang, RTL buradan beslenir.
 * contentStatus: içerik olgunluğu (fallback sistemi bunu kullanır).
 */
export const LOCALES = [
  { code: 'tr', label: 'Türkçe', htmlLang: 'tr', ogLocale: 'tr_TR', dir: 'ltr', contentStatus: 'full' },
  { code: 'en', label: 'English', htmlLang: 'en', ogLocale: 'en_US', dir: 'ltr', contentStatus: 'base' },
  { code: 'fr', label: 'Français', htmlLang: 'fr', ogLocale: 'fr_FR', dir: 'ltr', contentStatus: 'base' },
  { code: 'de', label: 'Deutsch', htmlLang: 'de', ogLocale: 'de_DE', dir: 'ltr', contentStatus: 'placeholder' },
  { code: 'nl', label: 'Nederlands', htmlLang: 'nl', ogLocale: 'nl_NL', dir: 'ltr', contentStatus: 'placeholder' },
  { code: 'es', label: 'Español', htmlLang: 'es', ogLocale: 'es_ES', dir: 'ltr', contentStatus: 'placeholder' },
  { code: 'ar', label: 'العربية', htmlLang: 'ar', ogLocale: 'ar_AR', dir: 'rtl', contentStatus: 'placeholder' },
  { code: 'ru', label: 'Русский', htmlLang: 'ru', ogLocale: 'ru_RU', dir: 'ltr', contentStatus: 'placeholder' },
  { code: 'az', label: 'Azərbaycanca', htmlLang: 'az', ogLocale: 'az_AZ', dir: 'ltr', contentStatus: 'placeholder' },
  { code: 'pl', label: 'Polski', htmlLang: 'pl', ogLocale: 'pl_PL', dir: 'ltr', contentStatus: 'placeholder' },
  { code: 'bg', label: 'Български', htmlLang: 'bg', ogLocale: 'bg_BG', dir: 'ltr', contentStatus: 'placeholder' },
  { code: 'pt', label: 'Português', htmlLang: 'pt', ogLocale: 'pt_PT', dir: 'ltr', contentStatus: 'placeholder' },
  { code: 'da', label: 'Dansk', htmlLang: 'da', ogLocale: 'da_DK', dir: 'ltr', contentStatus: 'placeholder' },
  { code: 'it', label: 'Italiano', htmlLang: 'it', ogLocale: 'it_IT', dir: 'ltr', contentStatus: 'placeholder' },
] as const

export type Locale = (typeof LOCALES)[number]['code']
export type TextDirection = 'ltr' | 'rtl'
export type ContentStatus = 'full' | 'base' | 'placeholder'

export const DEFAULT_LOCALE: Locale = 'tr'
/** Fallback zinciri: istenen -> FALLBACK_LOCALE -> DEFAULT_LOCALE */
export const FALLBACK_LOCALE: Locale = 'en'

export const LOCALE_CODES = LOCALES.map((l) => l.code)

export function isLocale(value: unknown): value is Locale {
  return typeof value === 'string' && LOCALE_CODES.includes(value as Locale)
}

export function getLocaleMeta(code: Locale) {
  return LOCALES.find((l) => l.code === code) ?? LOCALES[0]
}

export function getDirection(code: Locale): TextDirection {
  return getLocaleMeta(code).dir
}

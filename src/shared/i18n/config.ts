import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'
import { DEFAULT_LOCALE, LOCALE_CODES } from '@/shared/config/i18n.config'

import trCommon from './resources/tr/common.json'
import enCommon from './resources/en/common.json'
import deCommon from './resources/de/common.json'
import frCommon from './resources/fr/common.json'
import esCommon from './resources/es/common.json'
import arCommon from './resources/ar/common.json'
import itCommon from './resources/it/common.json'
import nlCommon from './resources/nl/common.json'

/**
 * i18next kurulumu. 8 dil, `common` namespace (ileride namespace bazlı lazy load).
 * Not: Şimdilik statik import; büyüdükçe i18next-http-backend ile lazy'ye geçilebilir.
 */
export const resources = {
  tr: { common: trCommon },
  en: { common: enCommon },
  de: { common: deCommon },
  fr: { common: frCommon },
  es: { common: esCommon },
  ar: { common: arCommon },
  it: { common: itCommon },
  nl: { common: nlCommon },
} as const

void i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: DEFAULT_LOCALE,
    supportedLngs: LOCALE_CODES,
    defaultNS: 'common',
    interpolation: { escapeValue: false },
    detection: {
      order: ['path', 'localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage'],
    },
  })

export default i18n

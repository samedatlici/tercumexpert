import { isLocale, type Locale } from '@/app/config/locales'

/**
 * Ziyaretçinin dilini otomatik belirlemek için yardımcılar (Rötuş: coğrafi dil).
 * Öncelik sırası (RootLocaleRedirect içinde uygulanır):
 *   1) Daha önce seçilmiş/kullanılmış dil (localStorage)  — en güçlü sinyal
 *   2) Tarayıcı/cihaz dili (navigator.languages)          — kişinin kendi tercihi
 *   3) Coğrafi ülke (/api/geo → x-vercel-ip-country)      — fiziksel konum
 *   4) Uluslararası varsayılan (en)
 *
 * NOT: Konum yerine önce tarayıcı dilini kullanmak "yanlış dil" hatalarını
 * en aza indirir: seyahatteki bir Türk kullanıcı Almanya'dayken Almanca değil,
 * cihazının dili (Türkçe) ile açılır. Konum yalnızca tarayıcı dili
 * desteklenmiyorsa devreye girer.
 */

const PREF_KEY = 'te_locale'

/** Kullanıcının daha önce kullandığı/seçtiği dili döndürür (yoksa null). */
export function getSavedLocale(): Locale | null {
  try {
    const v = localStorage.getItem(PREF_KEY)
    return isLocale(v) ? v : null
  } catch {
    return null
  }
}

/** Aktif dili kalıcı olarak kaydeder (bir sonraki ziyarette öncelikli olur). */
export function saveLocale(locale: Locale): void {
  try {
    localStorage.setItem(PREF_KEY, locale)
  } catch {
    /* özel modda localStorage engelli olabilir — sessiz geç */
  }
}

/** navigator.languages içinden desteklenen ilk dili bulur (bölge etiketini yok sayar). */
export function localeFromNavigator(): Locale | null {
  if (typeof navigator === 'undefined') return null
  const list =
    navigator.languages && navigator.languages.length
      ? navigator.languages
      : navigator.language
        ? [navigator.language]
        : []
  for (const raw of list) {
    const primary = String(raw).toLowerCase().split('-')[0]
    if (isLocale(primary)) return primary
  }
  return null
}

/**
 * Ülke kodu → dil eşlemesi. YALNIZCA desteklediğimiz bir dilin açıkça
 * baskın olduğu ülkeler eşlenir (hata payını en aza indirmek için).
 * Eşlenmeyen ülkeler null döner → çağıran taraf uluslararası varsayılana (en) düşer.
 * Desteklenen diller: tr, en, fr, de, nl, es, ar, ru, az, pl, bg, pt, da, it.
 */
const COUNTRY_LOCALE: Record<string, Locale> = {
  // Türkçe
  TR: 'tr',
  // Azerice
  AZ: 'az',
  // İngilizce (baskın/iş dili)
  US: 'en', GB: 'en', IE: 'en', CA: 'en', AU: 'en', NZ: 'en', ZA: 'en',
  IN: 'en', PK: 'en', NG: 'en', KE: 'en', GH: 'en', PH: 'en', SG: 'en',
  MT: 'en', JM: 'en', TT: 'en',
  // Fransızca
  FR: 'fr', MC: 'fr', SN: 'fr', CI: 'fr', CM: 'fr', ML: 'fr', BF: 'fr',
  NE: 'fr', TG: 'fr', BJ: 'fr', GA: 'fr', CG: 'fr', CD: 'fr', MG: 'fr', GN: 'fr',
  // Almanca
  DE: 'de', AT: 'de', CH: 'de', LI: 'de',
  // Felemenkçe (Hollandaca)
  NL: 'nl', SR: 'nl',
  // İspanyolca
  ES: 'es', MX: 'es', AR: 'es', CO: 'es', PE: 'es', VE: 'es', CL: 'es',
  EC: 'es', GT: 'es', CU: 'es', BO: 'es', DO: 'es', HN: 'es', PY: 'es',
  SV: 'es', NI: 'es', CR: 'es', PA: 'es', UY: 'es', PR: 'es',
  // Arapça
  SA: 'ar', AE: 'ar', QA: 'ar', KW: 'ar', BH: 'ar', OM: 'ar', JO: 'ar',
  IQ: 'ar', EG: 'ar', MA: 'ar', DZ: 'ar', TN: 'ar', LY: 'ar', SY: 'ar',
  LB: 'ar', YE: 'ar', SD: 'ar', PS: 'ar', MR: 'ar',
  // Rusça (baskın/ortak dil)
  RU: 'ru', BY: 'ru', KZ: 'ru', KG: 'ru', TJ: 'ru',
  // Lehçe
  PL: 'pl',
  // Bulgarca
  BG: 'bg',
  // Portekizce
  PT: 'pt', BR: 'pt', AO: 'pt', MZ: 'pt', CV: 'pt',
  // Danca
  DK: 'da', GL: 'da', FO: 'da',
  // İtalyanca
  IT: 'it', SM: 'it', VA: 'it',
}

/** Ülke kodundan (ISO alfa-2) desteklenen dili döndürür; eşleme yoksa null. */
export function localeFromCountry(country: string | null | undefined): Locale | null {
  if (!country) return null
  return COUNTRY_LOCALE[country.toUpperCase()] ?? null
}

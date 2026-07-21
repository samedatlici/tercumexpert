/**
 * Telefon alanı için ülke arama kodları (bayrak + dial code).
 * En yaygın / potansiyelli ~50 ülke, önem sırasına göre. SMS gönderilmez;
 * yalnızca müşteri telefon numarasını toplamak için kullanılır.
 * `iso` = select value (benzersiz). `dial` numaranın başına eklenir.
 */
export interface Country {
  iso: string
  name: string
  dial: string
  flag: string
}

export const COUNTRIES: Country[] = [
  { iso: 'tr', name: 'Türkiye', dial: '+90', flag: '🇹🇷' },
  { iso: 'us', name: 'United States', dial: '+1', flag: '🇺🇸' },
  { iso: 'gb', name: 'United Kingdom', dial: '+44', flag: '🇬🇧' },
  { iso: 'de', name: 'Germany', dial: '+49', flag: '🇩🇪' },
  { iso: 'fr', name: 'France', dial: '+33', flag: '🇫🇷' },
  { iso: 'nl', name: 'Netherlands', dial: '+31', flag: '🇳🇱' },
  { iso: 'es', name: 'Spain', dial: '+34', flag: '🇪🇸' },
  { iso: 'it', name: 'Italy', dial: '+39', flag: '🇮🇹' },
  { iso: 'ru', name: 'Russia', dial: '+7', flag: '🇷🇺' },
  { iso: 'az', name: 'Azerbaijan', dial: '+994', flag: '🇦🇿' },
  { iso: 'sa', name: 'Saudi Arabia', dial: '+966', flag: '🇸🇦' },
  { iso: 'ae', name: 'United Arab Emirates', dial: '+971', flag: '🇦🇪' },
  { iso: 'qa', name: 'Qatar', dial: '+974', flag: '🇶🇦' },
  { iso: 'kw', name: 'Kuwait', dial: '+965', flag: '🇰🇼' },
  { iso: 'pl', name: 'Poland', dial: '+48', flag: '🇵🇱' },
  { iso: 'bg', name: 'Bulgaria', dial: '+359', flag: '🇧🇬' },
  { iso: 'pt', name: 'Portugal', dial: '+351', flag: '🇵🇹' },
  { iso: 'dk', name: 'Denmark', dial: '+45', flag: '🇩🇰' },
  { iso: 'se', name: 'Sweden', dial: '+46', flag: '🇸🇪' },
  { iso: 'no', name: 'Norway', dial: '+47', flag: '🇳🇴' },
  { iso: 'fi', name: 'Finland', dial: '+358', flag: '🇫🇮' },
  { iso: 'be', name: 'Belgium', dial: '+32', flag: '🇧🇪' },
  { iso: 'ch', name: 'Switzerland', dial: '+41', flag: '🇨🇭' },
  { iso: 'at', name: 'Austria', dial: '+43', flag: '🇦🇹' },
  { iso: 'gr', name: 'Greece', dial: '+30', flag: '🇬🇷' },
  { iso: 'ro', name: 'Romania', dial: '+40', flag: '🇷🇴' },
  { iso: 'ua', name: 'Ukraine', dial: '+380', flag: '🇺🇦' },
  { iso: 'ge', name: 'Georgia', dial: '+995', flag: '🇬🇪' },
  { iso: 'cy', name: 'Cyprus', dial: '+357', flag: '🇨🇾' },
  { iso: 'ie', name: 'Ireland', dial: '+353', flag: '🇮🇪' },
  { iso: 'cz', name: 'Czechia', dial: '+420', flag: '🇨🇿' },
  { iso: 'hu', name: 'Hungary', dial: '+36', flag: '🇭🇺' },
  { iso: 'ir', name: 'Iran', dial: '+98', flag: '🇮🇷' },
  { iso: 'iq', name: 'Iraq', dial: '+964', flag: '🇮🇶' },
  { iso: 'eg', name: 'Egypt', dial: '+20', flag: '🇪🇬' },
  { iso: 'ma', name: 'Morocco', dial: '+212', flag: '🇲🇦' },
  { iso: 'dz', name: 'Algeria', dial: '+213', flag: '🇩🇿' },
  { iso: 'tn', name: 'Tunisia', dial: '+216', flag: '🇹🇳' },
  { iso: 'jo', name: 'Jordan', dial: '+962', flag: '🇯🇴' },
  { iso: 'lb', name: 'Lebanon', dial: '+961', flag: '🇱🇧' },
  { iso: 'il', name: 'Israel', dial: '+972', flag: '🇮🇱' },
  { iso: 'ca', name: 'Canada', dial: '+1', flag: '🇨🇦' },
  { iso: 'au', name: 'Australia', dial: '+61', flag: '🇦🇺' },
  { iso: 'cn', name: 'China', dial: '+86', flag: '🇨🇳' },
  { iso: 'jp', name: 'Japan', dial: '+81', flag: '🇯🇵' },
  { iso: 'kr', name: 'South Korea', dial: '+82', flag: '🇰🇷' },
  { iso: 'in', name: 'India', dial: '+91', flag: '🇮🇳' },
  { iso: 'pk', name: 'Pakistan', dial: '+92', flag: '🇵🇰' },
  { iso: 'br', name: 'Brazil', dial: '+55', flag: '🇧🇷' },
  { iso: 'mx', name: 'Mexico', dial: '+52', flag: '🇲🇽' },
  { iso: 'kz', name: 'Kazakhstan', dial: '+7', flag: '🇰🇿' },
  { iso: 'uz', name: 'Uzbekistan', dial: '+998', flag: '🇺🇿' },
]

export function dialOf(iso: string): string {
  return COUNTRIES.find((c) => c.iso === iso)?.dial ?? '+90'
}

/** Site dili -> varsayılan ülke (telefon kodu). Locale kodu ile ISO farklı olabilir
 *  (da->dk, en->gb, ar->sa). Müşteri seçimi elle değiştirebilir. */
const LOCALE_DEFAULT_COUNTRY: Record<string, string> = {
  tr: 'tr', en: 'gb', de: 'de', fr: 'fr', es: 'es', it: 'it', nl: 'nl',
  ru: 'ru', az: 'az', pl: 'pl', bg: 'bg', pt: 'pt', da: 'dk', ar: 'sa',
}

export function defaultCountryForLocale(locale: string): string {
  return LOCALE_DEFAULT_COUNTRY[locale] ?? 'tr'
}

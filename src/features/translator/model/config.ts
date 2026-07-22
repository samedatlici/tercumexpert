import { QUOTE_LANGUAGES } from '@/app/config/pricing.config'

/**
 * Tercüman paneli sabitleri.
 * Ödeme oranı: tercüman kazancı = %30 × (temel + kelime + acil farkı) — KDV/noter/kargo hariç.
 * (Faz 3+ hesaplamada kullanılır; burada tek kaynak.)
 */
export const TRANSLATOR_PAYOUT_RATE = 0.3

/** Uzmanlık alanları (anahtarlar sabit; etiketler dict.translator.expertiseLabels'ten). */
export const EXPERTISE_KEYS = [
  'legal',
  'medical',
  'technical',
  'academic',
  'commercial',
  'financial',
  'literary',
  'official',
  'localization',
  'general',
] as const
export type ExpertiseKey = (typeof EXPERTISE_KEYS)[number]

/** Dil çifti seçimi için kullanılan diller (sipariş dilleriyle aynı). */
export const PANEL_LANGUAGES = QUOTE_LANGUAGES.map((l) => l.code)

/** Bir dil kodunu, arayüz diline göre okunur ada çevirir (Intl; yoksa kod). */
export function languageName(code: string, uiLocale: string): string {
  try {
    const dn = new Intl.DisplayNames([uiLocale], { type: 'language' })
    return dn.of(code) ?? code.toUpperCase()
  } catch {
    return code.toUpperCase()
  }
}

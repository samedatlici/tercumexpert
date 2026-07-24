// =====================================================================
// Tercüman havuzu mantığı — Edge fonksiyonu için KENDİ KENDİNE YETEN kopya.
// !!! SENKRON: değerler src/app/config/pricing.config.ts + areas.config.ts ile AYNI olmalı.
// =====================================================================

/** Tercüman kazanç oranları — SABİT. Fiyatlar (TL) ileride değişse de bu YÜZDELER DEĞİŞMEZ. */
export const TRANSLATOR_PAYOUT_RATE = 0.3 // çeviri (taban+kelime+acil), KDV/noter/kargo HARİÇ
export const SWORN_PAYOUT_RATE = 0.4 // yeminli tercüme ek ücretinin tercüman payı (%40 tercüman / %60 admin)

// Ek hizmet ücretleri (pricing.config.ts swornFee ile AYNI olmalı; ileride TL değişir, yüzdeler kalır).
const SWORN_FEE = 150

// ---- Alan (Hizmet Türü) taban ücretleri (pricing.config.ts AREA_BASE_PRICE kopyası) ----
const AREA_BASE_PRICE: Record<string, number> = {
  academic: 160,
  legal: 180,
  official: 150,
  medical: 180,
  technical: 160,
  commercial: 170,
  localization: 200,
  literary: 190,
  general: 150,
}
const DEFAULT_BASE = 150

// ---- Kelime ücreti (pricing.config.ts kopyası) ----
const PER_WORD_RATE = 0.25
const WORD_RATE_TIERS: { upTo: number; rate: number }[] | null = null

type Tier = 'common' | 'medium' | 'rare'
const LANG_TIER_MULT: Record<Tier, number> = { common: 1, medium: 1.25, rare: 1.6 }
const URGENCY_MULT = 1.5
const LANG_TIER: Record<string, Tier> = {
  tr: 'common', en: 'common', de: 'common',
  nl: 'medium', fr: 'medium', es: 'medium', it: 'medium', ru: 'medium',
  az: 'medium', pl: 'medium', bg: 'medium', pt: 'medium', da: 'medium',
  ar: 'rare',
}

export interface OrderLike {
  service: string // alan (area) id
  source_lang: string
  target_lang: string
  word_count: number
  urgent: boolean
  sworn?: boolean // yeminli tercüme ek ücreti seçili mi
}
export interface TranslatorLite {
  expertise: string[]
  language_pairs: { source: string; target: string }[]
}

/** Uzmanlık eşleşmesi: sipariş alanı (service) tercümanın uzmanlıkları arasında mı? */
export function matchesExpertise(order: { service: string }, expertise: string[]): boolean {
  return (expertise ?? []).includes(order.service)
}
export function matchesLanguage(
  order: { source_lang: string; target_lang: string },
  pairs: { source: string; target: string }[],
): boolean {
  return (pairs ?? []).some((p) => p.source === order.source_lang && p.target === order.target_lang)
}
/** Tercüman bu siparişi görebilir/üstlenebilir mi? (alan VE dil çifti eşleşmeli) */
export function matchesTranslator(order: OrderLike, tr: TranslatorLite): boolean {
  return matchesExpertise(order, tr.expertise ?? []) && matchesLanguage(order, tr.language_pairs ?? [])
}

/* ----------------------------- Kazanç (payout) ----------------------------- */
// calculate.ts base + word + urgency ile birebir. Belge türü fiyata GİRMEZ.
const TIER_RANK: Record<Tier, number> = { common: 0, medium: 1, rare: 2 }
function tierFor(code: string): Tier {
  return LANG_TIER[code] ?? 'common'
}
function pairTier(s: string, t: string): Tier {
  return TIER_RANK[tierFor(s)] >= TIER_RANK[tierFor(t)] ? tierFor(s) : tierFor(t)
}
function baseWordCost(words: number): number {
  if (!WORD_RATE_TIERS || WORD_RATE_TIERS.length === 0) return words * PER_WORD_RATE
  const sorted = [...WORD_RATE_TIERS].sort((a, b) => a.upTo - b.upTo)
  let cost = 0
  let prev = 0
  let lastRate = PER_WORD_RATE
  for (const tier of sorted) {
    lastRate = tier.rate
    if (words <= prev) break
    const span = Math.min(words, tier.upTo) - prev
    if (span > 0) cost += span * tier.rate
    prev = tier.upTo
  }
  if (words > prev) cost += (words - prev) * lastRate
  return cost
}

/** Tercümanın bu işten hak edeceği tutar (TL). Sunucuda kilitlenir; istemciye güvenilmez. */
export function computePayout(o: OrderLike): number {
  const words = Math.max(0, Math.floor(o.word_count || 0))
  const base = AREA_BASE_PRICE[o.service] ?? DEFAULT_BASE
  const langMult = LANG_TIER_MULT[pairTier(o.source_lang, o.target_lang)]
  const basePrice = Math.round(base)
  const wordPrice = Math.round(baseWordCost(words) * langMult)
  const translation = basePrice + wordPrice
  const urgency = o.urgent ? Math.round(translation * (URGENCY_MULT - 1)) : 0
  // Çeviri + acil teslimat: %30 tercümana. (KDV, noter, kargo bu tutara GİRMEZ.)
  const translationShare = Math.round(TRANSLATOR_PAYOUT_RATE * (basePrice + wordPrice + urgency))
  // Ek hizmet payları — YÜZDELER SABİT (fiyat ileride TL olarak değişse bile).
  const swornShare = o.sworn ? Math.round(SWORN_PAYOUT_RATE * SWORN_FEE) : 0 // yeminli: %40 tercüman
  return translationShare + swornShare
}

/* ----------------------------- Partner komisyonu ----------------------------- */
// Partner payı (hepsi KDV HARİÇ) — YÜZDELER SABİT (fiyat TL olarak değişse bile):
//   • Ana çeviri bedelinin (taban+kelime) %20'si
//   • Acil teslimat farkının %20'si
//   • Yeminli ek ücretinin %10'u
//   • Noter / Apostil / Fiziksel teslimat: partner EK PAY ALMAZ.
export const PARTNER_TRANSLATION_RATE = 0.2
export const PARTNER_URGENT_RATE = 0.2
export const PARTNER_SWORN_RATE = 0.1

/** Bir siparişin partnere ödenecek komisyonu (TL). Sunucuda hesaplanır; istemciye güvenilmez. */
export function computePartnerShare(o: OrderLike): number {
  const words = Math.max(0, Math.floor(o.word_count || 0))
  const base = AREA_BASE_PRICE[o.service] ?? DEFAULT_BASE
  const langMult = LANG_TIER_MULT[pairTier(o.source_lang, o.target_lang)]
  const basePrice = Math.round(base)
  const wordPrice = Math.round(baseWordCost(words) * langMult)
  const translation = basePrice + wordPrice
  const urgency = o.urgent ? Math.round(translation * (URGENCY_MULT - 1)) : 0
  const translationShare = Math.round(PARTNER_TRANSLATION_RATE * translation)
  const urgentShare = o.urgent ? Math.round(PARTNER_URGENT_RATE * urgency) : 0
  const swornShare = o.sworn ? Math.round(PARTNER_SWORN_RATE * SWORN_FEE) : 0
  return translationShare + urgentShare + swornShare
}

/** Kaba sayfa tahmini (≈250 kelime/sayfa). */
export function estimatePages(words: number): number {
  return Math.max(1, Math.ceil((words || 0) / 250))
}

// Referans mantık (Edge kopyası: api/_pool-logic.ts). Şu an yalnızca api kopyası
// kullanılıyor; bu dosya belge amaçlı tutulur. SADECE göreli import ('@' alias yok).
import { PRICING, AREA_BASE_PRICE, QUOTE_LANGUAGES, type LanguageTier } from '../../../app/config/pricing.config'

/** Tercüman kazanç oranları — SABİT. Fiyatlar (TL) ileride değişse de bu YÜZDELER DEĞİŞMEZ. */
export const TRANSLATOR_PAYOUT_RATE = 0.3 // çeviri (taban+kelime+acil), KDV/noter/kargo HARİÇ
export const SWORN_PAYOUT_RATE = 0.4 // yeminli ek ücreti: %40 tercüman / %60 admin

export interface OrderLike {
  service: string // alan (area) id
  source_lang: string
  target_lang: string
  word_count: number
  urgent: boolean
  sworn?: boolean
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
export function matchesTranslator(order: OrderLike, tr: TranslatorLite): boolean {
  return matchesExpertise(order, tr.expertise ?? []) && matchesLanguage(order, tr.language_pairs ?? [])
}

const TIER_RANK: Record<LanguageTier, number> = { common: 0, medium: 1, rare: 2 }
function tierFor(code: string): LanguageTier {
  return QUOTE_LANGUAGES.find((l) => l.code === code)?.tier ?? 'common'
}
function pairTier(s: string, t: string): LanguageTier {
  return TIER_RANK[tierFor(s)] >= TIER_RANK[tierFor(t)] ? tierFor(s) : tierFor(t)
}
function baseWordCost(words: number): number {
  const tiers = PRICING.wordRateTiers
  if (!tiers || tiers.length === 0) return words * PRICING.perWordRate
  const sorted = [...tiers].sort((a, b) => a.upTo - b.upTo)
  let cost = 0
  let prev = 0
  let lastRate = PRICING.perWordRate
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

/** Tercümanın bu işten hak edeceği tutar (TL). Belge türü fiyata GİRMEZ. */
export function computePayout(o: OrderLike): number {
  const words = Math.max(0, Math.floor(o.word_count || 0))
  const base = (AREA_BASE_PRICE as Record<string, number>)[o.service] ?? 150
  const langMult = PRICING.languageTierMultiplier[pairTier(o.source_lang, o.target_lang)]
  const basePrice = Math.round(base)
  const wordPrice = Math.round(baseWordCost(words) * langMult)
  const translation = basePrice + wordPrice
  const urgency = o.urgent ? Math.round(translation * (PRICING.urgencyMultiplier - 1)) : 0
  const translationShare = Math.round(TRANSLATOR_PAYOUT_RATE * (basePrice + wordPrice + urgency))
  const swornShare = o.sworn ? Math.round(SWORN_PAYOUT_RATE * PRICING.swornFee) : 0
  return translationShare + swornShare
}

export function estimatePages(words: number): number {
  return Math.max(1, Math.ceil((words || 0) / 250))
}

import {
  PRICING,
  AREA_BASE_PRICE,
  QUOTE_LANGUAGES,
  type LanguageTier,
  type PricingConfig,
} from '@/app/config/pricing.config'
import type { QuoteBreakdown, QuoteInput } from './types'

const TIER_RANK: Record<LanguageTier, number> = { common: 0, medium: 1, rare: 2 }

/** Bir dil kodunun tier'ı (bulunamazsa 'common'). */
export function tierForLanguage(code: string): LanguageTier {
  return QUOTE_LANGUAGES.find((l) => l.code === code)?.tier ?? 'common'
}

/** Dil çiftinin çarpanı: kaynak/hedef arasından DAHA YÜKSEK tier belirleyicidir. */
export function pairTier(source: string, target: string): LanguageTier {
  const s = tierForLanguage(source)
  const t = tierForLanguage(target)
  return TIER_RANK[s] >= TIER_RANK[t] ? s : t
}

const round = (n: number): number => Math.round(n)

/**
 * Kelime ücretinin çarpanlardan ÖNCEKİ ham bedeli. Kademeli tarife (wordRateTiers)
 * tanımlıysa progresif hesaplar; değilse düz perWordRate. Ücret modeli ileride
 * yalnız config'ten değişir; bu fonksiyon tek dokunma noktasıdır.
 */
export function baseWordCost(words: number, config: PricingConfig): number {
  const tiers = config.wordRateTiers
  if (!tiers || tiers.length === 0) return words * config.perWordRate

  const sorted = [...tiers].sort((a, b) => a.upTo - b.upTo)
  let cost = 0
  let prev = 0
  let lastRate = config.perWordRate
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

/**
 * Ön fiyat teklifini hesaplar. SAF fonksiyon (UI bağımsız, test edilebilir).
 * Para değerleri tam sayıya yuvarlanır; gösterim Intl ile yapılır (§13).
 */
export function calculateQuote(input: QuoteInput, config: PricingConfig = PRICING): QuoteBreakdown {
  const words = Math.max(0, Math.floor(input.wordCount))

  // Alan (Hizmet Türü) taban ücreti. Belge türü fiyatı ETKİLEMEZ (yalnız açıklama).
  const base = AREA_BASE_PRICE[input.service] ?? config.serviceBasePrice.sworn
  const langMult = config.languageTierMultiplier[pairTier(input.sourceLang, input.targetLang)]

  const basePrice = round(base)
  const wordPrice = round(baseWordCost(words, config) * langMult)

  const translation = basePrice + wordPrice
  const urgencySurcharge = input.urgent ? round(translation * (config.urgencyMultiplier - 1)) : 0
  const swornFee = input.sworn ? config.swornFee : 0
  const notaryFee = input.notarization ? config.notarizationFee : 0
  const physicalFee = input.physicalDelivery ? config.physicalDeliveryFee : 0
  const addonsPrice = urgencySurcharge + swornFee + notaryFee + physicalFee

  const preMin = basePrice + wordPrice + addonsPrice
  const subtotal = Math.max(preMin, config.minimumOrderAmount)
  const tax = round((subtotal * config.taxRatePercent) / 100)
  const total = subtotal + tax

  return {
    currency: config.currency,
    basePrice,
    wordPrice,
    addonsPrice,
    subtotal,
    tax,
    total,
    deliveryDays: estimateDeliveryDays(words, input.urgent, config),
  }
}

/** Tahmini teslim süresi (iş günü). Acil ise kısaltılır; minimumun altına inmez. */
export function estimateDeliveryDays(
  wordCount: number,
  urgent: boolean,
  config: PricingConfig = PRICING,
): number {
  const words = Math.max(0, Math.floor(wordCount))
  const raw = Math.ceil(words / config.estimatedDailyCapacity)
  const normal = Math.max(config.minDeliveryDays, raw)
  if (!urgent) return normal
  return Math.max(config.minDeliveryDays, Math.ceil(normal * config.urgencyDeliveryFactor))
}

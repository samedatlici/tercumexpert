// HEM istemci HEM de Edge fonksiyonu (api/translator.ts) tarafından kullanılır.
// Bu yüzden SADECE göreli (relative) import; '@' alias YOK (edge derlemesi alias bilmez).
import { PRICING, QUOTE_LANGUAGES, type LanguageTier } from '../../../app/config/pricing.config'

/** Tercüman kazanç oranı — TEK KAYNAK. Kullanıcıya "%30" denmez; yalnızca tutar gösterilir. */
export const TRANSLATOR_PAYOUT_RATE = 0.3

/* ----------------------------- Uzmanlık eşlemesi ----------------------------- */
// Hizmet türü konu belirtiyorsa uzmanlığa eşlenir; sworn/notarized/apostille yalnızca
// ONAY türüdür, konu belge türünden gelir.
const SERVICE_SUBJECT: Record<string, string | undefined> = {
  legal: 'legal',
  technical: 'technical',
  medical: 'medical',
  academic: 'academic',
  localization: 'localization',
}
const DOC_SUBJECT: Record<string, string> = {
  diploma: 'academic',
  passport: 'official',
  'civil-registry': 'official',
  contract: 'legal',
  'medical-report': 'medical',
  'technical-doc': 'technical',
  'court-doc': 'legal',
  other: 'general',
}

/** Bir siparişin gerektirdiği uzmanlık alan(lar)ı. */
export function requiredExpertise(service: string, documentType: string): string[] {
  const set = new Set<string>()
  const s = SERVICE_SUBJECT[service]
  if (s) set.add(s)
  set.add(DOC_SUBJECT[documentType] ?? 'general')
  return [...set]
}

export interface OrderLike {
  service: string
  source_lang: string
  target_lang: string
  document_type: string
  word_count: number
  urgent: boolean
}
export interface TranslatorLite {
  expertise: string[]
  language_pairs: { source: string; target: string }[]
}

export function matchesExpertise(order: { service: string; document_type: string }, expertise: string[]): boolean {
  const req = requiredExpertise(order.service, order.document_type)
  return req.some((r) => expertise.includes(r))
}
export function matchesLanguage(
  order: { source_lang: string; target_lang: string },
  pairs: { source: string; target: string }[],
): boolean {
  return (pairs ?? []).some((p) => p.source === order.source_lang && p.target === order.target_lang)
}
/** Tercüman bu siparişi görebilir/üstlenebilir mi? (uzmanlık VE dil çifti eşleşmeli) */
export function matchesTranslator(order: OrderLike, tr: TranslatorLite): boolean {
  return matchesExpertise(order, tr.expertise ?? []) && matchesLanguage(order, tr.language_pairs ?? [])
}

/* ----------------------------- Kazanç (payout) ----------------------------- */
// calculate.ts'teki base + word + urgency ile BİREBİR. Payout = oran × (temel + kelime + acil farkı).
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

/** Tercümanın bu işten hak edeceği tutar (TL). Sunucuda kilitlenir; istemciye güvenilmez. */
export function computePayout(o: OrderLike): number {
  const words = Math.max(0, Math.floor(o.word_count || 0))
  const base = (PRICING.serviceBasePrice as Record<string, number>)[o.service] ?? 0
  const docMult = (PRICING.documentTypeMultiplier as Record<string, number>)[o.document_type] ?? 1
  const langMult = PRICING.languageTierMultiplier[pairTier(o.source_lang, o.target_lang)]
  const basePrice = Math.round(base)
  const wordPrice = Math.round(baseWordCost(words) * langMult * docMult)
  const translation = basePrice + wordPrice
  const urgency = o.urgent ? Math.round(translation * (PRICING.urgencyMultiplier - 1)) : 0
  return Math.round(TRANSLATOR_PAYOUT_RATE * (basePrice + wordPrice + urgency))
}

/** Kaba sayfa tahmini (≈250 kelime/sayfa). */
export function estimatePages(words: number): number {
  return Math.max(1, Math.ceil((words || 0) / 250))
}

// =====================================================================
// Tercüman havuzu mantığı — Edge fonksiyonu için KENDİ KENDİNE YETEN kopya.
// Vercel Edge derleyicisi, api/'nin src'ten derin import zincirini desteklemiyor;
// bu yüzden fiyat sabitleri BURADA satır içi tutulur.
// !!! SENKRON: değerler src/app/config/pricing.config.ts ile AYNI olmalı.
//     Fiyat değişirse İKİ yeri de güncelle.
// =====================================================================

/** Tercüman kazanç oranı. Kullanıcıya "%30" denmez; yalnızca tutar gösterilir. */
export const TRANSLATOR_PAYOUT_RATE = 0.3

// ---- pricing.config.ts kopyası (payout için gerekli alt küme) ----
const PER_WORD_RATE = 0.25
// wordRateTiers şu an KAPALI (düz perWordRate). Açılırsa buraya ekle + pricing.config ile eşle.
const WORD_RATE_TIERS: { upTo: number; rate: number }[] | null = null

const SERVICE_BASE_PRICE: Record<string, number> = {
  sworn: 150,
  notarized: 200,
  apostille: 250,
  legal: 180,
  technical: 160,
  medical: 180,
  academic: 160,
  localization: 200,
}
const DOC_MULT: Record<string, number> = {
  diploma: 1,
  passport: 1,
  'civil-registry': 1,
  contract: 1.15,
  'medical-report': 1.2,
  'technical-doc': 1.15,
  'court-doc': 1.25,
  other: 1,
}
type Tier = 'common' | 'medium' | 'rare'
const LANG_TIER_MULT: Record<Tier, number> = { common: 1, medium: 1.25, rare: 1.6 }
const URGENCY_MULT = 1.5
const LANG_TIER: Record<string, Tier> = {
  tr: 'common', en: 'common', de: 'common',
  nl: 'medium', fr: 'medium', es: 'medium', it: 'medium', ru: 'medium',
  az: 'medium', pl: 'medium', bg: 'medium', pt: 'medium', da: 'medium',
  ar: 'rare',
}

/* ----------------------------- Uzmanlık eşlemesi ----------------------------- */
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
export function matchesTranslator(order: OrderLike, tr: TranslatorLite): boolean {
  return matchesExpertise(order, tr.expertise ?? []) && matchesLanguage(order, tr.language_pairs ?? [])
}

/* ----------------------------- Kazanç (payout) ----------------------------- */
// calculate.ts base + word + urgency ile birebir.
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
  const base = SERVICE_BASE_PRICE[o.service] ?? 0
  const docMult = DOC_MULT[o.document_type] ?? 1
  const langMult = LANG_TIER_MULT[pairTier(o.source_lang, o.target_lang)]
  const basePrice = Math.round(base)
  const wordPrice = Math.round(baseWordCost(words) * langMult * docMult)
  const translation = basePrice + wordPrice
  const urgency = o.urgent ? Math.round(translation * (URGENCY_MULT - 1)) : 0
  return Math.round(TRANSLATOR_PAYOUT_RATE * (basePrice + wordPrice + urgency))
}

/** Kaba sayfa tahmini (≈250 kelime/sayfa). */
export function estimatePages(words: number): number {
  return Math.max(1, Math.ceil((words || 0) / 250))
}

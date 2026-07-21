import type { ServiceId } from './services'

/**
 * FİYATLANDIRMA PARAMETRELERİ (§13). Hard-code yasak -> tümü buradan yönetilir.
 * !!! DİKKAT: Bu sayılar PLACEHOLDER'dır ve ticari olarak DOĞRULANMAMIŞtır.
 *     Yayın öncesi işletme tarafından onaylanmalıdır (PROJECT_CHECKLIST.md).
 *     Hesaplama mantığı UI'dan ayrıktır (features/quote-calculator/model).
 */
export type DocumentTypeId =
  | 'diploma'
  | 'passport'
  | 'civil-registry'
  | 'contract'
  | 'medical-report'
  | 'technical-doc'
  | 'court-doc'
  | 'other'

export type LanguageTier = 'common' | 'medium' | 'rare'

/**
 * Kelime ücreti kademesi. `upTo` kelimeye kadar `rate` uygulanır (progresif).
 * Son kademenin üzerindeki kelimeler son kademenin oranıyla ücretlendirilir.
 */
export interface WordRateTier {
  upTo: number
  rate: number
}

export interface PricingConfig {
  currency: 'TRY'
  /** Sabit kelime ücreti (tiers tanımlı DEĞİLSE kullanılır). */
  perWordRate: number
  /**
   * İLERİDE kelime ücreti sabit kalmayacak (kullanıcı notu). Hacme göre kademeli
   * ücret için burayı doldurmak YETERLİDİR; calculateQuote otomatik kademeli çalışır.
   * undefined ise düz `perWordRate` kullanılır.
   */
  wordRateTiers?: WordRateTier[]
  minimumOrderAmount: number
  /** Günlük tahmini kapasite (kelime/gün) — teslim süresi hesabı için. */
  estimatedDailyCapacity: number
  minDeliveryDays: number
  urgencyDeliveryFactor: number
  serviceBasePrice: Record<ServiceId, number>
  documentTypeMultiplier: Record<DocumentTypeId, number>
  languageTierMultiplier: Record<LanguageTier, number>
  urgencyMultiplier: number
  notarizationFee: number
  physicalDeliveryFee: number
  /** KDV oranı (%). Vergi gösterimi gerekiyorsa kullanılır. */
  taxRatePercent: number
}

export const PRICING: PricingConfig = {
  currency: 'TRY',
  perWordRate: 0.25,
  // Örnek (şu an KAPALI): hacimli işlerde kademeli indirim için doldurulabilir.
  // wordRateTiers: [ { upTo: 1000, rate: 0.28 }, { upTo: 5000, rate: 0.24 }, { upTo: Infinity, rate: 0.2 } ],
  minimumOrderAmount: 300,
  estimatedDailyCapacity: 2500,
  minDeliveryDays: 1,
  urgencyDeliveryFactor: 0.5,
  serviceBasePrice: {
    sworn: 150,
    notarized: 200,
    apostille: 250,
    legal: 180,
    technical: 160,
    medical: 180,
    academic: 160,
    localization: 200,
  },
  documentTypeMultiplier: {
    diploma: 1,
    passport: 1,
    'civil-registry': 1,
    contract: 1.15,
    'medical-report': 1.2,
    'technical-doc': 1.15,
    'court-doc': 1.25,
    other: 1,
  },
  languageTierMultiplier: {
    common: 1,
    medium: 1.25,
    rare: 1.6,
  },
  urgencyMultiplier: 1.5,
  notarizationFee: 250,
  physicalDeliveryFee: 120,
  taxRatePercent: 20,
}

/** Kelime sayısı sınırları (§13: 100–10.000 başlangıç aralığı). */
export const WORD_COUNT = { min: 100, max: 10000, default: 1000, step: 50 } as const

/** Fiyat formunda seçilebilir diller ve tier'ları. */
export const QUOTE_LANGUAGES: { code: string; labelTr: string; tier: LanguageTier }[] = [
  { code: 'tr', labelTr: 'Türkçe', tier: 'common' },
  { code: 'en', labelTr: 'İngilizce', tier: 'common' },
  { code: 'de', labelTr: 'Almanca', tier: 'common' },
  { code: 'nl', labelTr: 'Felemenkçe', tier: 'medium' },
  { code: 'fr', labelTr: 'Fransızca', tier: 'medium' },
  { code: 'es', labelTr: 'İspanyolca', tier: 'medium' },
  { code: 'it', labelTr: 'İtalyanca', tier: 'medium' },
  { code: 'ru', labelTr: 'Rusça', tier: 'medium' },
  { code: 'ar', labelTr: 'Arapça', tier: 'rare' },
]

export const DOCUMENT_TYPES: { id: DocumentTypeId; labelTr: string }[] = [
  { id: 'diploma', labelTr: 'Diploma' },
  { id: 'passport', labelTr: 'Pasaport' },
  { id: 'civil-registry', labelTr: 'Nüfus Kayıt Örneği' },
  { id: 'contract', labelTr: 'Sözleşme' },
  { id: 'medical-report', labelTr: 'Medikal Rapor' },
  { id: 'technical-doc', labelTr: 'Teknik Doküman' },
  { id: 'court-doc', labelTr: 'Mahkeme Belgesi' },
  { id: 'other', labelTr: 'Diğer' },
]

/** Dosya yükleme allowlist (§13, §29). */
export const UPLOAD = {
  maxSizeBytes: 10 * 1024 * 1024,
  acceptedMime: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
  ],
  acceptedExtensions: ['.pdf', '.doc', '.docx', '.txt'],
} as const

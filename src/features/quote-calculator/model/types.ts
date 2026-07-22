import type { AreaId } from '@/app/config/areas.config'

export interface QuoteInput {
  /** Çeviri alanı (Hizmet Türü) — orders.service kolonunda saklanır. */
  service: AreaId
  /** Belge türü (alan alt başlığı) — yalnızca açıklama; fiyatı etkilemez. */
  documentType: string
  sourceLang: string
  targetLang: string
  wordCount: number
  urgent: boolean
  /** Ek: Yeminli tercüme (noter ile aynı anda seçilemez). */
  sworn: boolean
  /** Ek: Noter onayı (yeminli ile aynı anda seçilemez). */
  notarization: boolean
  /** Ek: Apostil süreci desteği. */
  apostille: boolean
  physicalDelivery: boolean
}

export interface QuoteBreakdown {
  currency: 'TRY'
  basePrice: number
  wordPrice: number
  addonsPrice: number
  subtotal: number
  tax: number
  total: number
  deliveryDays: number
}

import type { ServiceId } from '@/app/config/services'
import type { DocumentTypeId } from '@/app/config/pricing.config'

export interface QuoteInput {
  service: ServiceId
  documentType: DocumentTypeId
  sourceLang: string
  targetLang: string
  wordCount: number
  urgent: boolean
  notarization: boolean
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

import { describe, expect, it } from 'vitest'
import { baseWordCost, calculateQuote, estimateDeliveryDays, pairTier } from './calculate'
import { PRICING, type PricingConfig } from '@/app/config/pricing.config'
import type { QuoteInput } from './types'

const baseInput: QuoteInput = {
  service: 'sworn',
  documentType: 'diploma',
  sourceLang: 'tr',
  targetLang: 'en',
  wordCount: 1000,
  urgent: false,
  notarization: false,
  physicalDelivery: false,
}

describe('calculateQuote', () => {
  it('temel senaryo: base + kelime + KDV', () => {
    const q = calculateQuote(baseInput)
    expect(q.basePrice).toBe(150)
    expect(q.wordPrice).toBe(250) // 1000 * 0.25 * 1 * 1
    expect(q.addonsPrice).toBe(0)
    expect(q.subtotal).toBe(400)
    expect(q.tax).toBe(80) // %20
    expect(q.total).toBe(480)
    expect(q.deliveryDays).toBe(1)
  })

  it('minimum sipariş tutarını uygular', () => {
    const q = calculateQuote({ ...baseInput, wordCount: 100 })
    // base150 + word25 = 175 < 300 -> subtotal 300
    expect(q.subtotal).toBe(300)
    expect(q.tax).toBe(60)
    expect(q.total).toBe(360)
  })

  it('acil + nadir dil + belge çarpanı + ek hizmetler', () => {
    const q = calculateQuote({
      service: 'legal',
      documentType: 'court-doc',
      sourceLang: 'tr',
      targetLang: 'ar', // rare
      wordCount: 2000,
      urgent: true,
      notarization: true,
      physicalDelivery: true,
    })
    expect(q.basePrice).toBe(180)
    expect(q.wordPrice).toBe(1000) // 2000 * 0.25 * 1.6 * 1.25
    // urgency surcharge = round((180+1000)*0.5)=590, + notary250 + physical120
    expect(q.addonsPrice).toBe(590 + 250 + 120)
    expect(q.subtotal).toBe(180 + 1000 + 960)
    expect(q.total).toBe(q.subtotal + q.tax)
  })

  it('negatif/ondalık kelime sayısını güvenle işler', () => {
    const q = calculateQuote({ ...baseInput, wordCount: -5 })
    expect(q.wordPrice).toBe(0)
    expect(q.subtotal).toBe(300) // sadece base150 -> min 300
  })
})

describe('estimateDeliveryDays', () => {
  it('kapasiteye göre iş günü', () => {
    expect(estimateDeliveryDays(1000, false)).toBe(1)
    expect(estimateDeliveryDays(8000, false)).toBe(4) // ceil(8000/2500)
  })
  it('acil teslim süreyi kısaltır ama minimumun altına inmez', () => {
    expect(estimateDeliveryDays(8000, true)).toBe(2) // ceil(4*0.5)
    expect(estimateDeliveryDays(500, true)).toBe(1)
  })
})

describe('baseWordCost (ileride değişecek ücret modeli)', () => {
  it('tier yoksa düz perWordRate', () => {
    expect(baseWordCost(1000, PRICING)).toBe(250) // 1000 * 0.25
  })

  it('kademeli tarife progresif hesaplar', () => {
    const tiered: PricingConfig = {
      ...PRICING,
      wordRateTiers: [
        { upTo: 1000, rate: 0.3 },
        { upTo: 5000, rate: 0.2 },
        { upTo: Infinity, rate: 0.1 },
      ],
    }
    // 1000@0.30 = 300 ; sonraki 500@0.20 = 100 -> 400
    expect(baseWordCost(1500, tiered)).toBe(400)
    // son kademe üstü: 1000@0.30 + 4000@0.20 + 1000@0.10 = 300+800+100 = 1200
    expect(baseWordCost(6000, tiered)).toBe(1200)
  })
})

describe('pairTier', () => {
  it('daha yüksek tier belirleyicidir', () => {
    expect(pairTier('tr', 'en')).toBe('common')
    expect(pairTier('tr', 'fr')).toBe('medium')
    expect(pairTier('tr', 'ar')).toBe('rare')
    expect(pairTier('ar', 'en')).toBe('rare')
  })
})

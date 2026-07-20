import type { VerificationStatus } from '@/types/verification'

/**
 * İstatistikler (§11.3, §28). Değerler DOĞRULANMAMIŞtır -> üretimde ham iddia
 * gibi gösterilmez. UI, status !== 'verified' ise `safeDisplay` kullanır
 * (gerçek sayı değil). Doğrulanınca status 'verified' yapılır.
 */
export interface StatItem {
  key: string
  /** Gerçek iddia (yalnız 'verified' olduğunda gösterilebilir). */
  rawValue: string
  /** Doğrulanana kadar gösterilecek güvenli değer. */
  safeDisplay: string
  labelTr: string
  status: VerificationStatus
}

export const STATISTICS: StatItem[] = [
  { key: 'completed', rawValue: '15.000+', safeDisplay: 'Doğrulanacak', labelTr: 'Tamamlanan iş', status: 'unverified' },
  { key: 'corporate', rawValue: '500+', safeDisplay: 'Doğrulanacak', labelTr: 'Kurumsal müşteri', status: 'unverified' },
  { key: 'satisfaction', rawValue: '%98', safeDisplay: 'Doğrulanacak', labelTr: 'Müşteri memnuniyeti', status: 'unverified' },
  { key: 'languages', rawValue: '50+', safeDisplay: '50+', labelTr: 'Dil desteği', status: 'unverified' },
]

/** Kurumsal sayfa istatistikleri (§14). Doğrulanmamış. */
export const CORPORATE_STATS: StatItem[] = [
  { key: 'corporate', rawValue: '500+', safeDisplay: 'Doğrulanacak', labelTr: 'Kurumsal müşteri', status: 'unverified' },
  { key: 'discount', rawValue: '%30', safeDisplay: 'Doğrulanacak', labelTr: 'Toplu sipariş indirimi', status: 'unverified' },
  { key: 'term', rawValue: '30 gün', safeDisplay: 'Doğrulanacak', labelTr: 'Ödeme vadesi', status: 'unverified' },
]

/** Bir istatistiğin UI'da gösterilecek değeri (doğrulama durumuna göre). */
export function statDisplay(item: StatItem): string {
  return item.status === 'verified' ? item.rawValue : item.safeDisplay
}

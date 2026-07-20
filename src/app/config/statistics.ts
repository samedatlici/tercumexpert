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
  /** Lucide ikon anahtarı (components/common/Icon). Opsiyonel. */
  icon?: string
  status: VerificationStatus
}

// NOT: Değerler DOĞRULANMAMIŞtır; DEMO amaçlı referanstaki gibi gösterilir (§28).
export const STATISTICS: StatItem[] = [
  { key: 'satisfaction', rawValue: '%98', safeDisplay: '%98', labelTr: 'Müşteri Memnuniyeti', icon: 'TrendingUp', status: 'unverified' },
  { key: 'completed', rawValue: '15.000+', safeDisplay: '15.000+', labelTr: 'Tamamlanan İş', icon: 'CircleCheck', status: 'unverified' },
  { key: 'languages', rawValue: '50+', safeDisplay: '50+', labelTr: 'Dil Desteği', icon: 'Globe', status: 'unverified' },
  { key: 'corporate', rawValue: '500+', safeDisplay: '500+', labelTr: 'Kurumsal Müşteri', icon: 'Building2', status: 'unverified' },
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

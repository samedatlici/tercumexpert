/**
 * Doğrulama durumu (Şartname §28, §34).
 * İddialı/hassas veriler bu durumla işaretlenir; `unverified` veya
 * `requires-legal-review` olanlar üretimde ham iddia gibi gösterilmez.
 */
export type VerificationStatus = 'verified' | 'unverified' | 'draft' | 'requires-legal-review'

/** Bir değeri doğrulama durumuyla sarmalar. */
export interface Verifiable<T> {
  value: T
  status: VerificationStatus
  /** Kaynağı/nedeni: neden doğrulanmadı, ne gerekiyor. */
  note?: string
}

export function verifiable<T>(
  value: T,
  status: VerificationStatus,
  note?: string,
): Verifiable<T> {
  return note !== undefined ? { value, status, note } : { value, status }
}

/** Üretimde güvenle gösterilebilir mi? (yalnızca 'verified') */
export function isDisplayableInProduction(status: VerificationStatus): boolean {
  return status === 'verified'
}

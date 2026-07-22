export interface LanguagePair {
  source: string
  target: string
}

export type TranslatorStatus = 'pending' | 'approved' | 'rejected'

/** `public.translators` satırı (Faz 1 SQL). */
export interface Translator {
  id: string
  user_id: string
  full_name: string | null
  birth_date: string | null
  phone: string | null
  address: string | null
  iban: string | null
  iban_name: string | null
  iban_verified: boolean
  language_pairs: LanguagePair[]
  expertise: string[]
  status: TranslatorStatus
  created_at: string
  updated_at: string
}

export type PartnerStatus = 'pending' | 'approved' | 'rejected'

/** `public.partners` satırı (partner_system.sql — Faz 1). */
export interface Partner {
  id: string
  user_id: string
  ref_code: string
  company: string | null
  sector: string | null
  sector_other: string | null
  contact_name: string | null
  title_role: string | null
  email: string | null
  email_verified: boolean
  phone: string | null
  country: string | null
  city: string | null
  address: string | null
  iban: string | null
  iban_name: string | null
  iban_verified: boolean
  status: PartnerStatus
  was_approved: boolean
  potential: string | null
  note: string | null
  created_at: string
  updated_at: string
  /** Admin ciro/log görünümü: hesap kaydı silinmiş/yasaklı mı (yalnız adminPartnerDetail doldurur). */
  accountStatus?: 'deleted' | 'banned' | null
}

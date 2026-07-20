import { env } from './env'
import { verifiable, type Verifiable } from '@/types/verification'

/**
 * Site geneli bilgi. KRİTİK alanlar (şirket unvanı, adres, telefon, e-posta,
 * MERSİS/vergi) UYDURULMAZ (§34) -> Verifiable ile 'unverified'/'requires-legal-review'.
 * UI, doğrulanmamış değerleri ham iddia gibi göstermez; checklist'te takip edilir.
 */
export interface CompanyInfo {
  legalName: Verifiable<string>
  mersis: Verifiable<string>
  taxOffice: Verifiable<string>
  address: Verifiable<string>
  phone: Verifiable<string>
  email: Verifiable<string>
  workingHours: Verifiable<string>
}

export const company: CompanyInfo = {
  legalName: verifiable('[ŞİRKET UNVANI EKLENECEK]', 'requires-legal-review', 'Resmî ticaret unvanı.'),
  mersis: verifiable('[MERSİS NO EKLENECEK]', 'requires-legal-review'),
  taxOffice: verifiable('[VERGİ DAİRESİ / NO EKLENECEK]', 'requires-legal-review'),
  address: verifiable('[AÇIK ADRES EKLENECEK]', 'unverified', 'Adres doğrulanmadan harita embed edilmez.'),
  phone: verifiable('[TELEFON EKLENECEK]', 'unverified'),
  email: verifiable('info@tercumexpert.com', 'unverified', 'Kurumsal e-posta doğrulanacak.'),
  workingHours: verifiable('Hafta içi 09:00–18:00', 'unverified'),
}

export const siteConfig = {
  name: env.VITE_APP_NAME,
  url: env.VITE_APP_URL,
  whatsappNumber: env.VITE_WHATSAPP_NUMBER,
  social: {
    facebook: '',
    x: '',
    linkedin: '',
    instagram: '',
  },
} as const

/** WhatsApp deep link (numara yoksa boş). PII event payload'a yazılmaz. */
export function whatsappLink(message?: string): string {
  const num = siteConfig.whatsappNumber.replace(/\D/g, '')
  if (!num) return ''
  const q = message ? `?text=${encodeURIComponent(message)}` : ''
  return `https://wa.me/${num}${q}`
}

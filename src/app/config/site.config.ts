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

// NOT: Aşağıdaki iletişim değerleri DEMO/placeholder'dır (referanstaki gibi görünmesi
// için). Hiçbiri doğrulanmış gerçek bilgi DEĞİLDİR; yayından önce değiştirilmelidir
// (PROJECT_CHECKLIST.md). Adres doğrulanmadan harita embed EDİLMEZ.
export const company: CompanyInfo = {
  legalName: verifiable('[ŞİRKET UNVANI EKLENECEK]', 'requires-legal-review', 'Resmî ticaret unvanı.'),
  mersis: verifiable('[MERSİS NO EKLENECEK]', 'requires-legal-review'),
  taxOffice: verifiable('[VERGİ DAİRESİ / NO EKLENECEK]', 'requires-legal-review'),
  address: verifiable('Beşiktaş, İstanbul, Türkiye', 'unverified', 'DEMO adres — doğrulanmadan harita embed edilmez.'),
  phone: verifiable('+90 555 123 45 67', 'unverified', 'DEMO numara — gerçek numarayla değiştirilecek.'),
  email: verifiable('info@tercumexpert.com', 'unverified', 'DEMO e-posta — doğrulanacak.'),
  workingHours: verifiable('Hafta İçi 09:00 - 18:00 | Mesai Dışı Hizmet Mevcuttur', 'unverified'),
}

export const siteConfig = {
  name: env.VITE_APP_NAME,
  url: env.VITE_APP_URL,
  // env doldurulmazsa DEMO numaraya düşer (referans görünümü için). Gerçek numara env'den.
  whatsappNumber: env.VITE_WHATSAPP_NUMBER || '905551234567',
  // DEMO sosyal linkler — gerçek hesaplarla değiştirilecek (checklist).
  social: {
    facebook: 'https://facebook.com',
    x: 'https://x.com',
    linkedin: 'https://linkedin.com',
    instagram: 'https://instagram.com',
  },
} as const

/** WhatsApp deep link (numara yoksa boş). PII event payload'a yazılmaz. */
export function whatsappLink(message?: string): string {
  const num = siteConfig.whatsappNumber.replace(/\D/g, '')
  if (!num) return ''
  const q = message ? `?text=${encodeURIComponent(message)}` : ''
  return `https://wa.me/${num}${q}`
}

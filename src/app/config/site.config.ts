import { env } from './env'
import { verifiable, type Verifiable } from '@/types/verification'

/**
 * Site geneli bilgi. KRİTİK alanlar (şirket unvanı, adres, telefon, e-posta,
 * MERSİS/vergi) UYDURULMAZ (§34) -> Verifiable ile 'unverified'/'requires-legal-review'.
 * UI, doğrulanmamış değerleri ham iddia gibi göstermez; checklist'te takip edilir.
 */
export interface CompanyInfo {
  legalName: Verifiable<string>
  taxOffice: Verifiable<string>
  taxNo: Verifiable<string>
  address: Verifiable<string>
  phone: Verifiable<string>
  email: Verifiable<string>
  workingHours: Verifiable<string>
}

// Kimlik/vergi bilgileri vergi levhasından doğrulanmıştır (şahıs işletmesi — ticaret
// unvanı yok, MERSİS yok). GİZLİLİK: yasal ad + adres YALNIZCA hukuki metin ve faturada
// kullanılır; pazarlama sayfalarında (footer/header/iletişim) GÖSTERİLMEZ. Site genelinde
// marka "TercümExpert" öne çıkar. Telefon/WhatsApp henüz eklenmedi (ertelendi — takip listesi).
export const company: CompanyInfo = {
  legalName: verifiable('Samed Fazlı Atlıcı', 'verified', 'Şahıs işletmesi — yasal satıcı adı (marka: TercümExpert). Yalnız hukuki/fatura.'),
  taxOffice: verifiable('Meram Vergi Dairesi', 'verified'),
  taxNo: verifiable('1030833272', 'verified', 'Vergi Kimlik No (VKN).'),
  address: verifiable('Şeyh Şamil Mah. Eylül Sk. No: 2/D, Selçuklu, Konya', 'verified', 'Kayıtlı adres — YALNIZCA hukuki metin/faturada; pazarlama sayfalarında gösterilmez.'),
  phone: verifiable('+90 555 123 45 67', 'unverified', 'GEÇİCİ placeholder — gerçek numara gelince değiştirilecek (takip: COMPANY_INFO_PENDING.md). Gizlenmez.'),
  email: verifiable('info@tercumexpert.com', 'verified', 'Google Workspace — şu an alias; ayrı hesaba geçilecek (hatırlatma).'),
  workingHours: verifiable('Hafta İçi 09:00 - 18:00 | Mesai Dışı Hizmet Mevcuttur', 'verified'),
}

export const siteConfig = {
  name: env.VITE_APP_NAME,
  url: env.VITE_APP_URL,
  // GEÇİCİ placeholder numara — gerçek numara/env gelince değiştirilecek (COMPANY_INFO_PENDING.md).
  whatsappNumber: env.VITE_WHATSAPP_NUMBER || '905551234567',
  // GEÇİCİ sosyal linkler — 4 platform da (Instagram, Facebook, X, LinkedIn) gerçek
  // linklerle değiştirilecek (ertelendi). İkonlar GİZLENMEZ.
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

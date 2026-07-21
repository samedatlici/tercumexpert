import { env } from './env'

/**
 * Site geneli sabit bilgiler (marka, iletişim, sosyal).
 * Tek kaynak — footer, header, SEO ve JSON-LD buradan beslenir.
 */
export const siteConfig = {
  name: env.VITE_APP_NAME,
  url: env.VITE_APP_URL,
  description: 'Uzman çeviri ve lokalizasyon hizmetleri — 8 dilde, kurumsal kalite.',
  contact: {
    email: 'info@tercumexpert.com',
    phone: '',
    address: '',
  },
  social: {
    linkedin: '',
    instagram: '',
    x: '',
  },
} as const

export type SiteConfig = typeof siteConfig

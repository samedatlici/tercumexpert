import { siteConfig } from './site.config'

/**
 * Varsayılan SEO/meta değerleri. Sayfa bazında override edilir.
 * (react-helmet-async veya eşdeğeri ile uygulanır — PROJECT_RULES §12.)
 */
export const seoConfig = {
  titleTemplate: `%s | ${siteConfig.name}`,
  defaultTitle: `${siteConfig.name} — Uzman Çeviri ve Lokalizasyon`,
  defaultDescription: siteConfig.description,
  openGraph: {
    type: 'website',
    siteName: siteConfig.name,
    image: `${siteConfig.url}/images/og-default.jpg`,
    imageWidth: 1200,
    imageHeight: 630,
  },
  twitter: {
    card: 'summary_large_image',
  },
} as const

export type SeoConfig = typeof seoConfig

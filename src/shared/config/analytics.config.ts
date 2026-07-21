import { env } from './env'

/**
 * Analytics sağlayıcıları — sadece ilgili ID env'de DOLU ise aktif olur.
 * AnalyticsProvider bu map'i okur; boş olanlar için script YÜKLENMEZ
 * (performans + gizlilik). ARCHITECTURE.md §10.
 */
export const analyticsConfig = {
  ga: {
    id: env.VITE_GA_MEASUREMENT_ID,
    enabled: env.VITE_GA_MEASUREMENT_ID.length > 0,
  },
  clarity: {
    id: env.VITE_CLARITY_PROJECT_ID,
    enabled: env.VITE_CLARITY_PROJECT_ID.length > 0,
  },
  metaPixel: {
    id: env.VITE_META_PIXEL_ID,
    enabled: env.VITE_META_PIXEL_ID.length > 0,
  },
} as const

export type AnalyticsConfig = typeof analyticsConfig

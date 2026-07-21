import { z } from 'zod'

/**
 * Tüm environment değişkenleri uygulama başında Zod ile doğrulanır.
 * Eksik/yanlış env -> başlangıçta anlaşılır hata (ARCHITECTURE.md §9).
 */
const booleanFromString = z
  .enum(['true', 'false'])
  .default('false')
  .transform((v) => v === 'true')

const envSchema = z.object({
  VITE_APP_NAME: z.string().min(1).default('TercümExpert'),
  VITE_APP_URL: z.string().url().default('http://localhost:5173'),
  VITE_APP_ENV: z.enum(['development', 'staging', 'production']).default('development'),
  VITE_DEFAULT_LOCALE: z.string().min(2).default('tr'),

  VITE_API_BASE_URL: z.string().default(''),
  VITE_API_MODE: z.enum(['mock', 'live']).default('mock'),

  VITE_GA_MEASUREMENT_ID: z.string().default(''),
  VITE_CLARITY_PROJECT_ID: z.string().default(''),
  VITE_META_PIXEL_ID: z.string().default(''),
  VITE_GSC_VERIFICATION: z.string().default(''),

  VITE_FEATURE_DARK_MODE: booleanFromString,
  VITE_FEATURE_CHATBOT: booleanFromString,
})

const parsed = envSchema.safeParse(import.meta.env)

if (!parsed.success) {
  // eslint-disable-next-line no-console
  console.error('❌ Geçersiz environment değişkenleri:', parsed.error.flatten().fieldErrors)
  throw new Error('Environment doğrulaması başarısız. .env.local dosyanızı kontrol edin.')
}

export const env = parsed.data
export type Env = typeof env

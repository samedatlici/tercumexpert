import { z } from 'zod'

/**
 * Environment değişkenleri Zod ile doğrulanır (§29). VITE_ önekli değerler
 * tarayıcıya gömülür -> GİZLİ ANAHTAR KONULMAZ. Base URL hard-code EDİLMEZ (§31).
 */
const boolFromString = z
  .enum(['true', 'false'])
  .default('false')
  .transform((v) => v === 'true')

const schema = z.object({
  VITE_APP_NAME: z.string().min(1).default('TercümExpert'),
  VITE_APP_URL: z.string().url().default('http://localhost:5173'),
  VITE_APP_ENV: z.enum(['development', 'staging', 'production']).default('development'),

  VITE_API_BASE_URL: z.string().default(''),
  VITE_API_MODE: z.enum(['mock', 'live']).default('mock'),

  VITE_WHATSAPP_NUMBER: z.string().default(''),

  VITE_GA_MEASUREMENT_ID: z.string().default(''),
  VITE_GTM_ID: z.string().default(''),
  VITE_CLARITY_PROJECT_ID: z.string().default(''),
  VITE_META_PIXEL_ID: z.string().default(''),
  VITE_GSC_VERIFICATION: z.string().default(''),

  VITE_FEATURE_DARK_MODE: boolFromString,
  VITE_FEATURE_CHATBOT: boolFromString,
  VITE_FEATURE_BLOG: boolFromString,
})

const parsed = schema.safeParse(import.meta.env)

if (!parsed.success) {
  // eslint-disable-next-line no-console
  console.error('❌ Geçersiz environment değişkenleri:', parsed.error.flatten().fieldErrors)
  throw new Error('Environment doğrulaması başarısız. .env.local dosyanızı kontrol edin.')
}

export const env = parsed.data
export type Env = typeof env

export const isProduction = env.VITE_APP_ENV === 'production'
export const isMockMode = env.VITE_API_MODE === 'mock'

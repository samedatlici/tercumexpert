/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_APP_NAME: string
  readonly VITE_APP_URL: string
  readonly VITE_APP_ENV: 'development' | 'staging' | 'production'
  readonly VITE_DEFAULT_LOCALE: string
  readonly VITE_API_BASE_URL: string
  readonly VITE_API_MODE: 'mock' | 'live'
  readonly VITE_GA_MEASUREMENT_ID: string
  readonly VITE_CLARITY_PROJECT_ID: string
  readonly VITE_META_PIXEL_ID: string
  readonly VITE_GSC_VERIFICATION: string
  readonly VITE_FEATURE_DARK_MODE: string
  readonly VITE_FEATURE_CHATBOT: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

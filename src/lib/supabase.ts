import { createClient } from '@supabase/supabase-js'
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '@/app/config/supabase.config'

/**
 * "Beni hatırla" desteği: işaretliyse oturum localStorage'da (tarayıcı kapansa da
 * kalıcı) tutulur; değilse sessionStorage'da (sekme kapanınca silinir).
 * setRemember(flag) giriş/kayıt öncesi çağrılır. Varsayılan: hatırla (kalıcı).
 */
const REMEMBER_KEY = 'te-remember'

export function setRemember(flag: boolean): void {
  try {
    window.localStorage.setItem(REMEMBER_KEY, flag ? '1' : '0')
  } catch {
    /* storage kapalıysa yut */
  }
}

function persistent(): boolean {
  try {
    return window.localStorage.getItem(REMEMBER_KEY) !== '0'
  } catch {
    return true
  }
}

/** Hatırla bayrağına göre local/session storage arasında yönlendiren depolama. */
const rememberStorage = {
  getItem(key: string): string | null {
    try {
      return window.localStorage.getItem(key) ?? window.sessionStorage.getItem(key)
    } catch {
      return null
    }
  },
  setItem(key: string, value: string): void {
    try {
      if (persistent()) {
        window.localStorage.setItem(key, value)
        window.sessionStorage.removeItem(key)
      } else {
        window.sessionStorage.setItem(key, value)
        window.localStorage.removeItem(key)
      }
    } catch {
      /* yut */
    }
  },
  removeItem(key: string): void {
    try {
      window.localStorage.removeItem(key)
      window.sessionStorage.removeItem(key)
    } catch {
      /* yut */
    }
  },
}

/**
 * Tek Supabase istemcisi (singleton). Oturum "beni hatırla"ya göre kalıcı ya da
 * sekme-ömürlü tutulur ve otomatik yenilenir. DB/Storage kullanımları da bunu paylaşır.
 */
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: rememberStorage,
  },
})

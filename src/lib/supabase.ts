import { createClient } from '@supabase/supabase-js'
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '@/app/config/supabase.config'

/**
 * Tek Supabase istemcisi (singleton). Oturum tarayıcıda kalıcı tutulur ve
 * otomatik yenilenir. Auth dışındaki (DB/Storage) kullanımlar da bunu paylaşır.
 */
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
})

/**
 * Supabase bağlantı ayarları.
 * publishable/anon anahtar tarayıcıya çıkması TASARLANMIŞ, herkese açık bir
 * değerdir (güvenli). Gizli olan "service_role" anahtarı ASLA buraya konmaz.
 * İstenirse Vercel ortam değişkenleriyle (VITE_*) geçersiz kılınabilir.
 */
export const SUPABASE_URL =
  import.meta.env.VITE_SUPABASE_URL ?? 'https://xtqymenxaozzwmqfssod.supabase.co'

export const SUPABASE_ANON_KEY =
  import.meta.env.VITE_SUPABASE_ANON_KEY ?? 'sb_publishable_0WouTRC6t0ezg6OOJgpmzw_NXBhK-YY'

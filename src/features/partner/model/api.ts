import { supabase } from '@/lib/supabase'

/**
 * Partner sunucu uç noktasına (service-role) çağrı. Kullanıcının Supabase erişim
 * jetonunu Authorization başlığında gönderir; sunucu kimliği doğrular.
 */
export async function partnerApi<T = unknown>(
  action: string,
  payload: Record<string, unknown> = {},
): Promise<T> {
  const {
    data: { session },
  } = await supabase.auth.getSession()
  const token = session?.access_token
  const res = await fetch('/api/partner', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ action, ...payload }),
  })
  return (await res.json().catch(() => ({}))) as T
}

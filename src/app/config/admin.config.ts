/**
 * Yönetim paneli erişimi. Yalnızca bu e-posta(lar) ile giriş yapan kullanıcı
 * `/{lang}/admin` sayfasında sohbet kayıtlarını görebilir.
 *
 * NOT: Bu yalnızca arayüz kontrolüdür. Asıl güvenlik Supabase RLS'tedir
 * (chat_conversations tablosunda aynı e-posta listesi tanımlıdır). İki yeri de
 * güncel tutun.
 */
export const ADMIN_EMAILS: string[] = ['admin@tercumexpert.com']

export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false
  return ADMIN_EMAILS.map((e) => e.toLowerCase()).includes(email.toLowerCase())
}

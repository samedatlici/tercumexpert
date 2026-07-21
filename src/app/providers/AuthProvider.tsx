import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'

interface SignUpArgs {
  firstName: string
  lastName: string
  email: string
  password: string
}

interface AuthContextValue {
  user: User | null
  session: Session | null
  loading: boolean
  /** Google ile giriş (OAuth yönlendirmesi). */
  signInWithGoogle: (redirectTo: string) => Promise<{ error: string | null }>
  /** E-posta + şifre ile giriş. */
  signInWithPassword: (email: string, password: string) => Promise<{ error: string | null }>
  /** E-posta + şifre ile kayıt. Ardından e-postaya doğrulama bağlantısı gönderilir. */
  signUp: (args: SignUpArgs, redirectTo: string) => Promise<{ error: string | null; needsVerification: boolean }>
  /** E-postaya gelen 6 haneli doğrulama kodunu onaylar (SMTP + kod şablonu ile). */
  verifyEmailCode: (email: string, code: string) => Promise<{ error: string | null }>
  /** Doğrulama e-postasını yeniden gönderir. */
  resendCode: (email: string, redirectTo: string) => Promise<{ error: string | null }>
  /** Misafir hızlı geçiş: şifresiz e-posta kodu gönderir (ad/soyad kaydedilir). */
  sendGuestCode: (email: string, firstName: string, lastName: string, phone?: string) => Promise<{ error: string | null }>
  /** Misafir hızlı geçiş: e-posta koduyla oturum açar. */
  verifyGuestCode: (email: string, code: string) => Promise<{ error: string | null }>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

/** Supabase hata mesajlarını kullanıcı dostu Türkçeye çevirir. */
function trError(message: string | undefined): string {
  if (!message) return 'Bir hata oluştu. Lütfen tekrar deneyin.'
  const m = message.toLowerCase()
  if (m.includes('invalid login credentials')) return 'E-posta veya şifre hatalı.'
  if (m.includes('email not confirmed')) return 'E-postanız henüz doğrulanmadı. Lütfen kodu girin.'
  if (m.includes('user already registered') || m.includes('already been registered'))
    return 'Bu e-posta ile zaten bir hesap var. Giriş yapmayı deneyin.'
  if (m.includes('password should be at least')) return 'Şifre en az 6 karakter olmalıdır.'
  if (m.includes('token has expired') || m.includes('invalid') && m.includes('otp'))
    return 'Kod hatalı veya süresi dolmuş. Yeni kod isteyin.'
  if (m.includes('rate limit') || m.includes('too many')) return 'Çok fazla deneme. Lütfen biraz bekleyin.'
  return message
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    supabase.auth.getSession().then(({ data }) => {
      if (!active) return
      setSession(data.session)
      setLoading(false)
    })
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s)
      setLoading(false)
    })
    return () => {
      active = false
      sub.subscription.unsubscribe()
    }
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      user: session?.user ?? null,
      session,
      loading,
      async signInWithGoogle(redirectTo) {
        const { error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: { redirectTo },
        })
        return { error: error ? trError(error.message) : null }
      },
      async signInWithPassword(email, password) {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        return { error: error ? trError(error.message) : null }
      },
      async signUp({ firstName, lastName, email, password }, redirectTo) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: redirectTo,
            data: {
              first_name: firstName,
              last_name: lastName,
              full_name: `${firstName} ${lastName}`.trim(),
            },
          },
        })
        if (error) return { error: trError(error.message), needsVerification: false }
        // Oturum yoksa e-posta doğrulaması gerekiyordur.
        const needsVerification = !data.session
        return { error: null, needsVerification }
      },
      async verifyEmailCode(email, code) {
        const { error } = await supabase.auth.verifyOtp({ email, token: code, type: 'signup' })
        return { error: error ? trError(error.message) : null }
      },
      async resendCode(email, redirectTo) {
        const { error } = await supabase.auth.resend({
          type: 'signup',
          email,
          options: { emailRedirectTo: redirectTo },
        })
        return { error: error ? trError(error.message) : null }
      },
      async sendGuestCode(email, firstName, lastName, phone) {
        const { error } = await supabase.auth.signInWithOtp({
          email,
          options: {
            shouldCreateUser: true,
            data: {
              first_name: firstName,
              last_name: lastName,
              full_name: `${firstName} ${lastName}`.trim(),
              phone: phone ?? null,
            },
          },
        })
        return { error: error ? trError(error.message) : null }
      },
      async verifyGuestCode(email, code) {
        const { error } = await supabase.auth.verifyOtp({ email, token: code, type: 'email' })
        return { error: error ? trError(error.message) : null }
      },
      async signOut() {
        await supabase.auth.signOut()
      },
    }),
    [session, loading],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth, AuthProvider içinde kullanılmalıdır.')
  return ctx
}

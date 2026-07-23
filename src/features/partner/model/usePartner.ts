import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/app/providers/AuthProvider'
import { isAdminEmail } from '@/app/config/admin.config'
import type { Partner } from './types'

export type PartnerError = 'none' | 'table' | 'other'

export interface PartnerState {
  loading: boolean
  isAdmin: boolean
  /** Giriş yapan kullanıcının KENDİ partner kaydı (durumu ne olursa olsun) veya null. */
  partner: Partner | null
  error: PartnerError
  refetch: () => void
}

/**
 * Giriş yapan kullanıcının partner rolünü/kaydını çözer. Erişim kararları buna dayanır:
 * admin (isAdmin) veya onaylı partner (partner.status === 'approved') panele girebilir.
 *
 * NOT: Bağımlılık `user.id`'dir (user NESNESİ değil). Supabase sekmeye dönüşte token'ı
 * tazeleyip onAuthStateChange tetikler ve her seferinde YENİ bir user nesnesi üretir;
 * id'ye bağlanmak bu durumda gereksiz yeniden-çekimi (ve panelin "yükleniyor"a düşüp
 * e-posta doğrulama alanını sıfırlamasını) önler. Ayrıca ilk yüklemeden sonra `loaded`
 * kalıcıdır: arka plan yenilemeleri ekranı boşaltmaz.
 */
export function usePartner(): PartnerState {
  const { user, loading: authLoading } = useAuth()
  const userId = user?.id ?? null
  const isAdmin = isAdminEmail(user?.email)
  const [partner, setPartner] = useState<Partner | null>(null)
  const [loaded, setLoaded] = useState(false)
  const [error, setError] = useState<PartnerError>('none')
  const [tick, setTick] = useState(0)
  const refetch = useCallback(() => setTick((t) => t + 1), [])

  useEffect(() => {
    if (authLoading) return
    if (!userId) {
      setPartner(null)
      setError('none')
      setLoaded(true)
      return
    }
    let active = true
    supabase
      .from('partners')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle()
      .then(({ data, error: err }) => {
        if (!active) return
        if (err) {
          setError(err.code === '42P01' ? 'table' : 'other')
          setPartner(null)
        } else {
          setError('none')
          setPartner((data as Partner) ?? null)
        }
        setLoaded(true)
      })
    return () => {
      active = false
    }
  }, [userId, authLoading, tick])

  return { loading: authLoading || !loaded, isAdmin, partner, error, refetch }
}

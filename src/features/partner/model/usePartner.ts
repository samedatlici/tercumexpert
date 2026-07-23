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
 * useTranslator ile birebir aynı desen.
 */
export function usePartner(): PartnerState {
  const { user, loading: authLoading } = useAuth()
  const isAdmin = isAdminEmail(user?.email)
  const [partner, setPartner] = useState<Partner | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<PartnerError>('none')
  const [tick, setTick] = useState(0)
  const refetch = useCallback(() => setTick((t) => t + 1), [])

  useEffect(() => {
    if (authLoading) return
    if (!user) {
      setPartner(null)
      setError('none')
      setLoading(false)
      return
    }
    let active = true
    setLoading(true)
    supabase
      .from('partners')
      .select('*')
      .eq('user_id', user.id)
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
        setLoading(false)
      })
    return () => {
      active = false
    }
  }, [user, authLoading, tick])

  return { loading: authLoading || loading, isAdmin, partner, error, refetch }
}

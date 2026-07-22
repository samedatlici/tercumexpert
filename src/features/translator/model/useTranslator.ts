import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/app/providers/AuthProvider'
import { isAdminEmail } from '@/app/config/admin.config'
import type { Translator } from './types'

export type TranslatorError = 'none' | 'table' | 'other'

export interface TranslatorState {
  loading: boolean
  isAdmin: boolean
  /** Giriş yapan kullanıcının KENDİ tercüman kaydı (durumu ne olursa olsun) veya null. */
  translator: Translator | null
  error: TranslatorError
  refetch: () => void
}

/**
 * Giriş yapan kullanıcının tercüman rolünü/kaydını çözer. Erişim kararları buna dayanır:
 * admin (isAdmin) veya onaylı tercüman (translator.status === 'approved') panele girebilir.
 */
export function useTranslator(): TranslatorState {
  const { user, loading: authLoading } = useAuth()
  const isAdmin = isAdminEmail(user?.email)
  const [translator, setTranslator] = useState<Translator | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<TranslatorError>('none')
  const [tick, setTick] = useState(0)
  const refetch = useCallback(() => setTick((t) => t + 1), [])

  useEffect(() => {
    if (authLoading) return
    if (!user) {
      setTranslator(null)
      setError('none')
      setLoading(false)
      return
    }
    let active = true
    setLoading(true)
    supabase
      .from('translators')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle()
      .then(({ data, error: err }) => {
        if (!active) return
        if (err) {
          setError(err.code === '42P01' ? 'table' : 'other')
          setTranslator(null)
        } else {
          setError('none')
          setTranslator((data as Translator) ?? null)
        }
        setLoading(false)
      })
    return () => {
      active = false
    }
  }, [user, authLoading, tick])

  return { loading: authLoading || loading, isAdmin, translator, error, refetch }
}

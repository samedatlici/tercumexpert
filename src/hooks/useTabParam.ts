import { useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'

/**
 * Aktif panel sekmesini URL'ye (?tab=...) yazar; böylece sayfa YENİLENİNCE aynı sekme
 * açık kalır (ör. "Tamamlanan"), varsayılana ("Profilim") atmaz. Geçersiz/eksik değerde
 * defaultKey döner. URL güncellemesi replace ile yapılır (geri tuşu geçmişini kirletmez).
 */
export function useTabParam<T extends string>(
  valid: readonly T[],
  defaultKey: T,
  param = 'tab',
): [T, (t: T) => void] {
  const [sp, setSp] = useSearchParams()
  const raw = sp.get(param)
  const tab = raw && (valid as readonly string[]).includes(raw) ? (raw as T) : defaultKey
  const setTab = useCallback(
    (t: T) => {
      setSp(
        (prev) => {
          const next = new URLSearchParams(prev)
          next.set(param, t)
          return next
        },
        { replace: true },
      )
    },
    [param, setSp],
  )
  return [tab, setTab]
}

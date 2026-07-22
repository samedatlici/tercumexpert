import { useEffect, useRef, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { FALLBACK_LOCALE, type Locale } from '@/app/config/locales'
import { getSavedLocale, localeFromNavigator, localeFromCountry } from '@/lib/locale-detect'

/**
 * Kök (/) yolunda ziyaretçiyi diline göre otomatik yönlendirir.
 * Öncelik: 1) kayıtlı seçim  2) tarayıcı dili  3) coğrafi ülke (/api/geo)  4) en.
 *
 * 1 ve 2 anında (ağ isteği olmadan) çözülür; çoğu ziyaretçi tarayıcı diliyle
 * hemen doğru sayfaya gider. Yalnızca ikisi de sonuç vermezse /api/geo çağrılır
 * ve bu sırada kısa bir yükleme göstergesi görünür (beyaz ekran yerine).
 */
export function RootLocaleRedirect() {
  const [target, setTarget] = useState<Locale | null>(() => {
    const saved = getSavedLocale()
    if (saved) return saved
    return localeFromNavigator()
  })
  const started = useRef(false)

  useEffect(() => {
    if (target || started.current) return
    started.current = true
    let alive = true
    const ctrl = new AbortController()
    const timer = setTimeout(() => ctrl.abort(), 2500)

    fetch('/api/geo', { signal: ctrl.signal })
      .then((r) => (r.ok ? r.json() : null))
      .then((data: { country?: string | null } | null) => {
        if (!alive) return
        setTarget(localeFromCountry(data?.country) ?? FALLBACK_LOCALE)
      })
      .catch(() => {
        if (alive) setTarget(FALLBACK_LOCALE)
      })
      .finally(() => clearTimeout(timer))

    return () => {
      alive = false
      clearTimeout(timer)
      ctrl.abort()
    }
  }, [target])

  if (target) return <Navigate to={`/${target}`} replace />

  return (
    <div className="flex min-h-dvh items-center justify-center bg-surface">
      <div
        className="size-8 animate-spin rounded-full border-2 border-border border-t-primary"
        aria-label="…"
      />
    </div>
  )
}

import { useEffect } from 'react'
import { useAuth } from '@/app/providers/AuthProvider'
import { partnerApi } from './api'

const REF_KEY = 'te_ref'

/**
 * Davet kodunu URL'den yakalar (ör. /tr?ref=ABCD1234) ve kalıcı olarak saklar.
 * Atıf İLK üyelikte yapıldığından, kod kullanıcı üye olana kadar bekletilir.
 * Zaten kayıtlı bir kod varsa üzerine YAZILMAZ (ilk gelen kaynak korunur).
 */
export function captureRefFromUrl(): void {
  try {
    const params = new URLSearchParams(window.location.search)
    const ref = (params.get('ref') || '').trim().toUpperCase()
    if (!ref || !/^[A-Z0-9]{4,16}$/.test(ref)) return
    if (localStorage.getItem(REF_KEY)) return
    localStorage.setItem(REF_KEY, ref)
  } catch {
    /* localStorage yoksa sessiz geç */
  }
}

/**
 * Kullanıcı giriş yaptıktan (üye olduktan) sonra, bekleyen davet kodu varsa sunucuya
 * gönderir → müşteri partnere bağlanır (kalıcı). Başarı/geçersiz/self durumunda kodu temizler
 * (tekrar denenmesin). Sunucu, kendi kendini davet / çift atıf gibi durumları reddeder.
 */
export function usePartnerReferral(): void {
  const { user, loading } = useAuth()
  useEffect(() => {
    if (loading || !user) return
    let ref: string | null = null
    try {
      ref = localStorage.getItem(REF_KEY)
    } catch {
      return
    }
    if (!ref) return
    let active = true
    partnerApi<{ ok?: boolean; reason?: string }>('attribute', { ref })
      .then((r) => {
        if (!active) return
        // Başarı ya da kalıcı-red (invalid/self/already) → kodu bırak.
        if (r?.ok || r?.reason === 'invalid' || r?.reason === 'self') {
          try {
            localStorage.removeItem(REF_KEY)
          } catch {
            /* yok say */
          }
        }
      })
      .catch(() => {
        /* ağ hatası → kod kalsın, sonra tekrar denenir */
      })
    return () => {
      active = false
    }
  }, [user, loading])
}

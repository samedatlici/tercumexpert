import { useEffect } from 'react'

/** Aktifken body scroll'unu kilitler (drawer/modal açıkken). */
export function useScrollLock(active: boolean): void {
  useEffect(() => {
    if (!active) return
    const original = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = original
    }
  }, [active])
}

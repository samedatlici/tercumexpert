import { createContext, use, useCallback, useMemo, useState, type ReactNode } from 'react'

export interface ConsentState {
  necessary: true
  analytics: boolean
  marketing: boolean
  preferences: boolean
}

export type ConsentCategory = keyof ConsentState

interface ConsentContextValue {
  consent: ConsentState | null // null = henüz karar verilmedi
  hasDecided: boolean
  save: (partial: Omit<ConsentState, 'necessary'>) => void
  acceptAll: () => void
  rejectAll: () => void
}

const STORAGE_KEY = 'te_consent_v1'
const ConsentContext = createContext<ConsentContextValue | null>(null)

function readStored(): ConsentState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Partial<ConsentState>
    return {
      necessary: true,
      analytics: Boolean(parsed.analytics),
      marketing: Boolean(parsed.marketing),
      preferences: Boolean(parsed.preferences),
    }
  } catch {
    return null
  }
}

function persist(state: ConsentState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    /* localStorage kullanılamıyorsa sessizce geç (yalnız tercih verisi) */
  }
}

/**
 * Çerez onayı state'i (§19). Non-essential script'ler yalnız onayla çalışır.
 * Yalnızca TERCİH verisi saklanır — hassas veri ASLA localStorage'a yazılmaz (§29).
 */
export function ConsentProvider({ children }: { children: ReactNode }) {
  const [consent, setConsent] = useState<ConsentState | null>(() => readStored())

  const apply = useCallback((state: ConsentState) => {
    setConsent(state)
    persist(state)
  }, [])

  const value = useMemo<ConsentContextValue>(
    () => ({
      consent,
      hasDecided: consent !== null,
      save: (partial) => apply({ necessary: true, ...partial }),
      acceptAll: () => apply({ necessary: true, analytics: true, marketing: true, preferences: true }),
      rejectAll: () =>
        apply({ necessary: true, analytics: false, marketing: false, preferences: false }),
    }),
    [consent, apply],
  )

  return <ConsentContext value={value}>{children}</ConsentContext>
}

export function useConsent(): ConsentContextValue {
  const ctx = use(ConsentContext)
  if (!ctx) throw new Error('useConsent, ConsentProvider içinde kullanılmalıdır.')
  return ctx
}

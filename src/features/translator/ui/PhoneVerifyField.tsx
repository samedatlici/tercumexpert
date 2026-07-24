import { useEffect, useState } from 'react'
import { PhoneInput } from '@/components/common/PhoneInput'
import { Button } from '@/components/common/Button'
import { Icon } from '@/components/common/Icon'
import { useI18n } from '@/hooks/useI18n'
import { supabase } from '@/lib/supabase'

/**
 * Telefon numarası + SMS doğrulama alanı (tercüman başvurusu ve profili için).
 * Numara girildikten sonra "Kod gönder" → telefona gelen 6 haneli kod girilir → doğrulanır.
 * Numara değişince doğrulama sıfırlanır. Ebeveyne { phone, verified } bildirir.
 *
 * `initialVerifiedPhone`: profilde zaten kayıtlı/doğrulanmış telefon. Kullanıcı numarayı
 * değiştirmezse yeniden doğrulama istenmez (verified=true kabul edilir).
 */
export function PhoneVerifyField({
  defaultCountry,
  initialVerifiedPhone = null,
  onState,
}: {
  defaultCountry?: string
  initialVerifiedPhone?: string | null
  onState: (s: { phone: string; verified: boolean }) => void
}) {
  const { locale, dict } = useI18n()
  const v = dict.smsVerify

  const [phone, setPhone] = useState(initialVerifiedPhone ?? '')
  const [verified, setVerified] = useState(!!initialVerifiedPhone)
  const [sent, setSent] = useState(false)
  const [code, setCode] = useState('')
  const [busy, setBusy] = useState(false)
  const [cooldown, setCooldown] = useState(0)
  const [msg, setMsg] = useState<string | null>(null)
  const [devCode, setDevCode] = useState<string | null>(null)

  // Bekleme sayacı (tekrar-gönderim kilidi).
  useEffect(() => {
    if (cooldown <= 0) return
    const tm = setTimeout(() => setCooldown((s) => (s <= 1 ? 0 : s - 1)), 1000)
    return () => clearTimeout(tm)
  }, [cooldown])

  const report = (p: string, ok: boolean) => onState({ phone: p, verified: ok })

  const onPhoneChange = (full: string) => {
    setPhone(full)
    setSent(false)
    setCode('')
    setDevCode(null)
    setMsg(null)
    // Numara ilk doğrulanmış numaraya eşitse yeniden doğrulama gerekmez.
    const ok = !!initialVerifiedPhone && full === initialVerifiedPhone
    setVerified(ok)
    report(full, ok)
  }

  async function authToken(): Promise<string | null> {
    const { data } = await supabase.auth.getSession()
    return data.session?.access_token ?? null
  }

  const sendCode = async () => {
    setMsg(null)
    setDevCode(null)
    if (!phone || cooldown > 0 || busy) return
    setBusy(true)
    const token = await authToken()
    if (!token) {
      setBusy(false)
      setMsg(v.error)
      return
    }
    try {
      const res = await fetch('/api/sms', {
        method: 'POST',
        headers: { 'content-type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ action: 'send', phone, locale }),
      })
      const data = (await res.json()) as { ok?: boolean; error?: string; dev?: boolean; code?: string }
      setBusy(false)
      if (data.error === 'not_configured') return setMsg(v.notConfigured)
      if (data.error === 'rate_limited') {
        setCooldown(60)
        return setMsg(v.rateLimited)
      }
      if (data.error === 'bad_phone') return setMsg(v.enterPhone)
      if (!data.ok) return setMsg(v.sendFailed)
      setSent(true)
      setCooldown(60)
      setMsg(v.sent)
      if (data.dev && data.code) setDevCode(data.code) // TEST modu — kodu göster
    } catch {
      setBusy(false)
      setMsg(v.sendFailed)
    }
  }

  const verify = async () => {
    setMsg(null)
    if (code.replace(/\D/g, '').length < 6 || busy) return
    setBusy(true)
    const token = await authToken()
    if (!token) {
      setBusy(false)
      setMsg(v.error)
      return
    }
    try {
      const res = await fetch('/api/sms', {
        method: 'POST',
        headers: { 'content-type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ action: 'verify', phone, code: code.replace(/\D/g, ''), locale }),
      })
      const data = (await res.json()) as { ok?: boolean; error?: string }
      setBusy(false)
      if (data.error === 'otp_expired') return setMsg(v.expired)
      if (!data.ok) return setMsg(v.invalid)
      setVerified(true)
      setSent(false)
      setMsg(null)
      report(phone, true)
    } catch {
      setBusy(false)
      setMsg(v.invalid)
    }
  }

  const inputClass =
    'h-11 w-full rounded-md border border-border bg-surface px-3 text-base outline-none focus:border-border-strong'

  return (
    <div className="space-y-2">
      <div className="flex flex-col gap-2 sm:flex-row">
        <div className="flex-1">
          <PhoneInput onChange={onPhoneChange} defaultCountry={defaultCountry} />
        </div>
        {verified ? (
          <span className="inline-flex items-center gap-1.5 rounded-md border border-success/30 bg-success/5 px-3 text-sm font-medium text-success max-sm:justify-center max-sm:py-2 sm:whitespace-nowrap">
            <Icon name="CircleCheck" className="size-4" /> {v.verified}
          </span>
        ) : (
          <Button
            type="button"
            intent="outline"
            onClick={() => void sendCode()}
            disabled={!phone || busy || cooldown > 0}
            className="sm:whitespace-nowrap"
          >
            {cooldown > 0 ? `${v.resend} (${cooldown})` : sent ? v.resend : v.sendCode}
          </Button>
        )}
      </div>

      {sent && !verified && (
        <div className="flex flex-col gap-2 rounded-md border border-border bg-surface-muted/40 p-3 sm:flex-row sm:items-center">
          <div className="flex-1">
            <label className="mb-1 block text-xs font-medium text-text-secondary">{v.codeLabel}</label>
            <input
              className={`${inputClass} text-center text-lg tracking-[0.4em]`}
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
              placeholder="______"
            />
          </div>
          <Button type="button" intent="secondary" onClick={() => void verify()} disabled={busy} className="sm:mt-5 sm:whitespace-nowrap">
            {v.confirm}
          </Button>
        </div>
      )}

      {devCode && (
        <p className="rounded-md border border-secondary/30 bg-surface-muted px-3 py-2 text-xs text-text-secondary">
          {v.devCode.replace('{code}', devCode)}
        </p>
      )}
      {msg && <p className="text-xs text-text-secondary">{msg}</p>}
    </div>
  )
}

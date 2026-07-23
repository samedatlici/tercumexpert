import { useEffect, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/common/Button'
import { Icon } from '@/components/common/Icon'
import { PasswordInput } from '@/components/common/PasswordInput'
import { Seo } from '@/components/seo/Seo'
import { useI18n } from '@/hooks/useI18n'
import { useAuth } from '@/app/providers/AuthProvider'
import { buildPath } from '@/app/router/routes'

const inputClass =
  'h-12 w-full rounded-md border border-border bg-surface px-3 text-base focus-visible:outline-none focus-visible:border-border-strong'

/**
 * Şifre yenileme sayfası. E-postadaki tek kullanımlık bağlantı buraya yönlendirir;
 * Supabase bağlantıdaki jetonu işleyip geçici oturum açar. İki şifre kutusu aynı
 * olmalıdır; onaylanınca updateUser ile şifre güncellenir.
 */
export default function ResetPasswordPage() {
  const { locale, dict } = useI18n()
  const x = dict.authx
  const { updatePassword } = useAuth()
  const [pw, setPw] = useState('')
  const [pw2, setPw2] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  useEffect(() => {
    document.title = x.resetTitle
  }, [x.resetTitle])

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    if (pw.length < 6) return setError(x.weak)
    if (pw !== pw2) return setError(x.mismatch)
    setBusy(true)
    const { error: upErr } = await updatePassword(pw)
    setBusy(false)
    if (upErr) return setError(x.resetInvalid) // genelde geçerli oturum yok = bağlantı geçersiz/süresi dolmuş
    setDone(true)
  }

  return (
    <>
      <Seo title={x.resetTitle} description={x.resetDesc} routeId="resetPassword" />
      <section className="section">
        <div className="mx-auto w-full max-w-md rounded-lg border border-border bg-surface p-6 sm:p-8 max-sm:mx-4 max-sm:w-auto">
          <span className="inline-flex size-14 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Icon name="KeyRound" className="size-7" />
          </span>
          <h1 className="mt-4 text-2xl font-bold">{x.resetTitle}</h1>

          {done ? (
            <>
              <p className="mt-2 text-sm text-success">{x.resetSuccess}</p>
              <Link to={buildPath(locale, 'auth')} className="mt-5 block">
                <Button intent="secondary" size="lg" block>{x.goLogin}</Button>
              </Link>
            </>
          ) : (
            <form className="mt-5 space-y-4" onSubmit={submit} noValidate>
              <p className="text-sm text-text-secondary">{x.resetDesc}</p>
              <div>
                <label className="mb-1.5 block text-sm font-medium">{x.newPassword}</label>
                <PasswordInput value={pw} onChange={setPw} autoComplete="new-password" className={inputClass} showLabel={x.showPassword} hideLabel={x.hidePassword} />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium">{x.newPasswordRepeat}</label>
                <PasswordInput value={pw2} onChange={setPw2} autoComplete="new-password" className={inputClass} showLabel={x.showPassword} hideLabel={x.hidePassword} />
              </div>
              {error && <p className="rounded-md border border-danger/30 bg-danger/5 px-3 py-2 text-sm text-danger">{error}</p>}
              <Button type="submit" intent="secondary" size="lg" block disabled={busy}>{x.resetSubmit}</Button>
              <Link to={buildPath(locale, 'auth')} className="block text-center text-sm text-text-secondary underline underline-offset-4">
                {x.forgotBack}
              </Link>
            </form>
          )}
        </div>
      </section>
    </>
  )
}

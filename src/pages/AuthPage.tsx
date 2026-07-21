import { useState, type FormEvent, type ReactNode } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Button } from '@/components/common/Button'
import { Icon } from '@/components/common/Icon'
import { GoogleIcon } from '@/components/common/GoogleIcon'
import { Seo } from '@/components/seo/Seo'
import { useI18n } from '@/hooks/useI18n'
import { useAuth } from '@/app/providers/AuthProvider'
import { buildPath } from '@/app/router/routes'

type Mode = 'login' | 'register'
type View = 'form' | 'verify'

const emailOk = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)

const inputClass =
  'h-12 w-full rounded-md border border-border bg-surface px-3 text-base focus-visible:outline-none focus-visible:border-border-strong'

export default function AuthPage() {
  const { locale, dict } = useI18n()
  const a = dict.auth
  const navigate = useNavigate()
  const { user, signInWithGoogle, signInWithPassword, signUp, verifyEmailCode, resendCode, signOut } = useAuth()

  const [mode, setMode] = useState<Mode>('login')
  const [view, setView] = useState<View>('form')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [consent, setConsent] = useState(false)
  const [code, setCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const homePath = buildPath(locale, 'home')
  const verifyRedirect = `${window.location.origin}${homePath}`

  // Zaten giriş yapılmışsa hesap kartı göster.
  if (user) {
    const name = (user.user_metadata?.full_name as string) || user.email
    return (
      <>
        <Seo title={a.seo.title} description={a.seo.description} routeId="auth" />
        <Shell>
          <div className="text-center">
            <span className="mx-auto inline-flex size-14 items-center justify-center rounded-full bg-success/10 text-success">
              <Icon name="CircleCheck" className="size-8" />
            </span>
            <h1 className="mt-4 text-2xl font-bold">{a.signedIn.title}</h1>
            <p className="mt-1 text-text-secondary">{a.signedIn.greeting}, {name}.</p>
            <div className="mt-6 space-y-3">
              <Link to={buildPath(locale, 'quote')}>
                <Button intent="secondary" size="lg" block>{dict.common.actions.calculatePrice}</Button>
              </Link>
              <Button intent="outline" size="lg" block onClick={() => void signOut()}>
                {a.signedIn.logout}
              </Button>
            </div>
          </div>
        </Shell>
      </>
    )
  }

  const resetMessages = () => {
    setError(null)
    setInfo(null)
  }

  const onGoogle = async () => {
    resetMessages()
    setBusy(true)
    const { error } = await signInWithGoogle(`${window.location.origin}${homePath}`)
    if (error) {
      setError(error)
      setBusy(false)
    }
    // Başarılıysa tarayıcı Google'a yönlenir.
  }

  const onSubmitForm = async (e: FormEvent) => {
    e.preventDefault()
    resetMessages()
    if (!emailOk(email)) return setError(a.errors.emailInvalid)
    if (password.length < 6) return setError(a.errors.passwordShort)

    setBusy(true)
    if (mode === 'login') {
      const { error } = await signInWithPassword(email, password)
      setBusy(false)
      if (error) return setError(error)
      navigate(buildPath(locale, 'quote'))
      return
    }
    // register
    if (firstName.trim().length < 2 || lastName.trim().length < 2) {
      setBusy(false)
      return setError(a.errors.nameRequired)
    }
    if (!consent) {
      setBusy(false)
      return setError(a.errors.consentRequired)
    }
    const { error, needsVerification } = await signUp({ firstName, lastName, email, password }, verifyRedirect)
    setBusy(false)
    if (error) return setError(error)
    if (needsVerification) setView('verify')
    else navigate(buildPath(locale, 'quote'))
  }

  const onVerify = async (e: FormEvent) => {
    e.preventDefault()
    resetMessages()
    if (code.trim().length < 6) return setError(a.errors.codeInvalid)
    setBusy(true)
    const { error } = await verifyEmailCode(email, code.trim())
    setBusy(false)
    if (error) return setError(error)
    navigate(buildPath(locale, 'quote'))
  }

  const onResend = async () => {
    resetMessages()
    setBusy(true)
    const { error } = await resendCode(email, verifyRedirect)
    setBusy(false)
    if (error) return setError(error)
    setInfo(a.verify.resent)
  }

  // ——— 6 haneli doğrulama kodu ekranı ———
  if (view === 'verify') {
    return (
      <>
        <Seo title={a.seo.title} description={a.seo.description} routeId="auth" />
        <Shell>
          <button type="button" onClick={() => setView('form')} className="mb-4 inline-flex items-center gap-1 text-sm text-text-secondary hover:text-text-primary">
            <Icon name="ArrowRight" className="size-4 rotate-180" /> {a.verify.back}
          </button>
          <span className="inline-flex size-14 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Icon name="Mail" className="size-8" />
          </span>
          <h1 className="mt-4 text-2xl font-bold">{a.verify.title}</h1>
          <p className="mt-2 text-sm text-text-secondary">
            <span className="font-medium text-text-primary">{email}</span> {a.verify.desc}
          </p>
          <form className="mt-6 space-y-4" onSubmit={onVerify} noValidate>
            <input
              className={`${inputClass} text-center text-xl tracking-[0.5em]`}
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
              placeholder="______"
              aria-label={a.fields.code}
            />
            {error && <Alert kind="error">{error}</Alert>}
            {info && <Alert kind="info">{info}</Alert>}
            <Button type="submit" intent="secondary" size="lg" block disabled={busy}>
              {a.verify.submit}
            </Button>
            <button type="button" onClick={() => void onResend()} disabled={busy} className="mx-auto block text-sm text-text-secondary underline underline-offset-4 hover:text-text-primary">
              {a.verify.resend}
            </button>
          </form>
          <p className="mt-4 text-xs text-text-muted">{a.verify.spam}</p>
        </Shell>
      </>
    )
  }

  // ——— Giriş / Kayıt ekranı ———
  return (
    <>
      <Seo title={a.seo.title} description={a.seo.description} routeId="auth" />
      <Shell>
        {/* Sekmeler */}
        <div className="mb-6 grid grid-cols-2 rounded-md border border-border p-1">
          <TabBtn active={mode === 'login'} onClick={() => { setMode('login'); resetMessages() }}>{a.tabs.login}</TabBtn>
          <TabBtn active={mode === 'register'} onClick={() => { setMode('register'); resetMessages() }}>{a.tabs.register}</TabBtn>
        </div>

        <h1 className="text-2xl font-bold">{mode === 'login' ? a.login.title : a.register.title}</h1>

        {/* Google */}
        <Button intent="outline" size="lg" block onClick={() => void onGoogle()} disabled={busy} className="mt-5">
          <GoogleIcon className="size-5" /> {a.google}
        </Button>

        <div className="my-5 flex items-center gap-3 text-xs text-text-muted">
          <span className="h-px flex-1 bg-border" /> {a.or} <span className="h-px flex-1 bg-border" />
        </div>

        <form className="space-y-4" onSubmit={onSubmitForm} noValidate>
          {mode === 'register' && (
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label={a.fields.firstName}>
                <input className={inputClass} value={firstName} onChange={(e) => setFirstName(e.target.value)} autoComplete="given-name" />
              </Field>
              <Field label={a.fields.lastName}>
                <input className={inputClass} value={lastName} onChange={(e) => setLastName(e.target.value)} autoComplete="family-name" />
              </Field>
            </div>
          )}
          <Field label={a.fields.email}>
            <input type="email" className={inputClass} value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
          </Field>
          <Field label={a.fields.password}>
            <input type="password" className={inputClass} value={password} onChange={(e) => setPassword(e.target.value)} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} />
          </Field>

          {mode === 'register' && (
            <label className="flex items-start gap-3 text-sm">
              <input type="checkbox" className="mt-1 size-4 accent-black" checked={consent} onChange={(e) => setConsent(e.target.checked)} />
              <span>{a.register.consent}</span>
            </label>
          )}

          {error && <Alert kind="error">{error}</Alert>}

          <Button type="submit" intent="secondary" size="lg" block disabled={busy}>
            {mode === 'login' ? a.login.submit : a.register.submit}
          </Button>
        </form>

        <p className="mt-5 text-center text-sm text-text-secondary">
          {mode === 'login' ? a.login.noAccount : a.register.haveAccount}{' '}
          <button
            type="button"
            onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); resetMessages() }}
            className="font-semibold text-text-primary underline underline-offset-4"
          >
            {mode === 'login' ? a.login.switchToRegister : a.register.switchToLogin}
          </button>
        </p>
      </Shell>
    </>
  )
}

function Shell({ children }: { children: ReactNode }) {
  return (
    <section className="section">
      <div className="mx-auto w-full max-w-md rounded-lg border border-border bg-surface p-6 sm:p-8">
        {children}
      </div>
    </section>
  )
}

function TabBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        'min-h-[44px] rounded-[4px] text-sm font-medium transition-colors ' +
        (active ? 'bg-secondary text-secondary-foreground' : 'text-text-secondary hover:text-text-primary')
      }
    >
      {children}
    </button>
  )
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium">{label}</label>
      {children}
    </div>
  )
}

function Alert({ kind, children }: { kind: 'error' | 'info'; children: ReactNode }) {
  return (
    <p className={'rounded-md border px-3 py-2 text-sm ' + (kind === 'error' ? 'border-danger/30 bg-danger/5 text-danger' : 'border-success/30 bg-success/5 text-success')}>
      {children}
    </p>
  )
}

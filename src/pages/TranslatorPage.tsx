import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/common/Button'
import { Icon, type IconName } from '@/components/common/Icon'
import { PhoneInput } from '@/components/common/PhoneInput'
import { useI18n } from '@/hooks/useI18n'
import { useAuth } from '@/app/providers/AuthProvider'
import { buildPath } from '@/app/router/routes'
import { supabase } from '@/lib/supabase'
import { cn } from '@/lib/cn'
import { useTranslator } from '@/features/translator/model/useTranslator'
import { EXPERTISE_KEYS, PANEL_LANGUAGES, languageName } from '@/features/translator/model/config'
import { translatorApi } from '@/features/translator/model/api'
import type { LanguagePair, Translator } from '@/features/translator/model/types'

export default function TranslatorPage() {
  const { locale, dict } = useI18n()
  const t = dict.translator
  const { user, loading: authLoading } = useAuth()
  const { loading, isAdmin, translator, error, refetch } = useTranslator()

  useEffect(() => {
    const meta = document.createElement('meta')
    meta.name = 'robots'
    meta.content = 'noindex, nofollow'
    document.head.appendChild(meta)
    document.title = t.seo.title
    return () => {
      document.head.removeChild(meta)
    }
  }, [t.seo.title])

  const body = (): ReactNode => {
    if (authLoading || loading) {
      return <p className="py-16 text-center text-sm text-text-secondary">{t.loading}</p>
    }
    // Yabancı / misafir / giriş yok → erişim yok, giriş gerekli.
    if (!user) {
      return (
        <Center icon="Lock" title={t.loginTitle} desc={t.loginDesc}>
          <Link to={buildPath(locale, 'auth')}>
            <Button intent="secondary" block>{t.login}</Button>
          </Link>
        </Center>
      )
    }
    // Tablo yok (Faz 1 SQL çalıştırılmamış) — yalnızca yöneticiye anlamlı ipucu.
    if (error === 'table') {
      return <Center icon="Lock" title={t.setupTitle} desc={t.setupDesc} />
    }
    // Admin: yönetim görünümü (tercümandan üstün yetki).
    if (isAdmin) {
      return <AdminSection t={t} locale={locale} />
    }
    // Onaylı tercüman → panel.
    if (translator?.status === 'approved') {
      return <TranslatorPanel t={t} locale={locale} translator={translator} onSaved={refetch} />
    }
    // Başvuru beklemede.
    if (translator?.status === 'pending') {
      return <Center icon="Clock" title={t.pendingTitle} desc={t.pendingDesc} />
    }
    // Reddedilmiş.
    if (translator?.status === 'rejected') {
      return (
        <Center icon="X" title={t.rejectedTitle} desc={t.rejectedDesc}>
          <Button intent="secondary" block onClick={refetch}>{t.reapply}</Button>
        </Center>
      )
    }
    // Normal üye, tercüman kaydı yok → başvuru formu (panel içeriği GÖSTERİLMEZ).
    return <ApplicationForm t={t} locale={locale} userId={user.id} onDone={refetch} />
  }

  return (
    <section className="section">
      <div className="mx-auto w-full max-w-5xl px-4 sm:px-6">{body()}</div>
    </section>
  )
}

/* ------------------------------------------------------------------ */
/* Ortak parçalar                                                      */
/* ------------------------------------------------------------------ */

function Center({
  icon,
  title,
  desc,
  children,
}: {
  icon: IconName
  title: string
  desc: string
  children?: ReactNode
}) {
  return (
    <div className="mx-auto max-w-md rounded-lg border border-border bg-surface p-8 text-center">
      <span className="mx-auto inline-flex size-14 items-center justify-center rounded-full bg-surface-muted text-text-secondary">
        <Icon name={icon} className="size-7" />
      </span>
      <h1 className="mt-4 text-xl font-bold">{title}</h1>
      <p className="mx-auto mt-2 max-w-sm text-sm text-text-secondary">{desc}</p>
      {children && <div className="mx-auto mt-5 max-w-xs">{children}</div>}
    </div>
  )
}

const inputClass =
  'min-h-[44px] w-full rounded-md border border-border bg-surface px-3 text-base outline-none focus:border-border-strong'
const labelClass = 'mb-1.5 block text-sm font-medium'

/* ------------------------------------------------------------------ */
/* Dil çifti + uzmanlık seçiciler                                      */
/* ------------------------------------------------------------------ */

function PairPicker({
  t,
  locale,
  pairs,
  setPairs,
}: {
  t: TDict
  locale: string
  pairs: LanguagePair[]
  setPairs: (p: LanguagePair[]) => void
}) {
  const [source, setSource] = useState('tr')
  const [target, setTarget] = useState('en')

  const add = () => {
    if (source === target) return
    if (pairs.some((p) => p.source === source && p.target === target)) return
    setPairs([...pairs, { source, target }])
  }

  return (
    <div>
      <label className={labelClass}>{t.form.languagePairs}</label>
      <div className="flex flex-wrap items-end gap-2">
        <select value={source} onChange={(e) => setSource(e.target.value)} aria-label={t.form.source} className={cn(inputClass, 'w-auto flex-1')}>
          {PANEL_LANGUAGES.map((c) => (
            <option key={c} value={c}>{languageName(c, locale)}</option>
          ))}
        </select>
        <button
          type="button"
          onClick={() => {
            setSource(target)
            setTarget(source)
          }}
          aria-label={t.form.swap}
          title={t.form.swap}
          className="inline-flex size-10 shrink-0 items-center justify-center rounded-md border border-border text-text-secondary hover:bg-surface-muted"
        >
          <Icon name="ArrowRightLeft" className="size-4" />
        </button>
        <select value={target} onChange={(e) => setTarget(e.target.value)} aria-label={t.form.target} className={cn(inputClass, 'w-auto flex-1')}>
          {PANEL_LANGUAGES.map((c) => (
            <option key={c} value={c}>{languageName(c, locale)}</option>
          ))}
        </select>
        <Button type="button" intent="outline" onClick={add} className="shrink-0">{t.form.addPair}</Button>
      </div>
      {pairs.length > 0 && (
        <ul className="mt-3 flex flex-wrap gap-2">
          {pairs.map((p, i) => (
            <li key={`${p.source}-${p.target}`} className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface-muted px-3 py-1 text-sm">
              {languageName(p.source, locale)} → {languageName(p.target, locale)}
              <button type="button" onClick={() => setPairs(pairs.filter((_, j) => j !== i))} aria-label={t.form.removePair} className="rounded p-0.5 text-text-muted hover:bg-border/60">
                <Icon name="X" className="size-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function ExpertisePicker({
  t,
  selected,
  setSelected,
}: {
  t: TDict
  selected: string[]
  setSelected: (s: string[]) => void
}) {
  const toggle = (k: string) => {
    setSelected(selected.includes(k) ? selected.filter((x) => x !== k) : [...selected, k])
  }
  return (
    <div>
      <label className={labelClass}>{t.form.expertise}</label>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {EXPERTISE_KEYS.map((k) => (
          <label key={k} className={cn('flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm', selected.includes(k) ? 'border-secondary bg-surface-muted' : 'border-border bg-surface hover:bg-surface-muted')}>
            <input type="checkbox" checked={selected.includes(k)} onChange={() => toggle(k)} className="size-4 accent-black" />
            {t.expertiseLabels[k]}
          </label>
        ))}
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Başvuru formu (normal üye → tercüman başvurusu)                     */
/* ------------------------------------------------------------------ */

function ApplicationForm({
  t,
  locale,
  userId,
  onDone,
}: {
  t: TDict
  locale: string
  userId: string
  onDone: () => void
}) {
  const [fullName, setFullName] = useState('')
  const [birthDate, setBirthDate] = useState('')
  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState('')
  const [pairs, setPairs] = useState<LanguagePair[]>([])
  const [expertise, setExpertise] = useState<string[]>([])
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!fullName.trim() || pairs.length === 0) {
      setErr(pairs.length === 0 ? t.form.atLeastOnePair : t.form.required)
      return
    }
    setErr(null)
    setBusy(true)
    // IBAN başvuruda İSTENMEZ; tercüman onaylandıktan sonra profilinden girer.
    const { error } = await supabase.from('translators').insert({
      user_id: userId,
      full_name: fullName.trim(),
      birth_date: birthDate || null,
      phone: phone.trim() || null,
      address: address.trim() || null,
      language_pairs: pairs,
      expertise,
    })
    setBusy(false)
    if (error) {
      setErr(t.form.saveError)
      return
    }
    onDone()
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-bold">{t.applyTitle}</h1>
        <p className="mt-2 text-text-secondary">{t.applyDesc}</p>
      </div>
      <form onSubmit={submit} className="space-y-4 rounded-lg border border-border bg-surface p-6 sm:p-8" noValidate>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={labelClass}>{t.form.fullName} <span className="text-danger">*</span></label>
            <input className={inputClass} value={fullName} onChange={(e) => setFullName(e.target.value)} autoComplete="name" />
          </div>
          <div>
            <label className={labelClass}>{t.form.birthDate}</label>
            <input type="date" className={inputClass} value={birthDate} onChange={(e) => setBirthDate(e.target.value)} />
          </div>
        </div>
        <div>
          <label className={labelClass}>{t.form.phone}</label>
          <PhoneInput onChange={setPhone} />
        </div>
        <div>
          <label className={labelClass}>{t.form.address}</label>
          <textarea rows={2} className={cn(inputClass, 'py-2')} value={address} onChange={(e) => setAddress(e.target.value)} autoComplete="street-address" />
        </div>
        <PairPicker t={t} locale={locale} pairs={pairs} setPairs={setPairs} />
        <ExpertisePicker t={t} selected={expertise} setSelected={setExpertise} />
        {err && <p className="text-sm text-danger">{err}</p>}
        <Button type="submit" intent="secondary" size="lg" block disabled={busy}>
          {busy ? t.form.submitting : t.form.submit}
        </Button>
        <p className="text-center text-xs text-text-muted">{t.applyNote}</p>
      </form>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Onaylı tercüman paneli (Faz 2: Profilim; diğer sekmeler yakında)    */
/* ------------------------------------------------------------------ */

type Tab = 'profile' | 'pool' | 'pending' | 'approved' | 'completed' | 'wallet'
const TABS: { key: Tab; icon: IconName }[] = [
  { key: 'profile', icon: 'Users' },
  { key: 'pool', icon: 'Languages' },
  { key: 'pending', icon: 'Clock' },
  { key: 'approved', icon: 'Check' },
  { key: 'completed', icon: 'PackageCheck' },
  { key: 'wallet', icon: 'Wallet' },
]

function TranslatorPanel({
  t,
  locale,
  translator,
  onSaved,
}: {
  t: TDict
  locale: string
  translator: Translator
  onSaved: () => void
}) {
  const [tab, setTab] = useState<Tab>('profile')

  return (
    <div>
      <h1 className="mb-1 text-2xl font-bold">{t.panelTitle}</h1>
      <p className="mb-5 text-sm text-text-secondary">{translator.full_name}</p>

      <div className="mb-6 flex flex-wrap gap-2">
        {TABS.map((x) => (
          <button
            key={x.key}
            type="button"
            onClick={() => setTab(x.key)}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors',
              tab === x.key ? 'border-secondary bg-secondary text-secondary-foreground' : 'border-border bg-surface text-text-secondary hover:bg-surface-muted',
            )}
          >
            <Icon name={x.icon} className="size-4" /> {t.tabs[x.key]}
          </button>
        ))}
      </div>

      {tab === 'profile' ? (
        <ProfileEditor t={t} locale={locale} translator={translator} onSaved={onSaved} />
      ) : tab === 'pool' ? (
        <PoolTab t={t} locale={locale} />
      ) : (
        <div className="rounded-lg border border-dashed border-border bg-surface-muted/40 p-10 text-center">
          <p className="text-sm text-text-secondary">{t.soon}</p>
        </div>
      )}
    </div>
  )
}

function ProfileEditor({
  t,
  locale,
  translator,
  onSaved,
}: {
  t: TDict
  locale: string
  translator: Translator
  onSaved: () => void
}) {
  const [fullName, setFullName] = useState(translator.full_name ?? '')
  const [birthDate, setBirthDate] = useState(translator.birth_date ?? '')
  const [phone, setPhone] = useState(translator.phone ?? '')
  const [address, setAddress] = useState(translator.address ?? '')
  const [iban, setIban] = useState(translator.iban ?? '')
  const [ibanName, setIbanName] = useState(translator.iban_name ?? '')
  const [pairs, setPairs] = useState<LanguagePair[]>(translator.language_pairs ?? [])
  const [expertise, setExpertise] = useState<string[]>(translator.expertise ?? [])
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<'ok' | 'err' | null>(null)

  const save = async (e: React.FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setMsg(null)
    const { error } = await supabase
      .from('translators')
      .update({
        full_name: fullName.trim(),
        birth_date: birthDate || null,
        phone: phone.trim() || null,
        address: address.trim() || null,
        iban: iban.trim(),
        iban_name: ibanName.trim(),
        language_pairs: pairs,
        expertise,
      })
      .eq('id', translator.id)
    setBusy(false)
    setMsg(error ? 'err' : 'ok')
    if (!error) onSaved()
  }

  return (
    <form onSubmit={save} className="space-y-4 rounded-lg border border-border bg-surface p-6">
      <div className="flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center gap-1 rounded-full bg-success/15 px-2.5 py-1 text-xs font-medium text-success">
          <Icon name="CircleCheck" className="size-3.5" /> {t.profile.statusApproved}
        </span>
        <span className={cn('inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium', translator.iban_verified ? 'bg-success/15 text-success' : 'bg-surface-muted text-text-secondary')}>
          <Icon name={translator.iban_verified ? 'ShieldCheck' : 'Lock'} className="size-3.5" />
          {translator.iban_verified ? t.profile.verifiedIban : t.profile.unverifiedIban}
        </span>
      </div>
      {!iban.trim() && (
        <div className="flex items-start gap-2 rounded-md border border-secondary/30 bg-surface-muted p-3 text-sm">
          <Icon name="Wallet" className="mt-0.5 size-4 shrink-0 text-text-secondary" />
          <p>{t.profile.ibanReminder}</p>
        </div>
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={labelClass}>{t.form.fullName}</label>
          <input className={inputClass} value={fullName} onChange={(e) => setFullName(e.target.value)} />
        </div>
        <div>
          <label className={labelClass}>{t.form.birthDate}</label>
          <input type="date" className={inputClass} value={birthDate} onChange={(e) => setBirthDate(e.target.value)} />
        </div>
      </div>
      <div>
        <label className={labelClass}>{t.form.phone}</label>
        <PhoneInput onChange={setPhone} />
        {translator.phone && <p className="mt-1 text-xs text-text-muted">{t.profile.current}: <span dir="ltr">{translator.phone}</span></p>}
      </div>
      <div>
        <label className={labelClass}>{t.form.address}</label>
        <textarea rows={2} className={cn(inputClass, 'py-2')} value={address} onChange={(e) => setAddress(e.target.value)} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={labelClass}>{t.form.iban}</label>
          <input className={inputClass} value={iban} onChange={(e) => setIban(e.target.value)} dir="ltr" />
        </div>
        <div>
          <label className={labelClass}>{t.form.ibanName}</label>
          <input className={inputClass} value={ibanName} onChange={(e) => setIbanName(e.target.value)} />
        </div>
      </div>
      <PairPicker t={t} locale={locale} pairs={pairs} setPairs={setPairs} />
      <ExpertisePicker t={t} selected={expertise} setSelected={setExpertise} />
      {msg === 'ok' && <p className="text-sm text-success">{t.form.saved}</p>}
      {msg === 'err' && <p className="text-sm text-danger">{t.form.saveError}</p>}
      <Button type="submit" intent="secondary" size="lg" disabled={busy}>
        {busy ? t.form.submitting : t.profile.edit}
      </Button>
    </form>
  )
}

/* ------------------------------------------------------------------ */
/* Admin bölümü: başvuru/onay yönetimi (tercümandan üstün yetki)       */
/* ------------------------------------------------------------------ */

function AdminSection({ t, locale }: { t: TDict; locale: string }) {
  const [rows, setRows] = useState<Translator[]>([])
  const [state, setState] = useState<'loading' | 'idle' | 'error'>('loading')
  const [busyId, setBusyId] = useState<string | null>(null)

  const load = () => {
    setState('loading')
    supabase
      .from('translators')
      .select('*')
      .order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (error) {
          setState('error')
          return
        }
        setRows((data as Translator[]) ?? [])
        setState('idle')
      })
  }
  useEffect(load, [])

  const act = async (id: string, patch: Partial<Translator>) => {
    setBusyId(id)
    const { error } = await supabase.from('translators').update(patch).eq('id', id)
    setBusyId(null)
    if (!error) {
      setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)))
    } else {
      alert(t.admin.actionError)
    }
  }

  const pendingCount = useMemo(() => rows.filter((r) => r.status === 'pending').length, [rows])

  return (
    <div>
      <div className="mb-5">
        <h1 className="text-2xl font-bold">{t.admin.title}</h1>
        <p className="mt-1 text-sm text-text-secondary">
          {t.admin.summary.replace('{total}', String(rows.length)).replace('{pending}', String(pendingCount))}
        </p>
      </div>

      {state === 'loading' && <p className="py-10 text-center text-sm text-text-secondary">{t.loading}</p>}
      {state === 'error' && <p className="rounded-md border border-danger/40 bg-danger/10 p-4 text-sm text-danger">{t.admin.loadError}</p>}
      {state === 'idle' && rows.length === 0 && <p className="py-10 text-center text-sm text-text-secondary">{t.admin.noApplications}</p>}

      {state === 'idle' && rows.length > 0 && (
        <div className="space-y-3">
          {rows.map((r) => (
            <article key={r.id} className="rounded-lg border border-border bg-surface p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold">{r.full_name || '—'}</h3>
                    <StatusBadge t={t} status={r.status} />
                  </div>
                  <p className="mt-1 text-xs text-text-muted">{new Date(r.created_at).toLocaleDateString()}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {r.status !== 'approved' && (
                    <Button type="button" intent="secondary" size="sm" disabled={busyId === r.id} onClick={() => act(r.id, { status: 'approved' })}>
                      {t.admin.approve}
                    </Button>
                  )}
                  {r.status !== 'rejected' && (
                    <Button type="button" intent="outline" size="sm" disabled={busyId === r.id} onClick={() => act(r.id, { status: 'rejected' })}>
                      {t.admin.reject}
                    </Button>
                  )}
                </div>
              </div>

              <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
                <Detail label={t.admin.colLangs}>
                  {(r.language_pairs ?? []).length === 0
                    ? '—'
                    : r.language_pairs.map((p) => `${languageName(p.source, locale)}→${languageName(p.target, locale)}`).join(', ')}
                </Detail>
                <Detail label={t.admin.colExpertise}>
                  {(r.expertise ?? []).length === 0 ? '—' : r.expertise.map((k) => t.expertiseLabels[k as keyof TDict['expertiseLabels']] ?? k).join(', ')}
                </Detail>
                <Detail label={t.form.phone}>{r.phone ? <span dir="ltr">{r.phone}</span> : '—'}</Detail>
                <Detail label={t.form.birthDate}>{r.birth_date || '—'}</Detail>
                {r.iban && <Detail label={t.form.iban}><span dir="ltr">{r.iban}</span></Detail>}
                {r.iban_name && <Detail label={t.form.ibanName}>{r.iban_name}</Detail>}
                <Detail label={t.form.address}>{r.address || '—'}</Detail>
              </dl>

              <div className="mt-3 flex items-center justify-between gap-3 border-t border-border pt-3">
                <span className={cn('inline-flex items-center gap-1 text-xs font-medium', r.iban_verified ? 'text-success' : 'text-text-secondary')}>
                  <Icon name={r.iban_verified ? 'ShieldCheck' : 'Lock'} className="size-3.5" />
                  {r.iban_verified ? t.admin.ibanVerified : t.admin.ibanNotVerified}
                </span>
                <Button type="button" intent="outline" size="sm" disabled={busyId === r.id} onClick={() => act(r.id, { iban_verified: !r.iban_verified })}>
                  {r.iban_verified ? t.admin.unverifyIban : t.admin.verifyIban}
                </Button>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  )
}

function StatusBadge({ t, status }: { t: TDict; status: string }) {
  const map: Record<string, string> = {
    pending: 'bg-surface-muted text-text-secondary',
    approved: 'bg-success/15 text-success',
    rejected: 'bg-danger/10 text-danger',
  }
  const label =
    status === 'approved' ? t.admin.statusApproved : status === 'rejected' ? t.admin.statusRejected : t.admin.statusPending
  return <span className={cn('rounded-full px-2 py-0.5 text-[11px] font-medium', map[status] ?? map.pending)}>{label}</span>
}

function Detail({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <dt className="text-text-secondary">{label}</dt>
      <dd className="text-text-primary">{children}</dd>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Tercüme Havuzu (Faz 3): uyan available siparişler + üstlen (claim)   */
/* ------------------------------------------------------------------ */

interface PoolFile {
  name: string
  url: string | null
}
interface PoolOrder {
  id: string
  order_no: number
  service: string
  source_lang: string
  target_lang: string
  document_type: string
  word_count: number
  urgent: boolean
  notarization: boolean
  physical_delivery: boolean
  input_mode: string
  source_text: string | null
  note: string | null
  delivery_days: number
  created_at: string
  payout: number
  pages: number
  files: PoolFile[]
}

function PoolTab({ t, locale }: { t: TDict; locale: string }) {
  const { dict, formatCurrency } = useI18n()
  const [orders, setOrders] = useState<PoolOrder[]>([])
  const [state, setState] = useState<'loading' | 'idle' | 'error'>('loading')
  const [claimingId, setClaimingId] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  const load = () => {
    setState('loading')
    translatorApi<{ orders?: PoolOrder[]; error?: string }>('pool')
      .then((r) => {
        if (r.error) {
          setState('error')
          return
        }
        setOrders(r.orders ?? [])
        setState('idle')
      })
      .catch(() => setState('error'))
  }
  useEffect(load, [])

  const claim = async (id: string) => {
    setClaimingId(id)
    setNotice(null)
    const r = await translatorApi<{ ok?: boolean; error?: string }>('claim', { orderId: id })
    setClaimingId(null)
    if (r.ok) {
      setOrders((prev) => prev.filter((o) => o.id !== id))
      setNotice(t.pool.claimed)
    } else {
      setNotice(t.pool.claimError)
    }
  }

  const serviceName = (s: string) => (dict.serviceItems as Record<string, { name: string }>)[s]?.name ?? s
  const docName = (d: string) => (dict.quote.documentTypes as Record<string, string>)[d] ?? d
  const deadline = (o: PoolOrder) => {
    try {
      const d = new Date(o.created_at)
      d.setDate(d.getDate() + (o.delivery_days || 1))
      return d.toLocaleDateString(locale)
    } catch {
      return '—'
    }
  }

  if (state === 'loading') return <p className="py-10 text-center text-sm text-text-secondary">{t.pool.loading}</p>
  if (state === 'error')
    return <p className="rounded-md border border-danger/40 bg-danger/10 p-4 text-sm text-danger">{t.pool.error}</p>

  return (
    <div>
      {notice && <p className="mb-3 rounded-md border border-success/40 bg-success/10 p-3 text-sm text-success">{notice}</p>}
      {orders.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border bg-surface-muted/40 p-10 text-center">
          <p className="text-sm text-text-secondary">{t.pool.empty}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((o) => (
            <article key={o.id} className="rounded-lg border border-border bg-surface p-4 sm:p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="font-semibold">{t.pool.orderNo} #{o.order_no}</h3>
                <div className="flex flex-wrap gap-1.5">
                  {o.urgent && <Pill tone="danger">{t.pool.urgent}</Pill>}
                  {o.notarization && <Pill tone="info">{t.pool.notary}</Pill>}
                  <Pill tone="muted">{o.physical_delivery ? t.pool.cargo : t.pool.digital}</Pill>
                </div>
              </div>

              <dl className="mt-3 grid gap-x-4 gap-y-2 text-sm sm:grid-cols-2">
                <Row label={t.pool.service}>{serviceName(o.service)}</Row>
                <Row label={t.pool.documentType}>{docName(o.document_type)}</Row>
                <Row label={t.pool.langPair}>
                  {languageName(o.source_lang, locale)} → {languageName(o.target_lang, locale)}
                </Row>
                <Row label={t.pool.words}>
                  {o.word_count} · ~{o.pages} {t.pool.pagesUnit}
                </Row>
                <Row label={t.pool.deadline}>
                  {deadline(o)} ({o.delivery_days} {t.pool.daysUnit})
                </Row>
              </dl>

              {o.note && (
                <p className="mt-3 rounded-md bg-surface-muted p-2.5 text-sm text-text-secondary">
                  <span className="font-medium">{t.pool.note}: </span>
                  {o.note}
                </p>
              )}

              {o.input_mode === 'text' && o.source_text ? (
                <div className="mt-3">
                  <p className="mb-1 text-sm font-medium">{t.pool.text}</p>
                  <pre className="max-h-40 overflow-auto whitespace-pre-wrap rounded-md border border-border bg-surface-muted/60 p-2.5 text-xs leading-relaxed">
                    {o.source_text}
                  </pre>
                </div>
              ) : o.files.length > 0 ? (
                <div className="mt-3">
                  <p className="mb-1 text-sm font-medium">{t.pool.files}</p>
                  <ul className="flex flex-wrap gap-2">
                    {o.files.map((f, i) => (
                      <li key={i}>
                        {f.url ? (
                          <a href={f.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 rounded-md border border-border bg-surface px-2.5 py-1 text-xs hover:bg-surface-muted">
                            <Icon name="FileText" className="size-3.5" /> <span className="max-w-[220px] truncate">{f.name}</span>
                          </a>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1 text-xs text-text-muted">
                            <Icon name="FileText" className="size-3.5" /> {f.name}
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

              <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-3">
                <div>
                  <p className="text-xs text-text-secondary">{t.pool.earning}</p>
                  <p className="text-lg font-bold text-success">{formatCurrency(o.payout)}</p>
                </div>
                <Button type="button" intent="secondary" disabled={claimingId === o.id} onClick={() => claim(o.id)}>
                  {claimingId === o.id ? t.pool.claiming : t.pool.claim}
                </Button>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  )
}

function Pill({ tone, children }: { tone: 'danger' | 'info' | 'muted'; children: ReactNode }) {
  const cls =
    tone === 'danger'
      ? 'bg-danger/10 text-danger'
      : tone === 'info'
        ? 'bg-primary/10 text-primary'
        : 'bg-surface-muted text-text-secondary'
  return <span className={cn('rounded-full px-2 py-0.5 text-[11px] font-medium', cls)}>{children}</span>
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex justify-between gap-3 sm:block">
      <dt className="text-text-secondary">{label}</dt>
      <dd className="font-medium sm:mt-0.5">{children}</dd>
    </div>
  )
}

/** dict.translator tipini kısaltmak için. */
type TDict = ReturnType<typeof useI18n>['dict']['translator']

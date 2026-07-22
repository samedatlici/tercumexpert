import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
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
import { PANEL_LANGUAGES, languageName } from '@/features/translator/model/config'
import { AREA_IDS } from '@/app/config/areas.config'
import { defaultCountryForLocale } from '@/app/config/country-codes'
import { CountryCitySelect, countryDisplayName } from '@/components/common/CountryCitySelect'
import { translatorApi } from '@/features/translator/model/api'
import { uploadTranslationFiles } from '@/features/translator/model/upload-translation'
import type { LanguagePair, Translator } from '@/features/translator/model/types'

export default function TranslatorPage() {
  const { locale, dict } = useI18n()
  const t = dict.translator
  const { user, loading: authLoading } = useAuth()
  const { loading, isAdmin, translator, error, refetch } = useTranslator()
  const [reapplying, setReapplying] = useState(false)

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
    // Reddedilmiş — "Tekrar dene" ile sıfırdan başvuru formunu açar.
    if (translator?.status === 'rejected' && !reapplying) {
      return (
        <Center icon="X" title={t.rejectedTitle} desc={t.rejectedDesc}>
          <Button intent="secondary" block onClick={() => setReapplying(true)}>{t.reapply}</Button>
        </Center>
      )
    }
    // Normal üye (kayıt yok) VEYA reddedilip yeniden başvuran → başvuru formu.
    // Reddedilmişse mevcut satır GÜNCELLENİR (status → pending); yoksa yeni kayıt eklenir.
    return (
      <ApplicationForm
        t={t}
        locale={locale}
        userId={user.id}
        existingId={translator?.status === 'rejected' ? translator.id : undefined}
        onDone={() => {
          setReapplying(false)
          refetch()
        }}
      />
    )
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

// SABİT yükseklik (h-11): native <select> min-height'ı input gibi büyütmediğinden,
// input ve select'lerin AYNI görünmesi için sabit yükseklik şart.
const inputClass =
  'h-11 w-full rounded-md border border-border bg-surface px-3 text-base outline-none focus:border-border-strong'
const textareaClass =
  'min-h-[80px] w-full rounded-md border border-border bg-surface px-3 py-2 text-base outline-none focus:border-border-strong'
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
          className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-md border border-border text-text-secondary hover:bg-surface-muted"
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
        <ul className="mt-3 flex flex-wrap gap-2.5">
          {pairs.map((p, i) => (
            <li key={`${p.source}-${p.target}`} className="inline-flex items-center gap-2 rounded-lg border border-border-strong bg-surface-muted py-2 pe-2 ps-3.5 text-sm font-medium">
              {languageName(p.source, locale)} → {languageName(p.target, locale)}
              <button type="button" onClick={() => setPairs(pairs.filter((_, j) => j !== i))} aria-label={t.form.removePair} className="inline-flex size-6 items-center justify-center rounded-md text-text-muted hover:bg-border/60 hover:text-danger">
                <Icon name="X" className="size-4" />
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
  const { dict } = useI18n()
  const areaLabel = (id: string) => (dict.quote.areas as Record<string, string>)[id] ?? id
  const toggle = (k: string) => {
    setSelected(selected.includes(k) ? selected.filter((x) => x !== k) : [...selected, k])
  }
  return (
    <div>
      <label className={labelClass}>{t.form.expertise}</label>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {AREA_IDS.map((k) => (
          <label key={k} className={cn('flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm', selected.includes(k) ? 'border-secondary bg-surface-muted' : 'border-border bg-surface hover:bg-surface-muted')}>
            <input type="checkbox" checked={selected.includes(k)} onChange={() => toggle(k)} className="size-4 accent-black" />
            {areaLabel(k)}
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
  existingId,
  onDone,
}: {
  t: TDict
  locale: string
  userId: string
  /** Reddedilmiş kaydın id'si — verilirse INSERT yerine UPDATE (status → pending). */
  existingId?: string
  onDone: () => void
}) {
  const [fullName, setFullName] = useState('')
  const [birthDate, setBirthDate] = useState('')
  const [phone, setPhone] = useState('')
  const [country, setCountry] = useState(() => defaultCountryForLocale(locale))
  const [city, setCity] = useState('')
  const [address, setAddress] = useState('')
  const [isSworn, setIsSworn] = useState(false)
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
    const payload = {
      full_name: fullName.trim(),
      birth_date: birthDate || null,
      phone: phone.trim() || null,
      country: country || null,
      city: city || null,
      address: address.trim() || null,
      is_sworn: isSworn,
      language_pairs: pairs,
      expertise,
    }
    // Reddedilmiş kaydı yeniden gönder (UPDATE, status→pending) veya yeni kayıt (INSERT).
    const { error } = existingId
      ? await supabase.from('translators').update({ ...payload, status: 'pending' }).eq('id', existingId)
      : await supabase.from('translators').insert({ user_id: userId, ...payload })
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
        <CountryCitySelect
          country={country}
          city={city}
          onCountry={setCountry}
          onCity={setCity}
          countryLabel={t.form.country}
          cityLabel={t.form.city}
          countryPlaceholder={t.form.selectCountry}
          cityPlaceholder={t.form.selectCity}
          cityDisabledPlaceholder={t.form.cityNeedsCountry}
          selectClassName={inputClass}
        />
        <div>
          <label className={labelClass}>{t.form.address}</label>
          <textarea rows={2} className={textareaClass} value={address} onChange={(e) => setAddress(e.target.value)} autoComplete="street-address" />
        </div>
        <label className="flex items-start gap-2.5 rounded-md border border-border bg-surface-muted/40 p-3 text-sm">
          <input type="checkbox" checked={isSworn} onChange={(e) => setIsSworn(e.target.checked)} className="mt-0.5 size-4 shrink-0 accent-black" />
          <span>
            <span className="font-medium">{t.form.isSworn}</span>
            <span className="mt-0.5 block text-xs text-text-muted">{t.form.isSwornHint}</span>
          </span>
        </label>
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

type Tab = 'profile' | 'pool' | 'active' | 'pending' | 'approved' | 'completed' | 'wallet'
const TABS: { key: Tab; icon: IconName }[] = [
  { key: 'profile', icon: 'Users' },
  { key: 'pool', icon: 'Languages' },
  { key: 'active', icon: 'Cog' },
  { key: 'pending', icon: 'Clock' },
  { key: 'approved', icon: 'Check' },
  { key: 'completed', icon: 'PackageCheck' },
  { key: 'wallet', icon: 'Wallet' },
]

/** Sekme anahtarı → work_status. */
const TAB_STATUS: Record<string, 'claimed' | 'submitted' | 'approved' | 'completed'> = {
  active: 'claimed',
  pending: 'submitted',
  approved: 'approved',
  completed: 'completed',
}

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
      ) : TAB_STATUS[tab] ? (
        <WorkflowSection t={t} locale={locale} status={TAB_STATUS[tab]} isAdmin={false} translatorId={translator.id} />
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
  const [country, setCountry] = useState(translator.country ?? '')
  const [city, setCity] = useState(translator.city ?? '')
  const [address, setAddress] = useState(translator.address ?? '')
  const [isSworn, setIsSworn] = useState(!!translator.is_sworn)
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
        country: country || null,
        city: city || null,
        address: address.trim() || null,
        is_sworn: isSworn,
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
        <Pill tone="success">
          <Icon name="CircleCheck" className="size-3.5" /> {t.profile.statusApproved}
        </Pill>
        <Pill tone={translator.iban_verified ? 'success' : 'neutral'}>
          <Icon name={translator.iban_verified ? 'ShieldCheck' : 'Lock'} className="size-3.5" />
          {translator.iban_verified ? t.profile.verifiedIban : t.profile.unverifiedIban}
        </Pill>
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
      <CountryCitySelect
        country={country}
        city={city}
        onCountry={setCountry}
        onCity={setCity}
        countryLabel={t.form.country}
        cityLabel={t.form.city}
        countryPlaceholder={t.form.selectCountry}
        cityPlaceholder={t.form.selectCity}
        cityDisabledPlaceholder={t.form.cityNeedsCountry}
        selectClassName={inputClass}
      />
      <div>
        <label className={labelClass}>{t.form.address}</label>
        <textarea rows={2} className={textareaClass} value={address} onChange={(e) => setAddress(e.target.value)} />
      </div>
      <label className="flex items-start gap-2.5 rounded-md border border-border bg-surface-muted/40 p-3 text-sm">
        <input type="checkbox" checked={isSworn} onChange={(e) => setIsSworn(e.target.checked)} className="mt-0.5 size-4 shrink-0 accent-black" />
        <span>
          <span className="font-medium">{t.form.isSworn}</span>
          <span className="mt-0.5 block text-xs text-text-muted">{t.form.isSwornHint}</span>
        </span>
      </label>
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

/** Admin: sekmeli yönetim — Tercümanlar (başvuru/onay) + iş akışı sekmeleri (tüm tercümanlar). */
type AdminTab = 'applications' | 'active' | 'pending' | 'approved' | 'completed'
const ADMIN_TABS: { key: AdminTab; icon: IconName }[] = [
  { key: 'applications', icon: 'Users' },
  { key: 'active', icon: 'Cog' },
  { key: 'pending', icon: 'Clock' },
  { key: 'approved', icon: 'Check' },
  { key: 'completed', icon: 'PackageCheck' },
]

function AdminSection({ t, locale }: { t: TDict; locale: string }) {
  const [tab, setTab] = useState<AdminTab>('applications')
  const adminLabel = (k: AdminTab) => (k === 'applications' ? t.admin.applicationsTab : t.tabs[k])

  return (
    <div>
      <h1 className="mb-1 text-2xl font-bold">{t.admin.title}</h1>
      <p className="mb-5 text-sm text-text-secondary">{t.admin.panelHint}</p>

      <div className="mb-6 flex flex-wrap gap-2">
        {ADMIN_TABS.map((x) => (
          <button
            key={x.key}
            type="button"
            onClick={() => setTab(x.key)}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors',
              tab === x.key ? 'border-secondary bg-secondary text-secondary-foreground' : 'border-border bg-surface text-text-secondary hover:bg-surface-muted',
            )}
          >
            <Icon name={x.icon} className="size-4" /> {adminLabel(x.key)}
          </button>
        ))}
      </div>

      {tab === 'applications' ? (
        <AdminApplications t={t} locale={locale} />
      ) : (
        <WorkflowSection t={t} locale={locale} status={TAB_STATUS[tab]} isAdmin />
      )}
    </div>
  )
}

function AdminApplications({ t, locale }: { t: TDict; locale: string }) {
  const { dict } = useI18n()
  const areaLabel = (id: string) => (dict.quote.areas as Record<string, string>)[id] ?? id
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
      <p className="mb-5 text-sm text-text-secondary">
        {t.admin.summary.replace('{total}', String(rows.length)).replace('{pending}', String(pendingCount))}
      </p>

      {state === 'loading' && <p className="py-10 text-center text-sm text-text-secondary">{t.loading}</p>}
      {state === 'error' && <p className="rounded-md border border-danger/40 bg-danger/10 p-4 text-sm text-danger">{t.admin.loadError}</p>}
      {state === 'idle' && rows.length === 0 && <p className="py-10 text-center text-sm text-text-secondary">{t.admin.noApplications}</p>}

      {state === 'idle' && rows.length > 0 && (
        <div className="space-y-3">
          {rows.map((r) => (
            <article key={r.id} className="rounded-lg border border-border bg-surface p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-semibold">{r.full_name || '—'}</h3>
                    <StatusBadge t={t} status={r.status} />
                    {r.is_sworn && <Pill tone="primary">{t.admin.swornBadge}</Pill>}
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
                  {(r.expertise ?? []).length === 0 ? '—' : r.expertise.map((k) => areaLabel(k)).join(', ')}
                </Detail>
                <Detail label={t.form.phone}>{r.phone ? <span dir="ltr">{r.phone}</span> : '—'}</Detail>
                <Detail label={t.form.birthDate}>{r.birth_date || '—'}</Detail>
                <Detail label={t.admin.colLocation}>
                  {[r.city, countryDisplayName(r.country ?? '', locale, r.country ?? '')].filter(Boolean).join(', ') || '—'}
                </Detail>
                {r.iban && <Detail label={t.form.iban}><span dir="ltr">{r.iban}</span></Detail>}
                {r.iban_name && <Detail label={t.form.ibanName}>{r.iban_name}</Detail>}
                <Detail label={t.form.address}>{r.address || '—'}</Detail>
              </dl>

              <div className="mt-3 flex items-center justify-between gap-3 border-t border-border pt-3">
                <Pill tone={r.iban_verified ? 'success' : 'neutral'}>
                  <Icon name={r.iban_verified ? 'ShieldCheck' : 'Lock'} className="size-3.5" />
                  {r.iban_verified ? t.admin.ibanVerified : t.admin.ibanNotVerified}
                </Pill>
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
  const tone: PillTone = status === 'approved' ? 'success' : status === 'rejected' ? 'danger' : 'neutral'
  const label =
    status === 'approved' ? t.admin.statusApproved : status === 'rejected' ? t.admin.statusRejected : t.admin.statusPending
  return <Pill tone={tone}>{label}</Pill>
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
  sworn: boolean
  notarization: boolean
  apostille: boolean
  physical_delivery: boolean
  input_mode: string
  source_text: string | null
  note: string | null
  delivery_days: number
  created_at: string
  contact_name: string | null
  contact_email: string | null
  contact_phone: string | null
  delivery_address: string | null
  delivery_city: string | null
  delivery_postal_code: string | null
  delivery_country: string | null
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

  const serviceName = (s: string) => (dict.quote.areas as Record<string, string>)[s] ?? s
  const docName = (d: string) => (dict.quote.docTypes as Record<string, string>)[d] ?? d
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
                  {o.sworn && <Pill tone="primary">{t.pool.sworn}</Pill>}
                  {o.notarization && <Pill tone="primary">{t.pool.notary}</Pill>}
                  {o.apostille && <Pill tone="primary">{t.pool.apostille}</Pill>}
                  {o.physical_delivery ? (
                    <Pill tone="dark">{t.pool.cargo}</Pill>
                  ) : (
                    <Pill tone="outline">{t.pool.digital}</Pill>
                  )}
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

              {/* Müşteri / teslimat bilgileri — tercüman işi bilerek üstlensin diye. */}
              {(o.contact_name || o.contact_email || o.contact_phone || o.delivery_address) && (
                <div className="mt-3 rounded-md border border-border bg-surface-muted/40 p-3">
                  <p className="mb-1.5 text-sm font-semibold">
                    {o.physical_delivery ? t.pool.deliveryInfo : t.pool.customerInfo}
                  </p>
                  <dl className="grid gap-x-4 gap-y-1.5 text-sm sm:grid-cols-2">
                    {o.contact_name && <Row label={t.pool.customerName}>{o.contact_name}</Row>}
                    {o.contact_email && (
                      <Row label={t.pool.customerEmail}>
                        <a href={`mailto:${o.contact_email}`} className="underline">{o.contact_email}</a>
                      </Row>
                    )}
                    {o.contact_phone && (
                      <Row label={t.pool.customerPhone}>
                        <a href={`tel:${o.contact_phone.replace(/[^\d+]/g, '')}`} className="underline" dir="ltr">{o.contact_phone}</a>
                      </Row>
                    )}
                    {o.physical_delivery && (o.delivery_address || o.delivery_city) && (
                      <Row label={t.pool.deliveryAddress}>
                        {[o.delivery_address, o.delivery_city, o.delivery_postal_code, o.delivery_country].filter(Boolean).join(', ')}
                      </Row>
                    )}
                  </dl>
                </div>
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
                  <p className="mb-1 text-xs text-text-secondary">{t.pool.earning}</p>
                  <span className="inline-flex items-center rounded-lg border border-success bg-success px-3 py-1.5 text-lg font-bold text-white">
                    {formatCurrency(o.payout)}
                  </span>
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

type PillTone = 'danger' | 'primary' | 'success' | 'dark' | 'outline' | 'neutral'
const PILL_TONE: Record<PillTone, string> = {
  danger: 'border border-danger bg-danger text-white',
  primary: 'border border-primary bg-primary text-primary-foreground',
  success: 'border border-success bg-success text-white',
  dark: 'border border-secondary bg-secondary text-secondary-foreground',
  outline: 'border-2 border-border-strong bg-surface text-text-primary',
  neutral: 'border-2 border-border-strong bg-surface-muted text-text-secondary',
}

/** Dolgulu/çerçeveli, dikkat çeken rozet. */
function Pill({ tone, children }: { tone: PillTone; children: ReactNode }) {
  return (
    <span className={cn('inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold', PILL_TONE[tone])}>
      {children}
    </span>
  )
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex justify-between gap-3 sm:block">
      <dt className="text-text-secondary">{label}</dt>
      <dd className="font-medium sm:mt-0.5">{children}</dd>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Faz 4: İş akışı sekmeleri (Aktif/Onay Bekleyen/Onaylanan/Tamamlanan) */
/* Paylaşımlı: admin=tüm tercümanlar (takip+onay/red), tercüman=kendi işleri.*/
/* ------------------------------------------------------------------ */

type WStatus = 'claimed' | 'submitted' | 'approved' | 'completed'
interface JobFile {
  name: string
  url: string | null
}
interface Job {
  id: string
  order_no: number
  service: string
  source_lang: string
  target_lang: string
  document_type: string
  word_count: number
  urgent: boolean
  sworn: boolean
  notarization: boolean
  apostille: boolean
  physical_delivery: boolean
  input_mode: string
  source_text: string | null
  note: string | null
  delivery_days: number
  created_at: string
  contact_name: string | null
  contact_email: string | null
  contact_phone: string | null
  delivery_address: string | null
  delivery_city: string | null
  delivery_postal_code: string | null
  delivery_country: string | null
  work_status: string
  rejection_reason: string | null
  tracking_info: string | null
  payout: number
  pages: number
  sourceFiles: JobFile[]
  translationFiles: JobFile[]
  translatorInfo: { name: string | null; is_sworn: boolean } | null
}

function WorkflowSection({
  t,
  locale,
  status,
  isAdmin,
  translatorId,
}: {
  t: TDict
  locale: string
  status: WStatus
  isAdmin: boolean
  translatorId?: string
}) {
  const [jobs, setJobs] = useState<Job[]>([])
  const [state, setState] = useState<'loading' | 'idle' | 'error'>('loading')
  const [notice, setNotice] = useState<string | null>(null)

  const load = () => {
    setState('loading')
    translatorApi<{ jobs?: Job[]; error?: string }>('jobs')
      .then((r) => {
        if (r.error) {
          setState('error')
          return
        }
        setJobs((r.jobs ?? []).filter((j) => j.work_status === status))
        setState('idle')
      })
      .catch(() => setState('error'))
  }
  useEffect(load, [status])

  if (state === 'loading') return <p className="py-10 text-center text-sm text-text-secondary">{t.pool.loading}</p>
  if (state === 'error')
    return <p className="rounded-md border border-danger/40 bg-danger/10 p-4 text-sm text-danger">{t.pool.error}</p>

  return (
    <div>
      {notice && <p className="mb-3 rounded-md border border-success/40 bg-success/10 p-3 text-sm text-success">{notice}</p>}
      {jobs.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border bg-surface-muted/40 p-10 text-center">
          <p className="text-sm text-text-secondary">{t.jobs.empty}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {jobs.map((j) => (
            <JobCard
              key={j.id}
              t={t}
              locale={locale}
              job={j}
              status={status}
              isAdmin={isAdmin}
              translatorId={translatorId}
              onChanged={(msg) => {
                setNotice(msg ?? null)
                load()
              }}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function JobCard({
  t,
  locale,
  job,
  status,
  isAdmin,
  translatorId,
  onChanged,
}: {
  t: TDict
  locale: string
  job: Job
  status: WStatus
  isAdmin: boolean
  translatorId?: string
  onChanged: (msg?: string) => void
}) {
  const { dict, formatCurrency } = useI18n()
  const [files, setFiles] = useState<File[]>([])
  const [tracking, setTracking] = useState('')
  const [reason, setReason] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const serviceName = (s: string) => (dict.quote.areas as Record<string, string>)[s] ?? s
  const docName = (d: string) => (dict.quote.docTypes as Record<string, string>)[d] ?? d

  const submit = async () => {
    if (files.length === 0) {
      setErr(t.jobs.needFiles)
      return
    }
    setBusy(true)
    setErr(null)
    const up = await uploadTranslationFiles(translatorId ?? '', job.id, files)
    if (!up.ok) {
      setBusy(false)
      setErr(t.jobs.uploadError)
      return
    }
    const r = await translatorApi<{ ok?: boolean; error?: string }>('submit', { orderId: job.id, files: up.files })
    setBusy(false)
    if (r.ok) onChanged(t.jobs.submittedMsg)
    else setErr(t.jobs.actionError)
  }

  const complete = async () => {
    if (job.physical_delivery && !tracking.trim()) {
      setErr(t.jobs.needTracking)
      return
    }
    setBusy(true)
    setErr(null)
    const r = await translatorApi<{ ok?: boolean; error?: string }>('complete', { orderId: job.id, tracking: tracking.trim() })
    setBusy(false)
    if (r.ok) onChanged(t.jobs.completedMsg)
    else setErr(t.jobs.actionError)
  }

  const adminAct = async (action: 'approveTranslation' | 'rejectTranslation') => {
    if (action === 'rejectTranslation' && !reason.trim()) {
      setErr(t.jobs.needReason)
      return
    }
    setBusy(true)
    setErr(null)
    const r = await translatorApi<{ ok?: boolean; error?: string }>(action, { orderId: job.id, reason: reason.trim() })
    setBusy(false)
    if (r.ok) onChanged(action === 'approveTranslation' ? t.jobs.approvedMsg : t.jobs.rejectedMsg)
    else setErr(t.jobs.actionError)
  }

  const FileLinks = ({ list, label }: { list: JobFile[]; label: string }) =>
    list.length > 0 ? (
      <div className="mt-3">
        <p className="mb-1 text-sm font-medium">{label}</p>
        <ul className="flex flex-wrap gap-2">
          {list.map((f, i) => (
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
    ) : null

  return (
    <article className="rounded-lg border border-border bg-surface p-4 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="font-semibold">{t.pool.orderNo} #{job.order_no}</h3>
        <div className="flex flex-wrap gap-1.5">
          {job.urgent && <Pill tone="danger">{t.pool.urgent}</Pill>}
          {job.sworn && <Pill tone="primary">{t.pool.sworn}</Pill>}
          {job.notarization && <Pill tone="primary">{t.pool.notary}</Pill>}
          {job.apostille && <Pill tone="primary">{t.pool.apostille}</Pill>}
          {job.physical_delivery ? <Pill tone="dark">{t.pool.cargo}</Pill> : <Pill tone="outline">{t.pool.digital}</Pill>}
        </div>
      </div>

      {isAdmin && job.translatorInfo && (
        <p className="mt-1 text-sm">
          <span className="text-text-secondary">{t.jobs.translator}: </span>
          <span className="font-medium">{job.translatorInfo.name || '—'}</span>
          {job.translatorInfo.is_sworn && <span className="ms-2"><Pill tone="primary">{t.admin.swornBadge}</Pill></span>}
        </p>
      )}

      <dl className="mt-3 grid gap-x-4 gap-y-2 text-sm sm:grid-cols-2">
        <Row label={t.pool.service}>{serviceName(job.service)}</Row>
        <Row label={t.pool.documentType}>{docName(job.document_type)}</Row>
        <Row label={t.pool.langPair}>{languageName(job.source_lang, locale)} → {languageName(job.target_lang, locale)}</Row>
        <Row label={t.pool.words}>{job.word_count} · ~{job.pages} {t.pool.pagesUnit}</Row>
        <Row label={t.pool.earning}>{formatCurrency(job.payout)}</Row>
      </dl>

      {status === 'claimed' && job.rejection_reason && (
        <div className="mt-3 rounded-md border border-danger/40 bg-danger/10 p-3 text-sm text-danger">
          <span className="font-semibold">{t.jobs.rejectionReason}: </span>
          {job.rejection_reason}
        </div>
      )}

      {(job.contact_name || job.contact_email || job.delivery_address) && (
        <div className="mt-3 rounded-md border border-border bg-surface-muted/40 p-3">
          <p className="mb-1.5 text-sm font-semibold">{job.physical_delivery ? t.pool.deliveryInfo : t.pool.customerInfo}</p>
          <dl className="grid gap-x-4 gap-y-1.5 text-sm sm:grid-cols-2">
            {job.contact_name && <Row label={t.pool.customerName}>{job.contact_name}</Row>}
            {job.contact_email && (
              <Row label={t.pool.customerEmail}><a href={`mailto:${job.contact_email}`} className="underline">{job.contact_email}</a></Row>
            )}
            {job.contact_phone && (
              <Row label={t.pool.customerPhone}><a href={`tel:${job.contact_phone.replace(/[^\d+]/g, '')}`} className="underline" dir="ltr">{job.contact_phone}</a></Row>
            )}
            {job.physical_delivery && (job.delivery_address || job.delivery_city) && (
              <Row label={t.pool.deliveryAddress}>{[job.delivery_address, job.delivery_city, job.delivery_postal_code, job.delivery_country].filter(Boolean).join(', ')}</Row>
            )}
          </dl>
        </div>
      )}

      {job.input_mode === 'text' && job.source_text ? (
        <div className="mt-3">
          <p className="mb-1 text-sm font-medium">{t.pool.text}</p>
          <pre className="max-h-40 overflow-auto whitespace-pre-wrap rounded-md border border-border bg-surface-muted/60 p-2.5 text-xs leading-relaxed">{job.source_text}</pre>
        </div>
      ) : (
        <FileLinks list={job.sourceFiles} label={t.jobs.sourceFiles} />
      )}

      <FileLinks list={job.translationFiles} label={t.jobs.translationFiles} />

      {job.tracking_info && (
        <p className="mt-3 text-sm"><span className="text-text-secondary">{t.jobs.tracking}: </span><span className="font-medium" dir="ltr">{job.tracking_info}</span></p>
      )}

      {/* ---- Eylem alanı ---- */}
      <div className="mt-4 border-t border-border pt-3">
        {err && <p className="mb-2 text-sm text-danger">{err}</p>}

        {/* Tercüman: Aktif İşler -> çeviri yükle + onaya gönder */}
        {!isAdmin && status === 'claimed' && (
          <div className="space-y-2">
            <input ref={fileRef} type="file" multiple className="hidden" onChange={(e) => setFiles(Array.from(e.target.files ?? []))} />
            <div className="flex flex-wrap items-center gap-2">
              <Button type="button" intent="outline" size="sm" onClick={() => fileRef.current?.click()} disabled={busy}>
                <Icon name="Upload" className="size-4" /> {t.jobs.chooseFiles}
              </Button>
              {files.length > 0 && <span className="text-xs text-text-secondary">{files.length} {t.jobs.filesSelected}</span>}
            </div>
            <p className="text-xs text-text-muted">{t.jobs.uploadHint}</p>
            <Button type="button" intent="secondary" disabled={busy} onClick={submit}>
              {busy ? t.jobs.sending : t.jobs.submit}
            </Button>
          </div>
        )}

        {/* Tercüman: Onay Bekleyen -> bilgi */}
        {!isAdmin && status === 'submitted' && (
          <p className="text-sm text-text-secondary">{t.jobs.waitingApproval}</p>
        )}

        {/* Tercüman: Onaylanan -> teslim/tamamla */}
        {!isAdmin && status === 'approved' && (
          <div className="space-y-2">
            {job.physical_delivery && (
              <input
                value={tracking}
                onChange={(e) => setTracking(e.target.value)}
                placeholder={t.jobs.trackingPlaceholder}
                dir="ltr"
                className="h-11 w-full rounded-md border border-border bg-surface px-3 text-base outline-none focus:border-border-strong"
              />
            )}
            <Button type="button" intent="secondary" disabled={busy} onClick={complete}>
              {busy ? t.jobs.sending : job.physical_delivery ? t.jobs.markShipped : t.jobs.markDelivered}
            </Button>
          </div>
        )}

        {/* Admin: Onay Bekleyen -> onayla / reddet */}
        {isAdmin && status === 'submitted' && (
          <div className="space-y-2">
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={t.jobs.reasonPlaceholder}
              rows={2}
              className="min-h-[64px] w-full rounded-md border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-border-strong"
            />
            <div className="flex flex-wrap gap-2">
              <Button type="button" intent="secondary" size="sm" disabled={busy} onClick={() => adminAct('approveTranslation')}>{t.jobs.approve}</Button>
              <Button type="button" intent="outline" size="sm" disabled={busy} onClick={() => adminAct('rejectTranslation')}>{t.jobs.reject}</Button>
            </div>
          </div>
        )}

        {/* Diğer durumlar salt-okunur (admin takip / tamamlanan) */}
        {((isAdmin && status !== 'submitted') || status === 'completed') && (
          <p className="text-xs text-text-muted">{t.jobs.statusLabel}: {t.jobs[('status_' + job.work_status) as keyof TDict['jobs']] ?? job.work_status}</p>
        )}
      </div>
    </article>
  )
}

/** dict.translator tipini kısaltmak için. */
type TDict = ReturnType<typeof useI18n>['dict']['translator']

import { useEffect, useMemo, useRef, useState, type Dispatch, type ReactNode, type SetStateAction } from 'react'
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
  const [canceling, setCanceling] = useState(false)

  // Başvuran kişi bekleyen/reddedilmiş başvurusunu iptal edebilir (kaydı siler → sıfırdan başvurabilir).
  // Sunucu (service-role) FK bağımlılıklarını çözer: devam eden siparişleri havuza geri bırakır,
  // tamamlanmışların geçmişini korur. İstemci doğrudan silemez (FK kısıtı hatası verirdi).
  const cancelApplication = async () => {
    if (!translator) return
    if (!window.confirm(t.cancelConfirm)) return
    setCanceling(true)
    const res = await translatorApi<{ ok?: boolean; error?: string }>('cancelApplication')
    setCanceling(false)
    if (!res?.ok) {
      alert(t.form.saveError)
      return
    }
    setReapplying(false)
    refetch()
  }

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
          <Link to={`${buildPath(locale, 'auth')}?next=${encodeURIComponent(window.location.pathname)}`}>
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
    // Başvuru beklemede — başvuran iptal edebilir.
    if (translator?.status === 'pending') {
      return (
        <Center icon="Clock" title={t.pendingTitle} desc={t.pendingDesc}>
          <Button intent="outline" block onClick={cancelApplication} disabled={canceling}>
            {canceling ? t.form.submitting : t.cancelApplication}
          </Button>
        </Center>
      )
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
        <PoolTab t={t} locale={locale} ibanVerified={!!translator.iban_verified} />
      ) : TAB_STATUS[tab] ? (
        <WorkflowSection t={t} locale={locale} status={TAB_STATUS[tab]} isAdmin={false} translatorId={translator.id} />
      ) : tab === 'wallet' ? (
        <WalletSection t={t} />
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
  const [consent, setConsent] = useState(false)
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<'ok' | 'err' | null>(null)

  // Onaydan sonra Ad Soyad + Doğum tarihi kilitli (sunucu da zorlar).
  const locked = !!translator.was_approved
  const isApproved = translator.status === 'approved'
  // Onay-DÜŞÜREN değişiklik: dil çifti / yeminli / uzmanlık (IBAN HARİÇ).
  const willRevoke =
    isApproved &&
    (JSON.stringify(pairs) !== JSON.stringify(translator.language_pairs ?? []) ||
      JSON.stringify(expertise) !== JSON.stringify(translator.expertise ?? []) ||
      isSworn !== !!translator.is_sworn)
  // IBAN değişikliği: hesap onaylı KALIR, yalnız IBAN yeniden onay bekler (yeni iş alınamaz).
  const ibanReverify = isApproved && iban.trim() !== (translator.iban ?? '')

  const save = async (e: React.FormEvent) => {
    e.preventDefault()
    if (willRevoke && !consent) return
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
          <input
            className={cn(inputClass, locked && 'cursor-not-allowed bg-surface-muted text-text-muted')}
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            disabled={locked}
          />
          {locked && <p className="mt-1 text-xs text-text-muted"><Icon name="Lock" className="me-1 inline size-3" />{t.profile.lockedHint}</p>}
        </div>
        <div>
          <label className={labelClass}>{t.form.birthDate}</label>
          <input
            type="date"
            className={cn(inputClass, locked && 'cursor-not-allowed bg-surface-muted text-text-muted')}
            value={birthDate}
            onChange={(e) => setBirthDate(e.target.value)}
            disabled={locked}
          />
          {locked && <p className="mt-1 text-xs text-text-muted"><Icon name="Lock" className="me-1 inline size-3" />{t.profile.lockedHint}</p>}
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
      {ibanReverify && !willRevoke && (
        <div className="flex items-start gap-2 rounded-md border border-secondary/40 bg-surface-muted p-3.5 text-sm">
          <Icon name="ShieldCheck" className="mt-0.5 size-4 shrink-0 text-text-secondary" />
          <p className="text-text-secondary">{t.profile.ibanReverify}</p>
        </div>
      )}
      {willRevoke && (
        <div className="rounded-md border border-danger/40 bg-danger/5 p-3.5 text-sm">
          <p className="flex items-start gap-2 font-semibold text-danger">
            <Icon name="Lock" className="mt-0.5 size-4 shrink-0" /> {t.profile.revokeTitle}
          </p>
          <p className="mt-1.5 text-text-secondary">{t.profile.revokeWarning}</p>
          <label className="mt-3 flex items-center gap-2 font-medium">
            <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="size-4 accent-black" />
            {t.profile.consent}
          </label>
        </div>
      )}
      {msg === 'ok' && <p className="text-sm text-success">{t.form.saved}</p>}
      {msg === 'err' && <p className="text-sm text-danger">{t.form.saveError}</p>}
      <Button type="submit" intent="secondary" size="lg" disabled={busy || (willRevoke && !consent)}>
        {busy ? t.form.submitting : t.profile.edit}
      </Button>
    </form>
  )
}

/* ------------------------------------------------------------------ */
/* Admin bölümü: başvuru/onay yönetimi (tercümandan üstün yetki)       */
/* ------------------------------------------------------------------ */

/** Admin: sekmeli yönetim — Tercümanlar · Başvurular · Siparişler · iş akışı · Cüzdan. */
type AdminTab =
  | 'translators'
  | 'applications'
  | 'iban'
  | 'orders'
  | 'active'
  | 'pending'
  | 'approved'
  | 'completed'
  | 'wallet'
  | 'payments'
const ADMIN_TABS: { key: AdminTab; icon: IconName }[] = [
  { key: 'translators', icon: 'Users' },
  { key: 'applications', icon: 'FileText' },
  { key: 'iban', icon: 'ShieldCheck' },
  { key: 'orders', icon: 'PackageCheck' },
  { key: 'active', icon: 'Cog' },
  { key: 'pending', icon: 'Clock' },
  { key: 'approved', icon: 'Check' },
  { key: 'completed', icon: 'CircleCheck' },
  { key: 'wallet', icon: 'Wallet' },
  { key: 'payments', icon: 'Coins' },
]

/* ---- Tercüman filtreleri (Tercümanlar + Başvurular ortak) ---- */
interface TFilters {
  name: string
  country: string
  city: string
  source: string
  target: string
  eitherDir: boolean
  expertise: string[]
}
const EMPTY_TFILTERS: TFilters = { name: '', country: '', city: '', source: '', target: '', eitherDir: false, expertise: [] }
function norm(s: string): string {
  return (s || '').toLocaleLowerCase('tr').trim()
}
function matchesTFilters(r: Translator, f: TFilters): boolean {
  if (f.name && !norm(r.full_name ?? '').includes(norm(f.name))) return false
  if (f.country && r.country !== f.country) return false
  if (f.city && norm(r.city ?? '') !== norm(f.city)) return false
  const pairs = r.language_pairs ?? []
  if (f.source || f.target) {
    const ok = pairs.some((p) => {
      const fwd = (!f.source || p.source === f.source) && (!f.target || p.target === f.target)
      const rev = f.eitherDir && (!f.source || p.target === f.source) && (!f.target || p.source === f.target)
      return fwd || rev
    })
    if (!ok) return false
  }
  if (f.expertise.length) {
    const exp = r.expertise ?? []
    if (!f.expertise.some((e) => exp.includes(e))) return false
  }
  return true
}

function TranslatorFilters({
  t,
  locale,
  filters,
  setFilters,
  count,
}: {
  t: TDict
  locale: string
  filters: TFilters
  setFilters: Dispatch<SetStateAction<TFilters>>
  count: number
}) {
  const { dict } = useI18n()
  const areaLabel = (id: string) => (dict.quote.areas as Record<string, string>)[id] ?? id
  const fl = t.admin.filters
  // Fonksiyonel güncelleme ŞART: CountryCitySelect ülke değişince onCountry+onCity('')'i
  // aynı render'da çağırır; eski state kapanışı kullanılırsa şehir sıfırlaması ülkeyi ezer.
  const set = (patch: Partial<TFilters>) => setFilters((f) => ({ ...f, ...patch }))
  const toggleExp = (k: string) =>
    set({ expertise: filters.expertise.includes(k) ? filters.expertise.filter((x) => x !== k) : [...filters.expertise, k] })
  const active =
    !!filters.name || !!filters.country || !!filters.city || !!filters.source || !!filters.target || filters.expertise.length > 0

  return (
    <div className="mb-4 space-y-3 rounded-lg border border-border bg-surface p-4">
      <div className="relative">
        <Icon name="Users" className="pointer-events-none absolute inset-y-0 start-3 my-auto size-4 text-text-muted" />
        <input
          value={filters.name}
          onChange={(e) => set({ name: e.target.value })}
          placeholder={fl.namePlaceholder}
          className={cn(inputClass, 'ps-9')}
        />
      </div>
      <CountryCitySelect
        country={filters.country}
        city={filters.city}
        onCountry={(c) => set({ country: c, city: '' })}
        onCity={(c) => set({ city: c })}
        countryLabel={fl.country}
        cityLabel={fl.city}
        countryPlaceholder={fl.anyCountry}
        cityPlaceholder={fl.anyCity}
        cityDisabledPlaceholder={fl.cityNeedsCountry}
        selectClassName={inputClass}
      />
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className={labelClass}>{fl.sourceLang}</label>
          <select value={filters.source} onChange={(e) => set({ source: e.target.value })} className={inputClass}>
            <option value="">{fl.anyLang}</option>
            {PANEL_LANGUAGES.map((c) => (
              <option key={c} value={c}>{languageName(c, locale)}</option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelClass}>{fl.targetLang}</label>
          <select value={filters.target} onChange={(e) => set({ target: e.target.value })} className={inputClass}>
            <option value="">{fl.anyLang}</option>
            {PANEL_LANGUAGES.map((c) => (
              <option key={c} value={c}>{languageName(c, locale)}</option>
            ))}
          </select>
        </div>
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={filters.eitherDir} onChange={(e) => set({ eitherDir: e.target.checked })} className="size-4 accent-black" />
        {fl.eitherDirection}
      </label>
      <div>
        <label className={labelClass}>{fl.expertise}</label>
        <div className="flex flex-wrap gap-2">
          {AREA_IDS.map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => toggleExp(k)}
              className={cn(
                'rounded-full border px-3 py-1 text-xs font-medium transition-colors',
                filters.expertise.includes(k)
                  ? 'border-secondary bg-secondary text-secondary-foreground'
                  : 'border-border bg-surface text-text-secondary hover:bg-surface-muted',
              )}
            >
              {areaLabel(k)}
            </button>
          ))}
        </div>
      </div>
      <div className="flex items-center justify-between gap-2 border-t border-border pt-3">
        <span className="text-xs text-text-secondary">{fl.results.replace('{n}', String(count))}</span>
        {active && (
          <Button type="button" intent="outline" size="sm" onClick={() => setFilters(EMPTY_TFILTERS)}>
            {fl.clear}
          </Button>
        )}
      </div>
    </div>
  )
}

function AdminSection({ t, locale }: { t: TDict; locale: string }) {
  const [tab, setTab] = useState<AdminTab>('translators')
  const [openTid, setOpenTid] = useState<string | null>(null)
  const openTranslator = (id: string) => {
    setOpenTid(id)
    setTab('translators')
  }
  const adminLabel = (k: AdminTab) =>
    k === 'translators'
      ? t.admin.translatorsTab
      : k === 'applications'
        ? t.admin.applicationsTab
        : k === 'iban'
          ? t.admin.ibanTab
          : k === 'orders'
            ? t.admin.ordersTab
            : k === 'payments'
              ? t.admin.paymentsTab
              : t.tabs[k]

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

      {tab === 'translators' ? (
        <AdminTranslators t={t} locale={locale} openId={openTid} onOpened={() => setOpenTid(null)} />
      ) : tab === 'applications' ? (
        <AdminApplications t={t} locale={locale} />
      ) : tab === 'iban' ? (
        <AdminIbanApprovals t={t} />
      ) : tab === 'orders' ? (
        <AdminOrders t={t} locale={locale} onOpenTranslator={openTranslator} />
      ) : tab === 'wallet' ? (
        <AdminWalletSection t={t} />
      ) : tab === 'payments' ? (
        <AdminPayments t={t} />
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
  const [filters, setFilters] = useState<TFilters>(EMPTY_TFILTERS)
  const visible = useMemo(() => rows.filter((r) => matchesTFilters(r, filters)), [rows, filters])

  const load = () => {
    setState('loading')
    // Yalnızca BAŞVURULAR: bekleyen + reddedilen. Onaylılar "Tercümanlar" sayfasında.
    supabase
      .from('translators')
      .select('*')
      .in('status', ['pending', 'rejected'])
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
      // Onaylanınca başvurular listesinden düşer (artık "Tercümanlar"da).
      if (patch.status === 'approved') setRows((prev) => prev.filter((r) => r.id !== id))
      else setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)))
    } else {
      alert(t.admin.actionError)
    }
  }

  const pendingCount = useMemo(() => rows.filter((r) => r.status === 'pending').length, [rows])

  return (
    <div>
      <p className="mb-4 text-sm text-text-secondary">
        {t.admin.applicationsSummary.replace('{total}', String(rows.length)).replace('{pending}', String(pendingCount))}
      </p>

      {state === 'idle' && rows.length > 0 && (
        <TranslatorFilters t={t} locale={locale} filters={filters} setFilters={setFilters} count={visible.length} />
      )}

      {state === 'loading' && <p className="py-10 text-center text-sm text-text-secondary">{t.loading}</p>}
      {state === 'error' && <p className="rounded-md border border-danger/40 bg-danger/10 p-4 text-sm text-danger">{t.admin.loadError}</p>}
      {state === 'idle' && rows.length === 0 && <p className="py-10 text-center text-sm text-text-secondary">{t.admin.noPending}</p>}
      {state === 'idle' && rows.length > 0 && visible.length === 0 && (
        <p className="py-10 text-center text-sm text-text-secondary">{t.admin.noMatch}</p>
      )}

      {state === 'idle' && visible.length > 0 && (
        <div className="space-y-3">
          {visible.map((r) => (
            <article key={r.id} className="rounded-lg border border-border bg-surface p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-semibold">{r.full_name || '—'}</h3>
                    <StatusBadge t={t} status={r.status} />
                    {r.was_approved && <Pill tone="dark">{t.admin.returningBadge}</Pill>}
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

function PoolTab({ t, locale, ibanVerified }: { t: TDict; locale: string; ibanVerified: boolean }) {
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
      setNotice(r.error === 'iban_required' ? t.pool.ibanRequired : t.pool.claimError)
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
      {!ibanVerified && (
        <div className="mb-4 flex items-start gap-2 rounded-md border border-danger/40 bg-danger/5 p-3.5 text-sm">
          <Icon name="Lock" className="mt-0.5 size-4 shrink-0 text-danger" />
          <p className="text-text-secondary">{t.pool.ibanRequired}</p>
        </div>
      )}
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
                <Button type="button" intent="secondary" disabled={claimingId === o.id || !ibanVerified} onClick={() => claim(o.id)}>
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

/* ------------------------------------------------------------------ */
/* Faz 5: Cüzdan (tercüman + admin) + admin tercüman profili            */
/* ------------------------------------------------------------------ */

interface WalletData {
  total: number
  locked: number
  withdrawable: number
  paid: number
  entries: Array<{ amount: number; status: string; created_at: string; paid_at: string | null; order_no: number | null; unlocked: boolean }>
}

function StatCard({ label, value, icon, accent }: { label: string; value: string; icon: IconName; accent?: string }) {
  return (
    <div className="rounded-lg border border-border bg-surface p-4">
      <div className="flex items-center gap-1.5 text-text-secondary">
        <Icon name={icon} className="size-4" />
        <span className="text-xs font-medium">{label}</span>
      </div>
      <p className={cn('mt-1.5 text-xl font-bold', accent)}>{value}</p>
    </div>
  )
}

/** Cüzdan görünümü (tercüman paneli + admin profili ortak kullanır). */
function WalletView({ t, data }: { t: TDict; data: WalletData }) {
  const { formatCurrency } = useI18n()
  const w = t.wallet
  const fmtDate = (iso: string) => {
    try {
      return new Date(iso).toLocaleDateString()
    } catch {
      return '—'
    }
  }
  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label={w.total} value={formatCurrency(data.total)} icon="Wallet" />
        <StatCard label={w.locked} value={formatCurrency(data.locked)} icon="Lock" accent="text-text-muted" />
        <StatCard label={w.withdrawable} value={formatCurrency(data.withdrawable)} icon="Coins" accent="text-success" />
        <StatCard label={w.paid} value={formatCurrency(data.paid)} icon="Check" accent="text-text-secondary" />
      </div>
      <p className="rounded-md border border-border bg-surface-muted/50 p-3 text-xs text-text-secondary">{w.payInfo}</p>
      {data.entries.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border bg-surface-muted/40 p-8 text-center text-sm text-text-secondary">{w.empty}</div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead className="bg-surface-muted text-text-secondary">
              <tr>
                <th className="px-3 py-2 text-start font-medium">{w.entryOrder}</th>
                <th className="px-3 py-2 text-start font-medium">{w.date}</th>
                <th className="px-3 py-2 text-start font-medium">{w.statusCol}</th>
                <th className="px-3 py-2 text-end font-medium">{w.amount}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {data.entries.map((e, i) => (
                <tr key={i} className="bg-surface">
                  <td className="whitespace-nowrap px-3 py-2 font-medium">{e.order_no ? `#${e.order_no}` : '—'}</td>
                  <td className="whitespace-nowrap px-3 py-2 text-text-secondary">{fmtDate(e.created_at)}</td>
                  <td className="px-3 py-2">
                    <Pill tone={e.status === 'paid' ? 'dark' : e.unlocked ? 'success' : 'neutral'}>
                      {e.status === 'paid' ? w.statusPaid : e.unlocked ? w.statusUnlocked : w.statusPending}
                    </Pill>
                  </td>
                  <td className="whitespace-nowrap px-3 py-2 text-end font-semibold">{formatCurrency(e.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

/** Tercümanın kendi cüzdanı (server 'wallet' eylemi). */
function WalletSection({ t }: { t: TDict }) {
  const [data, setData] = useState<WalletData | null>(null)
  const [state, setState] = useState<'loading' | 'idle' | 'error'>('loading')
  useEffect(() => {
    translatorApi<WalletData & { error?: string }>('wallet')
      .then((r) => {
        if (r.error) {
          setState('error')
          return
        }
        setData(r)
        setState('idle')
      })
      .catch(() => setState('error'))
  }, [])
  if (state === 'loading') return <p className="py-10 text-center text-sm text-text-secondary">{t.pool.loading}</p>
  if (state === 'error' || !data)
    return <p className="rounded-md border border-danger/40 bg-danger/10 p-4 text-sm text-danger">{t.wallet.loadError}</p>
  return <WalletView t={t} data={data} />
}

interface AdminWalletData {
  summary: { ciro: number; kdv: number; payouts: number; net: number; firmShare: number; count: number }
  orders: Array<{ order_no: number; total: number; payout: number; firmShare: number; completed_at: string; translator: string | null }>
}

/** Admin cüzdanı: tamamlanan siparişlerde firma payı + KDV/tercüman dökümü. */
function AdminWalletSection({ t }: { t: TDict }) {
  const { formatCurrency } = useI18n()
  const [d, setD] = useState<AdminWalletData | null>(null)
  const [state, setState] = useState<'loading' | 'idle' | 'error'>('loading')
  const aw = t.adminWallet
  useEffect(() => {
    translatorApi<AdminWalletData & { error?: string }>('adminWallet')
      .then((r) => {
        if (r.error) {
          setState('error')
          return
        }
        setD(r)
        setState('idle')
      })
      .catch(() => setState('error'))
  }, [])
  if (state === 'loading') return <p className="py-10 text-center text-sm text-text-secondary">{t.pool.loading}</p>
  if (state === 'error' || !d)
    return <p className="rounded-md border border-danger/40 bg-danger/10 p-4 text-sm text-danger">{aw.loadError}</p>
  const s = d.summary
  const fmtDate = (iso: string) => {
    try {
      return new Date(iso).toLocaleDateString()
    } catch {
      return '—'
    }
  }
  return (
    <div className="space-y-4">
      <p className="text-sm text-text-secondary">{aw.count.replace('{n}', String(s.count))}</p>

      <div className="rounded-lg border border-success bg-success/5 p-5">
        <p className="text-xs font-medium text-text-secondary">{aw.firmShare}</p>
        <p className="mt-1 text-3xl font-bold text-success">{formatCurrency(s.firmShare)}</p>
        <p className="mt-1.5 text-xs text-text-muted">{aw.firmShareHint}</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label={aw.ciro} value={formatCurrency(s.ciro)} icon="TrendingUp" />
        <StatCard label={aw.kdv} value={formatCurrency(s.kdv)} icon="Landmark" accent="text-text-muted" />
        <StatCard label={aw.payouts} value={formatCurrency(s.payouts)} icon="Users" accent="text-text-muted" />
        <StatCard label={aw.net} value={formatCurrency(s.net)} icon="Coins" accent="text-success" />
      </div>

      {d.orders.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border bg-surface-muted/40 p-8 text-center text-sm text-text-secondary">{aw.empty}</div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead className="bg-surface-muted text-text-secondary">
              <tr>
                <th className="px-3 py-2 text-start font-medium">{aw.colOrder}</th>
                <th className="px-3 py-2 text-start font-medium">{aw.colTranslator}</th>
                <th className="px-3 py-2 text-start font-medium">{aw.colDate}</th>
                <th className="px-3 py-2 text-end font-medium">{aw.colTotal}</th>
                <th className="px-3 py-2 text-end font-medium">{aw.colPayout}</th>
                <th className="px-3 py-2 text-end font-medium">{aw.colFirm}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {d.orders.map((o, i) => (
                <tr key={i} className="bg-surface">
                  <td className="whitespace-nowrap px-3 py-2 font-medium">#{o.order_no}</td>
                  <td className="px-3 py-2">{o.translator || '—'}</td>
                  <td className="whitespace-nowrap px-3 py-2 text-text-secondary">{fmtDate(o.completed_at)}</td>
                  <td className="whitespace-nowrap px-3 py-2 text-end">{formatCurrency(o.total)}</td>
                  <td className="whitespace-nowrap px-3 py-2 text-end text-text-muted">−{formatCurrency(o.payout)}</td>
                  <td className="whitespace-nowrap px-3 py-2 text-end font-semibold text-success">{formatCurrency(o.firmShare)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

/** Admin: onaylı (aktif) tercüman listesi → tıklayınca admin-özel profil. */
function AdminTranslators({
  t,
  locale,
  openId,
  onOpened,
}: {
  t: TDict
  locale: string
  openId?: string | null
  onOpened?: () => void
}) {
  const [rows, setRows] = useState<Translator[]>([])
  const [state, setState] = useState<'loading' | 'idle' | 'error'>('loading')
  const [selected, setSelected] = useState<Translator | null>(null)
  const [filters, setFilters] = useState<TFilters>(EMPTY_TFILTERS)
  const visible = useMemo(() => rows.filter((r) => matchesTFilters(r, filters)), [rows, filters])

  useEffect(() => {
    supabase
      .from('translators')
      .select('*')
      .eq('status', 'approved')
      .order('full_name', { ascending: true })
      .then(({ data, error }) => {
        if (error) {
          setState('error')
          return
        }
        setRows((data as Translator[]) ?? [])
        setState('idle')
      })
  }, [])

  // Siparişler sayfasından "tercüman adına tıkla → profili aç" (başka sekmeden gelir).
  useEffect(() => {
    if (!openId) return
    const row = rows.find((r) => r.id === openId) ?? ({ id: openId } as Translator)
    setSelected(row)
    onOpened?.()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openId, rows])

  if (selected) return <AdminTranslatorProfile t={t} locale={locale} translator={selected} onBack={() => setSelected(null)} />
  if (state === 'loading') return <p className="py-10 text-center text-sm text-text-secondary">{t.loading}</p>
  if (state === 'error')
    return <p className="rounded-md border border-danger/40 bg-danger/10 p-4 text-sm text-danger">{t.admin.loadError}</p>
  if (rows.length === 0)
    return (
      <div className="rounded-lg border border-dashed border-border bg-surface-muted/40 p-10 text-center">
        <p className="text-sm text-text-secondary">{t.admin.noApproved}</p>
      </div>
    )
  return (
    <div>
      <TranslatorFilters t={t} locale={locale} filters={filters} setFilters={setFilters} count={visible.length} />
      {visible.length === 0 ? (
        <p className="py-10 text-center text-sm text-text-secondary">{t.admin.noMatch}</p>
      ) : (
        <div className="space-y-2">
          {visible.map((r) => (
            <button
              key={r.id}
              type="button"
              onClick={() => setSelected(r)}
              className="flex w-full items-center justify-between gap-3 rounded-lg border border-border bg-surface p-4 text-start transition-colors hover:bg-surface-muted"
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold">{r.full_name || '—'}</span>
                  {r.is_sworn && <Pill tone="primary">{t.admin.swornBadge}</Pill>}
                  <Pill tone={r.iban_verified ? 'success' : 'neutral'}>
                    <Icon name={r.iban_verified ? 'ShieldCheck' : 'Lock'} className="size-3.5" />
                    {r.iban_verified ? t.admin.ibanVerified : t.admin.ibanNotVerified}
                  </Pill>
                </div>
                <p className="mt-1 truncate text-xs text-text-secondary">
                  {[r.city, countryDisplayName(r.country ?? '', locale, r.country ?? '')].filter(Boolean).join(', ')}
                  {(r.language_pairs ?? []).length > 0 && (
                    <>
                      {' · '}
                      {r.language_pairs.map((p) => `${languageName(p.source, locale)}→${languageName(p.target, locale)}`).join(', ')}
                    </>
                  )}
                </p>
              </div>
              <Icon name="ChevronRight" className="size-5 shrink-0 text-text-muted" />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

interface DetailJob {
  order_no: number
  service: string
  source_lang: string
  target_lang: string
  work_status: string
  translator_payout: number | null
  physical_delivery: boolean
  claimed_at: string | null
  completed_at: string | null
  tracking_info: string | null
}
interface DetailData {
  translator: Translator
  jobs: DetailJob[]
  wallet: WalletData
}

/** Admin-özel tercüman profili — TÜM işlemleri izlenir. Tercümanın kendisi GÖRMEZ. */
function AdminTranslatorProfile({
  t,
  locale,
  translator,
  onBack,
}: {
  t: TDict
  locale: string
  translator: Translator
  onBack: () => void
}) {
  const { dict, formatCurrency } = useI18n()
  const areaLabel = (id: string) => (dict.quote.areas as Record<string, string>)[id] ?? id
  const [d, setD] = useState<DetailData | null>(null)
  const [state, setState] = useState<'loading' | 'idle' | 'error'>('loading')
  const [ibanBusy, setIbanBusy] = useState(false)
  const [ibanVerified, setIbanVerified] = useState(!!translator.iban_verified)
  const p = t.admin.profile

  useEffect(() => {
    translatorApi<DetailData & { error?: string }>('translatorDetail', { translatorId: translator.id })
      .then((r) => {
        if (r.error || !r.translator) {
          setState('error')
          return
        }
        setD(r)
        setIbanVerified(!!r.translator.iban_verified)
        setState('idle')
      })
      .catch(() => setState('error'))
  }, [translator.id])

  const toggleIban = async () => {
    setIbanBusy(true)
    const next = !ibanVerified
    const { error } = await supabase.from('translators').update({ iban_verified: next }).eq('id', translator.id)
    setIbanBusy(false)
    if (!error) setIbanVerified(next)
    else alert(t.admin.actionError)
  }

  const back = (
    <button type="button" onClick={onBack} className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-text-secondary hover:text-text-primary">
      <Icon name="ArrowLeft" className="size-4" /> {p.back}
    </button>
  )

  if (state === 'loading')
    return (
      <div>
        {back}
        <p className="py-10 text-center text-sm text-text-secondary">{t.loading}</p>
      </div>
    )
  if (state === 'error' || !d)
    return (
      <div>
        {back}
        <p className="rounded-md border border-danger/40 bg-danger/10 p-4 text-sm text-danger">{t.admin.loadError}</p>
      </div>
    )

  const tr = d.translator
  const statusLabel = (ws: string) => (t.jobs as Record<string, string>)['status_' + ws] ?? ws
  const fmtDate = (iso: string | null) => {
    if (!iso) return '—'
    try {
      return new Date(iso).toLocaleDateString()
    } catch {
      return '—'
    }
  }

  return (
    <div>
      {back}

      <div className="mb-1 flex flex-wrap items-center gap-2">
        <h2 className="text-xl font-bold">{tr.full_name || '—'}</h2>
        {tr.is_sworn && <Pill tone="primary">{t.admin.swornBadge}</Pill>}
        <Pill tone={ibanVerified ? 'success' : 'neutral'}>
          <Icon name={ibanVerified ? 'ShieldCheck' : 'Lock'} className="size-3.5" />
          {ibanVerified ? t.admin.ibanVerified : t.admin.ibanNotVerified}
        </Pill>
      </div>
      <p className="mb-5 text-xs text-text-muted">{p.adminOnly}</p>

      {/* Bilgiler */}
      <div className="rounded-lg border border-border bg-surface p-4">
        <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-text-muted">{p.infoTitle}</h3>
        <dl className="grid gap-2 text-sm sm:grid-cols-2">
          <Detail label={t.form.phone}>{tr.phone ? <span dir="ltr">{tr.phone}</span> : '—'}</Detail>
          <Detail label={t.form.birthDate}>{tr.birth_date || '—'}</Detail>
          <Detail label={t.admin.colLocation}>
            {[tr.city, countryDisplayName(tr.country ?? '', locale, tr.country ?? '')].filter(Boolean).join(', ') || '—'}
          </Detail>
          <Detail label={t.admin.colLangs}>
            {(tr.language_pairs ?? []).length === 0
              ? '—'
              : tr.language_pairs.map((pp) => `${languageName(pp.source, locale)}→${languageName(pp.target, locale)}`).join(', ')}
          </Detail>
          <Detail label={t.admin.colExpertise}>
            {(tr.expertise ?? []).length === 0 ? '—' : tr.expertise.map((k) => areaLabel(k)).join(', ')}
          </Detail>
          <Detail label={t.form.iban}>{tr.iban ? <span dir="ltr">{tr.iban}</span> : '—'}</Detail>
          {tr.iban_name && <Detail label={t.form.ibanName}>{tr.iban_name}</Detail>}
          <Detail label={t.form.address}>{tr.address || '—'}</Detail>
        </dl>
        <div className="mt-3 border-t border-border pt-3">
          <Button type="button" intent="outline" size="sm" disabled={ibanBusy} onClick={toggleIban}>
            {ibanVerified ? t.admin.unverifyIban : t.admin.verifyIban}
          </Button>
        </div>
      </div>

      {/* Cüzdan */}
      <div className="mt-6">
        <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-text-muted">{p.walletTitle}</h3>
        <WalletView t={t} data={d.wallet} />
      </div>

      {/* İşler */}
      <div className="mt-6">
        <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-text-muted">{p.jobsTitle}</h3>
        {d.jobs.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border bg-surface-muted/40 p-8 text-center text-sm text-text-secondary">{p.noJobs}</div>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full text-sm">
              <thead className="bg-surface-muted text-text-secondary">
                <tr>
                  <th className="px-3 py-2 text-start font-medium">{t.wallet.entryOrder}</th>
                  <th className="px-3 py-2 text-start font-medium">{t.pool.langPair}</th>
                  <th className="px-3 py-2 text-start font-medium">{t.jobs.statusLabel}</th>
                  <th className="px-3 py-2 text-start font-medium">{t.wallet.date}</th>
                  <th className="px-3 py-2 text-end font-medium">{t.pool.earning}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {d.jobs.map((j, i) => (
                  <tr key={i} className="bg-surface">
                    <td className="whitespace-nowrap px-3 py-2 font-medium">#{j.order_no}</td>
                    <td className="whitespace-nowrap px-3 py-2">{languageName(j.source_lang, locale)}→{languageName(j.target_lang, locale)}</td>
                    <td className="px-3 py-2">{statusLabel(j.work_status)}</td>
                    <td className="whitespace-nowrap px-3 py-2 text-text-secondary">{fmtDate(j.completed_at ?? j.claimed_at)}</td>
                    <td className="whitespace-nowrap px-3 py-2 text-end font-semibold">{formatCurrency(Number(j.translator_payout) || 0)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Admin: Siparişler sayfası (tüm siparişler + filtre + tercüman linki) */
/* ------------------------------------------------------------------ */

interface AdminOrderRow {
  id: string
  order_no: number
  status: string
  work_status: string | null
  created_at: string
  completed_at: string | null
  delivery_days: number | null
  contact_name: string | null
  service: string
  source_lang: string
  target_lang: string
  physical_delivery: boolean
  urgent: boolean
  total: number | null
  translator_id: string | null
  translatorName: string | null
}

function AdminOrders({
  t,
  locale,
  onOpenTranslator,
}: {
  t: TDict
  locale: string
  onOpenTranslator: (id: string) => void
}) {
  const { dict, formatCurrency } = useI18n()
  const serviceName = (s: string) => (dict.quote.areas as Record<string, string>)[s] ?? s
  const [rows, setRows] = useState<AdminOrderRow[]>([])
  const [state, setState] = useState<'loading' | 'idle' | 'error'>('loading')
  const [q, setQ] = useState('')
  const o = t.admin.orders

  useEffect(() => {
    translatorApi<{ orders?: AdminOrderRow[]; error?: string }>('adminOrders')
      .then((r) => {
        if (r.error) {
          setState('error')
          return
        }
        setRows(r.orders ?? [])
        setState('idle')
      })
      .catch(() => setState('error'))
  }, [])

  const isDone = (r: AdminOrderRow) => r.work_status === 'completed'
  // Tamamlanmayanlar üstte (en yeni→en eski), tamamlananlar altta (en yeni tamamlanan→en eski).
  const sorted = useMemo(() => {
    const inc = rows.filter((r) => !isDone(r)).sort((a, b) => b.created_at.localeCompare(a.created_at))
    const done = rows.filter(isDone).sort((a, b) => (b.completed_at ?? '').localeCompare(a.completed_at ?? ''))
    return [...inc, ...done]
  }, [rows])
  const filtered = useMemo(() => {
    const s = norm(q)
    if (!s) return sorted
    return sorted.filter((r) => String(r.order_no).includes(s) || norm(r.contact_name ?? '').includes(s))
  }, [sorted, q])

  const statusLabel = (r: AdminOrderRow): string => {
    if (r.status === 'cancelled') return o.statusCancelled
    switch (r.work_status) {
      case 'claimed':
        return o.statusClaimed
      case 'submitted':
        return o.statusSubmitted
      case 'approved':
        return o.statusApproved
      case 'completed':
        return o.statusCompleted
      default:
        return o.statusAvailable
    }
  }
  const deadline = (r: AdminOrderRow): string => {
    try {
      const d = new Date(r.created_at)
      d.setDate(d.getDate() + (r.delivery_days || 1) + (r.physical_delivery ? 2 : 0))
      return d.toLocaleDateString(locale)
    } catch {
      return '—'
    }
  }
  const fmtDate = (iso: string | null) => {
    if (!iso) return '—'
    try {
      return new Date(iso).toLocaleDateString(locale)
    } catch {
      return '—'
    }
  }

  if (state === 'loading') return <p className="py-10 text-center text-sm text-text-secondary">{t.loading}</p>
  if (state === 'error')
    return <p className="rounded-md border border-danger/40 bg-danger/10 p-4 text-sm text-danger">{o.loadError}</p>

  return (
    <div>
      <div className="relative mb-4">
        <Icon name="FileText" className="pointer-events-none absolute inset-y-0 start-3 my-auto size-4 text-text-muted" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={o.searchPlaceholder} className={cn(inputClass, 'ps-9')} />
      </div>
      <p className="mb-3 text-xs text-text-secondary">{o.results.replace('{n}', String(filtered.length))}</p>

      {filtered.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border bg-surface-muted/40 p-10 text-center">
          <p className="text-sm text-text-secondary">{rows.length === 0 ? o.empty : t.admin.noMatch}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((r) => (
            <article key={r.id} className="rounded-lg border border-border bg-surface p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-semibold">{t.pool.orderNo} #{r.order_no}</h3>
                  {r.urgent && <Pill tone="danger">{t.pool.urgent}</Pill>}
                  {r.physical_delivery ? <Pill tone="dark">{t.pool.cargo}</Pill> : <Pill tone="outline">{t.pool.digital}</Pill>}
                </div>
                <Pill tone={isDone(r) ? 'success' : 'neutral'}>{isDone(r) ? o.done : o.inProgress}</Pill>
              </div>

              <dl className="mt-3 grid gap-x-4 gap-y-2 text-sm sm:grid-cols-2">
                <Row label={t.pool.service}>{serviceName(r.service)}</Row>
                <Row label={t.pool.langPair}>
                  {languageName(r.source_lang, locale)} → {languageName(r.target_lang, locale)}
                </Row>
                <Row label={o.customer}>{r.contact_name || '—'}</Row>
                <Row label={o.translator}>
                  {r.translator_id ? (
                    <button
                      type="button"
                      onClick={() => onOpenTranslator(r.translator_id as string)}
                      className="inline-flex items-center gap-1 font-medium text-secondary underline underline-offset-2 hover:opacity-80"
                    >
                      {r.translatorName || '—'} <Icon name="ArrowRight" className="size-3.5" />
                    </button>
                  ) : (
                    <span className="text-text-muted">{o.unassigned}</span>
                  )}
                </Row>
                <Row label={o.status}>{statusLabel(r)}</Row>
                <Row label={t.pool.deadline}>{deadline(r)}</Row>
                {isDone(r) && <Row label={o.completedOn}>{fmtDate(r.completed_at)}</Row>}
                <Row label={o.placedOn}>{fmtDate(r.created_at)}</Row>
                {r.total != null && <Row label={o.total}>{formatCurrency(r.total)}</Row>}
              </dl>
            </article>
          ))}
        </div>
      )}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Admin: IBAN onayları — iban_verified=false onaylı tercümanlar         */
/* ------------------------------------------------------------------ */

function AdminIbanApprovals({ t }: { t: TDict }) {
  const [rows, setRows] = useState<Translator[]>([])
  const [state, setState] = useState<'loading' | 'idle' | 'error'>('loading')
  const [busyId, setBusyId] = useState<string | null>(null)

  const load = () => {
    setState('loading')
    supabase
      .from('translators')
      .select('*')
      .eq('status', 'approved')
      .eq('iban_verified', false)
      .order('updated_at', { ascending: false })
      .then(({ data, error }) => {
        if (error) {
          setState('error')
          return
        }
        // Yalnızca IBAN GİRMİŞ olanlar (boş IBAN = onaylanacak bir şey yok).
        setRows(((data as Translator[]) ?? []).filter((r) => (r.iban ?? '').trim() !== ''))
        setState('idle')
      })
  }
  useEffect(load, [])

  const act = async (id: string, patch: Partial<Translator>) => {
    setBusyId(id)
    const { error } = await supabase.from('translators').update(patch).eq('id', id)
    setBusyId(null)
    if (!error) setRows((prev) => prev.filter((r) => r.id !== id))
    else alert(t.admin.actionError)
  }

  if (state === 'loading') return <p className="py-10 text-center text-sm text-text-secondary">{t.loading}</p>
  if (state === 'error')
    return <p className="rounded-md border border-danger/40 bg-danger/10 p-4 text-sm text-danger">{t.admin.loadError}</p>
  if (rows.length === 0)
    return (
      <div className="rounded-lg border border-dashed border-border bg-surface-muted/40 p-10 text-center">
        <p className="text-sm text-text-secondary">{t.admin.noIbanPending}</p>
      </div>
    )
  return (
    <div className="space-y-3">
      <p className="text-sm text-text-secondary">{t.admin.ibanHint}</p>
      {rows.map((r) => (
        <article key={r.id} className="rounded-lg border border-border bg-surface p-4">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-semibold">{r.full_name || '—'}</h3>
            {r.was_approved && <Pill tone="dark">{t.admin.returningBadge}</Pill>}
          </div>
          <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
            <Detail label={t.form.iban}><span dir="ltr" className="font-mono">{r.iban}</span></Detail>
            <Detail label={t.form.ibanName}>{r.iban_name || '—'}</Detail>
          </dl>
          <div className="mt-3 flex flex-wrap gap-2 border-t border-border pt-3">
            <Button type="button" intent="secondary" size="sm" disabled={busyId === r.id} onClick={() => act(r.id, { iban_verified: true })}>
              {t.admin.ibanApprove}
            </Button>
            <Button type="button" intent="outline" size="sm" disabled={busyId === r.id} onClick={() => act(r.id, { iban: null, iban_name: null })}>
              {t.admin.reject}
            </Button>
          </div>
        </article>
      ))}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Admin: Ödemeler — bakiyesi olan tercümanlar, dekontlu manuel ödeme    */
/* ------------------------------------------------------------------ */

interface PaymentRow {
  translatorId: string
  name: string | null
  iban: string | null
  iban_name: string | null
  amount: number
}

function AdminPayments({ t }: { t: TDict }) {
  const { formatCurrency } = useI18n()
  const [rows, setRows] = useState<PaymentRow[]>([])
  const [state, setState] = useState<'loading' | 'idle' | 'error'>('loading')
  const [receipts, setReceipts] = useState<Record<string, string>>({}) // translatorId → yüklenen dekont yolu
  const [uploadingId, setUploadingId] = useState<string | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  useEffect(() => {
    translatorApi<{ payments?: PaymentRow[]; error?: string }>('adminPayments')
      .then((r) => {
        if (r.error) {
          setState('error')
          return
        }
        setRows(r.payments ?? [])
        setState('idle')
      })
      .catch(() => setState('error'))
  }, [])

  const upload = async (translatorId: string, file: File) => {
    setUploadingId(translatorId)
    const path = `${translatorId}/${Date.now()}-dekont.pdf`
    const { error } = await supabase.storage
      .from('receipts')
      .upload(path, file, { upsert: true, contentType: file.type || 'application/pdf' })
    setUploadingId(null)
    if (!error) setReceipts((prev) => ({ ...prev, [translatorId]: path }))
    else alert(t.admin.actionError)
  }

  const pay = async (translatorId: string) => {
    const receiptPath = receipts[translatorId]
    if (!receiptPath) return
    setBusyId(translatorId)
    setNotice(null)
    const r = await translatorApi<{ ok?: boolean; error?: string }>('payTranslator', { translatorId, receiptPath })
    setBusyId(null)
    if (r.ok) {
      setRows((prev) => prev.filter((x) => x.translatorId !== translatorId))
      setNotice(t.admin.paid)
    } else {
      setNotice(t.admin.actionError)
    }
  }

  if (state === 'loading') return <p className="py-10 text-center text-sm text-text-secondary">{t.loading}</p>
  if (state === 'error')
    return <p className="rounded-md border border-danger/40 bg-danger/10 p-4 text-sm text-danger">{t.admin.loadError}</p>

  return (
    <div className="space-y-3">
      <p className="rounded-md border border-border bg-surface-muted/50 p-3 text-sm text-text-secondary">{t.admin.paymentsHint}</p>
      {notice && <p className="rounded-md border border-success/40 bg-success/10 p-3 text-sm text-success">{notice}</p>}
      {rows.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border bg-surface-muted/40 p-10 text-center">
          <p className="text-sm text-text-secondary">{t.admin.noPayments}</p>
        </div>
      ) : (
        rows.map((r) => (
          <article key={r.translatorId} className="rounded-lg border border-border bg-surface p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h3 className="font-semibold">{r.name || '—'}</h3>
                <dl className="mt-2 grid gap-1.5 text-sm">
                  <Detail label={t.form.iban}><span dir="ltr" className="font-mono">{r.iban || '—'}</span></Detail>
                  {r.iban_name && <Detail label={t.form.ibanName}>{r.iban_name}</Detail>}
                </dl>
              </div>
              <div className="text-end">
                <p className="text-xs text-text-secondary">{t.admin.paymentAmount}</p>
                <span className="inline-flex items-center rounded-lg border border-success bg-success px-3 py-1.5 text-lg font-bold text-white">
                  {formatCurrency(r.amount)}
                </span>
              </div>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-border pt-3">
              <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-md border border-border bg-surface px-3 py-1.5 text-sm font-medium hover:bg-surface-muted">
                <input
                  type="file"
                  accept="application/pdf"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0]
                    if (f) upload(r.translatorId, f)
                  }}
                />
                <Icon name="Upload" className="size-4" />
                {uploadingId === r.translatorId ? t.admin.uploading : receipts[r.translatorId] ? t.admin.receiptUploaded : t.admin.uploadReceipt}
              </label>
              <Button
                type="button"
                intent="secondary"
                size="sm"
                disabled={!receipts[r.translatorId] || busyId === r.translatorId}
                onClick={() => pay(r.translatorId)}
              >
                {busyId === r.translatorId ? t.admin.uploading : t.admin.markPaid}
              </Button>
              {!receipts[r.translatorId] && <span className="text-xs text-text-muted">{t.admin.receiptRequired}</span>}
            </div>
          </article>
        ))
      )}
    </div>
  )
}

/** dict.translator tipini kısaltmak için. */
type TDict = ReturnType<typeof useI18n>['dict']['translator']

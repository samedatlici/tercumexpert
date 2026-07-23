import { useState, type FormEvent, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { useI18n } from '@/hooks/useI18n'
import { useAuth } from '@/app/providers/AuthProvider'
import { usePartner } from '@/features/partner/model/usePartner'
import { partnerApi } from '@/features/partner/model/api'
import type { Partner } from '@/features/partner/model/types'
import { supabase } from '@/lib/supabase'
import { cn } from '@/lib/cn'
import { buildPath } from '@/app/router/routes'
import { Button } from '@/components/common/Button'
import { Icon, type IconName } from '@/components/common/Icon'
import { Seo } from '@/components/seo/Seo'
import { PhoneInput } from '@/components/common/PhoneInput'
import { CountryCitySelect } from '@/components/common/CountryCitySelect'
import { ConsentText } from '@/features/legal/ConsentText'
import { defaultCountryForLocale } from '@/app/config/country-codes'

const inputClass =
  'h-11 w-full rounded-md border border-border bg-surface px-3 text-base outline-none focus:border-border-strong'
const textareaClass =
  'min-h-[80px] w-full rounded-md border border-border bg-surface px-3 py-2 text-base outline-none focus:border-border-strong'
const labelClass = 'mb-1.5 block text-sm font-medium'

export default function PartnerPanelPage() {
  const { locale, dict } = useI18n()
  const pp = dict.partnerPanel
  const { user, loading: authLoading } = useAuth()
  const { loading, partner, error, refetch } = usePartner()
  const [reapplying, setReapplying] = useState(false)
  const [canceling, setCanceling] = useState(false)

  const cancelApplication = async () => {
    if (!partner) return
    setCanceling(true)
    await supabase.from('partners').delete().eq('id', partner.id)
    setCanceling(false)
    setReapplying(false)
    refetch()
  }

  const body = (): ReactNode => {
    if (authLoading || loading) {
      return <p className="py-16 text-center text-sm text-text-secondary">{pp.loading}</p>
    }
    if (!user) {
      return (
        <Center icon="Lock" title={pp.loginTitle} desc={pp.loginDesc}>
          <Link to={`${buildPath(locale, 'auth')}?next=${encodeURIComponent(window.location.pathname)}`}>
            <Button intent="secondary" block>{pp.login}</Button>
          </Link>
        </Center>
      )
    }
    if (error === 'table') {
      return <Center icon="Lock" title={pp.setupTitle} desc={pp.setupDesc} />
    }
    if (partner?.status === 'approved') {
      return <PartnerPanel partner={partner} onSaved={refetch} />
    }
    if (partner?.status === 'pending') {
      return (
        <div className="mx-auto max-w-md space-y-5">
          <Center icon="Clock" title={pp.pendingTitle} desc={pp.pendingDesc}>
            <Button intent="outline" block onClick={cancelApplication} disabled={canceling}>
              {canceling ? pp.submitting : pp.cancelApplication}
            </Button>
          </Center>
          {!partner.email_verified && <EmailVerify partner={partner} onVerified={refetch} />}
        </div>
      )
    }
    if (partner?.status === 'rejected' && !reapplying) {
      return (
        <Center icon="X" title={pp.rejectedTitle} desc={pp.rejectedDesc}>
          <Button intent="secondary" block onClick={() => setReapplying(true)}>{pp.reapply}</Button>
        </Center>
      )
    }
    return (
      <ApplicationForm
        userId={user.id}
        defaultEmail={user.email ?? ''}
        existingId={partner?.status === 'rejected' ? partner.id : undefined}
        onDone={() => {
          setReapplying(false)
          refetch()
        }}
      />
    )
  }

  return (
    <>
      <Seo title={pp.seoTitle} description={pp.seoDesc} routeId="partnerPanel" noindex />
      <section className="section">
        <div className="mx-auto w-full max-w-5xl px-4 sm:px-6">{body()}</div>
      </section>
    </>
  )
}

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

/* ------------------------------------------------------------------ */
/* Onaylı partner — Faz 2a: sekmeli panel (Profilim tam; diğerleri yakında) */
type PTab = 'profile' | 'customers' | 'ordersNew' | 'ordersActive' | 'ordersDelivery' | 'ordersDone' | 'wallet'
const P_TABS: { key: PTab; icon: IconName }[] = [
  { key: 'profile', icon: 'QrCode' },
  { key: 'customers', icon: 'Users' },
  { key: 'ordersNew', icon: 'FileText' },
  { key: 'ordersActive', icon: 'Cog' },
  { key: 'ordersDelivery', icon: 'Clock' },
  { key: 'ordersDone', icon: 'PackageCheck' },
  { key: 'wallet', icon: 'Wallet' },
]

function PartnerPanel({ partner, onSaved }: { partner: Partner; onSaved: () => void }) {
  const { dict } = useI18n()
  const pp = dict.partnerPanel
  const [tab, setTab] = useState<PTab>('profile')
  const tabLabel: Record<PTab, string> = {
    profile: pp.tabProfile,
    customers: pp.tabCustomers,
    ordersNew: pp.tabOrdersNew,
    ordersActive: pp.tabOrdersActive,
    ordersDelivery: pp.tabOrdersDelivery,
    ordersDone: pp.tabOrdersDone,
    wallet: pp.tabWallet,
  }

  return (
    <div>
      <h1 className="mb-1 text-2xl font-bold">{pp.panelTitle}</h1>
      <p className="mb-5 text-sm text-text-secondary">{partner.company || partner.contact_name}</p>

      <div className="mb-6 flex flex-wrap gap-2">
        {P_TABS.map((x) => (
          <button
            key={x.key}
            type="button"
            onClick={() => setTab(x.key)}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors',
              tab === x.key ? 'border-secondary bg-secondary text-secondary-foreground' : 'border-border bg-surface text-text-secondary hover:bg-surface-muted',
            )}
          >
            <Icon name={x.icon} className="size-4" /> {tabLabel[x.key]}
          </button>
        ))}
      </div>

      {tab === 'profile' ? (
        <ProfileTab partner={partner} onSaved={onSaved} />
      ) : (
        <div className="rounded-lg border border-dashed border-border bg-surface-muted/40 p-10 text-center">
          <p className="text-sm text-text-secondary">{pp.soon}</p>
        </div>
      )}
    </div>
  )
}

/* Davet kodu + bağlantı — kopyalanabilir, düzenlenemez (kaybolmasın). */
function InviteBox({ partner }: { partner: Partner }) {
  const { locale, dict } = useI18n()
  const pp = dict.partnerPanel
  const [copied, setCopied] = useState<'code' | 'link' | null>(null)

  const origin = typeof window !== 'undefined' ? window.location.origin : ''
  const homePath = buildPath(locale, 'home')
  const link = `${origin}${homePath}${homePath.endsWith('/') ? '' : '/'}?ref=${partner.ref_code}`.replace(/\/\?/, '?')

  const copy = async (what: 'code' | 'link', value: string) => {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(what)
      setTimeout(() => setCopied(null), 2000)
    } catch {
      /* pano yoksa yok say */
    }
  }

  return (
    <div className="rounded-lg border border-border bg-surface p-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <p className="text-sm font-semibold">{pp.refCodeLabel}</p>
          <div className="mt-2 flex items-center gap-2">
            <span className="rounded-md border border-border bg-surface-muted px-3 py-2 font-mono text-lg font-bold tracking-[0.15em]">
              {partner.ref_code}
            </span>
            <Button type="button" intent="outline" size="sm" onClick={() => copy('code', partner.ref_code)} className="shrink-0">
              {copied === 'code' ? pp.refCopied : pp.refCopy}
            </Button>
          </div>
        </div>
        <div>
          <p className="text-sm font-semibold">{pp.refTitle}</p>
          <p className="mt-0.5 text-xs text-text-secondary">{pp.refDesc}</p>
        </div>
      </div>
      <div className="mt-3 flex flex-col gap-2 sm:flex-row">
        <input
          readOnly
          value={link}
          onFocus={(e) => e.currentTarget.select()}
          className={`${inputClass} font-mono text-sm`}
          aria-label={pp.refTitle}
        />
        <Button type="button" intent="secondary" onClick={() => copy('link', link)} className="shrink-0">
          {copied === 'link' ? pp.refCopied : pp.refCopy}
        </Button>
      </div>
    </div>
  )
}

/* Profilim — davet kodu/link en üstte + zorunlu alanlar + IBAN + e-posta doğrulama. */
function ProfileTab({ partner, onSaved }: { partner: Partner; onSaved: () => void }) {
  const { locale, dict } = useI18n()
  const pp = dict.partnerPanel
  const pf = dict.partnership.form
  const tf = dict.translator.form
  const sectors = dict.partnership.sectors.items
  const otherLabel = pf.sectorOptions[pf.sectorOptions.length - 1]

  const [company, setCompany] = useState(partner.company ?? '')
  const [sector, setSector] = useState(partner.sector ?? '')
  const [sectorOther, setSectorOther] = useState(partner.sector_other ?? '')
  const [contactName, setContactName] = useState(partner.contact_name ?? '')
  const [titleRole, setTitleRole] = useState(partner.title_role ?? '')
  const [phone, setPhone] = useState(partner.phone ?? '')
  const [country, setCountry] = useState(partner.country ?? '')
  const [city, setCity] = useState(partner.city ?? '')
  const [address, setAddress] = useState(partner.address ?? '')
  const [iban, setIban] = useState(partner.iban ?? '')
  const [ibanName, setIbanName] = useState(partner.iban_name ?? '')
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<'ok' | 'err' | null>(null)

  const save = async (e: FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setMsg(null)
    const { error } = await supabase
      .from('partners')
      .update({
        company: company.trim() || null,
        sector: sector || null,
        sector_other: sector === 'other' ? sectorOther.trim() : null,
        contact_name: contactName.trim() || null,
        title_role: titleRole.trim() || null,
        phone: phone.trim() || null,
        country: country || null,
        city: city || null,
        address: address.trim() || null,
        iban: iban.trim() || null,
        iban_name: ibanName.trim() || null,
      })
      .eq('id', partner.id)
    setBusy(false)
    setMsg(error ? 'err' : 'ok')
    if (!error) onSaved()
  }

  return (
    <div className="space-y-5">
      <InviteBox partner={partner} />

      {!partner.email_verified && <EmailVerify partner={partner} onVerified={onSaved} />}

      <form onSubmit={save} className="space-y-4 rounded-lg border border-border bg-surface p-6">
        <div className="flex flex-wrap items-center gap-2">
          <Pill tone="success">
            <Icon name="CircleCheck" className="size-3.5" /> {pp.statusApproved}
          </Pill>
          {partner.email_verified && (
            <Pill tone="success">
              <Icon name="CircleCheck" className="size-3.5" /> {pp.verifiedLabel}
            </Pill>
          )}
          <Pill tone={partner.iban_verified ? 'success' : 'neutral'}>
            <Icon name={partner.iban_verified ? 'ShieldCheck' : 'Lock'} className="size-3.5" />
            {partner.iban_verified ? pp.ibanVerified : pp.ibanNotVerified}
          </Pill>
        </div>

        {!iban.trim() && (
          <div className="flex items-start gap-2 rounded-md border border-secondary/30 bg-surface-muted p-3 text-sm">
            <Icon name="Wallet" className="mt-0.5 size-4 shrink-0 text-text-secondary" />
            <p>{pp.ibanReminder}</p>
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={labelClass}>{pf.fields.company}</label>
            <input className={inputClass} value={company} onChange={(e) => setCompany(e.target.value)} autoComplete="organization" />
          </div>
          <div>
            <label className={labelClass}>{pf.fields.sector}</label>
            <select className={inputClass} value={sector} onChange={(e) => setSector(e.target.value)}>
              <option value="" disabled>{pf.sectorPlaceholder}</option>
              {sectors.map((s) => (
                <option key={s.key} value={s.key}>{s.title}</option>
              ))}
              <option value="other">{otherLabel}</option>
            </select>
          </div>
        </div>
        {sector === 'other' && (
          <div>
            <label className={labelClass}>{pf.fields.sector}</label>
            <input className={inputClass} value={sectorOther} onChange={(e) => setSectorOther(e.target.value)} placeholder={pp.sectorOther} />
          </div>
        )}
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={labelClass}>{pf.fields.contactName}</label>
            <input className={inputClass} value={contactName} onChange={(e) => setContactName(e.target.value)} autoComplete="name" />
          </div>
          <div>
            <label className={labelClass}>{pf.fields.titleRole}</label>
            <input className={inputClass} value={titleRole} onChange={(e) => setTitleRole(e.target.value)} />
          </div>
        </div>
        <div>
          <label className={labelClass}>{pf.fields.email}</label>
          <input className={`${inputClass} cursor-not-allowed bg-surface-muted text-text-muted`} value={partner.email ?? ''} disabled dir="ltr" />
        </div>
        <div>
          <label className={labelClass}>{pf.fields.phone}</label>
          <PhoneInput onChange={setPhone} />
          {partner.phone && <p className="mt-1 text-xs text-text-muted" dir="ltr">{partner.phone}</p>}
        </div>
        <CountryCitySelect
          country={country}
          city={city}
          onCountry={setCountry}
          onCity={setCity}
          countryLabel={tf.country}
          cityLabel={tf.city}
          countryPlaceholder={tf.selectCountry}
          cityPlaceholder={tf.selectCity}
          cityDisabledPlaceholder={tf.cityNeedsCountry}
          selectClassName={inputClass}
        />
        <div>
          <label className={labelClass}>{tf.address}</label>
          <textarea rows={2} className={textareaClass} value={address} onChange={(e) => setAddress(e.target.value)} autoComplete="street-address" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={labelClass}>{tf.iban}</label>
            <input className={inputClass} value={iban} onChange={(e) => setIban(e.target.value)} dir="ltr" />
          </div>
          <div>
            <label className={labelClass}>{tf.ibanName}</label>
            <input className={inputClass} value={ibanName} onChange={(e) => setIbanName(e.target.value)} />
          </div>
        </div>
        {msg === 'ok' && <p className="text-sm text-success">{pp.saved}</p>}
        {msg === 'err' && <p className="text-sm text-danger">{pp.saveError}</p>}
        <Button type="submit" intent="secondary" size="lg" disabled={busy}>
          {busy ? pp.submitting : pp.save}
        </Button>
      </form>
    </div>
  )
}

/* Dolgulu rozet (translator paneliyle aynı). */
type PillTone = 'success' | 'neutral'
const PILL_TONE: Record<PillTone, string> = {
  success: 'border border-success bg-success text-white',
  neutral: 'border-2 border-border-strong bg-surface-muted text-text-secondary',
}
function Pill({ tone, children }: { tone: PillTone; children: ReactNode }) {
  return (
    <span className={cn('inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold', PILL_TONE[tone])}>
      {children}
    </span>
  )
}

/* ------------------------------------------------------------------ */
/* E-posta doğrulama widget'ı */
function EmailVerify({ partner, onVerified }: { partner: Partner; onVerified: () => void }) {
  const { locale, dict } = useI18n()
  const pp = dict.partnerPanel
  const [phase, setPhase] = useState<'idle' | 'sending' | 'sent' | 'verifying'>('idle')
  const [code, setCode] = useState('')
  const [err, setErr] = useState<string | null>(null)

  const send = async () => {
    setErr(null)
    setPhase('sending')
    const r = await partnerApi<{ ok?: boolean }>('emailSendCode', { locale, email: partner.email ?? undefined })
    setPhase(r?.ok ? 'sent' : 'idle')
    if (!r?.ok) setErr(pp.verifyError)
  }

  const verify = async (e: FormEvent) => {
    e.preventDefault()
    if (code.trim().length < 4) return
    setErr(null)
    setPhase('verifying')
    const r = await partnerApi<{ ok?: boolean }>('emailVerify', { code: code.trim() })
    if (r?.ok) {
      onVerified()
    } else {
      setErr(pp.verifyError)
      setPhase('sent')
    }
  }

  return (
    <div className="rounded-lg border border-border bg-surface p-6">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 inline-flex size-9 shrink-0 items-center justify-center rounded-full bg-surface-muted text-text-secondary">
          <Icon name="Mail" className="size-4.5" />
        </span>
        <div className="flex-1">
          <h2 className="text-base font-semibold">{pp.verifyTitle}</h2>
          <p className="mt-1 text-sm text-text-secondary">{pp.verifyDesc}</p>

          {phase === 'idle' || phase === 'sending' ? (
            <Button type="button" intent="secondary" onClick={send} disabled={phase === 'sending'} className="mt-4">
              {phase === 'sending' ? pp.sending : pp.sendCode}
            </Button>
          ) : (
            <form onSubmit={verify} className="mt-4 space-y-3">
              <p className="text-sm text-success">{pp.codeSent}</p>
              <div className="flex flex-col gap-2 sm:flex-row">
                <input
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder={pp.codePlaceholder}
                  className={`${inputClass} tracking-[0.3em]`}
                />
                <Button type="submit" intent="secondary" disabled={phase === 'verifying'} className="shrink-0">
                  {phase === 'verifying' ? pp.verifying : pp.verifyBtn}
                </Button>
              </div>
              <button type="button" onClick={send} className="text-xs text-text-muted underline underline-offset-2 hover:text-text-secondary">
                {pp.sendCode}
              </button>
            </form>
          )}
          {err && <p className="mt-2 text-sm text-danger">{err}</p>}
        </div>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Başvuru formu — partnership.form etiketlerini yeniden kullanır */
function ApplicationForm({
  userId,
  defaultEmail,
  existingId,
  onDone,
}: {
  userId: string
  defaultEmail: string
  existingId?: string
  onDone: () => void
}) {
  const { locale, dict } = useI18n()
  const pp = dict.partnerPanel
  const pf = dict.partnership.form
  const tf = dict.translator.form
  const sectors = dict.partnership.sectors.items
  const otherLabel = pf.sectorOptions[pf.sectorOptions.length - 1]

  const [company, setCompany] = useState('')
  const [sector, setSector] = useState('')
  const [sectorOther, setSectorOther] = useState('')
  const [contactName, setContactName] = useState('')
  const [titleRole, setTitleRole] = useState('')
  const [email, setEmail] = useState(defaultEmail)
  const [phone, setPhone] = useState('')
  const [country, setCountry] = useState(() => defaultCountryForLocale(locale))
  const [city, setCity] = useState('')
  const [address, setAddress] = useState('')
  const [potential, setPotential] = useState(pf.potentialOptions[0] ?? '')
  const [note, setNote] = useState('')
  const [agree, setAgree] = useState(false)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    const emailOk = /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim())
    if (
      !company.trim() || !sector || !contactName.trim() || !emailOk || phone.trim().length < 7 ||
      !country || !city || !agree || (sector === 'other' && !sectorOther.trim())
    ) {
      setErr(pp.saveError)
      return
    }
    setErr(null)
    setBusy(true)
    const payload = {
      company: company.trim(),
      sector,
      sector_other: sector === 'other' ? sectorOther.trim() : null,
      contact_name: contactName.trim(),
      title_role: titleRole.trim() || null,
      email: email.trim(),
      phone: phone.trim() || null,
      country: country || null,
      city: city || null,
      address: address.trim() || null,
      potential: potential || null,
      note: note.trim() || null,
    }
    const { error } = existingId
      ? await supabase.from('partners').update({ ...payload, status: 'pending' }).eq('id', existingId)
      : await supabase.from('partners').insert({ user_id: userId, ...payload })
    setBusy(false)
    if (error) {
      setErr(pp.saveError)
      return
    }
    onDone()
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-bold">{pp.applyTitle}</h1>
        <p className="mt-2 text-text-secondary">{pp.applyDesc}</p>
      </div>
      <form onSubmit={submit} className="space-y-4 rounded-lg border border-border bg-surface p-6 sm:p-8" noValidate>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={labelClass}>{pf.fields.company} <span className="text-danger">*</span></label>
            <input className={inputClass} value={company} onChange={(e) => setCompany(e.target.value)} autoComplete="organization" />
          </div>
          <div>
            <label className={labelClass}>{pf.fields.sector} <span className="text-danger">*</span></label>
            <select className={inputClass} value={sector} onChange={(e) => setSector(e.target.value)}>
              <option value="" disabled>{pf.sectorPlaceholder}</option>
              {sectors.map((s) => (
                <option key={s.key} value={s.key}>{s.title}</option>
              ))}
              <option value="other">{otherLabel}</option>
            </select>
          </div>
        </div>
        {sector === 'other' && (
          <div>
            <label className={labelClass}>{pf.fields.sector} <span className="text-danger">*</span></label>
            <input className={inputClass} value={sectorOther} onChange={(e) => setSectorOther(e.target.value)} placeholder={pp.sectorOther} />
          </div>
        )}
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={labelClass}>{pf.fields.contactName} <span className="text-danger">*</span></label>
            <input className={inputClass} value={contactName} onChange={(e) => setContactName(e.target.value)} autoComplete="name" />
          </div>
          <div>
            <label className={labelClass}>{pf.fields.titleRole}</label>
            <input className={inputClass} value={titleRole} onChange={(e) => setTitleRole(e.target.value)} />
          </div>
          <div>
            <label className={labelClass}>{pf.fields.email} <span className="text-danger">*</span></label>
            <input type="email" className={inputClass} value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
          </div>
          <div>
            <label className={labelClass}>{pf.fields.phone} <span className="text-danger">*</span></label>
            <PhoneInput onChange={setPhone} />
          </div>
        </div>
        <CountryCitySelect
          country={country}
          city={city}
          onCountry={setCountry}
          onCity={setCity}
          countryLabel={tf.country}
          cityLabel={tf.city}
          countryPlaceholder={tf.selectCountry}
          cityPlaceholder={tf.selectCity}
          cityDisabledPlaceholder={tf.cityNeedsCountry}
          selectClassName={inputClass}
        />
        <div>
          <label className={labelClass}>{tf.address ?? pf.fields.note}</label>
          <textarea rows={2} className={textareaClass} value={address} onChange={(e) => setAddress(e.target.value)} autoComplete="street-address" />
        </div>
        <div>
          <label className={labelClass}>{pf.fields.potential}</label>
          <select className={inputClass} value={potential} onChange={(e) => setPotential(e.target.value)}>
            {pf.potentialOptions.map((o) => (
              <option key={o} value={o}>{o}</option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelClass}>{pf.fields.note}</label>
          <textarea rows={3} className={textareaClass} value={note} onChange={(e) => setNote(e.target.value)} />
        </div>
        <label className="flex items-start gap-2.5 text-sm">
          <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} className="mt-1 size-4 shrink-0 accent-black" />
          <span><ConsentText text={pf.fields.agreement} /> <span className="text-danger">*</span></span>
        </label>
        {err && <p className="text-sm text-danger">{err}</p>}
        <Button type="submit" intent="secondary" size="lg" block disabled={busy}>
          {busy ? pp.submitting : pp.submit}
        </Button>
        <p className="text-center text-xs text-text-muted">{pp.applyNote}</p>
      </form>
    </div>
  )
}

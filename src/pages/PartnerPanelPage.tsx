import { useEffect, useState, type FormEvent, type ReactNode } from 'react'
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
import { CountryCitySelect, countryDisplayName } from '@/components/common/CountryCitySelect'
import { ConsentText } from '@/features/legal/ConsentText'
import { defaultCountryForLocale } from '@/app/config/country-codes'
import { regionsFor } from '@/app/config/regions'

const inputClass =
  'h-11 w-full rounded-md border border-border bg-surface px-3 text-base outline-none focus:border-border-strong'
const textareaClass =
  'min-h-[80px] w-full rounded-md border border-border bg-surface px-3 py-2 text-base outline-none focus:border-border-strong'
const labelClass = 'mb-1.5 block text-sm font-medium'

export default function PartnerPanelPage() {
  const { locale, dict } = useI18n()
  const pp = dict.partnerPanel
  const { user, loading: authLoading } = useAuth()
  const { loading, isAdmin, partner, error, refetch } = usePartner()
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
    // Admin: partner yönetim görünümü (partnerden üstün yetki).
    if (isAdmin) {
      return <PartnerAdminSection />
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
type PTab = 'profile' | 'customers' | 'ordersNew' | 'ordersActive' | 'ordersDelivery' | 'ordersDone' | 'allOrders' | 'wallet'
const P_TABS: { key: PTab; icon: IconName }[] = [
  { key: 'profile', icon: 'QrCode' },
  { key: 'customers', icon: 'Users' },
  { key: 'ordersNew', icon: 'FileText' },
  { key: 'ordersActive', icon: 'Cog' },
  { key: 'ordersDelivery', icon: 'Clock' },
  { key: 'ordersDone', icon: 'PackageCheck' },
  { key: 'allOrders', icon: 'BarChart3' },
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
    allOrders: pp.tabAllOrders,
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
      ) : tab === 'customers' ? (
        <CustomersTab />
      ) : tab === 'allOrders' ? (
        <AllOrdersTab />
      ) : tab === 'wallet' ? (
        <WalletTab />
      ) : (
        <OrdersTab key={tab} stage={tab} />
      )}
    </div>
  )
}

/* Davet bağlantısı + QR — kopyalanabilir/indirilebilir, düzenlenemez (kaybolmasın). */
function InviteBox({ partner }: { partner: Partner }) {
  const { locale, dict } = useI18n()
  const pp = dict.partnerPanel
  const [copied, setCopied] = useState(false)
  const [qr, setQr] = useState<string | null>(null)

  const origin = typeof window !== 'undefined' ? window.location.origin : ''
  const homePath = buildPath(locale, 'home')
  const link = `${origin}${homePath}${homePath.endsWith('/') ? '' : '/'}?ref=${partner.ref_code}`.replace(/\/\?/, '?')

  // QR'ı yalnız bu sayfada, dinamik import ile üret (kod bölme; baskı için yüksek çözünürlük).
  useEffect(() => {
    let active = true
    import('qrcode')
      .then((m) => {
        const QR = (m as { default?: unknown }).default ?? m
        return (QR as { toDataURL: (t: string, o: object) => Promise<string> }).toDataURL(link, {
          width: 640,
          margin: 2,
          errorCorrectionLevel: 'M',
          color: { dark: '#0f172a', light: '#ffffff' },
        })
      })
      .then((url) => active && setQr(url))
      .catch(() => { /* QR üretilemezse link yine var */ })
    return () => { active = false }
  }, [link])

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(link)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      /* pano yoksa yok say */
    }
  }
  const downloadQr = () => {
    if (!qr) return
    const a = document.createElement('a')
    a.href = qr
    a.download = `tercumexpert-davet-${partner.ref_code}.png`
    a.click()
  }

  return (
    <div className="rounded-lg border border-border bg-surface p-6">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          <h2 className="text-base font-semibold">{pp.refTitle}</h2>
          <p className="mt-1 text-sm text-text-secondary">{pp.refDesc}</p>
          <div className="mt-3 flex flex-col gap-2 sm:flex-row">
            <input
              readOnly
              value={link}
              onFocus={(e) => e.currentTarget.select()}
              className={`${inputClass} font-mono text-sm`}
              aria-label={pp.refTitle}
            />
            <Button type="button" intent="secondary" onClick={copy} className="shrink-0">
              {copied ? pp.refCopied : pp.refCopy}
            </Button>
          </div>
        </div>
        {qr && (
          <div className="flex shrink-0 flex-col items-center gap-2">
            <img src={qr} alt={pp.qrAlt} width={128} height={128} className="size-32 rounded-md border border-border bg-white p-1.5" />
            <Button type="button" intent="outline" size="sm" onClick={downloadQr}>{pp.qrDownload}</Button>
          </div>
        )}
      </div>
    </div>
  )
}

/* Profilim — davet linki en üstte + zorunlu alanlar + IBAN + e-posta doğrulama.
   Onaylı partnerde Şirket/Yetkili/Ülke/Telefon KİLİTLİ (server da zorlar). */
function ProfileTab({ partner, onSaved }: { partner: Partner; onSaved: () => void }) {
  const { locale, dict } = useI18n()
  const pp = dict.partnerPanel
  const pf = dict.partnership.form
  const tf = dict.translator.form
  const lockedHint = dict.translator.profile.lockedHint
  const sectors = dict.partnership.sectors.items
  const otherLabel = pf.sectorOptions[pf.sectorOptions.length - 1]

  // Kilitli alanlar (onaylı partner): partner satırından okunur, düzenlenmez, payload'a girmez.
  const company = partner.company ?? ''
  const contactName = partner.contact_name ?? ''
  const country = partner.country ?? ''
  const phone = partner.phone ?? ''

  // Düzenlenebilir alanlar.
  const [sector, setSector] = useState(partner.sector ?? '')
  const [sectorOther, setSectorOther] = useState(partner.sector_other ?? '')
  const [titleRole, setTitleRole] = useState(partner.title_role ?? '')
  const [city, setCity] = useState(partner.city ?? '')
  const [address, setAddress] = useState(partner.address ?? '')
  const [iban, setIban] = useState(partner.iban ?? '')
  const [ibanName, setIbanName] = useState(partner.iban_name ?? '')
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<'ok' | 'err' | 'req' | null>(null)

  const lockedInput = cn(inputClass, 'cursor-not-allowed bg-surface-muted text-text-muted')
  const LockNote = ({ text }: { text: string }) => (
    <p className="mt-1 text-xs text-text-muted"><Icon name="Lock" className="me-1 inline size-3" />{text}</p>
  )

  const save = async (e: FormEvent) => {
    e.preventDefault()
    // Zorunlu alanlar boş bırakılamaz (formdaki zorunluluklar burada da geçerli).
    if (!sector || !city.trim() || (sector === 'other' && !sectorOther.trim())) {
      setMsg('req')
      return
    }
    setBusy(true)
    setMsg(null)
    // Yalnızca düzenlenebilir alanlar gönderilir; kilitli alanlar dokunulmaz.
    const { error } = await supabase
      .from('partners')
      .update({
        sector,
        sector_other: sector === 'other' ? sectorOther.trim() : null,
        title_role: titleRole.trim() || null,
        city,
        address: address.trim() || null,
        iban: iban.trim() || null,
        iban_name: ibanName.trim() || null,
      })
      .eq('id', partner.id)
    setBusy(false)
    setMsg(error ? 'err' : 'ok')
    if (!error) onSaved()
  }

  const ibanSet = !!iban.trim()

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

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={labelClass}>{pf.fields.company}</label>
            <input className={lockedInput} value={company} disabled autoComplete="organization" />
            <LockNote text={lockedHint} />
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
            <label className={labelClass}>{pf.fields.contactName}</label>
            <input className={lockedInput} value={contactName} disabled autoComplete="name" />
            <LockNote text={lockedHint} />
          </div>
          <div>
            <label className={labelClass}>{pf.fields.titleRole}</label>
            <input className={inputClass} value={titleRole} onChange={(e) => setTitleRole(e.target.value)} />
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={labelClass}>{pf.fields.email}</label>
            <input className={lockedInput} value={partner.email ?? ''} disabled dir="ltr" />
          </div>
          <div>
            <label className={labelClass}>{pf.fields.phone}</label>
            <input className={lockedInput} value={phone} disabled dir="ltr" />
            <LockNote text={pp.phoneLockNote} />
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={labelClass}>{tf.country}</label>
            <input className={lockedInput} value={countryDisplayName(country, locale, country)} disabled />
            <LockNote text={lockedHint} />
          </div>
          <div>
            <label className={labelClass}>{tf.city} <span className="text-danger">*</span></label>
            <select className={inputClass} value={city} onChange={(e) => setCity(e.target.value)}>
              <option value="">{tf.selectCity}</option>
              {regionsFor(country).map((x) => (
                <option key={x} value={x}>{x}</option>
              ))}
            </select>
          </div>
        </div>
        <div>
          <label className={labelClass}>{tf.address}</label>
          <textarea rows={2} className={textareaClass} value={address} onChange={(e) => setAddress(e.target.value)} autoComplete="street-address" />
        </div>

        {/* IBAN alanı + durum/politika */}
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
        {!ibanSet ? (
          <div className="flex items-start gap-2 rounded-md border border-secondary/30 bg-surface-muted p-3 text-sm">
            <Icon name="Wallet" className="mt-0.5 size-4 shrink-0 text-text-secondary" />
            <p>{pp.ibanReminder}</p>
          </div>
        ) : !partner.iban_verified ? (
          <div className="rounded-md border border-secondary/40 bg-surface-muted p-3.5 text-sm">
            <p className="flex items-start gap-2 font-semibold">
              <Icon name="ShieldCheck" className="mt-0.5 size-4 shrink-0 text-text-secondary" /> {pp.ibanPending}
            </p>
            <p className="mt-1.5 text-text-secondary">{pp.ibanPolicy}</p>
          </div>
        ) : null}

        {msg === 'ok' && <p className="text-sm text-success">{pp.saved}</p>}
        {msg === 'err' && <p className="text-sm text-danger">{pp.saveError}</p>}
        {msg === 'req' && <p className="text-sm text-danger">{pp.fillRequired}</p>}
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

/* ------------------------------------------------------------------ */
/* Faz 2b: Müşterilerim · Sipariş aşamaları · Cüzdan                    */
/* ------------------------------------------------------------------ */
function fmtDate(iso: string): string {
  try {
    return iso ? new Date(iso).toLocaleDateString() : '—'
  } catch {
    return '—'
  }
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

type LoadState = 'loading' | 'idle' | 'error'

interface PartnerCustomer {
  id: string
  name: string
  email: string
  phone: string
  joinedAt: string
  orderCount: number
  orderTotal: number
}

/* Müşterilerim — partnerin getirdiği üyeler + isim filtresi. */
function CustomersTab() {
  const { dict, formatCurrency } = useI18n()
  const pp = dict.partnerPanel
  const [rows, setRows] = useState<PartnerCustomer[]>([])
  const [state, setState] = useState<LoadState>('loading')
  const [q, setQ] = useState('')

  useEffect(() => {
    let active = true
    partnerApi<{ customers?: PartnerCustomer[]; error?: string }>('customers')
      .then((r) => {
        if (!active) return
        if (r.error) { setState('error'); return }
        setRows(r.customers ?? [])
        setState('idle')
      })
      .catch(() => active && setState('error'))
    return () => { active = false }
  }, [])

  if (state === 'loading') return <p className="py-10 text-center text-sm text-text-secondary">{pp.loading}</p>
  if (state === 'error') return <p className="rounded-md border border-danger/40 bg-danger/10 p-4 text-sm text-danger">{pp.loadError}</p>

  const filtered = rows.filter((c) => c.name.toLowerCase().includes(q.trim().toLowerCase()))

  return (
    <div className="space-y-4">
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder={pp.custFilter}
        className={`${inputClass} max-w-xs`}
      />
      {filtered.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border bg-surface-muted/40 p-8 text-center text-sm text-text-secondary">{pp.custEmpty}</div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead className="bg-surface-muted text-text-secondary">
              <tr>
                <th className="px-3 py-2 text-start font-medium">{pp.colName}</th>
                <th className="px-3 py-2 text-start font-medium">{pp.colEmail}</th>
                <th className="px-3 py-2 text-start font-medium">{pp.colPhone}</th>
                <th className="px-3 py-2 text-start font-medium">{pp.colJoined}</th>
                <th className="px-3 py-2 text-end font-medium">{pp.custOrderCount}</th>
                <th className="px-3 py-2 text-end font-medium">{pp.custTotal}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((c) => (
                <tr key={c.id} className="bg-surface">
                  <td className="whitespace-nowrap px-3 py-2 font-medium">{c.name || '—'}</td>
                  <td className="px-3 py-2 text-text-secondary" dir="ltr">{c.email || '—'}</td>
                  <td className="whitespace-nowrap px-3 py-2 text-text-secondary" dir="ltr">{c.phone || '—'}</td>
                  <td className="whitespace-nowrap px-3 py-2 text-text-secondary">{fmtDate(c.joinedAt)}</td>
                  <td className="whitespace-nowrap px-3 py-2 text-end">{c.orderCount}</td>
                  <td className="whitespace-nowrap px-3 py-2 text-end font-semibold">{formatCurrency(c.orderTotal)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

interface PartnerOrder {
  order_no: number
  created_at: string
  status: string
  work_status: string
  service: string
  source_lang: string
  target_lang: string
  word_count: number
  total: number
  customerName: string
  partnerShare: number
}

/* Sekme → hangi work_status'ler o aşamaya girer (her sipariş TEK aşamada görünür). */
const STAGE_STATUS: Record<string, string[]> = {
  ordersNew: ['available'],
  ordersActive: ['claimed', 'submitted'],
  ordersDelivery: ['approved'],
  ordersDone: ['completed'],
}

/* Sipariş tablosu — toplam tutar + "Sizin kazancınız" (partner payı). */
function OrdersTable({ rows }: { rows: PartnerOrder[] }) {
  const { dict, formatCurrency } = useI18n()
  const pp = dict.partnerPanel
  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <table className="w-full text-sm">
        <thead className="bg-surface-muted text-text-secondary">
          <tr>
            <th className="px-3 py-2 text-start font-medium">{pp.colOrderNo}</th>
            <th className="px-3 py-2 text-start font-medium">{pp.colCustomer}</th>
            <th className="px-3 py-2 text-start font-medium">{pp.colService}</th>
            <th className="px-3 py-2 text-start font-medium">{pp.colLangs}</th>
            <th className="px-3 py-2 text-start font-medium">{pp.colDate}</th>
            <th className="px-3 py-2 text-end font-medium">{pp.colAmount}</th>
            <th className="px-3 py-2 text-end font-medium">{pp.yourEarning}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {rows.map((o) => (
            <tr key={o.order_no} className="bg-surface">
              <td className="whitespace-nowrap px-3 py-2 font-medium">#{o.order_no}</td>
              <td className="whitespace-nowrap px-3 py-2">{o.customerName || '—'}</td>
              <td className="px-3 py-2 text-text-secondary">{o.service || '—'}</td>
              <td className="whitespace-nowrap px-3 py-2 text-text-secondary uppercase" dir="ltr">
                {o.source_lang} → {o.target_lang}
              </td>
              <td className="whitespace-nowrap px-3 py-2 text-text-secondary">{fmtDate(o.created_at)}</td>
              <td className="whitespace-nowrap px-3 py-2 text-end">{formatCurrency(o.total)}</td>
              <td className="whitespace-nowrap px-3 py-2 text-end font-semibold text-success">{formatCurrency(o.partnerShare)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

/* Ortak sipariş yükleyici (tüm siparişler bir kez çekilir, sekme filtreler). */
function usePartnerOrders() {
  const [rows, setRows] = useState<PartnerOrder[]>([])
  const [state, setState] = useState<LoadState>('loading')
  useEffect(() => {
    let active = true
    partnerApi<{ orders?: PartnerOrder[]; error?: string }>('orders')
      .then((r) => {
        if (!active) return
        if (r.error) { setState('error'); return }
        setRows(r.orders ?? [])
        setState('idle')
      })
      .catch(() => active && setState('error'))
    return () => { active = false }
  }, [])
  return { rows, state }
}

/* Sipariş aşama sekmesi — müşterilerin siparişleri (read-only). key={tab} ile taze çekilir. */
function OrdersTab({ stage }: { stage: string }) {
  const { dict } = useI18n()
  const pp = dict.partnerPanel
  const { rows, state } = usePartnerOrders()

  if (state === 'loading') return <p className="py-10 text-center text-sm text-text-secondary">{pp.loading}</p>
  if (state === 'error') return <p className="rounded-md border border-danger/40 bg-danger/10 p-4 text-sm text-danger">{pp.loadError}</p>

  const allowed = STAGE_STATUS[stage] ?? []
  const filtered = rows.filter((o) => allowed.includes(o.work_status))
  if (filtered.length === 0)
    return <div className="rounded-lg border border-dashed border-border bg-surface-muted/40 p-8 text-center text-sm text-text-secondary">{pp.ordEmpty}</div>
  return <OrdersTable rows={filtered} />
}

/* Tüm Siparişler — partnerin bütün siparişleri; isim + sipariş no + tarih aralığı filtresi. */
function AllOrdersTab() {
  const { dict } = useI18n()
  const pp = dict.partnerPanel
  const { rows, state } = usePartnerOrders()
  const [name, setName] = useState('')
  const [no, setNo] = useState('')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')

  if (state === 'loading') return <p className="py-10 text-center text-sm text-text-secondary">{pp.loading}</p>
  if (state === 'error') return <p className="rounded-md border border-danger/40 bg-danger/10 p-4 text-sm text-danger">{pp.loadError}</p>

  const day = (iso: string) => (iso || '').slice(0, 10)
  const filtered = rows.filter((o) => {
    if (name.trim() && !o.customerName.toLowerCase().includes(name.trim().toLowerCase())) return false
    if (no.trim() && !String(o.order_no).includes(no.trim())) return false
    if (from && day(o.created_at) < from) return false
    if (to && day(o.created_at) > to) return false
    return true
  })

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-2">
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder={pp.custFilter} className={`${inputClass} w-auto max-w-[12rem]`} />
        <input value={no} onChange={(e) => setNo(e.target.value.replace(/\D/g, ''))} placeholder={pp.fltOrderNo} inputMode="numeric" className={`${inputClass} w-auto max-w-[9rem]`} />
        <label className="flex flex-col text-xs text-text-secondary">
          {pp.fltDateFrom}
          <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className={`${inputClass} w-auto`} />
        </label>
        <label className="flex flex-col text-xs text-text-secondary">
          {pp.fltDateTo}
          <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className={`${inputClass} w-auto`} />
        </label>
      </div>
      {filtered.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border bg-surface-muted/40 p-8 text-center text-sm text-text-secondary">{pp.ordEmpty}</div>
      ) : (
        <OrdersTable rows={filtered} />
      )}
    </div>
  )
}

interface PartnerWallet {
  total: number
  locked: number
  withdrawable: number
  paid: number
  entries: Array<{ amount: number; status: string; created_at: string; paid_at: string | null; order_no: number | null; unlocked: boolean }>
}

/* Cüzdan — partner_ledger (7 gün kilit). Etiketler translator.wallet'tan; ödeme notu partner'a özel. */
function WalletTab() {
  const { dict, formatCurrency } = useI18n()
  const pp = dict.partnerPanel
  const w = dict.translator.wallet
  const [data, setData] = useState<PartnerWallet | null>(null)
  const [state, setState] = useState<LoadState>('loading')

  useEffect(() => {
    let active = true
    partnerApi<{ wallet?: PartnerWallet; error?: string }>('wallet')
      .then((r) => {
        if (!active) return
        if (r.error || !r.wallet) { setState('error'); return }
        setData(r.wallet)
        setState('idle')
      })
      .catch(() => active && setState('error'))
    return () => { active = false }
  }, [])

  if (state === 'loading') return <p className="py-10 text-center text-sm text-text-secondary">{pp.loading}</p>
  if (state === 'error' || !data) return <p className="rounded-md border border-danger/40 bg-danger/10 p-4 text-sm text-danger">{pp.loadError}</p>

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label={w.total} value={formatCurrency(data.total)} icon="Wallet" />
        <StatCard label={w.locked} value={formatCurrency(data.locked)} icon="Lock" accent="text-text-muted" />
        <StatCard label={w.withdrawable} value={formatCurrency(data.withdrawable)} icon="Coins" accent="text-success" />
        <StatCard label={w.paid} value={formatCurrency(data.paid)} icon="Check" accent="text-text-secondary" />
      </div>
      <p className="rounded-md border border-border bg-surface-muted/50 p-3 text-xs text-text-secondary">{pp.walPayInfo}</p>
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
                    <Pill tone={e.status === 'paid' || e.unlocked ? 'success' : 'neutral'}>
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

/* ------------------------------------------------------------------ */
/* Faz 3a: Admin partner bölümü (tüm partnerler geneli)                */
/* ------------------------------------------------------------------ */
interface AdminOrder {
  order_no: number
  created_at: string
  work_status: string
  service: string
  source_lang: string
  target_lang: string
  total: number
  partnerShare: number
  customerName: string
  customerEmail: string
  customerPhone: string
  partnerName: string
  partnerCompany: string
}

function useAdminOrders() {
  const [rows, setRows] = useState<AdminOrder[]>([])
  const [state, setState] = useState<LoadState>('loading')
  useEffect(() => {
    let active = true
    partnerApi<{ orders?: AdminOrder[]; error?: string }>('adminOrders')
      .then((r) => {
        if (!active) return
        if (r.error) { setState('error'); return }
        setRows(r.orders ?? [])
        setState('idle')
      })
      .catch(() => active && setState('error'))
    return () => { active = false }
  }, [])
  return { rows, state }
}

/* Admin sipariş tablosu — müşteri (kişisel bilgiyle) + partner + toplam + partner payı. */
function AdminOrdersTable({ rows }: { rows: AdminOrder[] }) {
  const { dict, formatCurrency } = useI18n()
  const pp = dict.partnerPanel
  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <table className="w-full text-sm">
        <thead className="bg-surface-muted text-text-secondary">
          <tr>
            <th className="px-3 py-2 text-start font-medium">{pp.colOrderNo}</th>
            <th className="px-3 py-2 text-start font-medium">{pp.colCustomer}</th>
            <th className="px-3 py-2 text-start font-medium">{pp.colPartner}</th>
            <th className="px-3 py-2 text-start font-medium">{pp.colService}</th>
            <th className="px-3 py-2 text-start font-medium">{pp.colDate}</th>
            <th className="px-3 py-2 text-end font-medium">{pp.colAmount}</th>
            <th className="px-3 py-2 text-end font-medium">{pp.partnerShareLabel}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {rows.map((o) => (
            <tr key={o.order_no} className="bg-surface align-top">
              <td className="whitespace-nowrap px-3 py-2 font-medium">#{o.order_no}</td>
              <td className="px-3 py-2">
                <div className="font-medium">{o.customerName || '—'}</div>
                {(o.customerEmail || o.customerPhone) && (
                  <div className="text-xs text-text-muted" dir="ltr">{[o.customerEmail, o.customerPhone].filter(Boolean).join(' · ')}</div>
                )}
              </td>
              <td className="px-3 py-2">
                <div className="font-medium">{o.partnerName || '—'}</div>
                {o.partnerCompany && <div className="text-xs text-text-muted">{o.partnerCompany}</div>}
              </td>
              <td className="px-3 py-2 text-text-secondary">{o.service || '—'}</td>
              <td className="whitespace-nowrap px-3 py-2 text-text-secondary">{fmtDate(o.created_at)}</td>
              <td className="whitespace-nowrap px-3 py-2 text-end">{formatCurrency(o.total)}</td>
              <td className="whitespace-nowrap px-3 py-2 text-end font-semibold text-success">{formatCurrency(o.partnerShare)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

type ATab = 'applications' | 'iban' | 'partners' | 'ordersNew' | 'ordersActive' | 'ordersDelivery' | 'ordersDone' | 'allOrders' | 'wallet' | 'payments'
const A_TABS: { key: ATab; icon: IconName }[] = [
  { key: 'applications', icon: 'Check' },
  { key: 'iban', icon: 'ShieldCheck' },
  { key: 'partners', icon: 'Users' },
  { key: 'ordersNew', icon: 'FileText' },
  { key: 'ordersActive', icon: 'Cog' },
  { key: 'ordersDelivery', icon: 'Clock' },
  { key: 'ordersDone', icon: 'PackageCheck' },
  { key: 'allOrders', icon: 'BarChart3' },
  { key: 'wallet', icon: 'Wallet' },
  { key: 'payments', icon: 'Coins' },
]

function PartnerAdminSection() {
  const { dict } = useI18n()
  const pp = dict.partnerPanel
  const [tab, setTab] = useState<ATab>('allOrders')
  const label: Record<ATab, string> = {
    applications: pp.tabApplications,
    iban: pp.tabIban,
    partners: pp.tabPartners,
    ordersNew: pp.tabOrdersNew,
    ordersActive: pp.tabOrdersActive,
    ordersDelivery: pp.tabOrdersDelivery,
    ordersDone: pp.tabOrdersDone,
    allOrders: pp.tabAllOrders,
    wallet: pp.tabWallet,
    payments: pp.tabPayments,
  }
  return (
    <div>
      <h1 className="mb-5 text-2xl font-bold">{pp.adminTitle}</h1>
      <div className="mb-6 flex flex-wrap gap-2">
        {A_TABS.map((x) => (
          <button
            key={x.key}
            type="button"
            onClick={() => setTab(x.key)}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors',
              tab === x.key ? 'border-secondary bg-secondary text-secondary-foreground' : 'border-border bg-surface text-text-secondary hover:bg-surface-muted',
            )}
          >
            <Icon name={x.icon} className="size-4" /> {label[x.key]}
          </button>
        ))}
      </div>
      {tab === 'partners' ? (
        <PartnersTab />
      ) : tab === 'applications' ? (
        <ApplicationsTab />
      ) : tab === 'iban' ? (
        <IbanApprovalsTab />
      ) : tab === 'payments' ? (
        <PartnerAdminPayments />
      ) : tab === 'allOrders' ? (
        <AdminAllOrdersTab />
      ) : tab === 'wallet' ? (
        <AdminWalletTab />
      ) : (
        <AdminOrdersTab key={tab} stage={tab} />
      )}
    </div>
  )
}

/* Admin aşama sayfası — tüm partnerlerin siparişleri, o aşamada. */
function AdminOrdersTab({ stage }: { stage: string }) {
  const { dict } = useI18n()
  const pp = dict.partnerPanel
  const { rows, state } = useAdminOrders()
  if (state === 'loading') return <p className="py-10 text-center text-sm text-text-secondary">{pp.loading}</p>
  if (state === 'error') return <p className="rounded-md border border-danger/40 bg-danger/10 p-4 text-sm text-danger">{pp.loadError}</p>
  const allowed = STAGE_STATUS[stage] ?? []
  const filtered = rows.filter((o) => allowed.includes(o.work_status))
  if (filtered.length === 0)
    return <div className="rounded-lg border border-dashed border-border bg-surface-muted/40 p-8 text-center text-sm text-text-secondary">{pp.ordEmpty}</div>
  return <AdminOrdersTable rows={filtered} />
}

/* Admin Tüm Siparişler — filtre: müşteri adı, partner adı, şirket, sipariş no, tarih aralığı. */
function AdminAllOrdersTab() {
  const { dict } = useI18n()
  const pp = dict.partnerPanel
  const { rows, state } = useAdminOrders()
  const [cust, setCust] = useState('')
  const [prt, setPrt] = useState('')
  const [comp, setComp] = useState('')
  const [no, setNo] = useState('')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')

  if (state === 'loading') return <p className="py-10 text-center text-sm text-text-secondary">{pp.loading}</p>
  if (state === 'error') return <p className="rounded-md border border-danger/40 bg-danger/10 p-4 text-sm text-danger">{pp.loadError}</p>

  const has = (v: string, q: string) => v.toLowerCase().includes(q.trim().toLowerCase())
  const day = (iso: string) => (iso || '').slice(0, 10)
  const filtered = rows.filter((o) => {
    if (cust.trim() && !has(o.customerName, cust)) return false
    if (prt.trim() && !has(o.partnerName, prt)) return false
    if (comp.trim() && !has(o.partnerCompany, comp)) return false
    if (no.trim() && !String(o.order_no).includes(no.trim())) return false
    if (from && day(o.created_at) < from) return false
    if (to && day(o.created_at) > to) return false
    return true
  })

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-2">
        <input value={cust} onChange={(e) => setCust(e.target.value)} placeholder={pp.custFilter} className={`${inputClass} w-auto max-w-[11rem]`} />
        <input value={prt} onChange={(e) => setPrt(e.target.value)} placeholder={pp.fltPartner} className={`${inputClass} w-auto max-w-[11rem]`} />
        <input value={comp} onChange={(e) => setComp(e.target.value)} placeholder={pp.fltCompany} className={`${inputClass} w-auto max-w-[11rem]`} />
        <input value={no} onChange={(e) => setNo(e.target.value.replace(/\D/g, ''))} placeholder={pp.fltOrderNo} inputMode="numeric" className={`${inputClass} w-auto max-w-[8rem]`} />
        <label className="flex flex-col text-xs text-text-secondary">
          {pp.fltDateFrom}
          <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className={`${inputClass} w-auto`} />
        </label>
        <label className="flex flex-col text-xs text-text-secondary">
          {pp.fltDateTo}
          <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className={`${inputClass} w-auto`} />
        </label>
      </div>
      {filtered.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border bg-surface-muted/40 p-8 text-center text-sm text-text-secondary">{pp.ordEmpty}</div>
      ) : (
        <AdminOrdersTable rows={filtered} />
      )}
    </div>
  )
}

/* Admin Cüzdan — tamamlanan partner siparişleri: toplam, partner payı, kalan (firma). */
function AdminWalletTab() {
  const { dict, formatCurrency } = useI18n()
  const pp = dict.partnerPanel
  const w = dict.translator.wallet
  const { rows, state } = useAdminOrders()
  if (state === 'loading') return <p className="py-10 text-center text-sm text-text-secondary">{pp.loading}</p>
  if (state === 'error') return <p className="rounded-md border border-danger/40 bg-danger/10 p-4 text-sm text-danger">{pp.loadError}</p>

  const done = rows.filter((o) => o.work_status === 'completed')
  const sumTotal = done.reduce((s, o) => s + (Number(o.total) || 0), 0)
  const sumShare = done.reduce((s, o) => s + (Number(o.partnerShare) || 0), 0)
  const sumNet = sumTotal - sumShare

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard label={pp.colAmount} value={formatCurrency(sumTotal)} icon="Coins" />
        <StatCard label={pp.partnerShareLabel} value={formatCurrency(sumShare)} icon="Users" accent="text-text-muted" />
        <StatCard label={pp.adminNet} value={formatCurrency(sumNet)} icon="Wallet" accent="text-success" />
      </div>
      {done.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border bg-surface-muted/40 p-8 text-center text-sm text-text-secondary">{w.empty}</div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead className="bg-surface-muted text-text-secondary">
              <tr>
                <th className="px-3 py-2 text-start font-medium">{pp.colOrderNo}</th>
                <th className="px-3 py-2 text-start font-medium">{pp.colPartner}</th>
                <th className="px-3 py-2 text-start font-medium">{w.date}</th>
                <th className="px-3 py-2 text-end font-medium">{pp.colAmount}</th>
                <th className="px-3 py-2 text-end font-medium">{pp.partnerShareLabel}</th>
                <th className="px-3 py-2 text-end font-medium">{pp.adminNet}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {done.map((o) => (
                <tr key={o.order_no} className="bg-surface">
                  <td className="whitespace-nowrap px-3 py-2 font-medium">#{o.order_no}</td>
                  <td className="px-3 py-2">{o.partnerName || '—'}{o.partnerCompany ? ` · ${o.partnerCompany}` : ''}</td>
                  <td className="whitespace-nowrap px-3 py-2 text-text-secondary">{fmtDate(o.created_at)}</td>
                  <td className="whitespace-nowrap px-3 py-2 text-end">{formatCurrency(o.total)}</td>
                  <td className="whitespace-nowrap px-3 py-2 text-end text-text-muted">−{formatCurrency(o.partnerShare)}</td>
                  <td className="whitespace-nowrap px-3 py-2 text-end font-semibold text-success">{formatCurrency((Number(o.total) || 0) - (Number(o.partnerShare) || 0))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Faz 3b: Başvurular · IBAN Onayları · Ödemeler                       */
/* ------------------------------------------------------------------ */
function AdminEmpty({ text }: { text: string }) {
  return <div className="rounded-lg border border-dashed border-border bg-surface-muted/40 p-10 text-center text-sm text-text-secondary">{text}</div>
}
function AdminLoadErr() {
  const { dict } = useI18n()
  return <p className="rounded-md border border-danger/40 bg-danger/10 p-4 text-sm text-danger">{dict.partnerPanel.loadError}</p>
}
function Field2({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <dt className="text-xs text-text-secondary">{label}</dt>
      <dd className="mt-0.5 font-medium">{children}</dd>
    </div>
  )
}

/* Başvurular — bekleyen partner başvuruları; onayla/reddet (admin RLS). */
function ApplicationsTab() {
  const { locale, dict } = useI18n()
  const pp = dict.partnerPanel
  const pf = dict.partnership.form
  const tf = dict.translator.form
  const otherLabel = pf.sectorOptions[pf.sectorOptions.length - 1]
  const [rows, setRows] = useState<Partner[]>([])
  const [state, setState] = useState<LoadState>('loading')
  const [busyId, setBusyId] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    supabase.from('partners').select('*').eq('status', 'pending').order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (!active) return
        if (error) setState('error')
        else { setRows((data as Partner[]) ?? []); setState('idle') }
      })
    return () => { active = false }
  }, [])

  const act = async (id: string, status: 'approved' | 'rejected') => {
    setBusyId(id)
    await supabase.from('partners').update({ status }).eq('id', id)
    setBusyId(null)
    setRows((prev) => prev.filter((x) => x.id !== id))
  }
  const sectorLabel = (p: Partner) =>
    p.sector === 'other' ? (p.sector_other || otherLabel) : (dict.partnership.sectors.items.find((s) => s.key === p.sector)?.title || p.sector || '—')

  if (state === 'loading') return <p className="py-10 text-center text-sm text-text-secondary">{pp.loading}</p>
  if (state === 'error') return <AdminLoadErr />
  if (rows.length === 0) return <AdminEmpty text={pp.noApplications} />

  return (
    <div className="space-y-3">
      {rows.map((p) => (
        <article key={p.id} className="rounded-lg border border-border bg-surface p-4">
          <h3 className="font-semibold">{p.company || p.contact_name || '—'}</h3>
          <dl className="mt-3 grid gap-3 sm:grid-cols-3">
            <Field2 label={pf.fields.sector}>{sectorLabel(p)}</Field2>
            <Field2 label={pf.fields.contactName}>{p.contact_name || '—'}</Field2>
            <Field2 label={pf.fields.titleRole}>{p.title_role || '—'}</Field2>
            <Field2 label={pf.fields.email}><span dir="ltr">{p.email || '—'}</span></Field2>
            <Field2 label={pf.fields.phone}><span dir="ltr">{p.phone || '—'}</span></Field2>
            <Field2 label={tf.country}>{[countryDisplayName(p.country || '', locale, p.country || ''), p.city].filter(Boolean).join(' · ') || '—'}</Field2>
          </dl>
          <div className="mt-3 flex flex-wrap gap-2 border-t border-border pt-3">
            <Button type="button" intent="secondary" size="sm" disabled={busyId === p.id} onClick={() => act(p.id, 'approved')}>{pp.approve}</Button>
            <Button type="button" intent="outline" size="sm" disabled={busyId === p.id} onClick={() => act(p.id, 'rejected')}>{pp.reject}</Button>
          </div>
        </article>
      ))}
    </div>
  )
}

/* IBAN Onayları — onay bekleyen (iban dolu, doğrulanmamış) partnerler. */
function IbanApprovalsTab() {
  const { dict } = useI18n()
  const pp = dict.partnerPanel
  const tf = dict.translator.form
  const [rows, setRows] = useState<Partner[]>([])
  const [state, setState] = useState<LoadState>('loading')
  const [busyId, setBusyId] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    supabase.from('partners').select('*').eq('status', 'approved').eq('iban_verified', false).order('updated_at', { ascending: false })
      .then(({ data, error }) => {
        if (!active) return
        if (error) setState('error')
        else { setRows(((data as Partner[]) ?? []).filter((p) => (p.iban ?? '').trim())); setState('idle') }
      })
    return () => { active = false }
  }, [])

  const approve = async (id: string) => {
    setBusyId(id)
    await supabase.from('partners').update({ iban_verified: true }).eq('id', id)
    setBusyId(null)
    setRows((prev) => prev.filter((x) => x.id !== id))
  }

  if (state === 'loading') return <p className="py-10 text-center text-sm text-text-secondary">{pp.loading}</p>
  if (state === 'error') return <AdminLoadErr />
  if (rows.length === 0) return <AdminEmpty text={pp.noIban} />

  return (
    <div className="space-y-3">
      {rows.map((p) => (
        <article key={p.id} className="rounded-lg border border-border bg-surface p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h3 className="font-semibold">{p.contact_name || '—'}{p.company ? ` · ${p.company}` : ''}</h3>
              <dl className="mt-2 grid gap-1.5 text-sm">
                <Field2 label={tf.iban}><span dir="ltr" className="font-mono">{p.iban || '—'}</span></Field2>
                {p.iban_name && <Field2 label={tf.ibanName}>{p.iban_name}</Field2>}
              </dl>
            </div>
            <Button type="button" intent="secondary" size="sm" disabled={busyId === p.id} onClick={() => approve(p.id)}>{pp.approveIban}</Button>
          </div>
        </article>
      ))}
    </div>
  )
}

/* Ödemeler — çekilebilir bakiyesi olan partnerler; dekontlu manuel ödeme (2 ve 17'sinde). */
interface PartnerPaymentRow {
  partnerId: string
  name: string | null
  company: string | null
  iban: string | null
  iban_name: string | null
  amount: number
}
function PartnerAdminPayments() {
  const { dict, formatCurrency } = useI18n()
  const pp = dict.partnerPanel
  const ta = dict.translator.admin
  const tf = dict.translator.form
  const [rows, setRows] = useState<PartnerPaymentRow[]>([])
  const [state, setState] = useState<LoadState>('loading')
  const [receipts, setReceipts] = useState<Record<string, string>>({})
  const [uploadingId, setUploadingId] = useState<string | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    partnerApi<{ payments?: PartnerPaymentRow[]; error?: string }>('adminPartnerPayments')
      .then((r) => {
        if (!active) return
        if (r.error) { setState('error'); return }
        setRows(r.payments ?? [])
        setState('idle')
      })
      .catch(() => active && setState('error'))
    return () => { active = false }
  }, [])

  const upload = async (partnerId: string, file: File) => {
    setUploadingId(partnerId)
    const path = `partner/${partnerId}/${Date.now()}-dekont.pdf`
    const { error } = await supabase.storage.from('receipts').upload(path, file, { upsert: true, contentType: file.type || 'application/pdf' })
    setUploadingId(null)
    if (!error) setReceipts((prev) => ({ ...prev, [partnerId]: path }))
    else setNotice(ta.actionError)
  }
  const pay = async (partnerId: string) => {
    const receiptPath = receipts[partnerId]
    if (!receiptPath) return
    setBusyId(partnerId)
    setNotice(null)
    const r = await partnerApi<{ ok?: boolean; error?: string }>('payPartner', { partnerId, receiptPath })
    setBusyId(null)
    if (r.ok) {
      setRows((prev) => prev.filter((x) => x.partnerId !== partnerId))
      setNotice(pp.paid)
    } else {
      setNotice(ta.actionError)
    }
  }

  if (state === 'loading') return <p className="py-10 text-center text-sm text-text-secondary">{pp.loading}</p>
  if (state === 'error') return <AdminLoadErr />

  return (
    <div className="space-y-3">
      <p className="rounded-md border border-border bg-surface-muted/50 p-3 text-sm text-text-secondary">{pp.payHint}</p>
      {notice && <p className="rounded-md border border-success/40 bg-success/10 p-3 text-sm text-success">{notice}</p>}
      {rows.length === 0 ? (
        <AdminEmpty text={pp.noPayments} />
      ) : (
        rows.map((r) => (
          <article key={r.partnerId} className="rounded-lg border border-border bg-surface p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h3 className="font-semibold">{r.name || '—'}{r.company ? ` · ${r.company}` : ''}</h3>
                <dl className="mt-2 grid gap-1.5 text-sm">
                  <Field2 label={tf.iban}><span dir="ltr" className="font-mono">{r.iban || '—'}</span></Field2>
                  {r.iban_name && <Field2 label={tf.ibanName}>{r.iban_name}</Field2>}
                </dl>
              </div>
              <div className="text-end">
                <p className="text-xs text-text-secondary">{ta.paymentAmount}</p>
                <span className="inline-flex items-center rounded-lg border border-success bg-success px-3 py-1.5 text-lg font-bold text-white">
                  {formatCurrency(r.amount)}
                </span>
              </div>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-border pt-3">
              <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-md border border-border bg-surface px-3 py-1.5 text-sm font-medium hover:bg-surface-muted">
                <input type="file" accept="application/pdf" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) upload(r.partnerId, f) }} />
                <Icon name="Upload" className="size-4" />
                {uploadingId === r.partnerId ? ta.uploading : receipts[r.partnerId] ? ta.receiptUploaded : ta.uploadReceipt}
              </label>
              <Button type="button" intent="secondary" size="sm" disabled={!receipts[r.partnerId] || busyId === r.partnerId} onClick={() => pay(r.partnerId)}>
                {busyId === r.partnerId ? ta.uploading : ta.markPaid}
              </Button>
              {!receipts[r.partnerId] && <span className="text-xs text-text-muted">{ta.receiptRequired}</span>}
            </div>
          </article>
        ))
      )}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Faz 3c: Partnerler (liste + profil detay: davet kodu, müşteriler)   */
/* ------------------------------------------------------------------ */
interface AdminPartner {
  id: string
  name: string
  company: string
  sector: string
  sector_other: string
  country: string
  city: string
  ref_code: string
  iban_verified: boolean
  memberCount: number
  orderCount: number
  orderTotal: number
}

function useSectorLabel() {
  const { dict } = useI18n()
  const items = dict.partnership.sectors.items
  const otherLabel = dict.partnership.form.sectorOptions[dict.partnership.form.sectorOptions.length - 1]
  return (sector: string, sectorOther: string) =>
    sector === 'other' ? (sectorOther || otherLabel) : (items.find((s) => s.key === sector)?.title || sector || '—')
}

function PartnersTab() {
  const { locale, dict, formatCurrency } = useI18n()
  const pp = dict.partnerPanel
  const sectors = dict.partnership.sectors.items
  const otherLabel = dict.partnership.form.sectorOptions[dict.partnership.form.sectorOptions.length - 1]
  const sectorLabel = useSectorLabel()
  const [rows, setRows] = useState<AdminPartner[]>([])
  const [state, setState] = useState<LoadState>('loading')
  const [q, setQ] = useState('')
  const [sec, setSec] = useState('')
  const [openId, setOpenId] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    partnerApi<{ partners?: AdminPartner[]; error?: string }>('adminPartners')
      .then((r) => {
        if (!active) return
        if (r.error) { setState('error'); return }
        setRows(r.partners ?? [])
        setState('idle')
      })
      .catch(() => active && setState('error'))
    return () => { active = false }
  }, [])

  if (openId) return <PartnerDetail partnerId={openId} onBack={() => setOpenId(null)} />
  if (state === 'loading') return <p className="py-10 text-center text-sm text-text-secondary">{pp.loading}</p>
  if (state === 'error') return <AdminLoadErr />

  const filtered = rows.filter((p) => {
    const nq = q.trim().toLowerCase()
    if (nq && !(`${p.name} ${p.company}`.toLowerCase().includes(nq))) return false
    if (sec && p.sector !== sec) return false
    return true
  })

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={pp.custFilter} className={`${inputClass} w-auto max-w-[13rem]`} />
        <select value={sec} onChange={(e) => setSec(e.target.value)} className={`${inputClass} w-auto`}>
          <option value="">{pp.sectorAll}</option>
          {sectors.map((s) => <option key={s.key} value={s.key}>{s.title}</option>)}
          <option value="other">{otherLabel}</option>
        </select>
      </div>
      {filtered.length === 0 ? (
        <AdminEmpty text={pp.noPartners} />
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead className="bg-surface-muted text-text-secondary">
              <tr>
                <th className="px-3 py-2 text-start font-medium">{pp.colName}</th>
                <th className="px-3 py-2 text-start font-medium">{pp.colCompany}</th>
                <th className="px-3 py-2 text-start font-medium">{dict.translator.form.city}</th>
                <th className="px-3 py-2 text-end font-medium">{pp.colMembers}</th>
                <th className="px-3 py-2 text-end font-medium">{pp.custOrderCount}</th>
                <th className="px-3 py-2 text-end font-medium">{pp.custTotal}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((p) => (
                <tr key={p.id} className="cursor-pointer bg-surface hover:bg-surface-muted" onClick={() => setOpenId(p.id)}>
                  <td className="whitespace-nowrap px-3 py-2 font-medium">
                    {p.name || '—'}
                    <span className="ms-2 rounded border border-border px-1.5 py-0.5 text-xs text-text-secondary">{sectorLabel(p.sector, p.sector_other)}</span>
                  </td>
                  <td className="px-3 py-2 text-text-secondary">{p.company || '—'}</td>
                  <td className="whitespace-nowrap px-3 py-2 text-text-secondary">{[p.city, countryDisplayName(p.country, locale, p.country)].filter(Boolean).join(' · ') || '—'}</td>
                  <td className="whitespace-nowrap px-3 py-2 text-end">{p.memberCount}</td>
                  <td className="whitespace-nowrap px-3 py-2 text-end">{p.orderCount}</td>
                  <td className="whitespace-nowrap px-3 py-2 text-end font-semibold">{formatCurrency(p.orderTotal)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

interface AdminPartnerDetailData {
  partner: Partner
  customers: Array<{ id: string; name: string; email: string; phone: string; orderCount: number; orderTotal: number }>
}
function PartnerDetail({ partnerId, onBack }: { partnerId: string; onBack: () => void }) {
  const { locale, dict, formatCurrency } = useI18n()
  const pp = dict.partnerPanel
  const tf = dict.translator.form
  const sectorLabel = useSectorLabel()
  const [data, setData] = useState<AdminPartnerDetailData | null>(null)
  const [state, setState] = useState<LoadState>('loading')
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    let active = true
    partnerApi<AdminPartnerDetailData & { error?: string }>('adminPartnerDetail', { partnerId })
      .then((r) => {
        if (!active) return
        if (r.error || !r.partner) { setState('error'); return }
        setData({ partner: r.partner, customers: r.customers ?? [] })
        setState('idle')
      })
      .catch(() => active && setState('error'))
    return () => { active = false }
  }, [partnerId])

  const copyCode = async (code: string) => {
    try { await navigator.clipboard.writeText(code); setCopied(true); setTimeout(() => setCopied(false), 2000) } catch { /* yok say */ }
  }

  return (
    <div className="space-y-4">
      <Button type="button" intent="outline" size="sm" onClick={onBack}>{pp.back}</Button>
      {state === 'loading' ? (
        <p className="py-10 text-center text-sm text-text-secondary">{pp.loading}</p>
      ) : state === 'error' || !data ? (
        <AdminLoadErr />
      ) : (
        <>
          <div className="rounded-lg border border-border bg-surface p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold">{data.partner.contact_name || data.partner.company || '—'}</h2>
                <p className="text-sm text-text-secondary">
                  {[data.partner.company, sectorLabel(data.partner.sector ?? '', data.partner.sector_other ?? '')].filter(Boolean).join(' · ')}
                </p>
                <p className="mt-0.5 text-sm text-text-secondary">
                  {[data.partner.city, countryDisplayName(data.partner.country ?? '', locale, data.partner.country ?? '')].filter(Boolean).join(' · ')}
                </p>
                <dl className="mt-2 grid gap-x-6 gap-y-1 text-sm sm:grid-cols-2">
                  <Field2 label={pp.colEmail}><span dir="ltr">{data.partner.email || '—'}</span></Field2>
                  <Field2 label={pp.colPhone}><span dir="ltr">{data.partner.phone || '—'}</span></Field2>
                  <Field2 label={tf.iban}><span dir="ltr" className="font-mono">{data.partner.iban || '—'}</span></Field2>
                  {data.partner.iban_name && <Field2 label={tf.ibanName}>{data.partner.iban_name}</Field2>}
                </dl>
              </div>
              <div className="text-end">
                <p className="text-xs text-text-secondary">{pp.refCodeLabel}</p>
                <div className="mt-1 flex items-center gap-2">
                  <span className="rounded-md border border-border bg-surface-muted px-2.5 py-1 font-mono font-bold tracking-[0.12em]">{data.partner.ref_code}</span>
                  <Button type="button" intent="outline" size="sm" onClick={() => copyCode(data.partner.ref_code)}>{copied ? pp.refCopied : pp.refCopy}</Button>
                </div>
              </div>
            </div>
          </div>

          {data.customers.length === 0 ? (
            <AdminEmpty text={pp.custEmpty} />
          ) : (
            <div className="overflow-x-auto rounded-lg border border-border">
              <table className="w-full text-sm">
                <thead className="bg-surface-muted text-text-secondary">
                  <tr>
                    <th className="px-3 py-2 text-start font-medium">{pp.colName}</th>
                    <th className="px-3 py-2 text-start font-medium">{pp.colEmail}</th>
                    <th className="px-3 py-2 text-start font-medium">{pp.colPhone}</th>
                    <th className="px-3 py-2 text-end font-medium">{pp.custOrderCount}</th>
                    <th className="px-3 py-2 text-end font-medium">{pp.custTotal}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {data.customers.map((c) => (
                    <tr key={c.id} className="bg-surface">
                      <td className="whitespace-nowrap px-3 py-2 font-medium">{c.name || '—'}</td>
                      <td className="px-3 py-2 text-text-secondary" dir="ltr">{c.email || '—'}</td>
                      <td className="whitespace-nowrap px-3 py-2 text-text-secondary" dir="ltr">{c.phone || '—'}</td>
                      <td className="whitespace-nowrap px-3 py-2 text-end">{c.orderCount}</td>
                      <td className="whitespace-nowrap px-3 py-2 text-end font-semibold">{formatCurrency(c.orderTotal)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  )
}

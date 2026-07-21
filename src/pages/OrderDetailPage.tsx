import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Button } from '@/components/common/Button'
import { Icon } from '@/components/common/Icon'
import { WhatsAppIcon } from '@/components/common/WhatsAppIcon'
import { Seo } from '@/components/seo/Seo'
import { useI18n } from '@/hooks/useI18n'
import { useAuth } from '@/app/providers/AuthProvider'
import { buildPath } from '@/app/router/routes'
import { getOrderByNo, type OrderDetail } from '@/features/orders/model/get-order'
import { QUOTE_LANGUAGES, DOCUMENT_TYPES } from '@/app/config/pricing.config'
import { whatsappLink } from '@/app/config/site.config'

type StepKey = 'received' | 'in_progress' | 'translated' | 'shipped' | 'delivered'

const DIGITAL_STEPS: StepKey[] = ['received', 'in_progress', 'translated', 'delivered']
const CARGO_STEPS: StepKey[] = ['received', 'in_progress', 'translated', 'shipped']

function addDays(iso: string, days: number): string {
  const d = new Date(iso)
  d.setDate(d.getDate() + (days || 0))
  return d.toISOString()
}

export default function OrderDetailPage() {
  const { locale, dict, formatCurrency, formatDate } = useI18n()
  const o = dict.order
  const { user } = useAuth()
  const params = useParams()
  const raw = (params['*'] ?? '').split('/').pop() ?? ''
  const orderNo = Number.parseInt(raw, 10)

  const [order, setOrder] = useState<OrderDetail | null>(null)
  const [state, setState] = useState<'loading' | 'ok' | 'notfound' | 'error'>('loading')

  useEffect(() => {
    if (!user) return
    if (!Number.isFinite(orderNo)) {
      setState('notfound')
      return
    }
    let active = true
    setState('loading')
    getOrderByNo(orderNo).then((res) => {
      if (!active) return
      if (res.error) setState('error')
      else if (!res.order) setState('notfound')
      else {
        setOrder(res.order)
        setState('ok')
      }
    })
    return () => {
      active = false
    }
  }, [user, orderNo])

  const home = buildPath(locale, 'home')
  const wa = whatsappLink(
    order ? `Merhaba, #${order.order_no} numaralı siparişim hakkında bilgi almak istiyorum.` : 'Merhaba',
  )

  // Giriş yok → giriş iste.
  if (!user) {
    return (
      <>
        <Seo title={o.seo.title} description={o.seo.description} routeId="order" />
        <Shell>
          <Center icon="Lock" title={o.loginRequired.title} desc={o.loginRequired.desc}>
            <Link to={buildPath(locale, 'auth')}>
              <Button intent="secondary" block>{o.loginRequired.login}</Button>
            </Link>
          </Center>
        </Shell>
      </>
    )
  }

  if (state === 'loading') {
    return (
      <>
        <Seo title={o.seo.title} description={o.seo.description} routeId="order" />
        <Shell>
          <p className="py-16 text-center text-sm text-text-secondary">{o.loading}</p>
        </Shell>
      </>
    )
  }

  if (state !== 'ok' || !order) {
    return (
      <>
        <Seo title={o.seo.title} description={o.seo.description} routeId="order" />
        <Shell>
          <Center icon="FileText" title={o.notFound.title} desc={o.notFound.desc}>
            <Link to={home}>
              <Button intent="secondary" block>{o.notFound.home}</Button>
            </Link>
          </Center>
        </Shell>
      </>
    )
  }

  return (
    <>
      <Seo title={o.seo.title} description={o.seo.description} routeId="order" />
      <Shell>
        <OrderView order={order} />
        <div className="mt-6 space-y-2">
          <Link to={buildPath(locale, 'auth')}>
            <Button intent="secondary" block>{o.myOrders}</Button>
          </Link>
          {wa && (
            <a href={wa} target="_blank" rel="noopener noreferrer">
              <Button intent="whatsapp" block><WhatsAppIcon className="size-5" /> {o.whatsapp}</Button>
            </a>
          )}
          <Link to={home}>
            <Button intent="outline" block>{o.backHome}</Button>
          </Link>
        </div>
      </Shell>
    </>
  )

  function OrderView({ order }: { order: OrderDetail }) {
    const cargo = !!order.physical_delivery
    const steps = cargo ? CARGO_STEPS : DIGITAL_STEPS
    const status = order.status as StepKey | 'cancelled'
    const cancelled = status === 'cancelled'
    const currentIndex = cancelled ? -1 : Math.max(0, steps.indexOf(status as StepKey))

    const langLabel = (code: string | null) =>
      (dict.quote.languages as Record<string, string>)[code ?? ''] ??
      QUOTE_LANGUAGES.find((l) => l.code === code)?.labelTr ??
      (code ? code.toUpperCase() : '—')
    const docLabel =
      (dict.quote.documentTypes as Record<string, string>)[order.document_type ?? ''] ??
      DOCUMENT_TYPES.find((d) => d.id === order.document_type)?.labelTr
    const svcName = order.service ? dict.serviceItems[order.service as keyof typeof dict.serviceItems]?.name : undefined

    const estIso = addDays(order.created_at, order.delivery_days ?? 0)
    const cargoIso = addDays(estIso, 2)

    return (
      <>
        {/* Başlık / güncel durum */}
        <div className="text-center">
          <span
            className={
              'mx-auto inline-flex size-14 items-center justify-center rounded-full ' +
              (cancelled ? 'bg-danger/10 text-danger' : 'bg-success/10 text-success')
            }
          >
            <Icon name={cancelled ? 'X' : 'CircleCheck'} className="size-8" />
          </span>
          <h1 className="mt-4 text-2xl font-bold">
            {cancelled ? o.steps.cancelled : o.steps[status as StepKey]}
          </h1>
          <p className="mx-auto mt-2 max-w-md text-sm text-text-secondary">
            {cancelled ? o.stepDesc.cancelled : o.stepDesc[status as StepKey]}
          </p>
          <p className="mt-4 inline-block rounded-md border border-border bg-surface-muted px-4 py-2 text-sm">
            {o.numberLabel}: <span className="font-bold">#{order.order_no}</span>
          </p>
        </div>

        {/* Tarih özeti */}
        <dl className="mt-6 grid gap-3 sm:grid-cols-2">
          <InfoRow label={o.placedOn} value={formatDate(order.created_at)} />
          <InfoRow
            label={cargo ? o.cargoEstimatedLabel : o.estimatedLabel}
            value={formatDate(cargo ? cargoIso : estIso)}
          />
        </dl>

        {/* Zaman çizelgesi */}
        {!cancelled && (
          <div className="mt-8">
            <h2 className="mb-4 text-sm font-bold uppercase tracking-wide text-text-muted">{o.timelineTitle}</h2>
            <ol className="relative space-y-6 border-s border-border ps-6">
              {steps.map((step, i) => {
                const done = i < currentIndex
                const active = i === currentIndex
                return (
                  <li key={step} className="relative">
                    <span
                      className={
                        'absolute -start-[31px] flex size-5 items-center justify-center rounded-full border-2 ' +
                        (done || active
                          ? 'border-secondary bg-secondary text-secondary-foreground'
                          : 'border-border bg-surface text-text-muted')
                      }
                    >
                      {done ? <Icon name="Check" className="size-3" /> : active ? <span className="size-1.5 rounded-full bg-secondary-foreground" /> : null}
                    </span>
                    <p className={active ? 'font-bold' : done ? 'font-medium' : 'font-medium text-text-muted'}>
                      {o.steps[step]}
                    </p>
                    <p className={'text-xs ' + (i <= currentIndex ? 'text-text-secondary' : 'text-text-muted')}>
                      {o.stepDesc[step]}
                    </p>
                  </li>
                )
              })}
            </ol>
          </div>
        )}

        {/* Teslim alanı: kargo takip veya dijital teslim */}
        {!cancelled && (
          <div className="mt-6 rounded-md border border-border bg-surface-muted p-4">
            {cargo ? (
              order.tracking_url ? (
                <>
                  <p className="mb-3 text-sm font-medium">{o.cargoReady}</p>
                  <a href={order.tracking_url} target="_blank" rel="noopener noreferrer">
                    <Button intent="secondary" block>
                      <Icon name="Truck" className="size-5" /> {o.trackCargo}
                    </Button>
                  </a>
                </>
              ) : (
                <p className="flex items-start gap-2 text-sm text-text-secondary">
                  <Icon name="Truck" className="mt-0.5 size-4 shrink-0 text-text-muted" /> {o.cargoPending}
                </p>
              )
            ) : (
              <p className="flex items-start gap-2 text-sm text-text-secondary">
                <Icon name="Mail" className="mt-0.5 size-4 shrink-0 text-text-muted" />
                {currentIndex >= steps.indexOf('delivered') ? o.digitalDelivered : o.digitalPending}
              </p>
            )}
          </div>
        )}

        {/* Sipariş detayları */}
        <div className="mt-6">
          <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-text-muted">{o.detailsTitle}</h2>
          <dl className="divide-y divide-border overflow-hidden rounded-md border border-border text-sm">
            {svcName && <DetailRow label={o.fields.service} value={svcName} />}
            <DetailRow label={o.fields.langs} value={`${langLabel(order.source_lang)} → ${langLabel(order.target_lang)}`} />
            {docLabel && <DetailRow label={o.fields.documentType} value={docLabel} />}
            {order.word_count != null && (
              <DetailRow label={o.fields.words} value={`${order.word_count} ${dict.quote.upload.wordsUnit}`} />
            )}
            <DetailRow label={o.fields.delivery} value={`${order.delivery_days ?? 0} ${dict.quote.result.deliveryUnit}`} />
            {order.total != null && <DetailRow label={o.fields.total} value={formatCurrency(order.total)} strong />}
            {order.note && <DetailRow label={o.fields.note} value={order.note} />}
          </dl>
        </div>
      </>
    )
  }
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <section className="section">
      <div className="mx-auto w-full max-w-2xl rounded-lg border border-border bg-surface p-6 sm:p-8">
        {children}
      </div>
    </section>
  )
}

function Center({
  icon,
  title,
  desc,
  children,
}: {
  icon: 'Lock' | 'FileText'
  title: string
  desc: string
  children: React.ReactNode
}) {
  return (
    <div className="py-8 text-center">
      <span className="mx-auto inline-flex size-14 items-center justify-center rounded-full bg-surface-muted text-text-secondary">
        <Icon name={icon} className="size-7" />
      </span>
      <h1 className="mt-4 text-xl font-bold">{title}</h1>
      <p className="mx-auto mt-2 max-w-sm text-sm text-text-secondary">{desc}</p>
      <div className="mx-auto mt-5 max-w-xs">{children}</div>
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-border bg-surface-muted px-4 py-3">
      <dt className="text-xs text-text-muted">{label}</dt>
      <dd className="mt-0.5 font-semibold">{value}</dd>
    </div>
  )
}

function DetailRow({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-4 bg-surface px-4 py-3">
      <dt className="shrink-0 text-text-secondary">{label}</dt>
      <dd className={'text-end ' + (strong ? 'font-bold' : 'font-medium')}>{value}</dd>
    </div>
  )
}

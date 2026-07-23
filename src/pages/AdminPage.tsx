import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/common/Button'
import { Icon } from '@/components/common/Icon'
import { useI18n } from '@/hooks/useI18n'
import { useAuth } from '@/app/providers/AuthProvider'
import { buildPath } from '@/app/router/routes'
import { isAdminEmail } from '@/app/config/admin.config'
import { supabase } from '@/lib/supabase'
import { cn } from '@/lib/cn'

/* ------------------------------------------------------------------ */
/* Yardımcılar                                                         */
/* ------------------------------------------------------------------ */
function fmt(iso: string): string {
  try {
    return new Date(iso).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' })
  } catch {
    return iso
  }
}
function fmtDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString(undefined, { dateStyle: 'medium' })
  } catch {
    return iso
  }
}
function fmtBytes(n?: number): string {
  if (!n || n <= 0) return '—'
  const u = ['B', 'KB', 'MB', 'GB']
  let i = 0
  let v = n
  while (v >= 1024 && i < u.length - 1) {
    v /= 1024
    i++
  }
  return `${v.toFixed(v < 10 && i > 0 ? 1 : 0)} ${u[i]}`
}
async function adminPost<T>(action: string, body?: Record<string, unknown>): Promise<T | null> {
  try {
    const { data } = await supabase.auth.getSession()
    const token = data.session?.access_token
    if (!token) return null
    const res = await fetch('/api/admin', {
      method: 'POST',
      headers: { 'content-type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ action, ...(body || {}) }),
    })
    if (!res.ok) return null
    return (await res.json()) as T
  } catch {
    return null
  }
}

/* ------------------------------------------------------------------ */
/* Sayfa                                                               */
/* ------------------------------------------------------------------ */
type Tab = 'chats' | 'customers' | 'uploads'

export default function AdminPage() {
  const { locale, dict } = useI18n()
  const a = dict.admin
  const h = dict.adminHub
  const { user, loading: authLoading } = useAuth()
  const admin = isAdminEmail(user?.email)
  const [tab, setTab] = useState<Tab>('chats')

  useEffect(() => {
    const meta = document.createElement('meta')
    meta.name = 'robots'
    meta.content = 'noindex, nofollow'
    document.head.appendChild(meta)
    document.title = a.title
    return () => {
      document.head.removeChild(meta)
    }
  }, [a.title])

  if (authLoading) {
    return <Shell><p className="py-16 text-center text-sm text-text-secondary">{a.loadingAuth}</p></Shell>
  }
  if (!user) {
    return (
      <Shell>
        <Center icon="Lock" title={a.loginTitle} desc={a.loginDesc}>
          <Link to={`${buildPath(locale, 'auth')}?next=${encodeURIComponent(window.location.pathname)}`}><Button intent="secondary" block>{a.login}</Button></Link>
        </Center>
      </Shell>
    )
  }
  if (!admin) {
    return <Shell><Center icon="Lock" title={a.noAccessTitle} desc={a.noAccessDesc} /></Shell>
  }

  const tabs: { key: Tab; label: string }[] = [
    { key: 'chats', label: h.tabChats },
    { key: 'customers', label: h.tabCustomers },
    { key: 'uploads', label: h.tabUploads },
  ]

  return (
    <Shell wide>
      <h1 className="mb-4 text-2xl font-bold">{a.title}</h1>
      <div className="mb-6 flex flex-wrap gap-2 border-b border-border">
        {tabs.map((x) => (
          <button
            key={x.key}
            type="button"
            onClick={() => setTab(x.key)}
            className={cn(
              '-mb-px border-b-2 px-4 py-2.5 text-sm font-medium transition-colors',
              tab === x.key ? 'border-secondary text-text-primary' : 'border-transparent text-text-secondary hover:text-text-primary',
            )}
          >
            {x.label}
          </button>
        ))}
      </div>

      {tab === 'chats' && <ChatbotSection a={a} dict={dict} />}
      {tab === 'customers' && <CustomersSection h={h} />}
      {tab === 'uploads' && <UploadsSection h={h} />}
    </Shell>
  )
}

/* ------------------------------------------------------------------ */
/* Sekme 1: Chatbot sohbetleri                                         */
/* ------------------------------------------------------------------ */
interface ChatAttachment { kind: 'image' | 'doc'; dataUrl?: string; name?: string; text?: string }
interface ChatMsg { role: string; content: string; attachment?: ChatAttachment }
interface Conversation {
  id: string; created_at: string; updated_at: string; locale: string | null
  wants_contact: boolean; lead_name: string | null; lead_email: string | null
  lead_phone: string | null; lead_message: string | null; messages: ChatMsg[]
}
const CHAT_COLS = 'id, created_at, updated_at, locale, wants_contact, lead_name, lead_email, lead_phone, lead_message, messages'

function ChatbotSection({ a, dict }: { a: any; dict: any }) {
  const [rows, setRows] = useState<Conversation[]>([])
  const [state, setState] = useState<'idle' | 'loading' | 'error'>('loading')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [onlyLeads, setOnlyLeads] = useState(false)

  useEffect(() => {
    let active = true
    setState('loading')
    supabase
      .from('chat_conversations')
      .select(CHAT_COLS)
      .order('updated_at', { ascending: false })
      .limit(300)
      .then(({ data, error }) => {
        if (!active) return
        if (error) return setState('error')
        setRows((data ?? []) as Conversation[])
        setState('idle')
      })
    return () => { active = false }
  }, [])

  const leadsCount = useMemo(() => rows.filter((r) => r.wants_contact).length, [rows])
  const list = useMemo(() => (onlyLeads ? rows.filter((r) => r.wants_contact) : rows), [rows, onlyLeads])
  const selected = useMemo(() => rows.find((r) => r.id === selectedId) ?? null, [rows, selectedId])

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-text-secondary">{a.summary.replace('{total}', String(rows.length)).replace('{leads}', String(leadsCount))}</p>
        <label className="inline-flex cursor-pointer items-center gap-2 text-sm">
          <input type="checkbox" checked={onlyLeads} onChange={(e) => setOnlyLeads(e.target.checked)} className="size-4" />
          {a.onlyLeads}
        </label>
      </div>
      {state === 'loading' && <p className="py-10 text-center text-sm text-text-secondary">{a.loading}</p>}
      {state === 'error' && <p className="rounded-md border border-danger/40 bg-danger/10 p-4 text-sm text-danger">{a.error}</p>}
      {state === 'idle' && list.length === 0 && <p className="py-10 text-center text-sm text-text-secondary">{a.empty}</p>}
      {state === 'idle' && list.length > 0 && (
        <div className="grid gap-4 md:grid-cols-[340px_1fr]">
          <div className={cn('space-y-2 md:max-h-[70vh] md:overflow-y-auto md:pe-1', selected && 'hidden md:block')}>
            {list.map((r) => {
              const fu = r.messages?.find((m) => m.role === 'user')
              const firstUser = fu?.content || (fu?.attachment ? (fu.attachment.kind === 'image' ? a.attachmentImage : fu.attachment.name || a.attachmentFile) : undefined)
              return (
                <button key={r.id} type="button" onClick={() => setSelectedId(r.id)}
                  className={'w-full rounded-md border p-3 text-start transition-colors ' + (selectedId === r.id ? 'border-secondary bg-surface-muted' : 'border-border bg-surface hover:bg-surface-muted')}>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-medium text-text-muted">{fmt(r.updated_at)}</span>
                    <span className="flex items-center gap-1.5">
                      {r.locale && <span className="rounded bg-surface-muted px-1.5 py-0.5 text-[10px] uppercase text-text-secondary">{r.locale}</span>}
                      {r.wants_contact && <span className="rounded bg-success/15 px-1.5 py-0.5 text-[10px] font-medium text-success">{a.requestBadge}</span>}
                    </span>
                  </div>
                  <p className="mt-1 truncate text-sm text-text-primary">{r.lead_name || firstUser || '—'}</p>
                </button>
              )
            })}
          </div>
          <div className={cn('rounded-md border border-border bg-surface p-4', !selected && 'hidden md:block')}>
            {!selected ? (
              <p className="py-16 text-center text-sm text-text-muted">{a.selectHint}</p>
            ) : (
              <div className="space-y-4">
                <button type="button" onClick={() => setSelectedId(null)} className="-mt-1 mb-1 inline-flex items-center gap-1 text-sm font-medium text-text-secondary hover:text-text-primary md:hidden">
                  <Icon name="ArrowRight" className="size-4 rotate-180" /> {dict.chatbot.contact.back}
                </button>
                <div className="flex flex-wrap items-center gap-2 text-xs text-text-muted">
                  <span>{fmt(selected.created_at)}</span>
                  {selected.locale && <span className="rounded bg-surface-muted px-1.5 py-0.5 uppercase">{selected.locale}</span>}
                  <span className="text-text-muted/70">#{selected.id.slice(0, 8)}</span>
                </div>
                {(selected.lead_name || selected.lead_email || selected.lead_phone) && (
                  <div className={'rounded-md border p-3 text-sm ' + (selected.wants_contact ? 'border-success/40 bg-success/10' : 'border-border bg-surface-muted')}>
                    <p className={'mb-1 font-semibold ' + (selected.wants_contact ? 'text-success' : 'text-text-primary')}>{selected.wants_contact ? a.contactRequest : a.contactInfo}</p>
                    <dl className="space-y-0.5 text-text-primary">
                      {selected.lead_name && <div><span className="text-text-secondary">{a.fieldName}: </span>{selected.lead_name}</div>}
                      {selected.lead_email && <div><span className="text-text-secondary">{a.fieldEmail}: </span><a className="underline" href={`mailto:${selected.lead_email}`}>{selected.lead_email}</a></div>}
                      {selected.lead_phone && <div><span className="text-text-secondary">{a.fieldPhone}: </span><a className="underline" href={`tel:${selected.lead_phone.replace(/[^\d+]/g, '')}`}>{selected.lead_phone}</a></div>}
                      {selected.lead_message && <div><span className="text-text-secondary">{a.fieldMessage}: </span>{selected.lead_message}</div>}
                    </dl>
                  </div>
                )}
                <div className="space-y-2">
                  {(selected.messages ?? []).map((m, i) => (
                    <div key={i} className={'flex max-w-[85%] flex-col rounded-2xl px-3.5 py-2 text-sm ' + (m.role === 'user' ? 'ms-auto bg-secondary text-secondary-foreground' : 'me-auto border border-border bg-surface-muted text-text-primary')}>
                      {m.attachment?.kind === 'image' && m.attachment.dataUrl && (
                        <a href={m.attachment.dataUrl} target="_blank" rel="noopener noreferrer" className="mb-1.5 block">
                          <img src={m.attachment.dataUrl} alt={a.attachmentImage} className="max-h-56 w-auto rounded-lg border border-white/25" />
                        </a>
                      )}
                      {m.attachment?.kind === 'doc' && (
                        <div className="mb-1.5">
                          <span className="mb-1 flex w-fit max-w-full items-center gap-1.5 rounded-lg bg-white/15 px-2 py-1 text-xs">
                            <Icon name="FileText" className="size-3.5 shrink-0" />
                            <span className="max-w-[220px] truncate">{m.attachment.name || a.attachmentFile}</span>
                          </span>
                          {m.attachment.text && <pre className="max-h-40 overflow-auto whitespace-pre-wrap rounded-md bg-black/25 p-2 text-xs leading-relaxed">{m.attachment.text}</pre>}
                        </div>
                      )}
                      {m.content && <span className="whitespace-pre-wrap">{m.content}</span>}
                    </div>
                  ))}
                  {(!selected.messages || selected.messages.length === 0) && <p className="text-sm text-text-muted">{a.noMessages}</p>}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}

/* ------------------------------------------------------------------ */
/* Sekme 2: Müşteri kayıtları                                          */
/* ------------------------------------------------------------------ */
interface Customer {
  id: string; name: string; email: string; phone: string
  createdAt: string; orderCount: number; orderTotal: number; lastOrder: string
}
interface CustOrder {
  order_no: number; created_at: string; status: string; service: string
  source_lang: string; target_lang: string; word_count: number; total: number
  contact_name?: string; contact_email?: string; contact_phone?: string
}
interface CustDetail {
  user: { id: string; name: string; email: string; phone: string; createdAt: string } | null
  orders: CustOrder[]
}

function CustomersSection({ h }: { h: any }) {
  const { formatCurrency } = useI18n()
  const [rows, setRows] = useState<Customer[]>([])
  const [state, setState] = useState<'loading' | 'idle' | 'error'>('loading')
  const [q, setQ] = useState('')
  const [sel, setSel] = useState<Customer | null>(null)
  const [detail, setDetail] = useState<CustDetail | null>(null)
  const [detailState, setDetailState] = useState<'idle' | 'loading'>('idle')

  useEffect(() => {
    let active = true
    setState('loading')
    adminPost<{ customers: Customer[] }>('customers').then((d) => {
      if (!active) return
      if (!d) return setState('error')
      setRows(d.customers || [])
      setState('idle')
    })
    return () => { active = false }
  }, [])

  const list = useMemo(() => {
    const s = q.trim().toLowerCase()
    if (!s) return rows
    return rows.filter((r) => (r.name + ' ' + r.email + ' ' + r.phone).toLowerCase().includes(s))
  }, [rows, q])

  const openCustomer = (c: Customer) => {
    setSel(c)
    setDetail(null)
    setDetailState('loading')
    adminPost<CustDetail>('customerDetail', { userId: c.id }).then((d) => {
      setDetail(d ?? { user: null, orders: [] })
      setDetailState('idle')
    })
  }

  if (state === 'loading') return <p className="py-10 text-center text-sm text-text-secondary">{h.loading}</p>
  if (state === 'error') return <p className="rounded-md border border-danger/40 bg-danger/10 p-4 text-sm text-danger">{h.loadError}</p>

  // Detay görünümü
  if (sel) {
    return (
      <div>
        <button type="button" onClick={() => setSel(null)} className="mb-4 inline-flex items-center gap-1 text-sm font-medium text-text-secondary hover:text-text-primary">
          <Icon name="ArrowRight" className="size-4 rotate-180" /> {h.back}
        </button>
        <div className="rounded-lg border border-border bg-surface p-5">
          <h2 className="text-lg font-bold">{sel.name || h.upGuest}</h2>
          <dl className="mt-3 grid gap-1.5 text-sm sm:grid-cols-2">
            <div><span className="text-text-secondary">{h.custEmail}: </span><a className="underline" href={`mailto:${sel.email}`}>{sel.email || '—'}</a></div>
            <div><span className="text-text-secondary">{h.custPhone}: </span>{sel.phone ? <a className="underline" href={`tel:${sel.phone.replace(/[^\d+]/g, '')}`} dir="ltr">{sel.phone}</a> : '—'}</div>
            <div><span className="text-text-secondary">{h.custJoined}: </span>{sel.createdAt ? fmtDate(sel.createdAt) : '—'}</div>
            <div><span className="text-text-secondary">{h.custTotal}: </span>{formatCurrency(sel.orderTotal)}</div>
          </dl>
        </div>

        <h3 className="mb-2 mt-6 text-sm font-bold">{h.custOrderList} ({sel.orderCount})</h3>
        {detailState === 'loading' && <p className="py-6 text-center text-sm text-text-secondary">{h.loading}</p>}
        {detailState === 'idle' && (!detail || detail.orders.length === 0) && (
          <p className="py-6 text-center text-sm text-text-secondary">{h.custNoOrders}</p>
        )}
        {detailState === 'idle' && detail && detail.orders.length > 0 && (
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full min-w-[560px] text-sm">
              <thead className="bg-surface-muted text-text-secondary">
                <tr>
                  <th className="px-3 py-2 text-start font-medium">{h.orderNo}</th>
                  <th className="px-3 py-2 text-start font-medium">{h.orderDate}</th>
                  <th className="px-3 py-2 text-start font-medium">{h.orderStatus}</th>
                  <th className="px-3 py-2 text-start font-medium">{h.custOrders}</th>
                  <th className="px-3 py-2 text-end font-medium">{h.custTotal}</th>
                </tr>
              </thead>
              <tbody>
                {detail.orders.map((o) => (
                  <tr key={o.order_no} className="border-t border-border">
                    <td className="px-3 py-2 font-medium">#{o.order_no}</td>
                    <td className="px-3 py-2 text-text-secondary">{fmtDate(o.created_at)}</td>
                    <td className="px-3 py-2">{o.status}</td>
                    <td className="px-3 py-2 text-text-secondary" dir="ltr">{o.source_lang}→{o.target_lang}</td>
                    <td className="px-3 py-2 text-end font-medium">{formatCurrency(Number(o.total) || 0)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    )
  }

  // Liste görünümü
  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-text-secondary">{h.custHint}</p>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={h.custSearch}
          className="h-10 w-full max-w-xs rounded-md border border-border bg-surface px-3 text-sm outline-none focus:border-border-strong"
        />
      </div>
      {list.length === 0 ? (
        <p className="py-10 text-center text-sm text-text-secondary">{h.custNone}</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full min-w-[640px] text-sm">
            <thead className="bg-surface-muted text-text-secondary">
              <tr>
                <th className="px-3 py-2 text-start font-medium">{h.custName}</th>
                <th className="px-3 py-2 text-start font-medium">{h.custEmail}</th>
                <th className="px-3 py-2 text-start font-medium">{h.custPhone}</th>
                <th className="px-3 py-2 text-center font-medium">{h.custOrders}</th>
                <th className="px-3 py-2 text-end font-medium">{h.custTotal}</th>
              </tr>
            </thead>
            <tbody>
              {list.map((c) => (
                <tr key={c.id} className="cursor-pointer border-t border-border hover:bg-surface-muted" onClick={() => openCustomer(c)}>
                  <td className="px-3 py-2 font-medium">{c.name || h.upGuest}</td>
                  <td className="px-3 py-2 text-text-secondary">{c.email || '—'}</td>
                  <td className="px-3 py-2 text-text-secondary" dir="ltr">{c.phone || '—'}</td>
                  <td className="px-3 py-2 text-center">{c.orderCount}</td>
                  <td className="px-3 py-2 text-end font-medium">{formatCurrency(c.orderTotal)}</td>
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
/* Sekme 3: Yüklenen dosyalar (fiyat sayfası arşivi)                   */
/* ------------------------------------------------------------------ */
interface Upload {
  id: string; fileName: string; size?: number; mime?: string; words?: number
  locale?: string; createdAt: string; uploaderName: string; uploaderEmail: string; url: string | null
}
function UploadsSection({ h }: { h: any }) {
  const [rows, setRows] = useState<Upload[]>([])
  const [state, setState] = useState<'loading' | 'idle' | 'error'>('loading')

  useEffect(() => {
    let active = true
    setState('loading')
    adminPost<{ uploads: Upload[] }>('uploads').then((d) => {
      if (!active) return
      if (!d) return setState('error')
      setRows(d.uploads || [])
      setState('idle')
    })
    return () => { active = false }
  }, [])

  if (state === 'loading') return <p className="py-10 text-center text-sm text-text-secondary">{h.loading}</p>
  if (state === 'error') return <p className="rounded-md border border-danger/40 bg-danger/10 p-4 text-sm text-danger">{h.loadError}</p>

  return (
    <div>
      <p className="mb-4 text-sm text-text-secondary">{h.upHint}</p>
      {rows.length === 0 ? (
        <p className="py-10 text-center text-sm text-text-secondary">{h.upNone}</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full min-w-[720px] text-sm">
            <thead className="bg-surface-muted text-text-secondary">
              <tr>
                <th className="px-3 py-2 text-start font-medium">{h.upFile}</th>
                <th className="px-3 py-2 text-start font-medium">{h.upUploader}</th>
                <th className="px-3 py-2 text-start font-medium">{h.upWhen}</th>
                <th className="px-3 py-2 text-center font-medium">{h.upWords}</th>
                <th className="px-3 py-2 text-center font-medium">{h.upSize}</th>
                <th className="px-3 py-2 text-end font-medium">{h.upDownload}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((u) => (
                <tr key={u.id} className="border-t border-border align-top">
                  <td className="px-3 py-2">
                    <span className="flex items-center gap-1.5">
                      <Icon name="FileText" className="size-4 shrink-0 text-text-muted" />
                      <span className="max-w-[240px] truncate font-medium" title={u.fileName}>{u.fileName}</span>
                    </span>
                  </td>
                  <td className="px-3 py-2">
                    {u.uploaderName || u.uploaderEmail ? (
                      <span>
                        {u.uploaderName && <span className="block">{u.uploaderName}</span>}
                        {u.uploaderEmail && <a className="block text-xs text-text-secondary underline" href={`mailto:${u.uploaderEmail}`}>{u.uploaderEmail}</a>}
                      </span>
                    ) : (
                      <span className="text-text-muted">{h.upGuest}</span>
                    )}
                  </td>
                  <td className="px-3 py-2 text-text-secondary">{fmt(u.createdAt)}</td>
                  <td className="px-3 py-2 text-center">{u.words != null ? u.words : '—'}</td>
                  <td className="px-3 py-2 text-center text-text-secondary">{fmtBytes(u.size)}</td>
                  <td className="px-3 py-2 text-end">
                    {u.url ? (
                      <a href={u.url} target="_blank" rel="noopener noreferrer" className="font-medium text-secondary underline">{h.upDownload}</a>
                    ) : (
                      <span className="text-text-muted">—</span>
                    )}
                  </td>
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
function Shell({ children, wide }: { children: React.ReactNode; wide?: boolean }) {
  return (
    <section className="section">
      <div className={'mx-auto w-full px-4 sm:px-6 ' + (wide ? 'max-w-5xl' : 'max-w-2xl')}>{children}</div>
    </section>
  )
}

function Center({ icon, title, desc, children }: { icon: 'Lock'; title: string; desc: string; children?: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-border bg-surface p-8 text-center">
      <span className="mx-auto inline-flex size-14 items-center justify-center rounded-full bg-surface-muted text-text-secondary">
        <Icon name={icon} className="size-7" />
      </span>
      <h1 className="mt-4 text-xl font-bold">{title}</h1>
      <p className="mx-auto mt-2 max-w-sm text-sm text-text-secondary">{desc}</p>
      {children && <div className="mx-auto mt-5 max-w-xs">{children}</div>}
    </div>
  )
}

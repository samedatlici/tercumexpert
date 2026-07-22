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

interface ChatAttachment {
  kind: 'image' | 'doc'
  dataUrl?: string
  name?: string
  text?: string
}
interface ChatMsg {
  role: string
  content: string
  attachment?: ChatAttachment
}
interface Conversation {
  id: string
  created_at: string
  updated_at: string
  locale: string | null
  wants_contact: boolean
  lead_name: string | null
  lead_email: string | null
  lead_phone: string | null
  lead_message: string | null
  messages: ChatMsg[]
}

const COLUMNS =
  'id, created_at, updated_at, locale, wants_contact, lead_name, lead_email, lead_phone, lead_message, messages'

function fmt(iso: string): string {
  try {
    return new Date(iso).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' })
  } catch {
    return iso
  }
}

export default function AdminPage() {
  const { locale, dict } = useI18n()
  const a = dict.admin
  const { user, loading: authLoading } = useAuth()
  const admin = isAdminEmail(user?.email)

  const [rows, setRows] = useState<Conversation[]>([])
  const [state, setState] = useState<'idle' | 'loading' | 'error'>('idle')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [onlyLeads, setOnlyLeads] = useState(false)

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

  useEffect(() => {
    if (!admin) return
    let active = true
    setState('loading')
    supabase
      .from('chat_conversations')
      .select(COLUMNS)
      .order('updated_at', { ascending: false })
      .limit(300)
      .then(({ data, error }) => {
        if (!active) return
        if (error) {
          setState('error')
          return
        }
        setRows((data ?? []) as Conversation[])
        setState('idle')
      })
    return () => {
      active = false
    }
  }, [admin])

  const leadsCount = useMemo(() => rows.filter((r) => r.wants_contact).length, [rows])
  const list = useMemo(() => (onlyLeads ? rows.filter((r) => r.wants_contact) : rows), [rows, onlyLeads])
  const selected = useMemo(() => rows.find((r) => r.id === selectedId) ?? null, [rows, selectedId])

  if (authLoading) {
    return <Shell><p className="py-16 text-center text-sm text-text-secondary">{a.loadingAuth}</p></Shell>
  }

  if (!user) {
    return (
      <Shell>
        <Center icon="Lock" title={a.loginTitle} desc={a.loginDesc}>
          <Link to={buildPath(locale, 'auth')}><Button intent="secondary" block>{a.login}</Button></Link>
        </Center>
      </Shell>
    )
  }

  if (!admin) {
    return (
      <Shell>
        <Center icon="Lock" title={a.noAccessTitle} desc={a.noAccessDesc} />
      </Shell>
    )
  }

  const summary = a.summary.replace('{total}', String(rows.length)).replace('{leads}', String(leadsCount))

  return (
    <Shell wide>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">{a.title}</h1>
          <p className="mt-1 text-sm text-text-secondary">{summary}</p>
        </div>
        <label className="inline-flex cursor-pointer items-center gap-2 text-sm">
          <input type="checkbox" checked={onlyLeads} onChange={(e) => setOnlyLeads(e.target.checked)} className="size-4" />
          {a.onlyLeads}
        </label>
      </div>

      {state === 'loading' && <p className="py-10 text-center text-sm text-text-secondary">{a.loading}</p>}
      {state === 'error' && (
        <p className="rounded-md border border-danger/40 bg-danger/10 p-4 text-sm text-danger">{a.error}</p>
      )}

      {state === 'idle' && list.length === 0 && (
        <p className="py-10 text-center text-sm text-text-secondary">{a.empty}</p>
      )}

      {state === 'idle' && list.length > 0 && (
        <div className="grid gap-4 md:grid-cols-[340px_1fr]">
          <div className={cn('space-y-2 md:max-h-[70vh] md:overflow-y-auto md:pe-1', selected && 'hidden md:block')}>
            {list.map((r) => {
              const firstUserMsg = r.messages?.find((m) => m.role === 'user')
              const firstUser =
                firstUserMsg?.content ||
                (firstUserMsg?.attachment
                  ? firstUserMsg.attachment.kind === 'image'
                    ? a.attachmentImage
                    : firstUserMsg.attachment.name || a.attachmentFile
                  : undefined)
              return (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => setSelectedId(r.id)}
                  className={
                    'w-full rounded-md border p-3 text-start transition-colors ' +
                    (selectedId === r.id ? 'border-secondary bg-surface-muted' : 'border-border bg-surface hover:bg-surface-muted')
                  }
                >
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
                <button
                  type="button"
                  onClick={() => setSelectedId(null)}
                  className="-mt-1 mb-1 inline-flex items-center gap-1 text-sm font-medium text-text-secondary hover:text-text-primary md:hidden"
                >
                  <Icon name="ArrowRight" className="size-4 rotate-180" /> {dict.chatbot.contact.back}
                </button>
                <div className="flex flex-wrap items-center gap-2 text-xs text-text-muted">
                  <span>{fmt(selected.created_at)}</span>
                  {selected.locale && <span className="rounded bg-surface-muted px-1.5 py-0.5 uppercase">{selected.locale}</span>}
                  <span className="text-text-muted/70">#{selected.id.slice(0, 8)}</span>
                </div>

                {(selected.lead_name || selected.lead_email || selected.lead_phone) && (
                  <div className={'rounded-md border p-3 text-sm ' + (selected.wants_contact ? 'border-success/40 bg-success/10' : 'border-border bg-surface-muted')}>
                    <p className={'mb-1 font-semibold ' + (selected.wants_contact ? 'text-success' : 'text-text-primary')}>
                      {selected.wants_contact ? a.contactRequest : a.contactInfo}
                    </p>
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
                    <div
                      key={i}
                      className={
                        'flex max-w-[85%] flex-col rounded-2xl px-3.5 py-2 text-sm ' +
                        (m.role === 'user' ? 'ms-auto bg-secondary text-secondary-foreground' : 'me-auto border border-border bg-surface-muted text-text-primary')
                      }
                    >
                      {m.attachment?.kind === 'image' && m.attachment.dataUrl && (
                        <a href={m.attachment.dataUrl} target="_blank" rel="noopener noreferrer" className="mb-1.5 block">
                          <img
                            src={m.attachment.dataUrl}
                            alt={a.attachmentImage}
                            className="max-h-56 w-auto rounded-lg border border-white/25"
                          />
                        </a>
                      )}
                      {m.attachment?.kind === 'doc' && (
                        <div className="mb-1.5">
                          <span className="mb-1 flex w-fit max-w-full items-center gap-1.5 rounded-lg bg-white/15 px-2 py-1 text-xs">
                            <Icon name="FileText" className="size-3.5 shrink-0" />
                            <span className="max-w-[220px] truncate">{m.attachment.name || a.attachmentFile}</span>
                          </span>
                          {m.attachment.text && (
                            <pre className="max-h-40 overflow-auto whitespace-pre-wrap rounded-md bg-black/25 p-2 text-xs leading-relaxed">
                              {m.attachment.text}
                            </pre>
                          )}
                        </div>
                      )}
                      {m.content && <span className="whitespace-pre-wrap">{m.content}</span>}
                    </div>
                  ))}
                  {(!selected.messages || selected.messages.length === 0) && (
                    <p className="text-sm text-text-muted">{a.noMessages}</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </Shell>
  )
}

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

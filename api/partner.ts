import { buildPartnerVerify, sendEmail } from './_email'
import { computePartnerShare } from './_pool-logic'

/**
 * Partner (İş Ortağı) SUNUCU uç noktası (Edge). GÜVENLİK: hassas alanlar (status,
 * iban_verified, email_verified) ve referral atıfları yalnızca burada (service role)
 * değişir. Her istek çağıranın Supabase erişim jetonuyla doğrulanır.
 *
 * Faz 1 eylemleri:
 *  - attribute      : davet koduyla gelen YENİ üyeyi partnere bağlar (kalıcı, ilk üyelikte).
 *  - emailSendCode  : partner e-postasına markalı doğrulama kodu gönderir.
 *  - emailVerify    : kodu doğrular → partners.email_verified = true.
 */
export const config = { runtime: 'edge' }

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://xtqymenxaozzwmqfssod.supabase.co'
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || 'admin@tercumexpert.com').toLowerCase()
const CODE_TTL_MS = 15 * 60 * 1000

function svcHeaders(extra?: Record<string, string>): Record<string, string> {
  return { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}`, ...(extra ?? {}) }
}
function json(obj: unknown, status = 200): Response {
  return new Response(JSON.stringify(obj), { status, headers: { 'content-type': 'application/json' } })
}
/** Erişim jetonundan kullanıcıyı doğrular. */
async function getUser(token: string): Promise<{ id: string; email: string } | null> {
  try {
    const res = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
      headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${token}` },
    })
    if (!res.ok) return null
    const u = (await res.json()) as { id?: string; email?: string }
    return u?.id ? { id: u.id, email: (u.email || '').toLowerCase() } : null
  } catch {
    return null
  }
}
interface PartnerRow {
  id: string
  user_id: string
  email: string | null
  contact_name: string | null
  status: string
}
async function getPartner(userId: string): Promise<PartnerRow | null> {
  const r = await fetch(
    `${SUPABASE_URL}/rest/v1/partners?user_id=eq.${userId}&select=id,user_id,email,contact_name,status`,
    { headers: svcHeaders() },
  )
  if (!r.ok) return null
  const rows = (await r.json()) as PartnerRow[]
  return rows[0] ?? null
}
function gen6(): string {
  return String(Math.floor(100000 + Math.random() * 900000))
}

const LOCK_MS = 7 * 24 * 60 * 60 * 1000 // kazanç 7 gün kilitli, sonra çekilebilir

interface LedgerRow { amount: number | string; status: string; created_at: string; paid_at: string | null; orders?: { order_no?: number } | null }
/** partner_ledger satırlarından cüzdan özeti (translator computeWallet ile aynı). */
function computeWallet(rows: LedgerRow[]) {
  const now = Date.now()
  let total = 0, locked = 0, withdrawable = 0, paid = 0
  const entries = []
  for (const e of rows) {
    const amt = Number(e.amount) || 0
    total += amt
    const unlocked = now - new Date(e.created_at).getTime() >= LOCK_MS
    if (e.status === 'paid') paid += amt
    else if (unlocked) withdrawable += amt
    else locked += amt
    entries.push({
      amount: Math.round(amt), status: e.status, created_at: e.created_at,
      paid_at: e.paid_at ?? null, order_no: e.orders?.order_no ?? null,
      unlocked: e.status !== 'paid' && unlocked,
    })
  }
  return { total: Math.round(total), locked: Math.round(locked), withdrawable: Math.round(withdrawable), paid: Math.round(paid), entries }
}

interface AuthUser { id: string; email?: string; phone?: string; created_at?: string; user_metadata?: Record<string, unknown> }
async function listAuthUsers(): Promise<AuthUser[]> {
  const out: AuthUser[] = []
  for (let page = 1; page <= 10; page++) {
    const r = await fetch(`${SUPABASE_URL}/auth/v1/admin/users?page=${page}&per_page=200`, { headers: svcHeaders() })
    if (!r.ok) break
    const d = (await r.json()) as { users?: AuthUser[] }
    const users = d.users ?? []
    out.push(...users)
    if (users.length < 200) break
  }
  return out
}
function nameOf(u: AuthUser): string {
  const m = u.user_metadata || {}
  const full = (m.full_name as string) || ''
  if (full.trim()) return full.trim()
  return `${(m.first_name as string) || ''} ${(m.last_name as string) || ''}`.trim()
}
function phoneOf(u: AuthUser): string {
  const m = u.user_metadata || {}
  return (m.phone as string) || u.phone || ''
}
/** Çağıranın ONAYLI partner kaydı (yoksa null). */
async function getApprovedPartner(userId: string): Promise<PartnerRow | null> {
  const p = await getPartner(userId)
  return p && p.status === 'approved' ? p : null
}
/** Bir partnerin getirdiği (referral) üye id'leri. */
async function referredUserIds(partnerId: string): Promise<Array<{ user_id: string; created_at: string }>> {
  const r = await fetch(
    `${SUPABASE_URL}/rest/v1/partner_referrals?partner_id=eq.${partnerId}&select=user_id,created_at`,
    { headers: svcHeaders() },
  )
  if (!r.ok) return []
  return (await r.json()) as Array<{ user_id: string; created_at: string }>
}

export default async function handler(req: Request): Promise<Response> {
  if (req.method !== 'POST') return json({ error: 'method' }, 405)
  if (!SERVICE_KEY) return json({ error: 'server_config' }, 200)

  const token = (req.headers.get('authorization') || '').replace(/^Bearer\s+/i, '').trim()
  if (!token) return json({ error: 'auth' }, 401)
  const user = await getUser(token)
  if (!user) return json({ error: 'auth' }, 401)

  let body: { action?: string; ref?: string; email?: string; code?: string; locale?: string }
  try {
    body = await req.json()
  } catch {
    return json({ error: 'bad_json' }, 400)
  }
  const action = body.action

  // ---------- Referral atıfı (davet koduyla gelen üye → partner) ----------
  if (action === 'attribute') {
    const ref = String(body.ref || '').trim().toUpperCase()
    if (!ref) return json({ ok: false, reason: 'invalid' })
    // Kod onaylı bir partnere mi ait?
    const pr = await fetch(
      `${SUPABASE_URL}/rest/v1/partners?ref_code=eq.${encodeURIComponent(ref)}&status=eq.approved&select=id,user_id`,
      { headers: svcHeaders() },
    )
    if (!pr.ok) return json({ ok: false, reason: 'invalid' })
    const partner = ((await pr.json()) as Array<{ id: string; user_id: string }>)[0]
    if (!partner) return json({ ok: false, reason: 'invalid' })
    if (partner.user_id === user.id) return json({ ok: false, reason: 'self' })
    // Zaten atanmış mı? (ilk üyelik kalıcı)
    const ex = await fetch(
      `${SUPABASE_URL}/rest/v1/partner_referrals?user_id=eq.${user.id}&select=user_id`,
      { headers: svcHeaders() },
    )
    if (ex.ok && ((await ex.json()) as unknown[]).length) return json({ ok: true, already: true })
    // Atıfı ekle (çakışmayı yok say → idempotent).
    await fetch(`${SUPABASE_URL}/rest/v1/partner_referrals`, {
      method: 'POST',
      headers: svcHeaders({ 'content-type': 'application/json', Prefer: 'resolution=ignore-duplicates' }),
      body: JSON.stringify({ user_id: user.id, partner_id: partner.id }),
    })
    return json({ ok: true })
  }

  // ---------- E-posta doğrulama kodu gönder ----------
  if (action === 'emailSendCode') {
    const partner = await getPartner(user.id)
    if (!partner) return json({ error: 'no_partner' }, 404)
    const target = (String(body.email || '').trim() || partner.email || user.email || '').trim()
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(target)) return json({ ok: false, reason: 'email' })
    const code = gen6()
    const expires = new Date(Date.now() + CODE_TTL_MS).toISOString()
    // upsert (user_id PK) → tek aktif kod.
    const up = await fetch(`${SUPABASE_URL}/rest/v1/partner_email_codes`, {
      method: 'POST',
      headers: svcHeaders({ 'content-type': 'application/json', Prefer: 'resolution=merge-duplicates' }),
      body: JSON.stringify({ user_id: user.id, code, email: target, expires_at: expires }),
    })
    if (!up.ok) return json({ ok: false, reason: 'store' })
    const mail = buildPartnerVerify(body.locale || 'tr', partner.contact_name || '', code)
    await sendEmail(target, mail.subject, mail.html)
    return json({ ok: true })
  }

  // ---------- E-posta doğrulama kodunu onayla ----------
  if (action === 'emailVerify') {
    const code = String(body.code || '').trim()
    if (!code) return json({ ok: false, reason: 'code' })
    const r = await fetch(
      `${SUPABASE_URL}/rest/v1/partner_email_codes?user_id=eq.${user.id}&select=code,email,expires_at`,
      { headers: svcHeaders() },
    )
    if (!r.ok) return json({ ok: false, reason: 'store' })
    const row = ((await r.json()) as Array<{ code: string; email: string; expires_at: string }>)[0]
    if (!row) return json({ ok: false, reason: 'expired' })
    if (new Date(row.expires_at).getTime() < Date.now()) return json({ ok: false, reason: 'expired' })
    if (row.code !== code) return json({ ok: false, reason: 'mismatch' })
    // Doğrulandı → email_verified=true (service role → koruma tetikleyicisi izin verir).
    const patch = await fetch(`${SUPABASE_URL}/rest/v1/partners?user_id=eq.${user.id}`, {
      method: 'PATCH',
      headers: svcHeaders({ 'content-type': 'application/json', Prefer: 'return=minimal' }),
      body: JSON.stringify({ email_verified: true, email: row.email }),
    })
    if (!patch.ok) return json({ ok: false, reason: 'update' })
    await fetch(`${SUPABASE_URL}/rest/v1/partner_email_codes?user_id=eq.${user.id}`, {
      method: 'DELETE',
      headers: svcHeaders(),
    })
    return json({ ok: true })
  }

  // ---------- Müşterilerim (partnerin getirdiği üyeler) ----------
  if (action === 'customers') {
    const partner = await getApprovedPartner(user.id)
    if (!partner) return json({ error: 'forbidden' }, 403)
    const refs = await referredUserIds(partner.id)
    const ids = new Set(refs.map((r) => r.user_id))
    const joinedAt = new Map(refs.map((r) => [r.user_id, r.created_at]))
    if (ids.size === 0) return json({ customers: [] })
    const [users, ordRes] = await Promise.all([
      listAuthUsers(),
      fetch(`${SUPABASE_URL}/rest/v1/orders?user_id=in.(${[...ids].join(',')})&select=user_id,total`, { headers: svcHeaders() }),
    ])
    const orders = ordRes.ok ? ((await ordRes.json()) as Array<{ user_id: string; total: number }>) : []
    const agg = new Map<string, { count: number; total: number }>()
    for (const o of orders) {
      if (!o.user_id) continue
      const cur = agg.get(o.user_id) || { count: 0, total: 0 }
      cur.count += 1
      cur.total += Number(o.total) || 0
      agg.set(o.user_id, cur)
    }
    const customers = users
      .filter((u) => ids.has(u.id))
      .map((u) => {
        const a = agg.get(u.id)
        return {
          id: u.id, name: nameOf(u), email: u.email || '', phone: phoneOf(u),
          joinedAt: joinedAt.get(u.id) || u.created_at || '',
          orderCount: a?.count || 0, orderTotal: a?.total || 0,
        }
      })
      .sort((x, y) => (y.joinedAt || '').localeCompare(x.joinedAt || ''))
    return json({ customers })
  }

  // ---------- Müşterilerimin siparişleri (aşamalara göre; client filtreler) ----------
  if (action === 'orders') {
    const partner = await getApprovedPartner(user.id)
    if (!partner) return json({ error: 'forbidden' }, 403)
    const refs = await referredUserIds(partner.id)
    const ids = refs.map((r) => r.user_id)
    if (ids.length === 0) return json({ orders: [] })
    const cols = 'order_no,created_at,status,work_status,service,source_lang,target_lang,word_count,urgent,sworn,apostille,total,user_id'
    const [oRes, users] = await Promise.all([
      fetch(`${SUPABASE_URL}/rest/v1/orders?user_id=in.(${ids.join(',')})&select=${cols}&order=created_at.desc`, { headers: svcHeaders() }),
      listAuthUsers(),
    ])
    const rows = oRes.ok ? ((await oRes.json()) as Array<Record<string, unknown>>) : []
    const nameMap = new Map(users.filter((u) => ids.includes(u.id)).map((u) => [u.id, nameOf(u)]))
    const orders = rows.map((o) => ({
      order_no: o.order_no, created_at: o.created_at, status: o.status,
      work_status: o.work_status || 'available', service: o.service,
      source_lang: o.source_lang, target_lang: o.target_lang, word_count: o.word_count,
      total: o.total, customerName: nameMap.get(o.user_id as string) || '',
      partnerShare: computePartnerShare(o as unknown as Parameters<typeof computePartnerShare>[0]),
    }))
    return json({ orders })
  }

  // ---------- Cüzdan (partner_ledger) ----------
  if (action === 'wallet') {
    const partner = await getApprovedPartner(user.id)
    if (!partner) return json({ error: 'forbidden' }, 403)
    const r = await fetch(
      `${SUPABASE_URL}/rest/v1/partner_ledger?partner_id=eq.${partner.id}&select=amount,status,created_at,paid_at,orders(order_no)&order=created_at.desc`,
      { headers: svcHeaders() },
    )
    const rows = r.ok ? ((await r.json()) as LedgerRow[]) : []
    return json({ wallet: computeWallet(rows) })
  }

  // ---------- ADMIN: partnerlik sistemiyle gelen TÜM siparişler (müşteri + partner) ----------
  if (action === 'adminOrders') {
    if (user.email !== ADMIN_EMAIL) return json({ error: 'forbidden' }, 403)
    // Tüm atıflar (user_id → partner_id) + tüm partnerler (id → ad/şirket).
    const [refRes, parRes] = await Promise.all([
      fetch(`${SUPABASE_URL}/rest/v1/partner_referrals?select=user_id,partner_id`, { headers: svcHeaders() }),
      fetch(`${SUPABASE_URL}/rest/v1/partners?select=id,contact_name,company`, { headers: svcHeaders() }),
    ])
    const refs = refRes.ok ? ((await refRes.json()) as Array<{ user_id: string; partner_id: string }>) : []
    const partners = parRes.ok ? ((await parRes.json()) as Array<{ id: string; contact_name: string | null; company: string | null }>) : []
    if (refs.length === 0) return json({ orders: [] })
    const userToPartner = new Map(refs.map((r) => [r.user_id, r.partner_id]))
    const partnerMap = new Map(partners.map((p) => [p.id, p]))
    const ids = [...new Set(refs.map((r) => r.user_id))]
    const cols = 'order_no,created_at,status,work_status,service,source_lang,target_lang,word_count,urgent,sworn,apostille,total,user_id'
    const [oRes, users] = await Promise.all([
      fetch(`${SUPABASE_URL}/rest/v1/orders?user_id=in.(${ids.join(',')})&select=${cols}&order=created_at.desc`, { headers: svcHeaders() }),
      listAuthUsers(),
    ])
    const rows = oRes.ok ? ((await oRes.json()) as Array<Record<string, unknown>>) : []
    const umap = new Map(users.map((u) => [u.id, u]))
    const orders = rows.map((o) => {
      const uid = o.user_id as string
      const u = umap.get(uid)
      const p = partnerMap.get(userToPartner.get(uid) || '')
      return {
        order_no: o.order_no, created_at: o.created_at, status: o.status,
        work_status: o.work_status || 'available', service: o.service,
        source_lang: o.source_lang, target_lang: o.target_lang, total: o.total,
        partnerShare: computePartnerShare(o as unknown as Parameters<typeof computePartnerShare>[0]),
        customerName: u ? nameOf(u) : '', customerEmail: u?.email || '', customerPhone: u ? phoneOf(u) : '',
        partnerName: p?.contact_name || '', partnerCompany: p?.company || '',
      }
    })
    return json({ orders })
  }

  return json({ error: 'unknown_action' }, 400)
}

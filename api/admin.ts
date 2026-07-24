/**
 * Admin veri uç noktası (EDGE) — /yonetim panelinin "Müşteriler" ve "Dosyalar" sekmeleri.
 *   POST { action: 'customers' }                → tüm müşteriler (tercüman + admin hariç) + sipariş özeti
 *   POST { action: 'customerDetail', userId }   → tek müşterinin bilgileri + siparişleri
 *   POST { action: 'uploads' }                  → fiyat sayfası dosya arşivi (imzalı indirme URL'leri)
 * Yetki: Authorization: Bearer <token>; yalnızca ADMIN_EMAIL geçebilir (403 aksi halde).
 */
export const config = { runtime: 'edge' }

const SUPABASE_URL = (process.env.SUPABASE_URL || 'https://xtqymenxaozzwmqfssod.supabase.co').replace(/\/+$/, '')
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || 'admin@tercumexpert.com').toLowerCase()

function json(obj: unknown, status = 200): Response {
  return new Response(JSON.stringify(obj), { status, headers: { 'content-type': 'application/json' } })
}
function svcHeaders(extra?: Record<string, string>): Record<string, string> {
  return { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}`, 'content-type': 'application/json', ...(extra || {}) }
}
async function getUser(token: string): Promise<{ id: string; email: string } | null> {
  try {
    const r = await fetch(`${SUPABASE_URL}/auth/v1/user`, { headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${token}` } })
    if (!r.ok) return null
    const u = (await r.json()) as { id?: string; email?: string }
    return u?.id ? { id: u.id, email: (u.email || '').toLowerCase() } : null
  } catch {
    return null
  }
}
async function signedUrl(bucket: string, path: string, expiresIn = 3600): Promise<string | null> {
  try {
    const res = await fetch(`${SUPABASE_URL}/storage/v1/object/sign/${bucket}/${path}`, {
      method: 'POST',
      headers: svcHeaders(),
      body: JSON.stringify({ expiresIn }),
    })
    if (!res.ok) return null
    const d = (await res.json()) as { signedURL?: string }
    return d?.signedURL ? `${SUPABASE_URL}/storage/v1${d.signedURL}` : null
  } catch {
    return null
  }
}

interface AuthUser {
  id: string
  email?: string
  phone?: string
  created_at?: string
  banned_until?: string | null
  user_metadata?: Record<string, unknown>
}
function isBanned(u: AuthUser): boolean {
  if (!u.banned_until) return false
  const t = new Date(u.banned_until).getTime()
  return Number.isFinite(t) && t > Date.now()
}

interface RoleMaps {
  translators: Map<string, { created_at: string }>
  partners: Map<string, { created_at: string; contact_name: string | null; company: string | null; email: string | null; phone: string | null; status: string }>
  referred: Set<string>
  orders: Map<string, { count: number; total: number; last: string }>
}
/** Tek seferde rol/rozet haritaları: tercüman, partner, referral, sipariş özeti. */
async function gatherRoles(): Promise<RoleMaps> {
  const [trRes, prRes, refRes, ordRes] = await Promise.all([
    fetch(`${SUPABASE_URL}/rest/v1/translators?select=user_id,created_at`, { headers: svcHeaders() }),
    fetch(`${SUPABASE_URL}/rest/v1/partners?select=user_id,created_at,contact_name,company,email,phone,status`, { headers: svcHeaders() }),
    fetch(`${SUPABASE_URL}/rest/v1/partner_referrals?select=user_id`, { headers: svcHeaders() }),
    fetch(`${SUPABASE_URL}/rest/v1/orders?select=user_id,total,created_at`, { headers: svcHeaders() }),
  ])
  const trs = trRes.ok ? ((await trRes.json()) as Array<{ user_id: string; created_at: string }>) : []
  const prs = prRes.ok ? ((await prRes.json()) as Array<Record<string, unknown>>) : []
  const refs = refRes.ok ? ((await refRes.json()) as Array<{ user_id: string }>) : []
  const ords = ordRes.ok ? ((await ordRes.json()) as Array<{ user_id: string; total: number; created_at: string }>) : []
  const translators = new Map(trs.map((t) => [t.user_id, { created_at: t.created_at }]))
  const partners = new Map(
    prs.map((p) => [
      p.user_id as string,
      { created_at: (p.created_at as string) || '', contact_name: (p.contact_name as string) ?? null, company: (p.company as string) ?? null, email: (p.email as string) ?? null, phone: (p.phone as string) ?? null, status: (p.status as string) || '' },
    ]),
  )
  const referred = new Set(refs.map((r) => r.user_id))
  const orders = new Map<string, { count: number; total: number; last: string }>()
  for (const o of ords) {
    if (!o.user_id) continue
    const a = orders.get(o.user_id) || { count: 0, total: 0, last: '' }
    a.count += 1
    a.total += Number(o.total) || 0
    if (!a.last || o.created_at > a.last) a.last = o.created_at
    orders.set(o.user_id, a)
  }
  return { translators, partners, referred, orders }
}
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
  const fn = (m.first_name as string) || ''
  const ln = (m.last_name as string) || ''
  return `${fn} ${ln}`.trim()
}
function phoneOf(u: AuthUser): string {
  const m = u.user_metadata || {}
  return (m.phone as string) || u.phone || ''
}

export default async function handler(req: Request): Promise<Response> {
  if (req.method !== 'POST') return json({ error: 'method' }, 405)
  if (!SERVICE_KEY) return json({ error: 'server_config' }, 200)

  const token = (req.headers.get('authorization') || '').replace(/^Bearer\s+/i, '').trim()
  if (!token) return json({ error: 'unauthorized' }, 401)
  const caller = await getUser(token)
  if (!caller) return json({ error: 'unauthorized' }, 401)
  if (caller.email !== ADMIN_EMAIL) return json({ error: 'forbidden' }, 403)

  let body: { action?: string; userId?: string; ban?: boolean }
  try {
    body = await req.json()
  } catch {
    return json({ error: 'bad_json' }, 400)
  }
  const action = body.action

  // ——— Müşteri listesi: EN AZ 1 sipariş vermiş HERKES (tercümanlar dâhil) ———
  if (action === 'customers') {
    const [users, roles] = await Promise.all([listAuthUsers(), gatherRoles()])
    const customers = users
      .filter((u) => (u.email || '').toLowerCase() !== ADMIN_EMAIL && (roles.orders.get(u.id)?.count || 0) > 0)
      .map((u) => {
        const a = roles.orders.get(u.id)
        return {
          id: u.id,
          name: nameOf(u),
          email: u.email || '',
          phone: phoneOf(u),
          createdAt: u.created_at || '',
          orderCount: a?.count || 0,
          orderTotal: a?.total || 0,
          lastOrder: a?.last || '',
          isTranslator: roles.translators.has(u.id),
          referredByPartner: roles.referred.has(u.id),
        }
      })
      .sort((x, y) => (y.lastOrder || '').localeCompare(x.lastOrder || ''))
    return json({ customers })
  }

  // ——— Üyeler: admin hariç TÜM hesaplar (sipariş şartı yok) + rol/ban bayrakları ———
  if (action === 'members') {
    const [users, roles] = await Promise.all([listAuthUsers(), gatherRoles()])
    const members = users
      .filter((u) => (u.email || '').toLowerCase() !== ADMIN_EMAIL)
      .map((u) => ({
        id: u.id,
        name: nameOf(u),
        email: u.email || '',
        phone: phoneOf(u),
        createdAt: u.created_at || '',
        isTranslator: roles.translators.has(u.id),
        isPartner: roles.partners.has(u.id),
        isCustomer: (roles.orders.get(u.id)?.count || 0) > 0,
        referredByPartner: roles.referred.has(u.id),
        banned: isBanned(u),
      }))
      .sort((x, y) => (y.createdAt || '').localeCompare(x.createdAt || ''))
    return json({ members })
  }

  // ——— Tercümanlar dizini ———
  if (action === 'translators') {
    const [users, tRes] = await Promise.all([
      listAuthUsers(),
      fetch(`${SUPABASE_URL}/rest/v1/translators?select=user_id,full_name,phone,created_at&order=created_at.desc`, { headers: svcHeaders() }),
    ])
    const umap = new Map(users.map((u) => [u.id, u]))
    const rows = tRes.ok ? ((await tRes.json()) as Array<{ user_id: string; full_name: string | null; phone: string | null; created_at: string }>) : []
    const translators = rows.map((t) => {
      const u = umap.get(t.user_id)
      return {
        userId: t.user_id,
        name: t.full_name || (u ? nameOf(u) : ''),
        email: u?.email || '',
        phone: t.phone || (u ? phoneOf(u) : ''),
        createdAt: u?.created_at || '',
        roleCreatedAt: t.created_at || '',
      }
    })
    return json({ translators })
  }

  // ——— Partnerler dizini ———
  if (action === 'partners') {
    const [users, pRes] = await Promise.all([
      listAuthUsers(),
      fetch(`${SUPABASE_URL}/rest/v1/partners?select=user_id,contact_name,company,email,phone,created_at,status&order=created_at.desc`, { headers: svcHeaders() }),
    ])
    const umap = new Map(users.map((u) => [u.id, u]))
    const rows = pRes.ok ? ((await pRes.json()) as Array<Record<string, unknown>>) : []
    const partners = rows.map((p) => {
      const u = umap.get(p.user_id as string)
      return {
        userId: p.user_id,
        name: (p.contact_name as string) || '',
        company: (p.company as string) || '',
        email: (p.email as string) || u?.email || '',
        phone: (p.phone as string) || '',
        siteCreatedAt: u?.created_at || '',
        roleCreatedAt: (p.created_at as string) || '',
        status: (p.status as string) || '',
      }
    })
    return json({ partners })
  }

  // ——— Üye yasakla / yasağı kaldır ———
  if (action === 'banUser') {
    const uid = String(body.userId || '')
    if (!uid) return json({ error: 'no_user' }, 400)
    const ban = body.ban !== false
    const res = await fetch(`${SUPABASE_URL}/auth/v1/admin/users/${uid}`, {
      method: 'PUT',
      headers: svcHeaders(),
      body: JSON.stringify({ ban_duration: ban ? '876000h' : 'none' }),
    })
    return json({ ok: res.ok })
  }

  // ——— Hesabı sil ———
  if (action === 'deleteUser') {
    const uid = String(body.userId || '')
    if (!uid) return json({ error: 'no_user' }, 400)
    const res = await fetch(`${SUPABASE_URL}/auth/v1/admin/users/${uid}`, { method: 'DELETE', headers: svcHeaders() })
    return json({ ok: res.ok })
  }

  // ——— Müşteri detayı ———
  if (action === 'customerDetail') {
    const userId = String(body.userId || '')
    if (!userId) return json({ error: 'no_user' }, 400)
    const [uRes, oRes] = await Promise.all([
      fetch(`${SUPABASE_URL}/auth/v1/admin/users/${userId}`, { headers: svcHeaders() }),
      fetch(
        `${SUPABASE_URL}/rest/v1/orders?user_id=eq.${userId}&select=order_no,created_at,status,service,source_lang,target_lang,word_count,total,contact_name,contact_email,contact_phone&order=created_at.desc`,
        { headers: svcHeaders() },
      ),
    ])
    const u = uRes.ok ? ((await uRes.json()) as AuthUser) : null
    const orders = oRes.ok ? ((await oRes.json()) as Array<Record<string, unknown>>) : []
    return json({
      user: u
        ? { id: u.id, name: nameOf(u), email: u.email || '', phone: phoneOf(u), createdAt: u.created_at || '' }
        : null,
      orders,
    })
  }

  // ——— Dosya arşivi ———
  if (action === 'uploads') {
    const r = await fetch(
      `${SUPABASE_URL}/rest/v1/quote_uploads?select=*&order=created_at.desc&limit=500`,
      { headers: svcHeaders() },
    )
    const rows = r.ok ? ((await r.json()) as Array<Record<string, any>>) : []
    // Yükleyen adları için kullanıcı haritası (tek seferde).
    const users = await listAuthUsers()
    const umap = new Map(users.map((u) => [u.id, { name: nameOf(u), email: u.email || '' }]))
    const uploads = []
    for (const row of rows) {
      const info = row.user_id ? umap.get(row.user_id) : null
      uploads.push({
        id: row.id,
        fileName: row.file_name,
        size: row.size,
        mime: row.mime,
        words: row.word_count,
        locale: row.locale,
        createdAt: row.created_at,
        uploaderName: info?.name || '',
        uploaderEmail: info?.email || '',
        url: await signedUrl('quote-uploads', row.storage_path),
      })
    }
    return json({ uploads })
  }

  return json({ error: 'bad_action' }, 400)
}

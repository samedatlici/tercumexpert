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

interface DeletedRow { deleted_at: string; email: string | null; phone: string | null; name: string | null }
/** Kaydı silinen (soft-delete) hesapların haritası: user_id → arşiv anlık görüntüsü. */
async function getDeletedMap(): Promise<Map<string, DeletedRow>> {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/deleted_accounts?select=user_id,deleted_at,email,phone,name`, { headers: svcHeaders() })
  if (!r.ok) return new Map()
  const rows = (await r.json()) as Array<{ user_id: string } & DeletedRow>
  return new Map(rows.map((d) => [d.user_id, { deleted_at: d.deleted_at, email: d.email, phone: d.phone, name: d.name }]))
}
/** Bir kullanıcının rol bayrakları (canlı türetme). */
function roleFlagsOf(id: string, roles: RoleMaps): { isCustomer: boolean; isTranslator: boolean; isPartner: boolean; referredByPartner: boolean } {
  return {
    isCustomer: (roles.orders.get(id)?.count || 0) > 0,
    isTranslator: roles.translators.has(id),
    isPartner: roles.partners.has(id),
    referredByPartner: roles.referred.has(id),
  }
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
  // NOT: Bu bir LOG panelidir. Kaydı silinen / yasaklanan müşteriler de burada KALIR
  // (sipariş geçmişleri korunur) ve 'deleted'/'banned' bayraklarıyla rozetlenir.
  if (action === 'customers') {
    const [users, roles, deleted] = await Promise.all([listAuthUsers(), gatherRoles(), getDeletedMap()])
    const customers = users
      .filter((u) => (u.email || '').toLowerCase() !== ADMIN_EMAIL && (roles.orders.get(u.id)?.count || 0) > 0)
      .map((u) => {
        const a = roles.orders.get(u.id)
        const rf = roleFlagsOf(u.id, roles)
        return {
          id: u.id,
          name: nameOf(u),
          email: u.email || '',
          phone: phoneOf(u),
          createdAt: u.created_at || '',
          orderCount: a?.count || 0,
          orderTotal: a?.total || 0,
          lastOrder: a?.last || '',
          isTranslator: rf.isTranslator,
          isPartner: rf.isPartner,
          referredByPartner: rf.referredByPartner,
          banned: isBanned(u),
          deleted: deleted.has(u.id),
        }
      })
      .sort((x, y) => (y.lastOrder || '').localeCompare(x.lastOrder || ''))
    return json({ customers })
  }

  // ——— Üyeler: admin hariç TÜM hesaplar (sipariş şartı yok) + rol/ban/silinme bayrakları ———
  // Frontend, "Üyeler" görünümünde silinen+yasaklıyı gizler; "Üyeleri Yönet"te yalnızca
  // silineni gizler (yasaklıyı gösterir ki admin yasağı kaldırabilsin).
  if (action === 'members') {
    const [users, roles, deleted] = await Promise.all([listAuthUsers(), gatherRoles(), getDeletedMap()])
    const members = users
      .filter((u) => (u.email || '').toLowerCase() !== ADMIN_EMAIL)
      .map((u) => {
        const rf = roleFlagsOf(u.id, roles)
        return {
          id: u.id,
          name: nameOf(u),
          email: u.email || '',
          phone: phoneOf(u),
          createdAt: u.created_at || '',
          isTranslator: rf.isTranslator,
          isPartner: rf.isPartner,
          isCustomer: rf.isCustomer,
          referredByPartner: rf.referredByPartner,
          banned: isBanned(u),
          deleted: deleted.has(u.id),
        }
      })
      .sort((x, y) => (y.createdAt || '').localeCompare(x.createdAt || ''))
    return json({ members })
  }

  // ——— Tercümanlar dizini (AKTİF): kaydı silinen + yasaklı tercümanlar HARİÇ ———
  // (Onlar "Kaydı silinen" / "Yasaklanan" sayfalarında görünür; tercüme kayıtları korunur.)
  if (action === 'translators') {
    const [users, tRes, deleted] = await Promise.all([
      listAuthUsers(),
      fetch(`${SUPABASE_URL}/rest/v1/translators?select=user_id,full_name,phone,created_at&order=created_at.desc`, { headers: svcHeaders() }),
      getDeletedMap(),
    ])
    const umap = new Map(users.map((u) => [u.id, u]))
    const rows = tRes.ok ? ((await tRes.json()) as Array<{ user_id: string; full_name: string | null; phone: string | null; created_at: string }>) : []
    const translators = rows
      .filter((t) => {
        const u = umap.get(t.user_id)
        return !deleted.has(t.user_id) && !(u && isBanned(u))
      })
      .map((t) => {
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

  // ——— Partnerler dizini (AKTİF): kaydı silinen + yasaklı partnerler HARİÇ ———
  // (Onlar "Kaydı silinen" / "Yasaklanan" sayfalarında görünür; getirdiği müşteri/ciro kayıtları korunur.)
  if (action === 'partners') {
    const [users, pRes, deleted] = await Promise.all([
      listAuthUsers(),
      fetch(`${SUPABASE_URL}/rest/v1/partners?select=user_id,contact_name,company,email,phone,created_at,status&order=created_at.desc`, { headers: svcHeaders() }),
      getDeletedMap(),
    ])
    const umap = new Map(users.map((u) => [u.id, u]))
    const rows = pRes.ok ? ((await pRes.json()) as Array<Record<string, unknown>>) : []
    const partners = rows
      .filter((p) => {
        const u = umap.get(p.user_id as string)
        return !deleted.has(p.user_id as string) && !(u && isBanned(u))
      })
      .map((p) => {
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

  // ——— Hesabı sil (SOFT-DELETE: arşivle + girişi kalıcı kapat) ———
  // Loglar ASLA silinmez: siparişler, tercüme kayıtları, partner/ciro kayıtları ve
  // kişisel bilgi (e-posta/telefon) KORUNUR — admin geçmişi sonsuza dek gözlemleyebilsin.
  // Hesap yalnızca "kaydı silindi" olarak arşivlenir (deleted_accounts) ve auth girişi
  // kalıcı olarak kapatılır. Kullanıcı bir daha giriş yapamaz; tüm kayıtları yerinde kalır.
  if (action === 'deleteUser') {
    const uid = String(body.userId || '')
    if (!uid) return json({ error: 'no_user' }, 400)

    // 1) Kişisel bilgi anlık görüntüsü (ileride ihtiyaç için korunur).
    const uRes = await fetch(`${SUPABASE_URL}/auth/v1/admin/users/${uid}`, { headers: svcHeaders() })
    const u = uRes.ok ? ((await uRes.json()) as AuthUser) : null

    // 2) Arşive işle (idempotent upsert; user_id benzersiz PK).
    const arch = await fetch(`${SUPABASE_URL}/rest/v1/deleted_accounts`, {
      method: 'POST',
      headers: svcHeaders({ Prefer: 'resolution=merge-duplicates,return=minimal' }),
      body: JSON.stringify({
        user_id: uid,
        email: u?.email || null,
        phone: u ? phoneOf(u) : null,
        name: u ? nameOf(u) : null,
      }),
    })
    if (!arch.ok) return json({ ok: false, error: 'archive_failed' }, 200)

    // 3) Girişi kalıcı kapat (ban). Loglar/roller/siparişler DOKUNULMAZ.
    const res = await fetch(`${SUPABASE_URL}/auth/v1/admin/users/${uid}`, {
      method: 'PUT',
      headers: svcHeaders(),
      body: JSON.stringify({ ban_duration: '876000h' }),
    })
    return json({ ok: res.ok })
  }

  // ——— Kaydı silinen kullanıcılar (arşiv) + roller (canlı) ———
  if (action === 'deletedUsers') {
    const [users, roles, deleted] = await Promise.all([listAuthUsers(), gatherRoles(), getDeletedMap()])
    const umap = new Map(users.map((u) => [u.id, u]))
    const out = Array.from(deleted.entries()).map(([id, d]) => {
      const u = umap.get(id)
      const rf = roleFlagsOf(id, roles)
      return {
        id,
        // Kişisel bilgi arşivden; hesap hâlâ dursa auth'tan tazele.
        name: (u ? nameOf(u) : '') || d.name || '',
        email: (u?.email || '') || d.email || '',
        phone: (u ? phoneOf(u) : '') || d.phone || '',
        deletedAt: d.deleted_at || '',
        ...rf,
      }
    })
    out.sort((x, y) => (y.deletedAt || '').localeCompare(x.deletedAt || ''))
    return json({ users: out })
  }

  // ——— Yasaklanan kullanıcılar (auth ban'lı, ama kaydı silinmemiş) + roller (canlı) ———
  if (action === 'bannedUsers') {
    const [users, roles, deleted] = await Promise.all([listAuthUsers(), gatherRoles(), getDeletedMap()])
    const out = users
      .filter((u) => (u.email || '').toLowerCase() !== ADMIN_EMAIL && isBanned(u) && !deleted.has(u.id))
      .map((u) => {
        const rf = roleFlagsOf(u.id, roles)
        return {
          id: u.id,
          name: nameOf(u),
          email: u.email || '',
          phone: phoneOf(u),
          bannedAt: u.banned_until || '',
          ...rf,
        }
      })
      .sort((x, y) => (x.name || '').localeCompare(y.name || ''))
    return json({ users: out })
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

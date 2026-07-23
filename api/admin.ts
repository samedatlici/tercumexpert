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
  user_metadata?: Record<string, unknown>
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

  let body: { action?: string; userId?: string }
  try {
    body = await req.json()
  } catch {
    return json({ error: 'bad_json' }, 400)
  }
  const action = body.action

  // ——— Müşteri listesi ———
  if (action === 'customers') {
    const [users, trRes, ordRes] = await Promise.all([
      listAuthUsers(),
      fetch(`${SUPABASE_URL}/rest/v1/translators?select=user_id`, { headers: svcHeaders() }),
      fetch(`${SUPABASE_URL}/rest/v1/orders?select=user_id,total,created_at`, { headers: svcHeaders() }),
    ])
    const translatorIds = new Set(
      (trRes.ok ? ((await trRes.json()) as Array<{ user_id: string }>) : []).map((t) => t.user_id),
    )
    const orders = ordRes.ok ? ((await ordRes.json()) as Array<{ user_id: string; total: number; created_at: string }>) : []
    const agg = new Map<string, { count: number; total: number; last: string }>()
    for (const o of orders) {
      if (!o.user_id) continue
      const cur = agg.get(o.user_id) || { count: 0, total: 0, last: '' }
      cur.count += 1
      cur.total += Number(o.total) || 0
      if (!cur.last || o.created_at > cur.last) cur.last = o.created_at
      agg.set(o.user_id, cur)
    }
    const customers = users
      .filter((u) => !translatorIds.has(u.id) && (u.email || '').toLowerCase() !== ADMIN_EMAIL)
      .map((u) => {
        const a = agg.get(u.id)
        return {
          id: u.id,
          name: nameOf(u),
          email: u.email || '',
          phone: phoneOf(u),
          createdAt: u.created_at || '',
          orderCount: a?.count || 0,
          orderTotal: a?.total || 0,
          lastOrder: a?.last || '',
        }
      })
      .sort((x, y) => (y.createdAt || '').localeCompare(x.createdAt || ''))
    return json({ customers })
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

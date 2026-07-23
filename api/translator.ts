import { matchesTranslator, computePayout, estimatePages } from './_pool-logic'
import { sendOrderEmail } from './_email'

/**
 * Tercüman paneli SUNUCU uç noktası (Edge). GÜVENLİK: tercümanlara doğrudan yazma
 * izni YOKTUR; para/iş durumu yalnızca burada (service role) değişir. Her istek,
 * çağıranın Supabase erişim jetonuyla doğrulanır; onaylı tercüman değilse reddedilir.
 *
 * Faz 3 eylemleri: 'pool' (uzmanlık+dil'e uyan available siparişler + dosya + kazanç),
 *                  'claim' (işi üstlen; payout server'da kilitlenir).
 * Sonraki fazlar: submit / ship / (admin) approve / complete / pay burada eklenecek.
 */
export const config = { runtime: 'edge' }

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://xtqymenxaozzwmqfssod.supabase.co'
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
const ADMIN_EMAIL = 'admin@tercumexpert.com'
const nowIso = () => new Date().toISOString()
const TAX_RATE = 0.2 // KDV %20 (pricing.config.ts taxRatePercent ile AYNI olmalı)
const LOCK_MS = 7 * 24 * 60 * 60 * 1000 // kazanç 7 gün kilitli, sonra çekilebilir

interface LedgerRow {
  amount: number | string
  status: string
  created_at: string
  paid_at: string | null
  orders?: { order_no?: number } | null
}

/** Ledger satırlarından cüzdan özeti: toplam / kilitli (7 gün) / çekilebilir / ödenen + işlem listesi. */
function computeWallet(rows: LedgerRow[]): {
  total: number
  locked: number
  withdrawable: number
  paid: number
  entries: Array<{ amount: number; status: string; created_at: string; paid_at: string | null; order_no: number | null; unlocked: boolean }>
} {
  const now = Date.now()
  let total = 0
  let locked = 0
  let withdrawable = 0
  let paid = 0
  const entries = []
  for (const e of rows) {
    const amt = Number(e.amount) || 0
    total += amt
    const unlocked = now - new Date(e.created_at).getTime() >= LOCK_MS
    if (e.status === 'paid') paid += amt
    else if (unlocked) withdrawable += amt
    else locked += amt
    entries.push({
      amount: Math.round(amt),
      status: e.status,
      created_at: e.created_at,
      paid_at: e.paid_at ?? null,
      order_no: e.orders?.order_no ?? null,
      unlocked: e.status !== 'paid' && unlocked,
    })
  }
  return { total: Math.round(total), locked: Math.round(locked), withdrawable: Math.round(withdrawable), paid: Math.round(paid), entries }
}

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

interface TranslatorRow {
  id: string
  expertise: string[]
  language_pairs: { source: string; target: string }[]
}
async function getApprovedTranslator(userId: string): Promise<TranslatorRow | null> {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/translators?user_id=eq.${userId}&status=eq.approved&select=id,expertise,language_pairs`,
    { headers: svcHeaders() },
  )
  if (!res.ok) return null
  const rows = (await res.json()) as TranslatorRow[]
  return rows[0] ?? null
}

async function signedUrl(bucket: string, path: string, expiresIn = 3600): Promise<string | null> {
  try {
    const res = await fetch(`${SUPABASE_URL}/storage/v1/object/sign/${bucket}/${path}`, {
      method: 'POST',
      headers: svcHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ expiresIn }),
    })
    if (!res.ok) return null
    const d = (await res.json()) as { signedURL?: string }
    return d?.signedURL ? `${SUPABASE_URL}/storage/v1${d.signedURL}` : null
  } catch {
    return null
  }
}

const ORDER_COLS =
  'id,order_no,service,source_lang,target_lang,document_type,word_count,urgent,sworn,notarization,apostille,physical_delivery,input_mode,source_text,note,delivery_days,created_at,locale,' +
  'contact_name,contact_email,contact_phone,delivery_address,delivery_city,delivery_postal_code,delivery_country'

// İş-akışı kolonları dahil (Aktif/Onay bekleyen/Onaylanan/Tamamlanan sayfaları).
const JOB_COLS =
  ORDER_COLS +
  ',work_status,translator_id,translator_payout,claimed_at,submitted_at,approved_at,completed_at,shipped_at,rejection_reason,tracking_info,translation_files'

/** Müşterinin yüklediği kaynak dosyalar (order-files) — imzalı URL'lerle. */
async function getSourceFiles(orderId: string): Promise<Array<{ name: string; url: string | null }>> {
  const r = await fetch(
    `${SUPABASE_URL}/rest/v1/order_files?order_id=eq.${orderId}&select=file_name,storage_path`,
    { headers: svcHeaders() },
  )
  if (!r.ok) return []
  const rows = (await r.json()) as Array<{ file_name: string; storage_path: string }>
  const out: Array<{ name: string; url: string | null }> = []
  for (const f of rows) out.push({ name: f.file_name, url: await signedUrl('order-files', f.storage_path) })
  return out
}

/** Tercümanın yüklediği çeviri dosyaları (translations) — imzalı URL'lerle. */
async function signTranslationFiles(tf: unknown): Promise<Array<{ name: string; url: string | null }>> {
  const arr = Array.isArray(tf) ? (tf as Array<{ name?: string; path?: string }>) : []
  const out: Array<{ name: string; url: string | null }> = []
  for (const f of arr) {
    if (f?.path) out.push({ name: f.name || 'dosya', url: await signedUrl('translations', f.path) })
  }
  return out
}

async function getTranslatorInfo(id: string): Promise<{ name: string | null; is_sworn: boolean } | null> {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/translators?id=eq.${id}&select=full_name,is_sworn`, {
    headers: svcHeaders(),
  })
  if (!r.ok) return null
  const rows = (await r.json()) as Array<{ full_name: string | null; is_sworn: boolean }>
  return rows[0] ? { name: rows[0].full_name, is_sworn: rows[0].is_sworn } : null
}

async function fetchOrder(orderId: string): Promise<Record<string, unknown> | null> {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/orders?id=eq.${orderId}&select=${JOB_COLS}`, {
    headers: svcHeaders(),
  })
  if (!r.ok) return null
  return ((await r.json()) as Array<Record<string, unknown>>)[0] ?? null
}

/** Koşullu PATCH; güncellenen satır sayısını (>=1) döndürür. */
async function patchOrder(orderId: string, cond: string, patch: Record<string, unknown>): Promise<boolean> {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/orders?id=eq.${orderId}&${cond}`, {
    method: 'PATCH',
    headers: svcHeaders({ 'Content-Type': 'application/json', Prefer: 'return=representation' }),
    body: JSON.stringify(patch),
  })
  if (!res.ok) return false
  const rows = (await res.json()) as unknown[]
  return Array.isArray(rows) && rows.length > 0
}

export default async function handler(req: Request): Promise<Response> {
  if (req.method !== 'POST') return json({ error: 'method' }, 405)
  if (!SERVICE_KEY) return json({ error: 'server_config' }, 500)

  const token = (req.headers.get('authorization') || '').replace(/^Bearer\s+/i, '').trim()
  if (!token) return json({ error: 'no_auth' }, 401)

  let body: {
    action?: string
    orderId?: string
    translatorId?: string
    files?: Array<{ name?: string; path?: string }>
    reason?: string
    tracking?: string
  }
  try {
    body = await req.json()
  } catch {
    return json({ error: 'bad_json' }, 400)
  }

  const user = await getUser(token)
  if (!user) return json({ error: 'invalid_token' }, 401)

  const isAdmin = user.email === ADMIN_EMAIL
  const translator = await getApprovedTranslator(user.id)
  if (!isAdmin && !translator) return json({ error: 'not_translator' }, 403)

  const action = body.action

  // -------- Havuz: uyan available siparişler + dosya/metin + kazanç --------
  if (action === 'pool') {
    if (!translator) return json({ error: 'not_translator' }, 403)
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/orders?work_status=eq.available&select=${ORDER_COLS}&order=created_at.desc`,
      { headers: svcHeaders() },
    )
    if (!res.ok) return json({ error: 'load' }, 200)
    const orders = (await res.json()) as Array<Record<string, unknown>>
    const matched = orders.filter((o) =>
      matchesTranslator(o as unknown as Parameters<typeof matchesTranslator>[0], translator),
    )
    const out = []
    for (const o of matched) {
      const files: Array<{ name: string; url: string | null }> = []
      const fRes = await fetch(
        `${SUPABASE_URL}/rest/v1/order_files?order_id=eq.${o.id}&select=file_name,storage_path`,
        { headers: svcHeaders() },
      )
      if (fRes.ok) {
        const rows = (await fRes.json()) as Array<{ file_name: string; storage_path: string }>
        for (const f of rows) files.push({ name: f.file_name, url: await signedUrl('order-files', f.storage_path) })
      }
      out.push({
        ...o,
        payout: computePayout(o as unknown as Parameters<typeof computePayout>[0]),
        pages: estimatePages(Number(o.word_count) || 0),
        files,
      })
    }
    return json({ orders: out })
  }

  // -------- İşi üstlen (claim) --------
  if (action === 'claim') {
    if (!translator) return json({ error: 'not_translator' }, 403)
    const orderId = body.orderId
    if (!orderId) return json({ error: 'no_order' }, 400)
    const oRes = await fetch(`${SUPABASE_URL}/rest/v1/orders?id=eq.${orderId}&select=${ORDER_COLS},work_status`, {
      headers: svcHeaders(),
    })
    const order = ((await oRes.json()) as Array<Record<string, unknown>>)[0]
    if (!order) return json({ error: 'not_found' }, 404)
    if (order.work_status !== 'available') return json({ error: 'unavailable' }, 409)
    if (!matchesTranslator(order as unknown as Parameters<typeof matchesTranslator>[0], translator)) {
      return json({ error: 'not_allowed' }, 403)
    }
    const payout = computePayout(order as unknown as Parameters<typeof computePayout>[0])
    // Koşullu güncelleme: yalnızca hâlâ 'available' ise (yarış durumunu önler).
    const uRes = await fetch(
      `${SUPABASE_URL}/rest/v1/orders?id=eq.${orderId}&work_status=eq.available`,
      {
        method: 'PATCH',
        headers: svcHeaders({ 'Content-Type': 'application/json', Prefer: 'return=representation' }),
        body: JSON.stringify({
          translator_id: translator.id,
          work_status: 'claimed',
          status: 'in_progress', // müşteri görünümü: "İşleme alındı"
          translator_payout: payout,
          claimed_at: new Date().toISOString(),
        }),
      },
    )
    const updated = (await uRes.json()) as unknown[]
    if (!Array.isArray(updated) || updated.length === 0) return json({ error: 'race' }, 409)
    // Müşteriye "işleme alındı" maili (best-effort; hata olsa da claim başarılı).
    try {
      await sendOrderEmail('in_progress', order as Parameters<typeof sendOrderEmail>[1])
    } catch { /* yut */ }
    return json({ ok: true, payout })
  }

  // -------- İşler: Aktif/Onay bekleyen/Onaylanan/Tamamlanan (admin=hepsi, tercüman=kendi) --------
  if (action === 'jobs') {
    const filter = isAdmin
      ? 'work_status=in.(claimed,submitted,approved,completed)'
      : `translator_id=eq.${translator!.id}&work_status=in.(claimed,submitted,approved,completed)`
    const res = await fetch(`${SUPABASE_URL}/rest/v1/orders?${filter}&select=${JOB_COLS}&order=claimed_at.desc`, {
      headers: svcHeaders(),
    })
    if (!res.ok) return json({ error: 'load' }, 200)
    const orders = (await res.json()) as Array<Record<string, unknown>>
    const out = []
    for (const o of orders) {
      out.push({
        ...o,
        payout: (o.translator_payout as number) ?? computePayout(o as unknown as Parameters<typeof computePayout>[0]),
        pages: estimatePages(Number(o.word_count) || 0),
        sourceFiles: await getSourceFiles(o.id as string),
        translationFiles: await signTranslationFiles(o.translation_files),
        translatorInfo: isAdmin && o.translator_id ? await getTranslatorInfo(o.translator_id as string) : null,
      })
    }
    return json({ jobs: out, isAdmin })
  }

  // -------- Çeviriyi onaya gönder (tercüman): claimed -> submitted --------
  if (action === 'submit') {
    if (!translator) return json({ error: 'not_translator' }, 403)
    const orderId = body.orderId
    if (!orderId) return json({ error: 'no_order' }, 400)
    // Yalnızca KENDİ yüklediği (translations/<translatorId>/...) dosyalar kabul edilir.
    const files = (Array.isArray(body.files) ? body.files : [])
      .filter((f) => f?.path && f.path.startsWith(`${translator.id}/`))
      .map((f) => ({ name: String(f.name || 'dosya').slice(0, 200), path: String(f.path) }))
    if (files.length === 0) return json({ error: 'no_files' }, 400)
    const ok = await patchOrder(orderId, `work_status=eq.claimed&translator_id=eq.${translator.id}`, {
      work_status: 'submitted',
      translation_files: files,
      submitted_at: nowIso(),
      rejection_reason: null,
    })
    if (!ok) return json({ error: 'bad_state' }, 409)
    return json({ ok: true })
  }

  // -------- Teslim et / tamamla (tercüman): approved -> completed (+ cüzdana kilitli kazanç) --------
  if (action === 'complete') {
    if (!translator) return json({ error: 'not_translator' }, 403)
    const orderId = body.orderId
    if (!orderId) return json({ error: 'no_order' }, 400)
    const order = await fetchOrder(orderId)
    if (!order || order.translator_id !== translator.id) return json({ error: 'not_allowed' }, 403)
    if (order.work_status !== 'approved') return json({ error: 'bad_state' }, 409)
    const tracking = typeof body.tracking === 'string' ? body.tracking.trim() : ''
    if (order.physical_delivery && !tracking) return json({ error: 'need_tracking' }, 400)
    const patch: Record<string, unknown> = { work_status: 'completed', completed_at: nowIso() }
    if (order.physical_delivery) {
      patch.shipped_at = nowIso()
      patch.tracking_info = tracking.slice(0, 500)
      patch.tracking_url = tracking.slice(0, 500) // müşteri "Kargom nerede?" ekranı bunu okur
      patch.status = 'shipped' // müşteri görünümü: "Kargoya verildi"
    } else {
      patch.status = 'delivered' // dijital teslim → müşteri görünümü: "Teslim edildi"
    }
    const ok = await patchOrder(orderId, `work_status=eq.approved&translator_id=eq.${translator.id}`, patch)
    if (!ok) return json({ error: 'bad_state' }, 409)
    // Kazanç cüzdana (kilitli). status='pending' = 7 gün çekilemez (Faz 5'te işlenir).
    await fetch(`${SUPABASE_URL}/rest/v1/translator_ledger`, {
      method: 'POST',
      headers: svcHeaders({ 'Content-Type': 'application/json', Prefer: 'return=minimal' }),
      body: JSON.stringify({
        translator_id: translator.id,
        order_id: orderId,
        amount: (order.translator_payout as number) ?? 0,
        status: 'pending',
      }),
    })
    // Müşteriye teslim maili: kargo → "kargoya verildi" (takip no ile), dijital → "teslim edildi".
    try {
      const mail = { ...order, tracking_info: tracking } as Parameters<typeof sendOrderEmail>[1]
      await sendOrderEmail(order.physical_delivery ? 'shipped' : 'delivered', mail)
    } catch { /* yut */ }
    return json({ ok: true })
  }

  // -------- Yönetim: çeviriyi onayla (submitted -> approved) --------
  if (action === 'approveTranslation') {
    if (!isAdmin) return json({ error: 'forbidden' }, 403)
    const orderId = body.orderId
    if (!orderId) return json({ error: 'no_order' }, 400)
    const ok = await patchOrder(orderId, 'work_status=eq.submitted', {
      work_status: 'approved',
      status: 'translated', // müşteri görünümü: "Çeviri tamamlandı"
      approved_at: nowIso(),
    })
    if (!ok) return json({ error: 'bad_state' }, 409)
    // Müşteriye "çeviriniz tamamlandı" maili (best-effort).
    try {
      const ord = await fetchOrder(orderId)
      if (ord) await sendOrderEmail('translated', ord as Parameters<typeof sendOrderEmail>[1])
    } catch { /* yut */ }
    return json({ ok: true })
  }

  // -------- Yönetim: çeviriyi reddet (submitted -> claimed, sebep notu) --------
  if (action === 'rejectTranslation') {
    if (!isAdmin) return json({ error: 'forbidden' }, 403)
    const orderId = body.orderId
    if (!orderId) return json({ error: 'no_order' }, 400)
    const reason = (typeof body.reason === 'string' ? body.reason.trim() : '').slice(0, 1000)
    const ok = await patchOrder(orderId, 'work_status=eq.submitted', {
      work_status: 'claimed',
      status: 'in_progress', // müşteri görünümü: hâlâ işlemde (revizyon)
      rejection_reason: reason || '—',
      submitted_at: null,
      translation_files: [],
    })
    if (!ok) return json({ error: 'bad_state' }, 409)
    return json({ ok: true })
  }

  // -------- Tercüman cüzdanı: ledger + 7-gün kilit özeti --------
  if (action === 'wallet') {
    if (!translator) return json({ error: 'not_translator' }, 403)
    const r = await fetch(
      `${SUPABASE_URL}/rest/v1/translator_ledger?translator_id=eq.${translator.id}&select=amount,status,created_at,paid_at,orders(order_no)&order=created_at.desc`,
      { headers: svcHeaders() },
    )
    if (!r.ok) return json({ error: 'load' }, 200)
    return json(computeWallet((await r.json()) as LedgerRow[]))
  }

  // -------- Admin cüzdanı: tamamlanan siparişlerde firma payı (KDV dahil) --------
  if (action === 'adminWallet') {
    if (!isAdmin) return json({ error: 'forbidden' }, 403)
    const r = await fetch(
      `${SUPABASE_URL}/rest/v1/orders?work_status=eq.completed&select=order_no,total,translator_payout,completed_at,translator_id&order=completed_at.desc`,
      { headers: svcHeaders() },
    )
    if (!r.ok) return json({ error: 'load' }, 200)
    const rows = (await r.json()) as Array<Record<string, unknown>>
    let ciro = 0
    let kdv = 0
    let payouts = 0
    const orders: Array<Record<string, unknown>> = []
    const names: Record<string, string | null> = {}
    for (const o of rows) {
      const total = Number(o.total) || 0
      const payout = Number(o.translator_payout) || 0
      const subtotal = total / (1 + TAX_RATE) // KDV hariç
      const tax = total - subtotal
      ciro += total
      kdv += tax
      payouts += payout
      const tid = (o.translator_id as string) || ''
      if (tid && !(tid in names)) {
        const info = await getTranslatorInfo(tid)
        names[tid] = info?.name ?? null
      }
      orders.push({
        order_no: o.order_no,
        total: Math.round(total),
        payout: Math.round(payout),
        firmShare: Math.round(total - payout),
        completed_at: o.completed_at,
        translator: tid ? names[tid] : null,
      })
    }
    return json({
      summary: {
        ciro: Math.round(ciro),
        kdv: Math.round(kdv),
        payouts: Math.round(payouts),
        net: Math.round(ciro - kdv - payouts), // firma net (KDV ve tercüman düşülmüş)
        firmShare: Math.round(ciro - payouts), // firma payı (KDV dahil geriye kalan)
        count: rows.length,
      },
      orders,
    })
  }

  // -------- Admin: tek tercümanın profili (bilgiler + işler + cüzdan) --------
  if (action === 'translatorDetail') {
    if (!isAdmin) return json({ error: 'forbidden' }, 403)
    const id = body.translatorId
    if (!id) return json({ error: 'no_id' }, 400)
    const tr = await fetch(`${SUPABASE_URL}/rest/v1/translators?id=eq.${id}&select=*`, { headers: svcHeaders() })
    if (!tr.ok) return json({ error: 'load' }, 200)
    const trow = ((await tr.json()) as Array<Record<string, unknown>>)[0]
    if (!trow) return json({ error: 'not_found' }, 404)
    const jr = await fetch(
      `${SUPABASE_URL}/rest/v1/orders?translator_id=eq.${id}&work_status=in.(claimed,submitted,approved,completed)&select=order_no,service,source_lang,target_lang,work_status,translator_payout,physical_delivery,claimed_at,completed_at,tracking_info&order=claimed_at.desc`,
      { headers: svcHeaders() },
    )
    const jrows = jr.ok ? ((await jr.json()) as Array<Record<string, unknown>>) : []
    const lr = await fetch(
      `${SUPABASE_URL}/rest/v1/translator_ledger?translator_id=eq.${id}&select=amount,status,created_at,paid_at,orders(order_no)&order=created_at.desc`,
      { headers: svcHeaders() },
    )
    const lrows = lr.ok ? ((await lr.json()) as LedgerRow[]) : []
    return json({ translator: trow, jobs: jrows, wallet: computeWallet(lrows) })
  }

  // -------- Admin: TÜM siparişler (Siparişler sayfası) --------
  if (action === 'adminOrders') {
    if (!isAdmin) return json({ error: 'forbidden' }, 403)
    const cols =
      'id,order_no,status,work_status,created_at,completed_at,delivery_days,contact_name,contact_email,service,source_lang,target_lang,physical_delivery,urgent,total,translator_id'
    const r = await fetch(`${SUPABASE_URL}/rest/v1/orders?select=${cols}&order=created_at.desc`, {
      headers: svcHeaders(),
    })
    if (!r.ok) return json({ error: 'load' }, 200)
    const rows = (await r.json()) as Array<Record<string, unknown>>
    const names: Record<string, string | null> = {}
    const out: Array<Record<string, unknown>> = []
    for (const o of rows) {
      const tid = (o.translator_id as string) || ''
      if (tid && !(tid in names)) {
        const info = await getTranslatorInfo(tid)
        names[tid] = info?.name ?? null
      }
      out.push({ ...o, translatorName: tid ? names[tid] : null })
    }
    return json({ orders: out })
  }

  return json({ error: 'unknown_action' }, 400)
}

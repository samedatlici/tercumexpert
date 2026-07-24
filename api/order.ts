/**
 * Sipariş takip verisi (EDGE). GÜVENLİK: bir siparişi YALNIZCA onu veren müşteri
 * görebilir. Sunucu, çağıranın erişim jetonundaki kullanıcıyla siparişin user_id'sini
 * karşılaştırır; eşleşmezse (başka müşteri kod deneme dahil) BOŞ döner → sayfa "bulunamadı".
 * RLS'ten bağımsız kesin kontrol (service role ile okunur, sahiplik kodda doğrulanır).
 */
export const config = { runtime: 'edge' }

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://xtqymenxaozzwmqfssod.supabase.co'
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

const COLS =
  'id,order_no,created_at,status,service,source_lang,target_lang,document_type,word_count,urgent,' +
  'notarization,physical_delivery,total,delivery_days,input_mode,note,tracking_url,carrier,contact_phone,' +
  'delivery_address,delivery_city,delivery_postal_code,delivery_country,translation_files,work_status,user_id'

function json(obj: unknown, status = 200): Response {
  return new Response(JSON.stringify(obj), { status, headers: { 'content-type': 'application/json' } })
}
/** Çeviri dosyası için imzalı indirme URL'i (translations kovası). */
async function signedUrl(path: string, expiresIn = 3600): Promise<string | null> {
  try {
    const res = await fetch(`${SUPABASE_URL}/storage/v1/object/sign/translations/${path}`, {
      method: 'POST',
      headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}`, 'content-type': 'application/json' },
      body: JSON.stringify({ expiresIn }),
    })
    if (!res.ok) return null
    const d = (await res.json()) as { signedURL?: string }
    return d?.signedURL ? `${SUPABASE_URL}/storage/v1${d.signedURL}` : null
  } catch {
    return null
  }
}
async function getUserId(token: string): Promise<string | null> {
  try {
    const res = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
      headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${token}` },
    })
    if (!res.ok) return null
    const u = (await res.json()) as { id?: string }
    return u?.id ?? null
  } catch {
    return null
  }
}

/** Depo yolu için güvenli dosya adı. */
function safeName(name: string): string {
  const dot = name.lastIndexOf('.')
  const ext = dot > -1 ? name.slice(dot) : ''
  const base = (dot > -1 ? name.slice(0, dot) : name)
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-zA-Z0-9-_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 60)
  return `${base || 'belge'}${ext.toLowerCase()}`
}

/**
 * Bir dosyayı 'quote-uploads' kovasından 'order-files' kovasına SUNUCUDA kopyalar.
 * Tarayıcı dosyasına bağımlı DEĞİL — baytlar zaten sunucuda. Önce Storage copy API'si
 * denenir; olmazsa indir-yükle'ye düşülür (tipik belge boyutları için güvenli).
 */
async function copyQuoteToOrder(quotePath: string, dest: string): Promise<boolean> {
  const auth = { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}` }
  // 1) Kovalar-arası kopya (veri fonksiyondan geçmez → büyük dosyalar için ideal).
  // GÜVENLİK: Eski Supabase sürümleri 'destinationBucket'ı yok sayıp yanlış kovaya
  // kopyalayabilir; dönen Key gerçekten order-files'ı işaret etmiyorsa BAŞARISIZ say
  // ve indir-yükle yedeğine düş.
  try {
    const cp = await fetch(`${SUPABASE_URL}/storage/v1/object/copy`, {
      method: 'POST',
      headers: { ...auth, 'content-type': 'application/json' },
      body: JSON.stringify({
        bucketId: 'quote-uploads',
        sourceKey: quotePath,
        destinationBucket: 'order-files',
        destinationKey: dest,
      }),
    })
    if (cp.ok) {
      const d = (await cp.json().catch(() => ({}))) as { Key?: string; key?: string }
      const key = String(d.Key || d.key || '')
      if (key.includes('order-files')) return true
    }
  } catch {
    /* aşağıdaki yedek yola düş */
  }
  // 2) Yedek: indir + yükle (sürümden bağımsız, doğru kovaya yazar).
  try {
    const dl = await fetch(`${SUPABASE_URL}/storage/v1/object/quote-uploads/${quotePath}`, { headers: auth })
    if (!dl.ok) return false
    const ct = dl.headers.get('content-type') || 'application/octet-stream'
    const bytes = new Uint8Array(await dl.arrayBuffer())
    const up = await fetch(`${SUPABASE_URL}/storage/v1/object/order-files/${dest}`, {
      method: 'POST',
      headers: { ...auth, 'content-type': ct, 'x-upsert': 'true' },
      body: bytes,
    })
    return up.ok
  } catch {
    return false
  }
}

export default async function handler(req: Request): Promise<Response> {
  if (req.method !== 'POST') return json({ error: 'method' }, 405)
  if (!SERVICE_KEY) return json({ error: 'server_config' }, 200)

  const token = (req.headers.get('authorization') || '').replace(/^Bearer\s+/i, '').trim()
  if (!token) return json({}, 200) // giriş yok → bulunamadı gibi davran

  let body: { orderNo?: unknown; action?: unknown; files?: unknown }
  try {
    body = await req.json()
  } catch {
    return json({ error: 'bad_json' }, 400)
  }
  const orderNo = Number.parseInt(String(body.orderNo ?? ''), 10)
  if (!Number.isFinite(orderNo)) return json({}, 200)

  const userId = await getUserId(token)
  if (!userId) return json({}, 200)

  const r = await fetch(`${SUPABASE_URL}/rest/v1/orders?order_no=eq.${orderNo}&select=${COLS}`, {
    headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}` },
  })
  if (!r.ok) return json({ error: 'load' }, 200)
  const ord = ((await r.json()) as Array<Record<string, unknown>>)[0]
  // Sahiplik kontrolü: sipariş yoksa VEYA başkasına aitse → boş (bulunamadı).
  if (!ord || ord.user_id !== userId) return json({}, 200)
  const ownerId = ord.user_id as string
  const orderId = ord.id as string
  delete ord.user_id // istemciye sızdırma

  // ---- Belgeleri siparişe bağla (quote-uploads → order-files, SUNUCUDA) ----
  // Fiyat sayfasında (giriş yapılmadan da) yüklenen dosya zaten quote-uploads'ta. Tarayıcı
  // dosyasına güvenmeden burada order-files'a kopyalanır → tercüme havuzunda görünür.
  if (body.action === 'attachFiles') {
    const files = Array.isArray(body.files)
      ? (body.files as Array<{ quotePath?: unknown; name?: unknown; words?: unknown }>)
      : []
    // Aynı yolun iki kez eklenmesini önle (idempotent): mevcut order_files yollarını al.
    const exRes = await fetch(`${SUPABASE_URL}/rest/v1/order_files?order_id=eq.${orderId}&select=storage_path`, {
      headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}` },
    })
    const existing = exRes.ok ? ((await exRes.json()) as Array<{ storage_path: string }>).length : 0
    let attached = 0
    let idx = 0
    for (const f of files) {
      const quotePath = String(f?.quotePath || '').trim()
      if (!quotePath) continue
      idx += 1
      const name = String(f?.name || 'belge').slice(0, 200)
      const words = Number(f?.words) || 0
      const dest = `${ownerId}/${orderId}/${Date.now()}-${idx}-${safeName(name)}`
      const ok = await copyQuoteToOrder(quotePath, dest)
      if (!ok) continue
      const ins = await fetch(`${SUPABASE_URL}/rest/v1/order_files`, {
        method: 'POST',
        headers: {
          apikey: SERVICE_KEY,
          Authorization: `Bearer ${SERVICE_KEY}`,
          'content-type': 'application/json',
          Prefer: 'return=minimal',
        },
        body: JSON.stringify({ order_id: orderId, file_name: name, storage_path: dest, words }),
      })
      if (ins.ok) attached += 1
    }
    return json({ ok: true, attached, existing })
  }

  // Sipariş yalnızca HAVUZDA (bir tercüman üstlenmeden) iken iptal edilebilir.
  const cancellable = ord.work_status === 'available' && ord.status !== 'cancelled'

  // ---- Sipariş iptali (müşteri) ----
  if (body.action === 'cancel') {
    if (!cancellable) return json({ error: 'not_cancellable' }, 409)
    // Koşullu güncelleme: yalnızca hâlâ 'available' ise (tercüman aynı anda üstlenmesin — yarış önlenir).
    const up = await fetch(`${SUPABASE_URL}/rest/v1/orders?order_no=eq.${orderNo}&work_status=eq.available`, {
      method: 'PATCH',
      headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}`, 'content-type': 'application/json', Prefer: 'return=representation' },
      body: JSON.stringify({ status: 'cancelled', work_status: 'cancelled' }),
    })
    const rows = up.ok ? ((await up.json()) as unknown[]) : []
    if (!Array.isArray(rows) || rows.length === 0) return json({ error: 'not_cancellable' }, 409)
    return json({ ok: true })
    // NOT: Ödeme entegrasyonu eklendiğinde para iadesi burada tetiklenecek.
  }

  delete ord.work_status // istemciye ham iş-durumunu sızdırma
  ord.cancellable = cancellable

  // Dijital teslim + "teslim edildi" ise çeviri dosyalarını indirilebilir yap.
  // Kargo teslimde ASLA gönderilmez (tercüman fiziksel kargolar).
  const tf = ord.translation_files
  delete ord.translation_files // ham yolu istemciye sızdırma
  if (!ord.physical_delivery && ord.status === 'delivered' && Array.isArray(tf)) {
    const out: Array<{ name: string; url: string | null }> = []
    for (const f of tf as Array<{ name?: string; path?: string }>) {
      if (!f?.path) continue
      const name = f.name || 'ceviri'
      const u = await signedUrl(f.path)
      // &download=<ad> → tarayıcı dosyayı (her formatta) indirir, sekmede açmaz.
      out.push({ name, url: u ? `${u}&download=${encodeURIComponent(name)}` : null })
    }
    if (out.length) ord.translations = out
  }
  return json({ order: ord })
}

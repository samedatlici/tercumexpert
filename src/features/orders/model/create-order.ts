import { supabase } from '@/lib/supabase'
import type { QuoteBreakdown } from '@/features/quote-calculator/model/types'

export interface OrderFileInput {
  file: File
  words: number
}

export interface CreateOrderInput {
  userId: string
  service: string
  sourceLang: string
  targetLang: string
  documentType: string
  wordCount: number
  urgent: boolean
  sworn: boolean
  notarization: boolean
  apostille: boolean
  physicalDelivery: boolean
  breakdown: QuoteBreakdown
  inputMode: 'file' | 'text'
  sourceText?: string
  locale?: string
  files: OrderFileInput[]
  contactName?: string | null
  contactEmail?: string | null
  contactPhone?: string | null
  note?: string | null
  deliveryAddress?: string | null
  deliveryCity?: string | null
  deliveryPostalCode?: string | null
  deliveryCountry?: string | null
}

export interface CreateOrderResult {
  orderNo?: number
  id?: string
  error?: string
}

/** Dosya adını depoya güvenli hale getirir (Türkçe karakter/boşluk vb.). */
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
  return `${base || 'dosya'}${ext.toLowerCase()}`
}

/**
 * Siparişi oluşturur: orders satırı ekler, dosyaları Storage'a yükler,
 * order_files satırlarını ekler. RLS gereği kullanıcı yalnızca kendi
 * siparişini/dosyasını oluşturabilir (user_id / klasör = auth.uid()).
 */
export async function createOrder(input: CreateOrderInput): Promise<CreateOrderResult> {
  const b = input.breakdown
  const { data: order, error } = await supabase
    .from('orders')
    .insert({
      user_id: input.userId,
      service: input.service,
      source_lang: input.sourceLang,
      target_lang: input.targetLang,
      document_type: input.documentType,
      word_count: input.wordCount,
      urgent: input.urgent,
      sworn: input.sworn,
      notarization: input.notarization,
      apostille: input.apostille,
      physical_delivery: input.physicalDelivery,
      base_price: b.basePrice,
      word_price: b.wordPrice,
      addons_price: b.addonsPrice,
      tax: b.tax,
      total: b.total,
      delivery_days: b.deliveryDays,
      input_mode: input.inputMode,
      source_text: input.sourceText ?? null,
      locale: input.locale ?? null,
      contact_name: input.contactName ?? null,
      contact_email: input.contactEmail ?? null,
      contact_phone: input.contactPhone ?? null,
      note: input.note ?? null,
      delivery_address: input.deliveryAddress ?? null,
      delivery_city: input.deliveryCity ?? null,
      delivery_postal_code: input.deliveryPostalCode ?? null,
      delivery_country: input.deliveryCountry ?? null,
    })
    .select('id, order_no')
    .single()

  if (error || !order) {
    return { error: error?.message ?? 'Sipariş oluşturulamadı.' }
  }

  // Dosyaları yükle (hata olursa sipariş yine kaydolur; dosya eksik kalırsa ekip iletişime geçer).
  // ÖNEMLİ: Dosya, fiyat sayfasında yüklenip giriş için sayfadan ayrıldıktan sonra IndexedDB'den
  // geri yüklenmiş olabilir. Bazı tarayıcılarda IndexedDB'den gelen File nesnesi doğrudan Storage'a
  // yüklenirken içeriği "boşalmış" gibi davranabiliyordu → dosya tercüman havuzunda görünmüyordu.
  // Bunu önlemek için baytları okuyup TAZE bir Blob oluşturup onu yüklüyoruz.
  let fileIndex = 0
  for (const { file, words } of input.files) {
    fileIndex += 1
    const path = `${input.userId}/${order.id}/${Date.now()}-${fileIndex}-${safeName(file.name)}`
    try {
      const buf = await file.arrayBuffer()
      const blob = new Blob([buf], { type: file.type || 'application/octet-stream' })
      const { error: upErr } = await supabase.storage
        .from('order-files')
        .upload(path, blob, { upsert: true, contentType: file.type || 'application/octet-stream' })
      if (!upErr) {
        await supabase.from('order_files').insert({
          order_id: order.id,
          file_name: file.name,
          storage_path: path,
          words,
        })
      }
    } catch {
      /* tek dosya yüklenemese de sipariş bozulmaz */
    }
  }

  // Sipariş bildirimleri (GÜVENİLİR Edge yolu): müşteriye "sipariş alındı",
  // admine "yeni sipariş". Best-effort; hata siparişi bozmaz. (PDF fatura ayrı ele alınıyor.)
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession()
    const token = session?.access_token
    if (token) {
      await fetch('/api/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ orderId: order.id }),
      })
    }
  } catch {
    /* mail hatası siparişi bozmaz */
  }

  return { orderNo: order.order_no as number, id: order.id as string }
}

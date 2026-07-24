import { supabase } from '@/lib/supabase'

export interface OrderDetail {
  id: string
  order_no: number
  created_at: string
  status: string
  service: string | null
  source_lang: string | null
  target_lang: string | null
  document_type: string | null
  word_count: number | null
  urgent: boolean | null
  notarization: boolean | null
  physical_delivery: boolean | null
  total: number | null
  delivery_days: number | null
  input_mode: string | null
  note: string | null
  tracking_url: string | null
  carrier: string | null
  contact_phone: string | null
  delivery_address: string | null
  delivery_city: string | null
  delivery_postal_code: string | null
  delivery_country: string | null
  /** Dijital teslim + "teslim edildi" ise: müşterinin indirebileceği çeviri dosyaları. */
  translations?: Array<{ name: string; url: string | null }>
  /** Sipariş henüz bir tercüman tarafından üstlenilmediyse (havuzda) müşteri iptal edebilir. */
  cancellable?: boolean
}

/** Müşteri kendi siparişini iptal eder (yalnızca havuzda / üstlenilmeden önce). */
export async function cancelOrder(orderNo: number): Promise<{ ok?: boolean; error?: string }> {
  const {
    data: { session },
  } = await supabase.auth.getSession()
  const token = session?.access_token
  if (!token) return { error: 'auth' }
  try {
    const res = await fetch('/api/order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ orderNo, action: 'cancel' }),
    })
    const data = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string }
    return data
  } catch {
    return { error: 'load' }
  }
}

/**
 * Sipariş numarasına göre tek siparişi getirir. GÜVENLİK: sunucu uç noktası (service role)
 * siparişin YALNIZCA sahibine (giriş yapan müşteri) ait olduğunu doğrular; başka müşteri
 * sipariş kodu deneyerek erişemez — boş döner (sayfa "bulunamadı" gösterir).
 */
export async function getOrderByNo(
  orderNo: number,
): Promise<{ order?: OrderDetail; error?: string }> {
  const {
    data: { session },
  } = await supabase.auth.getSession()
  const token = session?.access_token
  if (!token) return {} // giriş yok → bulunamadı
  try {
    const res = await fetch('/api/order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ orderNo }),
    })
    if (!res.ok) return { error: 'load' }
    const data = (await res.json()) as { order?: OrderDetail; error?: string }
    if (data.error) return { error: data.error }
    if (!data.order) return {}
    return { order: data.order }
  } catch {
    return { error: 'load' }
  }
}

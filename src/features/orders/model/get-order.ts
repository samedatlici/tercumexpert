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
}

const COLUMNS =
  'id, order_no, created_at, status, service, source_lang, target_lang, document_type, word_count, urgent, notarization, physical_delivery, total, delivery_days, input_mode, note, tracking_url, carrier, contact_phone, delivery_address, delivery_city, delivery_postal_code, delivery_country'

/**
 * Sipariş numarasına göre tek siparişi getirir. RLS gereği yalnızca
 * siparişin sahibi (auth.uid() = user_id) sonucu görebilir; başkası boş alır.
 */
export async function getOrderByNo(
  orderNo: number,
): Promise<{ order?: OrderDetail; error?: string }> {
  const { data, error } = await supabase
    .from('orders')
    .select(COLUMNS)
    .eq('order_no', orderNo)
    .maybeSingle()
  if (error) return { error: error.message }
  if (!data) return {}
  return { order: data as OrderDetail }
}

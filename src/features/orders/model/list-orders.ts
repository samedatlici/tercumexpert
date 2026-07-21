import { supabase } from '@/lib/supabase'

export interface OrderRow {
  id: string
  order_no: number
  created_at: string
  status: string
  service: string | null
  source_lang: string | null
  target_lang: string | null
  word_count: number | null
  total: number | null
}

/** Giriş yapmış kullanıcının siparişlerini (RLS ile yalnızca kendisininki) getirir. */
export async function listMyOrders(): Promise<{ orders: OrderRow[]; error?: string }> {
  const { data, error } = await supabase
    .from('orders')
    .select('id, order_no, created_at, status, service, source_lang, target_lang, word_count, total')
    .order('created_at', { ascending: false })
  if (error) return { orders: [], error: error.message }
  return { orders: (data ?? []) as OrderRow[] }
}

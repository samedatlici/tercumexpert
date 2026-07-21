import { useEffect, useState } from 'react'
import { useI18n } from '@/hooks/useI18n'
import { listMyOrders, type OrderRow } from '@/features/orders/model/list-orders'

/** "Hesabım" altında kullanıcının kendi siparişlerini listeler. */
export function OrdersList() {
  const { dict, formatCurrency, formatDate } = useI18n()
  const o = dict.auth.orders
  const [orders, setOrders] = useState<OrderRow[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    listMyOrders().then((res) => {
      if (!active) return
      if (res.error) setError(o.error)
      else setOrders(res.orders)
    })
    return () => {
      active = false
    }
  }, [o.error])

  const statusLabel = (s: string) => (o.status as Record<string, string>)[s] ?? s

  if (error) return <p className="text-sm text-danger">{error}</p>
  if (!orders) return <p className="text-sm text-text-secondary">{o.loading}</p>
  if (orders.length === 0) return <p className="text-sm text-text-secondary">{o.empty}</p>

  return (
    <ul className="divide-y divide-border overflow-hidden rounded-lg border border-border">
      {orders.map((ord) => (
        <li key={ord.id} className="flex items-center justify-between gap-3 bg-surface px-4 py-3 text-sm">
          <div className="min-w-0">
            <p className="font-semibold">#{ord.order_no}</p>
            <p className="truncate text-xs text-text-muted">
              {formatDate(ord.created_at)}
              {ord.source_lang && ord.target_lang
                ? ` · ${ord.source_lang.toUpperCase()} → ${ord.target_lang.toUpperCase()}`
                : ''}
              {ord.word_count ? ` · ${ord.word_count} ${dict.quote.upload.wordsUnit}` : ''}
            </p>
          </div>
          <div className="shrink-0 text-right">
            <p className="font-semibold">{ord.total != null ? formatCurrency(ord.total) : '—'}</p>
            <span className="text-xs text-text-secondary">{statusLabel(ord.status)}</span>
          </div>
        </li>
      ))}
    </ul>
  )
}

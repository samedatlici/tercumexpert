import type { RouteId } from '@/app/router/routes'

/**
 * Ana navigasyon (§8). "Hakkımızda" YOK; Kurumsal var. FAQ ana menüde değil (footer'da).
 */
// NOT: 'partnership' (İş Ortaklığı) menüde YOK — sayfa gizli, yalnız doğrudan bağlantıyla erişilir.
export const MAIN_NAV: Extract<
  RouteId,
  'home' | 'services' | 'quote' | 'corporate' | 'blog' | 'contact'
>[] = ['home', 'services', 'quote', 'corporate', 'blog', 'contact']

export type NavKey = (typeof MAIN_NAV)[number]

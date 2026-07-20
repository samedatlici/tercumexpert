import type { RouteId } from '@/app/router/routes'

/**
 * Ana navigasyon (§8). "Hakkımızda" YOK; Kurumsal var. FAQ ana menüde değil (footer'da).
 */
export const MAIN_NAV: Extract<
  RouteId,
  'home' | 'services' | 'quote' | 'corporate' | 'partnership' | 'blog' | 'contact'
>[] = ['home', 'services', 'quote', 'corporate', 'partnership', 'blog', 'contact']

export type NavKey = (typeof MAIN_NAV)[number]

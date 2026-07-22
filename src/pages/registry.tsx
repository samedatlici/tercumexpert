import { lazy, type ComponentType, type LazyExoticComponent } from 'react'
import type { RouteId } from '@/app/router/routes'

/** Sayfa bileşenleri — route-level code splitting (§24). */
const HomePage = lazy(() => import('./HomePage'))
const ServicesPage = lazy(() => import('./ServicesPage'))
const QuotePage = lazy(() => import('./QuotePage'))
const CorporatePage = lazy(() => import('./CorporatePage'))
const PartnershipPage = lazy(() => import('./PartnershipPage'))
const FaqPage = lazy(() => import('./FaqPage'))
const ContactPage = lazy(() => import('./ContactPage'))
const AuthPage = lazy(() => import('./AuthPage'))
const OrderDetailPage = lazy(() => import('./OrderDetailPage'))
const BlogPage = lazy(() => import('./BlogPage'))
const LegalPage = lazy(() => import('./LegalPage'))
const AdminPage = lazy(() => import('./AdminPage'))
const TranslatorPage = lazy(() => import('./TranslatorPage'))
const NotFoundPage = lazy(() => import('./NotFoundPage'))

export const NotFound = NotFoundPage

const MAP: Partial<Record<RouteId, LazyExoticComponent<ComponentType>>> = {
  home: HomePage,
  services: ServicesPage,
  quote: QuotePage,
  corporate: CorporatePage,
  partnership: PartnershipPage,
  faq: FaqPage,
  contact: ContactPage,
  auth: AuthPage,
  order: OrderDetailPage,
  admin: AdminPage,
  translator: TranslatorPage,
  blog: BlogPage,
  legalKvkk: LegalPage,
  legalPrivacy: LegalPage,
  legalDistanceSales: LegalPage,
  legalCookies: LegalPage,
}

/** routeId -> sayfa bileşeni. Bulunamazsa (ör. blogPost — henüz yok) NotFound. */
export function pageForRoute(routeId: RouteId): LazyExoticComponent<ComponentType> {
  return MAP[routeId] ?? NotFoundPage
}

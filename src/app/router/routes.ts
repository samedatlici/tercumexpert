import type { Locale } from '@/app/config/locales'
import { FALLBACK_LOCALE } from '@/app/config/locales'

/**
 * Merkezi route tanımı (Şartname §10). Her route'un locale bazlı slug'ı burada.
 * URL'ler locale prefix'li: /:lang/<slug>. Home slug '' (yani /:lang).
 * Slug eşleştirme TEK kaynaktan yönetilir; sayfalara magic string dağıtılmaz.
 */
export type RouteId =
  | 'home'
  | 'services'
  | 'quote'
  | 'corporate'
  | 'partnership'
  | 'blog'
  | 'blogPost'
  | 'faq'
  | 'contact'
  | 'auth'
  | 'order'
  | 'admin'
  | 'translator'
  | 'legalKvkk'
  | 'legalPrivacy'
  | 'legalDistanceSales'
  | 'legalCookies'

/** Locale bazlı slug'lar. TR ve EN tam; diğerleri EN'e düşer (getSlug). */
const ROUTE_SLUGS: Record<RouteId, Partial<Record<Locale, string>>> = {
  home: { tr: '', en: '', fr: '', de: '', es: '', ar: '', ru: '', it: '' },
  services: { tr: 'hizmetler', en: 'services', fr: 'services', de: 'leistungen', es: 'servicios', it: 'servizi', ru: 'uslugi', ar: 'khadamat' },
  quote: { tr: 'fiyat-hesapla', en: 'get-quote', fr: 'devis', de: 'preis-berechnen', es: 'cotizacion', it: 'preventivo', ru: 'raschet-ceny', ar: 'alsaer' },
  corporate: { tr: 'kurumsal', en: 'corporate', fr: 'entreprises', de: 'unternehmen', es: 'empresas', it: 'aziende', ru: 'korporativnym', ar: 'lelsherikat' },
  partnership: { tr: 'is-ortakligi', en: 'partnership', fr: 'partenariat', de: 'partnerschaft', es: 'colaboracion', it: 'partnership', ru: 'partnerstvo', ar: 'sharaka' },
  blog: { tr: 'blog', en: 'blog' },
  blogPost: { tr: 'blog', en: 'blog' },
  faq: { tr: 'sss', en: 'faq', fr: 'faq', de: 'faq', es: 'faq', it: 'faq', ru: 'faq', ar: 'faq' },
  contact: { tr: 'iletisim', en: 'contact', fr: 'contact', de: 'kontakt', es: 'contacto', it: 'contatti', ru: 'kontakty', ar: 'ittisal' },
  auth: { tr: 'giris', en: 'login', fr: 'connexion', de: 'anmelden', es: 'acceso', it: 'accedi', ru: 'vhod', ar: 'dukhul' },
  order: { tr: 'siparis', en: 'order', fr: 'commande', de: 'bestellung', es: 'pedido', it: 'ordine', ru: 'zakaz', ar: 'talab' },
  admin: { tr: 'yonetim', en: 'admin' },
  translator: { tr: 'tercuman', en: 'translator' },
  legalKvkk: { tr: 'kvkk', en: 'data-protection' },
  legalPrivacy: { tr: 'gizlilik-politikasi', en: 'privacy-policy' },
  legalDistanceSales: { tr: 'mesafeli-satis-sozlesmesi', en: 'distance-sales-agreement' },
  legalCookies: { tr: 'cerez-politikasi', en: 'cookie-policy' },
}

/** Bir route'un belirli dildeki slug'ı (yoksa EN, o da yoksa route id). */
export function getSlug(routeId: RouteId, locale: Locale): string {
  const map = ROUTE_SLUGS[routeId]
  return map[locale] ?? map[FALLBACK_LOCALE] ?? routeId
}

/** Locale + route + (ops.) parametrelerden tam yol üretir. */
export function buildPath(
  locale: Locale,
  routeId: RouteId,
  params?: { slug?: string },
): string {
  const slug = getSlug(routeId, locale)
  const segments = [`/${locale}`]
  if (slug) segments.push(slug)
  if ((routeId === 'blogPost' || routeId === 'order') && params?.slug) segments.push(params.slug)
  return segments.join('/')
}

export const ROUTE_IDS = Object.keys(ROUTE_SLUGS) as RouteId[]

export interface ResolvedRoute {
  routeId: RouteId
  params: { slug?: string }
}

/**
 * Locale altındaki splat path'i (ör. "kurumsal" veya "blog/yeminli-tercume-nedir")
 * merkezi slug haritasıyla eşleştirip routeId üretir. Eşleşme yoksa null (=> 404).
 * Route eşleştirme TEK yerden yönetilir (§10).
 */
export function resolveRouteId(locale: Locale, splat: string): ResolvedRoute | null {
  const clean = splat.replace(/^\/+|\/+$/g, '')
  if (clean === '') return { routeId: 'home', params: {} }

  const segments = clean.split('/')
  const first = segments[0] ?? ''

  // Blog yazısı: <blogSlug>/<postSlug>
  if (first === getSlug('blog', locale) && segments.length >= 2) {
    return { routeId: 'blogPost', params: { slug: segments.slice(1).join('/') } }
  }

  // Sipariş detay/takip: <orderSlug>/<orderNo>
  if (first === getSlug('order', locale) && segments.length >= 2) {
    return { routeId: 'order', params: { slug: segments.slice(1).join('/') } }
  }

  // Tek segmentli route'lar
  if (segments.length === 1) {
    const match = ROUTE_IDS.find(
      (id) => id !== 'home' && id !== 'blogPost' && getSlug(id, locale) === first,
    )
    if (match) return { routeId: match, params: {} }
  }

  return null
}

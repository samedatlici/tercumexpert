import { useEffect } from 'react'
import { useI18n } from '@/hooks/useI18n'
import { LOCALES, getLocaleMeta } from '@/app/config/locales'
import { siteConfig } from '@/app/config/site.config'
import { env } from '@/app/config/env'
import { buildPath, type RouteId } from '@/app/router/routes'

interface SeoProps {
  title: string
  description: string
  routeId: RouteId
  params?: { slug?: string }
  /** Yapılandırılmış veri (JSON-LD). Yalnız gerçek/gösterilen veriler eklenir (§21). */
  jsonLd?: Record<string, unknown> | Record<string, unknown>[]
}

const MANAGED = 'data-seo-managed'

function upsertMeta(attr: 'name' | 'property', key: string, content: string) {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`)
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute(attr, key)
    el.setAttribute(MANAGED, '')
    document.head.appendChild(el)
  }
  el.content = content
}

function upsertLink(rel: string, href: string, hreflang?: string) {
  const selector = hreflang ? `link[rel="${rel}"][hreflang="${hreflang}"]` : `link[rel="${rel}"]:not([hreflang])`
  let el = document.head.querySelector<HTMLLinkElement>(selector)
  if (!el) {
    el = document.createElement('link')
    el.rel = rel
    if (hreflang) el.hreflang = hreflang
    el.setAttribute(MANAGED, '')
    document.head.appendChild(el)
  }
  el.href = href
}

/**
 * Sayfa bazında SEO/meta yönetimi (§21). SPA'da her route için title, description,
 * canonical, Open Graph, Twitter, hreflang ve robots yönetilir. react-helmet YOK —
 * hafif, native DOM upsert. Sahte review/rating/certificate schema EKLENMEZ.
 */
export function Seo({ title, description, routeId, params, jsonLd }: SeoProps) {
  const { locale } = useI18n()

  useEffect(() => {
    const brand = siteConfig.name
    const fullTitle = routeId === 'home' ? title : `${title} | ${brand}`
    document.title = fullTitle

    const path = buildPath(locale, routeId, params)
    const canonical = `${siteConfig.url}${path}`

    upsertMeta('name', 'description', description)
    upsertLink('canonical', canonical)
    upsertMeta('name', 'robots', env.VITE_APP_ENV === 'production' ? 'index,follow' : 'noindex,nofollow')

    upsertMeta('property', 'og:title', fullTitle)
    upsertMeta('property', 'og:description', description)
    upsertMeta('property', 'og:type', 'website')
    upsertMeta('property', 'og:url', canonical)
    upsertMeta('property', 'og:site_name', brand)
    upsertMeta('property', 'og:locale', getLocaleMeta(locale).ogLocale)
    upsertMeta('name', 'twitter:card', 'summary_large_image')

    if (env.VITE_GSC_VERIFICATION) {
      upsertMeta('name', 'google-site-verification', env.VITE_GSC_VERIFICATION)
    }

    // hreflang alternates (tüm diller + x-default)
    for (const l of LOCALES) {
      upsertLink('alternate', `${siteConfig.url}${buildPath(l.code, routeId, params)}`, l.htmlLang)
    }
    upsertLink('alternate', `${siteConfig.url}${buildPath('tr', routeId, params)}`, 'x-default')

    // JSON-LD
    let script = document.head.querySelector<HTMLScriptElement>(`script[${MANAGED}][type="application/ld+json"]`)
    if (jsonLd) {
      if (!script) {
        script = document.createElement('script')
        script.type = 'application/ld+json'
        script.setAttribute(MANAGED, '')
        document.head.appendChild(script)
      }
      script.textContent = JSON.stringify(jsonLd)
    } else if (script) {
      script.remove()
    }
  }, [title, description, routeId, params, jsonLd, locale])

  return null
}

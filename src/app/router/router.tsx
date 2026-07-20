import { createBrowserRouter, Navigate, useLocation, useParams } from 'react-router-dom'
import { LocaleLayout } from '@/app/layouts/LocaleLayout'
import { NotFound, pageForRoute } from '@/pages/registry'
import { DEFAULT_LOCALE, isLocale } from '@/app/config/locales'
import { resolveRouteId } from './routes'

function HomeElement() {
  const Cmp = pageForRoute('home')
  return <Cmp />
}

/** Locale altındaki splat path'i merkezi resolver ile sayfaya bağlar. */
function SplatElement() {
  const { lang } = useParams()
  const location = useLocation()
  const locale = isLocale(lang) ? lang : DEFAULT_LOCALE
  const splat = location.pathname.replace(new RegExp(`^/${locale}/?`), '')
  const resolved = resolveRouteId(locale, splat)

  if (!resolved || resolved.routeId === 'blogPost') {
    const Cmp = NotFound
    return <Cmp />
  }
  const Cmp = pageForRoute(resolved.routeId)
  return <Cmp />
}

export const router = createBrowserRouter([
  { path: '/', element: <Navigate to={`/${DEFAULT_LOCALE}`} replace /> },
  {
    path: '/:lang',
    element: <LocaleLayout />,
    children: [
      { index: true, element: <HomeElement /> },
      { path: '*', element: <SplatElement /> },
    ],
  },
])

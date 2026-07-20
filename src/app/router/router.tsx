import {
  createBrowserRouter,
  isRouteErrorResponse,
  Navigate,
  useLocation,
  useParams,
  useRouteError,
} from 'react-router-dom'
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

/** GEÇİCİ TANI: render hatalarını ekranda gösterir (beyaz ekran yerine). */
function RouteError() {
  const err = useRouteError()
  let msg: string
  if (isRouteErrorResponse(err)) msg = `${err.status} ${err.statusText}`
  else if (err instanceof Error) msg = err.stack || err.message
  else msg = String(err)
  return (
    <div style={{ padding: 20, fontFamily: 'ui-monospace, monospace', maxWidth: 900, margin: '0 auto' }}>
      <h1 style={{ color: '#b00020', fontSize: 18, marginBottom: 8 }}>
        TercümExpert — Sayfa Hatası (geçici tanı)
      </h1>
      <pre style={{ whiteSpace: 'pre-wrap', background: '#f4f4f5', padding: 12, borderRadius: 6, fontSize: 12 }}>
        {msg}
      </pre>
    </div>
  )
}

export const router = createBrowserRouter([
  { path: '/', element: <Navigate to={`/${DEFAULT_LOCALE}`} replace />, errorElement: <RouteError /> },
  {
    path: '/:lang',
    element: <LocaleLayout />,
    errorElement: <RouteError />,
    children: [
      { index: true, element: <HomeElement /> },
      { path: '*', element: <SplatElement /> },
    ],
  },
])

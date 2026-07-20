import { Link } from 'react-router-dom'
import { Button } from '@/components/common/Button'
import { Seo } from '@/components/seo/Seo'
import { useI18n } from '@/hooks/useI18n'
import { buildPath } from '@/app/router/routes'

export default function NotFoundPage() {
  const { locale, dict } = useI18n()
  const n = dict.notFound
  return (
    <>
      <Seo title={n.seo.title} description={n.seo.description} routeId="home" />
      <section className="section flex min-h-[60vh] items-center">
        <div className="container-narrow text-center">
          <p className="text-6xl font-bold text-primary">404</p>
          <h1 className="mt-2 text-2xl font-semibold">{n.title}</h1>
          <p className="mt-2 text-text-secondary">{n.desc}</p>
          <div className="mt-6">
            <Link to={buildPath(locale, 'home')}>
              <Button intent="primary">{n.home}</Button>
            </Link>
          </div>
        </div>
      </section>
    </>
  )
}

import { PageHero } from '@/components/common/PageHero'
import { Seo } from '@/components/seo/Seo'
import { useI18n } from '@/hooks/useI18n'

/**
 * Blog — İSKELET. Veri modeli ve liste/detay (Article + Breadcrumb schema) sonraki
 * aşamada. Sahte yazı üretilmez (§17); içerik gelene kadar dürüst boş durum.
 */
export default function BlogPage() {
  const { dict } = useI18n()
  const b = dict.blog
  return (
    <>
      <Seo title={b.seo.title} description={b.seo.description} routeId="blog" />
      <PageHero title={b.hero.title} subtitle={b.hero.subtitle} />
      <section className="section">
        <div className="container-base">
          <div className="rounded-lg border border-dashed border-border p-10 text-center text-text-secondary">
            {b.empty}
          </div>
        </div>
      </section>
    </>
  )
}

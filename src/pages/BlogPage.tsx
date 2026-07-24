import { Link } from 'react-router-dom'
import { PageHero } from '@/components/common/PageHero'
import { Icon } from '@/components/common/Icon'
import { Seo } from '@/components/seo/Seo'
import { useI18n } from '@/hooks/useI18n'
import { buildPath } from '@/app/router/routes'
import { publishedPosts } from '@/content/blog'

/**
 * Blog listesi. Yayında yazılar en yeni tarih önce sıralanır; henüz yayında yazı
 * yoksa dürüst boş durum gösterilir (§17: sahte yazı üretilmez). Yeni blog girişi
 * eklendiğinde (blog.ts) hem bu liste hem anasayfa otomatik güncellenir. Tek tek
 * yazı detay sayfaları sonraki aşamada.
 */
export default function BlogPage() {
  const { locale, dict } = useI18n()
  const b = dict.blog
  const posts = publishedPosts()

  return (
    <>
      <Seo title={b.seo.title} description={b.seo.description} routeId="blog" />
      <PageHero title={b.hero.title} subtitle={b.hero.subtitle} />
      <section className="section">
        <div className="container-wide">
          {posts.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {posts.map((post) => (
                <Link
                  key={post.slug}
                  to={buildPath(locale, 'blogPost', { slug: post.slug })}
                  className="group flex flex-col rounded-lg border border-border bg-surface p-6 transition-colors hover:border-primary"
                >
                  <Icon name={post.icon} className="size-10 text-primary" />
                  <span className="mt-4 text-xs font-semibold uppercase tracking-wide text-primary">{post.category}</span>
                  <h3 className="mt-2 text-lg font-bold group-hover:text-primary">{post.title}</h3>
                  <p className="mt-2 flex-1 text-sm text-text-secondary">{post.excerpt}</p>
                  <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-primary">
                    {dict.common.actions.learnMore}
                    <Icon name="ArrowRight" className="size-4 transition-transform group-hover:translate-x-0.5" />
                  </span>
                </Link>
              ))}
            </div>
          ) : (
            <div className="container-base rounded-lg border border-dashed border-border p-10 text-center text-text-secondary">
              {b.empty}
            </div>
          )}
        </div>
      </section>
    </>
  )
}

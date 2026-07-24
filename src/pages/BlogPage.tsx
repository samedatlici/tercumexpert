import { useMemo, useState } from 'react'
import { PageHero } from '@/components/common/PageHero'
import { Icon } from '@/components/common/Icon'
import { Seo } from '@/components/seo/Seo'
import { useI18n } from '@/hooks/useI18n'
import { useBlogPosts } from '@/features/blog/model/useBlogPosts'
import { BlogCard } from '@/features/blog/ui/BlogCard'

/**
 * Blog listesi. Üstte "Blog / Çeviri dünyasından rehberler." + arama kutusu + önden seçili
 * "Tümü" filtresi (şimdilik başka filtre YOK — Samet kendi kategorilerini sonra ekleyecek).
 * Tüm yayınlanmış yazılar 3'lü grid; DB'den (locale/pazar) çekilir; yeni blog eklenince otomatik.
 * Marka renkleri (mavi/siyah), turuncu YOK. Tek tek yazı detay sayfaları Faz 2.
 */
export default function BlogPage() {
  const { dict, locale } = useI18n()
  const b = dict.blog
  const { posts, loading } = useBlogPosts(locale)
  const [query, setQuery] = useState('')

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return posts
    return posts.filter(
      (p) => p.title.toLowerCase().includes(q) || (p.excerpt ?? '').toLowerCase().includes(q),
    )
  }, [posts, query])

  return (
    <>
      <Seo title={b.seo.title} description={b.seo.description} routeId="blog" />
      <PageHero title={b.hero.title} subtitle={b.hero.subtitle} />

      <section className="section">
        <div className="container-wide">
          {/* Arama + "Tümü" filtresi (şimdilik tek, seçili) */}
          <div className="mb-10 flex flex-col gap-4">
            <div className="relative w-full max-w-md">
              <Icon name="Search" className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-text-secondary" />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={b.searchPlaceholder}
                className="w-full rounded-full border border-border bg-surface py-3 pl-12 pr-4 text-sm text-text-primary outline-none transition-colors focus:border-primary"
                aria-label={b.searchPlaceholder}
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <span className="rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground">
                {b.allCategories}
              </span>
            </div>
          </div>

          {loading ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {[0, 1, 2].map((i) => (
                <div key={i} className="animate-pulse overflow-hidden rounded-xl border border-border bg-surface">
                  <div className="aspect-[16/9] w-full bg-surface-muted" />
                  <div className="space-y-3 p-6">
                    <div className="h-5 w-3/4 rounded bg-surface-muted" />
                    <div className="h-4 w-full rounded bg-surface-muted" />
                    <div className="h-4 w-2/3 rounded bg-surface-muted" />
                  </div>
                </div>
              ))}
            </div>
          ) : filtered.length > 0 ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((p) => (
                <BlogCard key={p.id} post={p} />
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-border p-12 text-center text-text-secondary">
              {posts.length === 0 ? dict.home.blogTeaser.empty : b.empty}
            </div>
          )}
        </div>
      </section>
    </>
  )
}

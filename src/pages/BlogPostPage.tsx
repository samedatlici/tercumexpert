import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Icon } from '@/components/common/Icon'
import { Button } from '@/components/common/Button'
import { Seo } from '@/components/seo/Seo'
import { useI18n } from '@/hooks/useI18n'
import { buildPath } from '@/app/router/routes'
import { fetchPostBySlug, blogImageUrl, incrementViews } from '@/features/blog/model/api'
import { Markdown } from '@/features/blog/ui/Markdown'
import type { BlogPost } from '@/features/blog/model/types'

/**
 * Blog detay sayfası (Faz 2a): kalın başlık (görselin üstünde) → tam genişlik görsel →
 * markdown içerik (alt başlıklar/liste). Açılışta okunma sayacı +1 (oturum başına bir kez).
 * Sağ sticky panel ("Bu hizmete mi ihtiyacınız var?" + "Paylaş") FAZ 2b'de eklenecek.
 */
export default function BlogPostPage() {
  const { locale, dict } = useI18n()
  const params = useParams()
  const slug = (params['*'] ?? '').split('/').slice(1).join('/') // "blog/<slug>" → "<slug>"

  const [post, setPost] = useState<BlogPost | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    setLoading(true)
    fetchPostBySlug(locale, slug).then((p) => {
      if (!active) return
      setPost(p)
      setLoading(false)
      if (p) void incrementViews(p.id, p.slug)
    })
    return () => {
      active = false
    }
  }, [locale, slug])

  if (loading) {
    return (
      <section className="section">
        <div className="container-base animate-pulse space-y-6">
          <div className="h-10 w-3/4 rounded bg-surface-muted" />
          <div className="aspect-[16/9] w-full rounded-xl bg-surface-muted" />
          <div className="space-y-3">
            <div className="h-4 w-full rounded bg-surface-muted" />
            <div className="h-4 w-5/6 rounded bg-surface-muted" />
            <div className="h-4 w-2/3 rounded bg-surface-muted" />
          </div>
        </div>
      </section>
    )
  }

  if (!post) {
    return (
      <section className="section">
        <div className="container-base text-center">
          <h1 className="text-2xl font-bold">{dict.blog.empty}</h1>
          <Link to={buildPath(locale, 'blog')} className="mt-6 inline-block">
            <Button intent="secondary">{dict.blog.hero.title}</Button>
          </Link>
        </div>
      </section>
    )
  }

  const img = blogImageUrl(post.image_path)
  const date = new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'long', year: 'numeric' }).format(
    new Date(post.published_at),
  )
  const views = new Intl.NumberFormat(locale).format(post.views ?? 0)

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    datePublished: post.published_at,
    ...(img ? { image: img } : {}),
    author: { '@type': 'Organization', name: 'TercümExpert' },
    publisher: { '@type': 'Organization', name: 'TercümExpert' },
  }

  return (
    <>
      <Seo
        title={post.title}
        description={post.excerpt ?? post.title}
        routeId="blogPost"
        params={{ slug: post.slug }}
        jsonLd={jsonLd}
      />
      <article className="section">
        <div className="container-base">
          {post.category && (
            <p className="mb-3 text-sm font-semibold uppercase tracking-wide text-primary">{post.category}</p>
          )}
          <h1 className="text-4xl font-extrabold leading-tight tracking-tight md:text-5xl">{post.title}</h1>

          <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-text-secondary">
            <span>{date}</span>
            <span className="inline-flex items-center gap-1.5">
              <Icon name="Eye" className="size-4" />
              {views}
            </span>
          </div>

          {img && (
            <img
              src={img}
              alt={post.title}
              className="mt-8 aspect-[16/9] w-full rounded-xl object-cover"
            />
          )}

          <div className="mt-8 max-w-prose">
            <Markdown source={post.body} />
          </div>

          <div className="mt-12 border-t border-border pt-8">
            <Link to={buildPath(locale, 'blog')}>
              <Button intent="secondary">
                <Icon name="ArrowLeft" className="size-4" /> {dict.blog.hero.title}
              </Button>
            </Link>
          </div>
        </div>
      </article>
    </>
  )
}

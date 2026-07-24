import { Link } from 'react-router-dom'
import { Icon } from '@/components/common/Icon'
import { useI18n } from '@/hooks/useI18n'
import { buildPath } from '@/app/router/routes'
import { blogImageUrl } from '../model/api'
import type { BlogListItem } from '../model/types'

/**
 * Blog liste/anasayfa kartı (SS1 birebir): üstte sabit oranlı görsel, kalın başlık,
 * özet, ince ayraç + sol altta TARİH. NOT: "dk okuma" (okuma süresi) BİLEREK YOK.
 * Görsel yoksa (henüz iletilmedi) nötr yer tutucu gösterilir. Tek görsel hem burada
 * hem detay sayfasında kullanılır.
 */
export function BlogCard({ post }: { post: BlogListItem }) {
  const { locale } = useI18n()
  const img = blogImageUrl(post.image_path)
  const date = new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'long', year: 'numeric' }).format(
    new Date(post.published_at),
  )
  const views = new Intl.NumberFormat(locale).format(post.views ?? 0)

  return (
    <Link
      to={buildPath(locale, 'blogPost', { slug: post.slug })}
      className="group flex flex-col overflow-hidden rounded-xl border border-border bg-surface transition-shadow hover:shadow-lg"
    >
      <div className="aspect-[16/9] w-full overflow-hidden bg-surface-muted">
        {img ? (
          <img
            src={img}
            alt={post.title}
            loading="lazy"
            className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex size-full items-center justify-center bg-secondary/5">
            <Icon name="FileText" className="size-10 text-text-secondary/40" />
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col p-6">
        <h3 className="line-clamp-2 text-lg font-bold leading-snug text-text-primary transition-colors group-hover:text-primary">
          {post.title}
        </h3>
        {post.excerpt && <p className="mt-3 line-clamp-3 flex-1 text-sm text-text-secondary">{post.excerpt}</p>}
        <div className="mt-5 flex items-center justify-between border-t border-border pt-4 text-xs text-text-secondary">
          <span>{date}</span>
          <span className="inline-flex items-center gap-1.5">
            <Icon name="Eye" className="size-4" />
            {views}
          </span>
        </div>
      </div>
    </Link>
  )
}

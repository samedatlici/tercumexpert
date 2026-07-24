import { Link } from 'react-router-dom'
import { Icon } from '@/components/common/Icon'
import { Button } from '@/components/common/Button'
import { useI18n } from '@/hooks/useI18n'
import { buildPath } from '@/app/router/routes'
import type { BlogPost } from '../model/types'

/**
 * "Bu hizmete mi ihtiyacınız var?" kartı (SS5, marka renkleri). İÇERİĞE GÖRE DEĞİŞKEN:
 *  - post.service_key bir Hizmet Türü'ne denk geliyorsa → o hizmetin adı + kısa açıklaması
 *    + "saniyeler içinde fiyat" + "Hemen Fiyat Hesapla".
 *  - Aksi halde (haber/yasal/genel) → "Çeviri İhtiyacınız Mı Var?" + genel metin.
 */
export function ServiceCta({ post }: { post: BlogPost }) {
  const { locale, dict } = useI18n()
  const c = dict.blog.cta
  const items = dict.serviceItems as Record<string, { name: string; short: string }>
  const svc = post.service_key ? items[post.service_key] : undefined

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-surface">
      <div className="flex items-center gap-2 bg-primary px-5 py-3 text-primary-foreground">
        <Icon name="Zap" className="size-4" />
        <span className="font-bold">{svc ? c.needService : c.genericTitle}</span>
      </div>
      <div className="p-5">
        {svc ? (
          <>
            <h4 className="text-lg font-bold text-text-primary">{svc.name}</h4>
            <p className="mt-1 text-sm text-text-secondary">{svc.short}</p>
            <p className="mt-3 text-sm font-medium text-text-secondary">{c.quickPrice}</p>
          </>
        ) : (
          <>
            <h4 className="text-lg font-bold text-text-primary">{c.genericHeading}</h4>
            <p className="mt-2 text-sm text-text-secondary">{c.genericDesc}</p>
          </>
        )}
        <Link to={buildPath(locale, 'quote')} className="mt-4 block">
          <Button intent="primary" block>
            {c.button}
            <Icon name="ArrowRight" className="size-4" />
          </Button>
        </Link>
      </div>
    </div>
  )
}

import type { IconName } from '@/components/common/Icon'

/**
 * Örnek blog yazıları (§17: 3-4 kaliteli örnek yeterli; sahte onlarca yazı YOK).
 * İleride CMS'e bağlanabilecek veri modeli. Tarihler ISO; readingTime dakika.
 */
export interface BlogPost {
  slug: string
  category: string
  readingMinutes: number
  title: string
  excerpt: string
  icon: IconName
  date: string
  author: string
}

export const BLOG_POSTS: BlogPost[] = [
  {
    slug: 'hatali-tercumenin-hukuki-ve-mali-maliyeti',
    category: 'Hukuki Süreçler',
    readingMinutes: 8,
    title: 'Hatalı Tercümenin Hukuki ve Mali Maliyeti',
    excerpt: 'Profesyonel olmayan çevirilerin yasal süreçlerde neden olduğu sorunlar ve mali yükümlülükler.',
    icon: 'FileText',
    date: '2026-06-10',
    author: 'TercümExpert',
  },
  {
    slug: 'yeminli-tercume-nedir-hangi-belgelerde-gereklidir',
    category: 'Yeminli Tercüme',
    readingMinutes: 6,
    title: 'Yeminli Tercüme Nedir? Hangi Belgelerde Gereklidir?',
    excerpt: 'Yeminli tercüme sürecinin detayları, yasal gereklilikleri ve uygulama alanları hakkında kapsamlı rehber.',
    icon: 'Scale',
    date: '2026-05-28',
    author: 'TercümExpert',
  },
  {
    slug: 'apostil-sureci-uluslararasi-belge-onayi-rehberi',
    category: 'Resmî Süreçler',
    readingMinutes: 7,
    title: 'Apostil Süreci: Uluslararası Belge Onayı Rehberi',
    excerpt: 'Lahey Sözleşmesi kapsamında apostil işlemleri, gerekli belgeler ve süreç yönetimi.',
    icon: 'Globe2',
    date: '2026-05-14',
    author: 'TercümExpert',
  },
  {
    slug: 'vize-basvurularinda-en-sik-tercume-edilen-belgeler',
    category: 'Vize İşlemleri',
    readingMinutes: 5,
    title: 'Vize Başvurularında En Sık Tercüme Edilen Belgeler',
    excerpt: 'Schengen, ABD ve diğer vize başvurularında gerekli belgeler ve çeviri gereksinimleri.',
    icon: 'Stamp',
    date: '2026-04-30',
    author: 'TercümExpert',
  },
]

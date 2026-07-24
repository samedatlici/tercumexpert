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
  /**
   * Yayında mı? Yalnızca `published !== false` olan yazılar sitede (anasayfa + blog
   * listesi) gösterilir. Aşağıdaki 4 örnek şimdilik `published: false` (taslak) —
   * dosyada durur ama görünmez. Gerçek blog girişi eklerken bu alanı yazma (veya
   * `published: true` yap); yazı otomatik olarak anasayfaya ve blog listesine düşer,
   * en yeni tarih en solda/en üstte olacak şekilde sıralanır.
   */
  published?: boolean
}

/** Yayında yazıları en yeni tarih önce (en solda) olacak şekilde döndürür. */
export function publishedPosts(): BlogPost[] {
  return BLOG_POSTS.filter((p) => p.published !== false).sort((a, b) => b.date.localeCompare(a.date))
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
    published: false,
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
    published: false,
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
    published: false,
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
    published: false,
  },
]

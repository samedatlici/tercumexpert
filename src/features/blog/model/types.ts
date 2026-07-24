/**
 * Blog yazısı (veritabanı şekli — supabase/blog.sql `blog_posts`).
 * Bloglar artık statik dosyada değil DB'de; admin panelinden düzenlenip silinir.
 */
export interface BlogPost {
  id: string
  market: 'tr' | 'global'
  locale: string
  slug: string
  title: string
  excerpt: string | null
  body: string // markdown
  image_path: string | null
  service_key: string | null
  category: string | null
  published_at: string // ISO — sıralama: en yeni önce
}

/** Kart/liste için gövde hariç alanlar (daha hafif select). */
export type BlogListItem = Omit<BlogPost, 'body'>

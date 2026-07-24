import { supabase } from '@/lib/supabase'
import type { BlogPost, BlogListItem } from './types'

/**
 * Blog okuma (public). Yayınlanmış yazılar RLS ile herkese açıktır; anon istemciyle
 * doğrudan okunur. Admin yazma/silme api/blog.ts (service role) üzerinden yapılır (Faz 3).
 *
 * Pazar ayrımı: /tr → market='tr' (Türkiye'ye özel), diğer diller → market='global'.
 */
export function marketForLocale(locale: string): 'tr' | 'global' {
  return locale === 'tr' ? 'tr' : 'global'
}

const LIST_COLS = 'id,market,locale,slug,title,excerpt,image_path,service_key,category,published_at'
const FULL_COLS = `${LIST_COLS},body`

/** Yayınlanmış yazılar, en yeni önce. limit verilirse ilk N (anasayfa için 3). */
export async function fetchPublishedPosts(locale: string, limit?: number): Promise<BlogListItem[]> {
  const market = marketForLocale(locale)
  const base = supabase
    .from('blog_posts')
    .select(LIST_COLS)
    .eq('published', true)
    .eq('market', market)
    .order('published_at', { ascending: false })
  const { data, error } = await (limit ? base.limit(limit) : base)
  if (error) {
    // Tablo henüz yoksa (SQL çalıştırılmadıysa) sessizce boş dön → "çok yakında" durumu.
    return []
  }
  return (data ?? []) as BlogListItem[]
}

/** Tek yazı (detay sayfası) — gövde dahil. Bulunamazsa null. */
export async function fetchPostBySlug(locale: string, slug: string): Promise<BlogPost | null> {
  const market = marketForLocale(locale)
  const { data, error } = await supabase
    .from('blog_posts')
    .select(FULL_COLS)
    .eq('published', true)
    .eq('market', market)
    .eq('slug', slug)
    .maybeSingle()
  if (error) return null
  return (data as BlogPost) ?? null
}

/** blog-images (public bucket) → tam URL. Görsel yoksa null. */
export function blogImageUrl(path: string | null | undefined): string | null {
  if (!path) return null
  return supabase.storage.from('blog-images').getPublicUrl(path).data.publicUrl
}

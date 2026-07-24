import { useEffect, useState } from 'react'
import { fetchPublishedPosts } from './api'
import type { BlogListItem } from './types'

/** Yayınlanmış blogları locale/pazara göre çeker (public). limit → anasayfa (3). */
export function useBlogPosts(locale: string, limit?: number) {
  const [posts, setPosts] = useState<BlogListItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    setLoading(true)
    fetchPublishedPosts(locale, limit).then((p) => {
      if (!active) return
      setPosts(p)
      setLoading(false)
    })
    return () => {
      active = false
    }
  }, [locale, limit])

  return { posts, loading }
}

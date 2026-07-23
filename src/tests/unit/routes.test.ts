import { describe, expect, it } from 'vitest'
import { buildPath, getSlug, resolveRouteId } from '@/app/router/routes'

describe('route slug eşleme', () => {
  it('locale bazlı slug üretir', () => {
    expect(getSlug('corporate', 'tr')).toBe('kurumsal')
    expect(getSlug('corporate', 'en')).toBe('corporate')
    expect(getSlug('services', 'de')).toBe('leistungen')
  })

  it('tam yol üretir', () => {
    expect(buildPath('tr', 'corporate')).toBe('/tr/kurumsal')
    expect(buildPath('en', 'quote')).toBe('/en/get-quote')
    expect(buildPath('tr', 'home')).toBe('/tr')
  })

  it('splat path -> routeId çözer', () => {
    expect(resolveRouteId('tr', '')?.routeId).toBe('home')
    expect(resolveRouteId('tr', 'kurumsal')?.routeId).toBe('corporate')
    expect(resolveRouteId('tr', 'partner')?.routeId).toBe('partnership')
    const post = resolveRouteId('tr', 'blog/yeminli-tercume-nedir')
    expect(post?.routeId).toBe('blogPost')
    expect(post?.params.slug).toBe('yeminli-tercume-nedir')
  })

  it('bilinmeyen path null döner (404)', () => {
    expect(resolveRouteId('tr', 'olmayan-sayfa')).toBeNull()
  })
})

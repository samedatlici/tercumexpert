import { describe, expect, it } from 'vitest'
import { isDisplayableInProduction, verifiable } from '@/types/verification'
import { statDisplay, STATISTICS } from '@/app/config/statistics'

describe('verification', () => {
  it('yalnız verified üretimde gösterilebilir', () => {
    expect(isDisplayableInProduction('verified')).toBe(true)
    expect(isDisplayableInProduction('unverified')).toBe(false)
    expect(isDisplayableInProduction('draft')).toBe(false)
    expect(isDisplayableInProduction('requires-legal-review')).toBe(false)
  })

  it('verifiable helper opsiyonel note', () => {
    expect(verifiable('x', 'verified')).toEqual({ value: 'x', status: 'verified' })
    expect(verifiable('y', 'draft', 'not').note).toBe('not')
  })

  it('istatistikler doğrulanmadı olarak işaretli (yayından önce teyit)', () => {
    const completed = STATISTICS.find((s) => s.key === 'completed')!
    expect(completed.status).toBe('unverified')
    // DEMO gösterim: safeDisplay kullanılır (verified olmadığı için rawValue değil).
    expect(statDisplay(completed)).toBe(completed.safeDisplay)
  })
})

import { describe, expect, it } from 'vitest'
import { formatCurrency, formatNumber } from '@/lib/format'

describe('formatCurrency', () => {
  it('TRY para birimi ve locale gruplaması', () => {
    const out = formatCurrency(1854, 'tr')
    expect(out).toContain('1.854')
    expect(out).toMatch(/₺|TRY/)
  })
})

describe('formatNumber', () => {
  it('binlik ayırıcı', () => {
    expect(formatNumber(15000, 'tr')).toContain('15.000')
  })
})

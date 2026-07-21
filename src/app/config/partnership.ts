/**
 * İş ortaklığı ticari şartları (§15). Merkezi config — hukuki onay olmadan
 * kesin/değiştirilemez sözleşme maddesi gibi sunulmaz. Sözleşmeye tabidir.
 */
export const PARTNERSHIP = {
  commissionRate: 0.2, // %20
  paymentPeriodDays: 15,
  startupFee: 0,
  exampleOrderAmount: 5000,
} as const

export function partnerEarning(orderAmount: number, rate: number = PARTNERSHIP.commissionRate): number {
  return Math.round(orderAmount * rate)
}

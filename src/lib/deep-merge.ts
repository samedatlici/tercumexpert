/** Derinlemesine kısmi tip — çeviri fallback'i için. */
export type DeepPartial<T> = T extends (infer U)[]
  ? U[]
  : T extends object
    ? { [K in keyof T]?: DeepPartial<T[K]> }
    : T

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/**
 * base üzerine override'ı derinlemesine birleştirir (array'ler override edilir).
 * i18n: eksik anahtarlar fallback dilinden gelir; var olanlar üzerine yazılır.
 */
export function deepMerge<T>(base: T, override: DeepPartial<T>): T {
  if (!isPlainObject(base) || !isPlainObject(override)) {
    return (override as T) ?? base
  }
  const result: Record<string, unknown> = { ...base }
  for (const key of Object.keys(override)) {
    const o = (override as Record<string, unknown>)[key]
    if (o === undefined) continue
    const b = (base as Record<string, unknown>)[key]
    result[key] = isPlainObject(b) && isPlainObject(o) ? deepMerge(b, o as DeepPartial<typeof b>) : o
  }
  return result as T
}

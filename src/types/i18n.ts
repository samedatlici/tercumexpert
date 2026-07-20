import { tr } from '@/content/tr'
import type { DeepPartial } from '@/lib/deep-merge'

/** Sözlük tipinin kaynağı: Türkçe içerik (tam). */
export type Dictionary = typeof tr

/** Diğer diller bunun kısmi hâlidir; eksikler fallback ile tamamlanır. */
export type PartialDictionary = DeepPartial<Dictionary>

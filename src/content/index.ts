import { deepMerge } from '@/lib/deep-merge'
import type { Dictionary, PartialDictionary } from '@/types/i18n'
import type { Locale } from '@/app/config/locales'
import { tr } from './tr'
import { en } from './en'
import { fr } from './fr'
import { de } from './de'
import { es } from './es'
import { ar } from './ar'
import { ru } from './ru'
import { it } from './it'
import { nl } from './nl'
import { az } from './az'
import { pl } from './pl'
import { bg } from './bg'
import { pt } from './pt'
import { da } from './da'

const PARTIALS: Record<Locale, PartialDictionary> = { tr, en, fr, de, es, ar, ru, it, nl, az, pl, bg, pt, da }

/**
 * İstenen dilin tam sözlüğünü üretir. Fallback zinciri (§10):
 * TR (tam kaynak) <- EN (base) <- istenen dil.
 * Böylece eksik anahtar hiçbir zaman görünmez; placeholder diller EN'e düşer.
 */
export function getDictionary(locale: Locale): Dictionary {
  const base = deepMerge<Dictionary>(tr, en)
  if (locale === 'tr') return deepMerge<Dictionary>(tr, {}) // saf TR
  if (locale === 'en') return base
  return deepMerge<Dictionary>(base, PARTIALS[locale])
}

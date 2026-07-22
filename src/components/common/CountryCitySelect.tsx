import { COUNTRIES } from '@/app/config/country-codes'
import { regionsFor } from '@/app/config/regions'
import { useI18n } from '@/hooks/useI18n'
import { cn } from '@/lib/cn'

/** Ülke adını arayüz diline çevirir (Intl); olmazsa config'teki İngilizce ad. */
export function countryDisplayName(iso: string, locale: string, fallback = ''): string {
  if (!iso) return fallback
  try {
    return new Intl.DisplayNames([locale], { type: 'region' }).of(iso.toUpperCase()) ?? fallback
  } catch {
    return fallback
  }
}

const SELECT_CLASS =
  'min-h-[44px] w-full rounded-md border border-border bg-surface px-3 text-base outline-none focus:border-border-strong'

/**
 * Ülke + Şehir/Eyalet seçici (EMOJİSİZ). Ülke seçilmeden şehir kutusu KAPALIDIR;
 * ülke seçilince o ülkenin birinci-düzey idari bölümleri (il/eyalet/bölge) listelenir.
 * `country` = ISO kodu (ör. "tr"); `city` = seçilen bölüm adı. Yazım hatası olmaz.
 */
export function CountryCitySelect({
  country,
  city,
  onCountry,
  onCity,
  countryLabel,
  cityLabel,
  countryPlaceholder,
  cityPlaceholder,
  cityDisabledPlaceholder,
  required,
  className,
}: {
  country: string
  city: string
  onCountry: (iso: string) => void
  onCity: (city: string) => void
  countryLabel: string
  cityLabel: string
  countryPlaceholder: string
  cityPlaceholder: string
  cityDisabledPlaceholder: string
  required?: boolean
  className?: string
}) {
  const { locale } = useI18n()
  const cities = regionsFor(country)

  return (
    <div className={cn('grid gap-4 sm:grid-cols-2', className)}>
      <div>
        <label className="mb-1.5 block text-sm font-medium">
          {countryLabel} {required && <span className="text-danger">*</span>}
        </label>
        <select
          value={country}
          onChange={(e) => {
            onCountry(e.target.value)
            onCity('')
          }}
          className={SELECT_CLASS}
          aria-label={countryLabel}
        >
          <option value="">{countryPlaceholder}</option>
          {COUNTRIES.map((c) => (
            <option key={c.iso} value={c.iso}>
              {countryDisplayName(c.iso, locale, c.name)}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="mb-1.5 block text-sm font-medium">
          {cityLabel} {required && <span className="text-danger">*</span>}
        </label>
        <select
          value={city}
          onChange={(e) => onCity(e.target.value)}
          disabled={!country}
          className={cn(SELECT_CLASS, !country && 'cursor-not-allowed opacity-60')}
          aria-label={cityLabel}
        >
          <option value="">{country ? cityPlaceholder : cityDisabledPlaceholder}</option>
          {cities.map((x) => (
            <option key={x} value={x}>
              {x}
            </option>
          ))}
        </select>
      </div>
    </div>
  )
}

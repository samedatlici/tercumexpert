import { useState } from 'react'
import { COUNTRIES, dialOf, defaultCountryForLocale } from '@/app/config/country-codes'
import { useI18n } from '@/hooks/useI18n'
import { cn } from '@/lib/cn'

/**
 * Tekrar kullanılabilir telefon girişi: solda bayrak + ülke kodu seçici (50+ ülke),
 * sağda numara. Site diline göre varsayılan ülke seçilir. `onChange`, birleşik
 * telefonu döndürür: "+90 5xx xxx xx xx" (numara boşsa boş string).
 * Kendi ülke/numara durumunu yönetir; ebeveyn yalnızca birleşik değeri alır.
 */
export function PhoneInput({
  onChange,
  defaultCountry,
  placeholder,
  id,
  className,
  variant = 'default',
}: {
  onChange: (fullPhone: string) => void
  defaultCountry?: string
  placeholder?: string
  id?: string
  className?: string
  /** 'dark' → koyu zeminli formlar (Kurumsal sayfası) için beyaz metinli stil. */
  variant?: 'default' | 'dark'
}) {
  const { locale } = useI18n()
  const [country, setCountry] = useState(() => defaultCountry ?? defaultCountryForLocale(locale))
  const [num, setNum] = useState('')

  const emit = (iso: string, n: string) => {
    const t = n.trim()
    onChange(t ? `${dialOf(iso)} ${t}` : '')
  }

  const dark = variant === 'dark'
  const selectClass = dark
    ? 'w-[5.5rem] shrink-0 rounded-md border border-white/20 bg-secondary px-2 text-base text-white outline-none focus:border-white/50'
    : 'w-[5.5rem] shrink-0 rounded-md border border-border bg-surface px-2 text-base outline-none focus:border-border-strong'
  const inputClass = dark
    ? 'min-h-[42px] w-full flex-1 rounded-md border border-white/20 bg-white/5 px-3 text-base text-white placeholder:text-white/40 outline-none focus:border-white/50'
    : 'min-h-[42px] w-full flex-1 rounded-md border border-border bg-surface px-3 text-base outline-none focus:border-border-strong'

  return (
    <div className={cn('flex gap-2', className)}>
      <select
        value={country}
        onChange={(e) => {
          setCountry(e.target.value)
          emit(e.target.value, num)
        }}
        aria-label="Ülke kodu"
        className={selectClass}
      >
        {COUNTRIES.map((x) => (
          <option key={x.iso} value={x.iso} className="text-black">
            {x.flag} {x.dial}
          </option>
        ))}
      </select>
      <input
        id={id}
        type="tel"
        dir="ltr"
        inputMode="tel"
        autoComplete="tel-national"
        value={num}
        onChange={(e) => {
          setNum(e.target.value)
          emit(country, e.target.value)
        }}
        placeholder={placeholder}
        className={inputClass}
      />
    </div>
  )
}

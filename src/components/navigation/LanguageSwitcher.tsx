import { useEffect, useRef, useState } from 'react'
import { Link, useLocation, useParams } from 'react-router-dom'
import { Icon } from '@/components/common/Icon'
import { useI18n } from '@/hooks/useI18n'
import { cn } from '@/lib/cn'
import { LOCALES, isLocale, type Locale } from '@/app/config/locales'
import { buildPath, resolveRouteId } from '@/app/router/routes'

/**
 * Dil seçici (§8, §10). Dil değişince kullanıcı AYNI sayfanın diğer dildeki
 * karşılığına gider (routeId korunarak). Erişilebilir menü: Esc + dış tık ile kapanır.
 */
export function LanguageSwitcher({ onNavigate, dropUp }: { onNavigate?: () => void; dropUp?: boolean }) {
  const { locale, dict } = useI18n()
  const { lang } = useParams()
  const location = useLocation()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('keydown', onKey)
    document.addEventListener('mousedown', onClick)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('mousedown', onClick)
    }
  }, [open])

  const activeLang: Locale = isLocale(lang) ? lang : locale
  const splat = location.pathname.replace(new RegExp(`^/${activeLang}/?`), '')
  const resolved = resolveRouteId(activeLang, splat)

  const targetFor = (code: Locale): string =>
    resolved
      ? buildPath(code, resolved.routeId, resolved.params)
      : buildPath(code, 'home')

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex min-h-[44px] items-center gap-1.5 rounded-md px-3 text-sm font-medium text-text-primary hover:bg-surface-muted"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={dict.common.actions.selectLanguage}
      >
        <Icon name="Globe" className="size-4" />
        <span className="uppercase">{activeLang}</span>
        <Icon name="ChevronDown" className={cn('size-4 transition-transform', open && 'rotate-180')} />
      </button>

      {open && (
        <ul
          role="listbox"
          className={cn(
            'absolute z-drawer min-w-[10rem] max-h-[60vh] overflow-y-auto rounded-md border border-border bg-surface py-1 shadow-md',
            dropUp ? 'bottom-full start-0 mb-1' : 'end-0 mt-1',
          )}
        >
          {LOCALES.map((l) => (
            <li key={l.code} role="option" aria-selected={l.code === activeLang}>
              <Link
                to={targetFor(l.code)}
                onClick={() => {
                  setOpen(false)
                  onNavigate?.()
                }}
                className={cn(
                  'flex items-center justify-between px-3 py-2 text-sm hover:bg-surface-muted',
                  l.code === activeLang && 'font-semibold',
                )}
              >
                <span>{l.label}</span>
                <span className="text-xs uppercase text-text-muted">{l.code}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

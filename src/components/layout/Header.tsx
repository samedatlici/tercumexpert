import { useEffect, useRef, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Button } from '@/components/common/Button'
import { Icon } from '@/components/common/Icon'
import { LanguageSwitcher } from '@/components/navigation/LanguageSwitcher'
import { useI18n } from '@/hooks/useI18n'
import { useScrollLock } from '@/hooks/useScrollLock'
import { cn } from '@/lib/cn'
import { company } from '@/app/config/site.config'
import { MAIN_NAV } from '@/app/config/navigation'
import { buildPath } from '@/app/router/routes'

const isPlaceholder = (v: string) => v.trim().startsWith('[')

/**
 * İki seviyeli header (§8): topbar (scroll'da gizlenir) + sticky ana navbar.
 * Mobilde erişilebilir drawer (focus trap, Esc, scroll lock). Sabit yükseklik ~68-72px.
 */
export function Header() {
  const { locale, dict } = useI18n()
  const location = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)
  const [topbarHidden, setTopbarHidden] = useState(false)
  const drawerRef = useRef<HTMLDivElement>(null)
  const menuButtonRef = useRef<HTMLButtonElement>(null)

  useScrollLock(menuOpen)

  // Route değişince menüyü kapat
  useEffect(() => setMenuOpen(false), [location.pathname])

  // Topbar'ı aşağı scroll'da gizle
  useEffect(() => {
    const onScroll = () => setTopbarHidden(window.scrollY > 80)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Drawer: Esc kapatır + basit focus trap
  useEffect(() => {
    if (!menuOpen) return
    const node = drawerRef.current
    const focusables = node?.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), input, [tabindex]:not([tabindex="-1"])',
    )
    focusables?.[0]?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setMenuOpen(false)
        menuButtonRef.current?.focus()
        return
      }
      if (e.key !== 'Tab' || !focusables || focusables.length === 0) return
      const first = focusables[0]!
      const last = focusables[focusables.length - 1]!
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [menuOpen])

  const navItems = MAIN_NAV.map((key) => ({
    key,
    label: dict.common.nav[key],
    to: buildPath(locale, key),
  }))

  const isActive = (to: string) =>
    to === buildPath(locale, 'home') ? location.pathname === to : location.pathname.startsWith(to)

  return (
    <header className="sticky top-0 z-header border-b border-border bg-surface/95 backdrop-blur">
      {/* Topbar */}
      <div
        className={cn(
          'hidden border-b border-border bg-surface-muted text-sm text-text-secondary transition-[max-height,opacity] duration-base md:block',
          topbarHidden ? 'max-h-0 overflow-hidden opacity-0' : 'max-h-12 opacity-100',
        )}
      >
        <div className="container-wide flex h-10 items-center justify-between gap-4">
          <div className="flex items-center gap-5">
            {!isPlaceholder(company.phone.value) && (
              <a href={`tel:${company.phone.value}`} className="inline-flex items-center gap-1.5 hover:text-text-primary">
                <Icon name="Phone" className="size-3.5" /> {company.phone.value}
              </a>
            )}
            {!isPlaceholder(company.email.value) && (
              <a href={`mailto:${company.email.value}`} className="inline-flex items-center gap-1.5 hover:text-text-primary">
                <Icon name="Mail" className="size-3.5" /> {company.email.value}
              </a>
            )}
          </div>
          <div className="flex items-center gap-4">
            <span>{company.workingHours.value}</span>
            <span className="text-text-muted">{dict.common.topbar.afterHours}</span>
          </div>
        </div>
      </div>

      {/* Ana navbar */}
      <div className="container-wide flex h-[68px] items-center justify-between gap-4">
        <Link to={buildPath(locale, 'home')} className="text-xl font-bold tracking-tight text-text-primary">
          {dict.common.brand}
        </Link>

        <nav aria-label="Ana menü" className="hidden items-center gap-1 lg:flex">
          {navItems.map((item) => (
            <Link
              key={item.key}
              to={item.to}
              aria-current={isActive(item.to) ? 'page' : undefined}
              className={cn(
                'rounded-md px-3 py-2 text-sm font-medium transition-colors',
                isActive(item.to)
                  ? 'text-primary'
                  : 'text-text-secondary hover:bg-surface-muted hover:text-text-primary',
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <div className="hidden lg:block">
            <LanguageSwitcher />
          </div>
          <Link to={buildPath(locale, 'quote')} className="hidden sm:block">
            <Button intent="primary" size="sm">
              {dict.common.actions.getQuote}
            </Button>
          </Link>
          <button
            ref={menuButtonRef}
            type="button"
            onClick={() => setMenuOpen(true)}
            className="inline-flex size-11 items-center justify-center rounded-md text-text-primary hover:bg-surface-muted lg:hidden"
            aria-label={dict.common.actions.openMenu}
            aria-expanded={menuOpen}
          >
            <Icon name="Menu" className="size-6" />
          </button>
        </div>
      </div>

      {/* Mobil drawer */}
      {menuOpen && (
        <div className="fixed inset-0 z-drawer lg:hidden">
          <div
            className="absolute inset-0 bg-black/40 animate-fade-in"
            onClick={() => setMenuOpen(false)}
            aria-hidden="true"
          />
          <div
            ref={drawerRef}
            role="dialog"
            aria-modal="true"
            aria-label="Menü"
            className="absolute inset-y-0 end-0 flex w-[min(88%,20rem)] flex-col bg-surface shadow-lg animate-fade-in-up"
          >
            <div className="flex h-[68px] items-center justify-between border-b border-border px-4">
              <span className="font-bold">{dict.common.brand}</span>
              <button
                type="button"
                onClick={() => setMenuOpen(false)}
                className="inline-flex size-11 items-center justify-center rounded-md hover:bg-surface-muted"
                aria-label={dict.common.actions.closeMenu}
              >
                <Icon name="X" className="size-6" />
              </button>
            </div>
            <nav aria-label="Mobil menü" className="flex-1 overflow-y-auto px-2 py-3">
              {navItems.map((item) => (
                <Link
                  key={item.key}
                  to={item.to}
                  aria-current={isActive(item.to) ? 'page' : undefined}
                  className={cn(
                    'flex min-h-[48px] items-center rounded-md px-3 text-base font-medium',
                    isActive(item.to) ? 'bg-surface-muted text-primary' : 'text-text-primary hover:bg-surface-muted',
                  )}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
            <div className="space-y-3 border-t border-border p-4">
              <LanguageSwitcher onNavigate={() => setMenuOpen(false)} />
              <Link to={buildPath(locale, 'quote')}>
                <Button intent="primary" block>
                  {dict.common.actions.getQuote}
                </Button>
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  )
}

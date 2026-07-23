import { useState } from 'react'
import { Icon } from './Icon'
import { cn } from '@/lib/cn'

/**
 * Şifre girişi + göz düğmesi: sağdaki göze tıklayınca şifre metni açık/gizli olur.
 * RTL'de göz otomatik sola geçer (end).
 */
export function PasswordInput({
  value,
  onChange,
  autoComplete,
  className,
  placeholder,
  showLabel,
  hideLabel,
}: {
  value: string
  onChange: (v: string) => void
  autoComplete?: string
  className?: string
  placeholder?: string
  showLabel: string
  hideLabel: string
}) {
  const [show, setShow] = useState(false)
  return (
    <div className="relative">
      <input
        type={show ? 'text' : 'password'}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoComplete={autoComplete}
        placeholder={placeholder}
        className={cn(className, 'pe-11')}
      />
      <button
        type="button"
        onClick={() => setShow((s) => !s)}
        aria-label={show ? hideLabel : showLabel}
        title={show ? hideLabel : showLabel}
        className="absolute inset-y-0 end-0 flex w-11 items-center justify-center text-text-muted transition-colors hover:text-text-primary"
      >
        <Icon name={show ? 'EyeOff' : 'Eye'} className="size-5" />
      </button>
    </div>
  )
}

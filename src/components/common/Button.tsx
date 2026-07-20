import { forwardRef, type ButtonHTMLAttributes } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/cn'

/**
 * Buton primitive'i (§6: keskin radius, belirgin CTA). intent × size = cva.
 * Pill görünümü YOK (rounded-md). Yalnız semantic token kullanır.
 */
const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md font-medium transition-colors duration-base focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 min-h-[44px]',
  {
    variants: {
      intent: {
        primary: 'bg-primary text-primary-foreground hover:bg-primary-hover',
        secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary-hover',
        outline: 'border border-border-strong bg-surface text-text-primary hover:bg-surface-muted',
        ghost: 'text-text-primary hover:bg-surface-muted',
        whatsapp: 'bg-[#25D366] text-black hover:brightness-95',
      },
      size: {
        sm: 'h-11 px-4 text-sm',
        md: 'h-11 px-5 text-base',
        lg: 'h-12 px-6 text-base',
      },
      block: { true: 'w-full', false: '' },
    },
    defaultVariants: { intent: 'primary', size: 'md', block: false },
  },
)

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, intent, size, block, type = 'button', ...props }, ref) => (
    <button
      ref={ref}
      type={type}
      className={cn(buttonVariants({ intent, size, block }), className)}
      {...props}
    />
  ),
)
Button.displayName = 'Button'

export { buttonVariants }

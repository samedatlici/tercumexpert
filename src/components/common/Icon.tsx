import {
  ArrowRight,
  Check,
  ChevronDown,
  Cog,
  FileCheck2,
  Globe,
  Globe2,
  GraduationCap,
  HeartPulse,
  Mail,
  MapPin,
  Menu,
  MessageCircle,
  Phone,
  Scale,
  ShieldCheck,
  Stamp,
  Upload,
  X,
  type LucideProps,
} from 'lucide-react'

/**
 * İkon registry (§7: emoji YOK, tek stroke ailesi Lucide). Dekoratif ikonlar
 * aria-hidden; anlam taşıyan ikonlar `label` ile erişilebilir olur.
 */
const REGISTRY = {
  Stamp,
  FileCheck2,
  Globe2,
  Scale,
  Cog,
  HeartPulse,
  GraduationCap,
  Globe,
  ShieldCheck,
  ArrowRight,
  Check,
  ChevronDown,
  Menu,
  X,
  Upload,
  MessageCircle,
  Phone,
  Mail,
  MapPin,
} as const

export type IconName = keyof typeof REGISTRY

interface IconProps extends Omit<LucideProps, 'ref'> {
  name: IconName
  /** Anlam taşıyan ikon için erişilebilir etiket. Verilmezse dekoratif (aria-hidden). */
  label?: string
}

export function Icon({ name, label, strokeWidth = 1.75, ...props }: IconProps) {
  const Cmp = REGISTRY[name]
  return (
    <Cmp
      strokeWidth={strokeWidth}
      aria-hidden={label ? undefined : true}
      role={label ? 'img' : undefined}
      aria-label={label}
      {...props}
    />
  )
}

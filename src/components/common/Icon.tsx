import {
  Activity,
  ArrowRight,
  BarChart3,
  Building2,
  Check,
  CircleCheck,
  ChevronDown,
  Clock,
  Cog,
  FileCheck2,
  FileText,
  Globe,
  Globe2,
  GraduationCap,
  HeartPulse,
  Languages,
  Mail,
  MapPin,
  Menu,
  MessageCircle,
  MessageSquare,
  PackageCheck,
  Phone,
  QrCode,
  Scale,
  Settings,
  ShieldCheck,
  Stamp,
  Star,
  TrendingUp,
  Upload,
  Wallet,
  X,
  type LucideProps,
} from 'lucide-react'

/**
 * İkon registry (§7: emoji YOK, tek stroke ailesi Lucide). Dekoratif ikonlar
 * aria-hidden; anlam taşıyan ikonlar `label` ile erişilebilir olur.
 */
const REGISTRY = {
  // Hizmetler
  Stamp,
  FileCheck2,
  Globe2,
  Scale,
  Cog,
  HeartPulse,
  GraduationCap,
  Globe,
  // Nasıl çalışır
  Upload,
  Settings,
  CircleCheck,
  Activity,
  PackageCheck,
  // Neden biz
  TrendingUp,
  MessageSquare,
  Languages,
  Building2,
  // İstatistik
  BarChart3,
  // İş ortaklığı
  Wallet,
  QrCode,
  // Genel
  ShieldCheck,
  ArrowRight,
  Check,
  ChevronDown,
  Menu,
  X,
  MessageCircle,
  Phone,
  Mail,
  MapPin,
  Clock,
  FileText,
  Star,
  // Sosyal
  Facebook,
  Twitter,
  Linkedin,
  Instagram,
} as const

export type IconName = keyof typeof REGISTRY

interface IconProps extends Omit<LucideProps, 'ref'> {
  name: IconName
  /** Anlam taşıyan ikon için erişilebilir etiket. Verilmezse dekoratif (aria-hidden). */
  label?: string
}

export function Icon({ name, label, strokeWidth = 1.75, ...props }: IconProps) {
  const Cmp = REGISTRY[name]
  if (!Cmp) return null
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

import {
  Stamp, FileCheck2, Globe2, Scale, Cog, HeartPulse, GraduationCap, Globe, Upload, Settings,
  CircleCheck, Activity, PackageCheck, TrendingUp, MessageSquare, Languages, Building2, BarChart3,
  Wallet, QrCode, ShieldCheck, ArrowRight, Check, ChevronDown, Menu, X, MessageCircle, Phone, Mail,
  MapPin, Clock, FileText, Star, Lock, Target, Users, Home, Plane, Briefcase, Code, Truck,
  Paperclip, ImageIcon, ArrowRightLeft, ArrowLeft, Coins, Landmark, ChevronRight, Eye, EyeOff, KeyRound,
  Search, Pencil, Trash2, type LucideProps,
} from 'lucide-react'

/** İkon registry (§7: emoji YOK, tek stroke ailesi Lucide). Marka ikonları (Facebook vb.)
 *  Lucide'de kaldırıldığı için KULLANILMAZ; sosyal ikonlar Footer'da inline SVG'dir. */
const REGISTRY = {
  Stamp, FileCheck2, Globe2, Scale, Cog, HeartPulse, GraduationCap, Globe, Upload, Settings,
  CircleCheck, Activity, PackageCheck, TrendingUp, MessageSquare, Languages, Building2, BarChart3,
  Wallet, QrCode, ShieldCheck, ArrowRight, Check, ChevronDown, Menu, X, MessageCircle, Phone, Mail,
  MapPin, Clock, FileText, Star, Lock, Target, Users, Home, Plane, Briefcase, Code, Truck,
  Paperclip, Image: ImageIcon, ArrowRightLeft, ArrowLeft, Coins, Landmark, ChevronRight, Eye, EyeOff, KeyRound,
  Search, Pencil, Trash2,
} as const

export type IconName = keyof typeof REGISTRY

interface IconProps extends Omit<LucideProps, 'ref'> {
  name: IconName
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

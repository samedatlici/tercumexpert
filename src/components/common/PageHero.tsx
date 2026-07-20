import type { ReactNode } from 'react'

/** Sayfa başlığı bölümü (tutarlı hero). Tek H1 (a11y §25). */
export function PageHero({ title, subtitle, children }: { title: string; subtitle?: string; children?: ReactNode }) {
  return (
    <section className="border-b border-border bg-surface-muted">
      <div className="container-wide py-12 lg:py-16">
        <h1 className="text-4xl font-bold tracking-tight text-text-primary">{title}</h1>
        {subtitle && <p className="mt-3 max-w-prose text-lg text-text-secondary">{subtitle}</p>}
        {children && <div className="mt-6">{children}</div>}
      </div>
    </section>
  )
}

export function SectionHeading({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-8 max-w-2xl">
      <h2 className="text-3xl font-bold tracking-tight">{title}</h2>
      {subtitle && <p className="mt-2 text-text-secondary">{subtitle}</p>}
    </div>
  )
}

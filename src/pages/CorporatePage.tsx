import { useState, type ReactNode } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/common/Button'
import { Icon, type IconName } from '@/components/common/Icon'
import { PageHero, SectionHeading } from '@/components/common/PageHero'
import { Seo } from '@/components/seo/Seo'
import { useI18n } from '@/hooks/useI18n'
import { cn } from '@/lib/cn'
import { ConsentText } from '@/features/legal/ConsentText'
import { company } from '@/app/config/site.config'

const isPlaceholder = (v: string) => v.trim().startsWith('[')

const schema = z.object({
  company: z.string().min(2, 'Şirket adı zorunludur.'),
  contactName: z.string().min(2, 'Yetkili adı zorunludur.'),
  email: z.string().email('Geçerli bir e-posta girin.'),
  phone: z.string().optional(),
  need: z.string().min(10, 'Lütfen ihtiyacınızı kısaca açıklayın (en az 10 karakter).'),
  consent: z.boolean().refine((v) => v === true, { message: 'Devam etmek için onay gereklidir.' }),
  // Honeypot (bot koruması §29): boş kalmalı
  company_website: z.string().max(0).optional(),
})
type CorporateForm = z.infer<typeof schema>

const fieldClass =
  'min-h-[44px] w-full rounded-md border border-white/20 bg-white/5 px-3 py-2 text-base text-white placeholder:text-white/40 focus-visible:outline-none focus-visible:border-white/50'

export default function CorporatePage() {
  const { dict } = useI18n()
  const c = dict.corporate
  const [sent, setSent] = useState(false)
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CorporateForm>({ resolver: zodResolver(schema) })

  const onSubmit = async () => {
    // Demo: veriler sunucuya GÖNDERİLMEZ, console'a PII yazılmaz (§22, §29).
    setSent(true)
  }

  const emailHref = isPlaceholder(company.email.value)
    ? undefined
    : `mailto:${company.email.value}`

  return (
    <>
      <Seo title={c.seo.title} description={c.seo.description} routeId="corporate" />
      <PageHero title={c.hero.title} subtitle={c.hero.subtitle}>
        <div className="flex flex-col gap-3 sm:flex-row">
          <a href="#kurumsal-basvuru">
            <Button intent="secondary" size="lg">{c.hero.primaryCta}</Button>
          </a>
          {emailHref && (
            <a href={emailHref}>
              <Button intent="outline" size="lg">{c.hero.secondaryCta}</Button>
            </a>
          )}
        </div>
      </PageHero>

      {/* Kurumsal özellikler (siyah bant) */}
      <section className="section bg-secondary text-text-inverse">
        <div className="container-wide">
          <div className="mb-8 max-w-2xl">
            <h2 className="text-3xl font-bold tracking-tight">{c.features.title}</h2>
            <p className="mt-2 text-white/70">{c.features.subtitle}</p>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {c.features.items.map((f) => (
              <article key={f.key} className="rounded-lg border border-white/10 bg-white/5 p-6">
                <Icon name={f.icon as IconName} className="size-12 text-primary" />
                <h3 className="mt-4 text-lg font-semibold">{f.title}</h3>
                <ul className="mt-3 space-y-2">
                  {f.points.map((p) => (
                    <li key={p} className="flex items-start gap-2 text-sm text-white/70">
                      <Icon name="Check" className="mt-0.5 size-4 shrink-0 text-primary" />
                      {p}
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Neden kurumsal paket */}
      <section className="section bg-surface-muted">
        <div className="container-wide">
          <SectionHeading title={c.whyPackage.title} />
          <div className="grid gap-4 md:grid-cols-3">
            {c.whyPackage.items.map((i) => (
              <article key={i.key} className="flex gap-4 rounded-lg border border-border bg-surface p-6">
                <span className="inline-flex size-11 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                  <Icon name={i.icon as IconName} className="size-6" />
                </span>
                <div>
                  <h3 className="text-lg font-semibold">{i.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-text-secondary">{i.desc}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Ödeme seçenekleri */}
      <section className="section">
        <div className="container-wide">
          <SectionHeading title={c.payment.title} subtitle={c.payment.subtitle} />
          <div className="grid gap-4 md:grid-cols-2 lg:max-w-4xl lg:mx-auto">
            {c.payment.options.map((o) => (
              <article
                key={o.key}
                className={cn(
                  'relative rounded-lg border p-6',
                  o.recommended ? 'border-2 border-secondary shadow-md' : 'border-border',
                )}
              >
                {o.recommended && (
                  <span className="absolute -top-3 start-6 rounded-full bg-secondary px-3 py-1 text-xs font-semibold tracking-wide text-secondary-foreground">
                    {c.payment.recommendedLabel}
                  </span>
                )}
                <p className="text-sm font-medium text-primary">{o.label}</p>
                <h3 className="mt-1 text-xl font-bold">{o.heading}</h3>
                <p className="mt-2 text-sm text-text-secondary">{o.desc}</p>
                <ul className="mt-4 space-y-2">
                  {o.points.map((p) => (
                    <li key={p} className="flex items-start gap-2 text-sm text-text-secondary">
                      <Icon name="Check" className="mt-0.5 size-4 shrink-0 text-primary" />
                      {p}
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Kurumsal başvuru formu (koyu bant) */}
      <section id="kurumsal-basvuru" className="section bg-secondary text-text-inverse scroll-mt-24">
        <div className="container-base">
          <div className="max-w-2xl">
            <h2 className="text-3xl font-bold tracking-tight">{c.form.title}</h2>
            <p className="mt-2 text-white/70">{c.form.desc}</p>
          </div>

          {sent ? (
            <div role="status" aria-live="polite" className="mt-8 max-w-2xl rounded-lg border border-white/15 bg-white/5 p-6">
              <p className="font-medium text-success">{c.form.success}</p>
              <p className="mt-2 text-sm text-white/60">{c.form.note}</p>
              <p className="mt-1 text-xs text-white/40">{dict.common.states.demoNotice}</p>
            </div>
          ) : (
            <form className="mt-8 max-w-2xl space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label={c.form.fields.company} error={errors.company?.message}>
                  <input className={fieldClass} {...register('company')} aria-invalid={!!errors.company} />
                </Field>
                <Field label={c.form.fields.contactName} error={errors.contactName?.message}>
                  <input className={fieldClass} {...register('contactName')} aria-invalid={!!errors.contactName} />
                </Field>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label={c.form.fields.email} error={errors.email?.message}>
                  <input type="email" className={fieldClass} {...register('email')} aria-invalid={!!errors.email} />
                </Field>
                <Field label={c.form.fields.phone} error={errors.phone?.message}>
                  <input type="tel" className={fieldClass} {...register('phone')} />
                </Field>
              </div>
              <Field label={c.form.fields.need} error={errors.need?.message}>
                <textarea rows={5} className={fieldClass} {...register('need')} aria-invalid={!!errors.need} />
              </Field>
              {/* Honeypot (gizli) */}
              <input type="text" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" {...register('company_website')} />
              <label className="flex items-start gap-3 text-sm text-white/80">
                <input type="checkbox" className="mt-1 size-4 accent-white" {...register('consent')} aria-invalid={!!errors.consent} />
                <ConsentText text={c.form.fields.consent} />
              </label>
              {errors.consent && <p className="text-sm text-danger">{errors.consent.message}</p>}
              <Button
                type="submit"
                intent="outline"
                size="lg"
                block
                disabled={isSubmitting}
                className="border-white bg-white text-black hover:bg-white/90"
              >
                {c.form.submit}
              </Button>
              <p className="text-center text-xs text-white/50">{dict.common.states.demoNotice}</p>
            </form>
          )}
        </div>
      </section>
    </>
  )
}

function Field({ label, error, children }: { label: string; error?: string; children: ReactNode }) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-white/90">{label}</label>
      {children}
      {error && <p className="mt-1 text-sm text-danger">{error}</p>}
    </div>
  )
}

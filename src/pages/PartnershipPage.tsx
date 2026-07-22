import { useState, type ReactNode } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/common/Button'
import { Icon, type IconName } from '@/components/common/Icon'
import { PhoneInput } from '@/components/common/PhoneInput'
import { PageHero, SectionHeading } from '@/components/common/PageHero'
import { Seo } from '@/components/seo/Seo'
import { useI18n } from '@/hooks/useI18n'
import { PARTNERSHIP, partnerEarning } from '@/app/config/partnership'
import { ConsentText } from '@/features/legal/ConsentText'

const schema = z.object({
  company: z.string().min(2, 'Şirket/kurum adı zorunludur.'),
  sector: z.string().min(1, 'Lütfen bir sektör seçin.'),
  contactName: z.string().min(2, 'Yetkili adı zorunludur.'),
  titleRole: z.string().optional(),
  email: z.string().email('Geçerli bir e-posta girin.'),
  phone: z.string().min(7, 'Telefon zorunludur.'),
  potential: z.string().optional(),
  note: z.string().optional(),
  agreement: z.boolean().refine((v) => v === true, { message: 'Devam etmek için onay gereklidir.' }),
  // Honeypot (bot koruması §29): boş kalmalı
  company_website: z.string().max(0).optional(),
})
type PartnerForm = z.infer<typeof schema>

const fieldClass =
  'h-[52px] w-full rounded-md border border-border bg-surface px-3 text-base focus-visible:outline-none focus-visible:border-border-strong'
const textareaClass =
  'min-h-[120px] w-full rounded-md border border-border bg-surface px-3 py-2 text-base focus-visible:outline-none focus-visible:border-border-strong'

export default function PartnershipPage() {
  const { dict, formatCurrency } = useI18n()
  const p = dict.partnership
  const [sent, setSent] = useState(false)
  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<PartnerForm>({ resolver: zodResolver(schema) })

  const onSubmit = async () => {
    // Demo: veriler sunucuya GÖNDERİLMEZ, console'a PII yazılmaz (§22, §29).
    setSent(true)
  }

  const rate = Math.round(PARTNERSHIP.commissionRate * 100)

  return (
    <>
      <Seo title={p.seo.title} description={p.seo.description} routeId="partnership" />
      <PageHero title={p.hero.title} subtitle={p.hero.value}>
        <p className="mb-4 text-text-secondary">{p.hero.subtitle}</p>
        <a href="#partner-basvuru">
          <Button intent="secondary" size="lg">{p.hero.cta}</Button>
        </a>
      </PageHero>

      {/* Partner avantajları */}
      <section className="section">
        <div className="container-wide">
          <SectionHeading title={p.advantages.title} subtitle={p.advantages.subtitle} />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {p.advantages.items.map((a) => (
              <article key={a.key} className="rounded-lg border border-border bg-surface p-6">
                <Icon name={a.icon as IconName} className="size-10 text-primary" />
                <h3 className="mt-4 text-base font-semibold">{a.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-text-secondary">{a.desc}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Nasıl çalışır */}
      <section className="section bg-surface-muted">
        <div className="container-wide">
          <SectionHeading title={p.howItWorks.title} />
          <ol className="space-y-4">
            {p.howItWorks.steps.map((s, i) => (
              <li key={s.title} className="flex gap-4 rounded-lg border border-border bg-surface p-6">
                <span className="flex size-12 shrink-0 items-center justify-center rounded-md bg-secondary text-lg font-bold text-secondary-foreground">
                  {i + 1}
                </span>
                <div>
                  <h3 className="text-lg font-semibold">{s.title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-text-secondary">{s.desc}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Hedef sektörler */}
      <section className="section">
        <div className="container-wide">
          <SectionHeading title={p.sectors.title} subtitle={p.sectors.subtitle} />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {p.sectors.items.map((s) => (
              <article key={s.key} className="rounded-lg border border-border bg-surface p-6">
                <Icon name={s.icon as IconName} className="size-10 text-primary" />
                <h3 className="mt-4 text-base font-semibold">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-text-secondary">{s.desc}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Komisyon yapısı (koyu bant) */}
      <section className="section bg-secondary text-text-inverse">
        <div className="container-base">
          <h2 className="text-center text-3xl font-bold tracking-tight">{p.commission.title}</h2>

          <div className="mt-10 grid grid-cols-1 gap-8 sm:grid-cols-3">
            <div className="text-center">
              <p className="text-5xl font-bold">%{rate}</p>
              <p className="mt-2 text-lg">{p.commission.stats.commissionLabel}</p>
              <p className="mt-1 text-sm text-white/60">{p.commission.stats.commissionSub}</p>
            </div>
            <div className="text-center">
              <p className="text-5xl font-bold">{PARTNERSHIP.paymentPeriodDays}</p>
              <p className="mt-2 text-lg">{p.commission.stats.periodUnit}</p>
              <p className="mt-1 text-sm text-white/60">{p.commission.stats.periodLabel}</p>
            </div>
            <div className="text-center">
              <p className="text-5xl font-bold">{formatCurrency(PARTNERSHIP.startupFee)}</p>
              <p className="mt-2 text-lg">{p.commission.stats.feeLabel}</p>
              <p className="mt-1 text-sm text-white/60">{p.commission.stats.feeSub}</p>
            </div>
          </div>

          {/* Örnek kazanç (dinamik) */}
          <div className="mx-auto mt-12 max-w-2xl rounded-lg border border-white/10 bg-white/5 p-6">
            <p className="text-lg font-semibold">{p.commission.exampleTitle}</p>
            <dl className="mt-4 space-y-3 text-sm">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <dt className="text-white/70">{p.commission.exampleOrderLabel}</dt>
                <dd className="font-semibold">{formatCurrency(PARTNERSHIP.exampleOrderAmount)}</dd>
              </div>
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <dt className="text-white/70">{p.commission.exampleRateLabel}</dt>
                <dd className="font-semibold">%{rate}</dd>
              </div>
              <div className="flex items-center justify-between pt-1">
                <dt className="text-base font-semibold">{p.commission.exampleEarningLabel}</dt>
                <dd className="text-2xl font-bold text-success">{formatCurrency(partnerEarning(PARTNERSHIP.exampleOrderAmount))}</dd>
              </div>
            </dl>
          </div>
          <p className="mx-auto mt-4 max-w-2xl text-center text-xs text-white/50">{p.commission.note}</p>
        </div>
      </section>

      {/* Partner başvuru formu */}
      <section id="partner-basvuru" className="section scroll-mt-24">
        <div className="container-base">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight">{p.form.title}</h2>
            <p className="mt-2 text-text-secondary">{p.form.subtitle}</p>
          </div>

          {sent ? (
            <div role="status" aria-live="polite" className="mx-auto mt-8 max-w-2xl rounded-lg border border-border bg-surface-muted p-6">
              <p className="font-medium text-success">{p.form.success}</p>
              <p className="mt-2 text-sm text-text-secondary">{p.form.note}</p>
              <p className="mt-1 text-xs text-text-muted">{dict.common.states.demoNotice}</p>
            </div>
          ) : (
            <form className="mx-auto mt-8 max-w-2xl rounded-lg border border-border bg-surface p-6 sm:p-8" onSubmit={handleSubmit(onSubmit)} noValidate>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label={p.form.fields.company} required error={errors.company?.message}>
                  <input className={fieldClass} {...register('company')} aria-invalid={!!errors.company} />
                </Field>
                <Field label={p.form.fields.sector} required error={errors.sector?.message}>
                  <select className={fieldClass} defaultValue="" {...register('sector')} aria-invalid={!!errors.sector}>
                    <option value="" disabled>{p.form.sectorPlaceholder}</option>
                    {p.form.sectorOptions.map((o) => (
                      <option key={o} value={o}>{o}</option>
                    ))}
                  </select>
                </Field>
                <Field label={p.form.fields.contactName} required error={errors.contactName?.message}>
                  <input className={fieldClass} {...register('contactName')} aria-invalid={!!errors.contactName} />
                </Field>
                <Field label={p.form.fields.titleRole}>
                  <input className={fieldClass} {...register('titleRole')} />
                </Field>
                <Field label={p.form.fields.email} required error={errors.email?.message}>
                  <input type="email" className={fieldClass} {...register('email')} aria-invalid={!!errors.email} />
                </Field>
                <Field label={p.form.fields.phone} required error={errors.phone?.message}>
                  <Controller
                    name="phone"
                    control={control}
                    render={({ field }) => <PhoneInput onChange={field.onChange} />}
                  />
                </Field>
              </div>
              <div className="mt-4">
                <Field label={p.form.fields.potential}>
                  <select className={fieldClass} defaultValue={p.form.potentialOptions[0]} {...register('potential')}>
                    {p.form.potentialOptions.map((o) => (
                      <option key={o} value={o}>{o}</option>
                    ))}
                  </select>
                </Field>
              </div>
              <div className="mt-4">
                <Field label={p.form.fields.note}>
                  <textarea rows={4} className={textareaClass} {...register('note')} />
                </Field>
              </div>
              {/* Honeypot (gizli) */}
              <input type="text" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" {...register('company_website')} />
              <label className="mt-5 flex items-start gap-3 text-sm">
                <input type="checkbox" className="mt-1 size-4 accent-black" {...register('agreement')} aria-invalid={!!errors.agreement} />
                <span><ConsentText text={p.form.fields.agreement} /> <span className="text-danger">*</span></span>
              </label>
              {errors.agreement && <p className="mt-1 text-sm text-danger">{errors.agreement.message}</p>}
              <Button type="submit" intent="secondary" size="lg" block disabled={isSubmitting} className="mt-6">
                {p.form.submit}
              </Button>
              <p className="mt-3 text-center text-xs text-text-muted">* {p.form.note}</p>
              <p className="mt-1 text-center text-xs text-text-muted">{dict.common.states.demoNotice}</p>
            </form>
          )}
        </div>
      </section>
    </>
  )
}

function Field({
  label,
  required,
  error,
  children,
}: {
  label: string
  required?: boolean
  error?: string
  children: ReactNode
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium">
        {label} {required && <span className="text-danger">*</span>}
      </label>
      {children}
      {error && <p className="mt-1 text-sm text-danger">{error}</p>}
    </div>
  )
}

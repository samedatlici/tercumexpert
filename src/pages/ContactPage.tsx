import { useMemo, useState, type ReactNode } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/common/Button'
import { Icon } from '@/components/common/Icon'
import { PhoneInput } from '@/components/common/PhoneInput'
import { WhatsAppIcon } from '@/components/common/WhatsAppIcon'
import { PageHero } from '@/components/common/PageHero'
import { Seo } from '@/components/seo/Seo'
import { useI18n } from '@/hooks/useI18n'
import { company, whatsappLink } from '@/app/config/site.config'
import { ConsentText } from '@/features/legal/ConsentText'

const isPlaceholder = (v: string) => v.trim().startsWith('[')

interface FormErrs { name: string; email: string; subject: string; message: string; consent: string }
// Doğrulama mesajları 14 dilden (dict.contact.formErrors) gelir; şema bileşende kurulur.
const makeSchema = (e: FormErrs) =>
  z.object({
    name: z.string().min(2, e.name),
    email: z.string().email(e.email),
    phone: z.string().optional(),
    subject: z.string().min(2, e.subject),
    message: z.string().min(10, e.message),
    consent: z.boolean().refine((v) => v === true, { message: e.consent }),
    // Honeypot (bot koruması §29): boş kalmalı
    company_website: z.string().max(0).optional(),
  })
type ContactForm = z.infer<ReturnType<typeof makeSchema>>

const fieldClass =
  'min-h-[44px] w-full rounded-md border border-border bg-surface px-3 py-2 text-base focus-visible:outline-none'

export default function ContactPage() {
  const { dict } = useI18n()
  const c = dict.contact
  const [sent, setSent] = useState(false)
  const schema = useMemo(() => makeSchema(c.formErrors), [c])
  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ContactForm>({ resolver: zodResolver(schema) })

  const onSubmit = async () => {
    // Demo: veriler sunucuya GÖNDERİLMEZ, console'a PII yazılmaz (§22, §29).
    setSent(true)
  }

  const wa = whatsappLink()

  return (
    <>
      <Seo title={c.seo.title} description={c.seo.description} routeId="contact" />
      <PageHero title={c.hero.title} subtitle={c.hero.subtitle} />

      <section className="section">
        <div className="container-base grid gap-10 lg:grid-cols-2">
          {/* Bilgiler */}
          <div>
            <h2 className="text-xl font-semibold">{c.infoTitle}</h2>
            <ul className="mt-4 space-y-3 text-sm">
              {!isPlaceholder(company.phone.value) && (
                <li><a href={`tel:${company.phone.value}`} className="inline-flex items-center gap-2 hover:text-primary"><Icon name="Phone" className="size-4" /><span dir="ltr">{company.phone.value}</span></a></li>
              )}
              {!isPlaceholder(company.email.value) && (
                <li><a href={`mailto:${company.email.value}`} className="inline-flex items-center gap-2 hover:text-primary"><Icon name="Mail" className="size-4" />{company.email.value}</a></li>
              )}
              {wa && (
                <li><a href={wa} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 hover:text-primary"><WhatsAppIcon className="size-4" />{c.labels.whatsapp}</a></li>
              )}
              {!isPlaceholder(company.address.value) && (
                <li className="flex items-start gap-2"><Icon name="MapPin" className="mt-0.5 size-4" />{company.address.value}</li>
              )}
              <li className="text-text-secondary">{c.labels.hours}: {dict.common.topbar.workingHours}</li>
            </ul>
          </div>

          {/* Form */}
          <div>
            <h2 className="text-xl font-semibold">{c.form.title}</h2>
            {sent ? (
              <div role="status" aria-live="polite" className="mt-4 rounded-md border border-border bg-surface-muted p-4">
                <p className="font-medium text-success">{c.form.success}</p>
                <p className="mt-1 text-xs text-text-muted">{dict.common.states.demoNotice}</p>
              </div>
            ) : (
              <form className="mt-4 space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
                <Field label={c.form.fields.name} error={errors.name?.message}>
                  <input className={fieldClass} {...register('name')} aria-invalid={!!errors.name} />
                </Field>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label={c.form.fields.email} error={errors.email?.message}>
                    <input type="email" className={fieldClass} {...register('email')} aria-invalid={!!errors.email} />
                  </Field>
                  <Field label={c.form.fields.phone} error={errors.phone?.message}>
                    <Controller
                      name="phone"
                      control={control}
                      render={({ field }) => <PhoneInput onChange={field.onChange} />}
                    />
                  </Field>
                </div>
                <Field label={c.form.fields.subject} error={errors.subject?.message}>
                  <input className={fieldClass} {...register('subject')} aria-invalid={!!errors.subject} />
                </Field>
                <Field label={c.form.fields.message} error={errors.message?.message}>
                  <textarea rows={5} className={fieldClass} {...register('message')} aria-invalid={!!errors.message} />
                </Field>
                {/* Honeypot (gizli) */}
                <input type="text" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" {...register('company_website')} />
                <label className="flex items-start gap-3 text-sm">
                  <input type="checkbox" className="mt-1 size-4" {...register('consent')} aria-invalid={!!errors.consent} />
                  <ConsentText text={c.form.fields.consent} />
                </label>
                {errors.consent && <p className="text-sm text-danger">{errors.consent.message}</p>}
                <Button type="submit" intent="primary" size="lg" block disabled={isSubmitting}>
                  {c.form.submit}
                </Button>
                <p className="text-center text-xs text-text-muted">{dict.common.states.demoNotice}</p>
              </form>
            )}
          </div>
        </div>
      </section>

      {/* Harita alanı — ileride Google Maps ile entegre edilecek */}
      <section className="section bg-surface-muted">
        <div className="container-base">
          <div className="mb-6">
            <h2 className="text-2xl font-bold tracking-tight">{c.map.title}</h2>
            <p className="mt-1 text-text-secondary">{c.map.subtitle}</p>
          </div>
          {/*
            Google Maps entegrasyonu: aşağıdaki placeholder yerine bir <iframe> gelecek. Örnek:
            <iframe src="https://www.google.com/maps/embed?pb=..." className="h-full w-full border-0"
              loading="lazy" allowFullScreen referrerPolicy="no-referrer-when-downgrade"
              title={c.map.title} />
          */}
          <div className="relative overflow-hidden rounded-lg border border-border bg-surface">
            <div className="flex aspect-[16/9] w-full flex-col items-center justify-center gap-3 text-center">
              <span className="inline-flex size-14 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Icon name="MapPin" className="size-7" />
              </span>
              <p className="text-lg font-semibold">{c.map.placeholder}</p>
              <p className="max-w-md text-sm text-text-secondary">{c.map.note}</p>
              {!isPlaceholder(company.address.value) && (
                <p className="mt-1 inline-flex items-center gap-2 text-sm text-text-secondary">
                  <Icon name="MapPin" className="size-4" />
                  {company.address.value}
                </p>
              )}
            </div>
          </div>
        </div>
      </section>
    </>
  )
}

function Field({ label, error, children }: { label: string; error?: string; children: ReactNode }) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium">{label}</label>
      {children}
      {error && <p className="mt-1 text-sm text-danger">{error}</p>}
    </div>
  )
}

import { useState } from 'react'
import { Icon } from '@/components/common/Icon'
import { WhatsAppIcon } from '@/components/common/WhatsAppIcon'
import { useI18n } from '@/hooks/useI18n'

/**
 * "Paylaş" kartı (SS5 esinli, marka renkleri). 4 platform (WhatsApp, Facebook, LinkedIn, X)
 * 2×2 dizilir; altında "Linki Kopyala". Instagram + Reddit KALDIRILDI (Samet). Sosyal ikonlar
 * inline SVG (Lucide marka ikonu barındırmaz — Footer deseni).
 */
const FB_PATH =
  'M24 12.07C24 5.4 18.63 0 12 0S0 5.4 0 12.07C0 18.1 4.39 23.1 10.13 24v-8.44H7.08v-3.49h3.05V9.41c0-3.02 1.79-4.68 4.53-4.68 1.31 0 2.68.23 2.68.23v2.97h-1.51c-1.49 0-1.95.93-1.95 1.88v2.26h3.32l-.53 3.49h-2.79V24C19.61 23.1 24 18.1 24 12.07'
const X_PATH =
  'M18.9 1.5h3.68l-8.04 9.19L24 22.5h-7.41l-5.8-7.58-6.64 7.58H.47l8.6-9.83L0 1.5h7.59l5.24 6.93L18.9 1.5Zm-1.29 18.8h2.04L6.49 3.6H4.3L17.61 20.3Z'
const LI_PATH =
  'M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.13 1.45-2.13 2.94v5.67H9.35V9h3.42v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.45v6.29ZM5.34 7.43a2.06 2.06 0 1 1 0-4.12 2.06 2.06 0 0 1 0 4.12ZM7.12 20.45H3.55V9h3.57v11.45ZM22.22 0H1.77C.79 0 0 .77 0 1.72v20.56C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.72V1.72C24 .77 23.2 0 22.22 0Z'

function Glyph({ path }: { path: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="size-5" aria-hidden="true">
      <path d={path} />
    </svg>
  )
}

export function ShareCard({ title }: { title: string }) {
  const { dict } = useI18n()
  const s = dict.blog.share
  const [copied, setCopied] = useState(false)

  const url = typeof window !== 'undefined' ? window.location.href : ''
  const eUrl = encodeURIComponent(url)
  const eText = encodeURIComponent(title)

  const targets = [
    {
      key: 'whatsapp',
      label: 'WhatsApp',
      href: `https://wa.me/?text=${encodeURIComponent(`${title} ${url}`)}`,
      cls: 'bg-[#25D366] text-white hover:brightness-95',
      icon: <WhatsAppIcon className="size-5" />,
    },
    {
      key: 'facebook',
      label: 'Facebook',
      href: `https://www.facebook.com/sharer/sharer.php?u=${eUrl}`,
      cls: 'bg-[#1877F2] text-white hover:brightness-95',
      icon: <Glyph path={FB_PATH} />,
    },
    {
      key: 'linkedin',
      label: 'LinkedIn',
      href: `https://www.linkedin.com/sharing/share-offsite/?url=${eUrl}`,
      cls: 'bg-[#0A66C2] text-white hover:brightness-95',
      icon: <Glyph path={LI_PATH} />,
    },
    {
      key: 'x',
      label: 'X',
      href: `https://twitter.com/intent/tweet?url=${eUrl}&text=${eText}`,
      cls: 'bg-secondary text-white hover:brightness-125',
      icon: <Glyph path={X_PATH} />,
    },
  ]

  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      /* yoksay */
    }
  }

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-surface">
      <div className="flex items-center gap-2 bg-secondary px-5 py-3 text-white">
        <Icon name="Share2" className="size-4" />
        <span className="font-bold">{s.title}</span>
      </div>
      <div className="p-4">
        <div className="grid grid-cols-2 gap-2">
          {targets.map((t) => (
            <a
              key={t.key}
              href={t.href}
              target="_blank"
              rel="noopener noreferrer"
              className={`inline-flex items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-semibold transition ${t.cls}`}
            >
              {t.icon}
              {t.label}
            </a>
          ))}
        </div>
        <button
          type="button"
          onClick={onCopy}
          className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-3 py-2.5 text-sm font-semibold text-primary-foreground transition hover:bg-primary-hover"
        >
          <Icon name={copied ? 'Check' : 'Copy'} className="size-4" />
          {copied ? s.copied : s.copy}
        </button>
      </div>
    </div>
  )
}

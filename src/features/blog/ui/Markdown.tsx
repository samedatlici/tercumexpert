import { Fragment, type ReactNode } from 'react'

/**
 * Küçük, bağımlılıksız markdown renderer (blog gövdesi için yeterli alt küme):
 *   ## / ###  → alt başlık (H2/H3)
 *   - / *     → madde listesi
 *   1. 2.     → sıralı liste
 *   boş satır → paragraf ayrımı
 *   **kalın**, [metin](url) satır içi
 * Yeni bağımlılık (react-markdown) eklemek yerine tercih edildi — sandbox'ta paket
 * kurulup derlenemediği için kontrollü ve güvenli. İhtiyaç büyürse kütüphaneye geçilebilir.
 */

function renderInline(text: string, keyPrefix: string): ReactNode[] {
  const nodes: ReactNode[] = []
  // Önce linkleri, sonra kalınları işleyen basit tokenizer.
  const pattern = /\*\*(.+?)\*\*|\[([^\]]+)\]\(([^)]+)\)/g
  let last = 0
  let m: RegExpExecArray | null
  let i = 0
  while ((m = pattern.exec(text)) !== null) {
    if (m.index > last) nodes.push(text.slice(last, m.index))
    if (m[1] !== undefined) {
      nodes.push(<strong key={`${keyPrefix}-b${i}`}>{m[1]}</strong>)
    } else if (m[2] !== undefined && m[3] !== undefined) {
      const href = m[3]
      const external = /^https?:\/\//.test(href)
      nodes.push(
        <a
          key={`${keyPrefix}-a${i}`}
          href={href}
          {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
          className="font-medium text-primary underline underline-offset-2 hover:text-primary-hover"
        >
          {m[2]}
        </a>,
      )
    }
    last = pattern.lastIndex
    i++
  }
  if (last < text.length) nodes.push(text.slice(last))
  return nodes
}

interface Block {
  type: 'h2' | 'h3' | 'ul' | 'ol' | 'p'
  lines: string[]
}

function parseBlocks(src: string): Block[] {
  const rawLines = src.replace(/\r\n/g, '\n').split('\n')
  const blocks: Block[] = []
  let para: string[] = []
  const flushPara = () => {
    if (para.length) {
      blocks.push({ type: 'p', lines: [para.join(' ')] })
      para = []
    }
  }
  for (const line of rawLines) {
    const t = line.trim()
    if (!t) {
      flushPara()
      continue
    }
    if (t.startsWith('### ')) {
      flushPara()
      blocks.push({ type: 'h3', lines: [t.slice(4)] })
    } else if (t.startsWith('## ')) {
      flushPara()
      blocks.push({ type: 'h2', lines: [t.slice(3)] })
    } else if (/^[-*]\s+/.test(t)) {
      flushPara()
      const item = t.replace(/^[-*]\s+/, '')
      const prev = blocks[blocks.length - 1]
      if (prev && prev.type === 'ul') prev.lines.push(item)
      else blocks.push({ type: 'ul', lines: [item] })
    } else if (/^\d+\.\s+/.test(t)) {
      flushPara()
      const item = t.replace(/^\d+\.\s+/, '')
      const prev = blocks[blocks.length - 1]
      if (prev && prev.type === 'ol') prev.lines.push(item)
      else blocks.push({ type: 'ol', lines: [item] })
    } else {
      para.push(t)
    }
  }
  flushPara()
  return blocks
}

export function Markdown({ source }: { source: string }) {
  const blocks = parseBlocks(source ?? '')
  return (
    <div className="space-y-5 leading-relaxed text-text-secondary">
      {blocks.map((b, i) => {
        const key = `blk-${i}`
        if (b.type === 'h2')
          return (
            <h2 key={key} className="pt-2 text-2xl font-bold text-text-primary md:text-3xl">
              {renderInline(b.lines[0], key)}
            </h2>
          )
        if (b.type === 'h3')
          return (
            <h3 key={key} className="pt-1 text-xl font-bold text-text-primary">
              {renderInline(b.lines[0], key)}
            </h3>
          )
        if (b.type === 'ul')
          return (
            <ul key={key} className="ml-1 space-y-2">
              {b.lines.map((li, j) => (
                <li key={`${key}-${j}`} className="flex gap-2">
                  <span className="mt-2 size-1.5 shrink-0 rounded-full bg-primary" />
                  <span>{renderInline(li, `${key}-${j}`)}</span>
                </li>
              ))}
            </ul>
          )
        if (b.type === 'ol')
          return (
            <ol key={key} className="ml-1 space-y-2">
              {b.lines.map((li, j) => (
                <li key={`${key}-${j}`} className="flex gap-3">
                  <span className="font-semibold text-primary">{j + 1}.</span>
                  <span>{renderInline(li, `${key}-${j}`)}</span>
                </li>
              ))}
            </ol>
          )
        return (
          <p key={key}>
            <Fragment>{renderInline(b.lines[0], key)}</Fragment>
          </p>
        )
      })}
    </div>
  )
}

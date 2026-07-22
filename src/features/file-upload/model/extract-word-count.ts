/**
 * Dosyadan GERÇEK kelime sayısı çıkarma (tahmin değil). Fiyat buna dayandığı için
 * kritik. Desteklenen aileler:
 *   - Düz metin: txt, csv, tsv, json, po, pot, properties, strings, srt, vtt, md, log
 *   - İşaretleme: htm, html, xhtml, xml, resx, xliff, xlf, dfxp, ttml, inx  (etiketler temizlenir)
 *   - RTF: kontrol kodları temizlenir
 *   - Word (OOXML): docx, docm, dotx, dotm  (mammoth → yoksa zip/XML)
 *   - Sunum (OOXML): pptx, ppsx, potx, pptm, ppsm  (slayt <a:t> metinleri)
 *   - Excel (OOXML): xlsx, xlsm, xltx, xltm  (yalnızca metin hücreleri: <t>)
 *   - OpenDocument: odt, ods, odp, ott, sxw…  (content.xml)
 *   - PDF: pdfjs (seçilebilir metin) — worker YEREL paketlenir (CSP güvenli)
 *   - Görsel: png, jpg, jpeg, jpe, gif, tif, tiff, bmp, webp  (tesseract OCR, tur+eng)
 *   - Adobe IDML: Stories/*.xml <Content>
 * Ses/video ve eski ikili formatlar (doc, xls, ppt, mp3, mp4…) için tarayıcıda
 * güvenilir kelime sayımı MÜMKÜN DEĞİLDİR (deşifre/transkripsiyon gerekir) ->
 * 'unsupported' döner; dosya yine de yüklenebilir, ekip kelime sayısını belirler.
 * Ağır kütüphaneler (pdfjs, tesseract, fflate) DİNAMİK import edilir.
 */
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url'

export type ExtractStatus = 'ok' | 'empty' | 'unsupported' | 'error'

export interface ExtractResult {
  words: number
  status: ExtractStatus
}

/** Beyaz boşluğa göre kelime sayımı (Türkçe/İngilizce vb. için doğru). */
export function countWords(text: string): number {
  const cleaned = text.replace(/\s+/g, ' ').trim()
  if (!cleaned) return 0
  return cleaned.split(' ').filter(Boolean).length
}

function ext(name: string): string {
  return (name.split('.').pop() ?? '').toLowerCase()
}

// ------------------------------------------------------------------
// Metin / işaretleme temizleyiciler
// ------------------------------------------------------------------
const ENTITIES: Record<string, string> = {
  amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ',
}

function safeCodePoint(cp: number): string {
  try {
    return String.fromCodePoint(cp)
  } catch {
    return ' '
  }
}

function decodeEntities(s: string): string {
  return s
    .replace(/&#x([0-9a-fA-F]+);/g, (_, h) => safeCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => safeCodePoint(parseInt(d, 10)))
    .replace(/&([a-zA-Z]+);/g, (_, n) => ENTITIES[String(n).toLowerCase()] ?? ' ')
}

/** HTML/XML etiketlerini boşlukla değiştirir; script/style/yorum içeriğini atar. */
function stripMarkup(s: string): string {
  return decodeEntities(
    s
      .replace(/<script[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<!--[\s\S]*?-->/g, ' ')
      .replace(/<[^>]+>/g, ' '),
  )
}

/** RTF kontrol kodlarını temizleyip düz metne indirger. */
function stripRtf(s: string): string {
  return s
    .replace(/\\'[0-9a-fA-F]{2}/g, ' ')
    .replace(/\\u-?\d+\??/g, ' ')
    .replace(/\\[a-zA-Z]+-?\d* ?/g, ' ')
    .replace(/[{}]/g, ' ')
}

// ------------------------------------------------------------------
// Word (mammoth) + genel ZIP/XML çıkarımı (fflate)
// ------------------------------------------------------------------
async function extractDocxText(file: File): Promise<string> {
  const mod = (await import('mammoth')) as unknown as {
    extractRawText?: (o: { arrayBuffer: ArrayBuffer }) => Promise<{ value: string }>
    default?: { extractRawText: (o: { arrayBuffer: ArrayBuffer }) => Promise<{ value: string }> }
  }
  const extractRawText = mod.extractRawText ?? mod.default?.extractRawText
  if (!extractRawText) throw new Error('mammoth yüklenemedi')
  const { value } = await extractRawText({ arrayBuffer: await file.arrayBuffer() })
  return value
}

/** ZIP içinden yalnızca `filter` ile eşleşen dosyaları çözüp UTF-8 metin döndürür. */
async function unzipEntries(
  file: File,
  filter: (name: string) => boolean,
): Promise<Record<string, string>> {
  const { unzip } = await import('fflate')
  const buf = new Uint8Array(await file.arrayBuffer())
  return new Promise((resolve, reject) => {
    unzip(buf, { filter: (f) => filter(f.name) }, (err, data) => {
      if (err) return reject(err)
      const dec = new TextDecoder('utf-8')
      const out: Record<string, string> = {}
      for (const k of Object.keys(data)) out[k] = dec.decode(data[k])
      resolve(out)
    })
  })
}

async function extractOoxmlWord(file: File): Promise<string> {
  try {
    const t = await extractDocxText(file)
    if (t.trim()) return t
  } catch {
    /* mammoth başarısız -> zip/XML'e düş */
  }
  const entries = await unzipEntries(
    file,
    (n) => n === 'word/document.xml' || /^word\/(header|footer)\d*\.xml$/.test(n),
  )
  return Object.values(entries).map(stripMarkup).join(' ')
}

async function extractOoxmlPptx(file: File): Promise<string> {
  const entries = await unzipEntries(
    file,
    (n) => /^ppt\/slides\/slide\d+\.xml$/.test(n) || /^ppt\/notesSlides\/notesSlide\d+\.xml$/.test(n),
  )
  let text = ''
  for (const xml of Object.values(entries)) {
    const m = xml.match(/<a:t>[\s\S]*?<\/a:t>/g)
    text += ' ' + (m ? m.map(stripMarkup).join(' ') : stripMarkup(xml))
  }
  return text
}

async function extractOoxmlXlsx(file: File): Promise<string> {
  const entries = await unzipEntries(
    file,
    (n) => n === 'xl/sharedStrings.xml' || /^xl\/worksheets\/sheet\d+\.xml$/.test(n),
  )
  let text = ''
  for (const xml of Object.values(entries)) {
    // Yalnızca metin hücreleri (<t>...</t>); sayısal hücreler kelime sayılmaz.
    const m = xml.match(/<t[ >][\s\S]*?<\/t>|<t\/>/g)
    if (m) text += ' ' + m.map(stripMarkup).join(' ')
  }
  return text
}

async function extractOdf(file: File): Promise<string> {
  const entries = await unzipEntries(file, (n) => n === 'content.xml')
  return stripMarkup(entries['content.xml'] ?? '')
}

async function extractIdml(file: File): Promise<string> {
  const entries = await unzipEntries(file, (n) => /^Stories\/.*\.xml$/i.test(n))
  let text = ''
  for (const xml of Object.values(entries)) {
    const m = xml.match(/<Content>[\s\S]*?<\/Content>/g)
    text += ' ' + (m ? m.map(stripMarkup).join(' ') : stripMarkup(xml))
  }
  return text
}

// ------------------------------------------------------------------
// PDF (worker YEREL paketlenir → CSP 'self' ile uyumlu, CDN yok)
// ------------------------------------------------------------------
async function extractPdfText(file: File): Promise<string> {
  const pdfjs = await import('pdfjs-dist')
  pdfjs.GlobalWorkerOptions.workerSrc = pdfWorkerUrl
  const data = await file.arrayBuffer()
  const doc = await pdfjs.getDocument({ data }).promise
  let text = ''
  for (let i = 1; i <= doc.numPages; i += 1) {
    const page = await doc.getPage(i)
    const content = await page.getTextContent()
    const line = content.items
      .map((it) => (typeof (it as { str?: unknown }).str === 'string' ? (it as { str: string }).str : ''))
      .join(' ')
    text += `${line}\n`
  }
  await doc.destroy()
  return text
}

// ------------------------------------------------------------------
// Görsel OCR (tesseract.js, tur+eng)
// ------------------------------------------------------------------
async function extractImageText(file: File): Promise<string> {
  const mod = (await import('tesseract.js')) as unknown as {
    recognize: (image: File | Blob, langs?: string, opts?: unknown) => Promise<{ data: { text: string } }>
    default?: {
      recognize: (image: File | Blob, langs?: string, opts?: unknown) => Promise<{ data: { text: string } }>
    }
  }
  const recognize = mod.recognize ?? mod.default?.recognize
  if (!recognize) throw new Error('tesseract yüklenemedi')
  const { data } = await recognize(file, 'tur+eng')
  return data.text ?? ''
}

function isImage(e: string, type: string): boolean {
  if (type.startsWith('image/')) return true
  return ['png', 'jpg', 'jpeg', 'jpe', 'webp', 'bmp', 'gif', 'tif', 'tiff'].includes(e)
}

// ------------------------------------------------------------------
// Uzantı grupları
// ------------------------------------------------------------------
const TEXT_EXT = new Set([
  'txt', 'text', 'log', 'md', 'markdown', 'csv', 'tsv', 'json',
  'po', 'pot', 'properties', 'strings', 'srt', 'vtt', 'sbv', 'sub',
])
const MARKUP_EXT = new Set([
  'htm', 'html', 'xhtml', 'xml', 'resx', 'xliff', 'xlf', 'dfxp', 'ttml', 'inx', 'fodt', 'fods',
])
const WORD_EXT = new Set(['docx', 'docm', 'dotx', 'dotm'])
const PPT_EXT = new Set(['pptx', 'ppsx', 'potx', 'pptm', 'ppsm'])
const XLS_EXT = new Set(['xlsx', 'xlsm', 'xltx', 'xltm'])
const ODF_EXT = new Set(['odt', 'ods', 'odp', 'ott', 'ots', 'otp', 'sxw', 'sxc', 'sxi'])

/**
 * Görsel HARİÇ desteklenen tüm türlerden ham metin çıkarır.
 * Tür desteklenmiyorsa null; okuma hatası fırlatır (çağıran yakalar).
 */
async function extractRawDocText(file: File): Promise<string | null> {
  const e = ext(file.name)
  const type = file.type
  if (e === 'pdf' || type === 'application/pdf') return extractPdfText(file)
  if (WORD_EXT.has(e) || type.includes('officedocument.wordprocessingml')) return extractOoxmlWord(file)
  if (PPT_EXT.has(e) || type.includes('officedocument.presentationml')) return extractOoxmlPptx(file)
  if (XLS_EXT.has(e) || type.includes('officedocument.spreadsheetml')) return extractOoxmlXlsx(file)
  if (ODF_EXT.has(e) || type.includes('opendocument')) return extractOdf(file)
  if (e === 'idml') return extractIdml(file)
  if (e === 'rtf' || type === 'application/rtf' || type === 'text/rtf') return stripRtf(await file.text())
  if (MARKUP_EXT.has(e)) return stripMarkup(await file.text())
  if (TEXT_EXT.has(e) || type.startsWith('text/')) return file.text()
  return null
}

export async function extractWordCount(file: File): Promise<ExtractResult> {
  const e = ext(file.name)
  const type = file.type
  try {
    if (isImage(e, type)) return finalize(countWords(await extractImageText(file)))
    const raw = await extractRawDocText(file)
    // Ses, video, eski ikili formatlar (doc/xls/ppt/chm…): otomatik sayım mümkün değil.
    if (raw === null) return { words: 0, status: 'unsupported' }
    return finalize(countWords(raw))
  } catch {
    return { words: 0, status: 'error' }
  }
}

/**
 * Chatbot eki için belge metnini döndürür. GÖRSEL DEĞİLDİR — görseller ayrı ele
 * alınır (doğrudan görselli/vision modele gönderilir), burada 'unsupported' döner.
 * Metin normalize edilip `maxChars` sınırına kırpılır (istek boyutu için).
 */
export async function extractDocumentText(
  file: File,
  maxChars = 16000,
): Promise<{ text: string; status: ExtractStatus }> {
  const e = ext(file.name)
  const type = file.type
  if (isImage(e, type)) return { text: '', status: 'unsupported' }
  try {
    const raw = await extractRawDocText(file)
    if (raw === null) return { text: '', status: 'unsupported' }
    const cleaned = raw.replace(/\s+/g, ' ').trim()
    if (!cleaned) return { text: '', status: 'empty' }
    return { text: cleaned.slice(0, maxChars), status: 'ok' }
  } catch {
    return { text: '', status: 'error' }
  }
}

function finalize(words: number): ExtractResult {
  return { words, status: words > 0 ? 'ok' : 'empty' }
}

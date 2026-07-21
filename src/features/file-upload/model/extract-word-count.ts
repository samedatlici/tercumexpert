/**
 * Dosyadan GERÇEK kelime sayısı çıkarma (tahmin değil). Fiyat buna dayandığı için
 * kritik. Metin-tabanlı formatlar için birebir metin çıkarılır ve sayılır:
 *   - .txt : doğrudan okuma
 *   - .docx: mammoth ile ham metin
 *   - .pdf : pdfjs ile sayfa metni (seçilebilir metin varsa)
 *   - görsel (png/jpg/jpeg…): tesseract.js OCR ile (tur+eng) metin okunur
 * Diğer türlerde (ses, video, xlsx, pptx…) tarayıcıda güvenilir sayım mümkün
 * DEĞİLDİR -> 'unsupported'/'empty' döner; UI kullanıcıyı yönlendirir.
 * Ağır kütüphaneler DİNAMİK import edilir (ana paketi şişirmez).
 */
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

async function extractImageText(file: File): Promise<string> {
  // Görselden (PNG/JPG/JPEG…) metin çıkarımı: OCR (tesseract.js). Türkçe + İngilizce.
  // Ağır kütüphane -> yalnızca görsel yüklendiğinde dinamik yüklenir.
  const mod = (await import('tesseract.js')) as unknown as {
    recognize?: (image: File | Blob, langs?: string, opts?: unknown) => Promise<{ data: { text: string } }>
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
  return ['png', 'jpg', 'jpeg', 'webp', 'bmp', 'gif', 'tif', 'tiff'].includes(e)
}

async function extractPdfText(file: File): Promise<string> {
  const pdfjs = await import('pdfjs-dist')
  // Worker'ı sürüme uygun CDN'den yükle (Vite asset paketlemesine bağımlı olmadan).
  pdfjs.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`

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

export async function extractWordCount(file: File): Promise<ExtractResult> {
  const e = ext(file.name)
  const type = file.type
  try {
    if (e === 'txt' || type === 'text/plain') {
      return finalize(countWords(await file.text()))
    }
    if (e === 'docx' || type.includes('officedocument.wordprocessingml')) {
      return finalize(countWords(await extractDocxText(file)))
    }
    if (e === 'pdf' || type === 'application/pdf') {
      return finalize(countWords(await extractPdfText(file)))
    }
    if (isImage(e, type)) {
      return finalize(countWords(await extractImageText(file)))
    }
    return { words: 0, status: 'unsupported' }
  } catch {
    return { words: 0, status: 'error' }
  }
}

function finalize(words: number): ExtractResult {
  return { words, status: words > 0 ? 'ok' : 'empty' }
}

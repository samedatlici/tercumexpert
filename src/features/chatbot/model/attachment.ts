import { extractDocumentText } from '@/features/file-upload/model/extract-word-count'

/**
 * Chatbot dosya eki hazırlama. İki tür ek desteklenir:
 *   - Görsel  -> tarayıcıda küçültülüp JPEG data URL olarak görselli (vision) modele gönderilir.
 *   - Belge   -> metni tarayıcıda çıkarılıp metin olarak modele gönderilir.
 * Ses/video sohbette analiz EDİLEMEZ ('unsupported'). Okunamayan/çizilemeyen
 * dosyalar 'cannotRead' döner. Boyut sınırı aşılırsa 'tooLarge'.
 */

export const CHAT_ATTACH_MAX = 25 * 1024 * 1024 // 25 MB

const IMAGE_EXT = new Set(['png', 'jpg', 'jpeg', 'jpe', 'gif', 'webp', 'bmp', 'tif', 'tiff'])
const AV_EXT = new Set([
  'm4a', 'mp3', 'ogg', 'wav', 'wma', 'aif', 'amr', 'aac',
  'avi', 'm4v', 'mov', 'mp4', 'mpg', 'swf', 'wmv', 'asf', 'vob', 'mkv', 'webm',
])

function ext(name: string): string {
  return (name.split('.').pop() ?? '').toLowerCase()
}

export type ChatAttachment =
  | { kind: 'image'; name: string; dataUrl: string }
  | { kind: 'doc'; name: string; text: string }

export type PrepareResult =
  | { ok: true; attachment: ChatAttachment }
  | { ok: false; reason: 'tooLarge' | 'unsupported' | 'cannotRead' }

function isImageFile(file: File): boolean {
  if (file.type.startsWith('image/')) return true
  return IMAGE_EXT.has(ext(file.name))
}

function isAvFile(file: File): boolean {
  if (file.type.startsWith('audio/') || file.type.startsWith('video/')) return true
  return AV_EXT.has(ext(file.name))
}

/** Görseli tarayıcıda küçültüp JPEG data URL döndürür (istek boyutunu küçük tutar). */
function downscaleImage(file: File, maxDim = 1600, quality = 0.82): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      URL.revokeObjectURL(url)
      const scale = Math.min(1, maxDim / Math.max(img.width, img.height))
      const w = Math.max(1, Math.round(img.width * scale))
      const h = Math.max(1, Math.round(img.height * scale))
      const canvas = document.createElement('canvas')
      canvas.width = w
      canvas.height = h
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        reject(new Error('no-ctx'))
        return
      }
      ctx.drawImage(img, 0, 0, w, h)
      try {
        resolve(canvas.toDataURL('image/jpeg', quality))
      } catch (err) {
        reject(err as Error)
      }
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('img-load'))
    }
    img.src = url
  })
}

export async function prepareAttachment(file: File): Promise<PrepareResult> {
  if (file.size > CHAT_ATTACH_MAX) return { ok: false, reason: 'tooLarge' }

  if (isImageFile(file)) {
    try {
      const dataUrl = await downscaleImage(file)
      return { ok: true, attachment: { kind: 'image', name: file.name, dataUrl } }
    } catch {
      // Tarayıcının çizemediği görseller (ör. bazı .tif) — sohbette okunamaz.
      return { ok: false, reason: 'cannotRead' }
    }
  }

  if (isAvFile(file)) return { ok: false, reason: 'unsupported' }

  const { text, status } = await extractDocumentText(file)
  if (status === 'ok') return { ok: true, attachment: { kind: 'doc', name: file.name, text } }
  return { ok: false, reason: 'cannotRead' }
}

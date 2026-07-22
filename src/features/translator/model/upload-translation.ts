import { supabase } from '@/lib/supabase'

/** Dosya adını depoya güvenli hale getirir (Türkçe karakter/boşluk vb.). */
function safeName(name: string): string {
  const dot = name.lastIndexOf('.')
  const ext = dot > -1 ? name.slice(dot) : ''
  const base = (dot > -1 ? name.slice(0, dot) : name)
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-zA-Z0-9-_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 60)
  return `${base || 'dosya'}${ext.toLowerCase()}`
}

export interface UploadedFile {
  name: string
  path: string
}

/**
 * Tercümanın çeviri dosyalarını 'translations' deposuna yükler (RLS: onaylı tercüman).
 * Yol: <translatorId>/<orderId>/<zaman>-<ad>. Sunucu bu ön eki doğrular (güvenlik).
 * Döndürdüğü path listesi `submit` eylemine gönderilir.
 */
export async function uploadTranslationFiles(
  translatorId: string,
  orderId: string,
  files: File[],
): Promise<{ ok: boolean; files: UploadedFile[] }> {
  const out: UploadedFile[] = []
  for (const file of files) {
    const path = `${translatorId}/${orderId}/${Date.now()}-${safeName(file.name)}`
    const { error } = await supabase.storage
      .from('translations')
      .upload(path, file, { upsert: true, contentType: file.type || undefined })
    if (error) return { ok: false, files: [] }
    out.push({ name: file.name, path })
  }
  return { ok: true, files: out }
}

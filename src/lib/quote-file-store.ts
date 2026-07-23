// =====================================================================
// Fiyat sayfası — geçici DOSYA deposu (IndexedDB).
// sessionStorage yalnızca metin tutar; File/Blob saklayamaz. IndexedDB ise
// dosyayı "yapısal kopya" (structured clone) ile olduğu gibi saklayabilir.
// Böylece kullanıcı fiyat sayfasından giriş yapmak için ayrılıp geri döndüğünde
// yüklediği belge(ler) de kaybolmadan geri yüklenir.
//
// Not: Sipariş verilince (veya dosyalar silinince) bu depo temizlenir.
// =====================================================================

const DB_NAME = 'te-quote'
const STORE = 'files'
const RECORD_KEY = 'draft'

export interface StoredFileEntry {
  key: string
  name: string
  words: number
  status: string
  file: File
}

function openDb(): Promise<IDBDatabase | null> {
  return new Promise((resolve) => {
    try {
      if (typeof indexedDB === 'undefined') return resolve(null)
      const req = indexedDB.open(DB_NAME, 1)
      req.onupgradeneeded = () => {
        const db = req.result
        if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE)
      }
      req.onsuccess = () => resolve(req.result)
      req.onerror = () => resolve(null)
      req.onblocked = () => resolve(null)
    } catch {
      resolve(null)
    }
  })
}

/** Yüklenen dosyaları (metaverileriyle) tek bir kayıtta saklar. */
export async function saveQuoteFiles(entries: StoredFileEntry[]): Promise<void> {
  const db = await openDb()
  if (!db) return
  await new Promise<void>((resolve) => {
    try {
      const tx = db.transaction(STORE, 'readwrite')
      tx.objectStore(STORE).put(entries, RECORD_KEY)
      tx.oncomplete = () => resolve()
      tx.onerror = () => resolve()
      tx.onabort = () => resolve()
    } catch {
      resolve()
    }
  })
  db.close()
}

/** Saklanan dosyaları geri yükler (yoksa boş dizi). */
export async function loadQuoteFiles(): Promise<StoredFileEntry[]> {
  const db = await openDb()
  if (!db) return []
  const out = await new Promise<StoredFileEntry[]>((resolve) => {
    try {
      const tx = db.transaction(STORE, 'readonly')
      const req = tx.objectStore(STORE).get(RECORD_KEY)
      req.onsuccess = () => resolve(Array.isArray(req.result) ? (req.result as StoredFileEntry[]) : [])
      req.onerror = () => resolve([])
    } catch {
      resolve([])
    }
  })
  db.close()
  return out
}

/** Depoyu temizler (sipariş verildiğinde veya tüm dosyalar silindiğinde). */
export async function clearQuoteFiles(): Promise<void> {
  const db = await openDb()
  if (!db) return
  await new Promise<void>((resolve) => {
    try {
      const tx = db.transaction(STORE, 'readwrite')
      tx.objectStore(STORE).delete(RECORD_KEY)
      tx.oncomplete = () => resolve()
      tx.onerror = () => resolve()
      tx.onabort = () => resolve()
    } catch {
      resolve()
    }
  })
  db.close()
}

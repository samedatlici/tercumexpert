import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@/styles/globals.css'

/** GEÇİCİ TANI: hatayı beyaz ekran yerine sayfaya yazar. Sorun çözülünce kaldırılacak. */
function showError(label: string, detail: string) {
  const el = document.getElementById('root')
  if (!el) return
  el.innerHTML =
    '<div style="padding:20px;font-family:ui-monospace,monospace;max-width:900px;margin:0 auto">' +
    '<h1 style="color:#b00020;font-size:18px;margin:0 0 8px">TercümExpert — HATA (' +
    label +
    ')</h1>' +
    '<pre style="white-space:pre-wrap;background:#f4f4f5;padding:12px;border-radius:6px;font-size:12px;color:#111">' +
    detail.replace(/&/g, '&amp;').replace(/</g, '&lt;') +
    '</pre></div>'
}

window.addEventListener('error', (e) => {
  const err = e.error as Error | undefined
  showError('window', err ? `${err.name}: ${err.message}\n\n${err.stack ?? ''}` : e.message)
})
window.addEventListener('unhandledrejection', (e) => {
  const r = e.reason as { name?: string; message?: string; stack?: string } | undefined
  showError('promise', r ? `${r.name ?? 'Error'}: ${r.message ?? ''}\n\n${r.stack ?? ''}` : String(e.reason))
})

// Uygulamayı DİNAMİK yükle: modül-yükleme hatası .catch ile mesajıyla yakalanır.
import('@/app/App')
  .then(({ App }) => {
    const rootElement = document.getElementById('root')
    if (!rootElement) throw new Error('Kök element (#root) bulunamadı.')
    createRoot(rootElement).render(
      <StrictMode>
        <App />
      </StrictMode>,
    )
  })
  .catch((err: Error) => {
    showError('import', `${err?.name ?? 'Error'}: ${err?.message ?? ''}\n\n${err?.stack ?? ''}`)
  })

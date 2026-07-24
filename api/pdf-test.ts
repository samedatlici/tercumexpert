/**
 * GEÇİCİ teşhis ucu: PDFShift bağlantısını test eder. Tarayıcıda aç:
 *   https://<site>/api/pdf-test
 * JSON döndürür: anahtar var mı, PDFShift ne cevap verdi, hata ne.
 * Sorun çözülünce bu dosya kaldırılacak. (API anahtarını AÇMAZ; yalnızca uzunluğunu.)
 */
export const config = { runtime: 'edge' }

const PDFSHIFT_KEY = process.env.PDFSHIFT_API_KEY || ''

function json(obj: unknown, status = 200): Response {
  return new Response(JSON.stringify(obj, null, 2), {
    status,
    headers: { 'content-type': 'application/json' },
  })
}

export default async function handler(): Promise<Response> {
  const keyPresent = !!PDFSHIFT_KEY
  const out: Record<string, unknown> = {
    key_present: keyPresent,
    key_length: PDFSHIFT_KEY.length,
    key_prefix: PDFSHIFT_KEY ? PDFSHIFT_KEY.slice(0, 4) + '…' : '',
  }
  if (!keyPresent) {
    out.result = 'NO_KEY — PDFSHIFT_API_KEY Vercel ortam değişkeni bu deploy\'da görünmüyor.'
    return json(out)
  }
  try {
    const res = await fetch('https://api.pdfshift.io/v3/convert/pdf', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${btoa(`api:${PDFSHIFT_KEY}`)}`,
      },
      body: JSON.stringify({ source: '<h1>TercümExpert PDF test</h1>' }),
    })
    out.pdfshift_status = res.status
    out.ok = res.ok
    if (res.ok) {
      const buf = await res.arrayBuffer()
      out.result = 'OK'
      out.pdf_bytes = buf.byteLength
    } else {
      out.result = 'PDFSHIFT_ERROR'
      out.error = (await res.text().catch(() => '')).slice(0, 400)
    }
  } catch (e) {
    out.result = 'EXCEPTION'
    out.error = (e as Error)?.message || String(e)
  }
  return json(out)
}

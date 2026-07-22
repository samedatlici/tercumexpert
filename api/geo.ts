/**
 * Coğrafi konum uç noktası (Edge). Vercel, isteğe otomatik olarak
 * `x-vercel-ip-country` başlığını ekler (ISO-3166 alfa-2, ör. "TR", "DE").
 * SPA kökü (/) ilk ziyarette bunu okuyup ziyaretçiyi doğru dile yönlendirir.
 * Hiçbir kişisel veri saklanmaz; yalnızca ülke kodu döndürülür.
 */
export const config = { runtime: 'edge' }

export default function handler(req: Request): Response {
  const raw =
    req.headers.get('x-vercel-ip-country') ||
    req.headers.get('x-country') ||
    ''
  const country = raw.trim().toUpperCase()
  return new Response(JSON.stringify({ country: country || null }), {
    status: 200,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
    },
  })
}

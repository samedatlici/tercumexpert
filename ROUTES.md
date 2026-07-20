# ROUTES.md — TercümExpert

Tüm route'lar **locale prefix'li** çalışır (`/:lang/...`). `/` → `/tr` (canonical).
Route eşleştirme **tek kaynaktan** yönetilir: `src/app/router/routes.ts`.

## Diller (8)

`tr` (varsayılan/tam), `en` (base), `fr` (base), `de`, `es`, `ar` (RTL), `ru`, `it` (placeholder → fallback).

## Route Haritası (routeId → TR slug)

| routeId | TR yol | EN yol | Sayfa |
|---|---|---|---|
| home | `/tr` | `/en` | Anasayfa |
| services | `/tr/hizmetler` | `/en/services` | Hizmetler |
| quote | `/tr/fiyat-hesapla` | `/en/get-quote` | Fiyat Hesaplama (çalışıyor) |
| corporate | `/tr/kurumsal` | `/en/corporate` | Kurumsal |
| partnership | `/tr/is-ortakligi` | `/en/partnership` | İş Ortaklığı |
| blog | `/tr/blog` | `/en/blog` | Blog (iskelet) |
| blogPost | `/tr/blog/:slug` | `/en/blog/:slug` | Yazı (henüz yok → 404) |
| faq | `/tr/sss` | `/en/faq` | S.S.S. |
| contact | `/tr/iletisim` | `/en/contact` | İletişim |
| legalKvkk | `/tr/kvkk` | — | KVKK |
| legalPrivacy | `/tr/gizlilik-politikasi` | — | Gizlilik Politikası |
| legalDistanceSales | `/tr/mesafeli-satis-sozlesmesi` | — | Mesafeli Satış |
| legalCookies | `/tr/cerez-politikasi` | — | Çerez Politikası |
| * | herhangi | — | 404 NotFound |

## Kurallar

- **Canonical:** `/` → `/tr`. Her sayfa `Seo` bileşeniyle canonical + hreflang üretir.
- **Dil değişimi:** `LanguageSwitcher`, mevcut `routeId`'yi koruyarak hedef dilin karşılığına gider (`/tr/kurumsal` → `/en/corporate`).
- **Slug ekleme:** Yeni route → yalnız `ROUTE_SLUGS`'a satır ekle; slug'ı olmayan dil `en`'e düşer.
- **RTL:** `ar` için `<html dir="rtl">`; layout logical property'lerle (`ms-*`, `inline-start`) çalışır.
- **SPA fallback:** `vercel.json` tüm yolları `index.html`'e yönlendirir.

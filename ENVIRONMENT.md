# ENVIRONMENT.md — TercümExpert

Tüm env değişkenleri `src/app/config/env.ts` içinde **Zod ile doğrulanır**. Şablon: `.env.example`.

## Kurallar

- Client'a açılacak her değişken **`VITE_`** önekli olmalı; öneksizler build'e girmez.
- `VITE_` önekli değerler tarayıcıya gömülür → **gizli anahtar/secret KONULMAZ** (§29).
- Gerçek değerler Vercel > Settings > Environment Variables'a girilir (Preview/Production ayrı).
- Base URL hiçbir yerde hard-code edilmez; `VITE_APP_URL` kullanılır (§31).

## Değişkenler

| Değişken | Amaç | Zorunlu | Not |
|---|---|---|---|
| `VITE_APP_NAME` | Marka adı | – | Varsayılan "TercümExpert" |
| `VITE_APP_URL` | Site kök URL | ✓ (prod) | canonical/hreflang tabanı |
| `VITE_APP_ENV` | Ortam | – | development/staging/production |
| `VITE_API_BASE_URL` | Backend API | – | boşsa mock |
| `VITE_API_MODE` | mock/live | – | backend gelince `live` |
| `VITE_WHATSAPP_NUMBER` | WhatsApp | – | boşsa WhatsApp CTA gizlenir |
| `VITE_GA_MEASUREMENT_ID` | GA4 | – | boşsa yüklenmez |
| `VITE_GTM_ID` | Tag Manager | – | consent'e bağlı |
| `VITE_CLARITY_PROJECT_ID` | Clarity | – | consent'e bağlı |
| `VITE_META_PIXEL_ID` | Meta Pixel | – | consent + pazarlama onayı |
| `VITE_GSC_VERIFICATION` | Search Console | – | meta doğrulama |
| `VITE_FEATURE_DARK_MODE` | Dark mode | – | altyapı hazır, kapalı |
| `VITE_FEATURE_CHATBOT` | Chatbot | – | mock provider |
| `VITE_FEATURE_BLOG` | Blog | – | içerik gelince true |

## Analytics/Tracking

Script'ler yalnızca (a) ilgili ID dolu VE (b) kullanıcı onayı (consent) varsa yüklenir (§23).
Pazarlama script'leri (Pixel) ayrıca "marketing" onayı gerektirir. PII event payload'a yazılmaz.

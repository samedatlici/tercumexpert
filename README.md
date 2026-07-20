# TercümExpert

Bireysel ve kurumsal müşterilere yönelik, çok dilli (8 dil) profesyonel çeviri platformu.
**%100 client-side React SPA** (Server Components yok). Vercel'de yayınlanır.

## Referans Dokümanlar

| Dosya | İçerik |
|---|---|
| **PROJECT_PLAN.md** | Uygulama planı, denetim kararları, aşamalar |
| **PROJECT_RULES.md** | Kod/tasarım/içerik kuralları (anayasa) |
| **ARCHITECTURE.md** | Mimari, katmanlar, API soyutlaması |
| **DESIGN_SYSTEM.md** | Renk/tipografi/spacing/animasyon token'ları |
| **CONTENT_MODEL.md** | i18n + config + doğrulama modeli |
| **ROUTES.md** | Route/slug haritası, locale stratejisi |
| **ENVIRONMENT.md** | Env değişkenleri |
| **PROJECT_CHECKLIST.md** | Yayın öncesi doğrulanacaklar (kritik) |

> Not: PROJECT_RULES/ARCHITECTURE/DESIGN_SYSTEM ilk temel aşamasında yazıldı; nihai
> dil seti (ru) ve feature-based klasör yapısı **PROJECT_PLAN.md + CONTENT_MODEL.md +
> ROUTES.md** ile netleşmiştir. Çelişki hâlinde bu üç dosya + kod geçerlidir.

## Gereksinimler

- **Node.js 20+** (`.nvmrc`)
- **pnpm** (`corepack enable` ile gelir)

## Kurulum

```bash
corepack enable          # pnpm'i etkinleştirir
pnpm install
cp .env.example .env.local
pnpm dev                 # http://localhost:5173  (otomatik /tr)
```

## Komutlar

| Komut | Açıklama |
|---|---|
| `pnpm dev` | Geliştirme sunucusu |
| `pnpm build` | Production derlemesi |
| `pnpm preview` | Derlemeyi önizle |
| `pnpm typecheck` | TypeScript kontrolü |
| `pnpm lint` | ESLint (+ a11y) |
| `pnpm test` | Vitest birim testleri |
| `pnpm test:e2e` | Playwright E2E |

## Teknoloji

React 19 · Vite · TypeScript (strict) · Tailwind CSS · React Router v7 · TanStack Query ·
React Hook Form · Zod · Lucide · Framer Motion · Vitest · Testing Library · Playwright · pnpm.
Native fetch + hafif custom i18n (gereksiz paket yok — §3).

## Yayın (Vercel)

1. Depoyu GitHub'a gönderin.
2. Vercel > New Project > depoyu seçin (framework "Vite" algılanır; `vercel.json` hazır).
3. Environment Variables: `.env.example`'daki değişkenleri girin.
4. Deploy. Geçici adres: `<proje>.vercel.app` (domain hard-code EDİLMEZ).

## ⚠️ Önemli Uyarılar

- **Hukuki metinler** (KVKK, Gizlilik, Mesafeli Satış, Çerez) **taslaktır** ve yayından önce
  bir **avukat** tarafından incelenmelidir.
- Şirket bilgileri, istatistikler, fiyatlar ve sertifika iddiaları **doğrulanmamıştır**;
  `PROJECT_CHECKLIST.md`'yi tamamlamadan üretimde yayınlamayın.
- Form gönderimleri **demo modundadır** (sunucuya gitmez); backend bağlanınca `VITE_API_MODE=live`.

## Diller

Türkçe (varsayılan/tam), İngilizce, Fransızca (base); Almanca, İspanyolca, Arapça (RTL),
Rusça, İtalyanca (placeholder → fallback ile tam gösterim).

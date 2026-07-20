# TercümExpert — Mimari Dokümanı (ARCHITECTURE.md)

> Bu doküman, projenin teknik iskeletini tanımlar: klasör yapısı, katmanlar, veri akışı, API soyutlaması, i18n, routing, state, analytics ve dark mode altyapısı.
> **Kod standartları ve kurallar için `PROJECT_RULES.md`, tasarım tokenları için `DESIGN_SYSTEM.md` dosyalarına bakın.**

**Sürüm:** 1.0 · **Durum:** Foundation (kod öncesi mimari) · **Son güncelleme:** 2026-07-20

---

## 1. Teknoloji Kararları (Özet)

| Katman | Seçim | Neden |
|---|---|---|
| Framework | **React 19** (client-side only) | Modern, concurrent features, `use` hook, Actions |
| Build tool | **Vite 6+** | Hızlı HMR, native ESM, Rollup tabanlı prod build |
| Dil | **TypeScript 5.x** (strict) | Tip güvenliği, ölçeklenebilirlik |
| Styling | **Tailwind CSS 4.x** + CSS variables | Utility-first + tema tokenları |
| UI primitives | **shadcn/ui** (Radix tabanlı) | Sahiplik bizde, kopyalanan kod, a11y hazır |
| Animasyon | **Framer Motion (motion)** | Deklaratif, performanslı animasyon |
| Form | **React Hook Form** | Uncontrolled, performanslı |
| Validasyon | **Zod** | Tip-güvenli şema, RHF + API ile paylaşımlı |
| Routing | **React Router v7** (data mode, client) | i18n-aware nested routing |
| i18n | **i18next + react-i18next** | 8 dil + RTL, lazy namespace |
| State (server) | **TanStack Query v5** | Cache, retry, background refetch |
| State (client) | **Zustand** | Küçük, boilerplate'siz global state |
| İkonlar | **lucide-react** | Tree-shakeable, tutarlı |
| Deploy | **Vercel** (SPA, geçici domain) | Sıfır-config, edge, preview deploy |

> **NOT:** React Server Components **kullanılmayacak**. Uygulama %100 client-side SPA'dır. Next.js **yok**.
> Yasaklı/istenmeyen bağımlılıkların tam listesi `PROJECT_RULES.md` → "Kullanılmayacak Teknolojiler" bölümündedir.

---

## 2. Mimari Felsefe: Feature-Sliced + Clean Architecture

Proje iki prensibi birleştirir:

1. **Katmanlı bağımlılık kuralı (Clean Architecture):** Bağımlılıklar her zaman **içe doğru** akar. UI → application → domain. Domain hiçbir şeye bağımlı değildir. Framework detayları (React, Axios, i18next) en dışta, "kirli" katmandadır.
2. **Feature-Sliced izolasyon:** Her iş özelliği (feature) kendi klasöründe yaşar; bir feature başka bir feature'ın iç dosyalarına **doğrudan erişemez**, yalnızca public API'si (`index.ts`) üzerinden erişir.

### 2.1 Bağımlılık Yönü (izin verilen import zinciri)

```
app  →  pages  →  widgets  →  features  →  entities  →  shared
```

- Bir katman **yalnızca kendinden alt seviyedekileri** import edebilir.
- `shared` hiçbir üst katmanı import etmez (yaprak katman).
- Yatay import (feature → feature) **yasaktır**; ortak ihtiyaç `entities` veya `shared`'a taşınır.
- Bu kural ESLint `import/no-restricted-paths` ile zorunlu kılınır (bkz. PROJECT_RULES.md).

### 2.2 Katmanların Sorumlulukları

| Katman | Sorumluluk | Örnek |
|---|---|---|
| `app` | Bootstrap, provider'lar, router, global stiller | `<AppProviders>`, `router.tsx` |
| `pages` | Route'a bağlanan sayfa kompozisyonları | `HomePage`, `ContactPage` |
| `widgets` | Bağımsız, kendi kendine yeten büyük UI blokları | `Header`, `Footer`, `HeroSection` |
| `features` | Kullanıcı etkileşimi olan iş yetenekleri | `quote-request`, `language-switcher` |
| `entities` | İş nesneleri + onların UI/model'i | `service`, `testimonial`, `partner` |
| `shared` | Reusable, iş-agnostik altyapı | `ui/`, `lib/`, `api/`, `config/`, `hooks/` |

---

## 3. Kök Klasör Yapısı

```
tercumexpert/
├── public/                      # Statik varlıklar (favicon, robots.txt, sitemap, og-image)
│   ├── favicon.svg
│   ├── robots.txt
│   ├── site.webmanifest
│   └── images/                  # Optimize edilmiş, versiyonlanmış statikler
├── src/
│   ├── app/                     # Uygulama kabuğu (aşağıda detaylı)
│   ├── pages/
│   ├── widgets/
│   ├── features/
│   ├── entities/
│   ├── shared/
│   └── main.tsx                 # Giriş noktası (createRoot)
├── .env.example                 # Tüm env değişkenlerinin şablonu (gerçek değer YOK)
├── .env.local                   # (git-ignored) yerel geliştirme değerleri
├── .eslintrc.cjs / eslint.config.js
├── .prettierrc
├── .editorconfig
├── .gitignore
├── .nvmrc                       # Node sürüm sabiti
├── components.json              # shadcn/ui konfigürasyonu
├── index.html                   # Vite HTML template (meta, preconnect, lang)
├── package.json
├── postcss.config.js
├── tailwind.config.ts
├── tsconfig.json
├── tsconfig.node.json
├── vite.config.ts
├── vercel.json                  # SPA rewrites, header'lar, cache
├── PROJECT_RULES.md
├── ARCHITECTURE.md              # (bu dosya)
├── DESIGN_SYSTEM.md
└── README.md
```

---

## 4. `src/` İç Yapısı (Detaylı)

### 4.1 `app/` — Uygulama Kabuğu

```
app/
├── App.tsx                      # Router + Suspense sınırlarını bağlar
├── providers/
│   ├── AppProviders.tsx         # Tüm provider'ları tek yerde compose eder
│   ├── QueryProvider.tsx        # TanStack Query client
│   ├── ThemeProvider.tsx        # Dark mode altyapısı (şimdilik 'light' kilitli)
│   ├── I18nProvider.tsx         # i18next + <html lang>/<dir> senkronu
│   └── AnalyticsProvider.tsx    # GA/Clarity/Pixel'i env ID varsa yükler
├── router/
│   ├── router.tsx               # createBrowserRouter, lazy route tanımları
│   ├── routes.ts                # Route path sabitleri (tek kaynak)
│   └── guards/                  # (ileride) auth/role guard'ları
├── styles/
│   ├── globals.css              # Tailwind direktifleri + CSS değişkenleri (tokenlar)
│   ├── tokens.css               # Primitive + semantic CSS variables (light/dark)
│   └── fonts.css                # @font-face / font-display tanımları
└── main-error-boundary.tsx      # En üst seviye hata sınırı
```

**AppProviders sıralaması (dıştan içe):**
`ErrorBoundary → HelmetProvider(SEO) → I18nProvider → ThemeProvider → QueryProvider → AnalyticsProvider → RouterProvider`

### 4.2 `pages/` — Route Kompozisyonları

Her sayfa **yalnızca kompozisyondan** sorumludur; iş mantığı içermez. Widget ve feature'ları dizer, SEO meta'sını set eder.

```
pages/
├── home/
│   ├── HomePage.tsx
│   └── index.ts
├── services/
├── about/
├── contact/
├── legal/                       # privacy, terms, cookies
├── not-found/
│   └── NotFoundPage.tsx
└── index.ts                     # (opsiyonel) barrel
```

> Her sayfa `React.lazy` ile code-split edilir (bkz. §7 Routing).

### 4.3 `widgets/` — Bağımsız UI Blokları

Sayfa parçaları. Kendi verisini (gerekirse entity'lerden) çeker, kendi kendine yeter.

```
widgets/
├── header/
│   ├── ui/Header.tsx
│   ├── ui/MobileNav.tsx
│   ├── model/useHeaderState.ts
│   └── index.ts
├── footer/
├── hero-section/
├── services-grid/
├── testimonials/
├── partners-marquee/
├── faq/
└── cta-band/
```

### 4.4 `features/` — İş Yetenekleri

Kullanıcının **yaptığı bir şey**. Form, aksiyon, etkileşim içerir.

```
features/
├── quote-request/               # Teklif/fiyat isteği formu
│   ├── ui/QuoteRequestForm.tsx
│   ├── model/schema.ts          # Zod şeması
│   ├── model/useQuoteRequest.ts # RHF + mutation
│   ├── api/quoteRequest.api.ts  # shared/api client'ı kullanır
│   └── index.ts
├── language-switcher/
├── contact-form/
├── cookie-consent/
├── newsletter-signup/
└── theme-toggle/                # (gizli/pasif) dark mode altyapısı hazır
```

**Bir feature'ın anatomisi (zorunlu iç yapı):**

```
feature-name/
├── ui/          # React componentleri (sadece sunum + hook çağrısı)
├── model/       # Hook'lar, state, zod şemaları, tipler (iş mantığı)
├── api/         # Bu feature'a özel API çağrıları (shared/api üstüne)
├── lib/         # (ops.) feature'a özel saf yardımcılar
└── index.ts     # PUBLIC API — dışarıya sadece buradan export edilir
```

### 4.5 `entities/` — İş Nesneleri

Uygulamanın konuştuğu "isimler". Veri modeli + o modele ait salt-görsel componentler.

```
entities/
├── service/
│   ├── model/service.types.ts   # Service domain tipi
│   ├── model/service.mapper.ts  # DTO → domain dönüşümü
│   ├── ui/ServiceCard.tsx       # Tek bir service'i gösteren "aptal" kart
│   └── index.ts
├── testimonial/
├── partner/
├── language/                    # Desteklenen diller (kod, ad, dir, bayrak)
└── faq-item/
```

> Entity UI componentleri **veri çekmez**; prop alır. Veri çekme widget/feature katmanında yapılır.

### 4.6 `shared/` — Reusable Altyapı

İş-agnostik, her yerde kullanılabilir. Yaprak katman.

```
shared/
├── ui/                          # shadcn/ui + kendi primitive'lerimiz
│   ├── button/
│   ├── input/
│   ├── dialog/
│   ├── ... (Button, Card, Badge, Sheet, Accordion, Tooltip, ...)
│   └── index.ts
├── api/
│   ├── http-client.ts           # Axios instance (interceptor, baseURL)
│   ├── api-client.ts            # Soyut ApiClient arayüzü (bkz. §6)
│   ├── endpoints.ts             # Endpoint path sabitleri
│   ├── query-keys.ts            # TanStack Query key fabrikaları
│   └── types.ts                 # ApiResponse<T>, ApiError, Paginated<T>
├── config/
│   ├── env.ts                   # Zod-validate edilmiş env (bkz. §9)
│   ├── site.config.ts           # Site adı, sosyal linkler, iletişim
│   ├── seo.config.ts            # Varsayılan SEO/meta
│   └── analytics.config.ts      # GA/Clarity/Pixel ID map'i
├── lib/
│   ├── cn.ts                    # clsx + tailwind-merge
│   ├── format/                  # tarih, sayı, para (locale-aware)
│   ├── validation/              # ortak zod parçaları (email, phone)
│   └── utils/                   # saf yardımcılar
├── hooks/
│   ├── use-media-query.ts
│   ├── use-scroll-lock.ts
│   ├── use-intersection.ts
│   ├── use-reduced-motion.ts    # a11y: prefers-reduced-motion
│   └── use-direction.ts         # RTL/LTR
├── i18n/
│   ├── config.ts                # i18next init
│   ├── resources/               # namespace JSON'ları (dil başına)
│   │   ├── tr/  de/  en/  fr/  es/  ar/  it/  nl/
│   └── index.ts
├── providers/                   # (küçük, cross-cutting) 
├── types/                       # global tipler (env.d.ts, vite-env.d.ts)
├── assets/                      # import edilen görsel/ikon (build-processed)
└── constants/                   # magic-number/string olmayan sabitler
```

---

## 5. Component Mimarisi

### 5.1 Component Hiyerarşisi (Atomic-ilhamlı, 4 seviye)

```
1) Primitives   → shared/ui   (Button, Input, Card) — shadcn/ui tabanlı, tema-farkında
2) Entity UI    → entities/*/ui (ServiceCard) — tek bir domain nesnesini gösterir
3) Widgets      → widgets/*    (ServicesGrid, Header) — kompozit, bağımsız blok
4) Pages        → pages/*      (HomePage) — widget/feature dizilimi
```

### 5.2 Component Sınıflandırması

- **Presentational (dumb):** Sadece prop alır, JSX döner. Yan etkisiz. Entity UI ve çoğu shared/ui.
- **Container (smart):** Hook'larla veri/eylem bağlar, presentational'a prop geçer. Feature/widget model katmanı.
- Bu ayrım "klasör" değil, **sorumluluk** ayrımıdır; container mantığı `model/` hook'larında, sunum `ui/`de tutulur.

### 5.3 Reusability Kuralları

- Bir component **2+ yerde** kullanılıyorsa `shared/ui`'ye taşınır.
- Bir component'in **variant**'ları `class-variance-authority (cva)` ile tanımlanır (size, intent, tone).
- Prop drilling 2 seviyeyi geçerse → composition (children/slots) veya context.
- Her reusable component: kontrollü/kontrolsüz uyumu, `forwardRef`, `className` override (via `cn`), `aria-*` passthrough sağlar.

### 5.4 Standart Component İskeleti (referans)

```tsx
// shared/ui/button/button.tsx
import { forwardRef } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/shared/lib/cn'

const buttonVariants = cva('base-classes...', {
  variants: { intent: {...}, size: {...} },
  defaultVariants: { intent: 'primary', size: 'md' },
})

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, intent, size, ...props }, ref) => (
    <button ref={ref} className={cn(buttonVariants({ intent, size }), className)} {...props} />
  ),
)
Button.displayName = 'Button'
```

---

## 6. API Katmanı Soyutlaması (Backend-agnostik)

Backend ileride **Laravel, Node.js veya Supabase** olabilir. Bu yüzden UI, somut bir HTTP kütüphanesine veya backend'e **asla doğrudan bağlanmaz**.

### 6.1 Katmanlar

```
UI/feature  →  TanStack Query hook  →  entity API service  →  ApiClient (arayüz)  →  adapter (Axios | Supabase | fetch)
```

### 6.2 `ApiClient` Arayüzü (tek sözleşme)

```ts
// shared/api/api-client.ts
export interface ApiClient {
  get<T>(path: string, params?: QueryParams): Promise<T>
  post<T, B = unknown>(path: string, body?: B): Promise<T>
  put<T, B = unknown>(path: string, body?: B): Promise<T>
  patch<T, B = unknown>(path: string, body?: B): Promise<T>
  delete<T>(path: string): Promise<T>
}
```

- Varsayılan implementasyon: `HttpApiClient` (Axios). Backend Supabase olursa `SupabaseApiClient` yazılır — **UI değişmez**.
- Somut client `AppProviders` seviyesinde inject edilir (basit DI / context veya modül singleton).

### 6.3 Standart Sözleşmeler

```ts
export type ApiResponse<T> = { data: T; meta?: Record<string, unknown> }
export type ApiError = { status: number; code: string; message: string; fields?: Record<string, string[]> }
export type Paginated<T> = { items: T[]; page: number; pageSize: number; total: number }
```

- **DTO ≠ Domain:** Sunucudan gelen `DTO`, `entities/*/model/*.mapper.ts` ile domain tipine çevrilir. UI yalnızca domain tipini görür → backend değişse bile UI izole kalır.
- **Zod ile runtime doğrulama:** API yanıtları kritik yollarda Zod ile parse edilir; şema hem tip hem validasyon kaynağı olur (form Zod'ları ile paylaşımlı).
- **Query key fabrikaları:** `query-keys.ts` merkezi; cache invalidation tutarlı.

### 6.4 Mock/Geçiş Stratejisi

Backend hazır değilken UI ilerlesin diye: `env.VITE_API_MODE = 'mock' | 'live'`. `mock` modda `MockApiClient` statik JSON döner. Böylece landing page backend olmadan tamamlanır.

---

## 7. Routing

- **React Router v7**, `createBrowserRouter` (data mode), **client-side**.
- Tüm sayfalar `React.lazy` + `Suspense` ile **route-level code-splitting**.
- Route path'leri `app/router/routes.ts` içinde **tek kaynak** olarak sabit tutulur (magic string yok).
- **i18n-aware routing:** URL prefix stratejisi `/:lang/...` (örn. `/tr/hizmetler`, `/en/services`). Varsayılan dil (TR) prefixsiz veya prefixli — karar `PROJECT_RULES.md` SEO bölümünde (hreflang ile birlikte) netleştirilir.
- Bilinmeyen `:lang` → 404 veya varsayılana redirect.
- Scroll restoration + route değişiminde focus yönetimi (a11y) merkezi.

```
/                     → HomePage
/:lang                → HomePage (localized)
/:lang/services       → ServicesPage
/:lang/about          → AboutPage
/:lang/contact        → ContactPage
/:lang/legal/privacy  → PrivacyPage
*                     → NotFoundPage
```

---

## 8. Uluslararasılaştırma (i18n) + RTL

**Diller (8):** Türkçe `tr` (varsayılan), Almanca `de`, İngilizce `en`, Fransızca `fr`, İspanyolca `es`, Arapça `ar` (**RTL**), İtalyanca `it`, Felemenkçe `nl`.

- **Kütüphane:** `i18next` + `react-i18next`, `i18next-browser-languagedetector`.
- **Namespace bazlı bölme:** `common`, `home`, `services`, `contact`, `seo` → dil başına lazy yüklenir (tüm çeviriler tek bundle'a girmez).
- **Kaynak yapısı:** `shared/i18n/resources/{lang}/{namespace}.json`.
- **Tip güvenliği:** `i18next` type augmentation ile `t('key')` anahtarları TS tarafından kontrol edilir.
- **RTL desteği:**
  - `I18nProvider`, dil değişince `<html lang="ar" dir="rtl">` set eder (`useDirection` hook).
  - Tailwind **logical properties** kullanılır (`ms-*`, `me-*`, `ps-*`, `pe-*`, `text-start/end`) — `ml/mr` yerine. Böylece RTL otomatik çalışır.
  - `tailwindcss-rtl` **gerekmez**; Tailwind 4 logical utility'leri yeterli. İkon yön çevrimi (ok vb.) için `rtl:` variant / `scale-x-[-1]`.
- **Locale-aware format:** tarih/sayı/para `Intl` API ile aktif locale'e göre (`shared/lib/format`).
- **SEO:** her sayfada `hreflang` alternatifleri + `og:locale` (bkz. PROJECT_RULES SEO).

---

## 9. Environment Variables (Production Seviyesi)

- Vite kuralı: client'a açılacak değişkenler **`VITE_` önekli** olmalı. Önekli değişkenler build'e gömülür → **gizli anahtar konmaz**.
- Tüm env, uygulama başında **Zod ile doğrulanır** (`shared/config/env.ts`). Eksik/yanlış env → build/başlangıçta anlaşılır hata.
- `.env.example` her değişkeni **boş/placeholder** değerle listeler; gerçek değerler Vercel Project Settings → Environment Variables'a girilir.

### `.env.example` (şablon)

```bash
# --- App ---
VITE_APP_NAME="TercümExpert"
VITE_APP_URL="https://tercumexpert.vercel.app"     # geçici Vercel domaini
VITE_APP_ENV="development"                          # development | staging | production
VITE_DEFAULT_LOCALE="tr"

# --- API ---
VITE_API_BASE_URL=""                                # backend hazır olunca doldurulur
VITE_API_MODE="mock"                                # mock | live

# --- Analytics (sadece ID girilince aktifleşir) ---
VITE_GA_MEASUREMENT_ID=""                            # G-XXXXXXX
VITE_CLARITY_PROJECT_ID=""                           # Microsoft Clarity
VITE_META_PIXEL_ID=""                                # Meta/Facebook Pixel
VITE_GSC_VERIFICATION=""                             # Search Console meta doğrulama

# --- Feature flags ---
VITE_FEATURE_DARK_MODE="false"                       # dark mode altyapısı hazır, kapalı
VITE_FEATURE_CHATBOT="false"
```

### `env.ts` doğrulama (özet)

```ts
import { z } from 'zod'
const schema = z.object({
  VITE_APP_NAME: z.string().min(1),
  VITE_APP_URL: z.string().url(),
  VITE_APP_ENV: z.enum(['development', 'staging', 'production']),
  VITE_API_MODE: z.enum(['mock', 'live']).default('mock'),
  VITE_GA_MEASUREMENT_ID: z.string().optional().default(''),
  // ...
})
export const env = schema.parse(import.meta.env)
```

---

## 10. Analytics & Tracking Altyapısı ("ID gir, aktif olsun")

Hedef: Google Analytics 4, Microsoft Clarity, Meta Pixel, Search Console **sadece ilgili ENV ID'si girildiğinde** yüklensin; boşsa hiçbir script eklenmesin (performans + gizlilik).

- **`AnalyticsProvider`** mount olunca `analytics.config.ts`'teki ID'leri okur; **dolu olanlar için** ilgili script'i **dinamik ve gecikmeli** (idle/consent sonrası) enjekte eder.
- **Consent-aware:** `cookie-consent` feature'ı onay vermeden pazarlama script'leri (Pixel) yüklenmez (KVKK/GDPR).
- **Soyut arayüz:** `trackEvent(name, props)` tek fonksiyon; altında aktif sağlayıcılara fan-out eder. Sayfalar sağlayıcıyı bilmez.
- **Search Console:** meta-tag doğrulaması `index.html`'e env ile enjekte edilir; ayrıca `sitemap.xml` + `robots.txt` sağlanır.
- Script yüklemede **`defer` / idle** kullanılır; LCP'yi bloklamaz.

---

## 11. State Yönetimi

| İhtiyaç | Araç | Kural |
|---|---|---|
| Sunucu verisi (cache, fetch) | **TanStack Query** | Tüm API verisi buradan; local state'e kopyalanmaz |
| Global UI state (tema, drawer, consent) | **Zustand** | Küçük, seçici (selector) store'lar |
| Form state | **React Hook Form** | Component-local; Zod resolver |
| Yerel/geçici UI | `useState`/`useReducer` | Component içinde |
| Türetilmiş değer | `useMemo` / selector | Ekstra state tutma |

- Global state **minimumda** tutulur; "her şey global" anti-pattern'inden kaçınılır.
- Context yalnızca gerçekten cross-cutting ve nadir değişen değerler için (theme, i18n, DI).

---

## 12. Dark Mode Altyapısı (Şimdilik Pasif, Sonra Tek Anahtar)

Gereksinim: dark mode **kapalı** başlasın ama **kolayca açılabilsin**.

- **Token tabanlı tema:** Renkler doğrudan değil, **semantic CSS variable**'lar üzerinden kullanılır (`--color-bg`, `--color-fg`, `--color-primary` ...). Light ve dark değer setleri `tokens.css`'te tanımlıdır (bkz. DESIGN_SYSTEM.md).
- **Tailwind `darkMode: 'class'`:** dark değerler `.dark` selector'ı altında. Bugün `.dark` sınıfı **hiçbir zaman eklenmez** → görünüm hep light.
- **`ThemeProvider`:** `theme: 'light' | 'dark' | 'system'` destekler ama `VITE_FEATURE_DARK_MODE=false` iken **`'light'`e kilitlenir** ve toggle UI gizlenir.
- Açmak için: `VITE_FEATURE_DARK_MODE=true` + `theme-toggle` feature'ını göstermek. **Component kodu değişmez.**
- Kural: geliştiriciler **hiçbir yerde hard-coded renk** (`bg-white`, `#fff`) yazmaz; hep semantic token (`bg-background`, `text-foreground`) kullanır — böylece dark mode "bedavaya" gelir.

---

## 13. Performans Mimarisi (özet — hedefler PROJECT_RULES.md'de)

- **Code-splitting:** route + ağır widget (`lazy`), `Suspense` fallback iskeletleri.
- **Bundle hijyeni:** `lucide-react` named import (tree-shake), `motion` selektif import, `rollup-plugin-visualizer` ile bundle analizi.
- **Görsel:** modern format (AVIF/WebP), responsive `srcset`, `loading="lazy"`, `fetchpriority="high"` (LCP görseli), boyut attribute'ları (CLS önleme).
- **Font:** `font-display: swap`, `preconnect`/`preload`, subset (bkz. DESIGN_SYSTEM Font stratejisi).
- **Kritik CSS:** Tailwind purge (content taraması) → minimal CSS.
- **Prefetch:** hover/idle'da route prefetch (React Router `lazy`).

---

## 14. Kalite Kapıları (Tooling)

```
ESLint (typescript-eslint, react-hooks, jsx-a11y, import) 
Prettier (+ prettier-plugin-tailwindcss — class sıralama)
TypeScript strict (noUncheckedIndexedAccess dahil)
Husky + lint-staged (pre-commit)
Commitlint (Conventional Commits)
Vitest + React Testing Library (unit/component)
Playwright (opsiyonel E2E, ileride)
```

- CI (Vercel/GitHub Actions): `typecheck → lint → test → build` sırası; herhangi biri fail ise deploy yok.

---

## 15. Deploy (Vercel, Geçici Domain)

- **SPA rewrite:** tüm yollar `index.html`'e (`vercel.json`).
- Geçici domain: `tercumexpert.vercel.app`. Gerçek domain alınınca Vercel → Domains'ten bağlanır, env `VITE_APP_URL` güncellenir, canonical/hreflang otomatik doğru olur.
- **Preview deploy:** her PR için otomatik önizleme.
- **Header/caching:** statik varlıklar için uzun `Cache-Control` + immutable; `index.html` no-cache.

### `vercel.json` (referans)

```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }],
  "headers": [
    {
      "source": "/assets/(.*)",
      "headers": [{ "key": "Cache-Control", "value": "public, max-age=31536000, immutable" }]
    }
  ]
}
```

---

## 16. Gelecek Genişlemeleri (Mimariye Yer Ayrıldı)

| Özellik | Nasıl hazır | Nereye gelecek |
|---|---|---|
| Authentication | `app/router/guards`, `features/auth`, ApiClient token interceptor | Route guard + entity `user` |
| Admin paneli | Ayrı route grubu `/:lang/admin/*`, lazy chunk, guard | `pages/admin`, `features/admin-*` |
| Partner paneli | `/:lang/partner/*`, role-based guard | `pages/partner` |
| Canlı AI chatbot | `features/chatbot` (feature flag), streaming ApiClient | Widget + provider |
| Analytics dashboard | Mevcut analytics soyutlaması + Query | `pages/admin/analytics` |
| Yeni dil | `resources/{lang}` klasörü + entity `language` kaydı | Sıfır kod değişikliği |

Mimarideki **feature-sliced izolasyon** ve **backend-agnostik API katmanı** sayesinde bu eklemeler mevcut kodu bozmadan, kendi dilimlerinde büyür.

# PROJECT_RULES.md — TercümExpert

> **Bu dosya projenin anayasasıdır.** Bundan sonraki her geliştirme (kod, tasarım, içerik, commit) bu kurallara uyar.
> Yardımcı dokümanlar: **`ARCHITECTURE.md`** (teknik yapı) · **`DESIGN_SYSTEM.md`** (görsel token'lar).
> Bir kural burada ve alt dokümanda çelişirse **bu dosya** önceliklidir.

**Sürüm:** 1.0 · **Son güncelleme:** 2026-07-20 · **Durum:** Foundation

---

## 0. Proje Özeti

TercümExpert; çok dilli (8 dil), kurumsal bir çeviri/lokalizasyon hizmet markasının **production seviyesinde, %100 client-side React SPA** web sitesidir. Vercel'de yayınlanır. Referans alınan mevcut bir frontend'in tasarımı, marka bağımsızlaştırılarak ve içerik mantığı düzeltilerek yeniden inşa edilir. İleride admin/partner panelleri, auth, AI chatbot, analytics ve API entegrasyonları eklenecek şekilde tasarlanmıştır.

---

## 1. Kullanılacak Teknolojiler

| Alan | Teknoloji |
|---|---|
| UI framework | React 19 (client-side, **RSC yok**) |
| Build | Vite 6+ |
| Dil | TypeScript 5.x (**strict**) |
| Styling | Tailwind CSS + CSS variables (design tokens) |
| UI primitives | shadcn/ui (Radix) |
| Animasyon | Framer Motion (`motion`) |
| Form | React Hook Form |
| Validasyon | Zod |
| Routing | React Router v7 (client, data mode) |
| i18n | i18next + react-i18next (8 dil + RTL) |
| Server state | TanStack Query v5 |
| Client state | Zustand |
| İkonlar | lucide-react |
| Test | Vitest + React Testing Library |
| Deploy | Vercel |

## 2. Kullanılmayacak Teknolojiler (Yasaklı)

- **Next.js / Remix / herhangi bir SSR/RSC framework** — proje saf SPA.
- **Redux / MobX / Recoil** — state için Zustand + TanStack Query yeterli.
- **CSS-in-JS runtime** (styled-components, Emotion) — Tailwind + token kullanılır.
- **Moment.js** — `Intl` / hafif alternatif.
- **Axios dışı** ağır HTTP soyutlamaları gereksizse eklenmez; ham `fetch` wrapper de olur (ApiClient arkasında).
- **jQuery, Bootstrap, Material UI, Ant Design** — tasarım sistemimizle çelişir.
- **localStorage'a hassas veri** yazmak; **inline `<style>`/`!important`** (zorunlu haller hariç).
- **Class component**, **legacy lifecycle**, **defaultProps (fonksiyon comp.)**, **PropTypes**, **HOC** yeni kodda — modern hook + TS.
- Kullanılmayan/duplicate işlevli npm paketi. **Her bağımlılık gerekçelendirilir** (bkz. §14).

---

## 3. Kod Standartları

- **TypeScript strict**: `strict`, `noUncheckedIndexedAccess`, `noImplicitOverride`, `exactOptionalPropertyTypes`. `any` **yasak** (`unknown` + daraltma). Public fonksiyon/hook dönüşleri açıkça tiplenir.
- **Fonksiyonel React**: yalnızca function component + hooks. Yan etkiler `useEffect`'te ve minimumda; türetilmiş değer state'te tutulmaz (`useMemo`/hesap).
- **Saf fonksiyonlar**: `shared/lib` yardımcıları saf ve test edilebilir.
- **Erken dönüş** (guard clauses), derin iç içe koşuldan kaçış. Fonksiyon tek iş yapar.
- **İsimlendirme anlamlı**: kısaltma yok (`btn`→`button` değil ama `usr`→`user`). Boolean `is/has/should` önekli. Handler `handleX`, prop `onX`.
- **Magic value yok**: sabitler `constants/` veya token'da. String literal tekrarları sabite.
- **Yorum "neden"i anlatır**, "ne"yi değil. Ölü kod/`console.log` commit'e girmez.
- **Import düzeni** (ESLint zorunlu): 1) react/dış paket 2) `@/` iç katman (üstten alta) 3) göreli 4) tip 5) stil. Katmanlar arası kural §5.2.
- **Barrel (`index.ts`)** her feature/widget/entity'nin public API'si; içine yalnız dışa açılacaklar export edilir.
- **Formatlama** Prettier + `prettier-plugin-tailwindcss` (class sırası otomatik). Elle format yok.

---

## 4. Naming Convention (İsimlendirme Standardı)

| Öğe | Kural | Örnek |
|---|---|---|
| Klasör | kebab-case | `quote-request/`, `hero-section/` |
| React component dosyası | PascalCase.tsx | `ServiceCard.tsx`, `Header.tsx` |
| Hook dosyası | camelCase, `use` önekli | `useQuoteRequest.ts` |
| Yardımcı/util dosyası | kebab-case | `format-date.ts`, `http-client.ts` |
| Tip/şema dosyası | `*.types.ts`, `*.schema.ts` | `service.types.ts` |
| Test dosyası | `*.test.ts(x)` | `Button.test.tsx` |
| Component (kod) | PascalCase | `function ServiceCard()` |
| Hook (kod) | camelCase `use…` | `useMediaQuery()` |
| Değişken/fonksiyon | camelCase | `activeLocale`, `formatPrice()` |
| Boolean | `is/has/should/can` | `isLoading`, `hasError` |
| Sabit | UPPER_SNAKE_CASE | `MAX_UPLOAD_SIZE`, `SUPPORTED_LOCALES` |
| Tip/Interface | PascalCase (I öneki YOK) | `Service`, `ApiResponse` |
| Enum benzeri | `as const` obje | `ROUTES`, `LOCALES` |
| Event handler | `handle…` / prop `on…` | `handleSubmit` / `onSubmit` |
| CSS token | `--kebab-case` | `--color-primary` |
| i18n anahtar | `namespace.dot.case` | `home.hero.title` |
| Env değişkeni | `VITE_UPPER_SNAKE` | `VITE_API_BASE_URL` |

---

## 5. Component Standartları

### 5.1 Yapı
- Bir dosya = bir component (+ o component'e özel küçük alt parçalar). Büyürse böl.
- Component **≤ ~200 satır** hedefi; aşarsa alt component/hook'a ayır.
- İş mantığı `model/` hook'larında; `ui/` yalnız sunum + hook çağrısı.
- Prop arayüzü `interface XProps` ile explicit; gereksiz opsiyonel prop yok.
- Reusable primitive: `forwardRef`, `className` override (`cn`), `...rest` passthrough, `cva` variant.
- Veri çeken component (container) ile gösteren (presentational) ayrılır. Entity UI **prop alır, fetch etmez**.

### 5.2 Katman Bağımlılık Kuralı (ESLint zorunlu)
İzin verilen import yönü: `app → pages → widgets → features → entities → shared`.
- Üst katmanı import etmek **yasak**. Feature→feature yatay import **yasak**.
- Her dilim dışarıya yalnız `index.ts` üzerinden açılır; iç dosyaya derin import yasak.

### 5.3 Reusability
- 2+ yerde kullanım → `shared/ui`. Özelleştirme prop/variant ile, kopyala-yapıştır ile değil.
- Prop drilling 2 seviyeyi aşarsa composition/context.

---

## 6. UI Standartları

- Kaynak: **DESIGN_SYSTEM.md**. Ham renk/boyut/gölge **yasak**; hep semantic token (`bg-background`, `text-primary`, `rounded-lg`, `shadow-sm`).
- 4px spacing skalası dışına çıkılmaz. Container ve section boşluğu token'dan.
- Her interaktif element 5 durum: default/hover/active/focus-visible/disabled.
- Tipografi ölçeği sabit; keyfi `text-[13px]` yok.
- İkon: lucide, tutarlı boyut (16/20/24) ve `stroke-width`.
- Görsel dil tema ile tutarlı; yeni bir stil eklemeden önce token/varyant düşün.

## 7. UX Standartları

- Her async durum tasarlanır: **loading (skeleton) / empty / error / success**. Boş "flash" yok.
- Formlar: anlık inline validasyon (Zod), net hata mesajı, submit'te disable + spinner, başarı geri bildirimi (toast).
- Hata mesajları insani ve çözüm önerili; teknik jargon yok.
- Geri bildirim < 100ms (hover/press), aksiyon sonucu < 1s görünür.
- Navigasyon öngörülebilir; aktif sayfa işaretli; kırık link yok. 404 yardımcı.
- Dokunma hedefi ≥ 44×44px; tıklanabilir alan yeterli.
- İçerik hiyerarşisi net; en önemli aksiyon (CTA) görsel olarak baskın.
- Kullanıcı işini min. adımda tamamlar; gereksiz modal/interstitial yok.

## 8. Responsive Standartları

- **Mobile-first**; temel stil mobil, `sm/md/lg/xl/2xl` ile katmanla (breakpoint'ler DESIGN_SYSTEM §5).
- Her sayfa 320px'den 1536px+'ya kesintisiz çalışır; yatay scroll **yok**.
- Layout değişimleri breakpoint'te (grid kolon, nav→drawer). İçerik hiçbir kırılımda taşmaz/kesilmez.
- Görsel `srcset`/`sizes` ile cihaza uygun. Font/boşluk `clamp` ile akışkan.
- Test: gerçek breakpoint'lerde ve 44px dokunma hedefiyle doğrulanır.

---

## 9. Accessibility (a11y) Kuralları — WCAG 2.2 AA

- **Semantik HTML**: doğru element (`button`, `a`, `nav`, `main`, `header`, `footer`, `h1–h6` hiyerarşisi). `div`-buton yasak.
- Her sayfada tek `h1`; başlık sırası atlanmaz.
- **Klavye**: tüm etkileşim klavyeyle erişilir; mantıklı tab sırası; **focus-visible** her zaman görünür (`outline:none` tek başına yasak). "Skip to content" linki.
- **ARIA** yalnız gerektiğinde; native yeterliyse ARIA eklenmez. Radix/shadcn primitibleri a11y sağlar.
- **Kontrast** AA: normal ≥ 4.5:1, büyük ≥ 3:1, UI/ikon ≥ 3:1.
- **Görsel**: anlamlı `alt`, dekoratif `alt=""`. İkon-buton `aria-label`.
- **Form**: her input `<label>` bağlı; hata `aria-describedby` + `aria-invalid`.
- **Hareket**: `prefers-reduced-motion` desteklenir (animasyon kapanır/azalır).
- **Dil**: `<html lang>` aktif dile göre; RTL için `dir="rtl"` (Arapça).
- **Dinamik**: canlı bölgeler (`aria-live`) toast/hata için. Modal focus-trap + `Esc`.
- CI'da `eslint-plugin-jsx-a11y`; ayrıca axe ile spot kontrol.

---

## 10. Animation Kuralları

- Kaynak: DESIGN_SYSTEM §8. Süre/easing token'dan; keyfi değer yok.
- **Amaçlı hareket**: yönlendirir/geri bildirir; dekoratif abartı yok. Süre çoğunlukla 120–320ms.
- Yalnız `transform` + `opacity` animasyonu (GPU); `width/height/top/left` animasyonu **yasak**.
- `transition-all` yasak; hedef property belirtilir.
- Scroll-reveal `whileInView` + `once:true`. `prefers-reduced-motion` **zorunlu** karşılanır.
- Sonsuz/otomatik hareket (marquee) durdurulabilir ve reduced-motion'da durur.

---

## 11. Performance Hedefleri

**Lighthouse (mobil, production): Performance ≥ 95, A11y ≥ 95, Best Practices ≥ 95, SEO 100.**

Core Web Vitals (saha hedefi):
- **LCP < 2.0s** · **INP < 200ms** · **CLS < 0.1** · TTFB < 0.8s · TBT < 200ms.

Uygulama kuralları:
- İlk JS bundle (gzip) hedef **< 180KB**; route-level code-splitting zorunlu.
- Tree-shakeable import (lucide named, motion selektif). Bundle analizi (`rollup-plugin-visualizer`) düzenli.
- Görsel/font DESIGN_SYSTEM §9–10 stratejisi. LCP görseli preload+priority.
- Ağır 3rd-party (analytics) idle/consent sonrası, `defer`. Ana thread bloklanmaz.
- Gereksiz re-render önlenir (stabil prop, `memo` gerekçeliyken, selector'lı Zustand).
- CLS: görsel/embed için boyut rezerve; font swap metrik-uyumlu fallback.

---

## 12. SEO Kuralları

- **Meta yönetimi** merkezi (`react-helmet-async` veya eşdeğeri): her sayfa benzersiz `title` (≤ 60 karakter) + `meta description` (≤ 155). Şablon: `%s | TercümExpert`.
- **Canonical** her sayfada; `VITE_APP_URL` tabanlı (domain değişince otomatik doğru).
- **hreflang**: 8 dilin her biri için alternatif + `x-default`. URL dil-prefix'li (`/tr/…`, `/en/…`).
- **Open Graph + Twitter Card**: `og:title/description/image/type/locale`, `twitter:card=summary_large_image`. Varsayılan OG görseli 1200×630.
- **Yapısal veri (JSON-LD)**: `Organization`, `WebSite`, hizmetler için `Service`, SSS için `FAQPage`, breadcrumb `BreadcrumbList`.
- **`sitemap.xml`** (tüm sayfa × dil) + **`robots.txt`** (+ sitemap referansı) `public/`'te. Build'de üretim opsiyonu.
- **Semantik başlık hiyerarşisi** (a11y ile ortak). Anlamlı iç linkleme.
- **SPA indekslenmesi**: modern Google JS render eder; kritik meta doğru. Gerekirse ileride prerender/statik snapshot değerlendirilir (mimari buna açık).
- Search Console doğrulaması env ile (`VITE_GSC_VERIFICATION`) `index.html`'e enjekte.
- Performans SEO'nun parçası (§11 hedefleri).

---

## 13. Referans Uyarlama & İçerik Ayrıştırma Kuralları

Referans site (Emergent AI ile yapılmış) tasarım şablonu olarak alınır; **ancak** aşağıdakiler zorunludur:

1. **Marka bağımsızlaştırma:** Emergent/AI'a ait hiçbir iz taşınmaz. Özellikle **footer'daki "Made with Emergent" / Emergent branding tamamen kaldırılır**; footer kendi markamız (TercümExpert) ile sıfırdan kurulur.
2. **İçerik tekrarı düzeltilir (temadan uzaklaşmadan):** Referansta içerikleri **aynı** olan sayfalar mantıklı biçimde ayrıştırılır. Tasarım dili/tema korunur; yalnız içerik ve amaç farklılaşır:
   - **Anasayfa (Home):** Özet + dönüşüm odaklı. Hero, öne çıkan hizmetler (kısa), sosyal kanıt (referans/rakam), güven unsurları, tek net CTA (teklif al/iletişim). Derin detay **yok**, hizmetler sayfasına yönlendirir.
   - **Hizmetler (Services):** Derin ve kategorize. Her hizmet tipi (yeminli/noter, teknik, hukuki, tıbbi, akademik, web/yazılım lokalizasyonu, sözlü/simültane, altyazı vb.) ayrı kart/bölüm; süreç, dil çiftleri, kullanım alanları. Anasayfadaki özetin **detaylı** hali.
   - **Hakkımızda (About):** Footer "Hızlı Bağlantılar"daki Hakkımızda da aynı içeriği taşıyor → **kendine özgü** içerik yazılır: biz kimiz, misyon/ideal, vizyon, değerler, neden biz, (ops.) ekip/kilometre taşları. Taslak: `CONTENT_ABOUT_DRAFT.md` (revize edilecek).
3. **İçerik benzersizliği** aynı zamanda SEO gereğidir (duplicate content cezasından kaçınma). Her sayfa benzersiz `title`/`description` + gövde.
4. **Footer/nav "Hızlı Bağlantılar"** gerçek, ayrışmış sayfalara işaret eder; ölü/tekrar link olmaz.

> Bu kurallar tasarım aşamasında (landing page inşası) uygulanır; şu an foundation aşamasında **kayıt altına** alınmıştır.

---

## 14. Bağımlılık (npm) Politikası

- **Her paket gerekçelidir.** Yeni bağımlılık eklemeden önce: (a) mevcut stack çözüyor mu? (b) bakımlı/popüler mi? (c) bundle maliyeti? (d) tree-shakeable mi?
- Duplicate işlevli paket **yasak** (ör. iki tarih kütüphanesi).
- Sürümler kilitli (`package-lock.json` commit'lenir). Majör güncelleme ayrı PR + test.
- `nvm`/`.nvmrc` ile Node sürümü sabit.

---

## 15. Git & Commit Standartları

**Conventional Commits** (commitlint zorunlu): `type(scope): kısa açıklama`

Tipler: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`, `revert`.
Örnek: `feat(quote-request): add zod validation to form`, `fix(header): correct RTL logo alignment`.

- Kısa açıklama **imperative**, ≤ 72 karakter, sonda nokta yok, küçük harf başlar.
- Gövde (opsiyonel) "neden"i anlatır; breaking change `BREAKING CHANGE:` footer'ı.
- **Branch**: `main` (prod, korumalı), `develop` (opsiyonel), özellik `feat/…`, düzeltme `fix/…`, `chore/…`.
- **PR**: küçük ve odaklı; açıklama + ekran görüntüsü (UI). CI (`typecheck→lint→test→build`) geçmeden merge yok. En az 1 review (ekip büyüyünce).
- `main`'e doğrudan push yok; her değişiklik PR ile. Vercel her PR'a preview üretir.
- Sık, anlamlı commit; "wip"/"asdf" mesajı yok. Sırlar (env değeri) commit'lenmez.

---

## 16. Dosya Organizasyonu

- Feature-Sliced + Clean Architecture (detay: ARCHITECTURE.md §2–4). Katmanlar: `app / pages / widgets / features / entities / shared`.
- Path alias **`@/`** = `src/` (Vite + tsconfig `paths`). Derin göreli (`../../../`) yasak.
- Her dilim: `ui/ model/ api/ lib/ index.ts` (gerektiği kadar). Public API `index.ts`.
- Ortak/çapraz ihtiyaç `shared`'a; iş nesnesi `entities`'e taşınır — feature'a gömülmez.
- Test dosyası kaynağın yanında (`Component.test.tsx`).
- Doküman kökte: `PROJECT_RULES.md`, `ARCHITECTURE.md`, `DESIGN_SYSTEM.md`, `README.md`.

---

## 17. Definition of Done (Bitti Sayılma Kriteri)

Bir iş "bitti" sayılır ancak şunların **hepsi** doğruysa:

1. `pnpm/npm typecheck` temiz (0 hata, `any` yok).
2. `lint` temiz (a11y dahil), Prettier uygulanmış.
3. Testler geçiyor (yeni mantık için test eklenmiş).
4. Responsive (mobil→geniş) ve gerekli dillerde (RTL dahil) doğrulanmış.
5. A11y kontrolü (klavye + focus + kontrast) yapılmış.
6. Loading/empty/error durumları var.
7. Ham değer/hard-coded metin yok (token + i18n kullanılmış).
8. Bağımlılık eklendiyse §14 gerekçesi yazılmış.
9. Conventional commit + geçen CI. Vercel preview'da görsel doğrulanmış.

---

## 18. Doküman Yönetimi

Bu dosya ve `ARCHITECTURE.md` / `DESIGN_SYSTEM.md` **yaşayan dokümanlardır**. Önemli karar değişince güncellenir (sürüm + tarih). Kod ile doküman çelişirse doküman güncellenir ya da kod düzeltilir — **ikisi ayrışmaz**.

# TercümExpert — Design System (DESIGN_SYSTEM.md)

> Bu doküman görsel dilin **tek kaynağıdır**: renk, tipografi, spacing, breakpoint, shadow, radius, animation, görsel ve font stratejisi.
> Tüm değerler **design token** olarak tanımlanır. Componentler asla ham değer (`#2563eb`, `16px`) kullanmaz; **semantic token** kullanır.

**Sürüm:** 1.0 · **Durum:** Foundation — değerler profesyonel varsayılan; **referans siteye göre kalibre edilecek** (renk/font).
**Kalibrasyon notu:** Referans site (`expert-tercume-1.preview.emergentagent.com`) client-side render olduğundan token'lar otomatik çıkarılamadı. Tasarım aşamasında ekran görüntüsü/tarayıcı ile birebir eşlenecek. Değişiklik **tek dosyada** (`tokens.css` + `tailwind.config.ts`) yapılır, hiçbir component değişmez.

---

## 1. Token Mimarisi: 3 Katman

```
PRIMITIVE  (ham skala)        →  --blue-600: #2563eb ;  --space-4: 1rem
   ↓ referans verir
SEMANTIC   (anlamsal rol)     →  --color-primary: var(--blue-600) ; --color-bg: var(--white)
   ↓ kullanılır
COMPONENT  (opsiyonel, yerel) →  --btn-primary-bg: var(--color-primary)
```

- **Componentler yalnızca SEMANTIC katmanı kullanır.** Böylece tema (light/dark) veya marka değişimi tek yerden yapılır.
- Primitive katman "renk paleti"dir, doğrudan UI'da kullanılmaz.
- Tailwind, semantic token'lara `theme.extend` ile bağlanır → `bg-background`, `text-foreground`, `text-primary` gibi utility'ler tokenlardan beslenir.

**Uygulama:** Tüm token'lar CSS custom properties olarak `src/app/styles/tokens.css`'te; light değerler `:root`, dark değerler `.dark` altında (bkz. §12 Dark Mode).

---

## 2. Renk Sistemi

### 2.1 Primitive Palet (ham skala — 50→950)

> Çeviri/lokalizasyon markası için: güven veren **derin mavi (primary)**, uluslararası hissi veren **teal accent**, nötr **slate** gri ölçeği. (Referans gelince hue değerleri güncellenecek; skala yapısı sabit kalır.)

```
Brand / Primary (Blue)
--blue-50:#eff6ff  100:#dbeafe  200:#bfdbfe  300:#93c5fd  400:#60a5fa
--blue-500:#3b82f6 600:#2563eb  700:#1d4ed8  800:#1e40af  900:#1e3a8a  950:#172554

Accent (Teal)
--teal-50:#f0fdfa  100:#ccfbf1  200:#99f6e4  300:#5eead4  400:#2dd4bf
--teal-500:#14b8a6 600:#0d9488  700:#0f766e  800:#115e59  900:#134e4a

Neutral (Slate)
--slate-50:#f8fafc 100:#f1f5f9 200:#e2e8f0 300:#cbd5e1 400:#94a3b8
--slate-500:#64748b 600:#475569 700:#334155 800:#1e293b 900:#0f172a 950:#020617

Semantic status
--green-500:#22c55e  --amber-500:#f59e0b  --red-500:#ef4444  --sky-500:#0ea5e9
White #ffffff  ·  Black #000000
```

### 2.2 Semantic Tokens (rollere bağlı — component'ler bunları kullanır)

| Token | Light değer | Kullanım |
|---|---|---|
| `--color-background` | `--white` | Sayfa zemini |
| `--color-foreground` | `--slate-900` | Ana metin |
| `--color-muted` | `--slate-100` | İkincil zemin (kartlar, band) |
| `--color-muted-foreground` | `--slate-500` | İkincil/soluk metin |
| `--color-card` | `--white` | Kart zemini |
| `--color-card-foreground` | `--slate-900` | Kart metni |
| `--color-border` | `--slate-200` | Çerçeve/ayraç |
| `--color-input` | `--slate-200` | Form input çerçevesi |
| `--color-ring` | `--blue-600` | Focus halkası |
| `--color-primary` | `--blue-600` | Ana marka / CTA |
| `--color-primary-foreground` | `--white` | Primary üstü metin |
| `--color-primary-hover` | `--blue-700` | Primary hover |
| `--color-accent` | `--teal-600` | Vurgu/ikincil aksiyon |
| `--color-accent-foreground` | `--white` | Accent üstü metin |
| `--color-success` | `--green-500` | Başarı |
| `--color-warning` | `--amber-500` | Uyarı |
| `--color-destructive` | `--red-500` | Hata/silme |
| `--color-info` | `--sky-500` | Bilgi |

> **Kontrast kuralı:** Her metin/zemin çifti WCAG **AA** (normal metin ≥ 4.5:1, büyük metin ≥ 3:1) sağlamalı. Yeni renk eklenince kontrast kontrolü zorunlu (bkz. PROJECT_RULES a11y).
> **Kural:** `bg-white`, `text-black`, `#hex` gibi ham değerler **yasak**; hep `bg-background`, `text-foreground`, `text-primary`.

---

## 3. Tipografi Sistemi

### 3.1 Font Aileleri (token)

```
--font-sans:    'Inter', ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif
--font-display: 'Inter', ...            /* başlıklar; referansa göre değişebilir (örn. 'Sora','Poppins') */
--font-mono:    ui-monospace, 'SF Mono', 'JetBrains Mono', monospace
```

- **Inter** varsayılan (nötr, kurumsal, çoklu-dil/Latin+Kiril+Yunan desteği geniş). Arapça için ayrı fallback: `'Noto Sans Arabic'`.
- Referans site farklı font kullanıyorsa yalnızca bu iki token güncellenir.

### 3.2 Type Scale (modüler, oran ≈ 1.25 major third)

| Token | rem / px | Kullanım | line-height | tracking |
|---|---|---|---|---|
| `text-xs` | 0.75 / 12 | etiket, caption | 1rem | 0 |
| `text-sm` | 0.875 / 14 | yardımcı metin | 1.25rem | 0 |
| `text-base` | 1 / 16 | gövde (varsayılan) | 1.5rem | 0 |
| `text-lg` | 1.125 / 18 | büyük gövde | 1.75rem | 0 |
| `text-xl` | 1.25 / 20 | alt başlık | 1.75rem | -0.01em |
| `text-2xl` | 1.5 / 24 | H4 | 2rem | -0.01em |
| `text-3xl` | 1.875 / 30 | H3 | 2.25rem | -0.02em |
| `text-4xl` | 2.25 / 36 | H2 | 2.5rem | -0.02em |
| `text-5xl` | 3 / 48 | H1 | 1.1 | -0.02em |
| `text-6xl` | 3.75 / 60 | Hero display | 1.05 | -0.03em |
| `text-7xl` | 4.5 / 72 | büyük hero (opsiyonel) | 1 | -0.03em |

### 3.3 Font Weight

```
--fw-normal:400  --fw-medium:500  --fw-semibold:600  --fw-bold:700
```
Başlıklar: 600–700. Gövde: 400. Vurgu: 500–600. **Ekstra-light/black kullanılmaz** (subset küçük kalsın).

### 3.4 Tipografi Kuralları

- Satır uzunluğu (measure): gövde metni **60–75ch** (`max-w-prose`).
- Başlıklarda `text-balance`, uzun paragraflarda `text-pretty`.
- Fluid boyut opsiyonu: hero başlıkları için `clamp()` (örn. `clamp(2.25rem, 5vw, 3.75rem)`).
- **Responsive tipografi** tek yerde: heading component'i breakpoint'e göre scale seçer, sayfa içinde elle `md:text-*` serpiştirilmez.

---

## 4. Spacing Sistemi

**4px tabanlı** ölçek (Tailwind varsayılanıyla hizalı). Tüm padding/margin/gap bu skaladan; ara değer yasak.

```
0=0  px=1px  0.5=2  1=4  1.5=6  2=8  2.5=10  3=12  3.5=14  4=16
5=20  6=24  7=28  8=32  9=36  10=40  11=44  12=48  14=56  16=64
20=80  24=96  28=112  32=128  40=160  48=192  56=224  64=256   (px)
```

### Anlamsal spacing (component/section)

| Token | Değer | Kullanım |
|---|---|---|
| `--space-section-y` | `clamp(4rem, 8vw, 8rem)` | Section dikey boşluk (dikey ritim) |
| `--space-container-x` | `clamp(1rem, 5vw, 2rem)` | Container yatay padding |
| `--space-stack` | 1.5rem (24) | Dikey element aralığı (varsayılan) |
| `--space-inline` | 0.75rem (12) | Yatay element aralığı |

- **Container:** `max-w-screen-xl` (1280px) + otomatik yatay padding token'ı; içerik genişliği tek `Container` component'iyle yönetilir.
- 8px ritmi: dikey boşluklar 8'in katı tercih edilir; ince ayar için 4'lük adımlar.

---

## 5. Responsive Breakpoint Sistemi

**Mobile-first.** Küçük ekran temeldir; büyük ekranlar `min-width` ile eklenir.

| Ad | min-width | Cihaz |
|---|---|---|
| `xs` (özel) | 375px | Küçük telefon |
| `sm` | 640px | Büyük telefon |
| `md` | 768px | Tablet dikey |
| `lg` | 1024px | Tablet yatay / küçük laptop |
| `xl` | 1280px | Masaüstü (container max) |
| `2xl` | 1536px | Geniş masaüstü |

Kurallar: temel stiller mobil; `sm: md: lg:` ile katmanla. `max-*` variant nadiren. Layout değişimleri (grid kolon sayısı, nav→drawer) breakpoint'lerde. Dokunma hedefi min **44×44px**.

---

## 6. Border Radius Sistemi

Tek `--radius` temel değeri + türevler → yuvarlaklık tek yerden ölçeklenir.

```
--radius: 0.75rem            /* 12px — temel */
--radius-sm:  calc(var(--radius) - 4px)   /* 8  — badge, input */
--radius-md:  calc(var(--radius) - 2px)   /* 10 */
--radius-lg:  var(--radius)               /* 12 — kart, buton */
--radius-xl:  calc(var(--radius) + 4px)   /* 16 — büyük kart */
--radius-2xl: calc(var(--radius) + 12px)  /* 24 — modal, hero kart */
--radius-full: 9999px                     /* pill, avatar */
```
Kural: input/badge `sm`, buton/kart `lg`, modal `2xl`, avatar/pill `full`.

---

## 7. Shadow Sistemi

Nötr, düşük-satürasyon gölge; renkli değil (slate tabanlı, hafif mavi tint). Elevation seviyeleri:

```
--shadow-xs:  0 1px 2px 0 rgb(15 23 42 / 0.05)
--shadow-sm:  0 1px 3px 0 rgb(15 23 42 / 0.08), 0 1px 2px -1px rgb(15 23 42 / 0.06)
--shadow-md:  0 4px 6px -1px rgb(15 23 42 / 0.08), 0 2px 4px -2px rgb(15 23 42 / 0.06)
--shadow-lg:  0 10px 15px -3px rgb(15 23 42 / 0.10), 0 4px 6px -4px rgb(15 23 42 / 0.05)
--shadow-xl:  0 20px 25px -5px rgb(15 23 42 / 0.10), 0 8px 10px -6px rgb(15 23 42 / 0.05)
--shadow-2xl: 0 25px 50px -12px rgb(15 23 42 / 0.20)
--shadow-focus: 0 0 0 3px rgb(37 99 235 / 0.35)   /* focus-visible halkası */
```

Elevation eşlemesi: kart hafif `sm`, hover `md`, dropdown/popover `lg`, modal `xl`/`2xl`. Dark mode'da gölge yerine **border + hafif üst-parıltı** (dark'ta gölge zayıf görünür) — token seti dark için ayrı.

---

## 8. Animation Sistemi

Amaç: anlamlı, hızlı, **abartısız** hareket. Süre + easing token'ları:

```
Duration
--dur-fast:120ms  --dur-base:200ms  --dur-slow:320ms  --dur-slower:500ms

Easing
--ease-standard: cubic-bezier(0.2, 0, 0, 1)     /* giriş+çıkış, genel */
--ease-out:      cubic-bezier(0, 0, 0.2, 1)      /* girişte */
--ease-in:       cubic-bezier(0.4, 0, 1, 1)      /* çıkışta */
--ease-spring:   cubic-bezier(0.34, 1.56, 0.64, 1) /* hafif yaylı, vurgu */
```

### 8.1 Standart Animasyon Presetleri (Framer Motion `motion`)

- **fade-in-up:** opacity 0→1, y 12px→0, `dur-base`, `ease-out` (section giriş).
- **fade-in:** opacity 0→1.
- **scale-in:** scale 0.96→1 + fade (modal/popover).
- **stagger:** liste/grid çocukları 60–80ms arayla.
- **marquee:** partner logoları sonsuz kayan (CSS keyframe, `prefers-reduced-motion`'da durur).

### 8.2 Kurallar

- Scroll-reveal `whileInView` + `viewport={{ once: true }}` (tekrar tetiklenmez).
- **`prefers-reduced-motion`**: `useReducedMotion` ile tüm hareket kapatılır/azaltılır (sadece opacity kalır). **Zorunlu.**
- Hover/tap: transform (`scale`, `translate`) ve `opacity` üzerinden — layout tetikleyen (width/height/top) animasyon **yasak** (jank).
- Transition sadece gerekli property'ye (`transition-colors`, `transition-transform`), `transition-all` **yasak**.
- Süre disiplini: mikro-etkileşim `fast`, genel `base`, büyük giriş `slow`. 500ms üstü nadiren.

---

## 9. Görsel (Image) Optimizasyon Stratejisi

- **Format:** AVIF birincil, WebP fallback, JP/PNG son çare. SVG ikon/illüstrasyon için.
- **Responsive:** `srcset` + `sizes`; her breakpoint için doğru çözünürlük. 1x/2x DPR varyantları.
- **Lazy load:** ekran-dışı görseller `loading="lazy"`; LCP görseli `loading="eager"` + `fetchpriority="high"` + `preload`.
- **CLS önleme:** her `<img>` `width`/`height` (veya `aspect-ratio`) ile — rezerve alan.
- **Boyut bütçesi:** hero < 200KB, içerik görselleri < 120KB (AVIF ile). Build'de sıkıştırma.
- **Dekoratif görsel** `alt=""`; anlamlı görsel açıklayıcı `alt`.
- Statikler `public/images` içinde versiyonlanmış; import edilenler `shared/assets` (build-hash'li).
- İleride CDN/`@vercel/image` veya harici image servisi eklenebilir — `shared/ui/Image` wrapper'ı bu geçişi soyutlar.

---

## 10. Font Stratejisi

- **Self-host** (Fontsource ile `@fontsource-variable/inter`) — Google Fonts'a runtime bağımlılık yok, gizlilik + performans.
- **Variable font** (tek dosya, tüm ağırlıklar) → istek sayısı düşük.
- `font-display: swap` — FOIT yerine FOUT; metin hemen görünür.
- **Preload** kritik font (gövde weight 400/600); `<link rel="preload" as="font" crossorigin>`.
- **Subset:** Latin + Latin-ext (TR/DE/FR/ES/IT/NL). Arapça için `@fontsource-variable/noto-sans-arabic` ayrı subset, yalnız `ar` aktifken yüklenir.
- Fallback zinciri metrik-uyumlu (`system-ui`) → layout shift minimal.
- Toplam font ağırlık bütçesi < 120KB (woff2, subset'li).

---

## 11. Tailwind Config Önerisi (referans)

> `tailwind.config.ts`. Semantic token'lara CSS variable üzerinden bağlanır; `darkMode: 'class'` (dark hazır, kapalı).

```ts
import type { Config } from 'tailwindcss'

export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    container: { center: true, padding: 'var(--space-container-x)', screens: { '2xl': '1280px' } },
    extend: {
      screens: { xs: '375px' },
      colors: {
        background: 'var(--color-background)',
        foreground: 'var(--color-foreground)',
        muted: { DEFAULT: 'var(--color-muted)', foreground: 'var(--color-muted-foreground)' },
        card: { DEFAULT: 'var(--color-card)', foreground: 'var(--color-card-foreground)' },
        border: 'var(--color-border)',
        input: 'var(--color-input)',
        ring: 'var(--color-ring)',
        primary: { DEFAULT: 'var(--color-primary)', foreground: 'var(--color-primary-foreground)', hover: 'var(--color-primary-hover)' },
        accent: { DEFAULT: 'var(--color-accent)', foreground: 'var(--color-accent-foreground)' },
        success: 'var(--color-success)', warning: 'var(--color-warning)',
        destructive: 'var(--color-destructive)', info: 'var(--color-info)',
      },
      fontFamily: {
        sans: 'var(--font-sans)', display: 'var(--font-display)', mono: 'var(--font-mono)',
      },
      borderRadius: { sm: 'var(--radius-sm)', md: 'var(--radius-md)', lg: 'var(--radius-lg)', xl: 'var(--radius-xl)', '2xl': 'var(--radius-2xl)' },
      boxShadow: {
        xs: 'var(--shadow-xs)', sm: 'var(--shadow-sm)', md: 'var(--shadow-md)',
        lg: 'var(--shadow-lg)', xl: 'var(--shadow-xl)', '2xl': 'var(--shadow-2xl)',
      },
      transitionTimingFunction: {
        standard: 'var(--ease-standard)', spring: 'var(--ease-spring)',
      },
      transitionDuration: { fast: '120ms', base: '200ms', slow: '320ms' },
      keyframes: {
        'fade-in-up': { from: { opacity: '0', transform: 'translateY(12px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        marquee: { from: { transform: 'translateX(0)' }, to: { transform: 'translateX(-50%)' } },
      },
      animation: {
        'fade-in-up': 'fade-in-up var(--dur-base) var(--ease-out) both',
        marquee: 'marquee 30s linear infinite',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
} satisfies Config
```

---

## 12. Dark Mode Token Stratejisi (Hazır, Kapalı)

`tokens.css` yapısı:

```css
:root {
  /* PRIMITIVE (değişmez ham palet) */
  --white:#fff; --slate-900:#0f172a; --blue-600:#2563eb; /* ... */

  /* SEMANTIC — LIGHT (aktif) */
  --color-background: var(--white);
  --color-foreground: var(--slate-900);
  --color-primary: var(--blue-600);
  /* ... */
}

.dark {
  /* SEMANTIC — DARK (hazır, .dark sınıfı bugün eklenmiyor) */
  --color-background: var(--slate-950);
  --color-foreground: var(--slate-50);
  --color-card: var(--slate-900);
  --color-border: var(--slate-800);
  --color-primary: var(--blue-500);
  /* ... */
}
```

- Bugün `<html>`'e `.dark` **hiç eklenmez** → görünüm hep light.
- Açmak için: `VITE_FEATURE_DARK_MODE=true` + `ThemeProvider`'ın `.dark` sınıfını toggle etmesi. **Component kodu değişmez** çünkü hepsi semantic token kullanır.
- Dark değerler ayrı tanımlı olduğundan, açıldığında kontrast/gölge otomatik doğru gelir.

---

## 13. Component Görsel Standartları (özet)

- Her interaktif element: `default`, `hover`, `active`, `focus-visible`, `disabled` **beş durumu** da tasarlanır.
- Focus her zaman görünür (`--shadow-focus` / `ring`), asla `outline:none` tek başına.
- Kartlar: `bg-card`, `border-border`, `rounded-lg`, `shadow-sm`, hover `shadow-md` + hafif `-translate-y-0.5`.
- Butonlar: intent (`primary`/`accent`/`ghost`/`outline`/`destructive`) × size (`sm`/`md`/`lg`) matrisi `cva` ile.
- Tutarlılık: aynı rol → aynı token. Yeni "özel" değer eklemeden önce token'a ekle.

# PROJECT_PLAN.md — TercümExpert Uygulama Planı

**Sürüm:** 1.0 · **Tarih:** 2026-07-20 · **Kaynak:** Kullanıcı şartnamesi (35 bölüm)

> Bu dosya, şartnamenin uygulamaya dönüştürülme planıdır. Referans dokümanlar: `PROJECT_RULES.md`, `ARCHITECTURE.md`, `DESIGN_SYSTEM.md`, `CONTENT_MODEL.md`, `ROUTES.md`, `ENVIRONMENT.md`, `PROJECT_CHECKLIST.md`.

---

## A. Denetim Sonucu (Mevcut Durumdan Ne Değişti)

Önceki foundation iskeleti Feature-Sliced (`widgets/entities/shared`) yapısındaydı ve şartnameyle çelişiyordu. Şu kararlar alındı:

- **Yapı değişti:** Şartname §4'teki feature-based yapı benimsendi (`components/`, `features/`, `content/`, `services/`, `store/`, `hooks/`, `lib/`, `utils/`).
- **Diller güncellendi:** `nl` (Felemenkçe) çıkarıldı, **`ru` (Rusça)** eklendi. Nihai set: `tr, en, fr, de, es, ar, ru, it` (§10).
- **Hakkımızda kaldırıldı:** Ayrı About sayfası/route yok. Yerine **Kurumsal** (§14). Önceki `CONTENT_ABOUT_DRAFT.md` geçersiz kabul edildi.
- **Bağımlılıklar sadeleşti (§3 "gereksiz paket yükleme"):**
  - `axios` **çıkarıldı** → native `fetch` tabanlı http client.
  - `i18next` + `react-i18next` **çıkarıldı** → hafif, tip-güvenli **custom i18n** (content/ sözlükleri + fallback).
  - `zustand` **çıkarıldı** → küçük global state için React Context (consent, chat, mobile-nav).
  - `pnpm` paket yöneticisi olarak ayarlandı.
- **Emoji ikonları yasaklandı** → yalnız Lucide/SVG (§7, §32).

## B. Uygulama Sırası (Stage'ler)

| Stage | İçerik | Durum |
|---|---|---|
| 1 | Dokümanlar (bu dosya + zorunlu 6 + checklist) | ▶ bu turda |
| 2 | Yapı reset + package/config + design system + types | ▶ bu turda |
| 3 | İçerik/config katmanı + i18n + router + providers | ▶ bu turda |
| 4 | Fiyat hesaplama mantığı + unit testler | ▶ bu turda |
| 5 | Global layout: Header + Footer (gerçek responsive) | sonraki |
| 6 | Türkçe sayfalar: Anasayfa, Hizmetler, Kurumsal, İş Ortaklığı, SSS, İletişim, Blog, Legal, 404 | sonraki |
| 7 | Formlar (RHF+Zod) + dosya yükleme (mock) | sonraki |
| 8 | Cookie consent + AI chatbot frontend (provider + mock) | sonraki |
| 9 | Mock service katmanı + SEO/schema + analytics (consent-aware) | sonraki |
| 10 | Component/E2E testler + build/lint temizliği + performans | sonraki |

## C. Teknik Kararlar

- **Routing:** `/` → `/tr` (canonical). Her locale prefix'li. Route eşleştirme **merkezi** `src/app/router/routes.ts` (routeId → locale slug). RTL: `ar`.
- **i18n:** `content/{locale}/*.ts` sözlükleri; `useI18n()` hook; **eksik çeviri fallback** → locale eksikse TR/EN'e düşer, dev'de uyarı.
- **State:** sunucu = TanStack Query; global UI = Context; form = RHF.
- **Doğrulama durumu:** tüm iddialı veriler `VerificationStatus` ile işaretli; `unverified` olanlar üretimde ham iddia gibi gösterilmez.
- **Servis soyutlaması:** her servis `interface` + `MockAdapter` + `FutureApiAdapter`. Mock modda "sunucuya gönderildi" yalanı yok; görünür demo bildirimi.
- **Güvenlik:** secret yok (VITE_ public), file allowlist, honeypot, CSP/headers `vercel.json`.
- **Görsel dil:** stok/AI foto yok; tipografi + grid + ince çizgi + SVG desen (§27).

## D. Kullanıcıdan Doğrulanması Gereken Kritik Bilgiler (asla uydurulmayacak — §34)

Şirket unvanı, MERSİS/vergi no, adres, telefon, e-posta, kesin fiyatlar, sertifikalar (ISO vb.), istatistikler (15.000+ iş, %98 memnuniyet, 500+ kurumsal), partner komisyon hukuki şartları, ödeme sağlayıcısı, AI API sağlayıcısı, hukuki metinlerin avukat onayı. Hepsi `src/content/*/site-info` + `PROJECT_CHECKLIST.md` içinde `unverified`/`requires-legal-review` olarak yönetilir.

## E. Bu Ortamın Kısıtı (Şeffaflık)

Bu bulut sandbox'ında paket registry'si engelli (npm/pnpm 403). Bu nedenle `pnpm install`, `build`, `test`, `lint`, `lighthouse` **burada çalıştırılamıyor**. Tüm kod bunları geçecek şekilde yazılıyor; doğrulama kullanıcı makinesinde yapılacak. "Test geçti" ifadesi ancak gerçekten çalıştırıldığında kullanılacak.

# CONTENT_MODEL.md — TercümExpert

İçerik ve veri, JSX'e gömülmez; merkezi ve yönetilebilir katmanlarda tutulur (§4).

## 1. Çeviri İçeriği (i18n)

- **Kaynak:** `src/content/tr/index.ts` — Türkçe TAM içerik; `Dictionary` tipinin kaynağıdır (`typeof tr`).
- **Diğer diller:** `src/content/{en,fr,de,es,ar,ru,it}/index.ts` — `PartialDictionary` (kısmi). EN/FR base, diğerleri placeholder.
- **Birleştirme:** `getDictionary(locale)` → fallback zinciri **TR ← EN ← istenen dil** (derin merge). Eksik anahtar **asla** görünmez; placeholder diller EN'e düşer → yarım/makine çevirisi izlenimi olmaz.
- **Erişim:** `useI18n().dict.home.hero.title` — tam tip-güvenli, string-path magic yok.
- **Formatlayıcılar:** `useI18n().formatCurrency/formatNumber/formatDate` (Intl, locale-aware).

## 2. Yapısal Veri / Config (çeviriden ayrık)

| Dosya | İçerik |
|---|---|
| `app/config/locales.ts` | Diller (kod, dir, ogLocale, contentStatus) |
| `app/config/navigation.ts` | Ana menü route id'leri |
| `app/config/services.ts` | Hizmet kataloğu (id, ikon, sıra) |
| `app/config/statistics.ts` | İstatistikler + doğrulama durumu |
| `app/config/pricing.config.ts` | Fiyat parametreleri, diller, belge türleri, upload allowlist |
| `app/config/partnership.ts` | Komisyon/örnek kazanç parametreleri |
| `app/config/site.config.ts` | Şirket bilgisi (Verifiable), sosyal, WhatsApp |

## 3. Doğrulama Durumu (Verification)

`src/types/verification.ts`:

```ts
type VerificationStatus = 'verified' | 'unverified' | 'draft' | 'requires-legal-review'
```

- İddialı/hassas veriler `Verifiable<T>` ile sarılır.
- `unverified`/`requires-legal-review` değerler üretimde **ham iddia gibi gösterilmez**
  (ör. istatistikler `statDisplay()` ile "Doğrulanacak" gösterir).
- Eksikler `PROJECT_CHECKLIST.md`'de takip edilir.

## 4. İçerik Ekleme Rehberi

- **Yeni metin:** önce `content/tr` içine ekle (tip büyür), sonra çevirileri ilgili dile ekle.
- **Yeni hizmet:** `config/services.ts` + `content/tr serviceItems` + pricing `serviceBasePrice`.
- **Yeni istatistik/iddia:** `config/statistics.ts` içinde `status` ile; doğrulanınca `verified` yap.
- **Blog:** ileride `features/blog` veri modeli/CMS; şu an sahte yazı üretilmez.

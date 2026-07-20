# PROJECT_CHECKLIST.md — Yayın Öncesi Doğrulama

> Şartname §28, §34. Aşağıdaki bilgiler **UYDURULMADI** ve doğrulanana kadar üretimde
> ham iddia olarak gösterilmiyor. Yayından önce her madde işaretlenmelidir.

## A. Şirket / İletişim Bilgileri (`src/app/config/site.config.ts`)

- [ ] Resmî şirket unvanı — `requires-legal-review`
- [ ] MERSİS no — `requires-legal-review`
- [ ] Vergi dairesi / no — `requires-legal-review`
- [ ] Açık adres — `unverified` (doğrulanmadan harita embed edilmez)
- [ ] Telefon — `unverified`
- [ ] Kurumsal e-posta — `unverified`
- [ ] Çalışma saatleri — `unverified`
- [ ] `VITE_WHATSAPP_NUMBER` gerçek numara

## B. İstatistikler / İddialar (`src/app/config/statistics.ts`)

- [ ] 15.000+ tamamlanan iş — `unverified`
- [ ] 500+ kurumsal müşteri — `unverified`
- [ ] %98 müşteri memnuniyeti — `unverified`
- [ ] 50+ dil desteği — `unverified`
- [ ] Kurumsal: %30 toplu indirim, 30 gün vade — `unverified`
- [ ] ISO 27001 / resmî sertifikalar — **eklenmedi** (doğrulanmadan eklenmez)
- Doğrulanınca ilgili kaydın `status`'ünü `verified` yapın.

## C. Fiyatlandırma (`src/app/config/pricing.config.ts`)

- [ ] Tüm fiyat parametreleri (base, perWordRate/kademeler, çarpanlar, ücretler) işletmece onaylanmalı
- [ ] KDV oranı ve gösterimi teyit edilmeli
- [ ] Kelime ücreti modeli (sabit → kademeli) nihai karar

## D. Hukuki (`src/content/tr` → legal.*)

- [ ] KVKK, Gizlilik, Mesafeli Satış, Çerez metinleri **avukat** tarafından incelenmeli
- [ ] Veri sorumlusu, cayma hakkı istisnaları, iade/iptal koşulları netleştirilmeli
- Not: Metinler taslaktır; `draftNotice` gösterilir.

## E. İş Ortaklığı (`src/app/config/partnership.ts`)

- [ ] Komisyon oranı/periyodu hukuki onay + partner sözleşmesi
- [ ] Partner sözleşmesi belgesi (şu an "taslak — yakında"; sahte linke gitmez)

## F. Entegrasyonlar

- [ ] Analytics ID'leri (GA/GTM/Clarity/Pixel/GSC) — consent'e bağlı
- [ ] Backend seçimi (Supabase/Node/Laravel) + servis `live` adapter'ları
- [ ] AI chatbot gerçek sağlayıcı (serverless proxy; API key frontend'e KONULMAZ)
- [ ] Ödeme sağlayıcısı

## G. Teknik Kalite (kullanıcı makinesinde çalıştırılmalı — bu sandbox'ta registry kapalı)

- [ ] `pnpm install` → `pnpm typecheck` (0 hata)
- [ ] `pnpm lint` (a11y dahil)
- [ ] `pnpm test` (birim testler geçmeli)
- [ ] `pnpm build` başarılı
- [ ] Lighthouse (mobil) Perf 90+ / A11y 95+ / BP 95+ / SEO 95+
- [ ] Belirtilen viewport'larda yatay taşma/kesik yok (§26)

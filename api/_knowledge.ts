/**
 * TercümExpert AI asistanı — ÖZEL BİLGİ TABANI (birlikte eğitilen kısım).
 *
 * Bot, kullanıcıya cevap verirken önce buradaki bilgileri ve SSS verisini kullanır.
 * BOTU EĞİTMEK İÇİN: CUSTOM_QA dizisine yeni { q, a } çiftleri ekleyin. Köşeli
 * parantezli [...] alanlar doldurulmalıdır. Bot, burada ve SSS'de olmayan bir şey
 * sorulursa UYDURMAZ; kullanıcıyı WhatsApp üzerinden temsilciye yönlendirir.
 */

/** Botun her zaman bildiği temel kurumsal gerçekler ve dürüstlük kuralları. */
export const COMPANY_FACTS = `
MARKA: TercümExpert — profesyonel çeviri hizmetleri. Site ve hizmetler 14 dilde sunulur
(Türkçe, İngilizce, Almanca, Fransızca, İspanyolca, İtalyanca, Felemenkçe, Rusça,
Azerice, Lehçe, Bulgarca, Portekizce, Danca, Arapça).

HİZMETLER: standart çeviri, yeminli tercüme, noter onaylı tercüme, apostil süreci ve
kurumsal çözümler.

FİYATLANDIRMA: fiyat; belgenin kelime sayısı, dil çifti, hizmet türü (yeminli, noter
onaylı, apostil) ve teslim süresine göre hesaplanır. Kullanıcı anlık tahmini fiyatı
"Fiyat Hesapla" sayfasından belgesini yükleyerek veya bilgileri girerek alabilir.

SİPARİŞ: üyelikle veya üyeliksiz (misafir) sipariş verilebilir; e-posta doğrulama kodu
kullanılır. Belgeler "Fiyat Hesapla" sayfasındaki güvenli yükleme alanından iletilir.

TESLİMAT: dijital teslimat hesap veya e-posta üzerinden; fiziki/ıslak imzalı veya
yeminli belgelerde kargo ile bildirilen adrese yapılır. Tahmini süreler sipariş
sırasında gösterilir.

İLETİŞİM BİLGİLERİ: E-posta: info@tercumexpert.com. Telefon: +90 555 123 45 67
(şimdilik demo). WhatsApp: +90 555 123 45 67 (şimdilik demo). Kullanıcı iletişim
bilgilerimizi sorduğunda bu bilgileri açıkça paylaş; sohbet penceresinde bu bilgiler
tıklanabilir hâlde de sunulur.

İNSAN DESTEĞİ: karmaşık veya kişiye özel konularda kullanıcıyı e-posta, telefon veya
WhatsApp ile bir müşteri temsilcisine yönlendir. Kullanıcı BİZİM kendisine ulaşmamızı
isterse (ör. "beni arayın", "siz ulaşın"), sohbet penceresindeki "İletişim bilgilerimi
bırak" butonunu kullanmasını söyle; adı ve iletişim bilgisiyle ekibimiz kendisine ulaşır.

DÜRÜSTLÜK KURALLARI (bot bunlara KESİNLİKLE uymalı):
- Bir belgenin herhangi bir kuruma kesin kabul edileceği GARANTİSİ verme.
- Doğrulanmamış ISO/sertifika/kalite belgesi iddiasında BULUNMA.
- 7/24 kesintisiz insan desteği VAAT ETME.
- Yeminli / noter onaylı / apostil ayrımını doğru koru; bunları birbirine karıştırma.
- Hukuki veya resmî kesinlik gerektiren konularda, ilgili kurumdan teyit alınmasını öner.
- Bilmediğin bir şeyi uydurma; WhatsApp'a yönlendir.

GİZLİLİK: kullanıcıdan sohbet üzerinden hassas kişisel veri (kimlik no, şifre vb.) veya
belge İSTEME. Belgeler yalnızca güvenli yükleme alanından iletilmelidir.
`.trim()

export interface QA {
  q: string
  a: string
}

/**
 * ÖZEL SORU-CEVAPLAR — botun ek eğitim kısmı. Buraya serbestçe ekleyin/düzenleyin.
 * (Köşeli parantezli alanları gerçek bilgilerle doldurun.)
 */
export const CUSTOM_QA: QA[] = [
  {
    q: `Çalışma saatleriniz nedir? Size ne zaman ulaşabilirim?`,
    a: `Çalışma saatlerimiz Türkiye saatiyle hafta içi 09.00–18.00 arasıdır. Ayrıca acil işler için mesai dışında da hizmet sunuyoruz. Bize her zaman WhatsApp üzerinden mesaj bırakabilirsiniz; en kısa sürede dönüş yapılır.`,
  },
  {
    q: `Hangi ödeme yöntemlerini kabul ediyorsunuz? Taksit var mı?`,
    a: `Ödemeler kartla peşin veya taksitli olarak alınabilir. Havale/EFT ile ödemek isterseniz WhatsApp destek hattımızdan bize ulaşabilirsiniz.`,
  },
  {
    q: `Fatura kesiyor musunuz?`,
    a: `Evet, siparişleriniz için fatura düzenliyoruz (hem bireysel hem kurumsal).`,
  },
  {
    q: `Acil / aynı gün çeviri yapıyor musunuz? Ek ücreti var mı?`,
    a: `Evet, acil çeviri hizmetimiz vardır. Ancak teslim süresi çevrilecek dosyanın hacmine göre değişir; aynı gün içinde tamamlanacağı garanti edilmez. Acil çeviri için tahmini teslim süresini "Fiyat Hesapla" (fiyat alma) sayfasında görebilirsiniz. Acil hizmet için ek ücret uygulanır.`,
  },
  {
    q: `Fiziki teslimat / kargo yapıyor musunuz? Yurt dışına gönderim var mı?`,
    a: `Noter onaylı ve yeminli tercümelerde fiziki teslimat / kargo yapıyoruz. Kargo ücreti ve süresi gibi ayrıntıları sipariş verme ekranında görebilirsiniz. Yurt dışına da gönderim yapabiliyoruz.`,
  },
  {
    q: `Kurumsal veya toplu işler için özel fiyat / indirim var mı?`,
    a: `Evet. Kurumsal sayfamızdaki formu doldurmanız yeterli; 1 iş günü içinde size dönüş sağlayıp ihtiyacınıza özel teklif sunuyoruz.`,
  },
  {
    q: `Hangi dillerde / dil çiftlerinde çeviri yapıyorsunuz?`,
    a: `Çince ve Japonca dahil olmak üzere 50'den fazla dil çifti arasında çeviri yapabiliyoruz.`,
  },
  {
    q: `Yeminli tercüme, noter onayı ve apostil sürecini siz mi hallediyorsunuz?`,
    a: `Evet. Resmî sürecin tamamını (yeminli tercüme, noter onayı ve apostil) baştan sona biz yönetir, hazır evrakları size teslim ederiz. Siz de bu evrakları teslim etmeniz gereken kuruma iletirsiniz.`,
  },
  {
    q: `Çeviriden memnun kalmazsam düzeltme / revize hakkım var mı?`,
    a: `Evet, revize hakkınız vardır. Kaynak metinde bir değişiklik yapılmadığı sürece, çeviriyle ilgili düzeltme talepleriniz ücretsiz olarak karşılanır.`,
  },
  {
    q: `Siparişi iptal edebilir miyim? İade koşulları nedir?`,
    a: `Çevirmen çeviriyi işleme almadan önce iptal ederseniz ödemeniz iade edilir. Çevirmen işe başladıysa, o ana kadar çevrilen miktar kadar bir ücret kesintisi yapılır ve kalan tutar iade edilir.`,
  },
  {
    q: `Belgelerimin gizliliği nasıl korunuyor? Gizlilik sözleşmesi (NDA) imzalıyor musunuz?`,
    a: `Belgeleriniz gizli tutulur ve yalnızca işi yürüten yetkili çevirmen ve personel tarafından, işin gerektirdiği süre boyunca görülür. Talebe bağlı olarak TercümExpert, müşterileriyle bir gizlilik sözleşmesi (NDA) imzalayabilir.`,
  },
  {
    q: `Fiziki ofisiniz var mı? Yüz yüze görüşebilir miyim?`,
    a: `Ana merkezimiz Konya, Türkiye'de bulunmaktadır. Görüşmek veya ayrıntılı bilgi almak için WhatsApp destek hattımızdan bize ulaşabilirsiniz.`,
  },
  {
    q: `Çeviri, sunduğum kurumda kabul edilmezse ne oluyor?`,
    a: `Böyle bir durumda size en doğru şekilde yardımcı olabilmemiz için lütfen WhatsApp destek hattımızdan veya info@tercumexpert.com adresinden bizimle iletişime geçin; durumu birlikte değerlendirip gerekli desteği sağlayalım.`,
  },
]

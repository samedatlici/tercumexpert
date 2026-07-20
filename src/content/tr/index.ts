/**
 * TÜRKÇE — tam içerik (Şartname §10: TR tam içerik). Bu sözlük, `Dictionary`
 * tipinin KAYNAĞIDIR (typeof); diğer diller bunun DeepPartial'ıdır ve fallback'le
 * tamamlanır. Metinler JSX'e gömülmez; buradan yönetilir (§4).
 */
export const tr = {
  common: {
    brand: 'TercümExpert',
    tagline: 'Profesyonel çeviri hizmetlerinde güvenilir çözüm ortağınız.',
    nav: {
      home: 'Anasayfa',
      services: 'Hizmetler',
      quote: 'Fiyat Hesapla',
      corporate: 'Kurumsal',
      partnership: 'İş Ortaklığı',
      blog: 'Blog',
      faq: 'S.S.S.',
      contact: 'İletişim',
    },
    actions: {
      getQuote: 'Hemen Teklif Al',
      calculatePrice: 'Fiyat Hesapla',
      uploadDocument: 'Belge Yükle',
      whatsapp: "WhatsApp'tan Yaz",
      learnMore: 'Detaylı Bilgi',
      viewAll: 'Tümünü Gör',
      showMore: 'Daha Fazla Göster',
      showLess: 'Daha Az Göster',
      send: 'Gönder',
      apply: 'Başvur',
      order: 'Sipariş Ver',
      contactUs: 'İletişime Geçin',
      openMenu: 'Menüyü aç',
      closeMenu: 'Menüyü kapat',
      selectLanguage: 'Dil seçin',
      skipToContent: 'İçeriğe geç',
    },
    states: {
      loading: 'Yükleniyor…',
      error: 'Bir sorun oluştu. Lütfen tekrar deneyin.',
      required: 'Bu alan zorunludur.',
      demoNotice: 'Demo: Form verileri henüz sunucuya gönderilmemektedir.',
      unverified: 'Doğrulanacak',
    },
    topbar: {
      phoneLabel: 'Telefon',
      emailLabel: 'E-posta',
      hoursLabel: 'Çalışma Saatleri',
      afterHours: 'Mesai dışı acil çeviri desteği mevcuttur.',
    },
  },

  home: {
    seo: {
      title: 'TercümExpert — Profesyonel Çeviri Hizmetleri',
      description:
        'Yeminli tercüme, noter onayı ve kurumsal çeviri çözümleri. Belgenizi yükleyin, anında ön fiyat teklifini alın, profesyonel teslimat alın.',
    },
    hero: {
      title: 'Çeviri Hizmetlerinde Güvenilir Çözüm Ortağınız',
      subtitle: 'Belgenizi yükleyin, fiyatı görün, profesyonel teslimat alın.',
      support: 'Yeminli tercüme • Noter onayı • Kurumsal çözümler',
    },
    trust: {
      title: 'Neden bize güveniyorlar?',
      items: [
        { key: 'languages', label: '50+ dil desteği' },
        { key: 'delivery', label: '24 saat teslimat seçeneği' },
        { key: 'notary', label: 'Noter onayı' },
        { key: 'quality', label: 'Çift katmanlı kalite kontrolü' },
      ],
    },
    stats: {
      title: 'Rakamlarla TercümExpert',
      note: 'Aşağıdaki değerler doğrulanana kadar kesin iddia olarak sunulmaz.',
    },
    howItWorks: {
      title: 'Nasıl çalışır?',
      subtitle: 'Beş adımda profesyonel çeviri.',
      steps: [
        { key: 'upload', title: 'Yükle', desc: 'Belgeni güvenle yükle.' },
        { key: 'select', title: 'Seç', desc: 'Dil ve hizmet türünü seç.' },
        { key: 'confirm', title: 'Onayla', desc: 'Siparişi onayla.' },
        { key: 'track', title: 'Takip Et', desc: 'Süreci anlık takip et.' },
        { key: 'receive', title: 'Teslim Al', desc: 'Profesyonel teslimatını al.' },
      ],
    },
    services: {
      title: 'Hizmetlerimiz',
      subtitle: 'Her belge türü için uzman çeviri.',
    },
    why: {
      title: 'Neden TercümExpert?',
      features: [
        { key: 'autoQuote', title: 'Otomatik fiyat hesaplama', desc: 'Saniyeler içinde ön fiyat.' },
        { key: 'whatsapp', title: 'WhatsApp hızlı teklif', desc: 'Tek dokunuşla iletişim.' },
        { key: 'terminology', title: 'Terminoloji yönetimi', desc: 'Tutarlı, kurumsal dil.' },
        { key: 'revision', title: 'Revize hakkı', desc: 'Memnuniyet odaklı süreç.' },
        { key: 'languages', title: '50+ dil desteği', desc: 'Geniş dil çifti kapsamı.' },
        { key: 'terms', title: 'Kurumsal vade sistemi', desc: 'Şirketlere esnek ödeme.' },
      ],
    },
    corporateCta: {
      title: 'Kurumsal çeviri ihtiyaçlarınız için özel çözümler',
      desc: 'Özel terminoloji yönetimi, vade seçenekleri, toplu sipariş avantajı ve size atanmış hesap yöneticisi.',
      action: 'Kurumsal Çözümleri İncele',
    },
    finalCta: {
      title: 'Belgeniz hazırsa, fiyatı hemen görün',
      desc: 'Ön fiyat teklifi ücretsizdir ve sizi bağlamaz.',
    },
  },

  services: {
    seo: {
      title: 'Çeviri Hizmetleri',
      description:
        'Yeminli, noter onaylı, hukuki, teknik, medikal ve akademik çeviri ile web/mobil lokalizasyon. Belge türleri, süreç, teslim ve dil çiftleri.',
    },
    hero: {
      title: 'Çeviri Hizmetleri',
      subtitle: 'Uzmanlık alanına göre, doğru terminolojiyle çeviri.',
    },
    process: {
      title: 'Süreç nasıl işler?',
      steps: [
        { title: 'Belge incelemesi', desc: 'Belge türü ve amaç değerlendirilir.' },
        { title: 'Uzman eşleştirme', desc: 'Alanın uzmanı çevirmene atanır.' },
        { title: 'Çeviri & editör', desc: 'Çeviri ve bağımsız son okuma.' },
        { title: 'Onay & teslim', desc: 'Gerekliyse noter/apostil, sonra teslim.' },
      ],
    },
    delivery: {
      title: 'Teslim seçenekleri',
      items: ['Dijital teslimat (PDF/DOCX)', 'Fiziksel belge teslimatı', 'Acil teslimat'],
    },
    notaryApostille: {
      title: 'Noter ve apostil ilişkisi',
      desc: 'Yeminli çeviri, gerektiğinde noter onayı ve apostil süreciyle resmî kurumlarda geçerli hâle getirilir. Kesin gereklilik, belgenin sunulacağı kuruma göre değişir.',
    },
    languagePairs: {
      title: 'Sık kullanılan dil çiftleri',
      note: 'Türkçe ⇄ İngilizce, Almanca, Fransızca, Arapça, Rusça, İspanyolca, İtalyanca ve daha fazlası.',
    },
    cta: {
      title: 'Hangi hizmete ihtiyacınız olduğundan emin değil misiniz?',
      desc: 'Belgenizi yükleyin, size en uygun hizmeti ve fiyatı gösterelim.',
    },
    documentTypesTitle: 'Uygun belge türleri',
  },

  /** Hizmet kalemleri — id'ler config/services ile eşleşir. */
  serviceItems: {
    sworn: {
      name: 'Yeminli Tercüme',
      short: 'Yeminli çevirmen imzası ve kaşesiyle resmî geçerli çeviri.',
      benefits: ['Resmî kurumlarda geçerli', 'Yeminli çevirmen onayı', 'Hızlı süreç'],
    },
    notarized: {
      name: 'Noter Onaylı Tercüme',
      short: 'Yeminli çevirinin noter tarafından onaylanması.',
      benefits: ['Noter tasdiki', 'Resmî başvurulara uygun', 'Süreç yönetimi bizde'],
    },
    apostille: {
      name: 'Apostil Süreci Desteği',
      short: 'Yurt dışında geçerlilik için apostil sürecinde rehberlik.',
      benefits: ['Uluslararası geçerlilik', 'Süreç danışmanlığı', 'Kurum yönlendirmesi'],
    },
    legal: {
      name: 'Hukuki Çeviri',
      short: 'Sözleşme, mahkeme ve resmî belgelerde terminolojiye hâkim çeviri.',
      benefits: ['Hukuk terminolojisi', 'Gizlilik güvencesi', 'Uzman çevirmen'],
    },
    technical: {
      name: 'Teknik Çeviri',
      short: 'Kılavuz, şartname ve teknik dokümanlarda tutarlı çeviri.',
      benefits: ['Terminoloji yönetimi', 'Format korunur', 'Sektör uzmanlığı'],
    },
    medical: {
      name: 'Medikal Çeviri',
      short: 'Rapor, prospektüs ve tıbbi belgelerde hassas çeviri.',
      benefits: ['Tıbbi terminoloji', 'Doğruluk odaklı', 'Gizlilik'],
    },
    academic: {
      name: 'Akademik Çeviri',
      short: 'Tez, makale ve diploma çevirilerinde akademik dil.',
      benefits: ['Akademik üslup', 'Kaynak tutarlılığı', 'Zamanında teslim'],
    },
    localization: {
      name: 'Web ve Mobil Lokalizasyon',
      short: 'Web sitesi ve uygulamaların kültüre uygun yerelleştirilmesi.',
      benefits: ['Kültürel uyum', 'Teknik entegrasyon', 'SEO uyumu'],
    },
  },

  corporate: {
    seo: {
      title: 'Kurumsal Çözümler',
      description:
        'Şirketlere özel terminoloji yönetimi, vade seçenekleri, toplu sipariş ve hesap yöneticisi ile profesyonel dil hizmetleri.',
    },
    hero: {
      title: 'Kurumsal Çözümler',
      subtitle:
        'Şirketinize özel terminoloji yönetimi, vade seçenekleri ve özel hesap yöneticisi ile profesyonel dil hizmetleri.',
      primaryCta: 'Kurumsal Teklif İste',
      secondaryCta: 'E-posta Gönder',
    },
    features: {
      title: 'Kurumsal hizmet modeli',
      items: [
        {
          key: 'custom',
          title: 'Özelleştirilmiş Hizmet',
          points: ['Sabit terminoloji', 'Marka dil tonunu koruma', 'Özel hesap yöneticisi', 'Stil kılavuzu oluşturma'],
        },
        {
          key: 'volume',
          title: 'Toplu İşlem ve Vade',
          points: ['Aylık çeviri planları', 'Toplu sipariş indirimleri', '30 güne kadar vade', 'Fatura sistemi'],
        },
        {
          key: 'security',
          title: 'Gizlilik ve Güvenlik',
          points: ['NDA protokolü', 'Şifreli dosya transferi', 'KVKK uyumlu süreçler'],
        },
      ],
    },
    whyPackage: {
      title: 'Neden Kurumsal Paket?',
      items: [
        'Sabit terminoloji yönetimi',
        'Özel hesap yöneticisi',
        'Gizlilik ve güvenlik',
        'Toplu sipariş yönetimi',
        'Raporlama',
        'Öncelikli destek',
      ],
    },
    payment: {
      title: 'Ödeme seçenekleri',
      options: [
        {
          key: 'standard',
          title: 'Anlık Ödeme / Standart',
          points: ['Her sipariş sonrası kredi kartı veya havale', 'Kredi kartı taksit seçeneği', 'Sipariş bazlı işlem'],
        },
        {
          key: 'term',
          title: 'Aylık Vade / 15–30 Gün',
          points: ['Aylık toplu faturalama', 'Kurumsal vade', 'Toplu indirim', 'Aylık rapor'],
        },
        {
          key: 'subscription',
          title: 'Abonelik / Özel Plan',
          points: ['Sabit aylık çeviri hacmi', 'İndirim', 'Öncelikli işlem', 'Özel hesap yöneticisi'],
        },
      ],
    },
    form: {
      title: 'Kurumsal başvuru',
      desc: 'Formu doldurun, ekibimiz size özel teklifle dönsün.',
      fields: {
        company: 'Şirket adı',
        contactName: 'Yetkili adı soyadı',
        email: 'E-posta',
        phone: 'Telefon',
        need: 'Çeviri ihtiyacı açıklaması',
        consent: 'KVKK Aydınlatma Metni’ni okudum ve onaylıyorum.',
      },
      submit: 'Gönder',
      success: 'Başvurunuz alındı. En kısa sürede dönüş yapacağız.',
    },
  },

  partnership: {
    seo: {
      title: 'İş Ortaklığı Programı',
      description:
        'Yönlendirdiğiniz her müşteriden komisyon kazanın. Şeffaf raporlama, QR kodlu yönlendirme ve profesyonel destek.',
    },
    hero: {
      title: 'İş Ortaklığı Programı',
      value: 'Bize yönlendirdiğiniz her müşteriden %20 komisyon kazanın.',
      subtitle: 'Şeffaf sistem, güvenilir ödemeler, uzun vadeli iş birliği.',
      cta: 'Hemen Başvur',
    },
    advantages: {
      title: 'Partner avantajları',
      items: [
        { key: 'commission', title: '%20 Komisyon', desc: 'Yönlendirme başına komisyon (sözleşmeye tabidir).' },
        { key: 'qr', title: 'QR Kodlu Yönlendirme', desc: 'Kolay ve izlenebilir yönlendirme.' },
        { key: 'reporting', title: 'Şeffaf Raporlama', desc: 'Kazançlarınızı net görün.' },
        { key: 'support', title: 'Profesyonel Destek', desc: 'Size atanmış iletişim.' },
      ],
    },
    howItWorks: {
      title: 'Nasıl çalışır?',
      steps: [
        { title: 'Başvuru Yapın', desc: 'Formu doldurun.' },
        { title: 'Partner Olun', desc: 'Onay sonrası hesabınız açılır.' },
        { title: 'Müşteri Yönlendirin', desc: 'QR / bağlantı ile yönlendirin.' },
        { title: 'Komisyon Kazanın', desc: 'Şeffaf ödeme periyodu.' },
      ],
    },
    sectors: {
      title: 'Hedef sektörler',
      items: [
        'Hukuk Büroları',
        'Vize Danışmanlık',
        'Eğitim Danışmanlık',
        'Sağlık Turizmi',
        'Patent/Marka Ofisleri',
        'Emlak Ofisleri',
        'İK Danışmanlık',
        'Yazılım Şirketleri',
      ],
    },
    commission: {
      title: 'Komisyon yapısı',
      items: ['%20 standart komisyon', '15 günlük ödeme periyodu', '0 TL başlangıç ücreti'],
      note: 'Komisyon oran ve koşulları partner sözleşmesine tabidir.',
      exampleTitle: 'Örnek kazanç',
      exampleOrderLabel: 'Müşteri siparişi',
      exampleRateLabel: 'Komisyon oranı',
      exampleEarningLabel: 'Partner kazancı',
    },
    form: {
      title: 'Partner başvurusu',
      fields: {
        company: 'Şirket/Kurum Adı',
        sector: 'Sektör',
        contactName: 'Yetkili Adı Soyadı',
        titleRole: 'Ünvan',
        email: 'E-posta',
        phone: 'Telefon',
        potential: 'Aylık tahmini yönlendirme potansiyeli',
        note: 'Ek açıklama',
        agreement: 'Partner sözleşmesini okudum ve onaylıyorum.',
      },
      potentialOptions: ['1–5 müşteri', '5–10 müşteri', '10–20 müşteri', '20+ müşteri'],
      agreementLinkLabel: 'Partner sözleşmesi (taslak — yakında)',
      submit: 'Başvuruyu Gönder',
      success: 'Başvurunuz alındı. Sizinle iletişime geçeceğiz.',
    },
  },

  quote: {
    seo: {
      title: 'Anında Fiyat Hesaplama',
      description: 'Belgenizi yükleyin veya detayları girin, anında ön fiyat teklifinizi alın.',
    },
    hero: {
      title: 'Anında Fiyat Hesaplama',
      subtitle: 'Belgeni yükle veya detayları gir, anında ön fiyat teklifini al.',
    },
    fields: {
      upload: 'Belge Yükle (opsiyonel)',
      uploadHint: 'PDF, DOC, DOCX veya TXT — en fazla 10 MB',
      sourceLang: 'Kaynak Dil',
      targetLang: 'Hedef Dil',
      serviceType: 'Hizmet Türü',
      documentType: 'Belge Türü',
      wordCount: 'Tahmini Kelime Sayısı',
      wordCountHint: 'Kaydırıcıyı kullanın veya sayıyı elle girin.',
      options: 'Ek seçenekler',
      calculate: 'Fiyat Hesapla',
    },
    options: {
      urgent: 'Acil Teslimat',
      notarization: 'Noter Onayı',
      physicalDelivery: 'Fiziksel Teslimat',
    },
    result: {
      title: 'Ön Fiyat Teklifi',
      basePrice: 'Temel hizmet bedeli',
      wordPrice: 'Kelime bedeli',
      addons: 'Ek hizmetler',
      total: 'Toplam',
      delivery: 'Tahmini teslim süresi',
      deliveryUnit: 'iş günü',
      disclaimer: 'Bu bir ön fiyat teklifidir; nihai fiyat belge incelemesi sonrası netleşir.',
      order: 'Sipariş Ver',
      whatsapp: "WhatsApp'tan İletişime Geç",
      estimatedWords: 'Tahmini kelime (otomatik — demo)',
    },
  },

  faq: {
    seo: {
      title: 'Sık Sorulan Sorular',
      description: 'Yeminli tercüme, teslim süresi, fiyatlandırma, noter onayı ve kurumsal şartlar hakkında sık sorulan sorular.',
    },
    hero: { title: 'Sık Sorulan Sorular', subtitle: 'Aradığınız cevap burada.' },
    categoriesTitle: 'Kategoriler',
    categories: [
      { key: 'general', label: 'Genel' },
      { key: 'pricing', label: 'Fiyatlandırma' },
      { key: 'delivery', label: 'Teslimat' },
      { key: 'notary', label: 'Noter ve Apostil' },
      { key: 'corporate', label: 'Kurumsal' },
      { key: 'privacy', label: 'Gizlilik' },
      { key: 'upload', label: 'Dosya Yükleme' },
    ],
    items: [
      { key: 'sworn', category: 'general', q: 'Yeminli tercüme nedir ve ne zaman gereklidir?', a: 'Yeminli tercüme, yeminli çevirmenin imza ve kaşesiyle onayladığı çeviridir. Resmî kurum başvurularında sıklıkla istenir; kesin gereklilik belgenin sunulacağı kuruma göre değişir.' },
      { key: 'delivery', category: 'delivery', q: 'Teslimat süresi ne kadar?', a: 'Süre; belge uzunluğu, dil çifti ve seçtiğiniz ek hizmetlere göre değişir. Fiyat hesaplama ekranında tahmini teslim süresi gösterilir.' },
      { key: 'pricing', category: 'pricing', q: 'Fiyatlandırma nasıl yapılıyor?', a: 'Fiyat; hizmet türü, dil çifti, kelime sayısı, belge türü ve ek hizmetlere göre hesaplanır. Ön fiyatı anında görebilirsiniz.' },
      { key: 'notary', category: 'notary', q: 'Noter onayı nasıl yapılıyor?', a: 'Yeminli çeviri, gerektiğinde noter tarafından onaylanır. Süreci sizin adınıza yönetebiliriz.' },
      { key: 'revision', category: 'general', q: 'Revize hakkı var mı?', a: 'Evet. Teslim sonrası, kapsamda kalan düzeltme talepleriniz için revize hakkı sunulur.' },
      { key: 'corporate', category: 'corporate', q: 'Kurumsal müşteriler için özel şartlar var mı?', a: 'Evet. Toplu sipariş indirimi, vade seçenekleri, terminoloji yönetimi ve özel hesap yöneticisi sunulur.' },
    ],
    notFound: {
      title: 'Sorunuzun cevabını bulamadınız mı?',
      contact: 'İletişime Geçin',
      whatsapp: 'WhatsApp Destek',
    },
  },

  contact: {
    seo: {
      title: 'İletişim',
      description: 'TercümExpert ile iletişime geçin: telefon, e-posta, WhatsApp ve iletişim formu.',
    },
    hero: { title: 'İletişim', subtitle: 'Size nasıl yardımcı olabiliriz?' },
    infoTitle: 'İletişim bilgileri',
    labels: {
      phone: 'Telefon',
      email: 'E-posta',
      whatsapp: 'WhatsApp',
      address: 'Adres',
      hours: 'Çalışma saatleri',
    },
    form: {
      title: 'Bize yazın',
      fields: {
        name: 'Ad Soyad',
        email: 'E-posta',
        phone: 'Telefon',
        subject: 'Konu',
        message: 'Mesaj',
        consent: 'KVKK Aydınlatma Metni’ni okudum ve onaylıyorum.',
      },
      submit: 'Mesajı Gönder',
      success: 'Mesajınız alındı. En kısa sürede dönüş yapacağız.',
    },
  },

  blog: {
    seo: { title: 'Blog', description: 'Çeviri, noter, apostil ve lokalizasyon üzerine rehber içerikler.' },
    hero: { title: 'Blog', subtitle: 'Çeviri dünyasından rehberler.' },
    searchPlaceholder: 'Yazılarda ara…',
    readingTime: 'dk okuma',
    relatedTitle: 'İlgili yazılar',
    allCategories: 'Tümü',
    empty: 'Bu kritere uygun yazı bulunamadı.',
  },

  legal: {
    lastUpdatedLabel: 'Son güncelleme',
    draftNotice:
      'Bu metin taslaktır ve yayın öncesi bir hukuk uzmanı tarafından incelenmelidir. Şirket bilgileri henüz doğrulanmamıştır.',
    kvkk: {
      seo: { title: 'KVKK Aydınlatma Metni', description: 'Kişisel verilerin korunmasına ilişkin aydınlatma metni.' },
      title: 'KVKK Aydınlatma Metni',
      sections: [
        { heading: 'Veri Sorumlusu', body: 'Veri sorumlusu ve iletişim bilgileri yayın öncesi eklenecektir.' },
        { heading: 'İşlenen Kişisel Veriler', body: 'İletişim ve sipariş süreçlerinde ad, iletişim bilgileri ve belge verileri işlenebilir.' },
        { heading: 'İşleme Amaçları', body: 'Hizmet sunumu, teklif, iletişim ve yasal yükümlülükler.' },
        { heading: 'Hukuki Sebepler', body: 'Sözleşmenin ifası, açık rıza ve meşru menfaat.' },
        { heading: 'Saklama Süreleri', body: 'İlgili mevzuatta öngörülen süreler boyunca saklanır.' },
        { heading: 'Aktarım', body: 'Yalnızca hizmetin gerektirdiği ölçüde ve mevzuata uygun olarak aktarılır.' },
        { heading: 'Haklarınız', body: 'KVKK madde 11 kapsamındaki haklarınızı kullanabilirsiniz.' },
        { heading: 'Başvuru Yöntemi', body: 'Başvurularınızı belirtilen iletişim kanallarından iletebilirsiniz.' },
      ],
    },
    privacy: {
      seo: { title: 'Gizlilik Politikası', description: 'Kişisel verilerin ve belgelerin gizliliğine ilişkin politika.' },
      title: 'Gizlilik Politikası',
      sections: [
        { heading: 'Toplanan Bilgiler', body: 'İletişim bilgileri ve yüklenen belgeler.' },
        { heading: 'Kullanım', body: 'Yalnızca hizmet sunumu ve iletişim amacıyla kullanılır.' },
        { heading: 'Belge Güvenliği', body: 'Belgeler şifreli aktarım ve gizlilik ilkeleriyle işlenir.' },
        { heading: 'Çerezler', body: 'Ayrıntılar Çerez Politikası’nda yer alır.' },
      ],
    },
    distanceSales: {
      seo: { title: 'Mesafeli Satış Sözleşmesi', description: 'Hizmet satışına ilişkin mesafeli satış sözleşmesi.' },
      title: 'Mesafeli Satış Sözleşmesi',
      sections: [
        { heading: 'Taraflar', body: 'Satıcı ve alıcı bilgileri yayın öncesi eklenecektir.' },
        { heading: 'Hizmet Kapsamı', body: 'Sipariş edilen çeviri/onay hizmetlerinin kapsamı.' },
        { heading: 'Cayma Hakkı ve İstisnalar', body: 'Kişiye/siparişe özel hazırlanan hizmetlerde cayma hakkı istisnaları uygulanabilir.' },
        { heading: 'İade ve İptal', body: 'İade ve iptal koşulları burada düzenlenir.' },
      ],
    },
    cookies: {
      seo: { title: 'Çerez Politikası', description: 'Sitede kullanılan çerez kategorileri ve tercih yönetimi.' },
      title: 'Çerez Politikası',
      sections: [
        { heading: 'Çerez Nedir?', body: 'Çerezler, tarayıcınızda saklanan küçük dosyalardır.' },
        { heading: 'Kategoriler', body: 'Zorunlu, analitik, pazarlama ve tercih çerezleri.' },
        { heading: 'Tercih Yönetimi', body: 'Çerez tercihlerinizi istediğiniz zaman güncelleyebilirsiniz.' },
      ],
    },
  },

  footer: {
    tagline: 'Profesyonel çeviri hizmetlerinde güvenilir çözüm ortağınız.',
    columns: {
      quickLinks: 'Hızlı Bağlantılar',
      services: 'Hizmetler',
      contact: 'İletişim',
    },
    quickLinks: {
      corporate: 'Kurumsal',
      services: 'Hizmetlerimiz',
      quote: 'Fiyat Hesapla',
      blog: 'Blog',
      faq: 'Sık Sorulan Sorular',
      contact: 'İletişim',
    },
    serviceLinks: {
      sworn: 'Yeminli Tercüme',
      notarized: 'Noter Onaylı Tercüme',
      apostille: 'Apostil Süreci',
      corporate: 'Kurumsal Çözümler',
      partnership: 'İş Ortaklığı Programı',
    },
    legal: {
      kvkk: 'KVKK',
      privacy: 'Gizlilik Politikası',
      distanceSales: 'Mesafeli Satış Sözleşmesi',
      cookies: 'Çerez Politikası',
    },
    socialTitle: 'Bizi takip edin',
    rights: 'Tüm hakları saklıdır.',
  },

  cookie: {
    title: 'Çerez tercihleri',
    desc: 'Deneyiminizi iyileştirmek için çerezler kullanıyoruz. Zorunlu çerezler dışındakiler yalnızca onayınızla çalışır.',
    accept: 'Kabul Et',
    reject: 'Reddet',
    manage: 'Tercihleri Yönet',
    save: 'Tercihleri Kaydet',
    categories: {
      necessary: { label: 'Zorunlu', desc: 'Sitenin çalışması için gereklidir; kapatılamaz.' },
      analytics: { label: 'Analitik', desc: 'Kullanımı anlamamıza yardımcı olur.' },
      marketing: { label: 'Pazarlama', desc: 'İlgili içerik ve reklamlar için.' },
      preferences: { label: 'Tercihler', desc: 'Tercihlerinizi hatırlar.' },
    },
  },

  chatbot: {
    title: 'TercümExpert Destek',
    open: 'Sohbeti aç',
    close: 'Sohbeti kapat',
    minimize: 'Küçült',
    clear: 'Konuşmayı temizle',
    inputPlaceholder: 'Mesajınızı yazın…',
    send: 'Gönder',
    typing: 'Yazıyor…',
    welcome:
      "Merhaba, TercümExpert'e hoş geldiniz. Çeviri, fiyatlandırma, noter onayı, apostil veya kurumsal hizmetler hakkında size yardımcı olabilirim.",
    quickQuestions: [
      'Fiyat nasıl hesaplanıyor?',
      'Yeminli tercüme nedir?',
      'Belge yüklemek istiyorum',
      'Kurumsal teklif almak istiyorum',
      'Noter onayı gerekiyor mu?',
      'Bir müşteri temsilcisine bağlan',
    ],
    handoff: 'Müşteri temsilcisine bağlan',
    toWhatsapp: "WhatsApp'a aktar",
    disclaimer: 'Bu bilgi genel bilgilendirmedir; kesin gereklilik için ilgili kurumdan teyit alınız.',
    sensitiveWarning:
      'Lütfen bu sohbet üzerinden hassas kişisel veri paylaşmayın. Belgelerinizi güvenli yükleme alanından iletebilirsiniz.',
  },

  notFound: {
    seo: { title: 'Sayfa bulunamadı', description: 'Aradığınız sayfa bulunamadı.' },
    title: 'Sayfa bulunamadı',
    desc: 'Aradığınız sayfa taşınmış veya hiç var olmamış olabilir.',
    home: 'Anasayfaya dön',
  },
} as const

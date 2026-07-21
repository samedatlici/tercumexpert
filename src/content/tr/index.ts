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
      title: 'Profesyonel Çeviri Hizmetlerinde',
      titleAccent: 'Güvenilir Çözüm Ortağınız',
      subtitle: 'Belgenizi yükleyin, fiyatı görün, profesyonel teslimat alın.',
      support: 'Yeminli tercüme • Noter onayı • Kurumsal çözümler',
    },
    trust: {
      title: 'Neden bize güveniyorlar?',
      items: [
        { key: 'languages', label: '50+ Dil Desteği' },
        { key: 'delivery', label: '24 Saat Teslimat' },
        { key: 'notary', label: 'Noter Onayı' },
        { key: 'quality', label: 'Kalite Güvencesi' },
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
      title: 'Kurumsal Çözümler',
      desc: 'Şirketinize özel terminoloji yönetimi, vade seçenekleri ve özel hesap yöneticisi ile profesyonel dil hizmetleri.',
      action: 'Kurumsal Teklif İste',
    },
    partnershipTeaser: {
      title: 'İş Ortaklığı Programı',
      subtitle: 'Bize yönlendirdiğiniz her müşteriden %20 komisyon kazanın.',
      items: [
        { key: 'commission', title: 'Şeffaf Komisyon', desc: 'Her yönlendirme için %20 komisyon (sözleşmeye tabidir). Anlık takip paneli ile şeffaf kazanç.' },
        { key: 'qr', title: 'QR Kodlu Sistem', desc: 'Kartvizit entegrasyonu ile kolay müşteri takibi. Web ve WhatsApp QR kodları.' },
      ],
      cta: 'Partner Başvurusu Yap',
    },
    testimonials: {
      title: 'Müşteri Değerlendirmeleri',
      subtitle: 'Gerçek müşteri yorumları yayın öncesi buraya eklenecek.',
      placeholderNote: 'Yer tutucu — gerçek yorumlar entegre edilecek.',
      items: [
        { key: 't1', role: 'Hukuk Bürosu' },
        { key: 't2', role: 'Sağlık Kuruluşu' },
        { key: 't3', role: 'Kurumsal Müşteri' },
        { key: 't4', role: 'Bireysel Müşteri' },
      ],
    },
    blogTeaser: {
      title: 'Blog',
      subtitle: 'Çeviri dünyasından güncel içerikler',
      viewAll: 'Tüm Blog Yazılarını Gör',
    },
    finalCta: {
      title: 'Hemen Başlayın',
      desc: 'Belgelerinizi yükleyin, anında fiyat teklifi alın ve profesyonel tercüme hizmetinden yararlanın.',
      primary: 'Hemen Teklif Al',
      secondary: 'İletişime Geçin',
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
    fullService: {
      title: 'Kapınıza Kadar Anahtar Teslim',
      note: 'Belgelerinizi bize iletin; çeviri, noter onayı ve apostil dâhil tüm süreci biz yönetelim. Hazır belgeleriniz kapınıza kadar kargoyla gelsin. Siz işinize odaklanın, gerisini bize bırakın.',
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
      title: 'Kurumsal Özellikler',
      subtitle: 'İşinize özel çözümler',
      items: [
        {
          key: 'custom',
          icon: 'Target',
          title: 'Özelleştirilmiş Hizmet',
          points: ['Sabit terminoloji', 'Marka dil tonunu koruma', 'Özel hesap yöneticisi', 'Stil kılavuzu oluşturma'],
        },
        {
          key: 'volume',
          icon: 'BarChart3',
          title: 'Toplu İşlem ve Vade',
          points: ['Aylık çeviri planları', 'Toplu sipariş indirimleri', '30 güne kadar vade', 'Fatura sistemi'],
        },
        {
          key: 'security',
          icon: 'Lock',
          title: 'Gizlilik ve Güvenlik',
          points: ['NDA protokolü', 'Şifreli dosya transferi', 'KVKK uyumlu süreçler'],
        },
      ],
    },
    whyPackage: {
      title: 'Neden Kurumsal Paket?',
      items: [
        {
          key: 'terminology',
          icon: 'Building2',
          title: 'Sabit Terminoloji Yönetimi',
          desc: 'Şirketinize özel terim bankası oluşturuyoruz. Tüm çevirilerde marka diliniz korunur, tutarlılık sağlarız. Her projede aynı terimlerin kullanılmasına özen gösteririz.',
        },
        {
          key: 'manager',
          icon: 'Users',
          title: 'Özel Hesap Yöneticisi',
          desc: 'Size özel atanan hesap yöneticiniz tüm süreçlerinizi takip eder. Erişilebilir destek hattı ile acil durumlarınızda yanınızdayız.',
        },
        {
          key: 'security',
          icon: 'ShieldCheck',
          title: 'Gizlilik ve Güvenlik',
          desc: 'NDA protokolü ile çalışıyoruz. Güçlü güvenlik altyapısı, şifreli dosya transferi ve KVKK uyumlu süreçler ile verileriniz güvende.',
        },
      ],
    },
    payment: {
      title: 'Ödeme Seçenekleri',
      subtitle: 'İşletmenize uygun esnek ödeme planları',
      recommendedLabel: 'ÖNERİLEN',
      options: [
        {
          key: 'standard',
          label: 'Anlık Ödeme',
          heading: 'Standart',
          desc: 'Her sipariş sonrası kredi kartı veya havale ile ödeme',
          points: ['Kredi kartı taksit', 'Anında teslimat'],
          recommended: false,
        },
        {
          key: 'term',
          label: 'Aylık Vade',
          heading: '15-30 Gün',
          desc: 'Aylık toplu faturalama ve vade seçeneği',
          points: ['30 gün vade', 'Toplu indirim', 'Aylık rapor'],
          recommended: true,
        },
      ],
    },
    form: {
      title: 'Kurumsal Paket Başvurusu',
      desc: 'Formu doldurun, uzman ekibimiz sizinle iletişime geçsin',
      fields: {
        company: 'Şirket Adı',
        contactName: 'Yetkili Adı Soyadı',
        email: 'E-posta',
        phone: 'Telefon',
        need: 'Çeviri ihtiyacınız hakkında bilgi verin',
        consent: 'KVKK Aydınlatma Metni’ni okudum ve onaylıyorum.',
      },
      submit: 'Başvuru Gönder',
      success: 'Başvurunuz alındı. En kısa sürede dönüş yapacağız.',
      note: '1 iş günü içinde size geri dönüş yapacağız.',
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
      title: 'Partner Avantajları',
      subtitle: 'Neden TercümExpert partneri olmalısınız?',
      items: [
        { key: 'commission', icon: 'Wallet', title: '%20 Komisyon Garantisi', desc: 'Her yönlendirdiğiniz müşteriden şeffaf komisyon sistemi.' },
        { key: 'qr', icon: 'QrCode', title: 'QR Kodlu Yönlendirme', desc: 'Kartvizit entegrasyonu ile kolay müşteri takibi.' },
        { key: 'reporting', icon: 'BarChart3', title: 'Şeffaf Raporlama', desc: 'Anlık komisyon ve müşteri takip paneli.' },
        { key: 'support', icon: 'Users', title: 'Profesyonel Destek', desc: 'Özel partner destek hattı ve hesap yöneticisi.' },
      ],
    },
    howItWorks: {
      title: 'Nasıl Çalışır?',
      steps: [
        { title: 'Başvuru Yapın', desc: 'Online başvuru formunu doldurun. Şirket bilgileriniz ve iletişim detaylarınızı paylaşın. 1 iş günü içinde başvurunuz değerlendirilir.' },
        { title: 'Partner Olun', desc: 'Başvurunuz onaylandıktan sonra özel partner panelinize erişim kazanırsınız. QR kodlarınız ve yönlendirme linkleriniz hazır olur.' },
        { title: 'Müşteri Yönlendirin', desc: 'QR kod, özel link veya kartvizit yoluyla müşterilerinizi bize yönlendirin. Her yönlendirme otomatik olarak sisteme kaydedilir.' },
        { title: 'Komisyon Kazanın', desc: 'Yönlendirdiğiniz müşteri her sipariş verdiğinde %20 komisyon kazanırsınız. Her 15 günde bir otomatik ödeme alırsınız.' },
      ],
    },
    sectors: {
      title: 'Hedef Sektörler',
      subtitle: 'Hangi sektörler için ideal?',
      items: [
        { key: 'law', icon: 'Scale', title: 'Hukuk Büroları', desc: 'Dava dosyaları, sözleşmeler ve hukuki belgelerde yeminli tercüme ihtiyacı.' },
        { key: 'visa', icon: 'Plane', title: 'Vize Danışmanlık', desc: 'Pasaport, diploma, nüfus belgesi gibi yeminli tercüme gerektiren evraklar.' },
        { key: 'education', icon: 'GraduationCap', title: 'Eğitim Danışmanlık', desc: 'Öğrenci belgelerinin yeminli tercümesi ve apostil süreçleri.' },
        { key: 'health', icon: 'HeartPulse', title: 'Sağlık Turizmi', desc: 'Tıbbi raporlar, hasta dosyaları ve sağlık belgelerinin çevirisi.' },
        { key: 'patent', icon: 'Building2', title: 'Patent/Marka Ofisleri', desc: 'Patent, marka tescili ve hukuki belgelerin teknik çevirisi.' },
        { key: 'realestate', icon: 'Home', title: 'Emlak Ofisleri', desc: 'Yabancı yatırımcılar için tapu, sözleşme ve resmi evrak çevirisi.' },
        { key: 'hr', icon: 'Briefcase', title: 'İK Danışmanlık', desc: 'Yurtdışı işe yerleştirmede CV, diploma ve referans mektubu çevirisi.' },
        { key: 'software', icon: 'Code', title: 'Yazılım Şirketleri', desc: 'Web ve mobil uygulama lokalizasyonu, teknik doküman çevirisi.' },
      ],
    },
    commission: {
      title: 'Komisyon Yapısı',
      stats: {
        commissionLabel: 'Standart Komisyon',
        commissionSub: 'Her siparişten',
        periodUnit: 'Gün',
        periodLabel: 'Ödeme periyodu',
        feeLabel: 'Başlangıç Ücreti',
        feeSub: 'Tamamen ücretsiz',
      },
      exampleTitle: 'Örnek Kazanç Hesabı',
      exampleOrderLabel: 'Yönlendirdiğiniz müşteri siparişi',
      exampleRateLabel: 'Komisyon oranı',
      exampleEarningLabel: 'Sizin kazancınız',
      note: 'Komisyon oran ve koşulları partner sözleşmesine tabidir.',
    },
    form: {
      title: 'Partner Başvuru Formu',
      subtitle: 'Formu doldurun, 1 iş günü içinde geri dönüş yapalım.',
      fields: {
        company: 'Şirket/Kurum Adı',
        sector: 'Sektör',
        contactName: 'Yetkili Adı Soyadı',
        titleRole: 'Ünvan',
        email: 'E-posta',
        phone: 'Telefon',
        potential: 'Aylık tahmini yönlendirme potansiyeliniz',
        note: 'Eklemek istediğiniz notlar',
        agreement: 'Partner sözleşmesi şartlarını okudum ve kabul ediyorum.',
      },
      sectorPlaceholder: 'Seçiniz',
      sectorOptions: ['Hukuk Bürosu', 'Vize Danışmanlık', 'Eğitim Danışmanlık', 'Sağlık Turizmi', 'Patent/Marka Ofisi', 'Emlak', 'İK Danışmanlık', 'Yazılım', 'Diğer'],
      potentialOptions: ['1-5 müşteri', '5-10 müşteri', '10-20 müşteri', '20+ müşteri'],
      submit: 'Başvuruyu Gönder',
      success: 'Başvurunuz alındı. Sizinle iletişime geçeceğiz.',
      note: 'Başvurunuz 1 iş günü içinde değerlendirilecektir.',
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
    upload: {
      heading: 'Belgelerinizi Yükleyin',
      privacy: 'Verileriniz gizli tutulmaktadır',
      tabFile: 'Dosya Yükle',
      tabText: 'Metin Gir',
      chooseFile: 'Belgenizi Seçin',
      formats: ".docx, .xlsx, .pdf, .pptx, .jpg, .png ve 50'den fazla format kabul edilir · Dosya başına maks. 100MB",
      dropHint: 'Dosyanızı bu alana sürükleyip bırakabilirsiniz.',
      textPlaceholder: 'Metninizi buraya yapıştırın veya yazın…',
      totalWords: 'Toplam kelime sayısı',
      extracting: 'Kelimeler sayılıyor…',
      wordsUnit: 'kelime',
      remove: 'Kaldır',
      unsupported:
        'Bu dosya türünden otomatik kelime sayımı yapılamadı. Lütfen "Metin Gir" ile metni yapıştırın; sayı teklif sırasında ekibimizce doğrulanır.',
      empty:
        'Dosyada seçilebilir metin bulunamadı (taranmış/görsel olabilir). Lütfen "Metin Gir" kullanın veya sayı teklif sırasında doğrulanacaktır.',
      error: 'Dosya okunamadı. Lütfen tekrar deneyin veya "Metin Gir" kullanın.',
      tooLarge: "Dosya 100MB'den büyük olamaz.",
      needInput: 'Fiyat için lütfen bir dosya yükleyin veya metin girin.',
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
    map: {
      title: 'Konumumuz',
      subtitle: 'Bizi haritada bulun',
      placeholder: 'Harita alanı',
      note: 'Konum haritası yakında burada gösterilecek.',
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

import type { PartialDictionary } from '@/types/i18n'

/**
 * ENGLISH — full base translation. English is the fallback base (§10):
 * TR (source) <- EN (base) <- other locales. Keeping EN complete means no
 * Turkish leaks into any other language; untranslated keys fall back to EN.
 * NOTE: FAQ questions/answers (faq.categories / faq.items) are shared Turkish
 * data (content/faq-data.ts) and are intentionally not overridden here — they
 * require a per-locale FAQ dataset, handled as a separate task.
 */
export const en: PartialDictionary = {
  common: {
    tagline: 'Your reliable partner in professional translation services.',
    nav: {
      home: 'Home',
      services: 'Services',
      quote: 'Get a Quote',
      corporate: 'Corporate',
      partnership: 'Partnership',
      blog: 'Blog',
      faq: 'FAQ',
      contact: 'Contact',
    },
    actions: {
      getQuote: 'Get a Quote',
      calculatePrice: 'Calculate Price',
      uploadDocument: 'Upload Document',
      whatsapp: 'Chat on WhatsApp',
      learnMore: 'Learn More',
      viewAll: 'View All',
      showMore: 'Show More',
      showLess: 'Show Less',
      send: 'Send',
      apply: 'Apply',
      order: 'Place Order',
      contactUs: 'Contact Us',
      openMenu: 'Open menu',
      closeMenu: 'Close menu',
      selectLanguage: 'Select language',
      skipToContent: 'Skip to content',
      login: 'Log In',
      logout: 'Log Out',
      account: 'My Account',
    },
    states: {
      loading: 'Loading…',
      error: 'Something went wrong. Please try again.',
      required: 'This field is required.',
      demoNotice: 'Demo: form data is not yet sent to a server.',
      unverified: 'To be verified',
    },
    topbar: {
      phoneLabel: 'Phone',
      emailLabel: 'Email',
      hoursLabel: 'Working Hours',
      afterHours: 'After-hours urgent translation support is available.',
      workingHours: 'Weekdays 09:00 - 18:00 | After-hours service available',
    },
  },

  home: {
    seo: {
      title: 'TercümExpert — Professional Translation Services',
      description:
        'Sworn translation, notarization and corporate translation solutions. Upload your document, get an instant preliminary quote and professional delivery.',
    },
    hero: {
      title: 'Your Reliable Partner in Professional',
      titleAccent: 'Translation Services',
      subtitle: 'Upload your document, see the price, get professional delivery.',
      support: 'Sworn translation • Notarization • Corporate solutions',
    },
    trust: {
      title: 'Why do they trust us?',
      items: [
        { key: 'languages', label: '50+ Languages' },
        { key: 'delivery', label: '24-Hour Delivery' },
        { key: 'notary', label: 'Notary Approval' },
        { key: 'quality', label: 'Quality Assurance' },
      ],
    },
    stats: {
      title: 'TercümExpert in Numbers',
      note: 'The figures below are not presented as definitive claims until verified.',
      labels: {
        satisfaction: 'Customer Satisfaction',
        completed: 'Completed Jobs',
        languages: 'Language Support',
        corporate: 'Corporate Clients',
      },
    },
    howItWorks: {
      title: 'How does it work?',
      subtitle: 'Professional translation in five steps.',
      steps: [
        { key: 'upload', title: 'Upload', desc: 'Upload your document securely.' },
        { key: 'select', title: 'Select', desc: 'Choose the language and service type.' },
        { key: 'confirm', title: 'Confirm', desc: 'Confirm your order.' },
        { key: 'track', title: 'Track', desc: 'Follow the process in real time.' },
        { key: 'receive', title: 'Receive', desc: 'Get your professional delivery.' },
      ],
    },
    services: {
      title: 'Our Services',
      subtitle: 'Expert translation for every document type.',
    },
    why: {
      title: 'Why TercümExpert?',
      subtitle: 'The features that set us apart from the competition',
      features: [
        { key: 'autoQuote', title: 'Automatic price calculation', desc: 'A preliminary price in seconds.' },
        { key: 'whatsapp', title: 'Quick WhatsApp quote', desc: 'One-tap contact.' },
        { key: 'terminology', title: 'Terminology management', desc: 'Consistent, corporate language.' },
        { key: 'revision', title: 'Revision rights', desc: 'A satisfaction-focused process.' },
        { key: 'languages', title: '50+ language support', desc: 'Broad language-pair coverage.' },
        { key: 'terms', title: 'Corporate term system', desc: 'Flexible payment for companies.' },
      ],
    },
    corporateCta: {
      title: 'Corporate Solutions',
      desc: 'Professional language services with terminology management, term options and a dedicated account manager tailored to your company.',
      action: 'Request a Corporate Quote',
    },
    partnershipTeaser: {
      title: 'Partnership Program',
      subtitle: 'Earn 20% commission on every customer you refer to us.',
      items: [
        { key: 'commission', title: 'Transparent Commission', desc: '20% commission for every referral (subject to agreement). Transparent earnings with a real-time tracking panel.' },
        { key: 'qr', title: 'QR Code System', desc: 'Easy customer tracking with business-card integration. Web and WhatsApp QR codes.' },
      ],
      cta: 'Apply as a Partner',
    },
    testimonials: {
      title: 'Customer Reviews',
      subtitle: 'Real customer reviews will be added here before launch.',
      placeholderNote: 'Placeholder — real reviews will be integrated.',
      items: [
        { key: 't1', role: 'Law Firm' },
        { key: 't2', role: 'Healthcare Organization' },
        { key: 't3', role: 'Corporate Client' },
        { key: 't4', role: 'Individual Client' },
      ],
    },
    blogTeaser: {
      title: 'Blog',
      subtitle: 'Current content from the world of translation',
      viewAll: 'View All Blog Posts',
    },
    finalCta: {
      title: 'Get Started Now',
      desc: 'Upload your documents, get an instant quote and benefit from professional translation services.',
      primary: 'Get a Quote',
      secondary: 'Contact Us',
    },
  },

  services: {
    seo: {
      title: 'Translation Services',
      description:
        'Sworn, notarized, legal, technical, medical and academic translation plus web/mobile localization. Document types, process, delivery and language pairs.',
    },
    hero: {
      title: 'Translation Services',
      subtitle: 'Translation with the right terminology for each field of expertise.',
    },
    process: {
      title: 'How does the process work?',
      steps: [
        { title: 'Document review', desc: 'The document type and purpose are assessed.' },
        { title: 'Expert matching', desc: 'A specialist translator in the field is assigned.' },
        { title: 'Translation & editing', desc: 'Translation and an independent final review.' },
        { title: 'Approval & delivery', desc: 'Notary/apostille if required, then delivery.' },
      ],
    },
    delivery: {
      title: 'Delivery options',
      items: ['Digital delivery (PDF/DOCX)', 'Physical document delivery', 'Urgent delivery'],
    },
    notaryApostille: {
      title: 'Notary and apostille relationship',
      desc: 'When required, sworn translation is made valid for official institutions through notary approval and the apostille process. The exact requirement depends on the institution where the document will be submitted.',
    },
    fullService: {
      title: 'Turnkey, Delivered to Your Door',
      note: 'Send us your documents and we will manage the entire process — translation, notary approval and apostille included. Your finished documents arrive at your door by courier. Focus on your work and leave the rest to us.',
    },
    cta: {
      title: 'Not sure which service you need?',
      desc: 'Upload your document and we will show you the most suitable service and price.',
    },
    documentTypesTitle: 'Suitable document types',
  },

  serviceItems: {
    sworn: {
      name: 'Sworn Translation',
      short: 'Officially valid translation with a sworn translator’s signature and stamp.',
      benefits: ['Valid at official institutions', 'Sworn translator approval', 'Fast process'],
    },
    notarized: {
      name: 'Notarized Translation',
      short: 'Notary approval of a sworn translation.',
      benefits: ['Notary certification', 'Suitable for official applications', 'We handle the process'],
    },
    apostille: {
      name: 'Apostille Process Support',
      short: 'Guidance through the apostille process for validity abroad.',
      benefits: ['International validity', 'Process consultancy', 'Institution guidance'],
    },
    legal: {
      name: 'Legal Translation',
      short: 'Translation with command of terminology for contracts, court and official documents.',
      benefits: ['Legal terminology', 'Confidentiality assurance', 'Expert translator'],
    },
    technical: {
      name: 'Technical Translation',
      short: 'Consistent translation for manuals, specifications and technical documents.',
      benefits: ['Terminology management', 'Format preserved', 'Industry expertise'],
    },
    medical: {
      name: 'Medical Translation',
      short: 'Precise translation for reports, package inserts and medical documents.',
      benefits: ['Medical terminology', 'Accuracy-focused', 'Confidentiality'],
    },
    academic: {
      name: 'Academic Translation',
      short: 'Academic language for theses, articles and diploma translations.',
      benefits: ['Academic style', 'Source consistency', 'On-time delivery'],
    },
    localization: {
      name: 'Web and Mobile Localization',
      short: 'Culturally appropriate localization of websites and applications.',
      benefits: ['Cultural adaptation', 'Technical integration', 'SEO compatibility'],
    },
  },

  corporate: {
    statsLabels: {
      corporate: 'Corporate clients',
      discount: 'Bulk order discount',
      term: 'Payment term',
    },
    seo: {
      title: 'Corporate Solutions',
      description:
        'Professional language services for companies with terminology management, term options, bulk orders and a dedicated account manager.',
    },
    hero: {
      title: 'Corporate Solutions',
      subtitle:
        'Professional language services with terminology management, term options and a dedicated account manager tailored to your company.',
      primaryCta: 'Request a Corporate Quote',
      secondaryCta: 'Send Email',
    },
    features: {
      title: 'Corporate Features',
      subtitle: 'Solutions tailored to your business',
      items: [
        {
          key: 'custom',
          icon: 'Target',
          title: 'Customized Service',
          points: ['Fixed terminology', 'Preserving brand tone of voice', 'Dedicated account manager', 'Style guide creation'],
        },
        {
          key: 'volume',
          icon: 'BarChart3',
          title: 'Bulk Processing and Terms',
          points: ['Monthly translation plans', 'Bulk order discounts', 'Terms up to 30 days', 'Invoicing system'],
        },
        {
          key: 'security',
          icon: 'Lock',
          title: 'Privacy and Security',
          points: ['NDA protocol', 'Encrypted file transfer', 'KVKK-compliant processes'],
        },
      ],
    },
    whyPackage: {
      title: 'Why a Corporate Package?',
      items: [
        {
          key: 'terminology',
          icon: 'Building2',
          title: 'Fixed Terminology Management',
          desc: 'We build a term bank specific to your company. Your brand language is preserved across all translations and we ensure consistency. We take care to use the same terms in every project.',
        },
        {
          key: 'manager',
          icon: 'Users',
          title: 'Dedicated Account Manager',
          desc: 'Your dedicated account manager follows all your processes. With an accessible support line, we are by your side in urgent situations.',
        },
        {
          key: 'security',
          icon: 'ShieldCheck',
          title: 'Privacy and Security',
          desc: 'We work under an NDA protocol. Your data is safe with a strong security infrastructure, encrypted file transfer and KVKK-compliant processes.',
        },
      ],
    },
    payment: {
      title: 'Payment Options',
      subtitle: 'Flexible payment plans suited to your business',
      recommendedLabel: 'RECOMMENDED',
      options: [
        {
          key: 'standard',
          label: 'Instant Payment',
          heading: 'Standard',
          desc: 'Payment by credit card or bank transfer after each order',
          points: ['Credit card installments', 'Instant delivery'],
          recommended: false,
        },
        {
          key: 'term',
          label: 'Monthly Term',
          heading: '15-30 Days',
          desc: 'Monthly consolidated invoicing and term option',
          points: ['30-day term', 'Bulk discount', 'Monthly report'],
          recommended: true,
        },
      ],
    },
    form: {
      title: 'Corporate Package Application',
      desc: 'Fill out the form and our expert team will contact you',
      fields: {
        company: 'Company Name',
        contactName: 'Contact Full Name',
        email: 'Email',
        phone: 'Phone',
        need: 'Tell us about your translation needs',
        consent: 'I have read and approve the KVKK Disclosure Statement.',
      },
      submit: 'Submit Application',
      success: 'Your application has been received. We will get back to you as soon as possible.',
      note: 'We will get back to you within 1 business day.',
    },
  },

  partnership: {
    seo: {
      title: 'Partnership Program',
      description:
        'Earn commission on every customer you refer. Transparent reporting, QR-code referrals and professional support.',
    },
    hero: {
      title: 'Partnership Program',
      value: 'Earn 20% commission on every customer you refer to us.',
      subtitle: 'A transparent system, reliable payments, long-term cooperation.',
      cta: 'Apply Now',
    },
    advantages: {
      title: 'Partner Advantages',
      subtitle: 'Why become a TercümExpert partner?',
      items: [
        { key: 'commission', icon: 'Wallet', title: '20% Commission Guarantee', desc: 'A transparent commission system for every customer you refer.' },
        { key: 'qr', icon: 'QrCode', title: 'QR-Code Referral', desc: 'Easy customer tracking with business-card integration.' },
        { key: 'reporting', icon: 'BarChart3', title: 'Transparent Reporting', desc: 'Real-time commission and customer tracking panel.' },
        { key: 'support', icon: 'Users', title: 'Professional Support', desc: 'A dedicated partner support line and account manager.' },
      ],
    },
    howItWorks: {
      title: 'How Does It Work?',
      steps: [
        { title: 'Apply', desc: 'Fill out the online application form. Share your company information and contact details. Your application is reviewed within 1 business day.' },
        { title: 'Become a Partner', desc: 'Once your application is approved, you gain access to your dedicated partner panel. Your QR codes and referral links are ready.' },
        { title: 'Refer Customers', desc: 'Refer your customers to us via QR code, a custom link or business card. Every referral is automatically recorded in the system.' },
        { title: 'Earn Commission', desc: 'You earn 20% commission every time a customer you referred places an order. You receive automatic payments every 15 days.' },
      ],
    },
    sectors: {
      title: 'Target Sectors',
      subtitle: 'Which sectors is it ideal for?',
      items: [
        { key: 'law', icon: 'Scale', title: 'Law Firms', desc: 'Need for sworn translation of case files, contracts and legal documents.' },
        { key: 'visa', icon: 'Plane', title: 'Visa Consultancy', desc: 'Documents requiring sworn translation such as passports, diplomas and civil records.' },
        { key: 'education', icon: 'GraduationCap', title: 'Education Consultancy', desc: 'Sworn translation of student documents and apostille processes.' },
        { key: 'health', icon: 'HeartPulse', title: 'Health Tourism', desc: 'Translation of medical reports, patient files and health documents.' },
        { key: 'patent', icon: 'Building2', title: 'Patent/Trademark Offices', desc: 'Technical translation of patent, trademark registration and legal documents.' },
        { key: 'realestate', icon: 'Home', title: 'Real Estate Offices', desc: 'Title deed, contract and official document translation for foreign investors.' },
        { key: 'hr', icon: 'Briefcase', title: 'HR Consultancy', desc: 'CV, diploma and reference letter translation for overseas placement.' },
        { key: 'software', icon: 'Code', title: 'Software Companies', desc: 'Web and mobile app localization, technical document translation.' },
      ],
    },
    commission: {
      title: 'Commission Structure',
      stats: {
        commissionLabel: 'Standard Commission',
        commissionSub: 'On every order',
        periodUnit: 'Days',
        periodLabel: 'Payment period',
        feeLabel: 'Start-up Fee',
        feeSub: 'Completely free',
      },
      exampleTitle: 'Sample Earnings Calculation',
      exampleOrderLabel: 'Order from the customer you referred',
      exampleRateLabel: 'Commission rate',
      exampleEarningLabel: 'Your earnings',
      note: 'Commission rates and terms are subject to the partner agreement.',
    },
    form: {
      title: 'Partner Application Form',
      subtitle: 'Fill out the form and we will get back to you within 1 business day.',
      fields: {
        company: 'Company/Organization Name',
        sector: 'Sector',
        contactName: 'Contact Full Name',
        titleRole: 'Title',
        email: 'Email',
        phone: 'Phone',
        potential: 'Your estimated monthly referral potential',
        note: 'Any notes you would like to add',
        agreement: 'I have read and accept the terms of the partner agreement.',
      },
      sectorPlaceholder: 'Select',
      sectorOptions: ['Law Firm', 'Visa Consultancy', 'Education Consultancy', 'Health Tourism', 'Patent/Trademark Office', 'Real Estate', 'HR Consultancy', 'Software', 'Other'],
      potentialOptions: ['1-5 customers', '5-10 customers', '10-20 customers', '20+ customers'],
      submit: 'Submit Application',
      success: 'Your application has been received. We will contact you.',
      note: 'Your application will be reviewed within 1 business day.',
    },
  },

  quote: {
    seo: {
      title: 'Instant Price Calculation',
      description: 'Upload your document or enter the details and get your instant preliminary quote.',
    },
    hero: {
      title: 'Instant Price Calculation',
      subtitle: 'Upload your document or enter the details and get an instant preliminary quote.',
    },
    upload: {
      heading: 'Upload Your Documents',
      privacy: 'Your data is kept confidential',
      tabFile: 'Upload File',
      tabText: 'Enter Text',
      chooseFile: 'Choose Your Documents',
      formats: '.docx, .xlsx, .pdf, .pptx, .jpg, .png and 50+ formats accepted · Max 100MB per file',
      dropHint: 'You can drag and drop one or more files into this area.',
      textPlaceholder: 'Paste or type your text here…',
      totalWords: 'Total word count',
      extracting: 'Counting words…',
      wordsUnit: 'words',
      remove: 'Remove',
      unsupported:
        'Automatic word counting was not possible for this file type. Please paste the text using "Enter Text"; the count will be verified by our team when quoting.',
      empty:
        'No selectable text was found in the file (it may be scanned/an image). Please use "Enter Text", or the count will be verified during quoting.',
      error: 'The file could not be read. Please try again or use "Enter Text".',
      tooLarge: 'The file cannot be larger than 100MB.',
      needInput: 'For a price, please upload a file or enter text.',
    },
    fields: {
      upload: 'Upload Document (optional)',
      uploadHint: 'PDF, DOC, DOCX or TXT — max 10 MB',
      sourceLang: 'Source Language',
      targetLang: 'Target Language',
      serviceType: 'Service Type',
      documentType: 'Document Type',
      wordCount: 'Estimated Word Count',
      wordCountHint: 'Use the slider or enter the number manually.',
      options: 'Additional options',
      calculate: 'Calculate Price',
    },
    options: {
      urgent: 'Urgent Delivery',
      notarization: 'Notary Approval',
      physicalDelivery: 'Physical Delivery',
    },
    languages: {
      tr: 'Turkish',
      en: 'English',
      de: 'German',
      fr: 'French',
      es: 'Spanish',
      it: 'Italian',
      ru: 'Russian',
      ar: 'Arabic',
    },
    documentTypes: {
      diploma: 'Diploma',
      passport: 'Passport',
      'civil-registry': 'Civil Registry Extract',
      contract: 'Contract',
      'medical-report': 'Medical Report',
      'technical-doc': 'Technical Document',
      'court-doc': 'Court Document',
      other: 'Other',
    },
    result: {
      title: 'Preliminary Quote',
      basePrice: 'Base service fee',
      wordPrice: 'Word fee',
      addons: 'Additional services',
      total: 'Total',
      vat: 'VAT',
      delivery: 'Estimated delivery time',
      deliveryUnit: 'business days',
      disclaimer: 'This is a preliminary quote; the final price is confirmed after document review.',
      order: 'Place Order',
      whatsapp: 'Contact via WhatsApp',
      estimatedWords: 'Estimated words (automatic — demo)',
    },
    orderConfirm: {
      title: 'Your order has been received',
      number: 'Order No',
      desc: 'Your request and documents have been saved. Our expert team will review the document and contact you as soon as possible.',
      viewOrders: 'My Orders',
      submitting: 'Creating order…',
      error: 'There was a problem creating your order. Please try again.',
    },
    gate: {
      title: 'Your price is ready',
      subtitle: 'Log in or verify your details to see the price and place an order.',
      loginCta: 'Log In / Sign Up',
      or: 'or continue quickly',
      firstName: 'First name',
      lastName: 'Last name',
      email: 'Email',
      sendCode: 'Send Verification Code',
      codeLabel: 'Verification Code',
      codeSentA: 'has been sent a verification code.',
      verify: 'Verify and See Price',
      resend: 'Resend code',
      resent: 'A new code has been sent.',
      back: 'Change details',
      errNames: 'First and last name are required.',
      errEmail: 'Enter a valid email.',
      errCode: 'Please enter the code in full.',
      note: 'Your email is used only for the quote and order.',
    },
    note: {
      label: 'Note about your order (optional)',
      placeholder: 'You can write your delivery, terminology or special requests here.',
    },
  },

  order: {
    seo: {
      title: 'Order Tracking',
      description: 'Track the status of your order.',
    },
    numberLabel: 'Order No',
    placedOn: 'Order date',
    estimatedLabel: 'Estimated translation delivery',
    cargoEstimatedLabel: 'Estimated shipping date',
    timelineTitle: 'Order status',
    steps: {
      received: 'Your order has been received',
      in_progress: 'In progress',
      translated: 'Translation completed',
      shipped: 'Shipped',
      delivered: 'Delivered',
      cancelled: 'Order cancelled',
    },
    stepDesc: {
      received: 'Your request and documents have reached our system. Our expert team will review it and start shortly.',
      in_progress: 'Our expert translator has started your translation.',
      translated: 'Your translation is complete and final checks have been done.',
      shipped: 'Your document has been handed to the courier; you can track it with the button below.',
      delivered: 'Your document has been sent to you by email.',
      cancelled: 'This order has been cancelled. Please contact us with any questions.',
    },
    cargoReady: 'Your document has been shipped. Track it with one tap:',
    cargoPending: 'The tracking code will appear here once your document is shipped.',
    trackCargo: 'Track My Shipment',
    digitalPending: 'Once your translation is complete, your files will be sent to you by email.',
    digitalDelivered: 'Your translation has been sent to you by email. Check your inbox (and spam folder).',
    detailsTitle: 'Order details',
    fields: {
      service: 'Service',
      langs: 'Languages',
      documentType: 'Document type',
      words: 'Words',
      delivery: 'Estimated time',
      total: 'Amount',
      note: 'Your note',
    },
    myOrders: 'My Orders',
    backHome: 'Back to Home',
    whatsapp: 'Contact via WhatsApp',
    loading: 'Loading order…',
    loginRequired: {
      title: 'Log in to view your order',
      desc: 'You can access your order details only after logging in with your account.',
      login: 'Log In',
    },
    notFound: {
      title: 'Order not found',
      desc: 'This order number does not belong to you or does not exist. Please check the link.',
      home: 'Back to Home',
    },
  },

  faq: {
    seo: {
      title: 'Frequently Asked Questions',
      description: 'Frequently asked questions about sworn translation, delivery time, pricing, notary approval and corporate terms.',
    },
    hero: { title: 'Frequently Asked Questions', subtitle: 'The answer you’re looking for is here.' },
    categoriesTitle: 'Categories',
    searchPlaceholder: 'Search questions or keywords…',
    empty: 'No questions matched your search. Try a different word or contact us.',
    notFound: {
      title: 'Didn’t find the answer to your question?',
      contact: 'Contact Us',
      whatsapp: 'WhatsApp Support',
    },
  },

  contact: {
    seo: {
      title: 'Contact',
      description: 'Get in touch with TercümExpert: phone, email, WhatsApp and contact form.',
    },
    hero: { title: 'Contact', subtitle: 'How can we help you?' },
    infoTitle: 'Contact information',
    labels: {
      phone: 'Phone',
      email: 'Email',
      whatsapp: 'WhatsApp',
      address: 'Address',
      hours: 'Working hours',
    },
    form: {
      title: 'Contact Us',
      fields: {
        name: 'Full Name',
        email: 'Email',
        phone: 'Phone',
        subject: 'Subject',
        message: 'Message',
        consent: 'I have read and approve the KVKK Disclosure Statement.',
      },
      submit: 'Send Message',
      success: 'Your message has been received. We will get back to you shortly.',
    },
    map: {
      title: 'Our Location',
      subtitle: 'Find us on the map',
      placeholder: 'Map area',
      note: 'The location map will be shown here soon.',
    },
  },

  auth: {
    seo: {
      title: 'Log In / Sign Up',
      description: 'Log in to your TercümExpert account or create a new one.',
    },
    tabs: { login: 'Log In', register: 'Sign Up' },
    google: 'Continue with Google',
    or: 'or',
    fields: {
      firstName: 'First Name',
      lastName: 'Last Name',
      email: 'Email',
      password: 'Password',
      code: 'Verification Code',
    },
    login: {
      title: 'Log in to your account',
      submit: 'Log In',
      noAccount: 'Don’t have an account?',
      switchToRegister: 'Sign up',
    },
    register: {
      title: 'Create a new account',
      submit: 'Sign Up',
      haveAccount: 'Already have an account?',
      switchToLogin: 'Log in',
      consent: 'By creating an account, I accept the KVKK Disclosure Statement and the Privacy Policy.',
    },
    verify: {
      title: 'Verify your email',
      desc: '— enter the 6-digit code we sent to this address.',
      submit: 'Verify and Continue',
      spam: 'The code may be delayed by a few minutes; also check your spam/junk folder.',
      resend: 'Resend code',
      resent: 'A new code has been sent.',
      back: 'Go back',
    },
    signedIn: {
      title: 'My Account',
      greeting: 'Welcome',
      logout: 'Log Out',
    },
    orders: {
      title: 'My Orders',
      empty: 'You have no orders yet. You can create your first order from Calculate Price.',
      loading: 'Loading orders…',
      error: 'Orders could not be loaded. Please refresh the page.',
      status: {
        received: 'Received',
        in_progress: 'In progress',
        translated: 'Translation completed',
        shipped: 'Shipped',
        delivered: 'Delivered',
        cancelled: 'Cancelled',
      },
      track: 'Track',
    },
    errors: {
      nameRequired: 'First and last name are required.',
      emailInvalid: 'Enter a valid email.',
      passwordShort: 'The password must be at least 6 characters.',
      codeInvalid: 'Please enter the 6-digit code.',
      consentRequired: 'Approval is required to continue.',
    },
  },

  blog: {
    seo: { title: 'Blog', description: 'Guide content on translation, notary, apostille and localization.' },
    hero: { title: 'Blog', subtitle: 'Guides from the world of translation.' },
    searchPlaceholder: 'Search posts…',
    readingTime: 'min read',
    relatedTitle: 'Related posts',
    allCategories: 'All',
    empty: 'No posts matched this criterion.',
  },

  legal: {
    lastUpdatedLabel: 'Last updated',
    draftNotice:
      'This text is a draft and should be reviewed by a legal expert before publication. Company information has not yet been verified.',
    kvkk: {
      seo: { title: 'KVKK Disclosure Statement', description: 'Disclosure statement on the protection of personal data.' },
      title: 'KVKK Disclosure Statement',
      sections: [
        { heading: 'Data Controller', body: 'The data controller and contact information will be added before launch.' },
        { heading: 'Personal Data Processed', body: 'Name, contact information and document data may be processed during contact and order processes.' },
        { heading: 'Purposes of Processing', body: 'Service provision, quotes, communication and legal obligations.' },
        { heading: 'Legal Grounds', body: 'Performance of a contract, explicit consent and legitimate interest.' },
        { heading: 'Retention Periods', body: 'Data is retained for the periods stipulated in the relevant legislation.' },
        { heading: 'Transfer', body: 'Transferred only to the extent required by the service and in compliance with legislation.' },
        { heading: 'Your Rights', body: 'You may exercise your rights under Article 11 of the KVKK.' },
        { heading: 'How to Apply', body: 'You may submit your requests through the stated contact channels.' },
      ],
    },
    privacy: {
      seo: { title: 'Privacy Policy', description: 'Policy on the confidentiality of personal data and documents.' },
      title: 'Privacy Policy',
      sections: [
        { heading: 'Information Collected', body: 'Contact information and uploaded documents.' },
        { heading: 'Use', body: 'Used only for service provision and communication.' },
        { heading: 'Document Security', body: 'Documents are processed with encrypted transfer and confidentiality principles.' },
        { heading: 'Cookies', body: 'Details are in the Cookie Policy.' },
      ],
    },
    distanceSales: {
      seo: { title: 'Distance Sales Agreement', description: 'Distance sales agreement for the sale of services.' },
      title: 'Distance Sales Agreement',
      sections: [
        { heading: 'Parties', body: 'Seller and buyer information will be added before launch.' },
        { heading: 'Scope of Service', body: 'The scope of the ordered translation/approval services.' },
        { heading: 'Right of Withdrawal and Exceptions', body: 'Withdrawal exceptions may apply to services prepared specifically for a person/order.' },
        { heading: 'Returns and Cancellation', body: 'Return and cancellation terms are set out here.' },
      ],
    },
    cookies: {
      seo: { title: 'Cookie Policy', description: 'Cookie categories used on the site and preference management.' },
      title: 'Cookie Policy',
      sections: [
        { heading: 'What Is a Cookie?', body: 'Cookies are small files stored in your browser.' },
        { heading: 'Categories', body: 'Necessary, analytics, marketing and preference cookies.' },
        { heading: 'Managing Preferences', body: 'You can update your cookie preferences at any time.' },
      ],
    },
  },

  footer: {
    tagline: 'Your reliable partner in professional translation services.',
    columns: {
      quickLinks: 'Quick Links',
      services: 'Services',
      contact: 'Contact',
    },
    quickLinks: {
      corporate: 'Corporate',
      services: 'Our Services',
      quote: 'Calculate Price',
      blog: 'Blog',
      faq: 'Frequently Asked Questions',
      contact: 'Contact',
    },
    serviceLinks: {
      sworn: 'Sworn Translation',
      notarized: 'Notarized Translation',
      apostille: 'Apostille Process',
      corporate: 'Corporate Solutions',
      partnership: 'Partnership Program',
    },
    legal: {
      kvkk: 'KVKK',
      privacy: 'Privacy Policy',
      distanceSales: 'Distance Sales Agreement',
      cookies: 'Cookie Policy',
    },
    socialTitle: 'Follow us',
    whatsapp: 'WhatsApp Support',
    rights: 'All rights reserved.',
  },

  cookie: {
    title: 'Cookie preferences',
    desc: 'We use cookies to improve your experience. Cookies other than necessary ones run only with your consent.',
    accept: 'Accept',
    reject: 'Reject',
    manage: 'Manage Preferences',
    save: 'Save Preferences',
    categories: {
      necessary: { label: 'Necessary', desc: 'Required for the site to function; cannot be disabled.' },
      analytics: { label: 'Analytics', desc: 'Helps us understand usage.' },
      marketing: { label: 'Marketing', desc: 'For relevant content and ads.' },
      preferences: { label: 'Preferences', desc: 'Remembers your preferences.' },
    },
  },

  chatbot: {
    title: 'TercümExpert Support',
    open: 'Open chat',
    close: 'Close chat',
    minimize: 'Minimize',
    clear: 'Clear conversation',
    inputPlaceholder: 'Type your message…',
    send: 'Send',
    typing: 'Typing…',
    welcome:
      'Hello and welcome to TercümExpert. I can help you with translation, pricing, notary approval, apostille or corporate services.',
    quickQuestions: [
      'How is the price calculated?',
      'What is sworn translation?',
      'I want to upload a document',
      'I want a corporate quote',
      'Is notary approval required?',
      'Connect me to a representative',
    ],
    handoff: 'Connect to a representative',
    toWhatsapp: 'Transfer to WhatsApp',
    disclaimer: 'This information is general; please confirm exact requirements with the relevant institution.',
    sensitiveWarning:
      'Please do not share sensitive personal data via this chat. You can send your documents through the secure upload area.',
  },

  notFound: {
    seo: { title: 'Page not found', description: 'The page you are looking for could not be found.' },
    title: 'Page not found',
    desc: 'The page you are looking for may have been moved or may never have existed.',
    home: 'Back to home',
  },
}

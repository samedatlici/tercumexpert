import type { PartialDictionary } from '@/types/i18n'

/** ENGLISH — temel çeviri (base). Eksikler TR'den fallback ile gelir. */
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
      contactUs: 'Contact Us',
      openMenu: 'Open menu',
      closeMenu: 'Close menu',
      selectLanguage: 'Select language',
      skipToContent: 'Skip to content',
    },
  },
  home: {
    seo: {
      title: 'TercümExpert — Professional Translation Services',
      description:
        'Sworn translation, notarization and corporate translation solutions. Upload your document and get an instant preliminary quote.',
    },
    hero: {
      title: 'Your Reliable Partner',
      titleAccent: 'in Professional Translation',
      subtitle: 'Upload your document, see the price, get professional delivery.',
      support: 'Sworn translation • Notarization • Corporate solutions',
    },
  },
  footer: {
    tagline: 'Your reliable partner in professional translation services.',
    rights: 'All rights reserved.',
  },
  notFound: {
    title: 'Page not found',
    desc: 'The page you are looking for may have been moved or never existed.',
    home: 'Back to home',
  },
}

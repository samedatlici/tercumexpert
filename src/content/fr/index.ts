import type { PartialDictionary } from '@/types/i18n'

/** FRANÇAIS — traduction de base. Les manques sont complétés par le fallback. */
export const fr: PartialDictionary = {
  common: {
    tagline: 'Votre partenaire fiable pour les services de traduction professionnelle.',
    nav: {
      home: 'Accueil',
      services: 'Services',
      quote: 'Devis',
      corporate: 'Entreprises',
      partnership: 'Partenariat',
      blog: 'Blog',
      faq: 'FAQ',
      contact: 'Contact',
    },
    actions: {
      getQuote: 'Obtenir un devis',
      calculatePrice: 'Calculer le prix',
      uploadDocument: 'Téléverser un document',
      whatsapp: 'Discuter sur WhatsApp',
      learnMore: 'En savoir plus',
      contactUs: 'Nous contacter',
      openMenu: 'Ouvrir le menu',
      closeMenu: 'Fermer le menu',
      selectLanguage: 'Choisir la langue',
      skipToContent: 'Aller au contenu',
    },
  },
  home: {
    hero: {
      title: 'Votre partenaire fiable en services de traduction',
      subtitle: 'Téléversez votre document, voyez le prix, recevez une livraison professionnelle.',
      support: 'Traduction assermentée • Notariat • Solutions entreprises',
    },
  },
  footer: {
    tagline: 'Votre partenaire fiable pour les services de traduction professionnelle.',
    rights: 'Tous droits réservés.',
  },
  notFound: {
    title: 'Page introuvable',
    desc: 'La page que vous recherchez a peut-être été déplacée ou n’existe pas.',
    home: 'Retour à l’accueil',
  },
}

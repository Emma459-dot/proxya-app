// Utilitaires pour la gestion de la devise FCFA
export const formatPrice = (price: number): string => {
  return new Intl.NumberFormat("fr-CM", {
    style: "currency",
    currency: "XAF",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })
    .format(price)
    .replace("FCFA", "FCFA")
}

// Conversion approximative pour les exemples (1€ ≈ 655 FCFA)
export const convertEuroToFCFA = (euroAmount: number): number => {
  return Math.round(euroAmount * 655)
}

// Suggestions de prix par catégorie pour le Cameroun
export const priceSuggestions = {
  "Beauté/Esthétique": {
    min: 5000,
    max: 50000,
    examples: ["Coiffure: 8000-15000 FCFA", "Manucure: 3000-8000 FCFA", "Massage: 10000-25000 FCFA"],
  },
  Alimentation: {
    min: 10000,
    max: 100000,
    examples: ["Repas familial: 15000-40000 FCFA", "Pâtisserie: 5000-20000 FCFA", "Traiteur événement: 50000+ FCFA"],
  },
  Éducation: {
    min: 5000,
    max: 30000,
    examples: [
      "Cours particulier: 5000-15000 FCFA/h",
      "Formation informatique: 20000-30000 FCFA",
      "Soutien scolaire: 8000-12000 FCFA/h",
    ],
  },
  Événementiel: {
    min: 25000,
    max: 500000,
    examples: [
      "Animation enfants: 25000-50000 FCFA",
      "DJ mariage: 100000-300000 FCFA",
      "Décoration: 50000-200000 FCFA",
    ],
  },
  Maintenance: {
    min: 8000,
    max: 80000,
    examples: ["Plomberie: 10000-30000 FCFA", "Électricité: 15000-50000 FCFA", "Ménage: 8000-20000 FCFA"],
  },
}

// Quartiers populaires du Cameroun
export const cameroonLocations = {
  yaoundé: [
    "Bastos",
    "Melen",
    "Ngousso",
    "Emana",
    "Ekounou",
    "Biyem-Assi",
    "Essos",
    "Mokolo",
    "Mvog-Ada",
    "Nlongkak",
    "Omnisport",
    "Tsinga",
  ],
  douala: [
    "Akwa",
    "Bonanjo",
    "Bonapriso",
    "Bassa",
    "Deido",
    "Makepe",
    "New Bell",
    "Nylon",
    "PK8",
    "Logbaba",
    "Kotto",
    "Ndogpassi",
  ],
  autres: ["Bafoussam", "Bamenda", "Garoua", "Maroua", "Ngaoundéré", "Bertoua", "Ebolowa", "Kribi", "Limbe", "Buea"],
}

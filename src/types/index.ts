// Types de base pour l'utilisateur
export interface User {
  id?: string
  nom: string
  prenom: string
  email: string
  telephone: string
  createdAt: Date
  isActive: boolean
  hasReceivedWelcome?: boolean
}

// Nouveau type pour les éléments de portfolio
export interface PortfolioItem {
  id?: string
  title: string
  description: string
  images: string[]
  category: string
  completedDate: Date
  clientTestimonial?: string
  tags: string[]
  isPublic: boolean
}

// Nouveau type pour les certifications
export interface Certification {
  id?: string
  title: string
  issuer: string
  issueDate: Date
  expiryDate?: Date
  credentialId?: string
  credentialUrl?: string
  image?: string
  isVerified: boolean
}

// Nouveau type pour les compétences
export interface Skill {
  name: string
  level: 1 | 2 | 3 | 4 | 5 // 1 = Débutant, 5 = Expert
  yearsOfExperience: number
}

// TYPE POUR L'INSCRIPTION (champs de base seulement)
export interface ProviderRegistration {
  nom: string
  prenom: string
  email: string
  telephone: string
  age: number
  adresse: string
  categories: string[]
  specifications: string
  expertise: "debutant" | "intermediaire" | "professionnel"
  reseauxSociaux: string
  isActive: boolean
}

// TYPE COMPLET POUR LE PROFIL (avec tous les champs optionnels)
export interface Provider {
  id?: string
  nom: string
  prenom: string
  email: string
  telephone: string
  age: number
  adresse: string
  categories: string[]
  specifications: string
  expertise: "debutant" | "intermediaire" | "professionnel"
  reseauxSociaux: string
  createdAt: Date
  isActive: boolean
  rating?: number
  completedJobs?: number
  hasReceivedWelcome?: boolean
  // CHAMPS OPTIONNELS POUR PROFIL DÉTAILLÉ
  ville?: string
  quartier?: string
  description?: string
  experience?: number
  tarifs?: {
    min: number
    max: number
  }
  disponibilites?: string[]
  profileImage?: string
  coverImage?: string
  bio?: string
  languages?: string[]
  skills?: Skill[]
  certifications?: Certification[]
  portfolio?: PortfolioItem[]
  socialLinks?: {
    website?: string
    facebook?: string
    instagram?: string
    linkedin?: string
  }
  businessInfo?: {
    businessName?: string
    businessType?: "individual" | "company"
    registrationNumber?: string
    taxNumber?: string
    insurance?: boolean
  }
  workingHours?: {
    [key: string]: {
      isOpen: boolean
      openTime: string
      closeTime: string
    }
  }
  responseTime?: number // en heures
  isVerified?: boolean
  verificationDocuments?: string[]
  joinedDate?: Date
}

export interface Client {
  id?: string
  nom: string
  prenom: string
  email: string
  telephone: string
  adresse: string
  createdAt: Date
  isActive: boolean
  hasReceivedWelcome?: boolean
}

export interface Service {
  id?: string
  providerId: string
  title: string
  description: string
  category: string
  price: number
  duration: number
  isActive: boolean
  createdAt: Date
  images?: string[]
  tags?: string[]
  features?: string[]
  location?: "domicile" | "salon" | "les-deux"
  serviceArea?: string[]
  availability?: {
    days: string[]
    timeSlots: string[]
  }
  // Nouvelles fonctionnalités Cameroun
  isGroupService?: boolean
  maxGroupSize?: number
  isUrgentAvailable?: boolean
  urgentPriceMultiplier?: number
  paymentOptions?: string[]
  // Statistiques d'avis
  averageRating?: number
  totalReviews?: number
}

export interface Booking {
  id?: string
  clientId: string
  providerId: string
  serviceId: string
  date: Date
  time: string
  status: "pending" | "confirmed" | "completed" | "cancelled"
  totalPrice: number
  notes?: string
  createdAt: Date
  // Nouvelles fonctionnalités
  isUrgent?: boolean
  groupSize?: number
  paymentMethod?: string
  referralCode?: string
  // Avis
  hasReview?: boolean
  reviewId?: string
}

export interface Message {
  id?: string
  senderId: string
  receiverId: string
  content: string
  timestamp: Date
  isRead: boolean
  bookingId?: string
}

// Interface pour les avis
export interface Review {
  id?: string
  clientId: string
  providerId: string
  serviceId: string
  bookingId: string
  rating: number // 1 à 5 étoiles
  comment: string
  createdAt: Date
  // Critères spécifiques Cameroun
  punctualityRating?: number // Ponctualité
  qualityRating?: number // Qualité du service
  communicationRating?: number // Communication
  valueRating?: number // Rapport qualité-prix
  // Réponse du prestataire
  providerResponse?: string
  providerResponseDate?: Date
  // Modération
  isVerified?: boolean
  isReported?: boolean
  helpfulCount?: number
}

// Interface pour les statistiques d'avis
export interface ReviewStats {
  averageRating: number
  totalReviews: number
  ratingDistribution: {
    5: number
    4: number
    3: number
    2: number
    1: number
  }
  criteriaAverages: {
    punctuality: number
    quality: number
    communication: number
    value: number
  }
}

// Interface pour les filtres de recherche avancée
export interface SearchFilters {
  query: string
  categories: string[]
  priceRange: [number, number]
  minRating: number
  location: {
    ville: string
    quartier: string
    maxDistance?: number
  }
  availability: {
    isUrgentAvailable: boolean
    isGroupService: boolean
    location: ("domicile" | "salon" | "les-deux")[]
  }
  sortBy: "relevance" | "price-asc" | "price-desc" | "rating" | "distance" | "newest"
}

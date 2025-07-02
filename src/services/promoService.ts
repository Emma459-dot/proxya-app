// Service pour gérer les codes promo et réductions
export interface PromoCode {
  id: string
  code: string
  type: "percentage" | "fixed"
  value: number // Pourcentage ou montant fixe
  description: string
  validFrom: Date
  validUntil: Date
  usageLimit?: number
  usedCount: number
  isActive: boolean
  applicableServices?: string[] // IDs des services concernés
  minimumAmount?: number // Montant minimum pour utiliser le code
  maxDiscount?: number // Réduction maximale pour les pourcentages
}

export interface PromoValidation {
  isValid: boolean
  discount: number
  message: string
  promoCode?: PromoCode
}

class PromoService {
  // Codes promo par défaut pour la démo
  private defaultPromoCodes: PromoCode[] = [
    {
      id: "1",
      code: "WELCOME10",
      type: "percentage",
      value: 10,
      description: "10% de réduction pour les nouveaux clients",
      validFrom: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30), // 30 jours avant
      validUntil: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30), // 30 jours après
      usageLimit: 100,
      usedCount: 15,
      isActive: true,
      minimumAmount: 5000, // 5000 FCFA minimum
      maxDiscount: 5000, // Max 5000 FCFA de réduction
    },
    {
      id: "2",
      code: "URGENT20",
      type: "percentage",
      value: 20,
      description: "20% de réduction sur les services urgents",
      validFrom: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7), // 7 jours avant
      validUntil: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7), // 7 jours après
      usageLimit: 50,
      usedCount: 8,
      isActive: true,
      minimumAmount: 10000,
      maxDiscount: 10000,
    },
    {
      id: "3",
      code: "GROUPE15",
      type: "percentage",
      value: 15,
      description: "15% de réduction supplémentaire pour les services de groupe",
      validFrom: new Date(Date.now() - 1000 * 60 * 60 * 24 * 14),
      validUntil: new Date(Date.now() + 1000 * 60 * 60 * 24 * 14),
      usageLimit: 30,
      usedCount: 5,
      isActive: true,
      minimumAmount: 15000,
    },
    {
      id: "4",
      code: "FIXE2000",
      type: "fixed",
      value: 2000,
      description: "2000 FCFA de réduction",
      validFrom: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3),
      validUntil: new Date(Date.now() + 1000 * 60 * 60 * 24 * 10),
      usageLimit: 20,
      usedCount: 3,
      isActive: true,
      minimumAmount: 8000,
    },
    {
      id: "5",
      code: "EXPIRED",
      type: "percentage",
      value: 25,
      description: "Code expiré pour test",
      validFrom: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30),
      validUntil: new Date(Date.now() - 1000 * 60 * 60 * 24 * 1), // Expiré hier
      usageLimit: 10,
      usedCount: 2,
      isActive: false,
    },
  ]

  async validatePromoCode(
    code: string,
    totalAmount: number,
    serviceId?: string,
    isUrgent?: boolean,
    isGroup?: boolean,
  ): Promise<PromoValidation> {
    try {
      // Simuler un délai d'API
      await new Promise((resolve) => setTimeout(resolve, 500))

      const promoCode = this.defaultPromoCodes.find((p) => p.code.toLowerCase() === code.toLowerCase())

      if (!promoCode) {
        return {
          isValid: false,
          discount: 0,
          message: "Code promo invalide",
        }
      }

      if (!promoCode.isActive) {
        return {
          isValid: false,
          discount: 0,
          message: "Ce code promo n'est plus actif",
        }
      }

      const now = new Date()
      if (now < promoCode.validFrom || now > promoCode.validUntil) {
        return {
          isValid: false,
          discount: 0,
          message: "Ce code promo a expiré",
        }
      }

      if (promoCode.usageLimit && promoCode.usedCount >= promoCode.usageLimit) {
        return {
          isValid: false,
          discount: 0,
          message: "Ce code promo a atteint sa limite d'utilisation",
        }
      }

      if (promoCode.minimumAmount && totalAmount < promoCode.minimumAmount) {
        return {
          isValid: false,
          discount: 0,
          message: `Montant minimum de ${promoCode.minimumAmount} FCFA requis`,
        }
      }

      // Vérifications spéciales selon le type de code
      if (promoCode.code === "URGENT20" && !isUrgent) {
        return {
          isValid: false,
          discount: 0,
          message: "Ce code est réservé aux services urgents",
        }
      }

      if (promoCode.code === "GROUPE15" && !isGroup) {
        return {
          isValid: false,
          discount: 0,
          message: "Ce code est réservé aux services de groupe",
        }
      }

      // Calculer la réduction
      let discount = 0
      if (promoCode.type === "percentage") {
        discount = Math.round((totalAmount * promoCode.value) / 100)
        if (promoCode.maxDiscount) {
          discount = Math.min(discount, promoCode.maxDiscount)
        }
      } else {
        discount = promoCode.value
      }

      // S'assurer que la réduction ne dépasse pas le montant total
      discount = Math.min(discount, totalAmount)

      return {
        isValid: true,
        discount,
        message: `Code appliqué ! Réduction de ${discount} FCFA`,
        promoCode,
      }
    } catch (error) {
      console.error("Erreur validation code promo:", error)
      return {
        isValid: false,
        discount: 0,
        message: "Erreur lors de la validation du code",
      }
    }
  }

  async getAvailablePromoCodes(): Promise<PromoCode[]> {
    // Retourner seulement les codes actifs et non expirés
    const now = new Date()
    return this.defaultPromoCodes.filter(
      (code) =>
        code.isActive &&
        now >= code.validFrom &&
        now <= code.validUntil &&
        (!code.usageLimit || code.usedCount < code.usageLimit),
    )
  }

  async usePromoCode(codeId: string): Promise<boolean> {
    try {
      // Simuler l'utilisation du code (incrémenter le compteur)
      const promoIndex = this.defaultPromoCodes.findIndex((p) => p.id === codeId)
      if (promoIndex !== -1) {
        this.defaultPromoCodes[promoIndex].usedCount++
        return true
      }
      return false
    } catch (error) {
      console.error("Erreur utilisation code promo:", error)
      return false
    }
  }

  // Générer des codes promo personnalisés pour les utilisateurs fidèles
  generateLoyaltyCode(userId: string, completedBookings: number): PromoCode | null {
    if (completedBookings >= 5 && completedBookings < 10) {
      return {
        id: `loyalty_${userId}_5`,
        code: "FIDELE5",
        type: "percentage",
        value: 5,
        description: "5% de réduction fidélité",
        validFrom: new Date(),
        validUntil: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30),
        usageLimit: 1,
        usedCount: 0,
        isActive: true,
      }
    } else if (completedBookings >= 10) {
      return {
        id: `loyalty_${userId}_10`,
        code: "FIDELE10",
        type: "percentage",
        value: 10,
        description: "10% de réduction fidélité",
        validFrom: new Date(),
        validUntil: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30),
        usageLimit: 1,
        usedCount: 0,
        isActive: true,
      }
    }
    return null
  }
}

export const promoService = new PromoService()

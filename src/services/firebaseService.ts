import { collection, doc, addDoc, getDoc, getDocs, updateDoc, query, where, orderBy } from "firebase/firestore"
import { db } from "../config/firebase"
import type { Provider, Client, Service, Booking, Message, Review, ReviewStats } from "../types"

// Fonction utilitaire pour convertir les dates Firestore
const convertFirestoreDate = (data: any) => {
  if (data && typeof data === "object") {
    Object.keys(data).forEach((key) => {
      if (data[key] && typeof data[key] === "object") {
        if (data[key].toDate && typeof data[key].toDate === "function") {
          data[key] = data[key].toDate()
        } else if (data[key].seconds && data[key].nanoseconds !== undefined) {
          data[key] = new Date(data[key].seconds * 1000 + data[key].nanoseconds / 1000000)
        } else if (typeof data[key] === "object" && !Array.isArray(data[key])) {
          convertFirestoreDate(data[key])
        }
      }
    })
  }
  return data
}

// Services pour les prestataires
export const providerService = {
  async create(provider: Omit<Provider, "id" | "createdAt">): Promise<Provider> {
    try {
      console.log("Tentative de création du prestataire:", provider)

      // Créer le prestataire avec des valeurs par défaut pour les nouveaux champs
      const providerData = {
        ...provider,
        createdAt: new Date(),
        isActive: true,
        rating: 0,
        completedJobs: 0,
        hasReceivedWelcome: false,
        // Valeurs par défaut pour les nouveaux champs
        ville: provider.ville || "",
        quartier: provider.quartier || "",
        description: provider.description || "",
        experience: provider.experience || 0,
        tarifs: provider.tarifs || { min: 0, max: 0 },
        disponibilites: provider.disponibilites || [],
        profileImage: provider.profileImage || "",
        coverImage: provider.coverImage || "",
        bio: provider.bio || "",
        languages: provider.languages || ["Français"],
        skills: provider.skills || [],
        certifications: provider.certifications || [],
        portfolio: provider.portfolio || [],
        socialLinks: provider.socialLinks || {},
        businessInfo: provider.businessInfo || {
          businessName: "",
          businessType: "individual" as const,
          registrationNumber: "",
          insurance: false,
        },
        workingHours: provider.workingHours || {},
        responseTime: provider.responseTime || 24,
        isVerified: provider.isVerified || false,
        verificationDocuments: provider.verificationDocuments || [],
        joinedDate: provider.joinedDate || new Date(),
      }

      const docRef = await addDoc(collection(db, "providers"), providerData)
      console.log("Prestataire créé avec l'ID:", docRef.id)

      // Retourner l'objet complet avec l'ID
      return {
        id: docRef.id,
        ...providerData,
      } as Provider
    } catch (error) {
      console.error("Erreur lors de la création du prestataire:", error)
      throw new Error(`Erreur de création: ${error instanceof Error ? error.message : "Erreur inconnue"}`)
    }
  },

  async login(email: string, nom: string): Promise<Provider | null> {
    try {
      console.log("Tentative de connexion prestataire:", { nom, email })

      const q = query(
        collection(db, "providers"),
        where("nom", "==", nom),
        where("email", "==", email),
        where("isActive", "==", true),
      )

      const querySnapshot = await getDocs(q)

      if (querySnapshot.empty) {
        console.log("Aucun prestataire trouvé avec ces informations")
        return null
      }

      const doc = querySnapshot.docs[0]
      const provider = { id: doc.id, ...convertFirestoreDate(doc.data()) } as Provider

      console.log("Prestataire trouvé:", provider)
      return provider
    } catch (error) {
      console.error("Erreur lors de la connexion prestataire:", error)
      throw new Error(`Erreur de connexion: ${error instanceof Error ? error.message : "Erreur inconnue"}`)
    }
  },

  async getById(id: string): Promise<Provider | null> {
    try {
      const docRef = doc(db, "providers", id)
      const docSnap = await getDoc(docRef)

      if (docSnap.exists()) {
        return { id: docSnap.id, ...convertFirestoreDate(docSnap.data()) } as Provider
      }

      return null
    } catch (error) {
      console.error("Erreur lors de la récupération du prestataire:", error)
      throw new Error(`Erreur de récupération: ${error instanceof Error ? error.message : "Erreur inconnue"}`)
    }
  },

  async update(id: string, data: Partial<Provider>): Promise<void> {
    try {
      const docRef = doc(db, "providers", id)
      await updateDoc(docRef, data)
    } catch (error) {
      console.error("Erreur lors de la mise à jour du prestataire:", error)
      throw new Error(`Erreur de mise à jour: ${error instanceof Error ? error.message : "Erreur inconnue"}`)
    }
  },

  async getAll(): Promise<Provider[]> {
    try {
      const q = query(collection(db, "providers"), where("isActive", "==", true))
      const querySnapshot = await getDocs(q)

      return querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...convertFirestoreDate(doc.data()),
      })) as Provider[]
    } catch (error) {
      console.error("Erreur lors de la récupération des prestataires:", error)
      throw new Error(`Erreur de récupération: ${error instanceof Error ? error.message : "Erreur inconnue"}`)
    }
  },

  async getByCategory(category: string): Promise<Provider[]> {
    try {
      const q = query(
        collection(db, "providers"),
        where("categories", "array-contains", category),
        where("isActive", "==", true),
      )

      const querySnapshot = await getDocs(q)

      return querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...convertFirestoreDate(doc.data()),
      })) as Provider[]
    } catch (error) {
      console.error("Erreur lors de la recherche par catégorie:", error)
      throw new Error(`Erreur de recherche: ${error instanceof Error ? error.message : "Erreur inconnue"}`)
    }
  },
}

// Services pour les clients
export const clientService = {
  async create(client: Omit<Client, "id" | "createdAt">): Promise<Client> {
    try {
      console.log("Tentative de création du client:", client)

      const clientData = {
        ...client,
        createdAt: new Date(),
        isActive: true,
        hasReceivedWelcome: false,
      }

      const docRef = await addDoc(collection(db, "clients"), clientData)
      console.log("Client créé avec l'ID:", docRef.id)

      // Retourner l'objet complet avec l'ID
      return {
        id: docRef.id,
        ...clientData,
      } as Client
    } catch (error) {
      console.error("Erreur lors de la création du client:", error)
      throw new Error(`Erreur de création: ${error instanceof Error ? error.message : "Erreur inconnue"}`)
    }
  },

  async login(email: string, nom: string): Promise<Client | null> {
    try {
      console.log("Tentative de connexion client:", { nom, email })

      const q = query(
        collection(db, "clients"),
        where("nom", "==", nom),
        where("email", "==", email),
        where("isActive", "==", true),
      )

      const querySnapshot = await getDocs(q)

      if (querySnapshot.empty) {
        console.log("Aucun client trouvé avec ces informations")
        return null
      }

      const doc = querySnapshot.docs[0]
      const client = { id: doc.id, ...convertFirestoreDate(doc.data()) } as Client

      console.log("Client trouvé:", client)
      return client
    } catch (error) {
      console.error("Erreur lors de la connexion client:", error)
      throw new Error(`Erreur de connexion: ${error instanceof Error ? error.message : "Erreur inconnue"}`)
    }
  },

  async getById(id: string): Promise<Client | null> {
    try {
      const docRef = doc(db, "clients", id)
      const docSnap = await getDoc(docRef)

      if (docSnap.exists()) {
        return { id: docSnap.id, ...convertFirestoreDate(docSnap.data()) } as Client
      }

      return null
    } catch (error) {
      console.error("Erreur lors de la récupération du client:", error)
      throw new Error(`Erreur de récupération: ${error instanceof Error ? error.message : "Erreur inconnue"}`)
    }
  },

  async update(id: string, data: Partial<Client>): Promise<void> {
    try {
      const docRef = doc(db, "clients", id)
      await updateDoc(docRef, data)
    } catch (error) {
      console.error("Erreur lors de la mise à jour du client:", error)
      throw new Error(`Erreur de mise à jour: ${error instanceof Error ? error.message : "Erreur inconnue"}`)
    }
  },
}

// Services pour les services/prestations
export const serviceService = {
  async create(service: Omit<Service, "id" | "createdAt">): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, "services"), {
        ...service,
        createdAt: new Date(),
        isActive: true,
        averageRating: 0,
        totalReviews: 0,
      })

      return docRef.id
    } catch (error) {
      console.error("Erreur lors de la création du service:", error)
      throw new Error(`Erreur de création: ${error instanceof Error ? error.message : "Erreur inconnue"}`)
    }
  },

  async getById(id: string): Promise<Service | null> {
    try {
      const docRef = doc(db, "services", id)
      const docSnap = await getDoc(docRef)

      if (docSnap.exists()) {
        return { id: docSnap.id, ...convertFirestoreDate(docSnap.data()) } as Service
      }

      return null
    } catch (error) {
      console.error("Erreur lors de la récupération du service:", error)
      throw new Error(`Erreur de récupération: ${error instanceof Error ? error.message : "Erreur inconnue"}`)
    }
  },

  async getByProvider(providerId: string): Promise<Service[]> {
    try {
      const q = query(collection(db, "services"), where("providerId", "==", providerId), where("isActive", "==", true))
      const querySnapshot = await getDocs(q)

      return querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...convertFirestoreDate(doc.data()),
      })) as Service[]
    } catch (error) {
      console.error("Erreur lors de la récupération des services:", error)
      throw new Error(`Erreur de récupération: ${error instanceof Error ? error.message : "Erreur inconnue"}`)
    }
  },

  async update(id: string, data: Partial<Service>): Promise<void> {
    try {
      const docRef = doc(db, "services", id)
      await updateDoc(docRef, data)
    } catch (error) {
      console.error("Erreur lors de la mise à jour du service:", error)
      throw new Error(`Erreur de mise à jour: ${error instanceof Error ? error.message : "Erreur inconnue"}`)
    }
  },

  async delete(id: string): Promise<void> {
    try {
      const docRef = doc(db, "services", id)
      await updateDoc(docRef, { isActive: false })
    } catch (error) {
      console.error("Erreur lors de la suppression du service:", error)
      throw new Error(`Erreur de suppression: ${error instanceof Error ? error.message : "Erreur inconnue"}`)
    }
  },
}

// Services pour les réservations
export const bookingService = {
  async create(booking: Omit<Booking, "id" | "createdAt">): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, "bookings"), {
        ...booking,
        createdAt: new Date(),
        status: "pending",
        hasReview: false,
      })

      return docRef.id
    } catch (error) {
      console.error("Erreur lors de la création de la réservation:", error)
      throw new Error(`Erreur de création: ${error instanceof Error ? error.message : "Erreur inconnue"}`)
    }
  },

  async getByClient(clientId: string): Promise<Booking[]> {
    try {
      const q = query(collection(db, "bookings"), where("clientId", "==", clientId))
      const querySnapshot = await getDocs(q)

      return querySnapshot.docs.map((doc) => {
        const data = doc.data()
        return {
          id: doc.id,
          ...convertFirestoreDate(data),
        }
      }) as Booking[]
    } catch (error) {
      console.error("Erreur lors de la récupération des réservations client:", error)
      throw new Error(`Erreur de récupération: ${error instanceof Error ? error.message : "Erreur inconnue"}`)
    }
  },

  async getByProvider(providerId: string): Promise<Booking[]> {
    try {
      const q = query(collection(db, "bookings"), where("providerId", "==", providerId))
      const querySnapshot = await getDocs(q)

      return querySnapshot.docs.map((doc) => {
        const data = doc.data()
        return {
          id: doc.id,
          ...convertFirestoreDate(data),
        }
      }) as Booking[]
    } catch (error) {
      console.error("Erreur lors de la récupération des réservations prestataire:", error)
      throw new Error(`Erreur de récupération: ${error instanceof Error ? error.message : "Erreur inconnue"}`)
    }
  },

  async updateStatus(id: string, status: Booking["status"]): Promise<void> {
    try {
      const docRef = doc(db, "bookings", id)
      await updateDoc(docRef, { status })
    } catch (error) {
      console.error("Erreur lors de la mise à jour du statut:", error)
      throw new Error(`Erreur de mise à jour: ${error instanceof Error ? error.message : "Erreur inconnue"}`)
    }
  },

  async markAsReviewed(id: string, reviewId: string): Promise<void> {
    try {
      const docRef = doc(db, "bookings", id)
      await updateDoc(docRef, { hasReview: true, reviewId })
    } catch (error) {
      console.error("Erreur lors du marquage comme évalué:", error)
      throw new Error(`Erreur de mise à jour: ${error instanceof Error ? error.message : "Erreur inconnue"}`)
    }
  },
}

// Services pour les messages
export const messageService = {
  async send(message: Omit<Message, "id" | "timestamp" | "isRead">): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, "messages"), {
        ...message,
        timestamp: new Date(),
        isRead: false,
      })

      return docRef.id
    } catch (error) {
      console.error("Erreur lors de l'envoi du message:", error)
      throw new Error(`Erreur d'envoi: ${error instanceof Error ? error.message : "Erreur inconnue"}`)
    }
  },

  async getConversation(userId1: string, userId2: string): Promise<Message[]> {
    try {
      const q = query(collection(db, "messages"), orderBy("timestamp", "asc"))
      const querySnapshot = await getDocs(q)

      const messages = querySnapshot.docs
        .map((doc) => {
          const data = doc.data()
          return {
            id: doc.id,
            ...convertFirestoreDate(data),
          } as Message
        })
        .filter(
          (msg) =>
            (msg.senderId === userId1 && msg.receiverId === userId2) ||
            (msg.senderId === userId2 && msg.receiverId === userId1),
        )

      return messages
    } catch (error) {
      console.error("Erreur lors de la récupération de la conversation:", error)
      throw new Error(`Erreur de récupération: ${error instanceof Error ? error.message : "Erreur inconnue"}`)
    }
  },

  async getUserConversations(userId: string): Promise<Message[]> {
    try {
      const q = query(collection(db, "messages"), orderBy("timestamp", "desc"))
      const querySnapshot = await getDocs(q)

      const messages = querySnapshot.docs
        .map((doc) => {
          const data = doc.data()
          return {
            id: doc.id,
            ...convertFirestoreDate(data),
          } as Message
        })
        .filter((msg) => msg.senderId === userId || msg.receiverId === userId)

      return messages
    } catch (error) {
      console.error("Erreur lors de la récupération des conversations:", error)
      throw new Error(`Erreur de récupération: ${error instanceof Error ? error.message : "Erreur inconnue"}`)
    }
  },

  async markAsRead(id: string): Promise<void> {
    try {
      const docRef = doc(db, "messages", id)
      await updateDoc(docRef, { isRead: true })
    } catch (error) {
      console.error("Erreur lors du marquage comme lu:", error)
      throw new Error(`Erreur de mise à jour: ${error instanceof Error ? error.message : "Erreur inconnue"}`)
    }
  },

  async countUnreadMessages(userId: string): Promise<number> {
    try {
      const q = query(collection(db, "messages"), where("receiverId", "==", userId), where("isRead", "==", false))
      const querySnapshot = await getDocs(q)

      return querySnapshot.size
    } catch (error) {
      console.error("Erreur lors du comptage des messages non lus:", error)
      return 0 // Retourner 0 en cas d'erreur plutôt que de lancer une exception
    }
  },
}

// Services pour les avis
export const reviewService = {
  async create(review: Omit<Review, "id" | "createdAt">): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, "reviews"), {
        ...review,
        createdAt: new Date(),
        isVerified: false,
        isReported: false,
        helpfulCount: 0,
      })

      // Marquer la réservation comme évaluée
      await bookingService.markAsReviewed(review.bookingId, docRef.id)

      // Mettre à jour les statistiques du service et du prestataire
      await this.updateServiceStats(review.serviceId)
      await this.updateProviderStats(review.providerId)

      return docRef.id
    } catch (error) {
      console.error("Erreur lors de la création de l'avis:", error)
      throw new Error(`Erreur de création: ${error instanceof Error ? error.message : "Erreur inconnue"}`)
    }
  },

  async getByService(serviceId: string): Promise<Review[]> {
    try {
      const q = query(collection(db, "reviews"), where("serviceId", "==", serviceId))
      const querySnapshot = await getDocs(q)

      const reviews = querySnapshot.docs.map((doc) => {
        const data = doc.data()
        return {
          id: doc.id,
          ...convertFirestoreDate(data),
        }
      }) as Review[]

      return reviews.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    } catch (error) {
      console.error("Erreur lors de la récupération des avis du service:", error)
      throw new Error(`Erreur de récupération: ${error instanceof Error ? error.message : "Erreur inconnue"}`)
    }
  },

  async getByProvider(providerId: string): Promise<Review[]> {
    try {
      const q = query(collection(db, "reviews"), where("providerId", "==", providerId))
      const querySnapshot = await getDocs(q)

      const reviews = querySnapshot.docs.map((doc) => {
        const data = doc.data()
        return {
          id: doc.id,
          ...convertFirestoreDate(data),
        }
      }) as Review[]

      return reviews.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    } catch (error) {
      console.error("Erreur lors de la récupération des avis du prestataire:", error)
      throw new Error(`Erreur de récupération: ${error instanceof Error ? error.message : "Erreur inconnue"}`)
    }
  },

  async getByClient(clientId: string): Promise<Review[]> {
    try {
      const q = query(collection(db, "reviews"), where("clientId", "==", clientId))
      const querySnapshot = await getDocs(q)

      const reviews = querySnapshot.docs.map((doc) => {
        const data = doc.data()
        return {
          id: doc.id,
          ...convertFirestoreDate(data),
        }
      }) as Review[]

      return reviews.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    } catch (error) {
      console.error("Erreur lors de la récupération des avis du client:", error)
      throw new Error(`Erreur de récupération: ${error instanceof Error ? error.message : "Erreur inconnue"}`)
    }
  },

  async addProviderResponse(reviewId: string, response: string): Promise<void> {
    try {
      const docRef = doc(db, "reviews", reviewId)
      await updateDoc(docRef, {
        providerResponse: response,
        providerResponseDate: new Date(),
      })
    } catch (error) {
      console.error("Erreur lors de l'ajout de la réponse:", error)
      throw new Error(`Erreur d'ajout: ${error instanceof Error ? error.message : "Erreur inconnue"}`)
    }
  },

  async markAsHelpful(reviewId: string): Promise<void> {
    try {
      const docRef = doc(db, "reviews", reviewId)
      const docSnap = await getDoc(docRef)

      if (docSnap.exists()) {
        const currentCount = docSnap.data().helpfulCount || 0
        await updateDoc(docRef, { helpfulCount: currentCount + 1 })
      }
    } catch (error) {
      console.error("Erreur lors du marquage comme utile:", error)
      throw new Error(`Erreur de mise à jour: ${error instanceof Error ? error.message : "Erreur inconnue"}`)
    }
  },

  async updateServiceStats(serviceId: string): Promise<void> {
    try {
      const reviews = await this.getByService(serviceId)

      if (reviews.length > 0) {
        const averageRating = reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length

        await serviceService.update(serviceId, {
          averageRating: Math.round(averageRating * 10) / 10,
          totalReviews: reviews.length,
        })
      }
    } catch (error) {
      console.error("Erreur lors de la mise à jour des stats du service:", error)
    }
  },

  async updateProviderStats(providerId: string): Promise<void> {
    try {
      const reviews = await this.getByProvider(providerId)

      if (reviews.length > 0) {
        const averageRating = reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length

        await providerService.update(providerId, {
          rating: Math.round(averageRating * 10) / 10,
          completedJobs: reviews.length,
        })
      }
    } catch (error) {
      console.error("Erreur lors de la mise à jour des stats du prestataire:", error)
    }
  },

  async getProviderStats(providerId: string): Promise<ReviewStats> {
    try {
      const reviews = await this.getByProvider(providerId)

      const stats: ReviewStats = {
        averageRating: 0,
        totalReviews: reviews.length,
        ratingDistribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
        criteriaAverages: {
          punctuality: 0,
          quality: 0,
          communication: 0,
          value: 0,
        },
      }

      if (reviews.length === 0) return stats

      reviews.forEach((review) => {
        stats.ratingDistribution[review.rating as keyof typeof stats.ratingDistribution]++
      })

      stats.averageRating = reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length

      const reviewsWithCriteria = reviews.filter(
        (r) => r.punctualityRating && r.qualityRating && r.communicationRating && r.valueRating,
      )

      if (reviewsWithCriteria.length > 0) {
        stats.criteriaAverages.punctuality =
          reviewsWithCriteria.reduce((sum, r) => sum + (r.punctualityRating || 0), 0) / reviewsWithCriteria.length
        stats.criteriaAverages.quality =
          reviewsWithCriteria.reduce((sum, r) => sum + (r.qualityRating || 0), 0) / reviewsWithCriteria.length
        stats.criteriaAverages.communication =
          reviewsWithCriteria.reduce((sum, r) => sum + (r.communicationRating || 0), 0) / reviewsWithCriteria.length
        stats.criteriaAverages.value =
          reviewsWithCriteria.reduce((sum, r) => sum + (r.valueRating || 0), 0) / reviewsWithCriteria.length
      }

      return stats
    } catch (error) {
      console.error("Erreur lors du calcul des statistiques:", error)
      throw new Error(`Erreur de calcul: ${error instanceof Error ? error.message : "Erreur inconnue"}`)
    }
  },

  async getRecentReviews(limitCount = 10): Promise<Review[]> {
    try {
      const querySnapshot = await getDocs(collection(db, "reviews"))

      const reviews = querySnapshot.docs.map((doc) => {
        const data = doc.data()
        return {
          id: doc.id,
          ...convertFirestoreDate(data),
        }
      }) as Review[]

      return reviews
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, limitCount)
    } catch (error) {
      console.error("Erreur lors de la récupération des avis récents:", error)
      throw new Error(`Erreur de récupération: ${error instanceof Error ? error.message : "Erreur inconnue"}`)
    }
  },
}

import type { Service, Provider, SearchFilters } from "../types"
import { serviceService, providerService } from "./firebaseService"

export interface SearchResult {
  service: Service
  provider: Provider
  relevanceScore: number
  distance?: number
}

export class SearchService {
  private static instance: SearchService
  private servicesCache: Service[] = []
  private providersCache: Provider[] = []
  private lastCacheUpdate = 0
  private readonly CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

  static getInstance(): SearchService {
    if (!SearchService.instance) {
      SearchService.instance = new SearchService()
    }
    return SearchService.instance
  }

  private async updateCache(): Promise<void> {
    const now = Date.now()
    if (now - this.lastCacheUpdate < this.CACHE_DURATION) {
      return // Cache encore valide
    }

    try {
      console.log("🔄 Mise à jour du cache de recherche...")

      // Charger tous les prestataires actifs
      this.providersCache = await providerService.getAll()

      // Charger tous les services actifs
      this.servicesCache = []
      for (const provider of this.providersCache) {
        if (provider.id) {
          const providerServices = await serviceService.getByProvider(provider.id)
          this.servicesCache.push(...providerServices)
        }
      }

      this.lastCacheUpdate = now
      console.log(
        `✅ Cache mis à jour: ${this.servicesCache.length} services, ${this.providersCache.length} prestataires`,
      )
    } catch (error) {
      console.error("❌ Erreur lors de la mise à jour du cache:", error)
      throw error
    }
  }

  async search(filters: SearchFilters): Promise<SearchResult[]> {
    try {
      console.log("🔍 Recherche avec filtres:", filters)

      // Mettre à jour le cache si nécessaire
      await this.updateCache()

      let results: SearchResult[] = []

      // Créer les résultats de base
      for (const service of this.servicesCache) {
        const provider = this.providersCache.find((p) => p.id === service.providerId)
        if (!provider) continue

        results.push({
          service,
          provider,
          relevanceScore: 0,
          distance: 0, // TODO: Calculer la vraie distance
        })
      }

      // Appliquer les filtres
      results = this.applyFilters(results, filters)

      // Calculer les scores de pertinence
      results = this.calculateRelevanceScores(results, filters)

      // Trier les résultats
      results = this.sortResults(results, filters.sortBy)

      console.log(`✅ Recherche terminée: ${results.length} résultats`)
      return results
    } catch (error) {
      console.error("❌ Erreur lors de la recherche:", error)
      throw error
    }
  }

  // Méthode pour la compatibilité avec ClientDashboard
  async searchServices(
    filters: SearchFilters,
    services: Service[],
    providers: Provider[],
  ): Promise<{ services: Service[] }> {
    try {
      // Utiliser les données passées en paramètre plutôt que le cache
      this.servicesCache = services
      this.providersCache = providers

      const results = await this.search(filters)

      return {
        services: results.map((result) => result.service),
      }
    } catch (error) {
      console.error("❌ Erreur lors de searchServices:", error)
      return { services: [] }
    }
  }

  private applyFilters(results: SearchResult[], filters: SearchFilters): SearchResult[] {
    return results.filter(({ service, provider }) => {
      // Filtre par requête textuelle
      if (filters.query) {
        const query = filters.query.toLowerCase()
        const searchableText = [
          service.title,
          service.description,
          service.category,
          ...(service.tags || []),
          provider.prenom,
          provider.nom,
          provider.specifications,
        ]
          .join(" ")
          .toLowerCase()

        if (!searchableText.includes(query)) {
          return false
        }
      }

      // Filtre par catégories
      if (filters.categories.length > 0) {
        if (!filters.categories.includes(service.category)) {
          return false
        }
      }

      // Filtre par prix
      if (service.price < filters.priceRange[0] || service.price > filters.priceRange[1]) {
        return false
      }

      // Filtre par note
      if (filters.minRating > 0) {
        const rating = service.averageRating || provider.rating || 0
        if (rating < filters.minRating) {
          return false
        }
      }

      // Filtre par localisation
      if (filters.location.ville) {
        if (provider.ville !== filters.location.ville) {
          return false
        }
      }

      if (filters.location.quartier) {
        if (provider.quartier !== filters.location.quartier) {
          return false
        }
      }

      // Filtre par disponibilité
      if (filters.availability.isUrgentAvailable && !service.isUrgentAvailable) {
        return false
      }

      if (filters.availability.isGroupService && !service.isGroupService) {
        return false
      }

      // Filtre par lieu de prestation
      if (filters.availability.location.length > 0) {
        if (!service.location || !filters.availability.location.includes(service.location)) {
          return false
        }
      }

      return true
    })
  }

  private calculateRelevanceScores(results: SearchResult[], filters: SearchFilters): SearchResult[] {
    return results.map((result) => {
      let score = 0
      const { service, provider } = result

      // Score basé sur la requête textuelle
      if (filters.query) {
        const query = filters.query.toLowerCase()

        // Titre exact = +50 points
        if (service.title.toLowerCase().includes(query)) {
          score += 50
        }

        // Catégorie = +30 points
        if (service.category.toLowerCase().includes(query)) {
          score += 30
        }

        // Tags = +20 points par tag
        if (service.tags) {
          service.tags.forEach((tag) => {
            if (tag.toLowerCase().includes(query)) {
              score += 20
            }
          })
        }

        // Nom du prestataire = +15 points
        if (`${provider.prenom} ${provider.nom}`.toLowerCase().includes(query)) {
          score += 15
        }

        // Description = +10 points
        if (service.description.toLowerCase().includes(query)) {
          score += 10
        }
      }

      // Score basé sur la qualité
      const rating = service.averageRating || provider.rating || 0
      score += rating * 10 // +10 points par étoile

      // Score basé sur le nombre d'avis
      const reviewCount = service.totalReviews || provider.completedJobs || 0
      score += Math.min(reviewCount * 2, 20) // Max +20 points

      // Score basé sur l'expérience du prestataire
      if (provider.experience) {
        score += Math.min(provider.experience * 3, 15) // Max +15 points
      }

      // Bonus pour les services urgents si recherché
      if (filters.availability.isUrgentAvailable && service.isUrgentAvailable) {
        score += 25
      }

      // Bonus pour les services de groupe si recherché
      if (filters.availability.isGroupService && service.isGroupService) {
        score += 25
      }

      // Bonus pour la localisation exacte
      if (filters.location.ville && provider.ville === filters.location.ville) {
        score += 20
        if (filters.location.quartier && provider.quartier === filters.location.quartier) {
          score += 30
        }
      }

      return {
        ...result,
        relevanceScore: score,
      }
    })
  }

  private sortResults(results: SearchResult[], sortBy: SearchFilters["sortBy"]): SearchResult[] {
    return results.sort((a, b) => {
      switch (sortBy) {
        case "price-asc":
          return a.service.price - b.service.price

        case "price-desc":
          return b.service.price - a.service.price

        case "rating":
          const ratingA = a.service.averageRating || a.provider.rating || 0
          const ratingB = b.service.averageRating || b.provider.rating || 0
          return ratingB - ratingA

        case "distance":
          return (a.distance || 0) - (b.distance || 0)

        case "newest":
          return new Date(b.service.createdAt).getTime() - new Date(a.service.createdAt).getTime()

        case "relevance":
        default:
          return b.relevanceScore - a.relevanceScore
      }
    })
  }

  // Méthodes utilitaires
  async getPopularCategories(): Promise<{ category: string; count: number }[]> {
    await this.updateCache()

    const categoryCount: { [key: string]: number } = {}

    this.servicesCache.forEach((service) => {
      categoryCount[service.category] = (categoryCount[service.category] || 0) + 1
    })

    return Object.entries(categoryCount)
      .map(([category, count]) => ({ category, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)
  }

  async getPopularServices(limit = 10): Promise<SearchResult[]> {
    await this.updateCache()

    const results: SearchResult[] = []

    for (const service of this.servicesCache) {
      const provider = this.providersCache.find((p) => p.id === service.providerId)
      if (!provider) continue

      results.push({
        service,
        provider,
        relevanceScore: (service.averageRating || 0) * (service.totalReviews || 0),
        distance: 0,
      })
    }

    return results.sort((a, b) => b.relevanceScore - a.relevanceScore).slice(0, limit)
  }

  clearCache(): void {
    this.servicesCache = []
    this.providersCache = []
    this.lastCacheUpdate = 0
    console.log("🗑️ Cache de recherche vidé")
  }
}

export const searchService = SearchService.getInstance()

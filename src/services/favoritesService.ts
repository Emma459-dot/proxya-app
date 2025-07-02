// Service pour gérer les favoris des clients
export class FavoritesService {
  private static STORAGE_KEY = "proxya_favorites"

  // Obtenir tous les favoris d'un client
  static getFavorites(clientId: string): string[] {
    try {
      const favorites = localStorage.getItem(`${this.STORAGE_KEY}_${clientId}`)
      return favorites ? JSON.parse(favorites) : []
    } catch (error) {
      console.error("Erreur lors de la récupération des favoris:", error)
      return []
    }
  }

  // Ajouter un service aux favoris
  static addFavorite(clientId: string, serviceId: string): void {
    try {
      const favorites = this.getFavorites(clientId)
      if (!favorites.includes(serviceId)) {
        favorites.push(serviceId)
        localStorage.setItem(`${this.STORAGE_KEY}_${clientId}`, JSON.stringify(favorites))
      }
    } catch (error) {
      console.error("Erreur lors de l'ajout aux favoris:", error)
    }
  }

  // Retirer un service des favoris
  static removeFavorite(clientId: string, serviceId: string): void {
    try {
      const favorites = this.getFavorites(clientId)
      const updatedFavorites = favorites.filter((id) => id !== serviceId)
      localStorage.setItem(`${this.STORAGE_KEY}_${clientId}`, JSON.stringify(updatedFavorites))
    } catch (error) {
      console.error("Erreur lors de la suppression des favoris:", error)
    }
  }

  // Vérifier si un service est en favori
  static isFavorite(clientId: string, serviceId: string): boolean {
    const favorites = this.getFavorites(clientId)
    return favorites.includes(serviceId)
  }

  // Basculer l'état favori d'un service
  static toggleFavorite(clientId: string, serviceId: string): boolean {
    const isFav = this.isFavorite(clientId, serviceId)
    if (isFav) {
      this.removeFavorite(clientId, serviceId)
      return false
    } else {
      this.addFavorite(clientId, serviceId)
      return true
    }
  }
}

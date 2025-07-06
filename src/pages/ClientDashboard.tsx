"use client"

import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import {
  User,
  Search,
  Calendar,
  MessageSquare,
  Star,
  MapPin,
  LogOut,
  Filter,
  Heart,
  Clock,
  Eye,
  ToggleLeft,
  ToggleRight,
  AlertCircle,
  Bot,
  Navigation,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import ThemeToggle from "../components/ThemeToggle"
import AdvancedSearch from "../components/AdvancedSearch"
import GeolocationService from "../components/GeolocationService"
import { useAuth } from "../context/AuthContext"
import { bookingService, providerService, serviceService, messageService } from "../services/firebaseService"
import { searchService } from "../services/searchService"
import { formatPrice } from "../utils/currency"
import { FavoritesService } from "../services/favoritesService"
import type { Client, Booking, Provider, Service, SearchFilters } from "../types"

const ClientDashboard = () => {
  const navigate = useNavigate()
  const { currentUser, userType, logout } = useAuth()
  const [bookings, setBookings] = useState<Booking[]>([])
  const [providers, setProviders] = useState<Provider[]>([])
  const [services, setServices] = useState<Service[]>([])
  const [filteredServices, setFilteredServices] = useState<Service[]>([])
  const [favoriteServices, setFavoriteServices] = useState<Service[]>([])
  const [favorites, setFavorites] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSearching, setIsSearching] = useState(false)
  const [activeTab, setActiveTab] = useState("discover")
  const [searchQuery, setSearchQuery] = useState("")
  const [unreadMessages, setUnreadMessages] = useState(0)
  const [useAdvancedSearch, setUseAdvancedSearch] = useState(false)
  const [useGeolocation, setUseGeolocation] = useState(false)
  const [error, setError] = useState<string>("")

  const client = currentUser as Client

  useEffect(() => {
    console.log("ClientDashboard - useEffect déclenché", { currentUser, userType })
    if (!currentUser || userType !== "client") {
      console.log("Redirection vers login - utilisateur non connecté ou mauvais type")
      navigate("/client/login")
      return
    }
    loadData()
  }, [])

  useEffect(() => {
    if (!currentUser || userType !== "client") {
      navigate("/client/login")
    }
  }, [currentUser, userType, navigate])

  // Charger les favoris quand les services changent
  useEffect(() => {
    if (client?.id && services.length > 0) {
      const clientFavorites = FavoritesService.getFavorites(client.id)
      setFavorites(clientFavorites)
      // Filtrer les services favoris
      const favServices = services.filter((service) => clientFavorites.includes(service.id!))
      setFavoriteServices(favServices)
    }
  }, [client?.id, services])

  const loadData = async () => {
    try {
      console.log("Début du chargement des données client...")
      setIsLoading(true)
      setError("")

      if (!client?.id) {
        console.error("ID client manquant")
        setError("Erreur: ID client manquant")
        return
      }

      console.log("Chargement des données pour le client:", client.id)

      const [clientBookings, allProviders, unreadCount] = await Promise.allSettled([
        bookingService.getByClient(client.id),
        providerService.getAll(),
        messageService.countUnreadMessages(client.id),
      ])

      if (clientBookings.status === "fulfilled") {
        setBookings(clientBookings.value)
        console.log("Réservations chargées:", clientBookings.value.length)
      } else {
        console.error("Erreur chargement réservations:", clientBookings.reason)
        setBookings([])
      }

      if (allProviders.status === "fulfilled") {
        setProviders(allProviders.value)
        console.log("Prestataires chargés:", allProviders.value.length)

        try {
          const allServices: Service[] = []
          for (const provider of allProviders.value) {
            if (provider.id) {
              try {
                const providerServices = await serviceService.getByProvider(provider.id)
                allServices.push(...providerServices)
              } catch (serviceError) {
                console.error(`Erreur chargement services pour ${provider.id}:`, serviceError)
              }
            }
          }
          setServices(allServices)
          setFilteredServices(allServices)
          console.log("Services chargés:", allServices.length)
        } catch (servicesError) {
          console.error("Erreur générale chargement services:", servicesError)
          setServices([])
          setFilteredServices([])
        }
      } else {
        console.error("Erreur chargement prestataires:", allProviders.reason)
        setProviders([])
        setServices([])
        setFilteredServices([])
      }

      if (unreadCount.status === "fulfilled") {
        setUnreadMessages(unreadCount.value)
      } else {
        console.error("Erreur comptage messages:", unreadCount.reason)
        setUnreadMessages(0)
      }

      console.log("Chargement des données terminé avec succès")
    } catch (error) {
      console.error("Erreur lors du chargement des données:", error)
      setError("Erreur lors du chargement des données. Veuillez rafraîchir la page.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogout = () => {
    logout()
    navigate("/")
  }

  // Basculer l'état favori d'un service
  const toggleFavorite = (serviceId: string) => {
    if (!client?.id) return

    const isNowFavorite = FavoritesService.toggleFavorite(client.id, serviceId)
    const updatedFavorites = FavoritesService.getFavorites(client.id)
    setFavorites(updatedFavorites)

    // Mettre à jour les services favoris
    const favServices = services.filter((service) => updatedFavorites.includes(service.id!))
    setFavoriteServices(favServices)
  }

  const handleSimpleSearch = (query: string) => {
    setSearchQuery(query)
    if (!query.trim()) {
      setFilteredServices(services)
      return
    }

    const filtered = services.filter(
      (service) =>
        service.title.toLowerCase().includes(query.toLowerCase()) ||
        service.category.toLowerCase().includes(query.toLowerCase()) ||
        service.tags?.some((tag) => tag.toLowerCase().includes(query.toLowerCase())),
    )
    setFilteredServices(filtered)
  }

  const handleAdvancedSearch = async (filters: SearchFilters) => {
    setIsSearching(true)
    try {
      const results = await searchService.searchServices(filters, services, providers)
      setFilteredServices(results.services)
    } catch (error) {
      console.error("Erreur lors de la recherche avancée:", error)
      setFilteredServices([])
    } finally {
      setIsSearching(false)
    }
  }

  const handleGeolocationSearch = (nearbyServices: Service[]) => {
    setFilteredServices(nearbyServices)
  }

  const resetToOriginalServices = () => {
    setFilteredServices(services)
    setSearchQuery("")
    setUseAdvancedSearch(false)
    setUseGeolocation(false)
  }

  const getStatusColor = (status: Booking["status"]) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400"
      case "confirmed":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400"
      case "completed":
        return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400"
      case "cancelled":
        return "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400"
    }
  }

  const getStatusText = (status: Booking["status"]) => {
    switch (status) {
      case "pending":
        return "En attente"
      case "confirmed":
        return "Confirmée"
      case "completed":
        return "Terminée"
      case "cancelled":
        return "Annulée"
      default:
        return status
    }
  }

  const getProviderForService = (serviceProviderId: string) => {
    return providers.find((p) => p.id === serviceProviderId)
  }

  const getServiceImage = (service: Service) => {
    if (service.images && service.images.length > 0) {
      return service.images[0]
    }
    return `/placeholder.svg?height=64&width=64&text=${encodeURIComponent(service.category)}`
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-stone-50 dark:bg-slate-900 flex items-center justify-center px-4">
        <div className="text-center max-w-sm mx-auto">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 dark:border-white mx-auto mb-4"></div>
          <p className="text-slate-600 dark:text-slate-400">Chargement de votre espace client...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-stone-50 dark:bg-slate-900 flex items-center justify-center px-4">
        <div className="text-center max-w-sm mx-auto p-6">
          <div className="text-red-500 mb-4">
            <AlertCircle size={48} className="mx-auto" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Erreur de chargement</h2>
          <p className="text-slate-600 dark:text-slate-400 mb-4">{error}</p>
          <div className="flex gap-2 justify-center">
            <Button onClick={() => window.location.reload()} className="bg-indigo-600 hover:bg-indigo-700 text-white">
              Rafraîchir
            </Button>
            <Button onClick={handleLogout} variant="outline">
              Se déconnecter
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-slate-900">
      <ThemeToggle />

      {/* Header fixe avec largeur réduite */}
      <div className="sticky top-0 z-50 bg-white dark:bg-slate-800 border-b border-stone-200 dark:border-slate-700 shadow-sm">
        <div className="max-w-sm mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-indigo-600 text-white dark:bg-white dark:text-slate-900 text-sm">
                  {client?.prenom?.[0] || "C"}
                  {client?.nom?.[0] || "L"}
                </AvatarFallback>
              </Avatar>
              <div>
                <h1 className="font-semibold text-slate-900 dark:text-white text-sm">
                  {client?.prenom || "Client"} {client?.nom || ""}
                </h1>
                <p className="text-xs text-slate-600 dark:text-slate-400">Client</p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate("/ai-chat")}
                className="h-8 w-8 text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400"
                title="Assistant IA"
              >
                <Bot size={16} />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleLogout}
                className="h-8 w-8 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              >
                <LogOut size={16} />
              </Button>
            </div>
          </div>
        </div>

        {/* Navigation compacte */}
        <div className="max-w-sm mx-auto px-4 pb-3">
          <div className="flex gap-1 overflow-x-auto scrollbar-hide">
            {[
              { id: "discover", label: "Découvrir", icon: Search },
              { id: "favorites", label: "Favoris", icon: Heart, badge: favorites.length },
              { id: "bookings", label: "Réservations", icon: Calendar },
              { id: "messages", label: "Messages", icon: MessageSquare, badge: unreadMessages },
              { id: "profile", label: "Profil", icon: User },
            ].map((tab) => (
              <Button
                key={tab.id}
                variant={activeTab === tab.id ? "default" : "ghost"}
                size="sm"
                onClick={() => {
                  if (tab.id === "messages") {
                    navigate("/messages")
                  } else {
                    setActiveTab(tab.id)
                  }
                }}
                className={`flex items-center gap-1 whitespace-nowrap text-xs px-2 py-1 h-7 ${
                  activeTab === tab.id
                    ? "bg-indigo-600 text-white dark:bg-white dark:text-slate-900"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                } relative`}
              >
                <tab.icon size={14} />
                <span className="hidden sm:inline">{tab.label}</span>
                {tab.badge && tab.badge > 0 && (
                  <Badge className="absolute -top-1 -right-1 h-4 w-4 flex items-center justify-center p-0 bg-red-500 text-white text-xs">
                    {tab.badge > 9 ? "9+" : tab.badge}
                  </Badge>
                )}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Contenu principal avec largeur réduite */}
      <div className="max-w-sm mx-auto px-4 py-4">
        {activeTab === "discover" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Découvrir</h2>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={resetToOriginalServices}
                  className="text-xs h-6 px-2"
                  title="Réinitialiser"
                >
                  Reset
                </Button>
              </div>
            </div>

            {/* Options de recherche */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-600 dark:text-slate-400">Simple</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setUseAdvancedSearch(!useAdvancedSearch)
                    if (useGeolocation) setUseGeolocation(false)
                  }}
                  className="p-1"
                >
                  {useAdvancedSearch ? (
                    <ToggleRight size={20} className="text-indigo-600" />
                  ) : (
                    <ToggleLeft size={20} className="text-slate-400" />
                  )}
                </Button>
                <span className="text-xs text-slate-600 dark:text-slate-400">Avancé</span>
              </div>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setUseGeolocation(!useGeolocation)
                  if (useAdvancedSearch) setUseAdvancedSearch(false)
                }}
                className={`p-1 ${useGeolocation ? "text-indigo-600" : "text-slate-400"}`}
                title="Recherche par géolocalisation"
              >
                <Navigation size={16} />
              </Button>
            </div>

            {/* Recherche simple */}
            {!useAdvancedSearch && !useGeolocation && (
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
                  <Input
                    placeholder="Rechercher un service..."
                    value={searchQuery}
                    onChange={(e) => handleSimpleSearch(e.target.value)}
                    className="pl-10 bg-white dark:bg-slate-800 border-stone-200 dark:border-slate-700 text-sm h-9"
                  />
                </div>
                <Button
                  variant="outline"
                  onClick={() => setUseAdvancedSearch(true)}
                  className="border-stone-200 dark:border-slate-700 text-xs h-9 px-3"
                >
                  <Filter size={14} />
                </Button>
              </div>
            )}

            {/* Recherche avancée */}
            {useAdvancedSearch && (
              <AdvancedSearch
                onFiltersChange={handleAdvancedSearch}
                isLoading={isSearching}
                resultCount={filteredServices.length}
              />
            )}

            {/* Géolocalisation */}
            {useGeolocation && (
              <GeolocationService
                services={services}
                providers={providers}
                onNearbyServicesFound={handleGeolocationSearch}
              />
            )}

            {/* Catégories populaires */}
            {!useAdvancedSearch && !useGeolocation && (
              <div>
                <h3 className="font-semibold mb-2 text-slate-900 dark:text-white text-sm">Catégories populaires</h3>
                <div className="flex flex-wrap gap-1">
                  {["Beauté/Esthétique", "Alimentation", "Éducation", "Événementiel", "Maintenance"].map((category) => (
                    <Button
                      key={category}
                      variant="outline"
                      size="sm"
                      onClick={() => handleSimpleSearch(category)}
                      className="border-stone-200 dark:border-slate-700 text-xs h-7 px-2"
                    >
                      {category}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            <div>
              <h3 className="font-semibold mb-3 text-slate-900 dark:text-white text-sm">
                Services disponibles
                {(isSearching || isLoading) && (
                  <div className="inline-flex items-center ml-2">
                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-indigo-600"></div>
                  </div>
                )}
              </h3>

              {filteredServices.length === 0 ? (
                <Card className="bg-white dark:bg-slate-800 border-stone-200 dark:border-slate-700">
                  <CardContent className="text-center py-8">
                    <Search className="h-12 w-12 text-slate-400 mx-auto mb-3" />
                    <h3 className="text-lg font-semibold mb-2 text-slate-900 dark:text-white">Aucun service trouvé</h3>
                    <p className="text-slate-600 dark:text-slate-400 mb-4 text-sm">
                      {useAdvancedSearch || useGeolocation
                        ? "Essayez de modifier vos critères de recherche."
                        : "Essayez de modifier votre recherche."}
                    </p>
                    <Button
                      onClick={resetToOriginalServices}
                      variant="outline"
                      className="border-stone-200 dark:border-slate-700 text-xs h-8 px-3 bg-transparent"
                    >
                      Voir tous les services
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-3">
                  {filteredServices.map((service) => {
                    const provider = getProviderForService(service.providerId)
                    if (!provider) return null

                    const isFavorite = favorites.includes(service.id!)

                    return (
                      <Card
                        key={service.id}
                        className="hover:shadow-lg transition-shadow cursor-pointer bg-white dark:bg-slate-800 border-stone-200 dark:border-slate-700"
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start gap-3">
                            <div className="w-16 h-16 bg-stone-100 dark:bg-slate-700 rounded-lg overflow-hidden flex-shrink-0">
                              <img
                                src={getServiceImage(service) || "/placeholder.svg"}
                                alt={service.title}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement
                                  target.src = `/placeholder.svg?height=64&width=64&text=Service`
                                }}
                              />
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between mb-2">
                                <div className="flex-1 min-w-0">
                                  <h3 className="font-semibold text-slate-900 dark:text-white text-sm truncate">
                                    {service.title}
                                  </h3>
                                  <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400 mb-1">
                                    <span className="truncate">
                                      {provider.prenom} {provider.nom}
                                    </span>
                                    <div className="flex items-center gap-1">
                                      <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                                      <span className="font-medium">
                                        {service.averageRating || provider.rating || 5.0}
                                      </span>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
                                    <Clock size={10} />
                                    <span>{service.duration}min</span>
                                    <MapPin size={10} />
                                    <span className="truncate">
                                      {service.location === "domicile"
                                        ? "À domicile"
                                        : service.location === "salon"
                                          ? "En salon"
                                          : "Les deux"}
                                    </span>
                                  </div>
                                </div>

                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => toggleFavorite(service.id!)}
                                  className={`h-6 w-6 flex-shrink-0 ${
                                    isFavorite ? "text-red-500 hover:text-red-600" : "text-slate-400 hover:text-red-500"
                                  }`}
                                >
                                  <Heart size={14} className={isFavorite ? "fill-current" : ""} />
                                </Button>
                              </div>

                              <div className="flex flex-wrap gap-1 mb-2">
                                <Badge
                                  variant="secondary"
                                  className="text-xs bg-stone-200 text-slate-900 dark:bg-slate-700 dark:text-slate-300"
                                >
                                  {service.category}
                                </Badge>
                                {service.isUrgentAvailable && (
                                  <Badge variant="outline" className="text-xs border-yellow-400 text-yellow-600">
                                    Urgent
                                  </Badge>
                                )}
                              </div>

                              <p className="text-xs text-slate-600 dark:text-slate-400 mb-3 line-clamp-2">
                                {service.description}
                              </p>

                              <div className="flex items-center justify-between">
                                <div className="flex gap-1">
                                  <Button
                                    size="sm"
                                    onClick={() => navigate(`/client/book-service/${service.id}`)}
                                    className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs h-7 px-2"
                                  >
                                    Réserver
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="border-stone-200 dark:border-slate-700 text-xs h-7 px-2 bg-transparent"
                                    onClick={() => navigate(`/messages/${provider.id}`)}
                                  >
                                    <MessageSquare size={12} />
                                  </Button>
                                  <Button
                                    size="sm"
                                    onClick={() => navigate(`/client/service-view/${service.id}`)}
                                    variant="outline"
                                    className="border-stone-200 dark:border-slate-700 text-xs h-7 px-2"
                                  >
                                    <Eye size={12} />
                                  </Button>
                                </div>

                                <div className="text-right">
                                  <div className="text-sm font-bold text-slate-900 dark:text-white">
                                    {formatPrice(service.price)}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "favorites" && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Mes Favoris ({favorites.length})</h2>

            {favoriteServices.length === 0 ? (
              <Card className="bg-white dark:bg-slate-800 border-stone-200 dark:border-slate-700">
                <CardContent className="text-center py-8">
                  <Heart className="h-12 w-12 text-slate-400 mx-auto mb-3" />
                  <h3 className="text-lg font-semibold mb-2 text-slate-900 dark:text-white">Aucun favori</h3>
                  <p className="text-slate-600 dark:text-slate-400 mb-4 text-sm">
                    Ajoutez des services à vos favoris en cliquant sur le cœur ❤️
                  </p>
                  <Button
                    onClick={() => setActiveTab("discover")}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs h-8 px-3"
                  >
                    <Search size={12} className="mr-1" />
                    Découvrir
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {favoriteServices.map((service) => {
                  const provider = getProviderForService(service.providerId)
                  if (!provider) return null

                  return (
                    <Card
                      key={service.id}
                      className="hover:shadow-lg transition-shadow cursor-pointer bg-white dark:bg-slate-800 border-stone-200 dark:border-slate-700"
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <div className="w-16 h-16 bg-stone-100 dark:bg-slate-700 rounded-lg overflow-hidden flex-shrink-0">
                            <img
                              src={getServiceImage(service) || "/placeholder.svg"}
                              alt={service.title}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement
                                target.src = `/placeholder.svg?height=64&width=64&text=Service`
                              }}
                            />
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex-1 min-w-0">
                                <h3 className="font-semibold text-slate-900 dark:text-white text-sm truncate">
                                  {service.title}
                                </h3>
                                <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400 mb-1">
                                  <span className="truncate">
                                    {provider.prenom} {provider.nom}
                                  </span>
                                  <div className="flex items-center gap-1">
                                    <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                                    <span className="font-medium">
                                      {service.averageRating || provider.rating || 5.0}
                                    </span>
                                  </div>
                                </div>
                              </div>

                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => toggleFavorite(service.id!)}
                                className="h-6 w-6 text-red-500 hover:text-red-600 flex-shrink-0"
                              >
                                <Heart size={14} className="fill-current" />
                              </Button>
                            </div>

                            <p className="text-xs text-slate-600 dark:text-slate-400 mb-3 line-clamp-2">
                              {service.description}
                            </p>

                            <div className="flex items-center justify-between">
                              <div className="flex gap-1">
                                <Button
                                  size="sm"
                                  onClick={() => navigate(`/client/book-service/${service.id}`)}
                                  className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs h-7 px-2"
                                >
                                  Réserver
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="border-stone-200 dark:border-slate-700 text-xs h-7 px-2 bg-transparent"
                                  onClick={() => navigate(`/messages/${provider.id}`)}
                                >
                                  <MessageSquare size={12} />
                                </Button>
                              </div>

                              <div className="text-right">
                                <div className="text-sm font-bold text-slate-900 dark:text-white">
                                  {formatPrice(service.price)}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {activeTab === "bookings" && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Mes Réservations</h2>

            {bookings.length === 0 ? (
              <Card className="bg-white dark:bg-slate-800 border-stone-200 dark:border-slate-700">
                <CardContent className="text-center py-8">
                  <Calendar className="h-12 w-12 text-slate-400 mx-auto mb-3" />
                  <h3 className="text-lg font-semibold mb-2 text-slate-900 dark:text-white">Aucune réservation</h3>
                  <p className="text-slate-600 dark:text-slate-400 mb-4 text-sm">
                    Vous n'avez pas encore effectué de réservation.
                  </p>
                  <Button
                    onClick={() => setActiveTab("discover")}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs h-8 px-3"
                  >
                    <Search size={12} className="mr-1" />
                    Découvrir
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {bookings.map((booking) => (
                  <Card key={booking.id} className="bg-white dark:bg-slate-800 border-stone-200 dark:border-slate-700">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-slate-900 dark:text-white text-sm">
                              #{booking.id?.slice(-6)}
                            </h3>
                            <Badge className={getStatusColor(booking.status)}>{getStatusText(booking.status)}</Badge>
                            {booking.isUrgent && (
                              <Badge variant="outline" className="border-yellow-400 text-yellow-600 text-xs">
                                Urgent
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-3 text-xs text-slate-600 dark:text-slate-400">
                            <div className="flex items-center gap-1">
                              <Calendar size={12} />
                              {new Date(booking.date).toLocaleDateString()}
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock size={12} />
                              {booking.time}
                            </div>
                          </div>
                        </div>

                        <div className="text-right">
                          <div className="text-lg font-bold text-slate-900 dark:text-white">
                            {formatPrice(booking.totalPrice)}
                          </div>
                        </div>
                      </div>

                      {booking.notes && (
                        <div className="mb-3">
                          <h4 className="font-medium mb-1 text-slate-900 dark:text-white text-xs">Vos notes :</h4>
                          <p className="text-xs text-slate-600 dark:text-slate-400">{booking.notes}</p>
                        </div>
                      )}

                      <div className="flex flex-wrap gap-2">
                        {booking.status === "completed" && !booking.hasReview && (
                          <Button
                            size="sm"
                            onClick={() => navigate(`/client/review/${booking.id}`)}
                            className="bg-yellow-500 hover:bg-yellow-600 text-white text-xs h-7 px-2"
                          >
                            <Star size={12} className="mr-1" />
                            Avis
                          </Button>
                        )}

                        {booking.status === "completed" && booking.hasReview && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-green-400 text-green-600 text-xs h-7 px-2 bg-transparent"
                            disabled
                          >
                            <Star size={12} className="mr-1 fill-green-600" />
                            Avis laissé
                          </Button>
                        )}

                        <Button
                          variant="outline"
                          size="sm"
                          className="border-stone-200 dark:border-slate-700 text-xs h-7 px-2 bg-transparent"
                          onClick={() => navigate(`/messages/${booking.providerId}`)}
                        >
                          <MessageSquare size={12} className="mr-1" />
                          Contact
                        </Button>

                        {booking.status === "pending" && (
                          <Button variant="destructive" size="sm" className="text-xs h-7 px-2">
                            Annuler
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "profile" && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Mon Profil</h2>

            <Card className="bg-white dark:bg-slate-800 border-stone-200 dark:border-slate-700">
              <CardHeader className="pb-2">
                <CardTitle className="text-slate-900 dark:text-white text-sm">Informations personnelles</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-slate-900 dark:text-white">Prénom</label>
                    <p className="text-slate-600 dark:text-slate-400 text-sm truncate">
                      {client?.prenom || "Non renseigné"}
                    </p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-900 dark:text-white">Nom</label>
                    <p className="text-slate-600 dark:text-slate-400 text-sm truncate">
                      {client?.nom || "Non renseigné"}
                    </p>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-900 dark:text-white">Email</label>
                  <p className="text-slate-600 dark:text-slate-400 text-sm truncate">
                    {client?.email || "Non renseigné"}
                  </p>
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-900 dark:text-white">Téléphone</label>
                  <p className="text-slate-600 dark:text-slate-400 text-sm">{client?.telephone || "Non renseigné"}</p>
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-900 dark:text-white">Adresse</label>
                  <p className="text-slate-600 dark:text-slate-400 text-sm">{client?.adresse || "Non renseigné"}</p>
                </div>

                <Button className="mt-3 bg-indigo-600 hover:bg-indigo-700 text-white w-full text-xs h-8">
                  Modifier le profil
                </Button>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}

export default ClientDashboard

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
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import ThemeToggle from "../components/ThemeToggle"
import AdvancedSearch from "../components/AdvancedSearch"
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
  const [error, setError] = useState<string>("")

  const client = currentUser as Client

  // Appliquer la couleur de fond au body pour éviter les couleurs parasites
  useEffect(() => {
    const isDark = document.documentElement.classList.contains("dark")
    document.body.style.backgroundColor = isDark ? "#0f172a" : "#ffffff"
    document.documentElement.style.backgroundColor = isDark ? "#0f172a" : "#ffffff"

    return () => {
      document.body.style.backgroundColor = ""
      document.documentElement.style.backgroundColor = ""
    }
  }, [])

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

  const getStatusColor = (status: Booking["status"]) => {
    switch (status) {
      case "pending":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400"
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
    return `/placeholder.svg?height=96&width=96&text=${encodeURIComponent(service.category)}`
  }

  if (isLoading) {
    return (
      <div className="min-h-screen w-full bg-white dark:bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900 dark:border-white mx-auto mb-4"></div>
          <p className="text-slate-600 dark:text-slate-400">Chargement de votre espace client...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen w-full bg-white dark:bg-slate-900 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="text-red-500 mb-4">
            <AlertCircle size={48} className="mx-auto" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Erreur de chargement</h2>
          <p className="text-slate-600 dark:text-slate-400 mb-4">{error}</p>
          <div className="flex gap-2 justify-center">
            <Button
              onClick={() => window.location.reload()}
              className="bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-stone-100 dark:text-slate-900"
            >
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
    <div className="min-h-screen w-full bg-white dark:bg-slate-900" style={{ backgroundColor: "inherit" }}>
      <ThemeToggle />

      {/* Header */}
      <div className="w-full border-b bg-white dark:bg-slate-800 border-stone-200 dark:border-slate-700 relative z-10">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarFallback className="bg-slate-900 text-white dark:bg-white dark:text-slate-900">
                {client?.prenom?.[0] || "C"}
                {client?.nom?.[0] || "L"}
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="font-semibold text-slate-900 dark:text-white">
                {client?.prenom || "Client"} {client?.nom || ""}
              </h1>
              <p className="text-sm text-slate-600 dark:text-slate-400">Client</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/ai-chat")}
              className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              title="Assistant IA"
            >
              <Bot size={20} />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleLogout}
              className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            >
              <LogOut size={20} />
            </Button>
          </div>
        </div>

        {/* Navigation */}
        <div className="w-full bg-white dark:bg-slate-800 border-stone-200 dark:border-slate-700 relative z-10">
          <div className="flex gap-1 px-4 pb-4 overflow-x-auto scrollbar-hide">
            {[
              { id: "discover", label: "Découvrir", icon: Search },
              { id: "favorites", label: "Favoris", icon: Heart, badge: favorites.length },
              { id: "bookings", label: "Mes réservations", icon: Calendar },
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
                className={`flex items-center gap-2 whitespace-nowrap ${
                  activeTab === tab.id
                    ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                } relative`}
              >
                <tab.icon size={16} />
                {tab.label}
                {tab.badge && tab.badge > 0 && (
                  <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 bg-red-500 text-white text-xs">
                    {tab.badge > 9 ? "9+" : tab.badge}
                  </Badge>
                )}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Contenu principal */}
      <div className="w-full p-4 max-w-6xl mx-auto bg-white dark:bg-slate-900">
        {activeTab === "discover" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Découvrir les services</h2>
              <div className="flex items-center gap-3">
                <span className="text-sm text-slate-600 dark:text-slate-400">Recherche simple</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setUseAdvancedSearch(!useAdvancedSearch)}
                  className="p-1"
                >
                  {useAdvancedSearch ? (
                    <ToggleRight size={24} className="text-slate-900 dark:text-white" />
                  ) : (
                    <ToggleLeft size={24} className="text-slate-400" />
                  )}
                </Button>
                <span className="text-sm text-slate-600 dark:text-slate-400">Recherche avancée</span>
              </div>
            </div>

            {!useAdvancedSearch && (
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
                  <Input
                    placeholder="Rechercher un service..."
                    value={searchQuery}
                    onChange={(e) => handleSimpleSearch(e.target.value)}
                    className="pl-10 bg-white dark:bg-slate-800 border-stone-200 dark:border-slate-700"
                  />
                </div>
                <Button
                  variant="outline"
                  onClick={() => setUseAdvancedSearch(true)}
                  className="border-stone-200 dark:border-slate-700"
                >
                  <Filter size={16} className="mr-2" />
                  Filtres avancés
                </Button>
              </div>
            )}

            {useAdvancedSearch && (
              <AdvancedSearch
                onFiltersChange={handleAdvancedSearch}
                isLoading={isSearching}
                resultCount={filteredServices.length}
              />
            )}

            {!useAdvancedSearch && (
              <div>
                <h3 className="font-semibold mb-3 text-slate-900 dark:text-white">Catégories populaires</h3>
                <div className="flex flex-wrap gap-2">
                  {["Beauté/Esthétique", "Alimentation", "Éducation", "Événementiel", "Maintenance"].map((category) => (
                    <Button
                      key={category}
                      variant="outline"
                      size="sm"
                      onClick={() => handleSimpleSearch(category)}
                      className="border-stone-200 dark:border-slate-700"
                    >
                      {category}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            <div>
              <h3 className="font-semibold mb-3 text-slate-900 dark:text-white">
                Services disponibles
                {(isSearching || isLoading) && (
                  <div className="inline-flex items-center ml-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-slate-900 dark:border-white"></div>
                  </div>
                )}
              </h3>

              {filteredServices.length === 0 ? (
                <Card className="bg-white dark:bg-slate-800 border-stone-200 dark:border-slate-700">
                  <CardContent className="text-center py-12">
                    <Search className="h-16 w-16 text-slate-400 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold mb-2 text-slate-900 dark:text-white">Aucun service trouvé</h3>
                    <p className="text-slate-600 dark:text-slate-400 mb-4">
                      {useAdvancedSearch
                        ? "Essayez de modifier vos critères de recherche."
                        : "Essayez de modifier votre recherche ou utilisez les filtres avancés."}
                    </p>
                    {!useAdvancedSearch && (
                      <Button
                        onClick={() => setUseAdvancedSearch(true)}
                        variant="outline"
                        className="border-stone-200 dark:border-slate-700"
                      >
                        <Filter size={16} className="mr-2" />
                        Essayer la recherche avancée
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4">
                  {filteredServices.map((service) => {
                    const provider = getProviderForService(service.providerId)
                    if (!provider) return null

                    const isFavorite = favorites.includes(service.id!)

                    return (
                      <Card
                        key={service.id}
                        className="hover:shadow-lg transition-shadow cursor-pointer bg-white dark:bg-slate-800 border-stone-200 dark:border-slate-700"
                      >
                        <CardContent className="p-6">
                          <div className="flex items-start gap-4">
                            <div className="w-24 h-24 bg-stone-100 dark:bg-slate-700 rounded-lg overflow-hidden flex-shrink-0">
                              <img
                                src={getServiceImage(service) || "/placeholder.svg"}
                                alt={service.title}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement
                                  target.src = `/placeholder.svg?height=96&width=96&text=Service`
                                }}
                              />
                            </div>

                            <div className="flex-1">
                              <div className="flex items-start justify-between mb-2">
                                <div>
                                  <h3 className="font-semibold text-slate-900 dark:text-white text-lg">
                                    {service.title}
                                  </h3>
                                  <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 mb-1">
                                    <span>
                                      {provider.prenom} {provider.nom}
                                    </span>
                                    <div className="flex items-center gap-1">
                                      <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                                      <span className="font-medium">
                                        {service.averageRating || provider.rating || 5.0}
                                      </span>
                                      {service.totalReviews && service.totalReviews > 0 && (
                                        <span>({service.totalReviews})</span>
                                      )}
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                                    <Clock size={12} />
                                    <span>{service.duration}min</span>
                                    <MapPin size={12} />
                                    <span>
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
                                  className={`${
                                    isFavorite ? "text-red-500 hover:text-red-600" : "text-slate-400 hover:text-red-500"
                                  }`}
                                >
                                  <Heart size={16} className={isFavorite ? "fill-current" : ""} />
                                </Button>
                              </div>

                              <div className="flex flex-wrap gap-1 mb-3">
                                <Badge
                                  variant="secondary"
                                  className="text-xs bg-stone-200 text-slate-900 dark:bg-slate-700 dark:text-slate-300"
                                >
                                  {service.category}
                                </Badge>
                                {service.isUrgentAvailable && (
                                  <Badge variant="outline" className="text-xs border-orange-400 text-orange-600">
                                    Service urgent
                                  </Badge>
                                )}
                                {service.isGroupService && (
                                  <Badge variant="outline" className="text-xs border-blue-400 text-blue-600">
                                    Service de groupe
                                  </Badge>
                                )}
                              </div>

                              <p className="text-sm text-slate-600 dark:text-slate-400 mb-4 line-clamp-2">
                                {service.description}
                              </p>

                              <div className="flex items-center justify-between">
                                <div className="flex gap-2">
                                  <Button
                                    size="sm"
                                    onClick={() => navigate(`/client/book-service/${service.id}`)}
                                    className="bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-stone-100 dark:text-slate-900"
                                  >
                                    Réserver
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="border-stone-200 dark:border-slate-700 bg-transparent"
                                    onClick={() => navigate(`/messages/${provider.id}`)}
                                  >
                                    <MessageSquare size={16} className="mr-2" />
                                    Contacter
                                  </Button>
                                  <Button
                                    size="sm"
                                    onClick={() => navigate(`/client/service-view/${service.id}`)}
                                    variant="outline"
                                    className="border-stone-200 dark:border-slate-700"
                                  >
                                    <Eye size={16} className="mr-2" />
                                    Voir le service
                                  </Button>
                                </div>

                                <div className="text-right">
                                  <div className="text-lg font-bold text-slate-900 dark:text-white">
                                    {formatPrice(service.price)}
                                  </div>
                                  {service.isGroupService && (
                                    <div className="text-xs text-slate-600 dark:text-slate-400">
                                      Réduction groupe disponible
                                    </div>
                                  )}
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
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Mes Favoris ({favorites.length})</h2>

            {favoriteServices.length === 0 ? (
              <Card className="bg-white dark:bg-slate-800 border-stone-200 dark:border-slate-700">
                <CardContent className="text-center py-12">
                  <Heart className="h-16 w-16 text-slate-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2 text-slate-900 dark:text-white">Aucun favori</h3>
                  <p className="text-slate-600 dark:text-slate-400 mb-6">
                    Ajoutez des services à vos favoris en cliquant sur le cœur ❤️
                  </p>
                  <Button
                    onClick={() => setActiveTab("discover")}
                    className="bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-stone-100 dark:text-slate-900"
                  >
                    <Search size={16} className="mr-2" />
                    Découvrir les services
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {favoriteServices.map((service) => {
                  const provider = getProviderForService(service.providerId)
                  if (!provider) return null

                  return (
                    <Card
                      key={service.id}
                      className="hover:shadow-lg transition-shadow cursor-pointer bg-white dark:bg-slate-800 border-stone-200 dark:border-slate-700"
                    >
                      <CardContent className="p-6">
                        <div className="flex items-start gap-4">
                          <div className="w-24 h-24 bg-stone-100 dark:bg-slate-700 rounded-lg overflow-hidden flex-shrink-0">
                            <img
                              src={getServiceImage(service) || "/placeholder.svg"}
                              alt={service.title}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement
                                target.src = `/placeholder.svg?height=96&width=96&text=Service`
                              }}
                            />
                          </div>

                          <div className="flex-1">
                            <div className="flex items-start justify-between mb-2">
                              <div>
                                <h3 className="font-semibold text-slate-900 dark:text-white text-lg">
                                  {service.title}
                                </h3>
                                <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 mb-1">
                                  <span>
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
                                className="text-red-500 hover:text-red-600"
                              >
                                <Heart size={16} className="fill-current" />
                              </Button>
                            </div>

                            <p className="text-sm text-slate-600 dark:text-slate-400 mb-4 line-clamp-2">
                              {service.description}
                            </p>

                            <div className="flex items-center justify-between">
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  onClick={() => navigate(`/client/book-service/${service.id}`)}
                                  className="bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-stone-100 dark:text-slate-900"
                                >
                                  Réserver
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="border-stone-200 dark:border-slate-700 bg-transparent"
                                  onClick={() => navigate(`/messages/${provider.id}`)}
                                >
                                  <MessageSquare size={16} className="mr-2" />
                                  Contacter
                                </Button>
                              </div>

                              <div className="text-right">
                                <div className="text-lg font-bold text-slate-900 dark:text-white">
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
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Mes Réservations</h2>

            {bookings.length === 0 ? (
              <Card className="bg-white dark:bg-slate-800 border-stone-200 dark:border-slate-700">
                <CardContent className="text-center py-12">
                  <Calendar className="h-16 w-16 text-slate-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2 text-slate-900 dark:text-white">Aucune réservation</h3>
                  <p className="text-slate-600 dark:text-slate-400 mb-6">
                    Vous n'avez pas encore effectué de réservation. Découvrez nos services !
                  </p>
                  <Button
                    onClick={() => setActiveTab("discover")}
                    className="bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-stone-100 dark:text-slate-900"
                  >
                    <Search size={16} className="mr-2" />
                    Découvrir les services
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {bookings.map((booking) => (
                  <Card key={booking.id} className="bg-white dark:bg-slate-800 border-stone-200 dark:border-slate-700">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-semibold text-slate-900 dark:text-white">
                              Réservation #{booking.id?.slice(-6)}
                            </h3>
                            <Badge className={getStatusColor(booking.status)}>{getStatusText(booking.status)}</Badge>
                            {booking.isUrgent && (
                              <Badge variant="outline" className="border-orange-400 text-orange-600">
                                Urgent
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-4 text-sm text-slate-600 dark:text-slate-400">
                            <div className="flex items-center gap-1">
                              <Calendar size={14} />
                              {new Date(booking.date).toLocaleDateString()}
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock size={14} />
                              {booking.time}
                            </div>
                            {booking.groupSize && booking.groupSize > 1 && (
                              <div className="flex items-center gap-1">
                                <User size={14} />
                                {booking.groupSize} personnes
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-slate-900 dark:text-white">
                            {formatPrice(booking.totalPrice)}
                          </div>
                          {booking.paymentMethod && (
                            <div className="text-xs text-slate-600 dark:text-slate-400">{booking.paymentMethod}</div>
                          )}
                        </div>
                      </div>

                      {booking.notes && (
                        <div className="mb-4">
                          <h4 className="font-medium mb-1 text-slate-900 dark:text-white">Vos notes :</h4>
                          <p className="text-sm text-slate-600 dark:text-slate-400">{booking.notes}</p>
                        </div>
                      )}
                      <div className="flex gap-2">
                        {booking.status === "completed" && !booking.hasReview && (
                          <Button
                            size="sm"
                            onClick={() => navigate(`/client/review/${booking.id}`)}
                            className="bg-yellow-500 hover:bg-yellow-600 text-white"
                          >
                            <Star size={16} className="mr-2" />
                            Laisser un avis
                          </Button>
                        )}
                        {booking.status === "completed" && booking.hasReview && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-green-400 text-green-600 bg-transparent"
                            disabled
                          >
                            <Star size={16} className="mr-2 fill-green-600" />
                            Avis laissé
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-stone-200 dark:border-slate-700 bg-transparent"
                          onClick={() => navigate(`/messages/${booking.providerId}`)}
                        >
                          <MessageSquare size={16} className="mr-2" />
                          Contacter le prestataire
                        </Button>
                        {booking.status === "pending" && (
                          <Button variant="destructive" size="sm">
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
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Mon Profil</h2>

            <Card className="bg-white dark:bg-slate-800 border-stone-200 dark:border-slate-700">
              <CardHeader>
                <CardTitle className="text-slate-900 dark:text-white">Informations personnelles</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-slate-900 dark:text-white">Prénom</label>
                    <p className="text-slate-600 dark:text-slate-400">{client?.prenom || "Non renseigné"}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-900 dark:text-white">Nom</label>
                    <p className="text-slate-600 dark:text-slate-400">{client?.nom || "Non renseigné"}</p>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-slate-900 dark:text-white">Email</label>
                  <p className="text-slate-600 dark:text-slate-400">{client?.email || "Non renseigné"}</p>
                </div>

                <div>
                  <label className="text-sm font-medium text-slate-900 dark:text-white">Téléphone</label>
                  <p className="text-slate-600 dark:text-slate-400">{client?.telephone || "Non renseigné"}</p>
                </div>

                <div>
                  <label className="text-sm font-medium text-slate-900 dark:text-white">Adresse</label>
                  <p className="text-slate-600 dark:text-slate-400">{client?.adresse || "Non renseigné"}</p>
                </div>

                <Button className="mt-4 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-stone-100 dark:text-slate-900">
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

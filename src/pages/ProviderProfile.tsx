"use client"

import { useState, useEffect } from "react"
import { useNavigate, useParams } from "react-router-dom"
import {
  ArrowLeft,
  Star,
  MapPin,
  Clock,
  Calendar,
  MessageSquare,
  Phone,
  Mail,
  Globe,
  Award,
  Shield,
  CheckCircle,
  Eye,
  Users,
  Zap,
  Heart,
  Share2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import ThemeToggle from "../components/ThemeToggle"
import { useAuth } from "../context/AuthContext"
import { providerService, serviceService, reviewService } from "../services/firebaseService"
import { formatPrice } from "../utils/currency"
import type { Provider, Service, ReviewStats } from "../types"

const ProviderProfile = () => {
  const navigate = useNavigate()
  const { providerId } = useParams()
  const { currentUser, userType } = useAuth()
  const [provider, setProvider] = useState<Provider | null>(null)
  const [services, setServices] = useState<Service[]>([])
  const [reviewStats, setReviewStats] = useState<ReviewStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("about")

  useEffect(() => {
    if (providerId) {
      loadProviderData()
    }
  }, [providerId])

  const loadProviderData = async () => {
    if (!providerId) return

    try {
      setIsLoading(true)

      const [providerData, servicesData, statsData] = await Promise.all([
        providerService.getById(providerId),
        serviceService.getByProvider(providerId),
        reviewService.getProviderStats(providerId),
      ])

      setProvider(providerData)
      setServices(servicesData)
      setReviewStats(statsData)
    } catch (error) {
      console.error("Erreur lors du chargement du profil:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const renderStars = (rating: number, size = "w-4 h-4") => (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`${size} ${
            star <= rating ? "text-yellow-400 fill-yellow-400" : "text-slate-300 dark:text-slate-600"
          }`}
        />
      ))}
    </div>
  )

  const getServiceImage = (service: Service) => {
    if (service.images && service.images.length > 0) {
      return service.images[0]
    }
    return `/placeholder.svg?height=200&width=300&text=${encodeURIComponent(service.category)}`
  }

  // Fonction pour calculer la date d'inscription
  const getMemberSince = (provider: Provider) => {
    if (provider.joinedDate) {
      const joinedDate = new Date(provider.joinedDate)
      const now = new Date()
      const diffTime = Math.abs(now.getTime() - joinedDate.getTime())
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

      if (diffDays < 30) {
        return `${diffDays} jour${diffDays > 1 ? "s" : ""}`
      } else if (diffDays < 365) {
        const months = Math.floor(diffDays / 30)
        return `${months} mois`
      } else {
        const years = Math.floor(diffDays / 365)
        return `${years} an${years > 1 ? "s" : ""}`
      }
    }
    return "1 jour"
  }

  // Fonction pour obtenir l'image du prestataire
  const getProviderImage = (provider: Provider) => {
    if (provider.profileImage) {
      return provider.profileImage
    }
    // Fallback vers une image par défaut basée sur le genre ou les initiales
    return `/placeholder.svg?height=160&width=160&text=${encodeURIComponent(provider.prenom[0] + provider.nom[0])}`
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-stone-50 dark:bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 dark:border-white mx-auto mb-4"></div>
          <p className="text-slate-600 dark:text-slate-400">Chargement du profil...</p>
        </div>
      </div>
    )
  }

  if (!provider) {
    return (
      <div className="min-h-screen bg-stone-50 dark:bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2 text-slate-900 dark:text-white">Prestataire non trouvé</h2>
          <Button onClick={() => navigate(-1)}>Retour</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-slate-900">
      <ThemeToggle />

      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-white dark:bg-slate-800 border-stone-200 dark:border-slate-700">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
        >
          <ArrowLeft size={20} />
          <span className="font-medium">Retour</span>
        </button>

        <div className="text-center">
          <h1 className="text-lg font-bold text-slate-900 dark:text-white">Profil prestataire</h1>
          <p className="text-xs text-slate-600 dark:text-slate-400">PROXYA</p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="text-slate-600 dark:text-slate-400">
            <Heart size={20} />
          </Button>
          <Button variant="ghost" size="icon" className="text-slate-600 dark:text-slate-400">
            <Share2 size={20} />
          </Button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-4 space-y-6">
        {/* Profil principal - MÊME DESIGN QUE MyProfile.tsx */}
        <Card className="bg-white dark:bg-slate-800 border-stone-200 dark:border-slate-700">
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row gap-6">
              {/* Photo et badges */}
              <div className="flex flex-col items-center lg:items-start">
                <div className="relative">
                  <Avatar className="h-32 w-32 lg:h-40 lg:w-40">
                    <AvatarImage
                      src={getProviderImage(provider) || "/placeholder.svg"}
                      alt={`${provider.prenom} ${provider.nom}`}
                      className="object-cover"
                    />
                    <AvatarFallback className="bg-slate-900 text-white dark:bg-white dark:text-slate-900 text-3xl">
                      {provider.prenom[0]}
                      {provider.nom[0]}
                    </AvatarFallback>
                  </Avatar>
                  {/* Badge professionnel */}
                  <div className="absolute -top-2 -right-2">
                    <Badge className="bg-yellow-500 text-white font-bold px-2 py-1 text-xs">PROFESSIONNEL</Badge>
                  </div>
                </div>

                {/* Badges de certification */}
                <div className="flex flex-wrap gap-2 mt-4 justify-center lg:justify-start">
                  <Badge variant="outline" className="border-blue-400 text-blue-600 bg-blue-50 dark:bg-blue-900/20">
                    <Shield size={12} className="mr-1" />
                    Professionnel
                  </Badge>
                  <Badge variant="outline" className="border-green-400 text-green-600 bg-green-50 dark:bg-green-900/20">
                    <CheckCircle size={12} className="mr-1" />
                    Assuré
                  </Badge>
                  {provider.isVerified && (
                    <Badge
                      variant="outline"
                      className="border-purple-400 text-purple-600 bg-purple-50 dark:bg-purple-900/20"
                    >
                      <Award size={12} className="mr-1" />
                      Vérifié
                    </Badge>
                  )}
                </div>
              </div>

              {/* Informations principales */}
              <div className="flex-1">
                <div className="text-center lg:text-left">
                  <h1 className="text-2xl lg:text-3xl font-bold text-slate-900 dark:text-white mb-2">
                    {provider.prenom} {provider.nom}
                  </h1>

                  {provider.businessInfo?.businessName && (
                    <h2 className="text-lg lg:text-xl text-indigo-600 dark:text-indigo-400 font-semibold mb-3">
                      {provider.businessInfo.businessName}
                    </h2>
                  )}

                  {/* Note et avis */}
                  <div className="flex items-center justify-center lg:justify-start gap-2 mb-4">
                    {renderStars(Math.round(reviewStats?.averageRating || provider.rating || 5), "w-5 h-5")}
                    <span className="font-bold text-lg text-slate-900 dark:text-white">
                      {(reviewStats?.averageRating || provider.rating || 5.0).toFixed(1)}
                    </span>
                    <span className="text-slate-600 dark:text-slate-400">({reviewStats?.totalReviews || 0} avis)</span>
                  </div>

                  {/* Localisation et disponibilité */}
                  <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 text-sm text-slate-600 dark:text-slate-400 mb-4">
                    <div className="flex items-center gap-1">
                      <MapPin size={14} />
                      <span>
                        {provider.ville || "Ville"}, {provider.quartier || "Quartier"}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock size={14} />
                      <span className="text-green-600 dark:text-green-400">
                        Répond en {provider.responseTime || 5}h
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-center lg:justify-start gap-1 text-sm text-slate-600 dark:text-slate-400 mb-6">
                    <Calendar size={14} />
                    <span>Membre depuis {getMemberSince(provider)}</span>
                  </div>
                </div>

                {/* Statistiques - MÊME DESIGN QUE L'IMAGE */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                  <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                    <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{services.length}</div>
                    <div className="text-xs text-blue-600 dark:text-blue-400">Services</div>
                  </div>
                  <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                    <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                      {provider.experience || 3}
                    </div>
                    <div className="text-xs text-green-600 dark:text-green-400">Années d'exp.</div>
                  </div>
                  <div className="text-center p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
                    <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                      {provider.completedJobs || 0}
                    </div>
                    <div className="text-xs text-purple-600 dark:text-purple-400">Missions</div>
                  </div>
                  <div className="text-center p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
                    <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                      {provider.skills?.length || 2}
                    </div>
                    <div className="text-xs text-orange-600 dark:text-orange-400">Compétences</div>
                  </div>
                </div>

                {/* Boutons d'action */}
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button
                    className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white"
                    onClick={() => navigate(`/messages/${provider.id}`)}
                  >
                    <MessageSquare size={16} className="mr-2" />
                    Contacter
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1 border-stone-200 dark:border-slate-700 bg-transparent"
                    onClick={() => navigate(`/client/book-service/${services[0]?.id}`)}
                    disabled={services.length === 0}
                  >
                    <Calendar size={16} className="mr-2" />
                    Réserver
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Navigation des onglets */}
        <div className="flex gap-1 bg-white dark:bg-slate-800 p-1 rounded-lg border border-stone-200 dark:border-slate-700">
          {[
            { id: "about", label: "À propos", icon: Eye },
            { id: "services", label: "Services", icon: Star },
            { id: "reviews", label: "Avis", icon: MessageSquare },
          ].map((tab) => (
            <Button
              key={tab.id}
              variant={activeTab === tab.id ? "default" : "ghost"}
              size="sm"
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 ${
                activeTab === tab.id
                  ? "bg-indigo-600 text-white dark:bg-white dark:text-slate-900"
                  : "text-slate-600 dark:text-slate-400"
              }`}
            >
              <tab.icon size={16} className="mr-2" />
              {tab.label}
            </Button>
          ))}
        </div>

        {/* Contenu des onglets */}
        {activeTab === "about" && (
          <div className="space-y-6">
            {/* À propos - MÊME DESIGN QUE L'IMAGE */}
            <Card className="bg-white dark:bg-slate-800 border-stone-200 dark:border-slate-700">
              <CardHeader>
                <CardTitle className="text-slate-900 dark:text-white">À propos</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                  {provider.bio || "Femme professionnelle, dynamique et entreprenante."}
                </p>
              </CardContent>
            </Card>

            {/* Description */}
            <Card className="bg-white dark:bg-slate-800 border-stone-200 dark:border-slate-700">
              <CardHeader>
                <CardTitle className="text-slate-900 dark:text-white">Description</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                  {provider.description || "Notre objectif : Rassasier les camerounais !"}
                </p>
              </CardContent>
            </Card>

            {/* Langues parlées - MÊME DESIGN QUE L'IMAGE */}
            <Card className="bg-white dark:bg-slate-800 border-stone-200 dark:border-slate-700">
              <CardHeader>
                <CardTitle className="text-slate-900 dark:text-white">Langues parlées</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {(provider.languages || ["Français", "Ewondo", "Bamiléké"]).map((language, index) => (
                    <Badge key={index} className="bg-yellow-500 text-black font-semibold px-3 py-1">
                      {language}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Tarifs - MÊME DESIGN QUE L'IMAGE */}
            <Card className="bg-white dark:bg-slate-800 border-stone-200 dark:border-slate-700">
              <CardHeader>
                <CardTitle className="text-slate-900 dark:text-white">Tarifs</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                  <div className="text-center">
                    <span className="text-green-700 dark:text-green-300 font-bold text-lg">
                      {services.length > 0
                        ? `${formatPrice(Math.min(...services.map((s) => s.price)))} - ${formatPrice(Math.max(...services.map((s) => s.price)))}`
                        : provider.tarifs
                          ? `${formatPrice(provider.tarifs.min)} - ${formatPrice(provider.tarifs.max)}`
                          : "5 000 FCFA - 29 998 FCFA"}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Informations de contact */}
            <Card className="bg-white dark:bg-slate-800 border-stone-200 dark:border-slate-700">
              <CardHeader>
                <CardTitle className="text-slate-900 dark:text-white">Contact</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {provider.telephone && (
                  <div className="flex items-center gap-3">
                    <Phone size={16} className="text-slate-400" />
                    <span className="text-slate-700 dark:text-slate-300">{provider.telephone}</span>
                  </div>
                )}
                {provider.email && (
                  <div className="flex items-center gap-3">
                    <Mail size={16} className="text-slate-400" />
                    <span className="text-slate-700 dark:text-slate-300">{provider.email}</span>
                  </div>
                )}
                {provider.socialLinks?.website && (
                  <div className="flex items-center gap-3">
                    <Globe size={16} className="text-slate-400" />
                    <a
                      href={provider.socialLinks.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-indigo-600 dark:text-indigo-400 hover:underline"
                    >
                      {provider.socialLinks.website}
                    </a>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === "services" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                Services proposés ({services.length})
              </h2>
            </div>

            {services.length === 0 ? (
              <Card className="bg-white dark:bg-slate-800 border-stone-200 dark:border-slate-700">
                <CardContent className="text-center py-12">
                  <Star className="h-16 w-16 text-slate-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2 text-slate-900 dark:text-white">Aucun service</h3>
                  <p className="text-slate-600 dark:text-slate-400">
                    Ce prestataire n'a pas encore ajouté de services.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-6">
                {services.map((service) => (
                  <Card key={service.id} className="bg-white dark:bg-slate-800 border-stone-200 dark:border-slate-700">
                    <CardContent className="p-6">
                      <div className="flex flex-col lg:flex-row gap-6">
                        {/* Image du service */}
                        <div className="w-full lg:w-64 h-48 bg-stone-100 dark:bg-slate-700 rounded-lg overflow-hidden flex-shrink-0">
                          <img
                            src={getServiceImage(service) || "/placeholder.svg"}
                            alt={service.title}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement
                              target.src = `/placeholder.svg?height=192&width=256&text=Service`
                            }}
                          />
                        </div>

                        {/* Détails du service */}
                        <div className="flex-1">
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
                                {service.title}
                              </h3>
                              <Badge
                                variant="secondary"
                                className="bg-stone-200 text-slate-900 dark:bg-slate-700 dark:text-slate-300"
                              >
                                {service.category}
                              </Badge>
                            </div>
                            <div className="text-right">
                              <div className="text-2xl font-bold text-slate-900 dark:text-white">
                                {formatPrice(service.price)}
                              </div>
                              <div className="text-sm text-slate-600 dark:text-slate-400">{service.duration}min</div>
                            </div>
                          </div>

                          <p className="text-slate-600 dark:text-slate-400 mb-4 leading-relaxed">
                            {service.description}
                          </p>

                          <div className="flex flex-wrap gap-2 mb-4">
                            {service.isUrgentAvailable && (
                              <Badge variant="outline" className="border-yellow-400 text-yellow-600">
                                <Zap size={12} className="mr-1" />
                                Service urgent
                              </Badge>
                            )}
                            {service.isGroupService && (
                              <Badge variant="outline" className="border-blue-400 text-blue-600">
                                <Users size={12} className="mr-1" />
                                Service de groupe
                              </Badge>
                            )}
                            <Badge variant="outline" className="border-green-400 text-green-600">
                              <MapPin size={12} className="mr-1" />
                              {service.location === "domicile"
                                ? "À domicile"
                                : service.location === "salon"
                                  ? "En salon"
                                  : "Les deux"}
                            </Badge>
                          </div>

                          <div className="flex gap-3">
                            <Button
                              className="bg-indigo-600 hover:bg-indigo-700 text-white"
                              onClick={() => navigate(`/client/book-service/${service.id}`)}
                            >
                              <Calendar size={16} className="mr-2" />
                              Réserver
                            </Button>
                            <Button
                              variant="outline"
                              className="border-stone-200 dark:border-slate-700 bg-transparent"
                              onClick={() => navigate(`/client/service-view/${service.id}`)}
                            >
                              <Eye size={16} className="mr-2" />
                              Voir détails
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "reviews" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                Avis clients ({reviewStats?.totalReviews || 0})
              </h2>
            </div>

            {/* Statistiques des avis */}
            {reviewStats && (
              <Card className="bg-white dark:bg-slate-800 border-stone-200 dark:border-slate-700">
                <CardContent className="p-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="text-center">
                      <div className="text-4xl font-bold text-slate-900 dark:text-white mb-2">
                        {reviewStats.averageRating.toFixed(1)}
                      </div>
                      {renderStars(Math.round(reviewStats.averageRating), "w-6 h-6")}
                      <p className="text-slate-600 dark:text-slate-400 mt-2">
                        Basé sur {reviewStats.totalReviews} avis
                      </p>
                    </div>

                    <div className="space-y-2">
                      {[5, 4, 3, 2, 1].map((rating) => (
                        <div key={rating} className="flex items-center gap-3">
                          <span className="text-sm text-slate-600 dark:text-slate-400 w-8">{rating}★</span>
                          <Progress
                            value={
                              reviewStats.totalReviews > 0
                                ? ((reviewStats.ratingDistribution[rating] || 0) / reviewStats.totalReviews) * 100
                                : 0
                            }
                            className="flex-1 h-2"
                          />
                          <span className="text-sm text-slate-600 dark:text-slate-400 w-8">
                            {reviewStats.ratingDistribution[rating] || 0}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Liste des avis */}
            <Card className="bg-white dark:bg-slate-800 border-stone-200 dark:border-slate-700">
              <CardContent className="text-center py-12">
                <MessageSquare className="h-16 w-16 text-slate-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2 text-slate-900 dark:text-white">Aucun avis pour le moment</h3>
                <p className="text-slate-600 dark:text-slate-400">
                  Les avis des clients apparaîtront ici après leurs premières réservations.
                </p>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}

export default ProviderProfile

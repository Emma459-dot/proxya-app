"use client"

import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import {
  ArrowLeft,
  Star,
  MapPin,
  Clock,
  Calendar,
  Award,
  Settings,
  CheckCircle,
  ExternalLink,
  Camera,
  Zap,
  Edit,
  MessageSquare,
  ThumbsUp,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import ThemeToggle from "../components/ThemeToggle"
import { useAuth } from "../context/AuthContext"
import { serviceService, reviewService } from "../services/firebaseService"
import { formatPrice } from "../utils/currency"
import type { Provider, Service, Review, ReviewStats } from "../types"

const MyProfile = () => {
  const navigate = useNavigate()
  const { currentUser, userType } = useAuth()
  const [services, setServices] = useState<Service[]>([])
  const [reviews, setReviews] = useState<Review[]>([])
  const [reviewStats, setReviewStats] = useState<ReviewStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const provider = currentUser as Provider

  useEffect(() => {
    if (!currentUser || userType !== "provider") {
      navigate("/provider/login")
      return
    }

    loadProviderData()
  }, []) // CORRECTION : Supprimer les dépendances qui causent la boucle

  // CORRECTION : useEffect séparé pour surveiller les changements d'utilisateur
  useEffect(() => {
    if (!currentUser || userType !== "provider") {
      navigate("/provider/login")
    }
  }, [currentUser, userType, navigate])

  const loadProviderData = async () => {
    if (!provider?.id) return

    try {
      setIsLoading(true)

      const [servicesData, reviewsData, statsData] = await Promise.allSettled([
        serviceService.getByProvider(provider.id),
        reviewService.getByProvider(provider.id),
        reviewService.getProviderStats(provider.id),
      ])

      // Traitement sécurisé des résultats
      if (servicesData.status === "fulfilled") {
        setServices(servicesData.value)
      } else {
        console.error("Erreur chargement services:", servicesData.reason)
        setServices([])
      }

      if (reviewsData.status === "fulfilled") {
        setReviews(reviewsData.value)
      } else {
        console.error("Erreur chargement avis:", reviewsData.reason)
        setReviews([])
      }

      if (statsData.status === "fulfilled") {
        setReviewStats(statsData.value)
      } else {
        console.error("Erreur chargement stats:", statsData.reason)
        setReviewStats(null)
      }
    } catch (error) {
      console.error("Erreur lors du chargement du profil:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const formatJoinDate = (date: Date) => {
    const now = new Date()
    const joinDate = new Date(date)
    const diffTime = Math.abs(now.getTime() - joinDate.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    const diffMonths = Math.floor(diffDays / 30)
    const diffYears = Math.floor(diffMonths / 12)

    if (diffYears > 0) return `Membre depuis ${diffYears} an${diffYears > 1 ? "s" : ""}`
    if (diffMonths > 0) return `Membre depuis ${diffMonths} mois`
    return `Membre depuis ${diffDays} jour${diffDays > 1 ? "s" : ""}`
  }

  const getSkillLevelText = (level: number) => {
    const levels = ["", "Débutant", "Intermédiaire", "Avancé", "Expert", "Maître"]
    return levels[level] || "Débutant"
  }

  const getResponseTimeText = (hours: number) => {
    if (hours < 1) return "Répond en moins d'1 heure"
    if (hours < 24) return `Répond en ${hours}h`
    const days = Math.floor(hours / 24)
    return `Répond en ${days} jour${days > 1 ? "s" : ""}`
  }

  // Vérifier si le compte est certifié
  const isBusinessVerified =
    provider.businessInfo?.businessName &&
    provider.businessInfo?.businessType === "company" &&
    provider.businessInfo?.registrationNumber &&
    provider.businessInfo?.insurance

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

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-slate-900">
      <ThemeToggle />

      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-white dark:bg-slate-800 border-stone-200 dark:border-slate-700">
        <button
          onClick={() => navigate("/provider/dashboard")}
          className="flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
        >
          <ArrowLeft size={20} />
          <span className="font-medium">Retour au dashboard</span>
        </button>

        <div className="text-center">
          <h1 className="text-lg font-bold text-slate-900 dark:text-white">Mon profil</h1>
          <p className="text-xs text-slate-600 dark:text-slate-400">PROXYA</p>
        </div>

        <Button
          onClick={() => navigate("/provider/edit-profile")}
          className="bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-stone-100 dark:text-slate-900"
        >
          <Edit size={16} className="mr-2" />
          Modifier
        </Button>
      </div>

      <div className="max-w-6xl mx-auto p-4">
        {/* Cover Image */}
        {provider.coverImage && (
          <div className="relative h-48 md:h-64 rounded-lg overflow-hidden mb-6">
            <img
              src={provider.coverImage || "/placeholder.svg"}
              alt="Couverture"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
          </div>
        )}

        {/* Profil principal */}
        <Card className="mb-6 bg-white dark:bg-slate-800 border-stone-200 dark:border-slate-700">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-6">
              {/* Avatar et infos de base */}
              <div className="flex flex-col items-center md:items-start">
                <div className="relative">
                  <Avatar className="h-24 w-24 md:h-32 md:w-32 border-4 border-white dark:border-slate-800 shadow-lg">
                    {provider.profileImage ? (
                      <div className="relative w-full h-full">
                        <img
                          src={provider.profileImage || "/placeholder.svg"}
                          alt={`${provider.prenom} ${provider.nom}`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white text-2xl font-bold">
                        {provider.prenom[0]}
                        {provider.nom[0]}
                      </AvatarFallback>
                    )}
                  </Avatar>

                  {/* Badge de vérification */}
                  {(provider.isVerified || isBusinessVerified) && (
                    <div className="absolute -bottom-1 -right-1 bg-blue-500 rounded-full p-2 border-2 border-white dark:border-slate-800 shadow-lg">
                      <CheckCircle size={20} className="text-white" />
                    </div>
                  )}

                  {/* Badge du niveau d'expertise */}
                  <div className="absolute -top-2 -left-2 bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg">
                    {provider.expertise.toUpperCase()}
                  </div>
                </div>

                <div className="text-center md:text-left mt-4">
                  <div className="flex items-center justify-center md:justify-start gap-2 mb-1">
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                      {provider.prenom} {provider.nom}
                    </h1>

                    {(provider.isVerified || isBusinessVerified) && (
                      <div className="flex items-center gap-1 bg-blue-50 dark:bg-blue-900/20 px-2 py-1 rounded-full">
                        <CheckCircle size={16} className="text-blue-500" />
                        <span className="text-xs font-medium text-blue-600 dark:text-blue-400">Vérifié</span>
                      </div>
                    )}
                  </div>

                  {/* Nom de l'entreprise si disponible */}
                  {provider.businessInfo?.businessName && (
                    <p className="text-lg font-medium text-indigo-600 dark:text-indigo-400 mb-1">
                      {provider.businessInfo.businessName}
                    </p>
                  )}

                  <div className="flex items-center justify-center md:justify-start gap-2 mb-2">
                    <Badge
                      variant="outline"
                      className="capitalize font-medium border-indigo-200 text-indigo-700 dark:border-indigo-800 dark:text-indigo-300"
                    >
                      {provider.expertise}
                    </Badge>

                    {provider.businessInfo?.businessType === "company" && (
                      <Badge
                        variant="outline"
                        className="border-green-200 text-green-700 dark:border-green-800 dark:text-green-300"
                      >
                        Entreprise
                      </Badge>
                    )}

                    {provider.businessInfo?.insurance && (
                      <Badge
                        variant="outline"
                        className="border-blue-200 text-blue-700 dark:border-blue-800 dark:text-blue-300"
                      >
                        Assuré
                      </Badge>
                    )}
                  </div>

                  {/* Rating avec plus de style */}
                  <div className="flex items-center justify-center md:justify-start gap-2 mt-2 mb-3">
                    <div className="flex items-center gap-1 bg-yellow-50 dark:bg-yellow-900/20 px-3 py-1 rounded-full">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          size={16}
                          className={`${
                            star <= (reviewStats?.averageRating || provider.rating || 0)
                              ? "fill-yellow-400 text-yellow-400"
                              : "text-gray-300 dark:text-gray-600"
                          }`}
                        />
                      ))}
                      <span className="font-bold text-slate-900 dark:text-white ml-1">
                        {reviewStats?.averageRating?.toFixed(1) || provider.rating?.toFixed(1) || "5.0"}
                      </span>
                    </div>

                    <span className="text-slate-600 dark:text-slate-400">
                      ({reviewStats?.totalReviews || provider.completedJobs || 0} avis)
                    </span>
                  </div>

                  {/* Informations de localisation et réactivité */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-slate-600 dark:text-slate-400 mb-3">
                    <div className="flex items-center justify-center md:justify-start gap-1">
                      <MapPin size={14} className="text-indigo-500" />
                      <span>
                        {provider.ville || "Ville"}, {provider.quartier || "Quartier"}
                      </span>
                    </div>

                    <div className="flex items-center justify-center md:justify-start gap-1">
                      <Clock size={14} className="text-green-500" />
                      <span>{getResponseTimeText(provider.responseTime || 24)}</span>
                    </div>
                  </div>

                  {/* Date d'inscription avec style */}
                  <div className="flex items-center justify-center md:justify-start gap-1 text-sm text-slate-500 dark:text-slate-400 mb-4">
                    <Calendar size={14} />
                    <span>{formatJoinDate(provider.joinedDate || provider.createdAt)}</span>
                  </div>
                </div>
              </div>

              {/* Informations détaillées */}
              <div className="flex-1">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div className="text-center p-4 bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-indigo-900/20 dark:to-blue-900/20 rounded-xl border border-indigo-100 dark:border-indigo-800">
                    <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">{services.length}</div>
                    <div className="text-sm text-slate-600 dark:text-slate-400">Services</div>
                  </div>

                  <div className="text-center p-4 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl border border-green-100 dark:border-green-800">
                    <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                      {provider.experience || 0}
                    </div>
                    <div className="text-sm text-slate-600 dark:text-slate-400">Années d'exp.</div>
                  </div>

                  <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl border border-purple-100 dark:border-purple-800">
                    <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                      {provider.completedJobs || 0}
                    </div>
                    <div className="text-sm text-slate-600 dark:text-slate-400">Missions</div>
                  </div>

                  <div className="text-center p-4 bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 rounded-xl border border-orange-100 dark:border-orange-800">
                    <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                      {provider.skills?.length || 0}
                    </div>
                    <div className="text-sm text-slate-600 dark:text-slate-400">Compétences</div>
                  </div>
                </div>

                {/* Bio */}
                {provider.bio && (
                  <div className="mb-6">
                    <h3 className="font-semibold text-slate-900 dark:text-white mb-2">À propos</h3>
                    <p className="text-slate-600 dark:text-slate-400 leading-relaxed">{provider.bio}</p>
                  </div>
                )}

                {/* Description détaillée */}
                {provider.description && (
                  <div className="mb-6">
                    <h3 className="font-semibold text-slate-900 dark:text-white mb-2">Description</h3>
                    <p className="text-slate-600 dark:text-slate-400 leading-relaxed">{provider.description}</p>
                  </div>
                )}

                {/* Langues */}
                {provider.languages && provider.languages.length > 0 && (
                  <div className="mb-6">
                    <h3 className="font-semibold text-slate-900 dark:text-white mb-2">Langues parlées</h3>
                    <div className="flex flex-wrap gap-2">
                      {provider.languages.map((language, index) => (
                        <Badge key={index} variant="outline" className="border-stone-200 dark:border-slate-700">
                          {language}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Tarifs */}
                {provider.tarifs && (provider.tarifs.min > 0 || provider.tarifs.max > 0) && (
                  <div className="mb-6">
                    <h3 className="font-semibold text-slate-900 dark:text-white mb-2">Tarifs</h3>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant="outline"
                        className="border-green-200 text-green-700 dark:border-green-800 dark:text-green-300"
                      >
                        {formatPrice(provider.tarifs.min)} - {formatPrice(provider.tarifs.max)}
                      </Badge>
                    </div>
                  </div>
                )}

                {/* Boutons d'action */}
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button
                    onClick={() => navigate("/provider/edit-profile")}
                    className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white"
                  >
                    <Settings size={16} className="mr-2" />
                    Modifier mon profil
                  </Button>

                  <Button
                    variant="outline"
                    className="flex-1 border-stone-200 dark:border-slate-700 bg-transparent"
                    onClick={() => navigate(`/provider-profile/${provider.id}`)}
                  >
                    Voir comme un client
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contenu avec onglets */}
        <Tabs defaultValue="services" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5 bg-white dark:bg-slate-800 border border-stone-200 dark:border-slate-700">
            <TabsTrigger value="services">Services ({services.length})</TabsTrigger>
            <TabsTrigger value="reviews">Avis ({reviewStats?.totalReviews || 0})</TabsTrigger>
            <TabsTrigger value="portfolio">Portfolio ({provider.portfolio?.length || 0})</TabsTrigger>
            <TabsTrigger value="skills">Compétences</TabsTrigger>
            <TabsTrigger value="certifications">Certifications</TabsTrigger>
          </TabsList>

          {/* Onglet Services */}
          <TabsContent value="services">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {services.map((service) => (
                <Card
                  key={service.id}
                  className="bg-white dark:bg-slate-800 border-stone-200 dark:border-slate-700 hover:shadow-lg transition-shadow"
                >
                  <CardContent className="p-0">
                    {service.images && service.images.length > 0 && (
                      <div className="aspect-video bg-stone-100 dark:bg-slate-700 rounded-t-lg overflow-hidden">
                        <img
                          src={service.images[0] || "/placeholder.svg"}
                          alt={service.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <div className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-semibold text-slate-900 dark:text-white line-clamp-2">{service.title}</h3>
                        <div className="text-right ml-2">
                          <div className="font-bold text-slate-900 dark:text-white">{formatPrice(service.price)}</div>
                        </div>
                      </div>

                      <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2 mb-3">
                        {service.description}
                      </p>

                      <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-3">
                        <div className="flex items-center gap-1">
                          <Clock size={12} />
                          <span>{service.duration} min</span>
                        </div>

                        {service.averageRating && service.averageRating > 0 && (
                          <div className="flex items-center gap-1">
                            <Star size={12} className="fill-yellow-400 text-yellow-400" />
                            <span>{service.averageRating.toFixed(1)}</span>
                            <span>({service.totalReviews})</span>
                          </div>
                        )}
                      </div>

                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1 bg-transparent"
                          onClick={() => navigate(`/provider/edit-service/${service.id}`)}
                        >
                          Modifier
                        </Button>
                        <Button
                          size="sm"
                          className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white"
                          onClick={() => navigate(`/provider/service-preview/${service.id}`)}
                        >
                          Aperçu
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {services.length === 0 && (
              <Card className="bg-white dark:bg-slate-800 border-stone-200 dark:border-slate-700">
                <CardContent className="p-12 text-center">
                  <div className="text-slate-400 mb-4">
                    <Calendar size={48} className="mx-auto" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                    Aucun service disponible
                  </h3>
                  <p className="text-slate-600 dark:text-slate-400 mb-4">
                    Créez votre premier service pour commencer à recevoir des réservations.
                  </p>
                  <Button
                    onClick={() => navigate("/provider/create-service")}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white"
                  >
                    Créer un service
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Onglet Avis */}
          <TabsContent value="reviews">
            {reviewStats && reviewStats.totalReviews > 0 ? (
              <div className="space-y-6">
                {/* Statistiques des avis */}
                <Card className="bg-white dark:bg-slate-800 border-stone-200 dark:border-slate-700">
                  <CardContent className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Note moyenne */}
                      <div className="text-center">
                        <div className="text-4xl font-bold text-slate-900 dark:text-white mb-2">
                          {reviewStats.averageRating.toFixed(1)}
                        </div>
                        <div className="flex items-center justify-center gap-1 mb-2">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              size={20}
                              className={`${
                                star <= reviewStats.averageRating
                                  ? "fill-yellow-400 text-yellow-400"
                                  : "text-gray-300 dark:text-gray-600"
                              }`}
                            />
                          ))}
                        </div>
                        <p className="text-slate-600 dark:text-slate-400">Basé sur {reviewStats.totalReviews} avis</p>
                      </div>

                      {/* Distribution des notes */}
                      <div className="space-y-2">
                        {[5, 4, 3, 2, 1].map((rating) => (
                          <div key={rating} className="flex items-center gap-2">
                            <span className="text-sm font-medium text-slate-900 dark:text-white w-8">{rating}★</span>
                            <div className="flex-1 bg-stone-200 dark:bg-slate-700 rounded-full h-2">
                              <div
                                className="bg-yellow-400 h-2 rounded-full"
                                style={{
                                  width: `${
                                    reviewStats.totalReviews > 0
                                      ? (
                                          reviewStats.ratingDistribution[
                                            rating as keyof typeof reviewStats.ratingDistribution
                                          ] / reviewStats.totalReviews
                                        ) * 100
                                      : 0
                                  }%`,
                                }}
                              />
                            </div>
                            <span className="text-sm text-slate-600 dark:text-slate-400 w-8">
                              {reviewStats.ratingDistribution[rating as keyof typeof reviewStats.ratingDistribution]}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Critères détaillés */}
                    {reviewStats.criteriaAverages && (
                      <div className="mt-6 pt-6 border-t border-stone-200 dark:border-slate-700">
                        <h3 className="font-semibold text-slate-900 dark:text-white mb-4">Critères détaillés</h3>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div className="text-center">
                            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                              {reviewStats.criteriaAverages.punctuality.toFixed(1)}
                            </div>
                            <div className="text-sm text-slate-600 dark:text-slate-400">Ponctualité</div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                              {reviewStats.criteriaAverages.quality.toFixed(1)}
                            </div>
                            <div className="text-sm text-slate-600 dark:text-slate-400">Qualité</div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                              {reviewStats.criteriaAverages.communication.toFixed(1)}
                            </div>
                            <div className="text-sm text-slate-600 dark:text-slate-400">Communication</div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                              {reviewStats.criteriaAverages.value.toFixed(1)}
                            </div>
                            <div className="text-sm text-slate-600 dark:text-slate-400">Rapport qualité/prix</div>
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Liste des avis */}
                <div className="space-y-4">
                  {reviews.slice(0, 10).map((review) => (
                    <Card key={review.id} className="bg-white dark:bg-slate-800 border-stone-200 dark:border-slate-700">
                      <CardContent className="p-6">
                        <div className="flex items-start gap-4">
                          <Avatar className="h-10 w-10">
                            <AvatarFallback className="bg-slate-900 text-white dark:bg-white dark:text-slate-900">
                              C
                            </AvatarFallback>
                          </Avatar>

                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-slate-900 dark:text-white">Client</span>
                                <div className="flex items-center gap-1">
                                  {[1, 2, 3, 4, 5].map((star) => (
                                    <Star
                                      key={star}
                                      size={14}
                                      className={`${
                                        star <= review.rating
                                          ? "fill-yellow-400 text-yellow-400"
                                          : "text-gray-300 dark:text-gray-600"
                                      }`}
                                    />
                                  ))}
                                </div>
                              </div>

                              <span className="text-sm text-slate-500 dark:text-slate-400">
                                {new Date(review.createdAt).toLocaleDateString("fr-FR")}
                              </span>
                            </div>

                            <p className="text-slate-600 dark:text-slate-400 mb-3">{review.comment}</p>

                            {/* Critères détaillés */}
                            {(review.punctualityRating ||
                              review.qualityRating ||
                              review.communicationRating ||
                              review.valueRating) && (
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-3 text-xs">
                                {review.punctualityRating && (
                                  <div className="flex items-center gap-1">
                                    <Clock size={12} className="text-blue-500" />
                                    <span>Ponctualité: {review.punctualityRating}/5</span>
                                  </div>
                                )}
                                {review.qualityRating && (
                                  <div className="flex items-center gap-1">
                                    <Award size={12} className="text-green-500" />
                                    <span>Qualité: {review.qualityRating}/5</span>
                                  </div>
                                )}
                                {review.communicationRating && (
                                  <div className="flex items-center gap-1">
                                    <MessageSquare size={12} className="text-purple-500" />
                                    <span>Communication: {review.communicationRating}/5</span>
                                  </div>
                                )}
                                {review.valueRating && (
                                  <div className="flex items-center gap-1">
                                    <Star size={12} className="text-orange-500" />
                                    <span>Rapport Q/P: {review.valueRating}/5</span>
                                  </div>
                                )}
                              </div>
                            )}

                            {/* Réponse du prestataire */}
                            {review.providerResponse && (
                              <div className="mt-3 p-3 bg-stone-50 dark:bg-slate-700/50 rounded-lg">
                                <div className="flex items-center gap-2 mb-2">
                                  <span className="text-sm font-medium text-slate-900 dark:text-white">
                                    Réponse du prestataire
                                  </span>
                                  <span className="text-xs text-slate-500 dark:text-slate-400">
                                    {review.providerResponseDate &&
                                      new Date(review.providerResponseDate).toLocaleDateString("fr-FR")}
                                  </span>
                                </div>

                                <p className="text-sm text-slate-600 dark:text-slate-400">{review.providerResponse}</p>
                              </div>
                            )}

                            {/* Actions */}
                            <div className="flex items-center gap-4 mt-3 text-sm text-slate-500 dark:text-slate-400">
                              <button className="flex items-center gap-1 hover:text-slate-700 dark:hover:text-slate-300">
                                <ThumbsUp size={14} />
                                <span>Utile ({review.helpfulCount || 0})</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {reviews.length > 10 && (
                  <div className="text-center">
                    <Button
                      variant="outline"
                      onClick={() => navigate(`/reviews/${provider.id}`)}
                      className="border-stone-200 dark:border-slate-700"
                    >
                      Voir tous les avis ({reviews.length})
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <Card className="bg-white dark:bg-slate-800 border-stone-200 dark:border-slate-700">
                <CardContent className="p-12 text-center">
                  <div className="text-slate-400 mb-4">
                    <Star size={48} className="mx-auto" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">Aucun avis</h3>
                  <p className="text-slate-600 dark:text-slate-400">
                    Vous n'avez pas encore reçu d'avis de vos clients.
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Onglet Portfolio */}
          <TabsContent value="portfolio">
            {provider.portfolio && provider.portfolio.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {provider.portfolio
                  .filter((item) => item.isPublic)
                  .map((item, index) => (
                    <Card
                      key={item.id || index}
                      className="bg-white dark:bg-slate-800 border-stone-200 dark:border-slate-700 overflow-hidden"
                    >
                      <CardContent className="p-0">
                        {item.images && item.images.length > 0 && (
                          <div className="aspect-video bg-stone-100 dark:bg-slate-700 relative group">
                            <img
                              src={item.images[0] || "/placeholder.svg"}
                              alt={item.title}
                              className="w-full h-full object-cover"
                            />

                            {item.images.length > 1 && (
                              <div className="absolute top-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
                                <Camera size={12} className="inline mr-1" />
                                {item.images.length}
                              </div>
                            )}
                          </div>
                        )}
                        <div className="p-4">
                          <div className="flex items-start justify-between mb-2">
                            <h3 className="font-semibold text-slate-900 dark:text-white">{item.title}</h3>
                            <Badge variant="outline" className="text-xs border-stone-200 dark:border-slate-700">
                              {item.category}
                            </Badge>
                          </div>

                          <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-3 mb-3">
                            {item.description}
                          </p>

                          <div className="text-xs text-slate-500 dark:text-slate-400 mb-3">
                            Réalisé le {new Date(item.completedDate).toLocaleDateString("fr-FR")}
                          </div>

                          {item.tags && item.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1 mb-3">
                              {item.tags.slice(0, 3).map((tag, tagIndex) => (
                                <Badge key={tagIndex} variant="secondary" className="text-xs">
                                  {tag}
                                </Badge>
                              ))}
                              {item.tags.length > 3 && (
                                <Badge variant="secondary" className="text-xs">
                                  +{item.tags.length - 3}
                                </Badge>
                              )}
                            </div>
                          )}

                          {item.clientTestimonial && (
                            <div className="bg-stone-50 dark:bg-slate-700/50 p-3 rounded-lg">
                              <p className="text-sm italic text-slate-600 dark:text-slate-400">
                                "{item.clientTestimonial}"
                              </p>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
              </div>
            ) : (
              <Card className="bg-white dark:bg-slate-800 border-stone-200 dark:border-slate-700">
                <CardContent className="p-12 text-center">
                  <div className="text-slate-400 mb-4">
                    <Camera size={48} className="mx-auto" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">Portfolio vide</h3>
                  <p className="text-slate-600 dark:text-slate-400 mb-4">
                    Ajoutez vos réalisations pour montrer votre travail aux clients.
                  </p>
                  <Button
                    onClick={() => navigate("/provider/edit-profile")}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white"
                  >
                    Ajouter des réalisations
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Onglet Compétences */}
          <TabsContent value="skills">
            {provider.skills && provider.skills.length > 0 ? (
              <Card className="bg-white dark:bg-slate-800 border-stone-200 dark:border-slate-700">
                <CardContent className="p-6">
                  <div className="space-y-6">
                    {provider.skills.map((skill, index) => (
                      <div key={index} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <h3 className="font-medium text-slate-900 dark:text-white">{skill.name}</h3>

                          <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                            <span>{getSkillLevelText(skill.level)}</span>
                            <Badge variant="outline" className="text-xs">
                              {skill.yearsOfExperience} an{skill.yearsOfExperience > 1 ? "s" : ""}
                            </Badge>
                          </div>
                        </div>

                        <Progress value={skill.level * 20} className="h-2" />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="bg-white dark:bg-slate-800 border-stone-200 dark:border-slate-700">
                <CardContent className="p-12 text-center">
                  <div className="text-slate-400 mb-4">
                    <Zap size={48} className="mx-auto" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                    Compétences non renseignées
                  </h3>
                  <p className="text-slate-600 dark:text-slate-400 mb-4">
                    Ajoutez vos compétences pour montrer votre expertise.
                  </p>
                  <Button
                    onClick={() => navigate("/provider/edit-profile")}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white"
                  >
                    Ajouter des compétences
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Onglet Certifications */}
          <TabsContent value="certifications">
            {provider.certifications && provider.certifications.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {provider.certifications.map((cert, index) => (
                  <Card
                    key={cert.id || index}
                    className="bg-white dark:bg-slate-800 border-stone-200 dark:border-slate-700"
                  >
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        {cert.image && (
                          <div className="w-16 h-16 bg-stone-100 dark:bg-slate-700 rounded-lg overflow-hidden flex-shrink-0">
                            <img
                              src={cert.image || "/placeholder.svg"}
                              alt={cert.title}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}
                        <div className="flex-1">
                          <div className="flex items-start justify-between mb-2">
                            <h3 className="font-semibold text-slate-900 dark:text-white">{cert.title}</h3>

                            {cert.isVerified && <CheckCircle size={16} className="text-green-500 flex-shrink-0" />}
                          </div>

                          <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">{cert.issuer}</p>

                          <div className="text-xs text-slate-500 dark:text-slate-400 mb-3">
                            Obtenu le {new Date(cert.issueDate).toLocaleDateString("fr-FR")}
                            {cert.expiryDate && (
                              <span> • Expire le {new Date(cert.expiryDate).toLocaleDateString("fr-FR")}</span>
                            )}
                          </div>

                          {cert.credentialId && (
                            <div className="text-xs text-slate-500 dark:text-slate-400 mb-2">
                              ID: {cert.credentialId}
                            </div>
                          )}

                          {cert.credentialUrl && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-xs bg-transparent"
                              onClick={() => window.open(cert.credentialUrl, "_blank")}
                            >
                              <ExternalLink size={12} className="mr-1" />
                              Vérifier
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="bg-white dark:bg-slate-800 border-stone-200 dark:border-slate-700">
                <CardContent className="p-12 text-center">
                  <div className="text-slate-400 mb-4">
                    <Award size={48} className="mx-auto" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">Aucune certification</h3>
                  <p className="text-slate-600 dark:text-slate-400 mb-4">
                    Ajoutez vos certifications pour renforcer votre crédibilité.
                  </p>
                  <Button
                    onClick={() => navigate("/provider/edit-profile")}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white"
                  >
                    Ajouter des certifications
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

export default MyProfile

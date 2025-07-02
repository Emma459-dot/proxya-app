"use client"

import { useState, useEffect } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { ArrowLeft, Star, Clock, MapPin, Tag, Check, Heart, Share2, Calendar, Users, Zap } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import ThemeToggle from "../components/ThemeToggle"
import { useAuth } from "../context/AuthContext"
import { serviceService, providerService, reviewService } from "../services/firebaseService"
import { formatPrice } from "../utils/currency"
import type { Service, Provider, Review } from "../types"

const ServiceView = () => {
  const navigate = useNavigate()
  const { serviceId } = useParams()
  const { currentUser, userType } = useAuth()
  const [service, setService] = useState<Service | null>(null)
  const [provider, setProvider] = useState<Provider | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [reviews, setReviews] = useState<Review[]>([])
  const [reviewStats, setReviewStats] = useState({
    averageRating: 0,
    totalReviews: 0,
    ratingDistribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
  })

  useEffect(() => {
    if (!currentUser || userType !== "client") {
      navigate("/client/login")
      return
    }
    loadServiceData()
  }, [serviceId, currentUser, userType])

  const loadServiceData = async () => {
    if (!serviceId) return

    try {
      // Chercher le service dans tous les prestataires
      const allProviders = await providerService.getAll()
      let foundService: Service | null = null
      let foundProvider: Provider | null = null

      for (const prov of allProviders) {
        const services = await serviceService.getByProvider(prov.id!)
        const svc = services.find((s) => s.id === serviceId)
        if (svc) {
          foundService = svc
          foundProvider = prov
          break
        }
      }

      if (foundService && foundProvider) {
        setService(foundService)
        setProvider(foundProvider)

        // NOUVEAU : Charger les avis du service
        const serviceReviews = await reviewService.getByService(serviceId)
        setReviews(serviceReviews)

        // Calculer les statistiques
        if (serviceReviews.length > 0) {
          const avgRating = serviceReviews.reduce((sum, review) => sum + review.rating, 0) / serviceReviews.length
          const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
          serviceReviews.forEach((review) => {
            distribution[review.rating as keyof typeof distribution]++
          })

          setReviewStats({
            averageRating: Math.round(avgRating * 10) / 10,
            totalReviews: serviceReviews.length,
            ratingDistribution: distribution,
          })
        }
      }
    } catch (error) {
      console.error("Erreur lors du chargement du service:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const getLocationText = (location: string) => {
    switch (location) {
      case "domicile":
        return "À domicile"
      case "salon":
        return "En salon"
      case "les-deux":
        return "À domicile ou en salon"
      default:
        return location
    }
  }

  const handleViewProfile = () => {
    if (provider?.id) {
      navigate(`/provider-profile/${provider.id}`)
    }
  }

  const handleSendMessage = () => {
    if (provider?.id) {
      navigate(`/messages?contact=${provider.id}`)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-stone-50 dark:bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 dark:border-white mx-auto mb-4"></div>
          <p className="text-slate-600 dark:text-slate-400">Chargement...</p>
        </div>
      </div>
    )
  }

  if (!service || !provider) {
    return (
      <div className="min-h-screen bg-stone-50 dark:bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2 text-slate-900 dark:text-white">Service non trouvé</h2>
          <Button onClick={() => navigate("/client/dashboard")}>Retour au dashboard</Button>
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
          onClick={() => navigate("/client/dashboard")}
          className="flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
        >
          <ArrowLeft size={20} />
          <span className="font-medium">Retour</span>
        </button>

        <div className="text-center">
          <h1 className="text-lg font-bold text-slate-900 dark:text-white">Détails du service</h1>
          <p className="text-xs text-slate-600 dark:text-slate-400">PROXYA</p>
        </div>

        <div className="flex gap-2">
          <Button variant="ghost" size="icon" className="text-slate-400 hover:text-red-500">
            <Heart size={16} />
          </Button>
          <Button variant="ghost" size="icon" className="text-slate-400 hover:text-slate-600">
            <Share2 size={16} />
          </Button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-4">
        {/* Galerie d'images */}
        {service.images && service.images.length > 0 && (
          <Card className="mb-6 overflow-hidden bg-white dark:bg-slate-800 border-stone-200 dark:border-slate-700">
            <div className="relative">
              <div className="aspect-video bg-stone-100 dark:bg-slate-700">
                <img
                  src={service.images[currentImageIndex] || "/placeholder.svg"}
                  alt={service.title}
                  className="w-full h-full object-cover"
                />
              </div>

              {service.images.length > 1 && (
                <>
                  <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2">
                    {service.images.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => setCurrentImageIndex(index)}
                        className={`w-2 h-2 rounded-full transition-all ${
                          index === currentImageIndex ? "bg-white w-6" : "bg-white/60"
                        }`}
                      />
                    ))}
                  </div>

                  <div className="absolute top-4 right-4 bg-black/50 text-white text-xs px-2 py-1 rounded">
                    {currentImageIndex + 1}/{service.images.length}
                  </div>
                </>
              )}
            </div>

            {service.images.length > 1 && (
              <div className="p-4">
                <div className="flex gap-2 overflow-x-auto">
                  {service.images.map((image, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentImageIndex(index)}
                      className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                        index === currentImageIndex ? "border-indigo-600" : "border-transparent"
                      }`}
                    >
                      <img
                        src={image || "/placeholder.svg"}
                        alt={`${service.title} ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </Card>
        )}

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Informations principales */}
          <div className="lg:col-span-2 space-y-6">
            {/* Titre et prix */}
            <Card className="bg-white dark:bg-slate-800 border-stone-200 dark:border-slate-700">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">{service.title}</h1>
                    <div className="flex items-center gap-4 text-sm text-slate-600 dark:text-slate-400 mb-3">
                      <Badge
                        variant="secondary"
                        className="bg-stone-200 text-slate-900 dark:bg-slate-700 dark:text-slate-300"
                      >
                        {service.category}
                      </Badge>
                      <div className="flex items-center gap-1">
                        <Clock size={14} />
                        <span>{service.duration} min</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <MapPin size={14} />
                        <span>{getLocationText(service.location || "domicile")}</span>
                      </div>
                    </div>

                    {/* Badges spéciaux */}
                    <div className="flex gap-2 mb-4">
                      {service.isUrgentAvailable && (
                        <Badge variant="outline" className="border-yellow-400 text-yellow-600">
                          <Zap size={12} className="mr-1" />
                          Service urgent disponible
                        </Badge>
                      )}
                      {service.isGroupService && (
                        <Badge variant="outline" className="border-blue-400 text-blue-600">
                          <Users size={12} className="mr-1" />
                          Service de groupe (max {service.maxGroupSize})
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold text-slate-900 dark:text-white">
                      {formatPrice(service.price)}
                    </div>
                    <div className="text-sm text-slate-600 dark:text-slate-400">par session</div>
                    {service.isGroupService && (
                      <div className="text-xs text-green-600 dark:text-green-400 mt-1">Réduction groupe disponible</div>
                    )}
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={() => navigate(`/client/book-service/${service.id}`)}
                    className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white"
                  >
                    <Calendar size={16} className="mr-2" />
                    Réserver maintenant
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Description */}
            <Card className="bg-white dark:bg-slate-800 border-stone-200 dark:border-slate-700">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-3 text-slate-900 dark:text-white">Description</h3>
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed whitespace-pre-line">
                  {service.description}
                </p>
              </CardContent>
            </Card>

            {/* Caractéristiques incluses */}
            {service.features && service.features.length > 0 && (
              <Card className="bg-white dark:bg-slate-800 border-stone-200 dark:border-slate-700">
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold mb-4 text-slate-900 dark:text-white">Ce qui est inclus</h3>
                  <div className="space-y-3">
                    {service.features.map((feature, index) => (
                      <div key={index} className="flex items-center gap-3">
                        <div className="w-5 h-5 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center">
                          <Check size={12} className="text-green-600 dark:text-green-400" />
                        </div>
                        <span className="text-slate-700 dark:text-slate-300">{feature}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Tags */}
            {service.tags && service.tags.length > 0 && (
              <Card className="bg-white dark:bg-slate-800 border-stone-200 dark:border-slate-700">
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold mb-3 text-slate-900 dark:text-white">Tags</h3>
                  <div className="flex flex-wrap gap-2">
                    {service.tags.map((tag, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-1 px-3 py-1 bg-stone-100 dark:bg-slate-700 rounded-full text-sm text-slate-700 dark:text-slate-300"
                      >
                        <Tag size={12} />
                        {tag}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* NOUVELLE SECTION : Avis et évaluations */}
            {reviewStats.totalReviews > 0 && (
              <Card className="bg-white dark:bg-slate-800 border-stone-200 dark:border-slate-700">
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold mb-4 text-slate-900 dark:text-white">
                    Avis clients ({reviewStats.totalReviews})
                  </h3>

                  {/* Statistiques globales */}
                  <div className="flex items-center gap-4 mb-6 p-4 bg-stone-50 dark:bg-slate-700/50 rounded-lg">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-slate-900 dark:text-white">
                        {reviewStats.averageRating}
                      </div>
                      <div className="flex items-center justify-center gap-1 mt-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            size={16}
                            className={`${
                              star <= reviewStats.averageRating
                                ? "fill-yellow-400 text-yellow-400"
                                : "text-gray-300 dark:text-gray-600"
                            }`}
                          />
                        ))}
                      </div>
                      <div className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                        {reviewStats.totalReviews} avis
                      </div>
                    </div>

                    <div className="flex-1">
                      {[5, 4, 3, 2, 1].map((rating) => {
                        const count =
                          reviewStats.ratingDistribution[rating as keyof typeof reviewStats.ratingDistribution]
                        const percentage = reviewStats.totalReviews > 0 ? (count / reviewStats.totalReviews) * 100 : 0

                        return (
                          <div key={rating} className="flex items-center gap-2 mb-1">
                            <span className="text-sm w-3">{rating}</span>
                            <Star size={12} className="fill-yellow-400 text-yellow-400" />
                            <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                              <div
                                className="bg-yellow-400 h-2 rounded-full transition-all"
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                            <span className="text-sm text-slate-600 dark:text-slate-400 w-8">{count}</span>
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  {/* Avis récents */}
                  <div className="space-y-4">
                    <h4 className="font-medium text-slate-900 dark:text-white">Avis récents</h4>
                    {reviews.slice(0, 3).map((review) => (
                      <div key={review.id} className="border-l-4 border-indigo-600 pl-4 py-2">
                        <div className="flex items-center gap-2 mb-2">
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
                          <span className="text-sm text-slate-600 dark:text-slate-400">
                            {new Date(review.createdAt).toLocaleDateString("fr-FR")}
                          </span>
                        </div>
                        <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">{review.comment}</p>

                        {/* Critères détaillés si disponibles */}
                        {(review.punctualityRating ||
                          review.qualityRating ||
                          review.communicationRating ||
                          review.valueRating) && (
                          <div className="grid grid-cols-2 gap-2 mt-3 text-xs">
                            {review.punctualityRating && (
                              <div className="flex items-center gap-1">
                                <Clock size={12} />
                                <span>Ponctualité: {review.punctualityRating}/5</span>
                              </div>
                            )}
                            {review.qualityRating && (
                              <div className="flex items-center gap-1">
                                <Check size={12} />
                                <span>Qualité: {review.qualityRating}/5</span>
                              </div>
                            )}
                            {review.communicationRating && (
                              <div className="flex items-center gap-1">
                                <span>💬</span>
                                <span>Communication: {review.communicationRating}/5</span>
                              </div>
                            )}
                            {review.valueRating && (
                              <div className="flex items-center gap-1">
                                <span>💰</span>
                                <span>Rapport qualité-prix: {review.valueRating}/5</span>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Réponse du prestataire */}
                        {review.providerResponse && (
                          <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                            <div className="text-xs font-medium text-blue-600 dark:text-blue-400 mb-1">
                              Réponse du prestataire
                            </div>
                            <p className="text-sm text-blue-800 dark:text-blue-300">{review.providerResponse}</p>
                          </div>
                        )}
                      </div>
                    ))}

                    {reviews.length > 3 && (
                      <Button
                        variant="outline"
                        className="w-full mt-4"
                        onClick={() => navigate(`/reviews/${service?.id}`)}
                      >
                        Voir tous les avis ({reviews.length})
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Moyens de paiement */}
            {service.paymentOptions && service.paymentOptions.length > 0 && (
              <Card className="bg-white dark:bg-slate-800 border-stone-200 dark:border-slate-700">
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold mb-3 text-slate-900 dark:text-white">
                    Moyens de paiement acceptés
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {service.paymentOptions.map((option, index) => (
                      <Badge key={index} variant="outline" className="border-stone-200 dark:border-slate-700">
                        {option}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar prestataire */}
          <div className="space-y-6">
            {/* Profil prestataire */}
            <Card className="bg-white dark:bg-slate-800 border-stone-200 dark:border-slate-700">
              <CardContent className="p-6">
                <div className="flex items-center gap-4 mb-4">
                  <Avatar className="h-16 w-16">
                    <AvatarFallback className="bg-slate-900 text-white dark:bg-white dark:text-slate-900 text-lg">
                      {provider.prenom[0]}
                      {provider.nom[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-semibold text-slate-900 dark:text-white">
                      {provider.prenom} {provider.nom}
                    </h3>
                    <div className="flex items-center gap-1 text-sm text-slate-600 dark:text-slate-400">
                      <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                      <span className="font-medium">{provider.rating || 5.0}</span>
                      <span>({provider.completedJobs || 0} avis)</span>
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-400 capitalize">{provider.expertise}</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <Button
                    variant="outline"
                    className="w-full border-stone-200 dark:border-slate-700"
                    onClick={handleViewProfile}
                  >
                    Voir le profil complet
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full border-stone-200 dark:border-slate-700"
                    onClick={handleSendMessage}
                  >
                    Envoyer un message
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Disponibilités */}
            {service.availability &&
              (service.availability.days.length > 0 || service.availability.timeSlots.length > 0) && (
                <Card className="bg-white dark:bg-slate-800 border-stone-200 dark:border-slate-700">
                  <CardContent className="p-6">
                    <h3 className="text-lg font-semibold mb-4 text-slate-900 dark:text-white">Disponibilités</h3>

                    {service.availability.days.length > 0 && (
                      <div className="mb-4">
                        <h4 className="text-sm font-medium mb-2 text-slate-700 dark:text-slate-300">Jours</h4>
                        <div className="flex flex-wrap gap-1">
                          {service.availability.days.map((day) => (
                            <Badge
                              key={day}
                              variant="outline"
                              className="text-xs border-stone-200 dark:border-slate-700"
                            >
                              {day}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {service.availability.timeSlots.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium mb-2 text-slate-700 dark:text-slate-300">Créneaux</h4>
                        <div className="space-y-1">
                          {service.availability.timeSlots.map((slot) => (
                            <div key={slot} className="text-sm text-slate-600 dark:text-slate-400">
                              {slot}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

            {/* Zone de service */}
            {service.serviceArea && service.serviceArea.length > 0 && (
              <Card className="bg-white dark:bg-slate-800 border-stone-200 dark:border-slate-700">
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold mb-3 text-slate-900 dark:text-white">Zone de service</h3>
                  <div className="flex flex-wrap gap-1">
                    {service.serviceArea.slice(0, 6).map((area) => (
                      <Badge key={area} variant="outline" className="text-xs border-stone-200 dark:border-slate-700">
                        {area}
                      </Badge>
                    ))}
                    {service.serviceArea.length > 6 && (
                      <Badge variant="outline" className="text-xs border-stone-200 dark:border-slate-700">
                        +{service.serviceArea.length - 6} autres
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default ServiceView

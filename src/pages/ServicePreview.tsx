"use client"

import { useState, useEffect } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { ArrowLeft, Star, Clock, MapPin, Tag, Check, Heart, Share2, Calendar } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import ThemeToggle from "../components/ThemeToggle"
import { useAuth } from "../context/AuthContext"
import { serviceService } from "../services/firebaseService"
import type { Service, Provider } from "../types"

const ServicePreview = () => {
  const navigate = useNavigate()
  const { serviceId } = useParams()
  const { currentUser } = useAuth()
  const [service, setService] = useState<Service | null>(null)
  const [provider, setProvider] = useState<Provider | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)

  useEffect(() => {
    loadServiceData()
  }, [serviceId])

  const loadServiceData = async () => {
    if (!serviceId) return

    try {
      // Pour cette démo, on va récupérer le service depuis les services du provider
      const currentProvider = currentUser as Provider
      if (currentProvider?.id) {
        const services = await serviceService.getByProvider(currentProvider.id)
        const foundService = services.find((s) => s.id === serviceId)

        if (foundService) {
          setService(foundService)
          setProvider(currentProvider)
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-stone-50 dark:bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900 dark:border-white mx-auto mb-4"></div>
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
          <Button onClick={() => navigate("/provider/dashboard")}>Retour au dashboard</Button>
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
          <span className="font-medium">Retour</span>
        </button>

        <div className="text-center">
          <h1 className="text-lg font-bold text-slate-900 dark:text-white">Aperçu du service</h1>
          <p className="text-xs text-slate-600 dark:text-slate-400">Vue client</p>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate(`/provider/edit-service/${serviceId}`)}
            className="border-stone-200 dark:border-slate-700"
          >
            Modifier
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
                        index === currentImageIndex ? "border-slate-900 dark:border-white" : "border-transparent"
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
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold text-slate-900 dark:text-white">{service.price}€</div>
                    <div className="text-sm text-slate-600 dark:text-slate-400">par session</div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white">
                    <Calendar size={16} className="mr-2" />
                    Réserver maintenant
                  </Button>
                  <Button variant="outline" size="icon" className="border-stone-200 dark:border-slate-700">
                    <Heart size={16} />
                  </Button>
                  <Button variant="outline" size="icon" className="border-stone-200 dark:border-slate-700">
                    <Share2 size={16} />
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
                  <Button variant="outline" className="w-full border-stone-200 dark:border-slate-700">
                    Voir le profil complet
                  </Button>
                  <Button variant="outline" className="w-full border-stone-200 dark:border-slate-700">
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

            {/* Autres services */}
            <Card className="bg-white dark:bg-slate-800 border-stone-200 dark:border-slate-700">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-3 text-slate-900 dark:text-white">Autres services</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Découvrez les autres services proposés par {provider.prenom}
                </p>
                <Button variant="outline" className="w-full mt-3 border-stone-200 dark:border-slate-700">
                  Voir tous les services
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ServicePreview

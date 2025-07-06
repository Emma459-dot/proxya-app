"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Navigation, MapPin, Loader2, AlertCircle, Target, Zap } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Slider } from "@/components/ui/slider"
import { Label } from "@/components/ui/label"
import type { Service, Provider } from "../types"

interface GeolocationServiceProps {
  services: Service[]
  providers: Provider[]
  onNearbyServicesFound: (nearbyServices: Service[]) => void
}

interface UserLocation {
  latitude: number
  longitude: number
  accuracy: number
}

interface ServiceWithDistance extends Service {
  distance: number
  provider: Provider
}

const GeolocationService: React.FC<GeolocationServiceProps> = ({ services, providers, onNearbyServicesFound }) => {
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [searchRadius, setSearchRadius] = useState([5]) // km
  const [nearbyServices, setNearbyServices] = useState<ServiceWithDistance[]>([])
  const [isLocationEnabled, setIsLocationEnabled] = useState(false)

  // Vérifier si la géolocalisation est supportée
  const isGeolocationSupported = "geolocation" in navigator

  // Calculer la distance entre deux points (formule de Haversine)
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371 // Rayon de la Terre en km
    const dLat = (lat2 - lat1) * (Math.PI / 180)
    const dLon = (lon2 - lon1) * (Math.PI / 180)
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * Math.sin(dLon / 2) * Math.sin(dLon / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c
  }

  // Obtenir la position de l'utilisateur
  const getCurrentLocation = (): Promise<UserLocation> => {
    return new Promise((resolve, reject) => {
      if (!isGeolocationSupported) {
        reject(new Error("La géolocalisation n'est pas supportée par votre navigateur"))
        return
      }

      const options: PositionOptions = {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000, // 5 minutes
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
          })
        },
        (error) => {
          let errorMessage = "Erreur de géolocalisation"
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = "Accès à la localisation refusé. Veuillez autoriser l'accès dans les paramètres."
              break
            case error.POSITION_UNAVAILABLE:
              errorMessage = "Position indisponible. Vérifiez votre connexion."
              break
            case error.TIMEOUT:
              errorMessage = "Délai d'attente dépassé. Réessayez."
              break
          }
          reject(new Error(errorMessage))
        },
        options,
      )
    })
  }

  // Rechercher les services à proximité
  const searchNearbyServices = async () => {
    if (!userLocation) return

    setIsLoading(true)
    setError("")

    try {
      // Simuler des coordonnées pour les prestataires (en production, ces données viendraient de la base de données)
      const servicesWithLocation: ServiceWithDistance[] = []

      for (const service of services) {
        const provider = providers.find((p) => p.id === service.providerId)
        if (!provider) continue

        // Simuler des coordonnées aléatoires autour de Dakar pour la démo
        const baseLatitude = 14.6928 // Dakar
        const baseLongitude = -17.4467
        const randomLat = baseLatitude + (Math.random() - 0.5) * 0.2 // ±0.1 degré
        const randomLon = baseLongitude + (Math.random() - 0.5) * 0.2

        const distance = calculateDistance(userLocation.latitude, userLocation.longitude, randomLat, randomLon)

        if (distance <= searchRadius[0]) {
          servicesWithLocation.push({
            ...service,
            distance: Math.round(distance * 10) / 10, // Arrondir à 1 décimale
            provider,
          })
        }
      }

      // Trier par distance
      servicesWithLocation.sort((a, b) => a.distance - b.distance)

      setNearbyServices(servicesWithLocation)
      onNearbyServicesFound(servicesWithLocation)

      if (servicesWithLocation.length === 0) {
        setError(`Aucun service trouvé dans un rayon de ${searchRadius[0]} km`)
      }
    } catch (err) {
      setError("Erreur lors de la recherche des services à proximité")
      console.error("Erreur recherche géolocalisée:", err)
    } finally {
      setIsLoading(false)
    }
  }

  // Activer la géolocalisation
  const enableLocation = async () => {
    setIsLoading(true)
    setError("")

    try {
      const location = await getCurrentLocation()
      setUserLocation(location)
      setIsLocationEnabled(true)

      // Rechercher automatiquement les services après avoir obtenu la position
      setTimeout(() => {
        searchNearbyServices()
      }, 500)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur de géolocalisation")
      setIsLocationEnabled(false)
    } finally {
      setIsLoading(false)
    }
  }

  // Désactiver la géolocalisation
  const disableLocation = () => {
    setUserLocation(null)
    setIsLocationEnabled(false)
    setNearbyServices([])
    setError("")
    onNearbyServicesFound([])
  }

  // Rechercher à nouveau quand le rayon change
  useEffect(() => {
    if (userLocation && isLocationEnabled) {
      const timeoutId = setTimeout(() => {
        searchNearbyServices()
      }, 1000) // Délai pour éviter trop de requêtes

      return () => clearTimeout(timeoutId)
    }
  }, [searchRadius, userLocation, isLocationEnabled])

  if (!isGeolocationSupported) {
    return (
      <Card className="bg-white dark:bg-slate-800 border-stone-200 dark:border-slate-700">
        <CardContent className="p-4 text-center">
          <AlertCircle className="h-8 w-8 text-slate-400 mx-auto mb-2" />
          <p className="text-sm text-slate-600 dark:text-slate-400">
            La géolocalisation n'est pas supportée par votre navigateur
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-white dark:bg-slate-800 border-stone-200 dark:border-slate-700">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-slate-900 dark:text-white text-sm">
          <Navigation size={16} className="text-indigo-600" />
          Recherche par géolocalisation
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Messages d'état */}
        {error && (
          <Alert className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20">
            <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
            <AlertDescription className="text-red-700 dark:text-red-300 text-sm">{error}</AlertDescription>
          </Alert>
        )}

        {/* Contrôles principaux */}
        {!isLocationEnabled ? (
          <div className="text-center space-y-3">
            <div className="p-4 bg-stone-50 dark:bg-slate-700 rounded-lg">
              <MapPin className="h-8 w-8 text-slate-400 mx-auto mb-2" />
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">Trouvez des services près de chez vous</p>
              <Button
                onClick={enableLocation}
                disabled={isLoading}
                className="bg-indigo-600 hover:bg-indigo-700 text-white"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Localisation...
                  </>
                ) : (
                  <>
                    <Target className="h-4 w-4 mr-2" />
                    Activer la géolocalisation
                  </>
                )}
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Informations de localisation */}
            <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <div>
                  <p className="text-sm font-medium text-green-800 dark:text-green-200">Position activée</p>
                  <p className="text-xs text-green-600 dark:text-green-400">
                    Précision: ±{Math.round(userLocation?.accuracy || 0)}m
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={disableLocation}
                className="text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-200 text-xs h-6 px-2"
              >
                Désactiver
              </Button>
            </div>

            {/* Contrôle du rayon de recherche */}
            <div className="space-y-2">
              <Label className="text-slate-900 dark:text-white text-sm">Rayon de recherche: {searchRadius[0]} km</Label>
              <Slider
                value={searchRadius}
                onValueChange={setSearchRadius}
                max={20}
                min={1}
                step={1}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-slate-600 dark:text-slate-400">
                <span>1 km</span>
                <span>20 km</span>
              </div>
            </div>

            {/* Bouton de recherche manuelle */}
            <Button
              onClick={searchNearbyServices}
              disabled={isLoading}
              variant="outline"
              className="w-full border-stone-200 dark:border-slate-700 bg-transparent"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Recherche...
                </>
              ) : (
                <>
                  <Navigation className="h-4 w-4 mr-2" />
                  Rechercher à nouveau
                </>
              )}
            </Button>
          </div>
        )}

        {/* Résultats */}
        {nearbyServices.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-slate-900 dark:text-white text-sm">
                Services à proximité ({nearbyServices.length})
              </h3>
              <Badge
                variant="secondary"
                className="bg-indigo-100 text-indigo-800 dark:bg-indigo-900/20 dark:text-indigo-400 text-xs"
              >
                {searchRadius[0]} km
              </Badge>
            </div>

            <div className="space-y-2 max-h-64 overflow-y-auto">
              {nearbyServices.slice(0, 5).map((service) => (
                <div
                  key={service.id}
                  className="flex items-center justify-between p-3 border border-stone-200 dark:border-slate-700 rounded-lg hover:bg-stone-50 dark:hover:bg-slate-700 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-slate-900 dark:text-white text-sm truncate">{service.title}</h4>
                    <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
                      <span className="truncate">
                        {service.provider.prenom} {service.provider.nom}
                      </span>
                      <Badge variant="outline" className="text-xs">
                        {service.category}
                      </Badge>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-1 text-indigo-600 dark:text-indigo-400 mb-1">
                      <MapPin size={12} />
                      <span className="text-sm font-medium">{service.distance} km</span>
                    </div>
                    <div className="text-xs text-slate-600 dark:text-slate-400">{service.price} FCFA</div>
                  </div>
                </div>
              ))}
            </div>

            {nearbyServices.length > 5 && (
              <p className="text-xs text-slate-600 dark:text-slate-400 text-center">
                Et {nearbyServices.length - 5} autres services...
              </p>
            )}
          </div>
        )}

        {/* Conseils */}
        <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <div className="flex items-start gap-2">
            <Zap className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
            <div className="text-xs text-blue-800 dark:text-blue-200">
              <p className="font-medium mb-1">Conseils pour une meilleure recherche :</p>
              <ul className="space-y-1 text-blue-700 dark:text-blue-300">
                <li>• Activez le GPS pour une localisation précise</li>
                <li>• Augmentez le rayon si peu de résultats</li>
                <li>• Les services "À domicile" sont prioritaires</li>
              </ul>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default GeolocationService

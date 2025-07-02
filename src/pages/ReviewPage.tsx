"use client"

import { useState, useEffect } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { ArrowLeft, Star, Send, Clock, Users, CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import ThemeToggle from "../components/ThemeToggle"
import { useAuth } from "../context/AuthContext"
import { bookingService, reviewService, providerService, serviceService } from "../services/firebaseService"
import type { Client, Booking, Provider, Service } from "../types"

const ReviewPage = () => {
  const navigate = useNavigate()
  const { bookingId } = useParams()
  const { currentUser, userType } = useAuth()
  const [booking, setBooking] = useState<Booking | null>(null)
  const [provider, setProvider] = useState<Provider | null>(null)
  const [service, setService] = useState<Service | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)

  // États du formulaire
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState("")
  const [punctualityRating, setPunctualityRating] = useState(0)
  const [qualityRating, setQualityRating] = useState(0)
  const [communicationRating, setCommunicationRating] = useState(0)
  const [valueRating, setValueRating] = useState(0)

  const client = currentUser as Client

  // CORRECTION : Séparer les useEffect pour éviter les boucles infinies
  useEffect(() => {
    if (!currentUser || userType !== "client") {
      navigate("/client/login")
      return
    }
  }, [currentUser, userType, navigate])

  useEffect(() => {
    if (bookingId && currentUser && userType === "client") {
      loadBookingData()
    }
  }, [bookingId]) // Supprimer les dépendances qui causent la boucle

  const loadBookingData = async () => {
    if (!bookingId) return

    try {
      setIsLoading(true)

      // Récupérer toutes les réservations du client pour trouver celle-ci
      const clientBookings = await bookingService.getByClient(client.id!)
      const foundBooking = clientBookings.find((b) => b.id === bookingId)

      if (!foundBooking) {
        console.error("Réservation non trouvée")
        navigate("/client/dashboard")
        return
      }

      if (foundBooking.status !== "completed") {
        console.error("La réservation n'est pas terminée")
        navigate("/client/dashboard")
        return
      }

      if (foundBooking.hasReview) {
        console.error("Avis déjà laissé pour cette réservation")
        navigate("/client/dashboard")
        return
      }

      setBooking(foundBooking)

      // Récupérer les informations du prestataire et du service
      const [providerData, serviceData] = await Promise.all([
        providerService.getById(foundBooking.providerId),
        // Trouver le service dans tous les prestataires
        (async () => {
          const allProviders = await providerService.getAll()
          for (const prov of allProviders) {
            const services = await serviceService.getByProvider(prov.id!)
            const svc = services.find((s) => s.id === foundBooking.serviceId)
            if (svc) return svc
          }
          return null
        })(),
      ])

      setProvider(providerData)
      setService(serviceData)
    } catch (error) {
      console.error("Erreur lors du chargement des données:", error)
      navigate("/client/dashboard")
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmitReview = async () => {
    if (!booking || !provider || !service || rating === 0) return

    try {
      setIsSubmitting(true)

      await reviewService.create({
        clientId: client.id!,
        providerId: provider.id!,
        serviceId: service.id!,
        bookingId: booking.id!,
        rating,
        comment,
        punctualityRating,
        qualityRating,
        communicationRating,
        valueRating,
      })

      setIsSubmitted(true)

      // Rediriger après 3 secondes
      setTimeout(() => {
        navigate("/client/dashboard")
      }, 3000)
    } catch (error) {
      console.error("Erreur lors de la soumission de l'avis:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const StarRating = ({
    value,
    onChange,
    label,
    size = "w-8 h-8",
  }: {
    value: number
    onChange: (rating: number) => void
    label: string
    size?: string
  }) => (
    <div className="space-y-2">
      <Label className="text-sm font-medium text-slate-900 dark:text-white">{label}</Label>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            className={`${size} transition-colors ${
              star <= value
                ? "text-yellow-400 fill-yellow-400"
                : "text-slate-300 dark:text-slate-600 hover:text-yellow-300"
            }`}
          >
            <Star className="w-full h-full" />
          </button>
        ))}
      </div>
    </div>
  )

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

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-stone-50 dark:bg-slate-900 flex items-center justify-center">
        <Card className="w-full max-w-md mx-4 bg-white dark:bg-slate-800 border-stone-200 dark:border-slate-700">
          <CardContent className="text-center py-12">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2 text-slate-900 dark:text-white">Merci pour votre avis !</h2>
            <p className="text-slate-600 dark:text-slate-400 mb-6">
              Votre évaluation a été enregistrée avec succès. Elle aidera d'autres clients à faire leur choix.
            </p>
            <p className="text-sm text-slate-500 dark:text-slate-500">Redirection automatique vers le dashboard...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!booking || !provider || !service) {
    return (
      <div className="min-h-screen bg-stone-50 dark:bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2 text-slate-900 dark:text-white">Données non trouvées</h2>
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
          <h1 className="text-lg font-bold text-slate-900 dark:text-white">Laisser un avis</h1>
          <p className="text-xs text-slate-600 dark:text-slate-400">PROXYA</p>
        </div>

        <div className="w-16"></div>
      </div>

      <div className="max-w-2xl mx-auto p-4 space-y-6">
        {/* Informations de la réservation */}
        <Card className="bg-white dark:bg-slate-800 border-stone-200 dark:border-slate-700">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <Avatar className="h-12 w-12">
                <AvatarFallback className="bg-slate-900 text-white dark:bg-white dark:text-slate-900">
                  {provider.prenom[0]}
                  {provider.nom[0]}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1">
                <h3 className="font-semibold text-slate-900 dark:text-white text-lg">{service.title}</h3>
                <p className="text-slate-600 dark:text-slate-400">
                  avec {provider.prenom} {provider.nom}
                </p>
                <div className="flex items-center gap-4 mt-2 text-sm text-slate-600 dark:text-slate-400">
                  <div className="flex items-center gap-1">
                    <Clock size={14} />
                    {new Date(booking.date).toLocaleDateString()} à {booking.time}
                  </div>
                  {booking.groupSize && booking.groupSize > 1 && (
                    <div className="flex items-center gap-1">
                      <Users size={14} />
                      {booking.groupSize} personnes
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Formulaire d'évaluation */}
        <Card className="bg-white dark:bg-slate-800 border-stone-200 dark:border-slate-700">
          <CardHeader>
            <CardTitle className="text-slate-900 dark:text-white">Votre évaluation</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Note générale */}
            <StarRating value={rating} onChange={setRating} label="Note générale *" size="w-10 h-10" />

            {/* Critères détaillés */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <StarRating value={punctualityRating} onChange={setPunctualityRating} label="Ponctualité" />
              <StarRating value={qualityRating} onChange={setQualityRating} label="Qualité du service" />
              <StarRating value={communicationRating} onChange={setCommunicationRating} label="Communication" />
              <StarRating value={valueRating} onChange={setValueRating} label="Rapport qualité-prix" />
            </div>

            {/* Commentaire */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-slate-900 dark:text-white">Votre commentaire</Label>
              <Textarea
                placeholder="Partagez votre expérience avec ce prestataire. Votre avis aidera d'autres clients..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={4}
                className="bg-white dark:bg-slate-800 border-stone-200 dark:border-slate-700"
              />
              <p className="text-xs text-slate-500 dark:text-slate-500">
                Soyez respectueux et constructif dans vos commentaires.
              </p>
            </div>

            {/* Bouton de soumission */}
            <div className="flex gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => navigate("/client/dashboard")}
                className="flex-1 border-stone-200 dark:border-slate-700"
              >
                Annuler
              </Button>
              <Button
                onClick={handleSubmitReview}
                disabled={rating === 0 || isSubmitting}
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white"
              >
                {isSubmitting ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Envoi...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Send size={16} />
                    Publier l'avis
                  </div>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default ReviewPage

"use client"

import { useState, useEffect } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { ArrowLeft, Star, MessageSquare, ThumbsUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import { Textarea } from "@/components/ui/textarea"
import ThemeToggle from "../components/ThemeToggle"
import { useAuth } from "../context/AuthContext"
import { reviewService, providerService, clientService } from "../services/firebaseService"
import type { Review, ReviewStats, Provider, Client } from "../types"

const ReviewsPage = () => {
  const navigate = useNavigate()
  const { providerId } = useParams()
  const { currentUser, userType } = useAuth()
  const [provider, setProvider] = useState<Provider | null>(null)
  const [reviews, setReviews] = useState<Review[]>([])
  const [stats, setStats] = useState<ReviewStats | null>(null)
  const [clients, setClients] = useState<{ [key: string]: Client }>({})
  const [isLoading, setIsLoading] = useState(true)
  const [responseText, setResponseText] = useState("")
  const [respondingTo, setRespondingTo] = useState<string | null>(null)

  // CORRECTION : Séparer les useEffect pour éviter les boucles infinies
  useEffect(() => {
    if (providerId) {
      loadReviewsData()
    }
  }, [providerId]) // Supprimer les autres dépendances qui causent la boucle

  const loadReviewsData = async () => {
    if (!providerId) return

    try {
      setIsLoading(true)

      const [providerData, reviewsData, statsData] = await Promise.all([
        providerService.getById(providerId),
        reviewService.getByProvider(providerId),
        reviewService.getProviderStats(providerId),
      ])

      setProvider(providerData)
      setReviews(reviewsData)
      setStats(statsData)

      // Charger les informations des clients
      const clientIds = [...new Set(reviewsData.map((r) => r.clientId))]
      const clientsData: { [key: string]: Client } = {}

      for (const clientId of clientIds) {
        const client = await clientService.getById(clientId)
        if (client) {
          clientsData[clientId] = client
        }
      }

      setClients(clientsData)
    } catch (error) {
      console.error("Erreur lors du chargement des avis:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddResponse = async (reviewId: string) => {
    if (!responseText.trim()) return

    try {
      await reviewService.addProviderResponse(reviewId, responseText)
      setResponseText("")
      setRespondingTo(null)
      await loadReviewsData() // Recharger les données
    } catch (error) {
      console.error("Erreur lors de l'ajout de la réponse:", error)
    }
  }

  const handleMarkHelpful = async (reviewId: string) => {
    try {
      await reviewService.markAsHelpful(reviewId)
      await loadReviewsData() // Recharger pour mettre à jour le compteur
    } catch (error) {
      console.error("Erreur lors du marquage comme utile:", error)
    }
  }

  const formatDate = (date: Date) => {
    const now = new Date()
    const diffTime = Math.abs(now.getTime() - date.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays === 1) return "Aujourd'hui"
    if (diffDays === 2) return "Hier"
    if (diffDays <= 7) return `Il y a ${diffDays} jours`
    if (diffDays <= 30) return `Il y a ${Math.ceil(diffDays / 7)} semaines`

    return date.toLocaleDateString()
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-stone-50 dark:bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 dark:border-white mx-auto mb-4"></div>
          <p className="text-slate-600 dark:text-slate-400">Chargement des avis...</p>
        </div>
      </div>
    )
  }

  if (!provider || !stats) {
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
          <h1 className="text-lg font-bold text-slate-900 dark:text-white">Avis et évaluations</h1>
          <p className="text-xs text-slate-600 dark:text-slate-400">PROXYA</p>
        </div>

        <div className="w-16"></div>
      </div>

      <div className="max-w-4xl mx-auto p-4 space-y-6">
        {/* Profil du prestataire */}
        <Card className="bg-white dark:bg-slate-800 border-stone-200 dark:border-slate-700">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                <AvatarFallback className="bg-slate-900 text-white dark:bg-white dark:text-slate-900 text-lg">
                  {provider.prenom[0]}
                  {provider.nom[0]}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                  {provider.prenom} {provider.nom}
                </h2>
                <p className="text-slate-600 dark:text-slate-400 capitalize">{provider.expertise}</p>
                <div className="flex items-center gap-2 mt-2">
                  {renderStars(Math.round(stats.averageRating), "w-5 h-5")}
                  <span className="font-semibold text-slate-900 dark:text-white">{stats.averageRating.toFixed(1)}</span>
                  <span className="text-slate-600 dark:text-slate-400">({stats.totalReviews} avis)</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Statistiques détaillées */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Distribution des notes */}
          <Card className="bg-white dark:bg-slate-800 border-stone-200 dark:border-slate-700">
            <CardHeader>
              <CardTitle className="text-slate-900 dark:text-white">Distribution des notes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {[5, 4, 3, 2, 1].map((rating) => (
                <div key={rating} className="flex items-center gap-3">
                  <div className="flex items-center gap-1 w-12">
                    <span className="text-sm text-slate-600 dark:text-slate-400">{rating}</span>
                    <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                  </div>
                  <Progress
                    value={
                      stats.totalReviews > 0
                        ? (stats.ratingDistribution[rating as keyof typeof stats.ratingDistribution] /
                            stats.totalReviews) *
                          100
                        : 0
                    }
                    className="flex-1 h-2"
                  />
                  <span className="text-sm text-slate-600 dark:text-slate-400 w-8">
                    {stats.ratingDistribution[rating as keyof typeof stats.ratingDistribution]}
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Critères détaillés */}
          <Card className="bg-white dark:bg-slate-800 border-stone-200 dark:border-slate-700">
            <CardHeader>
              <CardTitle className="text-slate-900 dark:text-white">Évaluation par critère</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                { key: "punctuality", label: "Ponctualité" },
                { key: "quality", label: "Qualité" },
                { key: "communication", label: "Communication" },
                { key: "value", label: "Rapport qualité-prix" },
              ].map(({ key, label }) => (
                <div key={key} className="flex items-center justify-between">
                  <span className="text-sm text-slate-600 dark:text-slate-400">{label}</span>
                  <div className="flex items-center gap-2">
                    {renderStars(Math.round(stats.criteriaAverages[key as keyof typeof stats.criteriaAverages]))}
                    <span className="text-sm font-medium text-slate-900 dark:text-white">
                      {stats.criteriaAverages[key as keyof typeof stats.criteriaAverages].toFixed(1)}
                    </span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Liste des avis */}
        <Card className="bg-white dark:bg-slate-800 border-stone-200 dark:border-slate-700">
          <CardHeader>
            <CardTitle className="text-slate-900 dark:text-white">Tous les avis ({reviews.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {reviews.length === 0 ? (
              <div className="text-center py-12">
                <MessageSquare className="h-16 w-16 text-slate-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2 text-slate-900 dark:text-white">Aucun avis</h3>
                <p className="text-slate-600 dark:text-slate-400">Ce prestataire n'a pas encore reçu d'avis.</p>
              </div>
            ) : (
              <div className="space-y-6">
                {reviews.map((review) => {
                  const client = clients[review.clientId]
                  return (
                    <div
                      key={review.id}
                      className="border-b border-stone-200 dark:border-slate-700 last:border-b-0 pb-6 last:pb-0"
                    >
                      <div className="flex items-start gap-4">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback className="bg-indigo-600 text-white dark:bg-white dark:text-slate-900">
                            {client ? `${client.prenom[0]}${client.nom[0]}` : "CL"}
                          </AvatarFallback>
                        </Avatar>

                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <div>
                              <h4 className="font-medium text-slate-900 dark:text-white">
                                {client ? `${client.prenom} ${client.nom}` : "Client anonyme"}
                              </h4>
                              <div className="flex items-center gap-2">
                                {renderStars(review.rating)}
                                <span className="text-sm text-slate-600 dark:text-slate-400">
                                  {formatDate(review.createdAt)}
                                </span>
                              </div>
                            </div>
                            {review.isVerified && (
                              <Badge variant="outline" className="border-green-400 text-green-600">
                                Vérifié
                              </Badge>
                            )}
                          </div>

                          {/* Critères détaillés */}
                          {(review.punctualityRating ||
                            review.qualityRating ||
                            review.communicationRating ||
                            review.valueRating) && (
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3 text-xs">
                              {review.punctualityRating && (
                                <div className="flex items-center gap-1">
                                  <span className="text-slate-600 dark:text-slate-400">Ponctualité:</span>
                                  {renderStars(review.punctualityRating, "w-3 h-3")}
                                </div>
                              )}
                              {review.qualityRating && (
                                <div className="flex items-center gap-1">
                                  <span className="text-slate-600 dark:text-slate-400">Qualité:</span>
                                  {renderStars(review.qualityRating, "w-3 h-3")}
                                </div>
                              )}
                              {review.communicationRating && (
                                <div className="flex items-center gap-1">
                                  <span className="text-slate-600 dark:text-slate-400">Communication:</span>
                                  {renderStars(review.communicationRating, "w-3 h-3")}
                                </div>
                              )}
                              {review.valueRating && (
                                <div className="flex items-center gap-1">
                                  <span className="text-slate-600 dark:text-slate-400">Rapport Q/P:</span>
                                  {renderStars(review.valueRating, "w-3 h-3")}
                                </div>
                              )}
                            </div>
                          )}

                          {/* Commentaire */}
                          {review.comment && (
                            <p className="text-slate-700 dark:text-slate-300 mb-3 leading-relaxed">{review.comment}</p>
                          )}

                          {/* Réponse du prestataire */}
                          {review.providerResponse && (
                            <div className="bg-stone-50 dark:bg-slate-700 rounded-lg p-4 mb-3">
                              <div className="flex items-center gap-2 mb-2">
                                <Avatar className="h-6 w-6">
                                  <AvatarFallback className="bg-slate-900 text-white dark:bg-white dark:text-slate-900 text-xs">
                                    {provider.prenom[0]}
                                    {provider.nom[0]}
                                  </AvatarFallback>
                                </Avatar>
                                <span className="text-sm font-medium text-slate-900 dark:text-white">
                                  Réponse du prestataire
                                </span>
                                {review.providerResponseDate && (
                                  <span className="text-xs text-slate-600 dark:text-slate-400">
                                    • {formatDate(review.providerResponseDate)}
                                  </span>
                                )}
                              </div>
                              <p className="text-sm text-slate-700 dark:text-slate-300">{review.providerResponse}</p>
                            </div>
                          )}

                          {/* Actions */}
                          <div className="flex items-center gap-4">
                            <button
                              onClick={() => handleMarkHelpful(review.id!)}
                              className="flex items-center gap-1 text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
                            >
                              <ThumbsUp size={14} />
                              Utile ({review.helpfulCount || 0})
                            </button>

                            {/* Bouton de réponse pour le prestataire */}
                            {currentUser?.id === providerId && !review.providerResponse && (
                              <button
                                onClick={() => setRespondingTo(review.id!)}
                                className="text-sm text-indigo-600 hover:text-indigo-700 transition-colors"
                              >
                                Répondre
                              </button>
                            )}
                          </div>

                          {/* Formulaire de réponse */}
                          {respondingTo === review.id && (
                            <div className="mt-4 space-y-3">
                              <Textarea
                                placeholder="Répondez à cet avis de manière professionnelle..."
                                value={responseText}
                                onChange={(e) => setResponseText(e.target.value)}
                                rows={3}
                                className="bg-white dark:bg-slate-800 border-stone-200 dark:border-slate-700"
                              />
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  onClick={() => handleAddResponse(review.id!)}
                                  disabled={!responseText.trim()}
                                  className="bg-indigo-600 hover:bg-indigo-700 text-white"
                                >
                                  Publier la réponse
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    setRespondingTo(null)
                                    setResponseText("")
                                  }}
                                  className="border-stone-200 dark:border-slate-700"
                                >
                                  Annuler
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default ReviewsPage

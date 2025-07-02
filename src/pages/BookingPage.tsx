"use client"

import type React from "react"
import { useState, useEffect, useCallback } from "react"
import { useNavigate, useParams } from "react-router-dom"
import {
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  Users,
  Zap,
  CreditCard,
  Star,
  Check,
  AlertCircle,
  Phone,
  MessageSquare,
  Tag,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import ThemeToggle from "../components/ThemeToggle"
import { useAuth } from "../context/AuthContext"
import { serviceService, providerService, bookingService } from "../services/firebaseService"
import { formatPrice } from "../utils/currency"
import type { Service, Provider, Client, Booking } from "../types"

const BookingPage = () => {
  const navigate = useNavigate()
  const { serviceId } = useParams()
  const { currentUser, userType } = useAuth()
  const [service, setService] = useState<Service | null>(null)
  const [provider, setProvider] = useState<Provider | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isBooking, setIsBooking] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  const client = currentUser as Client

  // CORRECTION : État du formulaire avec useCallback pour éviter les re-renders
  const [bookingData, setBookingData] = useState({
    date: "",
    time: "",
    isUrgent: false,
    groupSize: 1,
    paymentMethod: "",
    notes: "",
    referralCode: "",
    clientAddress: "",
    clientPhone: "",
  })

  // NOUVEAU : Fonction stable pour mettre à jour les données de réservation
  const updateBookingData = useCallback((updates: Partial<typeof bookingData>) => {
    setBookingData((prev) => ({ ...prev, ...updates }))
  }, [])

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
      // Pour cette démo, on va chercher le service dans tous les services
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
        updateBookingData({
          clientAddress: client?.adresse || "",
          clientPhone: client?.telephone || "",
        })
      } else {
        setError("Service non trouvé")
      }
    } catch (err) {
      console.error("Erreur lors du chargement:", err)
      setError("Erreur lors du chargement du service")
    } finally {
      setIsLoading(false)
    }
  }

  const calculateTotalPrice = useCallback(() => {
    if (!service) return 0

    const basePrice = service.price
    let total = basePrice

    // Prix de groupe (réduction pour plusieurs personnes)
    if (service.isGroupService && bookingData.groupSize > 1) {
      const groupDiscount = Math.min((bookingData.groupSize - 1) * 0.1, 0.3) // Max 30% de réduction
      total = basePrice * bookingData.groupSize * (1 - groupDiscount)
    }

    // Supplément urgent
    if (bookingData.isUrgent && service.isUrgentAvailable) {
      total *= service.urgentPriceMultiplier || 1.5
    }

    return Math.round(total)
  }, [service, bookingData.groupSize, bookingData.isUrgent])

  const getAvailableTimeSlots = () => {
    if (!service?.availability?.timeSlots) return []

    const selectedDate = new Date(bookingData.date)
    const dayName = selectedDate.toLocaleDateString("fr-FR", { weekday: "long" })
    const dayNameCapitalized = dayName.charAt(0).toUpperCase() + dayName.slice(1)

    // Vérifier si le jour est disponible
    if (!service.availability.days.includes(dayNameCapitalized)) {
      return []
    }

    return service.availability.timeSlots
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsBooking(true)
    setError("")

    try {
      if (!service || !provider || !client?.id) {
        setError("Informations manquantes")
        return
      }

      if (!bookingData.date || !bookingData.time || !bookingData.paymentMethod) {
        setError("Veuillez remplir tous les champs obligatoires")
        return
      }

      // Vérifier que la date n'est pas dans le passé
      const selectedDate = new Date(bookingData.date)
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      if (selectedDate < today) {
        setError("Vous ne pouvez pas réserver pour une date passée")
        return
      }

      // Vérifier les créneaux disponibles
      const availableSlots = getAvailableTimeSlots()
      if (availableSlots.length === 0) {
        setError("Aucun créneau disponible pour cette date")
        return
      }

      if (!availableSlots.includes(bookingData.time)) {
        setError("Créneau non disponible")
        return
      }

      const booking: Omit<Booking, "id" | "createdAt"> = {
        clientId: client.id,
        providerId: provider.id!,
        serviceId: service.id!,
        date: selectedDate,
        time: bookingData.time,
        status: "pending",
        totalPrice: calculateTotalPrice(),
        notes: bookingData.notes,
        isUrgent: bookingData.isUrgent,
        groupSize: bookingData.groupSize,
        paymentMethod: bookingData.paymentMethod,
        referralCode: bookingData.referralCode,
      }

      await bookingService.create(booking)
      setSuccess("Réservation créée avec succès !")

      // Rediriger vers le dashboard après 2 secondes
      setTimeout(() => {
        navigate("/client/dashboard")
      }, 2000)
    } catch (err) {
      console.error("Erreur:", err)
      setError("Une erreur est survenue. Veuillez réessayer.")
    } finally {
      setIsBooking(false)
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
          <h1 className="text-lg font-bold text-slate-900 dark:text-white">Réserver un service</h1>
          <p className="text-xs text-slate-600 dark:text-slate-400">PROXYA</p>
        </div>

        <div className="w-16"></div>
      </div>

      <div className="max-w-4xl mx-auto p-4">
        {/* Messages */}
        {error && (
          <Alert className="mb-6 border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20">
            <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
            <AlertDescription className="text-red-700 dark:text-red-300">{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="mb-6 border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20">
            <Check className="h-4 w-4 text-green-600 dark:text-green-400" />
            <AlertDescription className="text-green-700 dark:text-green-300">{success}</AlertDescription>
          </Alert>
        )}

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Formulaire de réservation */}
          <div className="lg:col-span-2">
            <Card className="bg-white dark:bg-slate-800 border-stone-200 dark:border-slate-700">
              <CardHeader>
                <CardTitle className="text-slate-900 dark:text-white">Détails de la réservation</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Date et heure */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="date" className="text-slate-900 dark:text-white">
                        Date *
                      </Label>
                      <div className="relative">
                        <Calendar size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <Input
                          id="date"
                          type="date"
                          min={new Date().toISOString().split("T")[0]}
                          className="pl-10 bg-white dark:bg-slate-800 border-stone-200 dark:border-slate-700"
                          value={bookingData.date}
                          onChange={(e) => updateBookingData({ date: e.target.value, time: "" })}
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="time" className="text-slate-900 dark:text-white">
                        Créneau *
                      </Label>
                      <Select
                        value={bookingData.time}
                        onValueChange={(value) => updateBookingData({ time: value })}
                        disabled={!bookingData.date}
                      >
                        <SelectTrigger className="bg-white dark:bg-slate-800 border-stone-200 dark:border-slate-700">
                          <SelectValue placeholder="Sélectionnez un créneau" />
                        </SelectTrigger>
                        <SelectContent>
                          {getAvailableTimeSlots().map((slot) => (
                            <SelectItem key={slot} value={slot}>
                              <div className="flex items-center gap-2">
                                <Clock size={14} />
                                {slot}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {bookingData.date && getAvailableTimeSlots().length === 0 && (
                        <p className="text-xs text-red-600 dark:text-red-400">
                          Aucun créneau disponible pour cette date
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Options spéciales */}
                  <div className="space-y-4">
                    {/* Service de groupe */}
                    {service.isGroupService && (
                      <div className="space-y-2">
                        <Label className="text-slate-900 dark:text-white flex items-center gap-2">
                          <Users size={16} />
                          Nombre de personnes
                        </Label>
                        <Select
                          value={bookingData.groupSize.toString()}
                          onValueChange={(value) => updateBookingData({ groupSize: Number.parseInt(value) })}
                        >
                          <SelectTrigger className="bg-white dark:bg-slate-800 border-stone-200 dark:border-slate-700">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {Array.from({ length: service.maxGroupSize || 5 }, (_, i) => i + 1).map((num) => (
                              <SelectItem key={num} value={num.toString()}>
                                {num} personne{num > 1 ? "s" : ""}
                                {num > 1 && (
                                  <span className="text-green-600 ml-2">
                                    (-{Math.min((num - 1) * 10, 30)}% de réduction)
                                  </span>
                                )}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    {/* Service urgent */}
                    {service.isUrgentAvailable && (
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="urgent"
                          checked={bookingData.isUrgent}
                          onCheckedChange={(checked) => updateBookingData({ isUrgent: checked as boolean })}
                        />
                        <Label htmlFor="urgent" className="text-slate-900 dark:text-white flex items-center gap-2">
                          <Zap size={16} className="text-yellow-500" />
                          Service urgent (même jour)
                          <Badge variant="outline" className="text-xs">
                            +{((service.urgentPriceMultiplier || 1.5) - 1) * 100}%
                          </Badge>
                        </Label>
                      </div>
                    )}
                  </div>

                  {/* Adresse et contact */}
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="clientAddress" className="text-slate-900 dark:text-white">
                        Adresse du service *
                      </Label>
                      <div className="relative">
                        <MapPin size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <Input
                          id="clientAddress"
                          type="text"
                          placeholder="Votre adresse complète"
                          className="pl-10 bg-white dark:bg-slate-800 border-stone-200 dark:border-slate-700"
                          value={bookingData.clientAddress}
                          onChange={(e) => updateBookingData({ clientAddress: e.target.value })}
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="clientPhone" className="text-slate-900 dark:text-white">
                        Téléphone de contact *
                      </Label>
                      <div className="relative">
                        <Phone size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <Input
                          id="clientPhone"
                          type="tel"
                          placeholder="Votre numéro de téléphone"
                          className="pl-10 bg-white dark:bg-slate-800 border-stone-200 dark:border-slate-700"
                          value={bookingData.clientPhone}
                          onChange={(e) => updateBookingData({ clientPhone: e.target.value })}
                          required
                        />
                      </div>
                    </div>
                  </div>

                  {/* Moyen de paiement */}
                  <div className="space-y-2">
                    <Label htmlFor="payment" className="text-slate-900 dark:text-white">
                      Moyen de paiement *
                    </Label>
                    <Select
                      value={bookingData.paymentMethod}
                      onValueChange={(value) => updateBookingData({ paymentMethod: value })}
                    >
                      <SelectTrigger className="bg-white dark:bg-slate-800 border-stone-200 dark:border-slate-700">
                        <SelectValue placeholder="Choisissez votre moyen de paiement" />
                      </SelectTrigger>
                      <SelectContent>
                        {service.paymentOptions?.map((option) => (
                          <SelectItem key={option} value={option}>
                            <div className="flex items-center gap-2">
                              <CreditCard size={14} />
                              {option}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* NOUVEAU : Code de parrainage */}
                  <div className="space-y-2">
                    <Label htmlFor="referral" className="text-slate-900 dark:text-white">
                      Code de parrainage (optionnel)
                    </Label>
                    <div className="relative">
                      <Tag size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <Input
                        id="referral"
                        type="text"
                        placeholder="Code de parrainage pour une réduction"
                        className="pl-10 bg-white dark:bg-slate-800 border-stone-200 dark:border-slate-700"
                        value={bookingData.referralCode}
                        onChange={(e) => updateBookingData({ referralCode: e.target.value })}
                      />
                    </div>
                    {bookingData.referralCode && (
                      <p className="text-xs text-green-600 dark:text-green-400">
                        ✅ Code promo appliqué ! Réduction de 10%
                      </p>
                    )}
                  </div>

                  {/* Notes */}
                  <div className="space-y-2">
                    <Label htmlFor="notes" className="text-slate-900 dark:text-white">
                      Notes et demandes spéciales
                    </Label>
                    <Textarea
                      id="notes"
                      placeholder="Précisez vos attentes, contraintes ou demandes particulières..."
                      className="bg-white dark:bg-slate-800 border-stone-200 dark:border-slate-700"
                      value={bookingData.notes}
                      onChange={(e) => updateBookingData({ notes: e.target.value })}
                    />
                  </div>

                  {/* Bouton de réservation */}
                  <Button
                    type="submit"
                    disabled={isBooking}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3"
                  >
                    {isBooking ? (
                      "Réservation en cours..."
                    ) : (
                      <>
                        <Calendar size={16} className="mr-2" />
                        Confirmer la réservation - {formatPrice(calculateTotalPrice())}
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Résumé du service */}
          <div className="space-y-6">
            {/* Informations du service */}
            <Card className="bg-white dark:bg-slate-800 border-stone-200 dark:border-slate-700">
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-slate-900 dark:text-white mb-2">{service.title}</h3>
                    <Badge
                      variant="secondary"
                      className="bg-stone-200 text-slate-900 dark:bg-slate-700 dark:text-slate-300"
                    >
                      {service.category}
                    </Badge>
                  </div>

                  <div className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
                    <div className="flex items-center gap-2">
                      <Clock size={14} />
                      <span>{service.duration} minutes</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin size={14} />
                      <span>{getLocationText(service.location || "domicile")}</span>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-slate-600 dark:text-slate-400">Prix de base</span>
                      <span className="text-slate-900 dark:text-white">{formatPrice(service.price)}</span>
                    </div>

                    {service.isGroupService && bookingData.groupSize > 1 && (
                      <div className="flex justify-between">
                        <span className="text-slate-600 dark:text-slate-400">
                          Groupe ({bookingData.groupSize} pers.)
                        </span>
                        <span className="text-green-600">-{Math.min((bookingData.groupSize - 1) * 10, 30)}%</span>
                      </div>
                    )}

                    {bookingData.isUrgent && service.isUrgentAvailable && (
                      <div className="flex justify-between">
                        <span className="text-slate-600 dark:text-slate-400">Supplément urgent</span>
                        <span className="text-yellow-600">+{((service.urgentPriceMultiplier || 1.5) - 1) * 100}%</span>
                      </div>
                    )}

                    {bookingData.referralCode && (
                      <div className="flex justify-between">
                        <span className="text-slate-600 dark:text-slate-400">Code promo</span>
                        <span className="text-green-600">-10%</span>
                      </div>
                    )}

                    <Separator />

                    <div className="flex justify-between font-semibold">
                      <span className="text-slate-900 dark:text-white">Total</span>
                      <span className="text-slate-900 dark:text-white text-lg">
                        {formatPrice(calculateTotalPrice())}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Profil du prestataire */}
            <Card className="bg-white dark:bg-slate-800 border-stone-200 dark:border-slate-700">
              <CardContent className="p-6">
                <div className="flex items-center gap-4 mb-4">
                  <Avatar className="h-12 w-12">
                    <AvatarFallback className="bg-slate-900 text-white dark:bg-white dark:text-slate-900">
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

                <div className="space-y-2">
                  <Button variant="outline" className="w-full border-stone-200 dark:border-slate-700 bg-transparent">
                    <MessageSquare size={16} className="mr-2" />
                    Contacter le prestataire
                  </Button>
                  <Button variant="outline" className="w-full border-stone-200 dark:border-slate-700 bg-transparent">
                    Voir le profil complet
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Caractéristiques incluses */}
            {service.features && service.features.length > 0 && (
              <Card className="bg-white dark:bg-slate-800 border-stone-200 dark:border-slate-700">
                <CardHeader>
                  <CardTitle className="text-slate-900 dark:text-white text-sm">Ce qui est inclus</CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-2">
                    {service.features.map((feature, index) => (
                      <div key={index} className="flex items-center gap-2 text-sm">
                        <Check size={12} className="text-green-600 dark:text-green-400" />
                        <span className="text-slate-700 dark:text-slate-300">{feature}</span>
                      </div>
                    ))}
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

export default BookingPage

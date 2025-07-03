"use client"

import { AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import {
  User,
  Settings,
  Calendar,
  MessageSquare,
  Star,
  TrendingUp,
  Plus,
  LogOut,
  Filter,
  Clock,
  Briefcase,
  Edit,
  Trash2,
  Eye,
  AlertCircle,
  Bot,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import ThemeToggle from "../components/ThemeToggle"
import { useAuth } from "../context/AuthContext"
import { bookingService, serviceService, messageService } from "../services/firebaseService"
import type { Provider, Booking, Service } from "../types"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

const ProviderDashboard = () => {
  const navigate = useNavigate()
  const { currentUser, userType, logout } = useAuth()
  const [bookings, setBookings] = useState<Booking[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("overview")
  const [services, setServices] = useState<Service[]>([])
  const [serviceToDelete, setServiceToDelete] = useState<string | null>(null)
  const [unreadMessages, setUnreadMessages] = useState(0)
  const [loadingBookings, setLoadingBookings] = useState<{ [key: string]: string }>({})
  const [successMessage, setSuccessMessage] = useState<string>("")
  const [showSuccess, setShowSuccess] = useState(false)
  const [error, setError] = useState<string>("")

  const provider = currentUser as Provider

  useEffect(() => {
    console.log("ProviderDashboard - useEffect déclenché", { currentUser, userType })
    if (!currentUser || userType !== "provider") {
      console.log("Redirection vers login - utilisateur non connecté ou mauvais type")
      navigate("/provider/login")
      return
    }
    loadData()
  }, [])

  useEffect(() => {
    if (!currentUser || userType !== "provider") {
      navigate("/provider/login")
    }
  }, [currentUser, userType, navigate])

  const loadData = async () => {
    try {
      console.log("Début du chargement des données prestataire...")
      setIsLoading(true)
      setError("")

      if (!provider?.id) {
        console.error("ID prestataire manquant")
        setError("Erreur: ID prestataire manquant")
        return
      }

      console.log("Chargement des données pour le prestataire:", provider.id)

      const [providerBookings, providerServices, unreadCount] = await Promise.allSettled([
        bookingService.getByProvider(provider.id),
        serviceService.getByProvider(provider.id),
        messageService.countUnreadMessages(provider.id),
      ])

      if (providerBookings.status === "fulfilled") {
        setBookings(providerBookings.value)
        console.log("Réservations chargées:", providerBookings.value.length)
      } else {
        console.error("Erreur chargement réservations:", providerBookings.reason)
        setBookings([])
      }

      if (providerServices.status === "fulfilled") {
        setServices(providerServices.value)
        console.log("Services chargés:", providerServices.value.length)
      } else {
        console.error("Erreur chargement services:", providerServices.reason)
        setServices([])
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

  const handleDeleteService = async (serviceId: string) => {
    try {
      await serviceService.delete(serviceId)
      await loadData()
      setServiceToDelete(null)
    } catch (error) {
      console.error("Erreur lors de la suppression:", error)
    }
  }

  const handleLogout = () => {
    logout()
    navigate("/")
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

  const handleBookingAction = async (bookingId: string, action: "confirmed" | "cancelled" | "completed") => {
    try {
      setLoadingBookings((prev) => ({ ...prev, [bookingId]: action }))
      await bookingService.updateStatus(bookingId, action)

      const messages = {
        confirmed: "✅ Réservation acceptée avec succès !",
        cancelled: "❌ Réservation refusée",
        completed: "🎉 Mission marquée comme terminée !",
      }

      setSuccessMessage(messages[action])
      setShowSuccess(true)
      await loadData()

      setTimeout(() => {
        setShowSuccess(false)
        setSuccessMessage("")
      }, 3000)
    } catch (error) {
      console.error("Erreur lors de l'action:", error)
      setSuccessMessage("❌ Erreur lors de l'action. Veuillez réessayer.")
      setShowSuccess(true)
      setTimeout(() => {
        setShowSuccess(false)
        setSuccessMessage("")
      }, 3000)
    } finally {
      setLoadingBookings((prev) => {
        const newState = { ...prev }
        delete newState[bookingId]
        return newState
      })
    }
  }

  const stats = {
    totalBookings: bookings.length,
    pendingBookings: bookings.filter((b) => b.status === "pending").length,
    completedBookings: bookings.filter((b) => b.status === "completed").length,
    revenue: bookings.filter((b) => b.status === "completed").reduce((sum, b) => sum + b.totalPrice, 0),
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-stone-50 dark:bg-slate-900 flex items-center justify-center px-4">
        <div className="text-center max-w-sm mx-auto">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900 dark:border-white mx-auto mb-4"></div>
          <p className="text-slate-600 dark:text-slate-400">Chargement de votre espace prestataire...</p>
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
    <div className="min-h-screen bg-stone-50 dark:bg-slate-900">
      <ThemeToggle />

      {/* Header fixe avec largeur réduite */}
      <div className="sticky top-0 z-50 bg-white dark:bg-slate-800 border-b border-stone-200 dark:border-slate-700 shadow-sm">
        <div className="max-w-sm mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-slate-900 text-white dark:bg-white dark:text-slate-900 text-sm">
                  {provider?.prenom?.[0] || "P"}
                  {provider?.nom?.[0] || "R"}
                </AvatarFallback>
              </Avatar>
              <div>
                <h1 className="font-semibold text-slate-900 dark:text-white text-sm">
                  {provider?.prenom || "Prestataire"} {provider?.nom || ""}
                </h1>
                <p className="text-xs text-slate-600 dark:text-slate-400">Prestataire</p>
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
              { id: "overview", label: "Vue d'ensemble", icon: TrendingUp },
              { id: "services", label: "Services", icon: Briefcase },
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
                    ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900"
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

      {/* Notification de succès */}
      {showSuccess && (
        <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 animate-in slide-in-from-top-2">
          <div className="bg-white dark:bg-slate-800 border border-green-200 dark:border-green-800 rounded-lg shadow-lg p-3 max-w-sm">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <p className="text-sm font-medium text-slate-900 dark:text-white">{successMessage}</p>
            </div>
          </div>
        </div>
      )}

      {/* Contenu principal avec largeur réduite */}
      <div className="max-w-sm mx-auto px-4 py-4">
        {activeTab === "overview" && (
          <div className="space-y-4">
            {/* Stats Cards */}
            <div className="grid grid-cols-2 gap-3">
              <Card className="bg-white dark:bg-slate-800 border-stone-200 dark:border-slate-700">
                <CardContent className="p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <Calendar className="h-3 w-3 text-slate-600 dark:text-slate-400" />
                    <span className="text-xs text-slate-600 dark:text-slate-400">Total</span>
                  </div>
                  <div className="text-lg font-bold text-slate-900 dark:text-white">{stats.totalBookings}</div>
                  <p className="text-xs text-slate-600 dark:text-slate-400">Réservations</p>
                </CardContent>
              </Card>

              <Card className="bg-white dark:bg-slate-800 border-stone-200 dark:border-slate-700">
                <CardContent className="p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <Clock className="h-3 w-3 text-yellow-600" />
                    <span className="text-xs text-slate-600 dark:text-slate-400">En attente</span>
                  </div>
                  <div className="text-lg font-bold text-yellow-600">{stats.pendingBookings}</div>
                  <p className="text-xs text-slate-600 dark:text-slate-400">À traiter</p>
                </CardContent>
              </Card>

              <Card className="bg-white dark:bg-slate-800 border-stone-200 dark:border-slate-700">
                <CardContent className="p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <Star className="h-3 w-3 text-green-600" />
                    <span className="text-xs text-slate-600 dark:text-slate-400">Terminées</span>
                  </div>
                  <div className="text-lg font-bold text-green-600">{stats.completedBookings}</div>
                  <p className="text-xs text-slate-600 dark:text-slate-400">Missions</p>
                </CardContent>
              </Card>

              <Card className="bg-white dark:bg-slate-800 border-stone-200 dark:border-slate-700">
                <CardContent className="p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <TrendingUp className="h-3 w-3 text-blue-600" />
                    <span className="text-xs text-slate-600 dark:text-slate-400">Revenus</span>
                  </div>
                  <div className="text-sm font-bold text-blue-600">{stats.revenue} FCFA</div>
                  <p className="text-xs text-slate-600 dark:text-slate-400">Ce mois</p>
                </CardContent>
              </Card>
            </div>

            {/* Réservations récentes */}
            <Card className="bg-white dark:bg-slate-800 border-stone-200 dark:border-slate-700">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center justify-between text-slate-900 dark:text-white text-sm">
                  <span>Réservations récentes</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setActiveTab("bookings")}
                    className="border-stone-200 dark:border-slate-700 text-xs h-6 px-2"
                  >
                    Voir tout
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                {bookings.length === 0 ? (
                  <div className="text-center py-6">
                    <Calendar className="h-8 w-8 text-slate-400 mx-auto mb-2" />
                    <h3 className="font-semibold mb-1 text-slate-900 dark:text-white text-sm">Aucune réservation</h3>
                    <p className="text-slate-600 dark:text-slate-400 text-xs">Vos réservations apparaîtront ici.</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {bookings.slice(0, 3).map((booking) => (
                      <div
                        key={booking.id}
                        className="flex items-center justify-between p-2 border border-stone-200 dark:border-slate-700 rounded-lg"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-slate-900 dark:text-white text-xs truncate">
                              #{booking.id?.slice(-6)}
                            </span>
                            <Badge className={`${getStatusColor(booking.status)} text-xs px-1 py-0`}>
                              {getStatusText(booking.status)}
                            </Badge>
                          </div>
                          <p className="text-xs text-slate-600 dark:text-slate-400">
                            {new Date(booking.date).toLocaleDateString()} à {booking.time}
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold text-slate-900 dark:text-white text-xs">
                            {booking.totalPrice} FCFA
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === "bookings" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Mes Réservations</h2>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  className="border-stone-200 dark:border-slate-700 text-xs h-7 px-2 bg-transparent"
                >
                  <Filter size={12} />
                </Button>
              </div>
            </div>

            {bookings.length === 0 ? (
              <Card className="bg-white dark:bg-slate-800 border-stone-200 dark:border-slate-700">
                <CardContent className="text-center py-8">
                  <Calendar className="h-12 w-12 text-slate-400 mx-auto mb-3" />
                  <h3 className="text-lg font-semibold mb-2 text-slate-900 dark:text-white">Aucune réservation</h3>
                  <p className="text-slate-600 dark:text-slate-400 mb-4 text-sm">
                    Créez vos services pour commencer à recevoir des demandes.
                  </p>
                  <Button
                    onClick={() => navigate("/provider/create-service")}
                    className="bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-stone-100 dark:text-slate-900"
                  >
                    <Plus size={16} className="mr-2" />
                    Créer un service
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
                          </div>
                          <p className="text-slate-600 dark:text-slate-400 text-xs">
                            {new Date(booking.date).toLocaleDateString()} à {booking.time}
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold text-slate-900 dark:text-white">
                            {booking.totalPrice} FCFA
                          </div>
                        </div>
                      </div>

                      {booking.notes && (
                        <div className="mb-3">
                          <h4 className="font-medium mb-1 text-slate-900 dark:text-white text-xs">Notes du client :</h4>
                          <p className="text-xs text-slate-600 dark:text-slate-400">{booking.notes}</p>
                        </div>
                      )}

                      <div className="flex flex-wrap gap-2">
                        {booking.status === "pending" && (
                          <>
                            <Button
                              size="sm"
                              onClick={() => handleBookingAction(booking.id!, "confirmed")}
                              disabled={!!loadingBookings[booking.id!]}
                              className="bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-stone-100 dark:text-slate-900 disabled:opacity-50 text-xs h-7 px-3"
                            >
                              {loadingBookings[booking.id!] === "confirmed" ? "..." : "Accepter"}
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleBookingAction(booking.id!, "cancelled")}
                              disabled={!!loadingBookings[booking.id!]}
                              className="border-stone-200 dark:border-slate-700 disabled:opacity-50 text-xs h-7 px-3"
                            >
                              {loadingBookings[booking.id!] === "cancelled" ? "..." : "Refuser"}
                            </Button>
                          </>
                        )}
                        {booking.status === "confirmed" && (
                          <Button
                            size="sm"
                            onClick={() => handleBookingAction(booking.id!, "completed")}
                            disabled={!!loadingBookings[booking.id!]}
                            className="bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-stone-100 dark:text-slate-900 disabled:opacity-50 text-xs h-7 px-3"
                          >
                            {loadingBookings[booking.id!] === "completed" ? "..." : "Terminer"}
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-stone-200 dark:border-slate-700 text-xs h-7 px-3 bg-transparent"
                          onClick={() => navigate(`/messages/${booking.clientId}`)}
                        >
                          <MessageSquare size={12} className="mr-1" />
                          Contact
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "services" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Mes Services</h2>
              <Button
                onClick={() => navigate("/provider/create-service")}
                className="bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-stone-100 dark:text-slate-900 text-xs h-8 px-3"
              >
                <Plus size={14} className="mr-1" />
                Créer
              </Button>
            </div>

            {services.length === 0 ? (
              <Card className="bg-white dark:bg-slate-800 border-stone-200 dark:border-slate-700">
                <CardContent className="text-center py-8">
                  <Briefcase className="h-12 w-12 text-slate-400 mx-auto mb-3" />
                  <h3 className="text-lg font-semibold mb-2 text-slate-900 dark:text-white">Aucun service</h3>
                  <p className="text-slate-600 dark:text-slate-400 mb-4 text-sm">
                    Créez votre premier service pour commencer.
                  </p>
                  <Button
                    onClick={() => navigate("/provider/create-service")}
                    className="bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-stone-100 dark:text-slate-900"
                  >
                    <Plus size={16} className="mr-2" />
                    Créer un service
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {services.map((service) => (
                  <Card key={service.id} className="bg-white dark:bg-slate-800 border-stone-200 dark:border-slate-700">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-slate-900 dark:text-white mb-1 text-sm truncate">
                            {service.title}
                          </h3>
                          <Badge
                            variant="secondary"
                            className="bg-stone-200 text-slate-900 dark:bg-slate-700 dark:text-slate-300 mb-2 text-xs"
                          >
                            {service.category}
                          </Badge>
                        </div>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => navigate(`/provider/service-preview/${service.id}`)}
                            title="Voir"
                          >
                            <Eye size={12} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => navigate(`/provider/edit-service/${service.id}`)}
                            title="Modifier"
                          >
                            <Edit size={12} />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 text-red-500 hover:text-red-700"
                                title="Supprimer"
                              >
                                <Trash2 size={12} />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent className="max-w-sm mx-auto">
                              <AlertDialogHeader>
                                <AlertDialogTitle className="text-sm">Supprimer le service</AlertDialogTitle>
                                <AlertDialogDescription className="text-xs">
                                  Supprimer "{service.title}" ? Cette action est irréversible.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel className="text-xs h-8 px-3">Annuler</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDeleteService(service.id!)}
                                  className="bg-red-600 hover:bg-red-700 text-xs h-8 px-3"
                                >
                                  Supprimer
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>

                      <p className="text-xs text-slate-600 dark:text-slate-400 mb-3 line-clamp-2">
                        {service.description}
                      </p>

                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-lg font-bold text-slate-900 dark:text-white">{service.price} FCFA</div>
                          <div className="text-xs text-slate-600 dark:text-slate-400">{service.duration}min</div>
                        </div>
                        <div className="text-right">
                          <div
                            className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${
                              service.isActive
                                ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400"
                                : "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400"
                            }`}
                          >
                            {service.isActive ? "Actif" : "Inactif"}
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

        {activeTab === "profile" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Mon Profil</h2>
              <Button
                onClick={() => navigate("/provider/my-profile")}
                className="bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-stone-100 dark:text-slate-900 text-xs h-8 px-3"
              >
                Voir profil
              </Button>
            </div>

            <Card className="bg-white dark:bg-slate-800 border-stone-200 dark:border-slate-700">
              <CardHeader className="pb-2">
                <CardTitle className="text-slate-900 dark:text-white text-sm">Aperçu du profil</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12">
                    <AvatarFallback className="bg-slate-900 text-white dark:bg-white dark:text-slate-900">
                      {provider?.prenom?.[0] || "P"}
                      {provider?.nom?.[0] || "R"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-slate-900 dark:text-white text-sm truncate">
                      {provider?.prenom || "Prestataire"} {provider?.nom || ""}
                    </h3>
                    <p className="text-slate-600 dark:text-slate-400 capitalize text-xs truncate">
                      {provider?.expertise || "Non renseigné"}
                    </p>
                    <div className="flex items-center gap-1 mt-1">
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            size={12}
                            className={`${
                              star <= (provider?.rating || 0)
                                ? "fill-yellow-400 text-yellow-400"
                                : "text-gray-300 dark:text-gray-600"
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-xs font-medium text-slate-900 dark:text-white">
                        {provider?.rating?.toFixed(1) || "5.0"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-slate-600 dark:text-slate-400">Email:</span>
                    <p className="font-medium text-slate-900 dark:text-white truncate">
                      {provider?.email || "Non renseigné"}
                    </p>
                  </div>
                  <div>
                    <span className="text-slate-600 dark:text-slate-400">Téléphone:</span>
                    <p className="font-medium text-slate-900 dark:text-white">
                      {provider?.telephone || "Non renseigné"}
                    </p>
                  </div>
                  <div>
                    <span className="text-slate-600 dark:text-slate-400">Ville:</span>
                    <p className="font-medium text-slate-900 dark:text-white truncate">
                      {provider?.ville || "Non renseigné"}
                    </p>
                  </div>
                  <div>
                    <span className="text-slate-600 dark:text-slate-400">Expérience:</span>
                    <p className="font-medium text-slate-900 dark:text-white">{provider?.experience || 0} ans</p>
                  </div>
                </div>

                <div>
                  <span className="text-slate-600 dark:text-slate-400 text-xs">Catégories:</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {provider?.categories?.map((category) => (
                      <Badge
                        key={category}
                        variant="secondary"
                        className="bg-stone-200 text-slate-900 dark:bg-slate-700 dark:text-slate-300 text-xs"
                      >
                        {category}
                      </Badge>
                    )) || <span className="text-slate-500 text-xs">Aucune catégorie</span>}
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <Button
                    onClick={() => navigate("/provider/my-profile")}
                    className="flex-1 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-stone-100 dark:text-slate-900 text-xs h-8"
                  >
                    Voir profil
                  </Button>
                  <Button
                    onClick={() => navigate("/provider/edit-profile")}
                    variant="outline"
                    className="flex-1 border-stone-200 dark:border-slate-700 text-xs h-8"
                  >
                    <Settings size={12} className="mr-1" />
                    Modifier
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}

export default ProviderDashboard

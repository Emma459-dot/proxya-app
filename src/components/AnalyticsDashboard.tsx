"use client"

import type React from "react"
import { useState, useMemo } from "react"
import { BarChart3, TrendingUp, TrendingDown, Calendar, DollarSign, Star, Target, Award, Filter } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { Booking, Service } from "../types"

interface AnalyticsDashboardProps {
  bookings: Booking[]
  services: Service[]
  providerId: string
}

interface AnalyticsData {
  totalRevenue: number
  totalBookings: number
  completedBookings: number
  cancelledBookings: number
  averageRating: number
  topService: Service | null
  monthlyRevenue: { month: string; revenue: number }[]
  bookingsByStatus: { status: string; count: number; percentage: number }[]
  revenueGrowth: number
  bookingGrowth: number
}

const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({ bookings, services, providerId }) => {
  const [timeRange, setTimeRange] = useState<"7d" | "30d" | "90d" | "1y">("30d")
  const [selectedMetric, setSelectedMetric] = useState<"revenue" | "bookings">("revenue")

  // Calculer les données analytiques
  const analyticsData = useMemo((): AnalyticsData => {
    const now = new Date()
    const timeRangeMs = {
      "7d": 7 * 24 * 60 * 60 * 1000,
      "30d": 30 * 24 * 60 * 60 * 1000,
      "90d": 90 * 24 * 60 * 60 * 1000,
      "1y": 365 * 24 * 60 * 60 * 1000,
    }

    const cutoffDate = new Date(now.getTime() - timeRangeMs[timeRange])
    const filteredBookings = bookings.filter((booking) => new Date(booking.date) >= cutoffDate)

    // Revenus totaux
    const totalRevenue = filteredBookings
      .filter((b) => b.status === "completed")
      .reduce((sum, b) => sum + b.totalPrice, 0)

    // Statistiques de base
    const totalBookings = filteredBookings.length
    const completedBookings = filteredBookings.filter((b) => b.status === "completed").length
    const cancelledBookings = filteredBookings.filter((b) => b.status === "cancelled").length

    // Note moyenne (simulée)
    const averageRating = services.reduce((sum, s) => sum + (s.averageRating || 4.5), 0) / services.length || 4.5

    // Service le plus populaire
    const serviceBookingCounts = filteredBookings.reduce(
      (acc, booking) => {
        acc[booking.serviceId] = (acc[booking.serviceId] || 0) + 1
        return acc
      },
      {} as Record<string, number>,
    )

    const topServiceId = Object.entries(serviceBookingCounts).sort(([, a], [, b]) => b - a)[0]?.[0]
    const topService = services.find((s) => s.id === topServiceId) || null

    // Revenus mensuels (derniers 6 mois)
    const monthlyRevenue = []
    for (let i = 5; i >= 0; i--) {
      const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0)
      const monthBookings = bookings.filter((b) => {
        const bookingDate = new Date(b.date)
        return bookingDate >= monthDate && bookingDate <= monthEnd && b.status === "completed"
      })
      const monthRevenue = monthBookings.reduce((sum, b) => sum + b.totalPrice, 0)

      monthlyRevenue.push({
        month: monthDate.toLocaleDateString("fr-FR", { month: "short", year: "2-digit" }),
        revenue: monthRevenue,
      })
    }

    // Répartition par statut
    const statusCounts = filteredBookings.reduce(
      (acc, booking) => {
        acc[booking.status] = (acc[booking.status] || 0) + 1
        return acc
      },
      {} as Record<string, number>,
    )

    const bookingsByStatus = Object.entries(statusCounts).map(([status, count]) => ({
      status,
      count,
      percentage: Math.round((count / totalBookings) * 100) || 0,
    }))

    // Calcul de la croissance (comparaison avec la période précédente)
    const previousPeriodStart = new Date(cutoffDate.getTime() - timeRangeMs[timeRange])
    const previousBookings = bookings.filter(
      (b) => new Date(b.date) >= previousPeriodStart && new Date(b.date) < cutoffDate,
    )

    const previousRevenue = previousBookings
      .filter((b) => b.status === "completed")
      .reduce((sum, b) => sum + b.totalPrice, 0)
    const previousBookingCount = previousBookings.length

    const revenueGrowth = previousRevenue > 0 ? ((totalRevenue - previousRevenue) / previousRevenue) * 100 : 0
    const bookingGrowth =
      previousBookingCount > 0 ? ((totalBookings - previousBookingCount) / previousBookingCount) * 100 : 0

    return {
      totalRevenue,
      totalBookings,
      completedBookings,
      cancelledBookings,
      averageRating,
      topService,
      monthlyRevenue,
      bookingsByStatus,
      revenueGrowth,
      bookingGrowth,
    }
  }, [bookings, services, timeRange])

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400"
      case "pending":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400"
      case "confirmed":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400"
      case "cancelled":
        return "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400"
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "completed":
        return "Terminées"
      case "pending":
        return "En attente"
      case "confirmed":
        return "Confirmées"
      case "cancelled":
        return "Annulées"
      default:
        return status
    }
  }

  return (
    <div className="space-y-4">
      {/* Contrôles */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Select value={timeRange} onValueChange={(value: "7d" | "30d" | "90d" | "1y") => setTimeRange(value)}>
            <SelectTrigger className="w-32 bg-white dark:bg-slate-800 border-stone-200 dark:border-slate-700 text-xs h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">7 jours</SelectItem>
              <SelectItem value="30d">30 jours</SelectItem>
              <SelectItem value="90d">90 jours</SelectItem>
              <SelectItem value="1y">1 an</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button
          variant="outline"
          size="sm"
          className="border-stone-200 dark:border-slate-700 text-xs h-8 px-3 bg-transparent"
        >
          <Filter size={12} className="mr-1" />
          Filtres
        </Button>
      </div>

      {/* Métriques principales */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="bg-white dark:bg-slate-800 border-stone-200 dark:border-slate-700">
          <CardContent className="p-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-green-600" />
                <span className="text-xs text-slate-600 dark:text-slate-400">Revenus</span>
              </div>
              {analyticsData.revenueGrowth !== 0 && (
                <div
                  className={`flex items-center gap-1 ${analyticsData.revenueGrowth > 0 ? "text-green-600" : "text-red-600"}`}
                >
                  {analyticsData.revenueGrowth > 0 ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                  <span className="text-xs font-medium">{Math.abs(analyticsData.revenueGrowth).toFixed(1)}%</span>
                </div>
              )}
            </div>
            <div className="text-lg font-bold text-slate-900 dark:text-white">
              {analyticsData.totalRevenue.toLocaleString()} FCFA
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              {timeRange === "7d"
                ? "7 derniers jours"
                : timeRange === "30d"
                  ? "30 derniers jours"
                  : timeRange === "90d"
                    ? "90 derniers jours"
                    : "Cette année"}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-slate-800 border-stone-200 dark:border-slate-700">
          <CardContent className="p-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-blue-600" />
                <span className="text-xs text-slate-600 dark:text-slate-400">Réservations</span>
              </div>
              {analyticsData.bookingGrowth !== 0 && (
                <div
                  className={`flex items-center gap-1 ${analyticsData.bookingGrowth > 0 ? "text-green-600" : "text-red-600"}`}
                >
                  {analyticsData.bookingGrowth > 0 ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                  <span className="text-xs font-medium">{Math.abs(analyticsData.bookingGrowth).toFixed(1)}%</span>
                </div>
              )}
            </div>
            <div className="text-lg font-bold text-slate-900 dark:text-white">{analyticsData.totalBookings}</div>
            <p className="text-xs text-slate-600 dark:text-slate-400">Total période</p>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-slate-800 border-stone-200 dark:border-slate-700">
          <CardContent className="p-3">
            <div className="flex items-center gap-2 mb-2">
              <Star className="h-4 w-4 text-yellow-600" />
              <span className="text-xs text-slate-600 dark:text-slate-400">Note moyenne</span>
            </div>
            <div className="text-lg font-bold text-slate-900 dark:text-white">
              {analyticsData.averageRating.toFixed(1)}
            </div>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  size={10}
                  className={`${
                    star <= analyticsData.averageRating
                      ? "fill-yellow-400 text-yellow-400"
                      : "text-gray-300 dark:text-gray-600"
                  }`}
                />
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-slate-800 border-stone-200 dark:border-slate-700">
          <CardContent className="p-3">
            <div className="flex items-center gap-2 mb-2">
              <Target className="h-4 w-4 text-purple-600" />
              <span className="text-xs text-slate-600 dark:text-slate-400">Taux de réussite</span>
            </div>
            <div className="text-lg font-bold text-slate-900 dark:text-white">
              {analyticsData.totalBookings > 0
                ? Math.round((analyticsData.completedBookings / analyticsData.totalBookings) * 100)
                : 0}
              %
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              {analyticsData.completedBookings}/{analyticsData.totalBookings} terminées
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Service le plus populaire */}
      {analyticsData.topService && (
        <Card className="bg-white dark:bg-slate-800 border-stone-200 dark:border-slate-700">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-slate-900 dark:text-white text-sm">
              <Award className="h-4 w-4 text-yellow-600" />
              Service le plus demandé
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-slate-900 dark:text-white text-sm">
                  {analyticsData.topService.title}
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400">{analyticsData.topService.category}</p>
              </div>
              <div className="text-right">
                <div className="text-sm font-bold text-slate-900 dark:text-white">
                  {analyticsData.topService.price} FCFA
                </div>
                <div className="text-xs text-slate-600 dark:text-slate-400">{analyticsData.topService.duration}min</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Répartition par statut */}
      <Card className="bg-white dark:bg-slate-800 border-stone-200 dark:border-slate-700">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-slate-900 dark:text-white text-sm">
            <BarChart3 className="h-4 w-4 text-indigo-600" />
            Répartition des réservations
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-2">
            {analyticsData.bookingsByStatus.map((item) => (
              <div key={item.status} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge className={`${getStatusColor(item.status)} text-xs px-2 py-1`}>
                    {getStatusLabel(item.status)}
                  </Badge>
                  <span className="text-xs text-slate-600 dark:text-slate-400">{item.count}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-16 bg-stone-200 dark:bg-slate-700 rounded-full h-2">
                    <div
                      className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${item.percentage}%` }}
                    />
                  </div>
                  <span className="text-xs font-medium text-slate-900 dark:text-white w-8 text-right">
                    {item.percentage}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Évolution mensuelle */}
      <Card className="bg-white dark:bg-slate-800 border-stone-200 dark:border-slate-700">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-slate-900 dark:text-white text-sm">
            <TrendingUp className="h-4 w-4 text-green-600" />
            Évolution des revenus (6 derniers mois)
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-2">
            {analyticsData.monthlyRevenue.map((month, index) => {
              const maxRevenue = Math.max(...analyticsData.monthlyRevenue.map((m) => m.revenue))
              const percentage = maxRevenue > 0 ? (month.revenue / maxRevenue) * 100 : 0

              return (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-xs text-slate-600 dark:text-slate-400 w-12">{month.month}</span>
                  <div className="flex-1 mx-2">
                    <div className="w-full bg-stone-200 dark:bg-slate-700 rounded-full h-2">
                      <div
                        className="bg-green-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                  <span className="text-xs font-medium text-slate-900 dark:text-white text-right w-20">
                    {month.revenue.toLocaleString()} FCFA
                  </span>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Conseils d'amélioration */}
      <Card className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 border-indigo-200 dark:border-indigo-800">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-indigo-900 dark:text-indigo-100 text-sm">
            <Target className="h-4 w-4" />
            Conseils d'amélioration
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-2 text-xs text-indigo-800 dark:text-indigo-200">
            {analyticsData.cancelledBookings > analyticsData.completedBookings * 0.2 && (
              <p>• Taux d'annulation élevé - Améliorez la communication avec vos clients</p>
            )}
            {analyticsData.averageRating < 4.0 && (
              <p>• Note moyenne faible - Demandez des retours pour améliorer vos services</p>
            )}
            {analyticsData.totalBookings < 5 && (
              <p>• Peu de réservations - Optimisez vos descriptions et prix de services</p>
            )}
            {analyticsData.revenueGrowth < 0 && (
              <p>• Revenus en baisse - Considérez des promotions ou de nouveaux services</p>
            )}
            {analyticsData.totalBookings >= 10 && analyticsData.averageRating >= 4.5 && (
              <p>• Excellentes performances ! Continuez sur cette lancée 🎉</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default AnalyticsDashboard

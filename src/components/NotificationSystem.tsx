"use client"

import { useState, useEffect } from "react"
import { Bell, X, Check, Star, Calendar, MessageSquare, Gift, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "../context/AuthContext"

interface Notification {
  id: string
  type: "booking" | "message" | "review" | "promo" | "system"
  title: string
  message: string
  timestamp: Date
  isRead: boolean
  actionUrl?: string
  data?: any
}

const NotificationSystem = () => {
  const { currentUser } = useAuth()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    // Simuler des notifications pour la démo
    const mockNotifications: Notification[] = [
      {
        id: "1",
        type: "booking",
        title: "Nouvelle réservation",
        message: "Vous avez une nouvelle réservation pour demain à 14h",
        timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 min ago
        isRead: false,
        actionUrl: "/bookings/123",
      },
      {
        id: "2",
        type: "message",
        title: "Nouveau message",
        message: "Marie Dubois vous a envoyé un message",
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2h ago
        isRead: false,
        actionUrl: "/messages/456",
      },
      {
        id: "3",
        type: "review",
        title: "Nouvel avis",
        message: "Vous avez reçu un avis 5 étoiles !",
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
        isRead: true,
        actionUrl: "/reviews",
      },
      {
        id: "4",
        type: "promo",
        title: "Code promo disponible",
        message: "Utilisez WELCOME10 pour 10% de réduction",
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2), // 2 days ago
        isRead: false,
        data: { code: "WELCOME10", discount: 10 },
      },
      {
        id: "5",
        type: "system",
        title: "Mise à jour de l'app",
        message: "Nouvelles fonctionnalités disponibles !",
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3), // 3 days ago
        isRead: true,
      },
    ]

    setNotifications(mockNotifications)
    setUnreadCount(mockNotifications.filter((n) => !n.isRead).length)
  }, [])

  const getNotificationIcon = (type: Notification["type"]) => {
    switch (type) {
      case "booking":
        return <Calendar size={16} className="text-blue-600" />
      case "message":
        return <MessageSquare size={16} className="text-green-600" />
      case "review":
        return <Star size={16} className="text-yellow-600" />
      case "promo":
        return <Gift size={16} className="text-purple-600" />
      case "system":
        return <AlertCircle size={16} className="text-slate-600" />
      default:
        return <Bell size={16} className="text-slate-600" />
    }
  }

  const getNotificationColor = (type: Notification["type"]) => {
    switch (type) {
      case "booking":
        return "bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800"
      case "message":
        return "bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800"
      case "review":
        return "bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800"
      case "promo":
        return "bg-purple-50 border-purple-200 dark:bg-purple-900/20 dark:border-purple-800"
      case "system":
        return "bg-slate-50 border-slate-200 dark:bg-slate-900/20 dark:border-slate-700"
      default:
        return "bg-white border-stone-200 dark:bg-slate-800 dark:border-slate-700"
    }
  }

  const formatTimestamp = (timestamp: Date) => {
    const now = new Date()
    const diffMs = now.getTime() - timestamp.getTime()
    const diffMins = Math.floor(diffMs / (1000 * 60))
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffMins < 1) return "À l'instant"
    if (diffMins < 60) return `Il y a ${diffMins}min`
    if (diffHours < 24) return `Il y a ${diffHours}h`
    if (diffDays < 7) return `Il y a ${diffDays}j`
    return timestamp.toLocaleDateString()
  }

  const markAsRead = (notificationId: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === notificationId ? { ...n, isRead: true } : n)))
    setUnreadCount((prev) => Math.max(0, prev - 1))
  }

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })))
    setUnreadCount(0)
  }

  const deleteNotification = (notificationId: string) => {
    const notification = notifications.find((n) => n.id === notificationId)
    setNotifications((prev) => prev.filter((n) => n.id !== notificationId))
    if (notification && !notification.isRead) {
      setUnreadCount((prev) => Math.max(0, prev - 1))
    }
  }

  return (
    <div className="relative">
      {/* Bouton de notification */}
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setIsOpen(!isOpen)}
        className="relative text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 bg-red-500 text-white text-xs">
            {unreadCount > 9 ? "9+" : unreadCount}
          </Badge>
        )}
      </Button>

      {/* Panel des notifications */}
      {isOpen && (
        <>
          {/* Overlay */}
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />

          {/* Panel */}
          <div className="absolute right-0 top-full mt-2 w-80 max-h-96 bg-white dark:bg-slate-800 border border-stone-200 dark:border-slate-700 rounded-lg shadow-lg z-50 overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-stone-200 dark:border-slate-700">
              <h3 className="font-semibold text-slate-900 dark:text-white">Notifications ({unreadCount})</h3>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={markAllAsRead}
                    className="text-xs text-indigo-600 hover:text-indigo-700"
                  >
                    Tout marquer lu
                  </Button>
                )}
                <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)} className="h-6 w-6">
                  <X size={14} />
                </Button>
              </div>
            </div>

            {/* Liste des notifications */}
            <div className="max-h-80 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="text-center py-8">
                  <Bell className="h-12 w-12 text-slate-400 mx-auto mb-2" />
                  <p className="text-slate-600 dark:text-slate-400">Aucune notification</p>
                </div>
              ) : (
                <div className="divide-y divide-stone-200 dark:divide-slate-700">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-4 hover:bg-stone-50 dark:hover:bg-slate-700/50 transition-colors ${
                        !notification.isRead ? "bg-blue-50/50 dark:bg-blue-900/10" : ""
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 mt-1">{getNotificationIcon(notification.type)}</div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h4
                                className={`text-sm font-medium ${
                                  !notification.isRead
                                    ? "text-slate-900 dark:text-white"
                                    : "text-slate-700 dark:text-slate-300"
                                }`}
                              >
                                {notification.title}
                              </h4>
                              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">{notification.message}</p>
                              <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">
                                {formatTimestamp(notification.timestamp)}
                              </p>
                            </div>

                            <div className="flex items-center gap-1 ml-2">
                              {!notification.isRead && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => markAsRead(notification.id)}
                                  className="h-6 w-6 text-slate-400 hover:text-green-600"
                                >
                                  <Check size={12} />
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => deleteNotification(notification.id)}
                                className="h-6 w-6 text-slate-400 hover:text-red-600"
                              >
                                <X size={12} />
                              </Button>
                            </div>
                          </div>

                          {/* Code promo spécial */}
                          {notification.type === "promo" && notification.data && (
                            <div className="mt-2 p-2 bg-purple-50 dark:bg-purple-900/20 rounded border border-purple-200 dark:border-purple-800">
                              <div className="flex items-center justify-between">
                                <code className="text-sm font-mono font-bold text-purple-700 dark:text-purple-300">
                                  {notification.data.code}
                                </code>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-6 text-xs border-purple-300 text-purple-700 hover:bg-purple-100 bg-transparent"
                                  onClick={() => {
                                    navigator.clipboard.writeText(notification.data.code)
                                  }}
                                >
                                  Copier
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            {notifications.length > 0 && (
              <div className="p-3 border-t border-stone-200 dark:border-slate-700 bg-stone-50 dark:bg-slate-700/50">
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full text-xs text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                >
                  Voir toutes les notifications
                </Button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}

export default NotificationSystem

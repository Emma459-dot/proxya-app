"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { ArrowLeft, Send, Phone, MoreVertical, Search, MessageSquare, Check, CheckCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import ThemeToggle from "../components/ThemeToggle"
import { useAuth } from "../context/AuthContext"
import { messageService, providerService, clientService } from "../services/firebaseService"
import type { Message, Provider, Client } from "../types"

interface Conversation {
  userId: string
  userName: string
  userType: "client" | "provider"
  lastMessage?: Message
  unreadCount: number
}

const MessagesPage = () => {
  const navigate = useNavigate()
  const { userId } = useParams()
  const { currentUser, userType } = useAuth()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedConversation, setSelectedConversation] = useState<string | null>(userId || null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [isSending, setIsSending] = useState(false)
  const [selectedUser, setSelectedUser] = useState<(Provider | Client) | null>(null)
  const [showConversation, setShowConversation] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!currentUser) {
      navigate(userType === "provider" ? "/provider/login" : "/client/login")
      return
    }
    loadConversations()
  }, [currentUser, userType])

  useEffect(() => {
    if (selectedConversation) {
      loadMessages(selectedConversation)
      loadSelectedUser(selectedConversation)
      setShowConversation(true)
    }
  }, [selectedConversation])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Polling pour les nouveaux messages
  useEffect(() => {
    const interval = setInterval(() => {
      if (selectedConversation) {
        loadMessages(selectedConversation)
      }
      loadConversations()
    }, 10000) // Toutes les 10 secondes

    return () => clearInterval(interval)
  }, [selectedConversation])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  const loadConversations = async () => {
    try {
      if (!currentUser?.id) return

      const allMessages = await messageService.getUserConversations(currentUser.id)

      // Grouper les messages par conversation
      const conversationMap = new Map<string, Conversation>()

      for (const message of allMessages) {
        const otherUserId = message.senderId === currentUser.id ? message.receiverId : message.senderId

        if (!conversationMap.has(otherUserId)) {
          // Déterminer le type d'utilisateur
          const isOtherUserProvider = userType === "client"
          let userName = "Utilisateur"

          try {
            if (isOtherUserProvider) {
              const provider = await providerService.getById(otherUserId)
              userName = provider ? `${provider.prenom} ${provider.nom}` : "Prestataire"
            } else {
              const client = await clientService.getById(otherUserId)
              userName = client ? `${client.prenom} ${client.nom}` : "Client"
            }
          } catch (error) {
            console.error("Erreur lors du chargement de l'utilisateur:", error)
          }

          conversationMap.set(otherUserId, {
            userId: otherUserId,
            userName,
            userType: isOtherUserProvider ? "provider" : "client",
            lastMessage: message,
            unreadCount: 0,
          })
        } else {
          const existing = conversationMap.get(otherUserId)!
          if (new Date(message.timestamp) > new Date(existing.lastMessage!.timestamp)) {
            existing.lastMessage = message
          }
        }

        // Compter les messages non lus
        if (message.receiverId === currentUser.id && !message.isRead) {
          const conversation = conversationMap.get(otherUserId)!
          conversation.unreadCount++
        }
      }

      const conversationsList = Array.from(conversationMap.values()).sort((a, b) => {
        if (!a.lastMessage || !b.lastMessage) return 0
        return new Date(b.lastMessage.timestamp).getTime() - new Date(a.lastMessage.timestamp).getTime()
      })

      setConversations(conversationsList)
    } catch (error) {
      console.error("Erreur lors du chargement des conversations:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const loadMessages = async (otherUserId: string) => {
    try {
      if (!currentUser?.id) return

      const conversationMessages = await messageService.getConversation(currentUser.id, otherUserId)

      // Trier par timestamp
      conversationMessages.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())

      setMessages(conversationMessages)

      // Marquer les messages reçus comme lus
      for (const message of conversationMessages) {
        if (message.receiverId === currentUser.id && !message.isRead) {
          await messageService.markAsRead(message.id!)
        }
      }
    } catch (error) {
      console.error("Erreur lors du chargement des messages:", error)
    }
  }

  const loadSelectedUser = async (userId: string) => {
    try {
      const isProvider = userType === "client"
      if (isProvider) {
        const provider = await providerService.getById(userId)
        setSelectedUser(provider)
      } else {
        const client = await clientService.getById(userId)
        setSelectedUser(client)
      }
    } catch (error) {
      console.error("Erreur lors du chargement de l'utilisateur sélectionné:", error)
    }
  }

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation || !currentUser?.id || isSending) return

    setIsSending(true)
    try {
      await messageService.send({
        senderId: currentUser.id,
        receiverId: selectedConversation,
        content: newMessage.trim(),
      })

      setNewMessage("")
      await loadMessages(selectedConversation)
      await loadConversations()
    } catch (error) {
      console.error("Erreur lors de l'envoi du message:", error)
    } finally {
      setIsSending(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const formatTime = (date: Date) => {
    const now = new Date()
    const messageDate = new Date(date)

    if (now.toDateString() === messageDate.toDateString()) {
      return messageDate.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })
    } else if (now.getTime() - messageDate.getTime() < 7 * 24 * 60 * 60 * 1000) {
      return messageDate.toLocaleDateString("fr-FR", { weekday: "short" })
    } else {
      return messageDate.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" })
    }
  }

  const handleConversationSelect = (conversationId: string) => {
    setSelectedConversation(conversationId)
    setShowConversation(true)
  }

  const handleBackToConversations = () => {
    setShowConversation(false)
    setSelectedConversation(null)
    setSelectedUser(null)
    setMessages([])
  }

  const filteredConversations = conversations.filter((conversation) =>
    conversation.userName.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  if (isLoading) {
    return (
      <div className="min-h-screen bg-stone-50 dark:bg-slate-900 flex items-center justify-center px-4">
        <div className="text-center max-w-sm mx-auto">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 dark:border-white mx-auto mb-4"></div>
          <p className="text-slate-600 dark:text-slate-400">Chargement des messages...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-slate-900">
      <ThemeToggle />

      {/* Vue Liste des conversations */}
      {!showConversation && (
        <>
          {/* Header Liste */}
          <div className="sticky top-0 z-50 bg-white dark:bg-slate-800 border-b border-stone-200 dark:border-slate-700 shadow-sm">
            <div className="max-w-sm mx-auto px-4 py-3">
              <div className="flex items-center justify-between">
                <button
                  onClick={() => navigate(userType === "provider" ? "/provider/dashboard" : "/client/dashboard")}
                  className="flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
                >
                  <ArrowLeft size={20} />
                  <span className="font-medium">Retour</span>
                </button>

                <div className="text-center">
                  <h1 className="text-lg font-bold text-slate-900 dark:text-white">Messages</h1>
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    {conversations.length} conversation{conversations.length !== 1 ? "s" : ""}
                  </p>
                </div>

                <div className="w-16"></div>
              </div>

              {/* Barre de recherche */}
              <div className="mt-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
                  <Input
                    placeholder="Rechercher une conversation..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 bg-stone-50 dark:bg-slate-700 border-stone-200 dark:border-slate-600 text-sm h-9"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Liste des conversations */}
          <div className="max-w-sm mx-auto px-4 py-4">
            {filteredConversations.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <MessageSquare className="h-16 w-16 text-slate-400 mb-4" />
                <h3 className="font-semibold text-slate-900 dark:text-white mb-2">
                  {searchQuery ? "Aucun résultat" : "Aucune conversation"}
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 max-w-xs">
                  {searchQuery
                    ? "Aucune conversation ne correspond à votre recherche."
                    : `Vos conversations apparaîtront ici une fois que vous commencerez à échanger avec des ${userType === "provider" ? "clients" : "prestataires"}.`}
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredConversations.map((conversation) => (
                  <button
                    key={conversation.userId}
                    onClick={() => handleConversationSelect(conversation.userId)}
                    className="w-full p-4 text-left hover:bg-white dark:hover:bg-slate-800 transition-colors rounded-lg border border-stone-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="h-12 w-12 flex-shrink-0">
                        <AvatarFallback
                          className={`${
                            conversation.userType === "provider"
                              ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900"
                              : "bg-indigo-600 text-white dark:bg-white dark:text-slate-900"
                          }`}
                        >
                          {conversation.userName
                            .split(" ")
                            .map((n) => n[0])
                            .join("")
                            .toUpperCase()}
                        </AvatarFallback>
                      </Avatar>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h3 className="font-medium text-slate-900 dark:text-white truncate text-sm">
                            {conversation.userName}
                          </h3>
                          {conversation.lastMessage && (
                            <span className="text-xs text-slate-500 dark:text-slate-400 flex-shrink-0">
                              {formatTime(conversation.lastMessage.timestamp)}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center justify-between">
                          <p className="text-sm text-slate-600 dark:text-slate-400 truncate">
                            {conversation.lastMessage?.content || "Aucun message"}
                          </p>
                          {conversation.unreadCount > 0 && (
                            <Badge className="bg-indigo-600 text-white h-5 w-5 flex items-center justify-center p-0 text-xs flex-shrink-0 ml-2">
                              {conversation.unreadCount > 9 ? "9+" : conversation.unreadCount}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {/* Vue Conversation */}
      {showConversation && selectedUser && (
        <div className="flex flex-col h-screen">
          {/* Header Conversation */}
          <div className="sticky top-0 z-50 bg-white dark:bg-slate-800 border-b border-stone-200 dark:border-slate-700 shadow-sm">
            <div className="max-w-sm mx-auto px-4 py-3">
              <div className="flex items-center justify-between">
                <button
                  onClick={handleBackToConversations}
                  className="flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
                >
                  <ArrowLeft size={20} />
                  <span className="font-medium">Messages</span>
                </button>

                <div className="text-center flex-1 mx-4">
                  <h1 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                    {selectedUser.prenom} {selectedUser.nom}
                  </h1>
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    {userType === "client" ? "Prestataire" : "Client"}
                  </p>
                </div>

                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-600 dark:text-slate-400">
                    <Phone size={16} />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-600 dark:text-slate-400">
                    <MoreVertical size={16} />
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto">
            <div className="max-w-sm mx-auto px-4 py-4">
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center py-16">
                  <MessageSquare className="h-16 w-16 text-slate-400 mb-4" />
                  <h3 className="font-semibold text-slate-900 dark:text-white mb-2">Commencez la conversation</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Envoyez votre premier message à {selectedUser.prenom} {selectedUser.nom}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {messages.map((message) => {
                    const isOwn = message.senderId === currentUser?.id
                    return (
                      <div key={message.id} className={`flex ${isOwn ? "justify-end" : "justify-start"}`}>
                        <div
                          className={`max-w-[280px] px-3 py-2 rounded-lg ${
                            isOwn
                              ? "bg-indigo-600 text-white"
                              : "bg-white dark:bg-slate-700 text-slate-900 dark:text-white border border-stone-200 dark:border-slate-600"
                          }`}
                        >
                          <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
                          <div className={`flex items-center gap-1 mt-1 ${isOwn ? "justify-end" : "justify-start"}`}>
                            <span
                              className={`text-xs ${isOwn ? "text-indigo-200" : "text-slate-500 dark:text-slate-400"}`}
                            >
                              {formatTime(message.timestamp)}
                            </span>
                            {isOwn && (
                              <div className="text-indigo-200">
                                {message.isRead ? <CheckCheck size={12} /> : <Check size={12} />}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>
          </div>

          {/* Zone de saisie */}
          <div className="border-t border-stone-200 dark:border-slate-700 bg-white dark:bg-slate-800">
            <div className="max-w-sm mx-auto px-4 py-3">
              <div className="flex items-end gap-2">
                <div className="flex-1">
                  <Input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Tapez votre message..."
                    className="bg-stone-50 dark:bg-slate-700 border-stone-200 dark:border-slate-600 text-sm"
                    disabled={isSending}
                  />
                </div>
                <Button
                  onClick={sendMessage}
                  disabled={!newMessage.trim() || isSending}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white h-9 w-9 p-0"
                >
                  {isSending ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  ) : (
                    <Send size={16} />
                  )}
                </Button>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Appuyez sur Entrée pour envoyer</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default MessagesPage

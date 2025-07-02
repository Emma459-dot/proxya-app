"use client"

import type React from "react"
import { useState, useEffect, useRef, useCallback } from "react"
import { useNavigate } from "react-router-dom"
import { ArrowLeft, Send, Volume2, VolumeX, Bot, User, Lightbulb, Loader2, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import ThemeToggle from "../components/ThemeToggle"
import { useAuth } from "../context/AuthContext"
import { GeminiService, type ChatMessage } from "../services/geminiService"
import { SpeechService } from "../services/speechService"

const AIChat = () => {
  const navigate = useNavigate()
  const { currentUser, userType } = useAuth()
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [inputMessage, setInputMessage] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [currentSpeakingId, setCurrentSpeakingId] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Clé pour localStorage basée sur l'utilisateur
  const storageKey = `proxya_chat_${currentUser?.id || "anonymous"}_${userType || "client"}`

  // Charger l'historique depuis localStorage
  const loadChatHistory = useCallback(() => {
    try {
      const savedHistory = localStorage.getItem(storageKey)
      if (savedHistory) {
        const parsedHistory = JSON.parse(savedHistory)
        // Convertir les timestamps string en Date objects
        const historyWithDates = parsedHistory.map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp),
        }))
        return historyWithDates
      }
    } catch (error) {
      console.error("Erreur lors du chargement de l'historique:", error)
    }
    return []
  }, [storageKey])

  // Sauvegarder l'historique dans localStorage
  const saveChatHistory = useCallback(
    (chatMessages: ChatMessage[]) => {
      try {
        localStorage.setItem(storageKey, JSON.stringify(chatMessages))
      } catch (error) {
        console.error("Erreur lors de la sauvegarde de l'historique:", error)
      }
    },
    [storageKey],
  )

  // Initialiser le chat
  useEffect(() => {
    SpeechService.init()

    // Charger l'historique existant
    const existingHistory = loadChatHistory()

    if (existingHistory.length > 0) {
      setMessages(existingHistory)
    } else {
      // Message de bienvenue seulement si pas d'historique
      const welcomeMessage: ChatMessage = {
        id: `welcome_${Date.now()}`,
        role: "assistant",
        content:
          userType === "client"
            ? `Salut ${currentUser?.prenom || "cher client"} ! 👋 Je suis PROXYA Assistant, ton aide pour trouver les meilleurs services au Cameroun. Comment puis-je t'aider aujourd'hui ?`
            : `Bonjour ${currentUser?.prenom || "cher prestataire"} ! 👋 Je suis PROXYA Assistant, ton conseiller business. Je suis là pour t'aider à développer ton activité. Que puis-je faire pour toi ?`,
        timestamp: new Date(),
      }

      setMessages([welcomeMessage])
      saveChatHistory([welcomeMessage])
    }
  }, [currentUser, userType, loadChatHistory, saveChatHistory])

  // Sauvegarder les messages à chaque changement
  useEffect(() => {
    if (messages.length > 0) {
      saveChatHistory(messages)
    }
  }, [messages, saveChatHistory])

  // Faire défiler vers le bas quand de nouveaux messages arrivent
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  // Envoyer un message
  const sendMessage = async (content: string) => {
    if (!content.trim() || isLoading) return

    const userMessage: ChatMessage = {
      id: `user_${Date.now()}`,
      role: "user",
      content: content.trim(),
      timestamp: new Date(),
    }

    // Ajouter le message utilisateur immédiatement
    setMessages((prevMessages) => [...prevMessages, userMessage])
    setInputMessage("")
    setIsLoading(true)

    try {
      const response = await GeminiService.generateResponse(
        content.trim(),
        userType as "client" | "provider",
        `${currentUser?.prenom} ${currentUser?.nom}`,
        messages, // Passer l'historique actuel
      )

      const assistantMessage: ChatMessage = {
        id: `assistant_${Date.now()}`,
        role: "assistant",
        content: response,
        timestamp: new Date(),
      }

      // Ajouter la réponse de l'assistant
      setMessages((prevMessages) => [...prevMessages, assistantMessage])
    } catch (error) {
      console.error("Erreur lors de l'envoi du message:", error)

      const errorMessage: ChatMessage = {
        id: `error_${Date.now()}`,
        role: "assistant",
        content: "Désolé, je rencontre un problème technique. Peux-tu réessayer dans quelques instants ? 🤖",
        timestamp: new Date(),
      }

      setMessages((prevMessages) => [...prevMessages, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  // Lire un message à voix haute
  const speakMessage = (content: string, messageId: string) => {
    if (isSpeaking && currentSpeakingId === messageId) {
      SpeechService.stop()
      setIsSpeaking(false)
      setCurrentSpeakingId(null)
    } else {
      // Arrêter toute lecture en cours
      if (isSpeaking) {
        SpeechService.stop()
      }

      setCurrentSpeakingId(messageId)
      SpeechService.speak(content, {
        onStart: () => setIsSpeaking(true),
        onEnd: () => {
          setIsSpeaking(false)
          setCurrentSpeakingId(null)
        },
        onError: () => {
          setIsSpeaking(false)
          setCurrentSpeakingId(null)
        },
      })
    }
  }

  // Effacer l'historique
  const clearHistory = () => {
    const confirmClear = window.confirm("Êtes-vous sûr de vouloir effacer tout l'historique de conversation ?")
    if (confirmClear) {
      setMessages([])
      localStorage.removeItem(storageKey)

      // Ajouter un nouveau message de bienvenue
      const welcomeMessage: ChatMessage = {
        id: `welcome_${Date.now()}`,
        role: "assistant",
        content:
          userType === "client"
            ? `Salut ${currentUser?.prenom || "cher client"} ! 👋 Je suis PROXYA Assistant, ton aide pour trouver les meilleurs services au Cameroun. Comment puis-je t'aider aujourd'hui ?`
            : `Bonjour ${currentUser?.prenom || "cher prestataire"} ! 👋 Je suis PROXYA Assistant, ton conseiller business. Je suis là pour t'aider à développer ton activité. Que puis-je faire pour toi ?`,
        timestamp: new Date(),
      }

      setMessages([welcomeMessage])
    }
  }

  // Suggestions de questions
  const suggestedQuestions = GeminiService.getSuggestedQuestions(userType as "client" | "provider")

  // Gérer l'envoi du formulaire
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    sendMessage(inputMessage)
  }

  // Formatage de l'heure
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("fr-FR", {
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  // Formatage de la date
  const formatDate = (date: Date) => {
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    if (date.toDateString() === today.toDateString()) {
      return "Aujourd'hui"
    } else if (date.toDateString() === yesterday.toDateString()) {
      return "Hier"
    } else {
      return date.toLocaleDateString("fr-FR", {
        day: "numeric",
        month: "short",
      })
    }
  }

  // Grouper les messages par date
  const groupMessagesByDate = (messages: ChatMessage[]) => {
    const groups: { [key: string]: ChatMessage[] } = {}

    messages.forEach((message) => {
      const dateKey = message.timestamp.toDateString()
      if (!groups[dateKey]) {
        groups[dateKey] = []
      }
      groups[dateKey].push(message)
    })

    return groups
  }

  const messageGroups = groupMessagesByDate(messages)

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
          <h1 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Bot size={20} className="text-indigo-600 dark:text-indigo-400" />
            PROXYA Assistant
          </h1>
          <p className="text-xs text-slate-600 dark:text-slate-400">
            Assistant IA • {userType === "client" ? "Mode Client" : "Mode Prestataire"}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={clearHistory}
            className="text-slate-600 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400"
            title="Effacer l'historique"
          >
            <Trash2 size={16} />
          </Button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto h-[calc(100vh-80px)] flex flex-col">
        {/* Zone de messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {Object.entries(messageGroups).map(([dateKey, dayMessages]) => (
            <div key={dateKey}>
              {/* Séparateur de date */}
              <div className="flex items-center justify-center my-4">
                <div className="bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400 text-xs px-3 py-1 rounded-full">
                  {formatDate(new Date(dateKey))}
                </div>
              </div>

              {/* Messages du jour */}
              <div className="space-y-4">
                {dayMessages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex gap-3 ${message.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    {message.role === "assistant" && (
                      <Avatar className="h-8 w-8 flex-shrink-0">
                        <AvatarFallback className="bg-indigo-600 text-white">
                          <Bot size={16} />
                        </AvatarFallback>
                      </Avatar>
                    )}

                    <div className={`max-w-[80%] ${message.role === "user" ? "order-1" : ""}`}>
                      <Card
                        className={`${
                          message.role === "user"
                            ? "bg-indigo-600 text-white border-indigo-600"
                            : "bg-white dark:bg-slate-800 border-stone-200 dark:border-slate-700"
                        }`}
                      >
                        <CardContent className="p-3">
                          <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
                          <div
                            className={`flex items-center justify-between mt-2 text-xs ${
                              message.role === "user" ? "text-indigo-100" : "text-slate-500 dark:text-slate-400"
                            }`}
                          >
                            <span>{formatTime(message.timestamp)}</span>
                            {message.role === "assistant" && SpeechService.isSupported() && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => speakMessage(message.content, message.id)}
                                className={`h-6 w-6 p-0 ${
                                  isSpeaking && currentSpeakingId === message.id
                                    ? "text-indigo-600 dark:text-indigo-400"
                                    : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                                }`}
                                title={
                                  isSpeaking && currentSpeakingId === message.id
                                    ? "Arrêter la lecture"
                                    : "Lire à voix haute"
                                }
                              >
                                {isSpeaking && currentSpeakingId === message.id ? (
                                  <VolumeX size={12} />
                                ) : (
                                  <Volume2 size={12} />
                                )}
                              </Button>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    {message.role === "user" && (
                      <Avatar className="h-8 w-8 flex-shrink-0">
                        <AvatarFallback className="bg-slate-600 text-white">
                          <User size={16} />
                        </AvatarFallback>
                      </Avatar>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex gap-3 justify-start">
              <Avatar className="h-8 w-8 flex-shrink-0">
                <AvatarFallback className="bg-indigo-600 text-white">
                  <Bot size={16} />
                </AvatarFallback>
              </Avatar>
              <Card className="bg-white dark:bg-slate-800 border-stone-200 dark:border-slate-700">
                <CardContent className="p-3">
                  <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                    <Loader2 size={16} className="animate-spin" />
                    <span className="text-sm">PROXYA Assistant réfléchit...</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Suggestions de questions */}
        {messages.length <= 1 && (
          <div className="p-4 border-t border-stone-200 dark:border-slate-700">
            <div className="flex items-center gap-2 mb-3">
              <Lightbulb size={16} className="text-amber-500" />
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Questions suggérées :</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {suggestedQuestions.slice(0, 3).map((question, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  onClick={() => sendMessage(question)}
                  className="text-xs border-stone-200 dark:border-slate-700 hover:bg-indigo-50 dark:hover:bg-indigo-900/20"
                  disabled={isLoading}
                >
                  {question}
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Zone de saisie */}
        <div className="p-4 border-t bg-white dark:bg-slate-800 border-stone-200 dark:border-slate-700">
          <form onSubmit={handleSubmit} className="flex gap-2">
            <Input
              ref={inputRef}
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder={`Posez votre question à PROXYA Assistant...`}
              className="flex-1 bg-stone-50 dark:bg-slate-700 border-stone-200 dark:border-slate-600"
              disabled={isLoading}
            />
            <Button
              type="submit"
              disabled={!inputMessage.trim() || isLoading}
              className="bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              {isLoading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
            </Button>
          </form>

          <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 text-center">
            PROXYA Assistant peut faire des erreurs. Vérifiez les informations importantes.
          </p>
        </div>
      </div>
    </div>
  )
}

export default AIChat

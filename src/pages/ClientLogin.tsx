"use client"

import type React from "react"
import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { ArrowLeft, User, Mail, Phone, MapPin, Users, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import ThemeToggle from "../components/ThemeToggle"
import { clientService } from "../services/firebaseService"
import { useAuth } from "../context/AuthContext"
import type { Client } from "../types"

const ClientLogin = () => {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [isLogin, setIsLogin] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [formData, setFormData] = useState({
    nom: "",
    prenom: "",
    email: "",
    telephone: "",
    adresse: "",
  })

  const resetForm = () => {
    setFormData({
      nom: "",
      prenom: "",
      email: "",
      telephone: "",
      adresse: "",
    })
    setError("")
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      if (isLogin) {
        // Logique de connexion
        if (!formData.nom.trim() || !formData.email.trim()) {
          setError("Veuillez remplir tous les champs")
          return
        }

        console.log("Tentative de connexion client avec:", { nom: formData.nom, email: formData.email })

        const client = await clientService.login(formData.email.trim(), formData.nom.trim())

        if (client) {
          console.log("Connexion client réussie, redirection vers dashboard")
          login(client, "client")
          navigate("/client/dashboard")
        } else {
          setError("Aucun compte trouvé avec ces informations. Vérifiez votre nom et email.")
        }
      } else {
        // Logique d'inscription
        if (
          !formData.nom.trim() ||
          !formData.prenom.trim() ||
          !formData.email.trim() ||
          !formData.telephone.trim() ||
          !formData.adresse.trim()
        ) {
          setError("Veuillez remplir tous les champs")
          return
        }

        // Validation de l'email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(formData.email)) {
          setError("Veuillez entrer une adresse email valide")
          return
        }

        console.log("Tentative d'inscription client avec:", formData)

        const clientData: Omit<Client, "id" | "createdAt"> = {
          nom: formData.nom.trim(),
          prenom: formData.prenom.trim(),
          email: formData.email.trim().toLowerCase(),
          telephone: formData.telephone.trim(),
          adresse: formData.adresse.trim(),
          isActive: true,
        }

        const newClient = await clientService.create(clientData)

        if (newClient) {
          console.log("Inscription client réussie, redirection vers dashboard")
          login(newClient, "client")
          navigate("/client/dashboard")
        }
      }
    } catch (err) {
      console.error("Erreur lors de la soumission:", err)
      setError(err instanceof Error ? err.message : "Une erreur est survenue. Veuillez réessayer.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleToggleMode = () => {
    setIsLogin(!isLogin)
    resetForm()
  }

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-slate-900">
      <ThemeToggle />

      {/* Header */}
      <div className="flex items-center justify-between p-6">
        <button
          onClick={() => navigate("/user-type")}
          className="flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
        >
          <ArrowLeft size={20} />
          <span className="font-medium">Retour</span>
        </button>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">PROXYA</h1>
        <div className="w-16"></div>
      </div>

      <div className="px-6 max-w-md mx-auto">
        {/* Titre */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-indigo-600 dark:bg-indigo-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Users size={24} className="text-white" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
            {isLogin ? "Connexion Client" : "Inscription Client"}
          </h2>
          <p className="text-slate-600 dark:text-slate-400 text-sm">
            {isLogin ? "Accédez à votre espace personnel" : "Rejoignez notre communauté"}
          </p>
        </div>

        {/* Erreur */}
        {error && (
          <Alert className="mb-4 border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20">
            <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
            <AlertDescription className="text-red-700 dark:text-red-300">{error}</AlertDescription>
          </Alert>
        )}

        {/* Formulaire */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {isLogin ? (
            // Formulaire de connexion
            <>
              <div className="space-y-2">
                <Label htmlFor="nom" className="text-slate-900 dark:text-white">
                  Nom
                </Label>
                <div className="relative">
                  <User size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <Input
                    id="nom"
                    type="text"
                    placeholder="Votre nom"
                    className="pl-10 bg-white dark:bg-slate-800 border-stone-200 dark:border-slate-700"
                    value={formData.nom}
                    onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-slate-900 dark:text-white">
                  Email
                </Label>
                <div className="relative">
                  <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="votre@email.com"
                    className="pl-10 bg-white dark:bg-slate-800 border-stone-200 dark:border-slate-700"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                  />
                </div>
              </div>

              <Button
                type="submit"
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white"
                disabled={isLoading}
              >
                {isLoading ? "Connexion..." : "Se connecter"}
              </Button>
            </>
          ) : (
            // Formulaire d'inscription
            <>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="nom" className="text-slate-900 dark:text-white">
                    Nom
                  </Label>
                  <Input
                    id="nom"
                    type="text"
                    placeholder="Nom"
                    className="bg-white dark:bg-slate-800 border-stone-200 dark:border-slate-700"
                    value={formData.nom}
                    onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="prenom" className="text-slate-900 dark:text-white">
                    Prénom
                  </Label>
                  <Input
                    id="prenom"
                    type="text"
                    placeholder="Prénom"
                    className="bg-white dark:bg-slate-800 border-stone-200 dark:border-slate-700"
                    value={formData.prenom}
                    onChange={(e) => setFormData({ ...formData, prenom: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-slate-900 dark:text-white">
                  Email
                </Label>
                <div className="relative">
                  <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="votre@email.com"
                    className="pl-10 bg-white dark:bg-slate-800 border-stone-200 dark:border-slate-700"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="telephone" className="text-slate-900 dark:text-white">
                  Téléphone
                </Label>
                <div className="relative">
                  <Phone size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <Input
                    id="telephone"
                    type="tel"
                    placeholder="06 12 34 56 78"
                    className="pl-10 bg-white dark:bg-slate-800 border-stone-200 dark:border-slate-700"
                    value={formData.telephone}
                    onChange={(e) => setFormData({ ...formData, telephone: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="adresse" className="text-slate-900 dark:text-white">
                  Adresse
                </Label>
                <div className="relative">
                  <MapPin size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <Input
                    id="adresse"
                    type="text"
                    placeholder="Votre adresse"
                    className="pl-10 bg-white dark:bg-slate-800 border-stone-200 dark:border-slate-700"
                    value={formData.adresse}
                    onChange={(e) => setFormData({ ...formData, adresse: e.target.value })}
                    required
                  />
                </div>
              </div>

              <Button
                type="submit"
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white"
                disabled={isLoading}
              >
                {isLoading ? "Inscription..." : "S'inscrire"}
              </Button>
            </>
          )}

          {/* Toggle entre connexion et inscription */}
          <div className="text-center pt-4">
            <button
              type="button"
              onClick={handleToggleMode}
              className="text-sm text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
            >
              {isLogin ? (
                <>
                  Vous n'avez pas de compte ?{" "}
                  <span className="text-indigo-600 dark:text-indigo-400 font-medium">Inscrivez-vous</span>
                </>
              ) : (
                <>
                  Vous avez déjà un compte ?{" "}
                  <span className="text-indigo-600 dark:text-indigo-400 font-medium">Connectez-vous</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default ClientLogin

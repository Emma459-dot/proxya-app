"use client"

import type React from "react"
import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { ArrowLeft, User, Mail, Phone, MapPin, Calendar, Briefcase, Star, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import ThemeToggle from "../components/ThemeToggle"
import { providerService } from "../services/firebaseService"
import { useAuth } from "../context/AuthContext"
import type { ProviderRegistration } from "../types"

const ProviderLogin = () => {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [isLogin, setIsLogin] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [formData, setFormData] = useState({
    nom: "",
    prenom: "",
    email: "",
    telephone: "",
    age: "",
    adresse: "",
    categories: [] as string[],
    specifications: "",
    expertise: "" as "debutant" | "intermediaire" | "professionnel" | "",
    reseauxSociaux: "",
  })

  const categories = ["Beauté/Esthétique", "Alimentation", "Éducation", "Événementiel", "Maintenance"]

  const expertiseLevels = [
    { value: "debutant", label: "Débutant" },
    { value: "intermediaire", label: "Intermédiaire" },
    { value: "professionnel", label: "Professionnel" },
  ]

  const handleCategoryToggle = (category: string) => {
    const newCategories = selectedCategories.includes(category)
      ? selectedCategories.filter((c) => c !== category)
      : [...selectedCategories, category]
    setSelectedCategories(newCategories)
    setFormData({ ...formData, categories: newCategories })
  }

  const resetForm = () => {
    setFormData({
      nom: "",
      prenom: "",
      email: "",
      telephone: "",
      age: "",
      adresse: "",
      categories: [],
      specifications: "",
      expertise: "",
      reseauxSociaux: "",
    })
    setSelectedCategories([])
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

        console.log("Tentative de connexion avec:", { nom: formData.nom, email: formData.email })

        const provider = await providerService.login(formData.email.trim(), formData.nom.trim())

        if (provider) {
          console.log("Connexion réussie, redirection vers dashboard")
          login(provider, "provider")
          navigate("/provider/dashboard")
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
          !formData.age.trim() ||
          !formData.adresse.trim() ||
          selectedCategories.length === 0 ||
          !formData.expertise
        ) {
          setError("Veuillez remplir tous les champs obligatoires")
          return
        }

        // Validation de l'âge
        const ageNumber = Number.parseInt(formData.age)
        if (isNaN(ageNumber) || ageNumber < 16 || ageNumber > 100) {
          setError("Veuillez entrer un âge valide (16-100 ans)")
          return
        }

        // Validation de l'email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(formData.email)) {
          setError("Veuillez entrer une adresse email valide")
          return
        }

        console.log("Tentative d'inscription avec:", formData)

        // Utiliser le type ProviderRegistration pour l'inscription
        const providerData: ProviderRegistration = {
          nom: formData.nom.trim(),
          prenom: formData.prenom.trim(),
          email: formData.email.trim().toLowerCase(),
          telephone: formData.telephone.trim(),
          age: ageNumber,
          adresse: formData.adresse.trim(),
          categories: selectedCategories,
          specifications: formData.specifications.trim(),
          expertise: formData.expertise as "debutant" | "intermediaire" | "professionnel",
          reseauxSociaux: formData.reseauxSociaux.trim(),
          isActive: true,
        }

        const newProvider = await providerService.create(providerData)

        if (newProvider) {
          console.log("Inscription réussie, redirection vers dashboard")
          login(newProvider, "provider")
          navigate("/provider/dashboard")
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
          <div className="w-16 h-16 bg-slate-900 dark:bg-white rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Briefcase size={24} className="text-white dark:text-slate-900" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
            {isLogin ? "Connexion Prestataire" : "Inscription Prestataire"}
          </h2>
          <p className="text-slate-600 dark:text-slate-400 text-sm">
            {isLogin ? "Accédez à votre espace professionnel" : "Rejoignez notre communauté de professionnels"}
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
                className="w-full bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-stone-100 dark:text-slate-900"
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
                    Nom *
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
                    Prénom *
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
                  Email *
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

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="telephone" className="text-slate-900 dark:text-white">
                    Téléphone *
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
                  <Label htmlFor="age" className="text-slate-900 dark:text-white">
                    Âge *
                  </Label>
                  <div className="relative">
                    <Calendar size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <Input
                      id="age"
                      type="number"
                      placeholder="25"
                      min="16"
                      max="100"
                      className="pl-10 bg-white dark:bg-slate-800 border-stone-200 dark:border-slate-700"
                      value={formData.age}
                      onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="adresse" className="text-slate-900 dark:text-white">
                  Adresse *
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

              <div className="space-y-2">
                <Label className="text-slate-900 dark:text-white">Catégories de services *</Label>
                <div className="grid grid-cols-2 gap-2">
                  {categories.map((category) => (
                    <button
                      key={category}
                      type="button"
                      onClick={() => handleCategoryToggle(category)}
                      className={`p-2 text-xs rounded-lg border transition-all ${
                        selectedCategories.includes(category)
                          ? "bg-slate-900 text-white border-slate-900 dark:bg-white dark:text-slate-900 dark:border-white"
                          : "bg-white text-slate-900 border-stone-200 hover:border-slate-400 dark:bg-slate-800 dark:text-white dark:border-slate-700 dark:hover:border-slate-500"
                      }`}
                    >
                      {category}
                    </button>
                  ))}
                </div>
              </div>

              {selectedCategories.length > 0 && (
                <div className="space-y-2">
                  <Label htmlFor="specifications" className="text-slate-900 dark:text-white">
                    Spécifications
                  </Label>
                  <Textarea
                    id="specifications"
                    placeholder="Décrivez vos services spécifiques..."
                    className="bg-white dark:bg-slate-800 border-stone-200 dark:border-slate-700"
                    value={formData.specifications}
                    onChange={(e) => setFormData({ ...formData, specifications: e.target.value })}
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="expertise" className="text-slate-900 dark:text-white">
                  Niveau d'expertise *
                </Label>
                <Select
                  value={formData.expertise}
                  onValueChange={(value) =>
                    setFormData({ ...formData, expertise: value as "debutant" | "intermediaire" | "professionnel" })
                  }
                >
                  <SelectTrigger className="bg-white dark:bg-slate-800 border-stone-200 dark:border-slate-700">
                    <SelectValue placeholder="Sélectionnez votre niveau" />
                  </SelectTrigger>
                  <SelectContent>
                    {expertiseLevels.map((level) => (
                      <SelectItem key={level.value} value={level.value}>
                        <div className="flex items-center gap-2">
                          <Star size={14} className="text-amber-500" />
                          {level.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="reseauxSociaux" className="text-slate-900 dark:text-white">
                  Réseaux sociaux & Site web
                </Label>
                <Textarea
                  id="reseauxSociaux"
                  placeholder="Liens vers vos réseaux sociaux et site web..."
                  className="bg-white dark:bg-slate-800 border-stone-200 dark:border-slate-700"
                  value={formData.reseauxSociaux}
                  onChange={(e) => setFormData({ ...formData, reseauxSociaux: e.target.value })}
                />
              </div>

              <Button
                type="submit"
                className="w-full bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-stone-100 dark:text-slate-900"
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

export default ProviderLogin

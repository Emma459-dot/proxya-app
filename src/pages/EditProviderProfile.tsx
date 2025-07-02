"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import {
  ArrowLeft,
  Save,
  User,
  Briefcase,
  Star,
  Plus,
  Trash2,
  Upload,
  Globe,
  Facebook,
  Instagram,
  Linkedin,
  AlertCircle,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import ThemeToggle from "../components/ThemeToggle"
import { useAuth } from "../context/AuthContext"
import { providerService } from "../services/firebaseService"
import type { Provider, Skill, Certification, PortfolioItem } from "../types"
import { imageService } from "../services/imageService"

const EditProviderProfile = () => {
  const navigate = useNavigate()
  const { currentUser, userType } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [activeTab, setActiveTab] = useState("basic")

  const provider = currentUser as Provider

  const [profileImageFile, setProfileImageFile] = useState<string>("")

  const handleProfileImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      setIsLoading(true)

      // Valider le fichier
      const validation = imageService.validateImageFile(file)
      if (!validation.isValid) {
        setError(validation.error || "Fichier invalide")
        return
      }

      // Upload vers Supabase
      const result = await imageService.uploadImage(file, "profiles", currentUser?.id)

      if (result.error) {
        setError(result.error)
        return
      }

      // Supprimer l'ancienne image si elle existe
      if (formData.profileImage && formData.profileImage.includes("supabase")) {
        const urlParts = formData.profileImage.split("/")
        const bucketIndex = urlParts.findIndex((part) => part === "proxya-images")
        if (bucketIndex !== -1 && bucketIndex < urlParts.length - 1) {
          const oldPath = urlParts.slice(bucketIndex + 1).join("/")
          await imageService.deleteImage(oldPath)
        }
      }

      // Mettre à jour l'état
      setFormData({ ...formData, profileImage: result.url })
      setSuccess("Photo de profil mise à jour !")
    } catch (error) {
      console.error("Erreur upload photo:", error)
      setError("Erreur lors de l'upload de la photo")
    } finally {
      setIsLoading(false)
    }
  }

  const [formData, setFormData] = useState({
    // Informations de base
    nom: provider?.nom || "",
    prenom: provider?.prenom || "",
    email: provider?.email || "",
    telephone: provider?.telephone || "",
    adresse: provider?.adresse || "",
    ville: provider?.ville || "",
    quartier: provider?.quartier || "",
    profileImage: provider?.profileImage || "",

    // Profil professionnel
    bio: provider?.bio || "",
    description: provider?.description || "",
    experience: provider?.experience || 0,
    categories: provider?.categories || [],
    specifications: provider?.specifications || "",
    expertise: provider?.expertise || ("debutant" as "debutant" | "intermediaire" | "professionnel"),

    // Tarifs et disponibilités
    tarifsMin: provider?.tarifs?.min || 0,
    tarifsMax: provider?.tarifs?.max || 0,
    disponibilites: provider?.disponibilites || [],
    responseTime: provider?.responseTime || 24,

    // Langues
    languages: provider?.languages || ["Français"],

    // Réseaux sociaux
    website: provider?.socialLinks?.website || "",
    facebook: provider?.socialLinks?.facebook || "",
    instagram: provider?.socialLinks?.instagram || "",
    linkedin: provider?.socialLinks?.linkedin || "",

    // Informations business
    businessName: provider?.businessInfo?.businessName || "",
    businessType: provider?.businessInfo?.businessType || ("individual" as "individual" | "company"),
    registrationNumber: provider?.businessInfo?.registrationNumber || "",
    insurance: provider?.businessInfo?.insurance || false,
  })

  const [skills, setSkills] = useState<Skill[]>(provider?.skills || [])
  const [certifications, setCertifications] = useState<Certification[]>(provider?.certifications || [])
  const [portfolio, setPortfolio] = useState<PortfolioItem[]>(provider?.portfolio || [])

  const categories = ["Beauté/Esthétique", "Alimentation", "Éducation", "Événementiel", "Maintenance"]
  const languages = ["Français", "Anglais", "Allemand", "Espagnol", "Arabe", "Ewondo", "Bamiléké", "Fulfuldé"]
  const expertiseLevels = [
    { value: "debutant" as const, label: "Débutant" },
    { value: "intermediaire" as const, label: "Intermédiaire" },
    { value: "professionnel" as const, label: "Professionnel" },
  ]

  const businessTypes = [
    { value: "individual" as const, label: "Particulier" },
    { value: "company" as const, label: "Entreprise" },
  ]

  useEffect(() => {
    if (!currentUser || userType !== "provider") {
      navigate("/provider/login")
    }
  }, [currentUser, userType, navigate])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")
    setSuccess("")

    try {
      if (!provider?.id) {
        setError("Erreur: Utilisateur non identifié")
        return
      }

      const maxExperience =
        skills.length > 0
          ? Math.max(...skills.map((skill) => skill.yearsOfExperience), formData.experience)
          : formData.experience

      const updatedProvider: Partial<Provider> = {
        // Informations de base
        nom: formData.nom,
        prenom: formData.prenom,
        email: formData.email,
        telephone: formData.telephone,
        adresse: formData.adresse,
        ville: formData.ville,
        quartier: formData.quartier,
        profileImage: formData.profileImage,

        // Profil professionnel
        bio: formData.bio,
        description: formData.description,
        experience: maxExperience,
        categories: formData.categories,
        specifications: formData.specifications,
        expertise: formData.expertise,

        // Tarifs et disponibilités
        tarifs: {
          min: formData.tarifsMin,
          max: formData.tarifsMax,
        },
        disponibilites: formData.disponibilites,
        responseTime: formData.responseTime,

        // Langues et compétences
        languages: formData.languages,
        skills: skills,
        certifications: certifications,
        portfolio: portfolio,

        // Réseaux sociaux
        socialLinks: {
          website: formData.website,
          facebook: formData.facebook,
          instagram: formData.instagram,
          linkedin: formData.linkedin,
        },

        // Informations business
        businessInfo: {
          businessName: formData.businessName,
          businessType: formData.businessType,
          registrationNumber: formData.registrationNumber,
          insurance: formData.insurance,
        },
      }

      const isBusinessComplete =
        formData.businessName &&
        formData.businessType === "company" &&
        formData.registrationNumber &&
        formData.insurance

      updatedProvider.isVerified = isBusinessComplete || provider?.isVerified || false

      await providerService.update(provider.id, updatedProvider)
      setSuccess("Profil mis à jour avec succès !")

      // Rediriger vers le dashboard après 2 secondes
      // setTimeout(() => {
      //   navigate("/provider/dashboard")
      // }, 2000)
    } catch (err) {
      console.error("Erreur lors de la mise à jour:", err)
      setError("Une erreur est survenue lors de la mise à jour")
    } finally {
      setIsLoading(false)
    }
  }

  const addSkill = () => {
    setSkills([...skills, { name: "", level: 1, yearsOfExperience: 0 }])
  }

  const updateSkill = (index: number, field: keyof Skill, value: any) => {
    const newSkills = [...skills]
    newSkills[index] = { ...newSkills[index], [field]: value }
    setSkills(newSkills)
  }

  const removeSkill = (index: number) => {
    setSkills(skills.filter((_, i) => i !== index))
  }

  const handleCategoryToggle = (category: string) => {
    const newCategories = formData.categories.includes(category)
      ? formData.categories.filter((c) => c !== category)
      : [...formData.categories, category]
    setFormData({ ...formData, categories: newCategories })
  }

  const handleLanguageToggle = (language: string) => {
    const newLanguages = formData.languages.includes(language)
      ? formData.languages.filter((l) => l !== language)
      : [...formData.languages, language]
    setFormData({ ...formData, languages: newLanguages })
  }

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-slate-900">
      <ThemeToggle />

      {/* Header */}
      <div className="border-b bg-white dark:bg-slate-800 border-stone-200 dark:border-slate-700">
        <div className="flex items-center justify-between p-4">
          <button
            onClick={() => navigate("/provider/dashboard")}
            className="flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
          >
            <ArrowLeft size={20} />
            <span className="font-medium">Retour au dashboard</span>
          </button>

          <h1 className="text-xl font-bold text-slate-900 dark:text-white">Modifier mon profil</h1>

          <Button
            onClick={handleSubmit}
            disabled={isLoading}
            className="bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-stone-100 dark:text-slate-900"
          >
            <Save size={16} className="mr-2" />
            {isLoading ? "Sauvegarde..." : "Sauvegarder"}
          </Button>
        </div>

        {/* Navigation tabs */}
        <div className="flex gap-1 px-4 pb-4">
          {[
            { id: "basic", label: "Informations de base", icon: User },
            { id: "professional", label: "Profil professionnel", icon: Briefcase },
            { id: "skills", label: "Compétences", icon: Star },
            { id: "business", label: "Informations business", icon: Globe },
          ].map((tab) => (
            <Button
              key={tab.id}
              variant={activeTab === tab.id ? "default" : "ghost"}
              size="sm"
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 ${
                activeTab === tab.id
                  ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <tab.icon size={16} />
              {tab.label}
            </Button>
          ))}
        </div>
      </div>

      <div className="p-4 max-w-4xl mx-auto">
        {/* Messages d'erreur et de succès */}
        {error && (
          <Alert className="mb-4 border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20">
            <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
            <AlertDescription className="text-red-700 dark:text-red-300">{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="mb-4 border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20">
            <AlertCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
            <AlertDescription className="text-green-700 dark:text-green-300">{success}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {activeTab === "basic" && (
            <Card className="bg-white dark:bg-slate-800 border-stone-200 dark:border-slate-700">
              <CardHeader>
                <CardTitle className="text-slate-900 dark:text-white">Informations personnelles</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Photo de profil */}
                <div className="flex items-center gap-4">
                  <Avatar className="h-20 w-20">
                    <AvatarImage src={formData.profileImage || provider?.profileImage || "/placeholder.svg"} />
                    <AvatarFallback className="bg-slate-900 text-white dark:bg-white dark:text-slate-900 text-xl">
                      {provider?.prenom?.[0]}
                      {provider?.nom?.[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleProfileImageChange}
                      className="hidden"
                      id="profile-image-input"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-stone-200 dark:border-slate-700"
                      onClick={() => document.getElementById("profile-image-input")?.click()}
                    >
                      <Upload size={16} className="mr-2" />
                      Changer la photo
                    </Button>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">JPG, PNG ou GIF. Max 2MB.</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="prenom" className="text-slate-900 dark:text-white">
                      Prénom
                    </Label>
                    <Input
                      id="prenom"
                      value={formData.prenom}
                      onChange={(e) => setFormData({ ...formData, prenom: e.target.value })}
                      className="bg-white dark:bg-slate-800 border-stone-200 dark:border-slate-700"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="nom" className="text-slate-900 dark:text-white">
                      Nom
                    </Label>
                    <Input
                      id="nom"
                      value={formData.nom}
                      onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                      className="bg-white dark:bg-slate-800 border-stone-200 dark:border-slate-700"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-slate-900 dark:text-white">
                    Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="bg-white dark:bg-slate-800 border-stone-200 dark:border-slate-700"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="telephone" className="text-slate-900 dark:text-white">
                    Téléphone
                  </Label>
                  <Input
                    id="telephone"
                    value={formData.telephone}
                    onChange={(e) => setFormData({ ...formData, telephone: e.target.value })}
                    className="bg-white dark:bg-slate-800 border-stone-200 dark:border-slate-700"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="ville" className="text-slate-900 dark:text-white">
                      Ville
                    </Label>
                    <Input
                      id="ville"
                      value={formData.ville}
                      onChange={(e) => setFormData({ ...formData, ville: e.target.value })}
                      placeholder="Ex: Yaoundé"
                      className="bg-white dark:bg-slate-800 border-stone-200 dark:border-slate-700"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="quartier" className="text-slate-900 dark:text-white">
                      Quartier
                    </Label>
                    <Input
                      id="quartier"
                      value={formData.quartier}
                      onChange={(e) => setFormData({ ...formData, quartier: e.target.value })}
                      placeholder="Ex: Bastos"
                      className="bg-white dark:bg-slate-800 border-stone-200 dark:border-slate-700"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="adresse" className="text-slate-900 dark:text-white">
                    Adresse complète
                  </Label>
                  <Textarea
                    id="adresse"
                    value={formData.adresse}
                    onChange={(e) => setFormData({ ...formData, adresse: e.target.value })}
                    className="bg-white dark:bg-slate-800 border-stone-200 dark:border-slate-700"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-slate-900 dark:text-white">Langues parlées</Label>
                  <div className="grid grid-cols-3 gap-2">
                    {languages.map((language) => (
                      <button
                        key={language}
                        type="button"
                        onClick={() => handleLanguageToggle(language)}
                        className={`p-2 text-sm rounded-lg border transition-all ${
                          formData.languages.includes(language)
                            ? "bg-slate-900 text-white border-slate-900 dark:bg-white dark:text-slate-900 dark:border-white"
                            : "bg-white text-slate-900 border-stone-200 hover:border-slate-400 dark:bg-slate-800 dark:text-white dark:border-slate-700 dark:hover:border-slate-500"
                        }`}
                      >
                        {language}
                      </button>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === "professional" && (
            <div className="space-y-6">
              <Card className="bg-white dark:bg-slate-800 border-stone-200 dark:border-slate-700">
                <CardHeader>
                  <CardTitle className="text-slate-900 dark:text-white">Profil professionnel</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="bio" className="text-slate-900 dark:text-white">
                      Bio courte
                    </Label>
                    <Textarea
                      id="bio"
                      value={formData.bio}
                      onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                      placeholder="Décrivez-vous en quelques mots..."
                      className="bg-white dark:bg-slate-800 border-stone-200 dark:border-slate-700"
                      rows={2}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description" className="text-slate-900 dark:text-white">
                      Description détaillée
                    </Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Décrivez votre expérience, vos services, votre approche..."
                      className="bg-white dark:bg-slate-800 border-stone-200 dark:border-slate-700"
                      rows={4}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="experience" className="text-slate-900 dark:text-white">
                        Années d'expérience
                      </Label>
                      <Input
                        id="experience"
                        type="number"
                        value={formData.experience}
                        onChange={(e) => setFormData({ ...formData, experience: Number(e.target.value) })}
                        className="bg-white dark:bg-slate-800 border-stone-200 dark:border-slate-700"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="expertise" className="text-slate-900 dark:text-white">
                        Niveau d'expertise
                      </Label>
                      <Select
                        value={formData.expertise}
                        onValueChange={(value: "debutant" | "intermediaire" | "professionnel") =>
                          setFormData({ ...formData, expertise: value })
                        }
                      >
                        <SelectTrigger className="bg-white dark:bg-slate-800 border-stone-200 dark:border-slate-700">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {expertiseLevels.map((level) => (
                            <SelectItem key={level.value} value={level.value}>
                              {level.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-slate-900 dark:text-white">Catégories de services</Label>
                    <div className="grid grid-cols-2 gap-2">
                      {categories.map((category) => (
                        <button
                          key={category}
                          type="button"
                          onClick={() => handleCategoryToggle(category)}
                          className={`p-2 text-sm rounded-lg border transition-all ${
                            formData.categories.includes(category)
                              ? "bg-slate-900 text-white border-slate-900 dark:bg-white dark:text-slate-900 dark:border-white"
                              : "bg-white text-slate-900 border-stone-200 hover:border-slate-400 dark:bg-slate-800 dark:text-white dark:border-slate-700 dark:hover:border-slate-500"
                          }`}
                        >
                          {category}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="specifications" className="text-slate-900 dark:text-white">
                      Spécifications
                    </Label>
                    <Textarea
                      id="specifications"
                      value={formData.specifications}
                      onChange={(e) => setFormData({ ...formData, specifications: e.target.value })}
                      placeholder="Détaillez vos spécialités..."
                      className="bg-white dark:bg-slate-800 border-stone-200 dark:border-slate-700"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="tarifsMin" className="text-slate-900 dark:text-white">
                        Tarif minimum (FCFA)
                      </Label>
                      <Input
                        id="tarifsMin"
                        type="number"
                        value={formData.tarifsMin}
                        onChange={(e) => setFormData({ ...formData, tarifsMin: Number(e.target.value) })}
                        className="bg-white dark:bg-slate-800 border-stone-200 dark:border-slate-700"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="tarifsMax" className="text-slate-900 dark:text-white">
                        Tarif maximum (FCFA)
                      </Label>
                      <Input
                        id="tarifsMax"
                        type="number"
                        value={formData.tarifsMax}
                        onChange={(e) => setFormData({ ...formData, tarifsMax: Number(e.target.value) })}
                        className="bg-white dark:bg-slate-800 border-stone-200 dark:border-slate-700"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="responseTime" className="text-slate-900 dark:text-white">
                      Temps de réponse (heures)
                    </Label>
                    <Input
                      id="responseTime"
                      type="number"
                      value={formData.responseTime}
                      onChange={(e) => setFormData({ ...formData, responseTime: Number(e.target.value) })}
                      className="bg-white dark:bg-slate-800 border-stone-200 dark:border-slate-700"
                    />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white dark:bg-slate-800 border-stone-200 dark:border-slate-700">
                <CardHeader>
                  <CardTitle className="text-slate-900 dark:text-white">Réseaux sociaux</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="website" className="text-slate-900 dark:text-white flex items-center gap-2">
                      <Globe size={16} />
                      Site web
                    </Label>
                    <Input
                      id="website"
                      value={formData.website}
                      onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                      placeholder="https://monsite.com"
                      className="bg-white dark:bg-slate-800 border-stone-200 dark:border-slate-700"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="facebook" className="text-slate-900 dark:text-white flex items-center gap-2">
                      <Facebook size={16} />
                      Facebook
                    </Label>
                    <Input
                      id="facebook"
                      value={formData.facebook}
                      onChange={(e) => setFormData({ ...formData, facebook: e.target.value })}
                      placeholder="https://facebook.com/monprofil"
                      className="bg-white dark:bg-slate-800 border-stone-200 dark:border-slate-700"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="instagram" className="text-slate-900 dark:text-white flex items-center gap-2">
                      <Instagram size={16} />
                      Instagram
                    </Label>
                    <Input
                      id="instagram"
                      value={formData.instagram}
                      onChange={(e) => setFormData({ ...formData, instagram: e.target.value })}
                      placeholder="https://instagram.com/monprofil"
                      className="bg-white dark:bg-slate-800 border-stone-200 dark:border-slate-700"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="linkedin" className="text-slate-900 dark:text-white flex items-center gap-2">
                      <Linkedin size={16} />
                      LinkedIn
                    </Label>
                    <Input
                      id="linkedin"
                      value={formData.linkedin}
                      onChange={(e) => setFormData({ ...formData, linkedin: e.target.value })}
                      placeholder="https://linkedin.com/in/monprofil"
                      className="bg-white dark:bg-slate-800 border-stone-200 dark:border-slate-700"
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === "skills" && (
            <Card className="bg-white dark:bg-slate-800 border-stone-200 dark:border-stone-700">
              <CardHeader>
                <CardTitle className="flex items-center justify-between text-slate-900 dark:text-white">
                  <span>Compétences</span>
                  <Button
                    type="button"
                    onClick={addSkill}
                    size="sm"
                    className="bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-stone-100 dark:text-slate-900"
                  >
                    <Plus size={16} className="mr-2" />
                    Ajouter
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {skills.length === 0 ? (
                  <div className="text-center py-8">
                    <Star className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                    <h3 className="font-semibold mb-2 text-slate-900 dark:text-white">Aucune compétence</h3>
                    <p className="text-slate-600 dark:text-slate-400 text-sm mb-4">
                      Ajoutez vos compétences pour montrer votre expertise aux clients.
                    </p>
                    <Button
                      type="button"
                      onClick={addSkill}
                      className="bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-stone-100 dark:text-slate-900"
                    >
                      <Plus size={16} className="mr-2" />
                      Ajouter une compétence
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {skills.map((skill, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-4 p-4 border border-stone-200 dark:border-slate-700 rounded-lg"
                      >
                        <div className="flex-1 grid grid-cols-3 gap-4">
                          <Input
                            placeholder="Nom de la compétence"
                            value={skill.name}
                            onChange={(e) => updateSkill(index, "name", e.target.value)}
                            className="bg-white dark:bg-slate-800 border-stone-200 dark:border-slate-700"
                          />
                          <Select
                            value={skill.level.toString()}
                            onValueChange={(value) => updateSkill(index, "level", Number(value))}
                          >
                            <SelectTrigger className="bg-white dark:bg-slate-800 border-stone-200 dark:border-slate-700">
                              <SelectValue placeholder="Niveau" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="1">⭐ Débutant</SelectItem>
                              <SelectItem value="2">⭐⭐ Novice</SelectItem>
                              <SelectItem value="3">⭐⭐⭐ Intermédiaire</SelectItem>
                              <SelectItem value="4">⭐⭐⭐⭐ Avancé</SelectItem>
                              <SelectItem value="5">⭐⭐⭐⭐⭐ Expert</SelectItem>
                            </SelectContent>
                          </Select>
                          <Input
                            type="number"
                            placeholder="Années d'exp."
                            value={skill.yearsOfExperience}
                            onChange={(e) => updateSkill(index, "yearsOfExperience", Number(e.target.value))}
                            className="bg-white dark:bg-slate-800 border-stone-200 dark:border-slate-700"
                          />
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeSkill(index)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 size={16} />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {activeTab === "business" && (
            <Card className="bg-white dark:bg-slate-800 border-stone-200 dark:border-slate-700">
              <CardHeader>
                <CardTitle className="text-slate-900 dark:text-white">Informations business</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="businessName" className="text-slate-900 dark:text-white">
                    Nom de l'entreprise (optionnel)
                  </Label>
                  <Input
                    id="businessName"
                    value={formData.businessName}
                    onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                    placeholder="Ex: Mon Salon de Beauté"
                    className="bg-white dark:bg-slate-800 border-stone-200 dark:border-slate-700"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="businessType" className="text-slate-900 dark:text-white">
                    Type d'activité
                  </Label>
                  <Select
                    value={formData.businessType}
                    onValueChange={(value: "individual" | "company") =>
                      setFormData({ ...formData, businessType: value })
                    }
                  >
                    <SelectTrigger className="bg-white dark:bg-slate-800 border-stone-200 dark:border-slate-700">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {businessTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {formData.businessType === "company" && (
                  <div className="space-y-2">
                    <Label htmlFor="registrationNumber" className="text-slate-900 dark:text-white">
                      Numéro d'enregistrement
                    </Label>
                    <Input
                      id="registrationNumber"
                      value={formData.registrationNumber}
                      onChange={(e) => setFormData({ ...formData, registrationNumber: e.target.value })}
                      placeholder="Ex: RC/YAO/2023/B/1234"
                      className="bg-white dark:bg-slate-800 border-stone-200 dark:border-slate-700"
                    />
                  </div>
                )}

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="insurance"
                    checked={formData.insurance}
                    onChange={(e) => setFormData({ ...formData, insurance: e.target.checked })}
                    className="rounded border-stone-300 dark:border-slate-600"
                  />
                  <Label htmlFor="insurance" className="text-slate-900 dark:text-white">
                    J'ai une assurance responsabilité civile professionnelle
                  </Label>
                </div>
              </CardContent>
            </Card>
          )}
        </form>
      </div>
    </div>
  )
}

export default EditProviderProfile

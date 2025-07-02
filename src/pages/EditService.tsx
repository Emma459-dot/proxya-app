"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { ArrowLeft, Save, DollarSign, Clock, Tag, FileText, Plus, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { AlertCircle } from "lucide-react"
import ThemeToggle from "../components/ThemeToggle"
import ImageUploadSupabase from "../components/ImageUploadSupabase"
import { useAuth } from "../context/AuthContext"
import { serviceService } from "../services/firebaseService"
import type { Provider, Service } from "../types"

const EditService = () => {
  const navigate = useNavigate()
  const { serviceId } = useParams()
  const { currentUser } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingData, setIsLoadingData] = useState(true)
  const [error, setError] = useState("")
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "",
    price: "",
    duration: "",
    location: "domicile" as "domicile" | "salon" | "les-deux",
    images: [] as string[],
    tags: [] as string[],
    features: [] as string[],
    availability: {
      days: [] as string[],
      timeSlots: [] as string[],
    },
  })
  const [newTag, setNewTag] = useState("")
  const [newFeature, setNewFeature] = useState("")

  const provider = currentUser as Provider
  const categories = ["Beauté/Esthétique", "Alimentation", "Éducation", "Événementiel", "Maintenance"]
  const availableDays = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"]
  const timeSlots = ["08:00-12:00", "12:00-16:00", "16:00-20:00", "20:00-00:00"]

  useEffect(() => {
    loadServiceData()
  }, [serviceId])

  const loadServiceData = async () => {
    if (!serviceId || !provider?.id) return

    try {
      const services = await serviceService.getByProvider(provider.id)
      const service = services.find((s) => s.id === serviceId)

      if (service) {
        setFormData({
          title: service.title,
          description: service.description,
          category: service.category,
          price: service.price.toString(),
          duration: service.duration.toString(),
          location: service.location || "domicile",
          images: service.images || [],
          tags: service.tags || [],
          features: service.features || [],
          availability: service.availability || { days: [], timeSlots: [] },
        })
      } else {
        setError("Service non trouvé")
      }
    } catch (err) {
      console.error("Erreur lors du chargement:", err)
      setError("Erreur lors du chargement du service")
    } finally {
      setIsLoadingData(false)
    }
  }

  const addTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData({
        ...formData,
        tags: [...formData.tags, newTag.trim()],
      })
      setNewTag("")
    }
  }

  const removeTag = (tagToRemove: string) => {
    setFormData({
      ...formData,
      tags: formData.tags.filter((tag) => tag !== tagToRemove),
    })
  }

  const addFeature = () => {
    if (newFeature.trim() && !formData.features.includes(newFeature.trim())) {
      setFormData({
        ...formData,
        features: [...formData.features, newFeature.trim()],
      })
      setNewFeature("")
    }
  }

  const removeFeature = (featureToRemove: string) => {
    setFormData({
      ...formData,
      features: formData.features.filter((feature) => feature !== featureToRemove),
    })
  }

  const handleDayChange = (day: string, checked: boolean) => {
    const newDays = checked ? [...formData.availability.days, day] : formData.availability.days.filter((d) => d !== day)

    setFormData({
      ...formData,
      availability: {
        ...formData.availability,
        days: newDays,
      },
    })
  }

  const handleTimeSlotChange = (slot: string, checked: boolean) => {
    const newSlots = checked
      ? [...formData.availability.timeSlots, slot]
      : formData.availability.timeSlots.filter((s) => s !== slot)

    setFormData({
      ...formData,
      availability: {
        ...formData.availability,
        timeSlots: newSlots,
      },
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      if (!formData.title || !formData.description || !formData.category || !formData.price || !formData.duration) {
        setError("Veuillez remplir tous les champs obligatoires")
        return
      }

      if (!serviceId) {
        setError("ID du service manquant")
        return
      }

      const serviceData: Partial<Service> = {
        title: formData.title,
        description: formData.description,
        category: formData.category,
        price: Number.parseFloat(formData.price),
        duration: Number.parseInt(formData.duration),
        images: formData.images,
        tags: formData.tags,
        features: formData.features,
        location: formData.location,
        availability: formData.availability,
      }

      await serviceService.update(serviceId, serviceData)
      navigate("/provider/dashboard")
    } catch (err) {
      console.error("Erreur:", err)
      setError("Une erreur est survenue. Veuillez réessayer.")
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoadingData) {
    return (
      <div className="min-h-screen bg-stone-50 dark:bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900 dark:border-white mx-auto mb-4"></div>
          <p className="text-slate-600 dark:text-slate-400">Chargement du service...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-slate-900">
      <ThemeToggle />

      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b bg-white dark:bg-slate-800 border-stone-200 dark:border-slate-700">
        <button
          onClick={() => navigate("/provider/dashboard")}
          className="flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
        >
          <ArrowLeft size={20} />
          <span className="font-medium">Retour au dashboard</span>
        </button>

        <h1 className="text-xl font-bold text-slate-900 dark:text-white">PROXYA</h1>
        <div className="w-32"></div>
      </div>

      <div className="p-6 max-w-4xl mx-auto">
        {/* Titre */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-slate-900 dark:bg-white rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Tag size={24} className="text-white dark:text-slate-900" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Modifier le service</h2>
          <p className="text-slate-600 dark:text-slate-400 text-sm">Mettez à jour les informations de votre service</p>
        </div>

        {/* Erreur */}
        {error && (
          <Alert className="mb-6 border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20">
            <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
            <AlertDescription className="text-red-700 dark:text-red-300">{error}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Informations de base */}
          <Card className="bg-white dark:bg-slate-800 border-stone-200 dark:border-slate-700">
            <CardHeader>
              <CardTitle className="text-slate-900 dark:text-white">Informations de base</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="title" className="text-slate-900 dark:text-white">
                  Titre du service *
                </Label>
                <div className="relative">
                  <FileText size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <Input
                    id="title"
                    type="text"
                    placeholder="Ex: Coupe et brushing à domicile"
                    className="pl-10 bg-white dark:bg-slate-800 border-stone-200 dark:border-slate-700"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="category" className="text-slate-900 dark:text-white">
                    Catégorie *
                  </Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => setFormData({ ...formData, category: value })}
                  >
                    <SelectTrigger className="bg-white dark:bg-slate-800 border-stone-200 dark:border-slate-700">
                      <SelectValue placeholder="Sélectionnez une catégorie" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="location" className="text-slate-900 dark:text-white">
                    Lieu de prestation *
                  </Label>
                  <Select
                    value={formData.location}
                    onValueChange={(value: "domicile" | "salon" | "les-deux") =>
                      setFormData({ ...formData, location: value })
                    }
                  >
                    <SelectTrigger className="bg-white dark:bg-slate-800 border-stone-200 dark:border-slate-700">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="domicile">À domicile</SelectItem>
                      <SelectItem value="salon">Dans mon salon</SelectItem>
                      <SelectItem value="les-deux">Les deux</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="price" className="text-slate-900 dark:text-white">
                    Prix (€) *
                  </Label>
                  <div className="relative">
                    <DollarSign size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <Input
                      id="price"
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="50.00"
                      className="pl-10 bg-white dark:bg-slate-800 border-stone-200 dark:border-slate-700"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="duration" className="text-slate-900 dark:text-white">
                    Durée (minutes) *
                  </Label>
                  <div className="relative">
                    <Clock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <Input
                      id="duration"
                      type="number"
                      min="15"
                      step="15"
                      placeholder="60"
                      className="pl-10 bg-white dark:bg-slate-800 border-stone-200 dark:border-slate-700"
                      value={formData.duration}
                      onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description" className="text-slate-900 dark:text-white">
                  Description détaillée *
                </Label>
                <Textarea
                  id="description"
                  placeholder="Décrivez votre service en détail : ce qui est inclus, le déroulement, les prérequis..."
                  className="min-h-32 bg-white dark:bg-slate-800 border-stone-200 dark:border-slate-700"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  required
                />
              </div>
            </CardContent>
          </Card>

          {/* Images */}
          <Card className="bg-white dark:bg-slate-800 border-stone-200 dark:border-slate-700">
            <CardHeader>
              <CardTitle className="text-slate-900 dark:text-white">Images du service</CardTitle>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Modifiez les images pour rendre votre service plus attractif
              </p>
            </CardHeader>
            <CardContent>
              <ImageUploadSupabase
                images={formData.images}
                onImagesChange={(images) => setFormData({ ...formData, images })}
                folder="services"
                maxImages={5}
                maxSizeMB={10}
              />
            </CardContent>
          </Card>

          {/* Tags et caractéristiques */}
          <Card className="bg-white dark:bg-slate-800 border-stone-200 dark:border-slate-700">
            <CardHeader>
              <CardTitle className="text-slate-900 dark:text-white">Tags et caractéristiques</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Tags */}
              <div className="space-y-3">
                <Label className="text-slate-900 dark:text-white">Tags (mots-clés)</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Ex: rapide, professionnel, bio..."
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addTag())}
                    className="bg-white dark:bg-slate-800 border-stone-200 dark:border-slate-700"
                  />
                  <Button type="button" onClick={addTag} variant="outline">
                    <Plus size={16} />
                  </Button>
                </div>
                {formData.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {formData.tags.map((tag) => (
                      <Badge
                        key={tag}
                        variant="secondary"
                        className="bg-stone-200 text-slate-900 dark:bg-slate-700 dark:text-slate-300"
                      >
                        {tag}
                        <button type="button" onClick={() => removeTag(tag)} className="ml-2">
                          <X size={12} />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              {/* Caractéristiques */}
              <div className="space-y-3">
                <Label className="text-slate-900 dark:text-white">Caractéristiques incluses</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Ex: Matériel fourni, Déplacement inclus..."
                    value={newFeature}
                    onChange={(e) => setNewFeature(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addFeature())}
                    className="bg-white dark:bg-slate-800 border-stone-200 dark:border-slate-700"
                  />
                  <Button type="button" onClick={addFeature} variant="outline">
                    <Plus size={16} />
                  </Button>
                </div>
                {formData.features.length > 0 && (
                  <div className="space-y-2">
                    {formData.features.map((feature) => (
                      <div
                        key={feature}
                        className="flex items-center justify-between p-2 bg-stone-100 dark:bg-slate-700 rounded"
                      >
                        <span className="text-sm text-slate-900 dark:text-white">{feature}</span>
                        <button type="button" onClick={() => removeFeature(feature)}>
                          <X size={14} className="text-slate-500" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Disponibilités */}
          <Card className="bg-white dark:bg-slate-800 border-stone-200 dark:border-slate-700">
            <CardHeader>
              <CardTitle className="text-slate-900 dark:text-white">Disponibilités</CardTitle>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Modifiez vos créneaux de disponibilité pour ce service
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Jours */}
              <div className="space-y-3">
                <Label className="text-slate-900 dark:text-white">Jours disponibles</Label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {availableDays.map((day) => (
                    <div key={day} className="flex items-center space-x-2">
                      <Checkbox
                        id={day}
                        checked={formData.availability.days.includes(day)}
                        onCheckedChange={(checked) => handleDayChange(day, checked as boolean)}
                      />
                      <Label htmlFor={day} className="text-sm text-slate-900 dark:text-white">
                        {day}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Créneaux horaires */}
              <div className="space-y-3">
                <Label className="text-slate-900 dark:text-white">Créneaux horaires</Label>
                <div className="grid grid-cols-2 gap-3">
                  {timeSlots.map((slot) => (
                    <div key={slot} className="flex items-center space-x-2">
                      <Checkbox
                        id={slot}
                        checked={formData.availability.timeSlots.includes(slot)}
                        onCheckedChange={(checked) => handleTimeSlotChange(slot, checked as boolean)}
                      />
                      <Label htmlFor={slot} className="text-sm text-slate-900 dark:text-white">
                        {slot}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Boutons d'action */}
          <div className="flex gap-4 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate("/provider/dashboard")}
              className="flex-1 border-stone-200 dark:border-slate-700"
            >
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="flex-1 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-stone-100 dark:text-slate-900"
            >
              {isLoading ? (
                "Mise à jour..."
              ) : (
                <>
                  <Save size={16} className="mr-2" />
                  Sauvegarder les modifications
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default EditService

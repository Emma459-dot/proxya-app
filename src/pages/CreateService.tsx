"use client"

import type React from "react"
import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { ArrowLeft, Save, DollarSign, Clock, Tag, FileText, Plus, X, MapPin, Users, Zap } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { AlertCircle, Info } from "lucide-react"
import ThemeToggle from "../components/ThemeToggle"
import ImageUploadSupabase from "../components/ImageUploadSupabase"
import { useAuth } from "../context/AuthContext"
import { serviceService } from "../services/firebaseService"
import { formatPrice, priceSuggestions, cameroonLocations } from "../utils/currency"
import type { Provider, Service } from "../types"

const CreateService = () => {
  const navigate = useNavigate()
  const { currentUser } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "",
    price: "",
    duration: "",
    location: "domicile" as "domicile" | "salon" | "les-deux",
    serviceArea: [] as string[],
    images: [] as string[],
    tags: [] as string[],
    features: [] as string[],
    availability: {
      days: [] as string[],
      timeSlots: [] as string[],
    },
    isGroupService: false,
    maxGroupSize: "",
    isUrgentAvailable: false,
    urgentPriceMultiplier: "1.5",
    paymentOptions: [] as string[],
  })
  const [newTag, setNewTag] = useState("")
  const [newFeature, setNewFeature] = useState("")

  const provider = currentUser as Provider
  const categories = ["Beauté/Esthétique", "Alimentation", "Éducation", "Événementiel", "Maintenance"]
  const availableDays = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"]
  const timeSlots = ["06:00-10:00", "10:00-14:00", "14:00-18:00", "18:00-22:00", "22:00-02:00"]
  const paymentMethods = ["Mobile Money", "Espèces", "Virement bancaire", "Orange Money", "MTN Money"]

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

  const handleServiceAreaChange = (area: string, checked: boolean) => {
    const newAreas = checked ? [...formData.serviceArea, area] : formData.serviceArea.filter((a) => a !== area)

    setFormData({
      ...formData,
      serviceArea: newAreas,
    })
  }

  const handlePaymentOptionChange = (option: string, checked: boolean) => {
    const newOptions = checked
      ? [...formData.paymentOptions, option]
      : formData.paymentOptions.filter((o) => o !== option)

    setFormData({
      ...formData,
      paymentOptions: newOptions,
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

      if (!provider?.id) {
        setError("Erreur d'authentification")
        return
      }

      const serviceData: Omit<Service, "id" | "createdAt"> = {
        providerId: provider.id,
        title: formData.title,
        description: formData.description,
        category: formData.category,
        price: Number.parseFloat(formData.price),
        duration: Number.parseInt(formData.duration),
        isActive: true,
        images: formData.images,
        tags: formData.tags,
        features: formData.features,
        location: formData.location,
        availability: formData.availability,
        serviceArea: formData.serviceArea,
        isGroupService: formData.isGroupService,
        // Ne pas inclure maxGroupSize si ce n'est pas un service de groupe
        ...(formData.isGroupService && formData.maxGroupSize
          ? { maxGroupSize: Number.parseInt(formData.maxGroupSize) }
          : {}),
        isUrgentAvailable: formData.isUrgentAvailable,
        urgentPriceMultiplier: Number.parseFloat(formData.urgentPriceMultiplier),
        paymentOptions: formData.paymentOptions,
      }

      // Validation de la taille totale des données
      const estimatedSize = JSON.stringify(serviceData).length
      if (estimatedSize > 800000) {
        // 800KB de sécurité
        setError("Les images sont trop volumineuses. Veuillez réduire le nombre d'images ou leur qualité.")
        return
      }

      await serviceService.create(serviceData)
      navigate("/provider/dashboard")
    } catch (err) {
      console.error("Erreur:", err)
      setError("Une erreur est survenue. Veuillez réessayer.")
    } finally {
      setIsLoading(false)
    }
  }

  const selectedCategoryPrices = formData.category
    ? priceSuggestions[formData.category as keyof typeof priceSuggestions]
    : null

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
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Créer un nouveau service</h2>
          <p className="text-slate-600 dark:text-slate-400 text-sm">
            Créez un service attractif adapté au marché camerounais
          </p>
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
                    placeholder="Ex: Coiffure africaine à domicile"
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

                  {selectedCategoryPrices && (
                    <Alert className="mt-2">
                      <Info className="h-4 w-4" />
                      <AlertDescription className="text-xs">
                        <strong>Prix suggérés:</strong> {formatPrice(selectedCategoryPrices.min)} -{" "}
                        {formatPrice(selectedCategoryPrices.max)}
                        <br />
                        {selectedCategoryPrices.examples.map((example, i) => (
                          <span key={i} className="block">
                            {example}
                          </span>
                        ))}
                      </AlertDescription>
                    </Alert>
                  )}
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
                    Prix (FCFA) *
                  </Label>
                  <div className="relative">
                    <DollarSign size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <Input
                      id="price"
                      type="number"
                      min="1000"
                      step="500"
                      placeholder="15000"
                      className="pl-10 bg-white dark:bg-slate-800 border-stone-200 dark:border-slate-700"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      required
                    />
                  </div>
                  {formData.price && (
                    <p className="text-xs text-slate-600 dark:text-slate-400">
                      Prix affiché: {formatPrice(Number.parseFloat(formData.price))}
                    </p>
                  )}
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

          {/* Zone de service */}
          <Card className="bg-white dark:bg-slate-800 border-stone-200 dark:border-slate-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-slate-900 dark:text-white">
                <MapPin size={20} />
                Zone de service
              </CardTitle>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Sélectionnez les quartiers où vous proposez vos services
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-slate-900 dark:text-white mb-3 block">Yaoundé</Label>
                <div className="grid grid-cols-3 gap-2">
                  {cameroonLocations.yaoundé.map((area) => (
                    <div key={area} className="flex items-center space-x-2">
                      <Checkbox
                        id={`yaoundé-${area}`}
                        checked={formData.serviceArea.includes(area)}
                        onCheckedChange={(checked) => handleServiceAreaChange(area, checked as boolean)}
                      />
                      <Label htmlFor={`yaoundé-${area}`} className="text-sm text-slate-900 dark:text-white">
                        {area}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <Label className="text-slate-900 dark:text-white mb-3 block">Douala</Label>
                <div className="grid grid-cols-3 gap-2">
                  {cameroonLocations.douala.map((area) => (
                    <div key={area} className="flex items-center space-x-2">
                      <Checkbox
                        id={`douala-${area}`}
                        checked={formData.serviceArea.includes(area)}
                        onCheckedChange={(checked) => handleServiceAreaChange(area, checked as boolean)}
                      />
                      <Label htmlFor={`douala-${area}`} className="text-sm text-slate-900 dark:text-white">
                        {area}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <Label className="text-slate-900 dark:text-white mb-3 block">Autres villes</Label>
                <div className="grid grid-cols-3 gap-2">
                  {cameroonLocations.autres.map((area) => (
                    <div key={area} className="flex items-center space-x-2">
                      <Checkbox
                        id={`autres-${area}`}
                        checked={formData.serviceArea.includes(area)}
                        onCheckedChange={(checked) => handleServiceAreaChange(area, checked as boolean)}
                      />
                      <Label htmlFor={`autres-${area}`} className="text-sm text-slate-900 dark:text-white">
                        {area}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Options spéciales Cameroun */}
          <Card className="bg-white dark:bg-slate-800 border-stone-200 dark:border-stone-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-slate-900 dark:text-white">
                <Zap size={20} />
                Options spéciales
              </CardTitle>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Fonctionnalités adaptées au marché camerounais
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Service de groupe */}
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="groupService"
                    checked={formData.isGroupService}
                    onCheckedChange={(checked) => setFormData({ ...formData, isGroupService: checked as boolean })}
                  />
                  <Label htmlFor="groupService" className="text-slate-900 dark:text-white flex items-center gap-2">
                    <Users size={16} />
                    Service de groupe/famille
                  </Label>
                </div>
                {formData.isGroupService && (
                  <div className="ml-6">
                    <Label htmlFor="maxGroupSize" className="text-sm text-slate-900 dark:text-white">
                      Nombre maximum de personnes
                    </Label>
                    <Input
                      id="maxGroupSize"
                      type="number"
                      min="2"
                      max="20"
                      placeholder="5"
                      className="w-24 bg-white dark:bg-slate-800 border-stone-200 dark:border-slate-700"
                      value={formData.maxGroupSize}
                      onChange={(e) => setFormData({ ...formData, maxGroupSize: e.target.value })}
                    />
                  </div>
                )}
              </div>

              {/* Service urgent */}
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="urgentService"
                    checked={formData.isUrgentAvailable}
                    onCheckedChange={(checked) => setFormData({ ...formData, isUrgentAvailable: checked as boolean })}
                  />
                  <Label htmlFor="urgentService" className="text-slate-900 dark:text-white flex items-center gap-2">
                    <Zap size={16} />
                    Service urgent (même jour)
                  </Label>
                </div>
                {formData.isUrgentAvailable && (
                  <div className="ml-6">
                    <Label htmlFor="urgentMultiplier" className="text-sm text-slate-900 dark:text-white">
                      Multiplicateur de prix urgent
                    </Label>
                    <Select
                      value={formData.urgentPriceMultiplier}
                      onValueChange={(value) => setFormData({ ...formData, urgentPriceMultiplier: value })}
                    >
                      <SelectTrigger className="w-32 bg-white dark:bg-slate-800 border-stone-200 dark:border-slate-700">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1.2">+20%</SelectItem>
                        <SelectItem value="1.5">+50%</SelectItem>
                        <SelectItem value="2.0">+100%</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>

              {/* Moyens de paiement */}
              <div className="space-y-3">
                <Label className="text-slate-900 dark:text-white">Moyens de paiement acceptés</Label>
                <div className="grid grid-cols-2 gap-3">
                  {paymentMethods.map((method) => (
                    <div key={method} className="flex items-center space-x-2">
                      <Checkbox
                        id={method}
                        checked={formData.paymentOptions.includes(method)}
                        onCheckedChange={(checked) => handlePaymentOptionChange(method, checked as boolean)}
                      />
                      <Label htmlFor={method} className="text-sm text-slate-900 dark:text-white">
                        {method}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Images */}
          <Card className="bg-white dark:bg-slate-800 border-stone-200 dark:border-slate-700">
            <CardHeader>
              <CardTitle className="text-slate-900 dark:text-white">Images du service</CardTitle>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Ajoutez jusqu'à 3 images pour rendre votre service plus attractif (images automatiquement optimisées)
              </p>
            </CardHeader>
            <CardContent>
              <ImageUploadSupabase
                images={formData.images}
                onImagesChange={(images) => setFormData({ ...formData, images })}
                folder="services"
                maxImages={3}
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
                    placeholder="Ex: rapide, professionnel, traditionnel..."
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
                Indiquez vos créneaux de disponibilité pour ce service
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
                "Création..."
              ) : (
                <>
                  <Save size={16} className="mr-2" />
                  Créer le service
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default CreateService

"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import {
  Search,
  Filter,
  MapPin,
  Star,
  Clock,
  DollarSign,
  X,
  Sliders,
  Zap,
  Home,
  Building,
  Users,
  Mic,
  MicOff,
  Bookmark,
  BookmarkCheck,
  RotateCcw,
  Sparkles,
  Navigation,
  Target,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Slider } from "@/components/ui/slider"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Collapsible, CollapsibleContent } from "@/components/ui/collapsible"
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip"

export interface SearchFilters {
  query: string
  categories: string[]
  priceRange: [number, number]
  minRating: number
  location: {
    ville: string
    quartier: string
    maxDistance?: number
    useCurrentLocation?: boolean
    coordinates?: { lat: number; lng: number }
  }
  availability: {
    isUrgentAvailable: boolean
    isGroupService: boolean
    location: ("domicile" | "salon" | "les-deux")[]
  }
  sortBy: "relevance" | "price-asc" | "price-desc" | "rating" | "distance" | "newest"
  promoCode?: string
  hasPromo?: boolean
}

interface AdvancedSearchProps {
  onFiltersChange: (filters: SearchFilters) => void | Promise<void>
  onReset?: () => void
  initialFilters?: Partial<SearchFilters>
  isLoading?: boolean
  resultCount?: number
}

const CATEGORIES = [
  "Beauté/Esthétique",
  "Alimentation",
  "Éducation",
  "Événementiel",
  "Maintenance",
  "Transport",
  "Santé/Bien-être",
  "Technologie",
  "Artisanat",
  "Nettoyage",
]

const VILLES_CAMEROUN = [
  "Yaoundé",
  "Douala",
  "Bamenda",
  "Bafoussam",
  "Garoua",
  "Maroua",
  "Ngaoundéré",
  "Bertoua",
  "Ebolowa",
  "Kumba",
]

const QUARTIERS_YAOUNDE = [
  "Centre-ville",
  "Bastos",
  "Melen",
  "Kondengui",
  "Emana",
  "Essos",
  "Nlongkak",
  "Biyem-Assi",
  "Mvog-Mbi",
  "Djoungolo",
]

const QUARTIERS_DOUALA = [
  "Akwa",
  "Bonanjo",
  "Deido",
  "New Bell",
  "Bonapriso",
  "Makepe",
  "Logpom",
  "Bassa",
  "Kotto",
  "PK",
]

export default function AdvancedSearch({
  onFiltersChange,
  onReset,
  initialFilters,
  isLoading = false,
  resultCount = 0,
}: AdvancedSearchProps) {
  const [filters, setFilters] = useState<SearchFilters>({
    query: "",
    categories: [],
    priceRange: [0, 100000],
    minRating: 0,
    location: {
      ville: "",
      quartier: "",
      maxDistance: 50,
      useCurrentLocation: false,
    },
    availability: {
      isUrgentAvailable: false,
      isGroupService: false,
      location: [],
    },
    sortBy: "relevance",
    hasPromo: false,
    ...initialFilters,
  })

  const [showFilters, setShowFilters] = useState(false)
  const [activeFiltersCount, setActiveFiltersCount] = useState(0)
  const [hasSearched, setHasSearched] = useState(false)
  const [isVoiceRecording, setIsVoiceRecording] = useState(false)
  const [savedSearches, setSavedSearches] = useState<SearchFilters[]>([])
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [locationError, setLocationError] = useState<string>("")

  const debounceRef = useRef<NodeJS.Timeout>()
  const isInitialMount = useRef(true)
  const recognitionRef = useRef<any>(null)

  // Initialiser la reconnaissance vocale
  useEffect(() => {
    if ("webkitSpeechRecognition" in window || "SpeechRecognition" in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition
      recognitionRef.current = new SpeechRecognition()
      recognitionRef.current.continuous = false
      recognitionRef.current.interimResults = false
      recognitionRef.current.lang = "fr-FR"

      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript
        setFilters((prev) => ({ ...prev, query: transcript }))
        setIsVoiceRecording(false)
      }

      recognitionRef.current.onerror = () => {
        setIsVoiceRecording(false)
      }

      recognitionRef.current.onend = () => {
        setIsVoiceRecording(false)
      }
    }
  }, [])

  // Charger les recherches sauvegardées
  useEffect(() => {
    const saved = localStorage.getItem("proxya-saved-searches")
    if (saved) {
      setSavedSearches(JSON.parse(saved))
    }
  }, [])

  // Fonction debounced pour la recherche
  const debouncedSearch = useCallback(
    (searchFilters: SearchFilters) => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }
      debounceRef.current = setTimeout(() => {
        console.log("🔍 Recherche déclenchée avec filtres:", searchFilters)
        const result = onFiltersChange(searchFilters)
        if (result instanceof Promise) {
          result.catch(console.error)
        }
        setHasSearched(true)
      }, 300) // Réduit à 300ms pour plus de fluidité
    },
    [onFiltersChange],
  )

  // Calculer le nombre de filtres actifs
  useEffect(() => {
    let count = 0
    if (filters.query.trim()) count++
    if (filters.categories.length > 0) count++
    if (filters.priceRange[0] > 0 || filters.priceRange[1] < 100000) count++
    if (filters.minRating > 0) count++
    if (filters.location.ville || filters.location.useCurrentLocation) count++
    if (filters.availability.isUrgentAvailable || filters.availability.isGroupService) count++
    if (filters.availability.location.length > 0) count++
    if (filters.hasPromo) count++
    setActiveFiltersCount(count)
  }, [filters])

  // Déclencher la recherche
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false
      return
    }

    if (activeFiltersCount > 0 || hasSearched) {
      debouncedSearch(filters)
    }

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }
    }
  }, [filters, debouncedSearch, activeFiltersCount, hasSearched])

  // Géolocalisation
  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      setLocationError("Géolocalisation non supportée")
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coords = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        }
        setCurrentLocation(coords)
        setFilters((prev) => ({
          ...prev,
          location: {
            ...prev.location,
            useCurrentLocation: true,
            coordinates: coords,
          },
        }))
        setLocationError("")
      },
      (error) => {
        setLocationError("Impossible d'obtenir votre position")
        console.error("Erreur géolocalisation:", error)
      },
    )
  }

  // Recherche vocale
  const startVoiceSearch = () => {
    if (recognitionRef.current && !isVoiceRecording) {
      setIsVoiceRecording(true)
      recognitionRef.current.start()
    }
  }

  const stopVoiceSearch = () => {
    if (recognitionRef.current && isVoiceRecording) {
      recognitionRef.current.stop()
      setIsVoiceRecording(false)
    }
  }

  // Sauvegarder une recherche
  const saveCurrentSearch = () => {
    if (activeFiltersCount === 0) return

    const newSavedSearches = [...savedSearches, { ...filters, query: filters.query || "Recherche sans nom" }]
    setSavedSearches(newSavedSearches)
    localStorage.setItem("proxya-saved-searches", JSON.stringify(newSavedSearches))
  }

  // Charger une recherche sauvegardée
  const loadSavedSearch = (savedFilter: SearchFilters) => {
    setFilters(savedFilter)
  }

  // Reset complet
  const resetFilters = () => {
    const defaultFilters = {
      query: "",
      categories: [],
      priceRange: [0, 100000] as [number, number],
      minRating: 0,
      location: {
        ville: "",
        quartier: "",
        maxDistance: 50,
        useCurrentLocation: false,
      },
      availability: {
        isUrgentAvailable: false,
        isGroupService: false,
        location: [],
      },
      sortBy: "relevance" as const,
      hasPromo: false,
    }

    setFilters(defaultFilters)
    setHasSearched(false)
    setShowFilters(false)

    // Appeler la fonction de reset du parent pour remettre les services d'origine
    if (onReset) {
      onReset()
    }
  }

  const handleQueryChange = (value: string) => {
    setFilters((prev) => ({ ...prev, query: value }))
  }

  const handleCategoryToggle = (category: string) => {
    setFilters((prev) => ({
      ...prev,
      categories: prev.categories.includes(category)
        ? prev.categories.filter((c) => c !== category)
        : [...prev.categories, category],
    }))
  }

  const getQuartiersForVille = (ville: string) => {
    switch (ville) {
      case "Yaoundé":
        return QUARTIERS_YAOUNDE
      case "Douala":
        return QUARTIERS_DOUALA
      default:
        return []
    }
  }

  return (
    <TooltipProvider>
      <div className="space-y-4">
        {/* Barre de recherche principale améliorée */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
            <Input
              placeholder="Rechercher un service, prestataire, ou mot-clé..."
              value={filters.query}
              onChange={(e) => handleQueryChange(e.target.value)}
              className="pl-10 pr-20 bg-white dark:bg-slate-800 border-stone-200 dark:border-slate-700 transition-all duration-200 focus:ring-2 focus:ring-indigo-500"
            />

            {/* Boutons dans l'input */}
            <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex gap-1">
              {/* Recherche vocale */}
              {recognitionRef.current && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className={`h-6 w-6 ${isVoiceRecording ? "text-red-500 animate-pulse" : "text-slate-400 hover:text-slate-600"}`}
                      onClick={isVoiceRecording ? stopVoiceSearch : startVoiceSearch}
                    >
                      {isVoiceRecording ? <MicOff size={14} /> : <Mic size={14} />}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>{isVoiceRecording ? "Arrêter l'enregistrement" : "Recherche vocale"}</TooltipContent>
                </Tooltip>
              )}

              {/* Géolocalisation */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className={`h-6 w-6 ${filters.location.useCurrentLocation ? "text-indigo-600" : "text-slate-400 hover:text-slate-600"}`}
                    onClick={getCurrentLocation}
                  >
                    <Navigation size={14} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Utiliser ma position</TooltipContent>
              </Tooltip>
            </div>
          </div>

          {/* Bouton filtres avec animation */}
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className={`border-stone-200 dark:border-slate-700 relative transition-all duration-200 ${
              showFilters ? "bg-indigo-50 dark:bg-indigo-900/20 border-indigo-300" : ""
            }`}
          >
            <Filter size={16} className={`mr-2 transition-transform duration-200 ${showFilters ? "rotate-180" : ""}`} />
            Filtres
            {activeFiltersCount > 0 && (
              <Badge className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 bg-indigo-600 text-white text-xs animate-pulse">
                {activeFiltersCount}
              </Badge>
            )}
          </Button>

          {/* Boutons d'action */}
          {activeFiltersCount > 0 && (
            <>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={saveCurrentSearch}
                    className="border-stone-200 dark:border-slate-700 bg-transparent"
                  >
                    <Bookmark size={16} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Sauvegarder cette recherche</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={resetFilters}
                    className="border-stone-200 dark:border-slate-700 text-slate-500 hover:text-red-500 bg-transparent"
                  >
                    <RotateCcw size={16} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Réinitialiser tous les filtres</TooltipContent>
              </Tooltip>
            </>
          )}
        </div>

        {/* Recherches sauvegardées */}
        {savedSearches.length > 0 && (
          <div className="flex gap-2 overflow-x-auto pb-2">
            <span className="text-xs text-slate-500 whitespace-nowrap flex items-center">
              <BookmarkCheck size={12} className="mr-1" />
              Recherches sauvées:
            </span>
            {savedSearches.slice(-3).map((saved, index) => (
              <Button
                key={index}
                variant="outline"
                size="sm"
                onClick={() => loadSavedSearch(saved)}
                className="whitespace-nowrap text-xs h-6 px-2 border-stone-200 dark:border-slate-700"
              >
                {saved.query || `Recherche ${index + 1}`}
              </Button>
            ))}
          </div>
        )}

        {/* Résultats et tri avec animations */}
        <div className="flex items-center justify-between">
          <div className="text-sm text-slate-600 dark:text-slate-400">
            {isLoading ? (
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-600"></div>
                Recherche en cours...
              </div>
            ) : hasSearched ? (
              <span className="flex items-center gap-2">
                <Target size={14} className="text-indigo-600" />
                {resultCount} service{resultCount !== 1 ? "s" : ""} trouvé{resultCount !== 1 ? "s" : ""}
                {filters.location.useCurrentLocation && currentLocation && (
                  <Badge variant="outline" className="text-xs">
                    <Navigation size={10} className="mr-1" />
                    Près de vous
                  </Badge>
                )}
              </span>
            ) : (
              <span className="text-slate-400">Configurez vos critères de recherche</span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Filtre promo */}
            <div className="flex items-center space-x-2">
              <Checkbox
                id="hasPromo"
                checked={filters.hasPromo}
                onCheckedChange={(checked) => setFilters((prev) => ({ ...prev, hasPromo: !!checked }))}
              />
              <label
                htmlFor="hasPromo"
                className="text-sm text-slate-700 dark:text-slate-300 cursor-pointer flex items-center gap-1"
              >
                <Sparkles size={12} className="text-yellow-500" />
                Avec promo
              </label>
            </div>

            <Select
              value={filters.sortBy}
              onValueChange={(value: any) => setFilters((prev) => ({ ...prev, sortBy: value }))}
            >
              <SelectTrigger className="w-48 bg-white dark:bg-slate-800 border-stone-200 dark:border-slate-700">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="relevance">Plus pertinent</SelectItem>
                <SelectItem value="price-asc">Prix croissant</SelectItem>
                <SelectItem value="price-desc">Prix décroissant</SelectItem>
                <SelectItem value="rating">Mieux notés</SelectItem>
                <SelectItem value="distance">Plus proches</SelectItem>
                <SelectItem value="newest">Plus récents</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Messages d'erreur */}
        {locationError && (
          <div className="text-sm text-red-500 bg-red-50 dark:bg-red-900/20 p-2 rounded-lg">{locationError}</div>
        )}

        {/* Filtres avancés avec animations améliorées */}
        <Collapsible open={showFilters} onOpenChange={setShowFilters}>
          <CollapsibleContent className="transition-all duration-300 ease-in-out">
            <Card className="bg-white dark:bg-slate-800 border-stone-200 dark:border-slate-700 shadow-lg">
              <CardContent className="p-6 space-y-6">
                {/* Header avec bouton clear */}
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                    <Sliders size={16} />
                    Filtres avancés
                    {activeFiltersCount > 0 && (
                      <Badge className="bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200">
                        {activeFiltersCount} actif{activeFiltersCount > 1 ? "s" : ""}
                      </Badge>
                    )}
                  </h3>
                  {activeFiltersCount > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={resetFilters}
                      className="text-slate-500 hover:text-red-500"
                    >
                      <X size={14} className="mr-1" />
                      Tout effacer
                    </Button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {/* Catégories avec recherche */}
                  <div className="space-y-3">
                    <h4 className="font-medium text-slate-900 dark:text-white">Catégories</h4>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {CATEGORIES.map((category) => (
                        <div
                          key={category}
                          className="flex items-center space-x-2 hover:bg-slate-50 dark:hover:bg-slate-700 p-1 rounded transition-colors"
                        >
                          <Checkbox
                            id={category}
                            checked={filters.categories.includes(category)}
                            onCheckedChange={() => handleCategoryToggle(category)}
                          />
                          <label
                            htmlFor={category}
                            className="text-sm text-slate-700 dark:text-slate-300 cursor-pointer flex-1"
                          >
                            {category}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Prix avec indicateurs visuels */}
                  <div className="space-y-3">
                    <h4 className="font-medium text-slate-900 dark:text-white flex items-center gap-2">
                      <DollarSign size={16} />
                      Fourchette de prix
                    </h4>
                    <div className="space-y-4">
                      <Slider
                        value={filters.priceRange}
                        onValueChange={(value) =>
                          setFilters((prev) => ({ ...prev, priceRange: value as [number, number] }))
                        }
                        max={100000}
                        min={0}
                        step={1000}
                        className="w-full"
                      />
                      <div className="flex items-center justify-between text-sm text-slate-600 dark:text-slate-400">
                        <span className="bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded">
                          {filters.priceRange[0].toLocaleString()} FCFA
                        </span>
                        <span className="bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded">
                          {filters.priceRange[1].toLocaleString()} FCFA
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Note minimale avec étoiles */}
                  <div className="space-y-3">
                    <h4 className="font-medium text-slate-900 dark:text-white flex items-center gap-2">
                      <Star size={16} />
                      Note minimale
                    </h4>
                    <div className="space-y-2">
                      {[0, 3, 4, 4.5, 5].map((rating) => (
                        <div
                          key={rating}
                          className="flex items-center space-x-2 hover:bg-slate-50 dark:hover:bg-slate-700 p-1 rounded transition-colors"
                        >
                          <Checkbox
                            id={`rating-${rating}`}
                            checked={filters.minRating === rating}
                            onCheckedChange={() => setFilters((prev) => ({ ...prev, minRating: rating }))}
                          />
                          <label
                            htmlFor={`rating-${rating}`}
                            className="text-sm text-slate-700 dark:text-slate-300 cursor-pointer flex items-center gap-1 flex-1"
                          >
                            {rating === 0 ? (
                              "Toutes les notes"
                            ) : (
                              <>
                                <div className="flex">
                                  {[...Array(5)].map((_, i) => (
                                    <Star
                                      key={i}
                                      size={12}
                                      className={i < rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}
                                    />
                                  ))}
                                </div>
                                et plus
                              </>
                            )}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Localisation améliorée */}
                  <div className="space-y-3">
                    <h4 className="font-medium text-slate-900 dark:text-white flex items-center gap-2">
                      <MapPin size={16} />
                      Localisation
                    </h4>
                    <div className="space-y-3">
                      {/* Option géolocalisation */}
                      <div className="flex items-center space-x-2 p-2 border border-dashed border-slate-300 dark:border-slate-600 rounded-lg">
                        <Checkbox
                          id="useCurrentLocation"
                          checked={filters.location.useCurrentLocation}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              getCurrentLocation()
                            } else {
                              setFilters((prev) => ({
                                ...prev,
                                location: { ...prev.location, useCurrentLocation: false, coordinates: undefined },
                              }))
                            }
                          }}
                        />
                        <label
                          htmlFor="useCurrentLocation"
                          className="text-sm text-slate-700 dark:text-slate-300 cursor-pointer flex items-center gap-1"
                        >
                          <Navigation size={12} className="text-indigo-600" />
                          Utiliser ma position actuelle
                        </label>
                      </div>

                      {!filters.location.useCurrentLocation && (
                        <>
                          <Select
                            value={filters.location.ville}
                            onValueChange={(value) =>
                              setFilters((prev) => ({
                                ...prev,
                                location: { ...prev.location, ville: value, quartier: "" },
                              }))
                            }
                          >
                            <SelectTrigger className="bg-white dark:bg-slate-800 border-stone-200 dark:border-slate-700">
                              <SelectValue placeholder="Choisir une ville" />
                            </SelectTrigger>
                            <SelectContent>
                              {VILLES_CAMEROUN.map((ville) => (
                                <SelectItem key={ville} value={ville}>
                                  {ville}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>

                          {filters.location.ville && (
                            <Select
                              value={filters.location.quartier}
                              onValueChange={(value) =>
                                setFilters((prev) => ({
                                  ...prev,
                                  location: { ...prev.location, quartier: value },
                                }))
                              }
                            >
                              <SelectTrigger className="bg-white dark:bg-slate-800 border-stone-200 dark:border-slate-700">
                                <SelectValue placeholder="Choisir un quartier" />
                              </SelectTrigger>
                              <SelectContent>
                                {getQuartiersForVille(filters.location.ville).map((quartier) => (
                                  <SelectItem key={quartier} value={quartier}>
                                    {quartier}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          )}
                        </>
                      )}

                      <div className="space-y-2">
                        <label className="text-sm text-slate-700 dark:text-slate-300 flex items-center justify-between">
                          <span>Distance maximale</span>
                          <span className="bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200 px-2 py-1 rounded text-xs">
                            {filters.location.maxDistance} km
                          </span>
                        </label>
                        <Slider
                          value={[filters.location.maxDistance || 50]}
                          onValueChange={([value]) =>
                            setFilters((prev) => ({
                              ...prev,
                              location: { ...prev.location, maxDistance: value },
                            }))
                          }
                          max={100}
                          min={1}
                          step={1}
                          className="w-full"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Disponibilité */}
                  <div className="space-y-3">
                    <h4 className="font-medium text-slate-900 dark:text-white flex items-center gap-2">
                      <Clock size={16} />
                      Disponibilité
                    </h4>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2 hover:bg-slate-50 dark:hover:bg-slate-700 p-1 rounded transition-colors">
                        <Checkbox
                          id="urgent"
                          checked={filters.availability.isUrgentAvailable}
                          onCheckedChange={(checked) =>
                            setFilters((prev) => ({
                              ...prev,
                              availability: { ...prev.availability, isUrgentAvailable: !!checked },
                            }))
                          }
                        />
                        <label
                          htmlFor="urgent"
                          className="text-sm text-slate-700 dark:text-slate-300 cursor-pointer flex items-center gap-1 flex-1"
                        >
                          <Zap size={12} className="text-yellow-500" />
                          Service urgent disponible
                        </label>
                      </div>
                      <div className="flex items-center space-x-2 hover:bg-slate-50 dark:hover:bg-slate-700 p-1 rounded transition-colors">
                        <Checkbox
                          id="group"
                          checked={filters.availability.isGroupService}
                          onCheckedChange={(checked) =>
                            setFilters((prev) => ({
                              ...prev,
                              availability: { ...prev.availability, isGroupService: !!checked },
                            }))
                          }
                        />
                        <label
                          htmlFor="group"
                          className="text-sm text-slate-700 dark:text-slate-300 cursor-pointer flex items-center gap-1 flex-1"
                        >
                          <Users size={12} className="text-blue-500" />
                          Service de groupe
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* Lieu de prestation */}
                  <div className="space-y-3">
                    <h4 className="font-medium text-slate-900 dark:text-white">Lieu de prestation</h4>
                    <div className="space-y-2">
                      {[
                        { value: "domicile", label: "À domicile", icon: Home },
                        { value: "salon", label: "En salon", icon: Building },
                        { value: "les-deux", label: "Les deux", icon: MapPin },
                      ].map(({ value, label, icon: Icon }) => (
                        <div
                          key={value}
                          className="flex items-center space-x-2 hover:bg-slate-50 dark:hover:bg-slate-700 p-1 rounded transition-colors"
                        >
                          <Checkbox
                            id={value}
                            checked={filters.availability.location.includes(value as "domicile" | "salon" | "les-deux")}
                            onCheckedChange={() => {
                              const locationValue = value as "domicile" | "salon" | "les-deux"
                              setFilters((prev) => ({
                                ...prev,
                                availability: {
                                  ...prev.availability,
                                  location: prev.availability.location.includes(locationValue)
                                    ? prev.availability.location.filter((l) => l !== locationValue)
                                    : [...prev.availability.location, locationValue],
                                },
                              }))
                            }}
                          />
                          <label
                            htmlFor={value}
                            className="text-sm text-slate-700 dark:text-slate-300 cursor-pointer flex items-center gap-1 flex-1"
                          >
                            <Icon size={12} />
                            {label}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Bouton de recherche en bas */}
                <div className="flex justify-center pt-4 border-t border-stone-200 dark:border-slate-700">
                  <Button
                    onClick={() => {
                      if (debounceRef.current) clearTimeout(debounceRef.current)
                      onFiltersChange(filters)
                      setHasSearched(true)
                    }}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 transition-all duration-200 hover:scale-105"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    ) : (
                      <Search size={16} className="mr-2" />
                    )}
                    Rechercher maintenant
                  </Button>
                </div>
              </CardContent>
            </Card>
          </CollapsibleContent>
        </Collapsible>

        {/* Filtres actifs (badges) avec animations */}
        {activeFiltersCount > 0 && (
          <div className="flex flex-wrap gap-2 animate-in slide-in-from-top-2">
            {filters.query && (
              <Badge
                variant="secondary"
                className="flex items-center gap-1 transition-all duration-200 hover:scale-105"
              >
                <Search size={12} />"{filters.query}"
                <X size={12} className="cursor-pointer hover:text-red-500" onClick={() => handleQueryChange("")} />
              </Badge>
            )}
            {filters.categories.map((category) => (
              <Badge
                key={category}
                variant="secondary"
                className="flex items-center gap-1 transition-all duration-200 hover:scale-105"
              >
                {category}
                <X
                  size={12}
                  className="cursor-pointer hover:text-red-500"
                  onClick={() => handleCategoryToggle(category)}
                />
              </Badge>
            ))}
            {(filters.priceRange[0] > 0 || filters.priceRange[1] < 100000) && (
              <Badge
                variant="secondary"
                className="flex items-center gap-1 transition-all duration-200 hover:scale-105"
              >
                <DollarSign size={12} />
                {filters.priceRange[0].toLocaleString()} - {filters.priceRange[1].toLocaleString()} FCFA
                <X
                  size={12}
                  className="cursor-pointer hover:text-red-500"
                  onClick={() => setFilters((prev) => ({ ...prev, priceRange: [0, 100000] }))}
                />
              </Badge>
            )}
            {filters.minRating > 0 && (
              <Badge
                variant="secondary"
                className="flex items-center gap-1 transition-all duration-200 hover:scale-105"
              >
                <Star size={12} className="fill-yellow-400 text-yellow-400" />
                {filters.minRating}+ étoiles
                <X
                  size={12}
                  className="cursor-pointer hover:text-red-500"
                  onClick={() => setFilters((prev) => ({ ...prev, minRating: 0 }))}
                />
              </Badge>
            )}
            {(filters.location.ville || filters.location.useCurrentLocation) && (
              <Badge
                variant="secondary"
                className="flex items-center gap-1 transition-all duration-200 hover:scale-105"
              >
                <MapPin size={12} />
                {filters.location.useCurrentLocation ? "Ma position" : filters.location.ville}
                {filters.location.quartier && ` - ${filters.location.quartier}`}
                <X
                  size={12}
                  className="cursor-pointer hover:text-red-500"
                  onClick={() =>
                    setFilters((prev) => ({
                      ...prev,
                      location: { ...prev.location, ville: "", quartier: "", useCurrentLocation: false },
                    }))
                  }
                />
              </Badge>
            )}
            {filters.hasPromo && (
              <Badge
                variant="secondary"
                className="flex items-center gap-1 transition-all duration-200 hover:scale-105"
              >
                <Sparkles size={12} className="text-yellow-500" />
                Avec promotion
                <X
                  size={12}
                  className="cursor-pointer hover:text-red-500"
                  onClick={() => setFilters((prev) => ({ ...prev, hasPromo: false }))}
                />
              </Badge>
            )}
          </div>
        )}
      </div>
    </TooltipProvider>
  )
}

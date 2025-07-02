"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { Search, Filter, MapPin, Star, Clock, DollarSign, X, Sliders, Zap, Home, Building, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Slider } from "@/components/ui/slider"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Collapsible, CollapsibleContent } from "@/components/ui/collapsible"

export interface SearchFilters {
  query: string
  categories: string[]
  priceRange: [number, number]
  minRating: number
  location: {
    ville: string
    quartier: string
    maxDistance?: number
  }
  availability: {
    isUrgentAvailable: boolean
    isGroupService: boolean
    location: ("domicile" | "salon" | "les-deux")[]
  }
  sortBy: "relevance" | "price-asc" | "price-desc" | "rating" | "distance" | "newest"
}

interface AdvancedSearchProps {
  onFiltersChange: (filters: SearchFilters) => void | Promise<void>
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
    },
    availability: {
      isUrgentAvailable: false,
      isGroupService: false,
      location: [],
    },
    sortBy: "relevance",
    ...initialFilters,
  })

  const [showFilters, setShowFilters] = useState(false)
  const [activeFiltersCount, setActiveFiltersCount] = useState(0)
  const [hasSearched, setHasSearched] = useState(false)

  // Refs pour éviter les boucles
  const debounceRef = useRef<NodeJS.Timeout>()
  const isInitialMount = useRef(true)

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
      }, 500) // 500ms de délai
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
    if (filters.location.ville) count++
    if (filters.availability.isUrgentAvailable || filters.availability.isGroupService) count++
    if (filters.availability.location.length > 0) count++

    setActiveFiltersCount(count)
  }, [filters])

  // Déclencher la recherche seulement si ce n'est pas le premier rendu ET qu'il y a des filtres actifs
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false
      return
    }

    // Seulement rechercher si il y a des filtres actifs ou si on a déjà fait une recherche
    if (activeFiltersCount > 0 || hasSearched) {
      debouncedSearch(filters)
    }

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }
    }
  }, [filters, debouncedSearch, activeFiltersCount, hasSearched])

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

  const handlePriceRangeChange = (value: [number, number]) => {
    setFilters((prev) => ({ ...prev, priceRange: value }))
  }

  const handleLocationChange = (field: keyof typeof filters.location, value: string | number) => {
    setFilters((prev) => ({
      ...prev,
      location: { ...prev.location, [field]: value },
    }))
  }

  const handleAvailabilityToggle = (field: keyof typeof filters.availability, value: boolean | string) => {
    if (field === "location" && typeof value === "string") {
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
    } else {
      setFilters((prev) => ({
        ...prev,
        availability: { ...prev.availability, [field]: value },
      }))
    }
  }

  const clearFilters = () => {
    setFilters({
      query: "",
      categories: [],
      priceRange: [0, 100000],
      minRating: 0,
      location: {
        ville: "",
        quartier: "",
        maxDistance: 50,
      },
      availability: {
        isUrgentAvailable: false,
        isGroupService: false,
        location: [],
      },
      sortBy: "relevance",
    })
    setHasSearched(false)
  }

  const handleSearchNow = () => {
    // Recherche immédiate sans debounce
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }
    console.log("🚀 Recherche immédiate déclenchée")
    const result = onFiltersChange(filters)
    if (result instanceof Promise) {
      result.catch(console.error)
    }
    setHasSearched(true)
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
    <div className="space-y-4">
      {/* Barre de recherche principale */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
          <Input
            placeholder="Rechercher un service, prestataire, ou mot-clé..."
            value={filters.query}
            onChange={(e) => handleQueryChange(e.target.value)}
            className="pl-10 bg-white dark:bg-slate-800 border-stone-200 dark:border-slate-700"
          />
        </div>
        <Button
          variant="outline"
          onClick={() => setShowFilters(!showFilters)}
          className="border-stone-200 dark:border-slate-700 relative"
        >
          <Filter size={16} className="mr-2" />
          Filtres
          {activeFiltersCount > 0 && (
            <Badge className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 bg-indigo-600 text-white text-xs">
              {activeFiltersCount}
            </Badge>
          )}
        </Button>
        {activeFiltersCount > 0 && (
          <Button
            onClick={handleSearchNow}
            className="bg-indigo-600 hover:bg-indigo-700 text-white"
            disabled={isLoading}
          >
            {isLoading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            ) : (
              <Search size={16} className="mr-2" />
            )}
            Rechercher
          </Button>
        )}
      </div>

      {/* Résultats et tri */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-slate-600 dark:text-slate-400">
          {isLoading ? (
            <div className="flex items-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-600"></div>
              Recherche en cours...
            </div>
          ) : hasSearched ? (
            <span>
              {resultCount} service{resultCount !== 1 ? "s" : ""} trouvé{resultCount !== 1 ? "s" : ""}
            </span>
          ) : (
            <span className="text-slate-400">Configurez vos critères et cliquez sur "Rechercher"</span>
          )}
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

      {/* Filtres avancés */}
      <Collapsible open={showFilters} onOpenChange={setShowFilters}>
        <CollapsibleContent>
          <Card className="bg-white dark:bg-slate-800 border-stone-200 dark:border-slate-700">
            <CardContent className="p-6 space-y-6">
              {/* Header avec bouton clear */}
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                  <Sliders size={16} />
                  Filtres avancés
                </h3>
                {activeFiltersCount > 0 && (
                  <Button variant="ghost" size="sm" onClick={clearFilters} className="text-slate-500">
                    <X size={14} className="mr-1" />
                    Effacer tout
                  </Button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Catégories */}
                <div className="space-y-3">
                  <h4 className="font-medium text-slate-900 dark:text-white">Catégories</h4>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {CATEGORIES.map((category) => (
                      <div key={category} className="flex items-center space-x-2">
                        <Checkbox
                          id={category}
                          checked={filters.categories.includes(category)}
                          onCheckedChange={() => handleCategoryToggle(category)}
                        />
                        <label htmlFor={category} className="text-sm text-slate-700 dark:text-slate-300 cursor-pointer">
                          {category}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Prix */}
                <div className="space-y-3">
                  <h4 className="font-medium text-slate-900 dark:text-white flex items-center gap-2">
                    <DollarSign size={16} />
                    Fourchette de prix
                  </h4>
                  <div className="space-y-4">
                    <Slider
                      value={filters.priceRange}
                      onValueChange={handlePriceRangeChange}
                      max={100000}
                      min={0}
                      step={1000}
                      className="w-full"
                    />
                    <div className="flex items-center justify-between text-sm text-slate-600 dark:text-slate-400">
                      <span>{filters.priceRange[0].toLocaleString()} FCFA</span>
                      <span>{filters.priceRange[1].toLocaleString()} FCFA</span>
                    </div>
                  </div>
                </div>

                {/* Note minimale */}
                <div className="space-y-3">
                  <h4 className="font-medium text-slate-900 dark:text-white flex items-center gap-2">
                    <Star size={16} />
                    Note minimale
                  </h4>
                  <div className="space-y-2">
                    {[0, 3, 4, 4.5, 5].map((rating) => (
                      <div key={rating} className="flex items-center space-x-2">
                        <Checkbox
                          id={`rating-${rating}`}
                          checked={filters.minRating === rating}
                          onCheckedChange={() => setFilters((prev) => ({ ...prev, minRating: rating }))}
                        />
                        <label
                          htmlFor={`rating-${rating}`}
                          className="text-sm text-slate-700 dark:text-slate-300 cursor-pointer flex items-center gap-1"
                        >
                          {rating === 0 ? (
                            "Toutes les notes"
                          ) : (
                            <>
                              {rating}
                              <Star size={12} className="fill-yellow-400 text-yellow-400" />
                              et plus
                            </>
                          )}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Localisation */}
                <div className="space-y-3">
                  <h4 className="font-medium text-slate-900 dark:text-white flex items-center gap-2">
                    <MapPin size={16} />
                    Localisation
                  </h4>
                  <div className="space-y-3">
                    <Select
                      value={filters.location.ville}
                      onValueChange={(value) => handleLocationChange("ville", value)}
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
                        onValueChange={(value) => handleLocationChange("quartier", value)}
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

                    <div className="space-y-2">
                      <label className="text-sm text-slate-700 dark:text-slate-300">
                        Distance maximale: {filters.location.maxDistance} km
                      </label>
                      <Slider
                        value={[filters.location.maxDistance || 50]}
                        onValueChange={([value]) => handleLocationChange("maxDistance", value)}
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
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="urgent"
                        checked={filters.availability.isUrgentAvailable}
                        onCheckedChange={(checked) => handleAvailabilityToggle("isUrgentAvailable", !!checked)}
                      />
                      <label
                        htmlFor="urgent"
                        className="text-sm text-slate-700 dark:text-slate-300 cursor-pointer flex items-center gap-1"
                      >
                        <Zap size={12} className="text-yellow-500" />
                        Service urgent disponible
                      </label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="group"
                        checked={filters.availability.isGroupService}
                        onCheckedChange={(checked) => handleAvailabilityToggle("isGroupService", !!checked)}
                      />
                      <label
                        htmlFor="group"
                        className="text-sm text-slate-700 dark:text-slate-300 cursor-pointer flex items-center gap-1"
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
                      <div key={value} className="flex items-center space-x-2">
                        <Checkbox
                          id={value}
                          checked={filters.availability.location.includes(value as "domicile" | "salon" | "les-deux")}
                          onCheckedChange={() => handleAvailabilityToggle("location", value)}
                        />
                        <label
                          htmlFor={value}
                          className="text-sm text-slate-700 dark:text-slate-300 cursor-pointer flex items-center gap-1"
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
                  onClick={handleSearchNow}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-8"
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

      {/* Filtres actifs (badges) */}
      {activeFiltersCount > 0 && (
        <div className="flex flex-wrap gap-2">
          {filters.query && (
            <Badge variant="secondary" className="flex items-center gap-1">
              <Search size={12} />"{filters.query}"
              <X size={12} className="cursor-pointer hover:text-red-500" onClick={() => handleQueryChange("")} />
            </Badge>
          )}

          {filters.categories.map((category) => (
            <Badge key={category} variant="secondary" className="flex items-center gap-1">
              {category}
              <X
                size={12}
                className="cursor-pointer hover:text-red-500"
                onClick={() => handleCategoryToggle(category)}
              />
            </Badge>
          ))}

          {(filters.priceRange[0] > 0 || filters.priceRange[1] < 100000) && (
            <Badge variant="secondary" className="flex items-center gap-1">
              <DollarSign size={12} />
              {filters.priceRange[0].toLocaleString()} - {filters.priceRange[1].toLocaleString()} FCFA
              <X
                size={12}
                className="cursor-pointer hover:text-red-500"
                onClick={() => handlePriceRangeChange([0, 100000])}
              />
            </Badge>
          )}

          {filters.minRating > 0 && (
            <Badge variant="secondary" className="flex items-center gap-1">
              <Star size={12} className="fill-yellow-400 text-yellow-400" />
              {filters.minRating}+ étoiles
              <X
                size={12}
                className="cursor-pointer hover:text-red-500"
                onClick={() => setFilters((prev) => ({ ...prev, minRating: 0 }))}
              />
            </Badge>
          )}

          {filters.location.ville && (
            <Badge variant="secondary" className="flex items-center gap-1">
              <MapPin size={12} />
              {filters.location.ville}
              {filters.location.quartier && ` - ${filters.location.quartier}`}
              <X
                size={12}
                className="cursor-pointer hover:text-red-500"
                onClick={() => handleLocationChange("ville", "")}
              />
            </Badge>
          )}
        </div>
      )}
    </div>
  )
}

"use client"

import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { ArrowRight, Star, Shield } from "lucide-react"
import ThemeToggle from "../components/ThemeToggle"

const Welcome = () => {
  const navigate = useNavigate()
  const [currentSlide, setCurrentSlide] = useState(0)

  const features = [
    {
      image: "/images/i1.jpg",
      title: "Trouvez votre expert",
      subtitle: "Des professionnels vérifiés près de chez vous",
      category: "Services",
    },
    {
      image: "/images/i1.jpg",
      title: "Beauté & Bien-être",
      subtitle: "Coiffure, esthétique, massage à domicile",
      category: "Beauté",
    },
    {
      image: "/images/i2.jpg",
      title: "Alimentation",
      subtitle: "Chefs et traiteurs d'exception",
      category: "Cuisine",
    },
    {
      image: "/images/i3.jpg",
      title: "Maintenance",
      subtitle: "Réparation et entretien professionnel",
      category: "Technique",
    },
    {
      image: "/images/i4.jpg",
      title: "Événementiel",
      subtitle: "Organisation d'événements sur mesure",
      category: "Événements",
    },
    {
      image: "/images/i5.jpg",
      title: "Éducation",
      subtitle: "Cours particuliers et formation",
      category: "Formation",
    },
  ]

  const reviews = [
    {
      name: "Marie L.",
      rating: 5,
      text: "Service impeccable, je recommande !",
      service: "Coiffure",
    },
    {
      name: "Thomas K.",
      rating: 5,
      text: "Professionnel et ponctuel, parfait.",
      service: "Plomberie",
    },
    {
      name: "Sophie M.",
      rating: 4,
      text: "Très satisfaite de ma séance massage.",
      service: "Bien-être",
    },
  ]

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % features.length)
    }, 4000)

    return () => clearInterval(timer)
  }, [features.length])

  const handleStart = () => {
    navigate("/user-type")
  }

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-slate-900 transition-colors duration-300">
      <ThemeToggle />

      {/* Header simplifié */}
      <div className="pt-12 pb-8 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm rounded-full mb-6 border border-stone-200/50 dark:border-slate-700/50">
          <Shield size={16} className="text-indigo-600 dark:text-indigo-400" />
          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Plateforme sécurisée</span>
        </div>

        <h1 className="text-6xl font-bold text-slate-900 dark:text-white mb-4 tracking-tight">PROXYA</h1>
        <p className="text-xl text-slate-600 dark:text-slate-400 max-w-sm mx-auto leading-relaxed">
          Le lien entre talent et opportunité
        </p>
      </div>

      {/* Carousel épuré */}
      <div className="px-4 mb-8">
        <div className="max-w-sm mx-auto">
          <div className="relative overflow-hidden rounded-2xl shadow-lg">
            <div
              className="flex transition-all duration-500 ease-out"
              style={{ transform: `translateX(-${currentSlide * 100}%)` }}
            >
              {features.map((feature, index) => (
                <div key={index} className="w-full flex-shrink-0 relative">
                  <div className="relative h-72">
                    <img
                      src={feature.image || "/placeholder.svg"}
                      alt={feature.title}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement
                        target.src = `/placeholder.svg?height=288&width=400&text=${encodeURIComponent(feature.category)}`
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"></div>
                  </div>

                  <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                    <div className="inline-block px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-xs font-medium mb-3">
                      {feature.category}
                    </div>
                    <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
                    <p className="text-white/90 text-sm">{feature.subtitle}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Indicateurs minimalistes */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
              {features.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentSlide(index)}
                  className={`w-2 h-2 rounded-full transition-all ${
                    index === currentSlide ? "bg-white w-6" : "bg-white/60"
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Avis clients */}
      <div className="px-4 mb-8">
        <div className="max-w-sm mx-auto">
          <h3 className="text-center text-sm font-semibold text-slate-900 dark:text-white mb-6 tracking-wide uppercase">
            Ils nous font confiance
          </h3>

          <div className="space-y-4">
            {reviews.map((review, index) => (
              <div
                key={index}
                className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm rounded-xl p-4 border border-stone-200/50 dark:border-slate-700/50"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-indigo-100 dark:bg-indigo-900/50 rounded-full flex items-center justify-center">
                      <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
                        {review.name.charAt(0)}
                      </span>
                    </div>
                    <span className="font-medium text-slate-900 dark:text-white text-sm">{review.name}</span>
                  </div>
                  <div className="flex gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        size={12}
                        className={
                          i < review.rating ? "fill-amber-400 text-amber-400" : "text-slate-300 dark:text-slate-600"
                        }
                      />
                    ))}
                  </div>
                </div>
                <p className="text-slate-600 dark:text-slate-400 text-sm mb-2">"{review.text}"</p>
                <span className="text-xs text-slate-500 dark:text-slate-500">{review.service}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Stats épurées */}
      <div className="px-4 mb-8">
        <div className="max-w-sm mx-auto bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm rounded-2xl p-6 border border-stone-200/50 dark:border-slate-700/50">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-slate-900 dark:text-white mb-1">500+</div>
              <div className="text-xs text-slate-600 dark:text-slate-400">Experts</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-slate-900 dark:text-white mb-1">4.9★</div>
              <div className="text-xs text-slate-600 dark:text-slate-400">Satisfaction</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-slate-900 dark:text-white mb-1">24h</div>
              <div className="text-xs text-slate-600 dark:text-slate-400">Réponse</div>
            </div>
          </div>
        </div>
      </div>

      {/* CTA simple */}
      <div className="px-4 pb-12">
        <div className="max-w-sm mx-auto">
          <button
            onClick={handleStart}
            className="w-full bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-stone-100 dark:text-slate-900 text-white font-semibold py-4 px-6 rounded-2xl transition-all duration-200 active:scale-95 flex items-center justify-center gap-2 group"
          >
            <span>Commencer</span>
            <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
          </button>

          <p className="text-center text-xs text-slate-500 dark:text-slate-400 mt-4">
            Rejoignez une communauté de confiance
          </p>
        </div>
      </div>

      {/* Éléments décoratifs subtils */}
      <div className="fixed top-20 right-4 w-1 h-12 bg-indigo-200 dark:bg-indigo-800 rounded-full opacity-40"></div>
      <div className="fixed bottom-32 left-4 w-1 h-8 bg-stone-200 dark:bg-slate-700 rounded-full opacity-40"></div>
    </div>
  )
}

export default Welcome

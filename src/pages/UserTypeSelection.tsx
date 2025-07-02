"use client"
import { useNavigate } from "react-router-dom"
import { Users, Briefcase, ArrowLeft, Star, Shield, Zap } from "lucide-react"
import ThemeToggle from "../components/ThemeToggle"

const UserTypeSelection = () => {
  const navigate = useNavigate()

  const testimonials = [
    {
      type: "provider",
      name: "Julie C.",
      job: "Coiffeuse",
      rating: 5,
      text: "J'ai doublé ma clientèle en 3 mois",
    },
    {
      type: "client",
      name: "Marc D.",
      rating: 5,
      text: "Des pros de qualité, toujours satisfait",
    },
  ]

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-slate-900 transition-colors duration-300">
      <ThemeToggle />

      {/* Header épuré */}
      <div className="flex items-center justify-between p-6">
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
        >
          <ArrowLeft size={20} />
          <span className="font-medium">Retour</span>
        </button>

        <h1 className="text-xl font-bold text-slate-900 dark:text-white">PROXYA</h1>
        <div className="w-16"></div>
      </div>

      {/* Titre */}
      <div className="px-6 pt-4 pb-8 text-center">
        <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-3">Choisissez votre profil</h2>
        <p className="text-slate-600 dark:text-slate-400 max-w-xs mx-auto">Une expérience adaptée à vos besoins</p>
      </div>

      {/* Cards principales */}
      <div className="px-6 space-y-4 mb-8">
        {/* Prestataire */}
        <div
          onClick={() => navigate("/provider/login")}
          className="bg-white/60 dark:bg-slate-800/60 hover:bg-white/80 dark:hover:bg-slate-800/80 backdrop-blur-sm rounded-2xl p-6 cursor-pointer transition-all duration-200 active:scale-95 border border-stone-200/50 dark:border-slate-700/50"
        >
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-slate-900 dark:bg-white rounded-xl flex items-center justify-center flex-shrink-0">
              <Briefcase size={20} className="text-white dark:text-slate-900" />
            </div>

            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Prestataire</h3>
                <span className="px-2 py-1 bg-stone-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-medium rounded-full">
                  Pro
                </span>
              </div>

              <p className="text-slate-600 dark:text-slate-400 text-sm mb-4">
                Développez votre activité et trouvez de nouveaux clients
              </p>

              <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400 mb-4">
                <div className="flex items-center gap-1">
                  <Shield size={12} />
                  <span>Paiements sécurisés</span>
                </div>
                <div className="flex items-center gap-1">
                  <Zap size={12} />
                  <span>Gestion simplifiée</span>
                </div>
              </div>

              <div className="text-sm font-medium text-slate-900 dark:text-white">Rejoindre →</div>
            </div>
          </div>
        </div>

        {/* Client */}
        <div
          onClick={() => navigate("/client/login")}
          className="bg-white/60 dark:bg-slate-800/60 hover:bg-white/80 dark:hover:bg-slate-800/80 backdrop-blur-sm rounded-2xl p-6 cursor-pointer transition-all duration-200 active:scale-95 border border-stone-200/50 dark:border-slate-700/50"
        >
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-indigo-600 dark:bg-indigo-500 rounded-xl flex items-center justify-center flex-shrink-0">
              <Users size={20} className="text-white" />
            </div>

            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Client</h3>
                <span className="px-2 py-1 bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 text-xs font-medium rounded-full">
                  Gratuit
                </span>
              </div>

              <p className="text-slate-600 dark:text-slate-400 text-sm mb-4">
                Trouvez et réservez les meilleurs professionnels
              </p>

              <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400 mb-4">
                <div className="flex items-center gap-1">
                  <Shield size={12} />
                  <span>Pros vérifiés</span>
                </div>
                <div className="flex items-center gap-1">
                  <Zap size={12} />
                  <span>Réservation instant</span>
                </div>
              </div>

              <div className="text-sm font-medium text-indigo-600 dark:text-indigo-400">Explorer →</div>
            </div>
          </div>
        </div>
      </div>

      {/* Témoignages */}
      <div className="px-6 mb-8">
        <h3 className="text-center text-sm font-semibold text-slate-900 dark:text-white mb-4 tracking-wide uppercase">
          Témoignages
        </h3>

        <div className="space-y-3">
          {testimonials.map((testimonial, index) => (
            <div
              key={index}
              className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm rounded-xl p-4 border border-stone-200/50 dark:border-slate-700/50"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      testimonial.type === "provider"
                        ? "bg-stone-200 dark:bg-slate-700"
                        : "bg-indigo-100 dark:bg-indigo-900/50"
                    }`}
                  >
                    <span
                      className={`text-xs font-bold ${
                        testimonial.type === "provider"
                          ? "text-slate-700 dark:text-slate-300"
                          : "text-indigo-600 dark:text-indigo-400"
                      }`}
                    >
                      {testimonial.name.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <div className="font-medium text-slate-900 dark:text-white text-sm">{testimonial.name}</div>
                    {testimonial.job && (
                      <div className="text-xs text-slate-500 dark:text-slate-400">{testimonial.job}</div>
                    )}
                  </div>
                </div>
                <div className="flex gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      size={10}
                      className={
                        i < testimonial.rating ? "fill-amber-400 text-amber-400" : "text-slate-300 dark:text-slate-600"
                      }
                    />
                  ))}
                </div>
              </div>
              <p className="text-slate-600 dark:text-slate-400 text-sm">"{testimonial.text}"</p>
            </div>
          ))}
        </div>
      </div>

      {/* Stats finales */}
      <div className="px-6 pb-8">
        <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm rounded-2xl p-4 border border-stone-200/50 dark:border-slate-700/50">
          <div className="flex justify-center items-center gap-8 text-center">
            <div>
              <div className="text-lg font-bold text-slate-900 dark:text-white">98%</div>
              <div className="text-xs text-slate-500 dark:text-slate-400">Satisfaction</div>
            </div>
            <div className="w-px h-8 bg-stone-200 dark:bg-slate-700"></div>
            <div>
              <div className="text-lg font-bold text-slate-900 dark:text-white">15k+</div>
              <div className="text-xs text-slate-500 dark:text-slate-400">Utilisateurs</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default UserTypeSelection

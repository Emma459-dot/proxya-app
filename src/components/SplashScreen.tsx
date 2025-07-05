"use client"

import { useEffect, useState } from "react"
import { Sparkles } from "lucide-react"

interface SplashScreenProps {
  onComplete: () => void
}

export function SplashScreen({ onComplete }: SplashScreenProps) {
  const [isVisible, setIsVisible] = useState(true)
  const [animationPhase, setAnimationPhase] = useState<"enter" | "logo" | "exit">("enter")

  useEffect(() => {
    const timer1 = setTimeout(() => {
      setAnimationPhase("logo")
    }, 500)

    const timer2 = setTimeout(() => {
      setAnimationPhase("exit")
    }, 2000)

    const timer3 = setTimeout(() => {
      setIsVisible(false)
      onComplete()
    }, 2500)

    return () => {
      clearTimeout(timer1)
      clearTimeout(timer2)
      clearTimeout(timer3)
    }
  }, [onComplete])

  if (!isVisible) return null

  return (
    <div
      className={`fixed inset-0 z-[9999] flex items-center justify-center transition-all duration-500 ${
        animationPhase === "enter"
          ? "bg-indigo-600 opacity-0"
          : animationPhase === "logo"
            ? "bg-indigo-600 opacity-100"
            : "bg-indigo-600 opacity-0"
      }`}
      style={{
        background:
          animationPhase === "logo" ? "linear-gradient(135deg, #4f46e5 0%, #6366f1 50%, #8b5cf6 100%)" : "#4f46e5",
      }}
    >
      <div className="max-w-sm mx-auto px-4 text-center">
        {/* Logo et nom de l'app */}
        <div
          className={`transition-all duration-700 ${
            animationPhase === "enter"
              ? "transform scale-50 opacity-0 translate-y-8"
              : animationPhase === "logo"
                ? "transform scale-100 opacity-100 translate-y-0"
                : "transform scale-110 opacity-0 -translate-y-4"
          }`}
        >
          {/* Icône principale */}
          <div className="relative mb-6">
            <div className="w-24 h-24 mx-auto bg-white rounded-3xl shadow-2xl flex items-center justify-center">
              <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center">
                <span className="text-2xl font-black text-white">P</span>
              </div>
            </div>

            {/* Effet de brillance */}
            <div
              className={`absolute inset-0 w-24 h-24 mx-auto rounded-3xl transition-all duration-1000 ${
                animationPhase === "logo" ? "bg-white/20 animate-pulse" : "bg-transparent"
              }`}
            />

            {/* Particules flottantes */}
            {animationPhase === "logo" && (
              <>
                <Sparkles
                  className="absolute -top-2 -right-2 w-6 h-6 text-white/80 animate-bounce"
                  style={{ animationDelay: "0.2s" }}
                />
                <Sparkles
                  className="absolute -bottom-1 -left-3 w-4 h-4 text-white/60 animate-bounce"
                  style={{ animationDelay: "0.8s" }}
                />
                <Sparkles
                  className="absolute top-1/2 -right-4 w-3 h-3 text-white/70 animate-bounce"
                  style={{ animationDelay: "1.2s" }}
                />
              </>
            )}
          </div>

          {/* Nom de l'application */}
          <div className="space-y-2">
            <h1 className="text-4xl font-black text-white tracking-tight">PROXYA</h1>
            <p className="text-lg text-indigo-100 font-medium">Services au Cameroun</p>
            <div className="w-16 h-1 bg-white/30 rounded-full mx-auto mt-4" />
          </div>
        </div>

        {/* Indicateur de chargement */}
        <div
          className={`mt-12 transition-all duration-500 ${
            animationPhase === "enter"
              ? "opacity-0 translate-y-4"
              : animationPhase === "logo"
                ? "opacity-100 translate-y-0"
                : "opacity-0 -translate-y-2"
          }`}
        >
          <div className="flex justify-center space-x-2">
            <div className="w-2 h-2 bg-white/60 rounded-full animate-bounce" style={{ animationDelay: "0s" }} />
            <div className="w-2 h-2 bg-white/60 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }} />
            <div className="w-2 h-2 bg-white/60 rounded-full animate-bounce" style={{ animationDelay: "0.4s" }} />
          </div>
          <p className="text-indigo-200 text-sm mt-4 font-medium">Chargement en cours...</p>
        </div>

        {/* Version */}
        <div
          className={`absolute bottom-8 left-1/2 transform -translate-x-1/2 transition-all duration-500 ${
            animationPhase === "logo" ? "opacity-60" : "opacity-0"
          }`}
        >
          <p className="text-indigo-200 text-xs">Version 1.0.0</p>
        </div>
      </div>

      {/* Effet de vague en arrière-plan */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className={`absolute -bottom-32 left-1/2 transform -translate-x-1/2 w-96 h-96 transition-all duration-2000 ${
            animationPhase === "logo"
              ? "bg-white/5 rounded-full scale-100 opacity-100"
              : "bg-white/5 rounded-full scale-50 opacity-0"
          }`}
        />
        <div
          className={`absolute -bottom-24 left-1/2 transform -translate-x-1/2 w-80 h-80 transition-all duration-2000 ${
            animationPhase === "logo"
              ? "bg-white/10 rounded-full scale-100 opacity-100"
              : "bg-white/10 rounded-full scale-75 opacity-0"
          }`}
          style={{ animationDelay: "0.3s" }}
        />
      </div>
    </div>
  )
}

export default SplashScreen

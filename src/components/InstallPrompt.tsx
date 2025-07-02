"use client"

import { useState, useEffect } from "react"
import { X, Download, Share, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { usePWA } from "@/hooks/usePWA"

export default function InstallPrompt() {
  const { isInstallable, isInstalled, isIOS, installApp } = usePWA()
  const [showPrompt, setShowPrompt] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    // Afficher le prompt après 3 secondes si l'app est installable et pas encore installée
    if ((isInstallable || isIOS) && !isInstalled && !dismissed) {
      const timer = setTimeout(() => {
        setShowPrompt(true)
      }, 3000)

      return () => clearTimeout(timer)
    }
  }, [isInstallable, isInstalled, isIOS, dismissed])

  const handleInstall = async () => {
    if (isIOS) {
      // Pour iOS, on ne peut pas installer automatiquement
      return
    }

    const success = await installApp()
    if (success) {
      setShowPrompt(false)
    }
  }

  const handleDismiss = () => {
    setShowPrompt(false)
    setDismissed(true)
    // Se souvenir du choix pour cette session
    sessionStorage.setItem("pwa-prompt-dismissed", "true")
  }

  // Ne pas afficher si déjà installé ou si l'utilisateur a refusé
  if (isInstalled || !showPrompt || sessionStorage.getItem("pwa-prompt-dismissed")) {
    return null
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 animate-in slide-in-from-bottom-2">
      <Card className="bg-white dark:bg-slate-800 border-indigo-200 dark:border-indigo-800 shadow-lg">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center">
                <Download className="w-5 h-5 text-white" />
              </div>
            </div>

            <div className="flex-1">
              <h3 className="font-semibold text-slate-900 dark:text-white mb-1">Installer PROXYA</h3>

              {isIOS ? (
                <div className="text-sm text-slate-600 dark:text-slate-400 mb-3">
                  <p className="mb-2">Pour installer l'app sur votre iPhone :</p>
                  <div className="flex items-center gap-2 text-xs">
                    <Share className="w-4 h-4" />
                    <span>Appuyez sur</span>
                    <span className="font-medium">Partager</span>
                    <span>puis</span>
                    <Plus className="w-4 h-4" />
                    <span className="font-medium">"Sur l'écran d'accueil"</span>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
                  Installez l'app pour un accès rapide et une meilleure expérience.
                </p>
              )}

              <div className="flex gap-2">
                {!isIOS && (
                  <Button onClick={handleInstall} size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white">
                    Installer
                  </Button>
                )}
                <Button
                  onClick={handleDismiss}
                  variant="outline"
                  size="sm"
                  className="border-slate-200 dark:border-slate-700 bg-transparent"
                >
                  Plus tard
                </Button>
              </div>
            </div>

            <Button onClick={handleDismiss} variant="ghost" size="icon" className="flex-shrink-0 h-8 w-8">
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

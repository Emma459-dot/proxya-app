"use client"

import { useState, useEffect } from "react"

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[]
  readonly userChoice: Promise<{
    outcome: "accepted" | "dismissed"
    platform: string
  }>
  prompt(): Promise<void>
}

export function usePWA() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [isInstallable, setIsInstallable] = useState(false)
  const [isInstalled, setIsInstalled] = useState(false)
  const [isIOS, setIsIOS] = useState(false)
  const [isStandalone, setIsStandalone] = useState(false)

  useEffect(() => {
    // Détecter iOS
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream
    setIsIOS(iOS)

    // Détecter si l'app est déjà installée (mode standalone)
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches || (window.navigator as any).standalone === true
    setIsStandalone(standalone)
    setIsInstalled(standalone)

    // Écouter l'événement beforeinstallprompt (Android/Chrome)
    const handleBeforeInstallPrompt = (e: Event) => {
      console.log("beforeinstallprompt event fired")
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      setIsInstallable(true)
    }

    // Écouter l'installation
    const handleAppInstalled = () => {
      console.log("App installed")
      setIsInstalled(true)
      setIsInstallable(false)
      setDeferredPrompt(null)
    }

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt)
    window.addEventListener("appinstalled", handleAppInstalled)

    // Pour iOS, vérifier si on peut proposer l'installation
    if (iOS && !standalone) {
      setIsInstallable(true)
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt)
      window.removeEventListener("appinstalled", handleAppInstalled)
    }
  }, [])

  const installApp = async () => {
    if (!deferredPrompt) return false

    try {
      await deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice
      console.log("Install prompt outcome:", outcome)

      if (outcome === "accepted") {
        setIsInstalled(true)
        setIsInstallable(false)
        setDeferredPrompt(null)
        return true
      }

      return false
    } catch (error) {
      console.error("Erreur lors de l'installation:", error)
      return false
    }
  }

  return {
    isInstallable,
    isInstalled,
    isIOS,
    isStandalone,
    installApp,
  }
}

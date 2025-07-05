"use client"

import { BrowserRouter, Routes, Route } from "react-router-dom"
import { Toaster } from "@/components/ui/toaster"
import { Toaster as Sonner } from "@/components/ui/sonner"
import { TooltipProvider } from "@/components/ui/tooltip"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { useState } from "react"

// Context
import { AuthProvider } from "./context/AuthContext"

// PWA Components
import InstallPrompt from "./components/InstallPrompt"
import SplashScreen from "./components/SplashScreen"

// Pages
import Welcome from "./pages/Welcome"
import UserTypeSelection from "./pages/UserTypeSelection"
import ProviderLogin from "./pages/ProviderLogin"
import ClientLogin from "./pages/ClientLogin"
import ProviderDashboard from "./pages/ProviderDashboard"
import ClientDashboard from "./pages/ClientDashboard"
import CreateService from "./pages/CreateService"
import ServicePreview from "./pages/ServicePreview"
import EditService from "./pages/EditService"
import BookingPage from "./pages/BookingPage"
import ServiceView from "./pages/ServiceView"
import MessagesPage from "./pages/MessagesPage"
import ReviewsPage from "./pages/ReviewsPage"
import ReviewPage from "./pages/ReviewPage"
import ProviderProfile from "./pages/ProviderProfile"
import MyProfile from "./pages/MyProfile"
import EditProfile from "./pages/EditProviderProfile"
import AIChat from "./pages/AIChat"

// Placeholder components pour les routes futures
const NotFound = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="text-center">
      <h1 className="text-4xl font-bold text-gray-900 mb-4">404</h1>
      <p className="text-gray-600 mb-4">Page non trouvée</p>
      <a href="/" className="text-blue-500 hover:text-blue-600 underline">
        Retour à l'accueil
      </a>
    </div>
  </div>
)

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes
    },
  },
})

const App = () => {
  const [showSplashScreen, setShowSplashScreen] = useState(() => {
    // Pour le développement, toujours afficher le splash screen
    const isDev = import.meta.env.DEV

    // Vérifier si c'est le premier chargement de l'app
    const hasSeenSplash = sessionStorage.getItem("proxya-splash-seen")

    // Détecter si c'est une PWA ou mobile
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone === true ||
      window.matchMedia("(display-mode: fullscreen)").matches ||
      window.matchMedia("(display-mode: minimal-ui)").matches

    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)

    // Afficher le splash si :
    // - Mode développement OU
    // - PWA installée OU
    // - Mobile ET premier chargement
    const shouldShow = isDev || isStandalone || (isMobile && !hasSeenSplash)

    console.log("Splash Screen Debug:", {
      isDev,
      hasSeenSplash,
      isStandalone,
      isMobile,
      shouldShow,
    })

    return shouldShow && !hasSeenSplash
  })

  const handleSplashComplete = () => {
    console.log("Splash screen completed")
    setShowSplashScreen(false)
    sessionStorage.setItem("proxya-splash-seen", "true")
  }

  // Debug: afficher l'état du splash screen
  console.log("App render - showSplashScreen:", showSplashScreen)

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />

          {/* Splash Screen */}
          {showSplashScreen && <SplashScreen onComplete={handleSplashComplete} />}

          {/* Application principale */}
          {!showSplashScreen && (
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<Welcome />} />
                <Route path="/user-type" element={<UserTypeSelection />} />
                <Route path="/provider/login" element={<ProviderLogin />} />
                <Route path="/client/login" element={<ClientLogin />} />
                <Route path="/provider/dashboard" element={<ProviderDashboard />} />
                <Route path="/client/dashboard" element={<ClientDashboard />} />
                <Route path="/provider/create-service" element={<CreateService />} />
                <Route path="/provider/service-preview/:serviceId" element={<ServicePreview />} />
                <Route path="/provider/edit-service/:serviceId" element={<EditService />} />
                <Route path="/client/book-service/:serviceId" element={<BookingPage />} />
                <Route path="/client/service-view/:serviceId" element={<ServiceView />} />
                <Route path="/messages" element={<MessagesPage />} />
                <Route path="/messages/:userId" element={<MessagesPage />} />
                <Route path="/client/review/:bookingId" element={<ReviewPage />} />
                <Route path="/reviews/:providerId" element={<ReviewsPage />} />
                <Route path="/provider-profile/:providerId" element={<ProviderProfile />} />
                <Route path="/provider/my-profile" element={<MyProfile />} />
                <Route path="/provider/edit-profile" element={<EditProfile />} />
                <Route path="/ai-chat" element={<AIChat />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
              {/* PWA Install Prompt */}
              <InstallPrompt />
            </BrowserRouter>
          )}
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  )
}

export default App

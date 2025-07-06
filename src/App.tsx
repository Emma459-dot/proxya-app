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
  <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-900">
    <div className="text-center max-w-md mx-auto p-6">
      <div className="text-6xl font-bold text-gray-300 dark:text-gray-600 mb-4">404</div>
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Page non trouvée</h1>
      <p className="text-gray-600 dark:text-gray-400 mb-6">
        La page que vous recherchez n'existe pas ou a été déplacée.
      </p>
      <div className="space-y-2">
        <a
          href="/"
          className="inline-block bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg transition-colors"
        >
          Retour à l'accueil
        </a>
        <br />
        <button
          onClick={() => window.history.back()}
          className="text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-200 underline text-sm"
        >
          Retour à la page précédente
        </button>
      </div>
    </div>
  </div>
)

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes
      retry: 1,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 1,
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
                {/* Routes publiques */}
                <Route path="/" element={<Welcome />} />
                <Route path="/user-type" element={<UserTypeSelection />} />

                {/* Routes d'authentification */}
                <Route path="/provider/login" element={<ProviderLogin />} />
                <Route path="/client/login" element={<ClientLogin />} />

                {/* Routes prestataire */}
                <Route path="/provider/dashboard" element={<ProviderDashboard />} />
                <Route path="/provider/create-service" element={<CreateService />} />
                <Route path="/provider/service-preview/:serviceId" element={<ServicePreview />} />
                <Route path="/provider/edit-service/:serviceId" element={<EditService />} />
                <Route path="/provider/my-profile" element={<MyProfile />} />
                <Route path="/provider/edit-profile" element={<EditProfile />} />

                {/* Routes client */}
                <Route path="/client/dashboard" element={<ClientDashboard />} />
                <Route path="/client/book-service/:serviceId" element={<BookingPage />} />
                <Route path="/client/service-view/:serviceId" element={<ServiceView />} />
                <Route path="/client/review/:bookingId" element={<ReviewPage />} />

                {/* Routes communes */}
                <Route path="/messages" element={<MessagesPage />} />
                <Route path="/messages/:userId" element={<MessagesPage />} />
                <Route path="/reviews/:providerId" element={<ReviewsPage />} />
                <Route path="/provider-profile/:providerId" element={<ProviderProfile />} />
                <Route path="/ai-chat" element={<AIChat />} />

                {/* Route 404 */}
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

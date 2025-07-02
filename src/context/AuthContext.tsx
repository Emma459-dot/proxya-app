"use client"

import type React from "react"
import { createContext, useState, useEffect, useContext, type ReactNode } from "react"
import { ClientService, ProviderService, UserService } from "../services"
import type { Client, Provider, User } from "../types"
import { useLocalStorage } from "../hooks"

// Type union pour tous les types d'utilisateurs
type AuthUser = User | Client | Provider
type UserType = "user" | "client" | "provider"

interface AuthContextProps {
  currentUser: AuthUser | null
  userType: UserType | null
  login: (userData: AuthUser, type: UserType) => void
  logout: () => void
  registerClient: (clientData: Omit<Client, "id">) => Promise<void>
  registerProvider: (providerData: Omit<Provider, "id">) => Promise<void>
  isLoading: boolean
}

const AuthContext = createContext<AuthContextProps | undefined>(undefined)

interface AuthProviderProps {
  children: ReactNode
}

const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null)
  const [userType, setUserType] = useState<UserType | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [storedUser, setStoredUser] = useLocalStorage("user", null)
  const [storedUserType, setStoredUserType] = useLocalStorage("userType", null)

  const userService = new UserService()
  const clientService = new ClientService()
  const providerService = new ProviderService()

  useEffect(() => {
    const loadStoredUser = async () => {
      setIsLoading(true)
      if (storedUser && storedUserType) {
        try {
          if (storedUserType === "client") {
            const client = await clientService.getById(storedUser.id)
            if (client) {
              setCurrentUser(client)
              setUserType(storedUserType)
            } else {
              // Utilisateur supprimé, nettoyer le storage
              setCurrentUser(null)
              setUserType(null)
              setStoredUser(null)
              setStoredUserType(null)
            }
          } else if (storedUserType === "provider") {
            const provider = await providerService.getById(storedUser.id)
            if (provider) {
              setCurrentUser(provider)
              setUserType(storedUserType)
            } else {
              // Utilisateur supprimé, nettoyer le storage
              setCurrentUser(null)
              setUserType(null)
              setStoredUser(null)
              setStoredUserType(null)
            }
          } else {
            const user = await userService.getById(storedUser.id)
            setCurrentUser(user)
            setUserType(storedUserType)
          }
        } catch (error) {
          console.error("Erreur lors du chargement de l'utilisateur stocké:", error)
          setCurrentUser(null)
          setUserType(null)
          setStoredUser(null)
          setStoredUserType(null)
        }
      }
      setIsLoading(false)
    }

    loadStoredUser()
  }, [clientService, providerService, userService, storedUser, storedUserType, setStoredUser, setStoredUserType])

  const login = (userData: AuthUser, type: UserType) => {
    setCurrentUser(userData)
    setUserType(type)
    setStoredUser(userData)
    setStoredUserType(type)
  }

  const registerClient = async (clientData: Omit<Client, "id">) => {
    setIsLoading(true)
    try {
      const newClient = await clientService.create(clientData)
      setCurrentUser(newClient)
      setUserType("client")
      setStoredUser(newClient)
      setStoredUserType("client")
    } catch (error) {
      console.error("Erreur d'inscription:", error)
      // Gérer l'erreur d'inscription (ex: afficher un message d'erreur)
    } finally {
      setIsLoading(false)
    }
  }

  const registerProvider = async (providerData: Omit<Provider, "id">) => {
    setIsLoading(true)
    try {
      const newProvider = await providerService.create(providerData)
      setCurrentUser(newProvider)
      setUserType("provider")
      setStoredUser(newProvider)
      setStoredUserType("provider")
    } catch (error) {
      console.error("Erreur d'inscription:", error)
      // Gérer l'erreur d'inscription (ex: afficher un message d'erreur)
    } finally {
      setIsLoading(false)
    }
  }

  const logout = () => {
    setCurrentUser(null)
    setUserType(null)
    setStoredUser(null)
    setStoredUserType(null)
  }

  const value: AuthContextProps = {
    currentUser,
    userType,
    login,
    logout,
    registerClient,
    registerProvider,
    isLoading,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth doit être utilisé dans un AuthProvider")
  }
  return context
}

export { AuthProvider, useAuth }

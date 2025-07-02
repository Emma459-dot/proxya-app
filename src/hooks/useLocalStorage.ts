"use client"

import { useState } from "react"

export function useLocalStorage<T>(key: string, initialValue: T) {
  // État pour stocker notre valeur
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      // Récupérer depuis le localStorage
      const item = window.localStorage.getItem(key)
      // Parser le JSON stocké ou retourner la valeur initiale
      return item ? JSON.parse(item) : initialValue
    } catch (error) {
      // Si erreur, retourner la valeur initiale
      console.log(error)
      return initialValue
    }
  })

  // Retourner une version wrappée de la fonction setter de useState qui persiste la nouvelle valeur dans localStorage
  const setValue = (value: T | ((val: T) => T)) => {
    try {
      // Permettre à la valeur d'être une fonction pour avoir la même API que useState
      const valueToStore = value instanceof Function ? value(storedValue) : value
      // Sauvegarder l'état
      setStoredValue(valueToStore)
      // Sauvegarder dans le localStorage
      window.localStorage.setItem(key, JSON.stringify(valueToStore))
    } catch (error) {
      // Une erreur plus avancée de gestion serait appropriée ici
      console.log(error)
    }
  }

  return [storedValue, setValue] as const
}

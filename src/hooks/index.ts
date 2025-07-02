"use client"

import { useState } from "react"

// Hook pour le localStorage
export function useLocalStorage<T>(key: string, initialValue: T) {
  // État pour stocker notre valeur
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      // Récupérer depuis le localStorage local
      const item = window.localStorage.getItem(key)
      // Parser le JSON stocké ou retourner initialValue si aucun
      return item ? JSON.parse(item) : initialValue
    } catch (error) {
      // Si erreur, retourner initialValue
      console.log(error)
      return initialValue
    }
  })

  // Retourner une version wrappée de la fonction setter de useState qui persiste la nouvelle valeur dans localStorage.
  const setValue = (value: T | ((val: T) => T)) => {
    try {
      // Permettre à value d'être une fonction pour avoir la même API que useState
      const valueToStore = value instanceof Function ? value(storedValue) : value
      // Sauvegarder l'état
      setStoredValue(valueToStore)
      // Sauvegarder dans le localStorage local
      window.localStorage.setItem(key, JSON.stringify(valueToStore))
    } catch (error) {
      // Une implémentation plus avancée gérerait le cas d'erreur
      console.log(error)
    }
  }

  return [storedValue, setValue] as const
}

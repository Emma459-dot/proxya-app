"use client"

import type React from "react"
import { useState, useRef } from "react"
import { Upload, X } from "lucide-react"
import { Button } from "@/components/ui/button"

interface ImageUploadProps {
  images: string[]
  onImagesChange: (images: string[]) => void
  maxImages?: number
}

// Fonction pour compresser une image
const compressImage = (file: File, maxWidth = 800, maxHeight = 600, quality = 0.7): Promise<string> => {
  return new Promise((resolve) => {
    const canvas = document.createElement("canvas")
    const ctx = canvas.getContext("2d")!
    const img = new Image()

    img.onload = () => {
      // Calculer les nouvelles dimensions en gardant le ratio
      let { width, height } = img

      if (width > height) {
        if (width > maxWidth) {
          height = (height * maxWidth) / width
          width = maxWidth
        }
      } else {
        if (height > maxHeight) {
          width = (width * maxHeight) / height
          height = maxHeight
        }
      }

      canvas.width = width
      canvas.height = height

      // Dessiner l'image redimensionnée
      ctx.drawImage(img, 0, 0, width, height)

      // Convertir en base64 compressé
      const compressedBase64 = canvas.toDataURL("image/jpeg", quality)
      resolve(compressedBase64)
    }

    img.src = URL.createObjectURL(file)
  })
}

const ImageUpload = ({ images, onImagesChange, maxImages = 5 }: ImageUploadProps) => {
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files) return

    setIsUploading(true)

    try {
      const newImages: string[] = []

      for (let i = 0; i < files.length && images.length + newImages.length < maxImages; i++) {
        const file = files[i]

        // Vérifier le type de fichier
        if (!file.type.startsWith("image/")) {
          continue
        }

        // Vérifier la taille du fichier (max 5MB avant compression)
        if (file.size > 5 * 1024 * 1024) {
          console.warn(`Fichier ${file.name} trop volumineux (${Math.round(file.size / 1024 / 1024)}MB), ignoré`)
          continue
        }

        try {
          // Compresser l'image
          const compressedBase64 = await compressImage(file, 800, 600, 0.7)

          // Vérifier la taille après compression (approximative)
          const sizeInBytes = (compressedBase64.length * 3) / 4
          if (sizeInBytes > 200 * 1024) {
            // 200KB max par image
            // Compresser davantage si nécessaire
            const moreCompressed = await compressImage(file, 600, 400, 0.5)
            newImages.push(moreCompressed)
          } else {
            newImages.push(compressedBase64)
          }
        } catch (error) {
          console.error(`Erreur lors de la compression de ${file.name}:`, error)
        }
      }

      onImagesChange([...images, ...newImages])
    } catch (error) {
      console.error("Erreur lors de l'upload:", error)
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    }
  }

  const removeImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index)
    onImagesChange(newImages)
  }

  return (
    <div className="space-y-4">
      {/* Zone d'upload */}
      <div
        onClick={() => fileInputRef.current?.click()}
        className="border-2 border-dashed border-stone-300 dark:border-slate-600 rounded-lg p-6 text-center cursor-pointer hover:border-stone-400 dark:hover:border-slate-500 transition-colors"
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
          disabled={isUploading || images.length >= maxImages}
        />

        <div className="flex flex-col items-center gap-2">
          <Upload className="h-8 w-8 text-slate-400" />
          <div>
            <p className="text-sm font-medium text-slate-900 dark:text-white">
              {isUploading ? "Compression et upload en cours..." : "Cliquez pour ajouter des images"}
            </p>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              PNG, JPG jusqu'à 5MB - Images automatiquement compressées ({images.length}/{maxImages})
            </p>
          </div>
        </div>
      </div>

      {/* Aperçu des images */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {images.map((image, index) => (
            <div key={index} className="relative group">
              <div className="aspect-square rounded-lg overflow-hidden bg-stone-100 dark:bg-slate-800">
                <img
                  src={image || "/placeholder.svg"}
                  alt={`Image ${index + 1}`}
                  className="w-full h-full object-cover"
                />
              </div>
              <Button
                variant="destructive"
                size="icon"
                className="absolute top-2 right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => removeImage(index)}
              >
                <X size={12} />
              </Button>
              {index === 0 && (
                <div className="absolute bottom-2 left-2 bg-slate-900 text-white text-xs px-2 py-1 rounded">
                  Principal
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Avertissement sur la taille */}
      {images.length > 0 && (
        <div className="text-xs text-slate-500 dark:text-slate-400 bg-stone-100 dark:bg-slate-800 p-2 rounded">
          💡 <strong>Astuce :</strong> Les images sont automatiquement compressées pour optimiser les performances.
          Qualité recommandée : 800x600px maximum.
        </div>
      )}
    </div>
  )
}

export default ImageUpload

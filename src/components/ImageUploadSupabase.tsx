"use client"

import type React from "react"
import { useState, useRef } from "react"
import { Upload, X, ImageIcon, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { imageService } from "../services/imageService"
import { useAuth } from "../context/AuthContext"

interface ImageUploadSupabaseProps {
  images: string[]
  onImagesChange: (images: string[]) => void
  folder: "profiles" | "services" | "portfolio" | "certifications" | "covers"
  maxImages?: number
  maxSizeMB?: number
}

const ImageUploadSupabase = ({
  images,
  onImagesChange,
  folder,
  maxImages = 5,
  maxSizeMB = 10,
}: ImageUploadSupabaseProps) => {
  const { currentUser } = useAuth()
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [error, setError] = useState("")
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files || files.length === 0) return

    setIsUploading(true)
    setError("")
    setUploadProgress(0)

    try {
      // Valider les fichiers
      const validFiles: File[] = []
      for (let i = 0; i < files.length && images.length + validFiles.length < maxImages; i++) {
        const file = files[i]
        const validation = imageService.validateImageFile(file)

        if (!validation.isValid) {
          console.warn(`Fichier ${file.name} invalide:`, validation.error)
          continue
        }

        // Vérifier la taille personnalisée
        if (file.size > maxSizeMB * 1024 * 1024) {
          console.warn(`Fichier ${file.name} trop volumineux (${Math.round(file.size / 1024 / 1024)}MB)`)
          continue
        }

        validFiles.push(file)
      }

      if (validFiles.length === 0) {
        setError("Aucun fichier valide sélectionné")
        return
      }

      // Upload les fichiers
      const results = await imageService.uploadMultipleImages(validFiles, folder, currentUser?.id, (progress) =>
        setUploadProgress(progress),
      )

      // Vérifier les erreurs
      const successfulUploads = results.filter((result) => !result.error && result.url)
      const failedUploads = results.filter((result) => result.error)

      if (failedUploads.length > 0) {
        setError(`${failedUploads.length} image(s) n'ont pas pu être uploadées`)
      }

      if (successfulUploads.length > 0) {
        const newImageUrls = successfulUploads.map((result) => result.url)
        onImagesChange([...images, ...newImageUrls])
      }
    } catch (err) {
      console.error("Erreur lors de l'upload:", err)
      setError("Une erreur est survenue lors de l'upload")
    } finally {
      setIsUploading(false)
      setUploadProgress(0)
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    }
  }

  const removeImage = async (index: number) => {
    const imageUrl = images[index]

    // Extraire le path de l'URL Supabase pour la suppression
    if (imageUrl.includes("supabase")) {
      try {
        const urlParts = imageUrl.split("/")
        const bucketIndex = urlParts.findIndex((part) => part === "proxya-images")
        if (bucketIndex !== -1 && bucketIndex < urlParts.length - 1) {
          const path = urlParts.slice(bucketIndex + 1).join("/")
          await imageService.deleteImage(path)
        }
      } catch (error) {
        console.error("Erreur lors de la suppression:", error)
      }
    }

    const newImages = images.filter((_, i) => i !== index)
    onImagesChange(newImages)
  }

  const canUploadMore = images.length < maxImages && !isUploading

  return (
    <div className="space-y-4">
      {/* Zone d'upload */}
      <div
        onClick={() => canUploadMore && fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
          canUploadMore
            ? "border-stone-300 dark:border-slate-600 cursor-pointer hover:border-stone-400 dark:hover:border-slate-500"
            : "border-stone-200 dark:border-slate-700 cursor-not-allowed opacity-50"
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
          disabled={!canUploadMore}
        />

        <div className="flex flex-col items-center gap-3">
          {isUploading ? (
            <Loader2 className="h-8 w-8 text-slate-400 animate-spin" />
          ) : (
            <Upload className="h-8 w-8 text-slate-400" />
          )}

          <div>
            <p className="text-sm font-medium text-slate-900 dark:text-white">
              {isUploading
                ? "Upload en cours..."
                : canUploadMore
                  ? "Cliquez pour ajouter des images"
                  : `Maximum ${maxImages} images atteint`}
            </p>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              JPG, PNG, WebP, GIF jusqu'à {maxSizeMB}MB - Qualité originale préservée ({images.length}/{maxImages})
            </p>
          </div>
        </div>

        {/* Barre de progression */}
        {isUploading && uploadProgress > 0 && (
          <div className="mt-4">
            <Progress value={uploadProgress} className="w-full" />
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">{Math.round(uploadProgress)}% terminé</p>
          </div>
        )}
      </div>

      {/* Messages d'erreur */}
      {error && (
        <Alert className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20">
          <AlertDescription className="text-red-700 dark:text-red-300">{error}</AlertDescription>
        </Alert>
      )}

      {/* Aperçu des images */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {images.map((image, index) => (
            <div key={index} className="relative group">
              <div className="aspect-square rounded-lg overflow-hidden bg-stone-100 dark:bg-slate-800">
                <img
                  src={imageService.getResizedImageUrl(image, 300, 300) || "/placeholder.svg"}
                  alt={`Image ${index + 1}`}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>
              <Button
                variant="destructive"
                size="icon"
                className="absolute top-2 right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => removeImage(index)}
                disabled={isUploading}
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

      {/* Informations sur Supabase Storage */}
      {images.length > 0 && (
        <div className="text-xs text-slate-500 dark:text-slate-400 bg-stone-100 dark:bg-slate-800 p-3 rounded-lg">
          <div className="flex items-center gap-2 mb-1">
            <ImageIcon size={14} />
            <strong>Stockage Supabase :</strong>
          </div>
          <ul className="space-y-1 ml-4">
            <li>✅ Qualité originale préservée</li>
            <li>✅ CDN mondial pour chargement rapide</li>
            <li>✅ Redimensionnement automatique</li>
            <li>✅ URLs directes (pas de base64)</li>
          </ul>
        </div>
      )}
    </div>
  )
}

export default ImageUploadSupabase

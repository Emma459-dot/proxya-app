import { supabase } from "../config/supabase"

export interface UploadResult {
  url: string
  path: string
  error?: string
}

class ImageService {
  private bucketName = "proxya-images"

  /**
   * Upload une image vers Supabase Storage
   */
  async uploadImage(
    file: File,
    folder: "profiles" | "services" | "portfolio" | "certifications" | "covers",
    userId?: string,
  ): Promise<UploadResult> {
    try {
      // Générer un nom unique pour le fichier
      const timestamp = Date.now()
      const randomId = Math.random().toString(36).substring(2, 15)
      const fileExtension = file.name.split(".").pop()
      const fileName = `${timestamp}_${randomId}.${fileExtension}`

      // Créer le chemin complet
      const filePath = userId ? `${folder}/${userId}/${fileName}` : `${folder}/${fileName}`

      console.log("🚀 Upload vers:", filePath)
      console.log("📁 Fichier:", file.name, "Taille:", Math.round(file.size / 1024), "KB")

      // Upload le fichier
      const { data, error } = await supabase.storage.from(this.bucketName).upload(filePath, file, {
        cacheControl: "3600",
        upsert: false,
      })

      if (error) {
        console.error("❌ Erreur upload détaillée:", error)
        console.error("❌ Message:", error.message)
        return { url: "", path: "", error: `Upload failed: ${error.message}` }
      }

      console.log("✅ Upload réussi:", data)

      // Récupérer l'URL publique
      const { data: urlData } = supabase.storage.from(this.bucketName).getPublicUrl(filePath)

      console.log("🌐 URL publique:", urlData.publicUrl)

      return {
        url: urlData.publicUrl,
        path: filePath,
      }
    } catch (error) {
      console.error("💥 Erreur lors de l'upload:", error)
      return {
        url: "",
        path: "",
        error: error instanceof Error ? error.message : "Erreur inconnue",
      }
    }
  }

  /**
   * Upload plusieurs images
   */
  async uploadMultipleImages(
    files: File[],
    folder: "profiles" | "services" | "portfolio" | "certifications" | "covers",
    userId?: string,
    onProgress?: (progress: number) => void,
  ): Promise<UploadResult[]> {
    const results: UploadResult[] = []

    for (let i = 0; i < files.length; i++) {
      const result = await this.uploadImage(files[i], folder, userId)
      results.push(result)

      if (onProgress) {
        onProgress(((i + 1) / files.length) * 100)
      }
    }

    return results
  }

  /**
   * Supprimer une image
   */
  async deleteImage(path: string): Promise<boolean> {
    try {
      const { error } = await supabase.storage.from(this.bucketName).remove([path])

      if (error) {
        console.error("Erreur suppression:", error)
        return false
      }

      console.log("Image supprimée:", path)
      return true
    } catch (error) {
      console.error("Erreur lors de la suppression:", error)
      return false
    }
  }

  /**
   * Supprimer plusieurs images
   */
  async deleteMultipleImages(paths: string[]): Promise<boolean> {
    try {
      const { error } = await supabase.storage.from(this.bucketName).remove(paths)

      if (error) {
        console.error("Erreur suppression multiple:", error)
        return false
      }

      console.log("Images supprimées:", paths.length)
      return true
    } catch (error) {
      console.error("Erreur lors de la suppression multiple:", error)
      return false
    }
  }

  /**
   * Obtenir une URL redimensionnée (fonctionnalité Supabase)
   */
  getResizedImageUrl(url: string, width: number, height?: number): string {
    if (!url.includes("supabase")) return url

    const resizeParams = height ? `width=${width}&height=${height}&resize=cover` : `width=${width}&resize=contain`

    return `${url}?${resizeParams}`
  }

  /**
   * Valider un fichier image
   */
  validateImageFile(file: File): { isValid: boolean; error?: string } {
    // Vérifier le type
    if (!file.type.startsWith("image/")) {
      return { isValid: false, error: "Le fichier doit être une image" }
    }

    // Vérifier la taille (max 10MB pour Supabase)
    const maxSize = 10 * 1024 * 1024 // 10MB
    if (file.size > maxSize) {
      return { isValid: false, error: "L'image ne doit pas dépasser 10MB" }
    }

    // Types supportés
    const supportedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"]
    if (!supportedTypes.includes(file.type)) {
      return { isValid: false, error: "Format non supporté. Utilisez JPG, PNG, WebP ou GIF" }
    }

    return { isValid: true }
  }

  /**
   * Tester la connexion Supabase
   */
  async testConnection(): Promise<boolean> {
    try {
      console.log("🧪 Test de connexion Supabase...")

      // Tester l'accès au bucket
      const { data, error } = await supabase.storage.listBuckets()

      if (error) {
        console.error("❌ Erreur connexion:", error)
        return false
      }

      console.log("✅ Buckets disponibles:", data)

      // Vérifier si notre bucket existe
      const ourBucket = data.find((bucket) => bucket.name === this.bucketName)
      if (!ourBucket) {
        console.error("❌ Bucket 'proxya-images' introuvable")
        return false
      }

      console.log("✅ Bucket 'proxya-images' trouvé:", ourBucket)
      return true
    } catch (error) {
      console.error("💥 Erreur test connexion:", error)
      return false
    }
  }
}

export const imageService = new ImageService()

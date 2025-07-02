// Service pour la synthèse vocale (Web Speech API)
export class SpeechService {
  private static synthesis: SpeechSynthesis | null = null
  private static voices: SpeechSynthesisVoice[] = []

  // Initialiser le service de synthèse vocale
  static init(): void {
    if ("speechSynthesis" in window) {
      this.synthesis = window.speechSynthesis
      this.loadVoices()

      // Écouter les changements de voix
      this.synthesis.onvoiceschanged = () => {
        this.loadVoices()
      }
    }
  }

  // Charger les voix disponibles
  private static loadVoices(): void {
    if (this.synthesis) {
      this.voices = this.synthesis.getVoices()
    }
  }

  // Obtenir la meilleure voix française
  private static getFrenchVoice(): SpeechSynthesisVoice | null {
    // Chercher une voix française
    const frenchVoices = this.voices.filter(
      (voice) => voice.lang.startsWith("fr") || voice.name.toLowerCase().includes("french"),
    )

    if (frenchVoices.length > 0) {
      // Préférer les voix féminines pour un ton plus accueillant
      const femaleVoice = frenchVoices.find(
        (voice) =>
          voice.name.toLowerCase().includes("female") ||
          voice.name.toLowerCase().includes("femme") ||
          voice.name.toLowerCase().includes("marie") ||
          voice.name.toLowerCase().includes("claire"),
      )

      return femaleVoice || frenchVoices[0]
    }

    return null
  }

  // Lire un texte à voix haute
  static speak(
    text: string,
    options: {
      rate?: number
      pitch?: number
      volume?: number
      onStart?: () => void
      onEnd?: () => void
      onError?: (error: SpeechSynthesisErrorEvent) => void
    } = {},
  ): void {
    if (!this.synthesis) {
      console.warn("Synthèse vocale non supportée par ce navigateur")
      return
    }

    // Arrêter toute lecture en cours
    this.stop()

    const utterance = new SpeechSynthesisUtterance(text)

    // Configuration
    utterance.rate = options.rate || 0.9
    utterance.pitch = options.pitch || 1.0
    utterance.volume = options.volume || 1.0

    // Utiliser la voix française si disponible
    const frenchVoice = this.getFrenchVoice()
    if (frenchVoice) {
      utterance.voice = frenchVoice
      utterance.lang = frenchVoice.lang
    } else {
      utterance.lang = "fr-FR"
    }

    // Événements
    utterance.onstart = () => {
      options.onStart?.()
    }

    utterance.onend = () => {
      options.onEnd?.()
    }

    utterance.onerror = (error) => {
      console.error("Erreur synthèse vocale:", error)
      options.onError?.(error)
    }

    // Lancer la lecture
    this.synthesis.speak(utterance)
  }

  // Arrêter la lecture
  static stop(): void {
    if (this.synthesis) {
      this.synthesis.cancel()
    }
  }

  // Mettre en pause
  static pause(): void {
    if (this.synthesis) {
      this.synthesis.pause()
    }
  }

  // Reprendre la lecture
  static resume(): void {
    if (this.synthesis) {
      this.synthesis.resume()
    }
  }

  // Vérifier si la synthèse vocale est supportée
  static isSupported(): boolean {
    return "speechSynthesis" in window
  }

  // Vérifier si une lecture est en cours
  static isSpeaking(): boolean {
    return this.synthesis ? this.synthesis.speaking : false
  }
}

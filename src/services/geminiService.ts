// Service d'intégration avec l'API Gemini de Google
export interface ChatMessage {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: Date
}

export class GeminiService {
  // Utilisation d'une clé API publique de démonstration - À remplacer en production
  private static readonly API_KEY = "AIzaSyBqKjKqKjKqKjKqKjKqKjKqKjKqKjKqKjK" // Clé de démonstration
  private static readonly API_URL =
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent"

  // Prompts spécialisés selon le type d'utilisateur
  private static getSystemPrompt(userType: "client" | "provider", userName: string): string {
    const baseContext = `Tu es PROXYA Assistant, l'assistant IA de la plateforme PROXYA au Cameroun. 
PROXYA connecte les clients avec des prestataires de services locaux (beauté, alimentation, maintenance, événementiel, éducation, etc.).

Contexte utilisateur: ${userName} est un ${userType === "client" ? "client" : "prestataire"} de PROXYA.

Règles importantes:
- Réponds TOUJOURS en français
- Sois chaleureux, professionnel et utile
- Utilise des emojis avec modération
- Adapte tes réponses au contexte camerounais
- Reste dans le domaine de PROXYA et des services
- Si on te demande quelque chose hors sujet, redirige poliment vers PROXYA`

    if (userType === "client") {
      return `${baseContext}

En tant qu'assistant pour les CLIENTS, tu aides à:
- Trouver les meilleurs services selon leurs besoins
- Comprendre les tarifs et prestations
- Préparer leurs réservations
- Résoudre leurs questions sur l'utilisation de PROXYA
- Donner des conseils pour bien choisir un prestataire
- Expliquer le processus de réservation et de paiement

Ton ton: Amical, rassurant, orienté conseil client.`
    } else {
      return `${baseContext}

En tant qu'assistant pour les PRESTATAIRES, tu aides à:
- Optimiser leur profil et leurs services
- Développer leur activité sur PROXYA
- Comprendre les attentes des clients
- Améliorer leurs tarifs et descriptions
- Gérer leurs réservations efficacement
- Développer leur stratégie commerciale locale

Ton ton: Professionnel, motivant, orienté business et croissance.`
    }
  }

  // Générer une réponse avec Gemini
  static async generateResponse(
    userMessage: string,
    userType: "client" | "provider",
    userName: string,
    conversationHistory: ChatMessage[] = [],
  ): Promise<string> {
    try {
      // Pour la démonstration, on simule une réponse de l'IA
      // En production, remplacez ceci par un vrai appel API avec une vraie clé

      console.log("Simulation d'appel API Gemini...")

      // Simuler un délai d'API
      await new Promise((resolve) => setTimeout(resolve, 1000 + Math.random() * 2000))

      const systemPrompt = this.getSystemPrompt(userType, userName)

      // Réponses simulées intelligentes basées sur le type d'utilisateur et le message
      const responses = this.generateSimulatedResponse(userMessage, userType, userName)

      return responses

      /* 
      // Code pour l'API réelle - À décommenter quand vous avez une vraie clé API
      const response = await fetch(`${this.API_URL}?key=${this.API_KEY}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: `${systemPrompt}\n\nQuestion: ${userMessage}`,
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 1024,
          },
          safetySettings: [
            {
              category: "HARM_CATEGORY_HARASSMENT",
              threshold: "BLOCK_MEDIUM_AND_ABOVE",
            },
            {
              category: "HARM_CATEGORY_HATE_SPEECH",
              threshold: "BLOCK_MEDIUM_AND_ABOVE",
            },
          ],
        }),
      })

      if (!response.ok) {
        throw new Error(`Erreur API: ${response.status}`)
      }

      const data = await response.json()

      if (data.candidates && data.candidates[0] && data.candidates[0].content) {
        return data.candidates[0].content.parts[0].text
      } else {
        throw new Error("Réponse invalide de l'API")
      }
      */
    } catch (error) {
      console.error("Erreur Gemini API:", error)
      return this.getFallbackResponse(userType, userName)
    }
  }

  // Générer une réponse simulée intelligente
  private static generateSimulatedResponse(message: string, userType: "client" | "provider", userName: string): string {
    const lowerMessage = message.toLowerCase()

    if (userType === "client") {
      if (lowerMessage.includes("coiffeur") || lowerMessage.includes("coiffure")) {
        return `Salut ${userName} ! 💇‍♀️ Pour trouver un bon coiffeur sur PROXYA :

• Regarde les avis et notes des autres clients
• Vérifie les photos de leurs réalisations
• Compare les tarifs (généralement 3000-15000 FCFA)
• Choisis selon ta localisation (Yaoundé/Douala)
• N'hésite pas à contacter le prestataire avant de réserver

Tu peux filtrer par quartier et voir qui est disponible aujourd'hui ! 😊`
      }

      if (lowerMessage.includes("tarif") || lowerMessage.includes("prix") || lowerMessage.includes("coût")) {
        return `Hey ${userName} ! 💰 Voici les tarifs moyens sur PROXYA :

• Coiffure : 3000-15000 FCFA
• Ménage : 5000-20000 FCFA
• Cuisine : 8000-25000 FCFA  
• Maintenance : 10000-50000 FCFA
• Événementiel : 15000-100000 FCFA

Les prix varient selon :
- La complexité du service
- L'expérience du prestataire
- Ta localisation
- La durée du service

Tu peux toujours négocier directement avec le prestataire ! 😉`
      }

      if (
        lowerMessage.includes("réservation") ||
        lowerMessage.includes("réserver") ||
        lowerMessage.includes("booking")
      ) {
        return `Parfait ${userName} ! 📅 Voici comment réserver sur PROXYA :

1. **Choisis ton service** - Parcours les catégories
2. **Sélectionne un prestataire** - Compare profils et avis
3. **Vérifie la disponibilité** - Choisis date et heure
4. **Confirme les détails** - Adresse, durée, tarif
5. **Valide ta réservation** - Paiement sécurisé

Le prestataire recevra une notification et te contactera pour confirmer. Tu peux suivre ta réservation dans ton tableau de bord ! 🎯`
      }

      return `Salut ${userName} ! 😊 Je suis là pour t'aider avec PROXYA. 

Tu peux me poser des questions sur :
• Comment trouver les meilleurs services
• Les tarifs et négociations  
• Le processus de réservation
• Comment contacter les prestataires
• Gérer tes réservations

Qu'est-ce qui t'intéresse le plus ? 🤔`
    } else {
      if (lowerMessage.includes("profil") || lowerMessage.includes("optimiser")) {
        return `Salut ${userName} ! 🚀 Pour optimiser ton profil prestataire :

**Photos essentielles :**
• Photo de profil professionnelle
• 3-5 photos de tes réalisations
• Photos de ton matériel/espace de travail

**Description efficace :**
• Présente ton expérience (années, formations)
• Liste tes spécialités
• Mentionne tes quartiers d'intervention
• Ajoute tes horaires de disponibilité

**Tarifs compétitifs :**
• Étudie la concurrence locale
• Propose des forfaits attractifs
• Sois transparent sur tes prix

Un profil complet attire 3x plus de clients ! 💪`
      }

      if (lowerMessage.includes("tarif") || lowerMessage.includes("prix")) {
        return `Hey ${userName} ! 💰 Voici mes conseils tarifs pour le Cameroun :

**Recherche de marché :**
• Vérifie les prix de tes concurrents sur PROXYA
• Adapte selon ton quartier (centre-ville vs périphérie)
• Considère ton niveau d'expérience

**Stratégie tarifaire :**
• Commence légèrement en dessous du marché
• Augmente progressivement avec les bons avis
• Propose des forfaits pour fidéliser
• Offre des réductions pour nouveaux clients

**Exemples moyens :**
• Coiffure débutant : 3000-8000 FCFA
• Coiffure expérimenté : 8000-15000 FCFA

L'important c'est la qualité ! Les clients paient plus pour un bon service. 🎯`
      }

      if (lowerMessage.includes("client") || lowerMessage.includes("attirer")) {
        return `Excellent ${userName} ! 🎯 Voici comment attirer plus de clients :

**Profil attractif :**
• Photos de qualité professionnelle
• Description détaillée et engageante
• Tarifs clairs et compétitifs

**Service client :**
• Réponds rapidement aux messages (< 2h)
• Sois ponctuel et professionnel
• Dépasse les attentes du client

**Stratégie marketing :**
• Demande des avis après chaque service
• Propose des promotions pour nouveaux clients
• Sois actif sur la plateforme
• Offre des services complémentaires

**Fidélisation :**
• Crée des forfaits fidélité
• Envoie des rappels pour services réguliers
• Maintiens une relation cordiale

La réputation est ton meilleur atout ! 🌟`
      }

      return `Salut ${userName} ! 💪 Je suis ton conseiller business PROXYA.

Je peux t'aider avec :
• Optimisation de ton profil
• Stratégies tarifaires
• Attraction de nouveaux clients
• Gestion des avis et réputation
• Développement de ton activité

Quel aspect veux-tu améliorer en priorité ? 🚀`
    }
  }

  // Réponse de fallback en cas d'erreur
  private static getFallbackResponse(userType: "client" | "provider", userName: string): string {
    if (userType === "client") {
      return `Désolé ${userName}, je rencontre un problème technique. 😅 

En attendant, voici ce que tu peux faire sur PROXYA:
• Parcourir les services disponibles
• Contacter directement les prestataires
• Consulter les avis clients
• Gérer tes réservations

N'hésite pas à réessayer dans quelques instants !`
    } else {
      return `Salut ${userName}, j'ai un petit souci technique ! 🤖

En attendant que ça revienne, voici quelques conseils rapides:
• Assure-toi que ton profil est complet
• Ajoute de belles photos à tes services
• Réponds rapidement aux messages clients
• Maintiens des tarifs compétitifs

Je reviens bientôt pour t'aider davantage !`
    }
  }

  // Questions suggérées selon le type d'utilisateur
  static getSuggestedQuestions(userType: "client" | "provider"): string[] {
    if (userType === "client") {
      return [
        "Comment trouver un bon coiffeur à domicile ?",
        "Quels sont les tarifs moyens pour un ménage ?",
        "Comment bien préparer ma réservation ?",
        "Que faire si un prestataire annule ?",
        "Comment laisser un bon avis ?",
        "Les services sont-ils assurés ?",
        "Comment contacter un prestataire ?",
        "Y a-t-il des frais cachés ?",
      ]
    } else {
      return [
        "Comment optimiser mon profil prestataire ?",
        "Quels tarifs pratiquer pour mes services ?",
        "Comment attirer plus de clients ?",
        "Comment bien présenter mes services ?",
        "Que faire pour avoir de bons avis ?",
        "Comment gérer les annulations ?",
        "Quelles photos mettre sur mon profil ?",
        "Comment développer mon activité ?",
      ]
    }
  }

  // Vérifier si l'API est disponible (simulation)
  static async checkAPIHealth(): Promise<boolean> {
    try {
      // Simulation - en production, testez la vraie API
      await new Promise((resolve) => setTimeout(resolve, 500))
      return true
    } catch (error) {
      console.error("API Health Check failed:", error)
      return false
    }
  }
}

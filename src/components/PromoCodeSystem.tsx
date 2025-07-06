"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Gift, Percent, X, Check, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface PromoCode {
  code: string
  discount: number
  type: "percentage" | "fixed"
  description: string
  minAmount?: number
  maxDiscount?: number
  expiresAt?: Date
  usageLimit?: number
  usedCount?: number
}

interface ReferralCode {
  code: string
  discount: number
  type: "percentage" | "fixed"
  description: string
  referrerBonus: number
}

interface PromoCodeSystemProps {
  onPromoApplied: (promoData: { code: string; discount: number; type: "percentage" | "fixed" }) => void
  onPromoRemoved: () => void
  servicePrice: number
}

// Codes promo simulés (en production, ces données viendraient d'une API)
const MOCK_PROMO_CODES: PromoCode[] = [
  {
    code: "WELCOME10",
    discount: 10,
    type: "percentage",
    description: "10% de réduction pour les nouveaux clients",
    minAmount: 5000,
    maxDiscount: 2000,
  },
  {
    code: "SAVE5000",
    discount: 5000,
    type: "fixed",
    description: "5000 FCFA de réduction",
    minAmount: 10000,
  },
  {
    code: "FLASH20",
    discount: 20,
    type: "percentage",
    description: "Offre flash - 20% de réduction",
    minAmount: 3000,
    maxDiscount: 5000,
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // Expire dans 24h
  },
]

const MOCK_REFERRAL_CODES: ReferralCode[] = [
  {
    code: "REF001",
    discount: 15,
    type: "percentage",
    description: "Code de parrainage - 15% de réduction",
    referrerBonus: 2000,
  },
  {
    code: "REF002",
    discount: 3000,
    type: "fixed",
    description: "Code de parrainage - 3000 FCFA de réduction",
    referrerBonus: 1500,
  },
]

const PromoCodeSystem: React.FC<PromoCodeSystemProps> = ({ onPromoApplied, onPromoRemoved, servicePrice }) => {
  const [promoCode, setPromoCode] = useState("")
  const [appliedPromo, setAppliedPromo] = useState<{
    code: string
    discount: number
    type: "percentage" | "fixed"
    description: string
  } | null>(null)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  // Générer un code de parrainage pour l'utilisateur
  const [userReferralCode] = useState(() => {
    return `REF${Math.random().toString(36).substr(2, 6).toUpperCase()}`
  })

  const validatePromoCode = (code: string): PromoCode | ReferralCode | null => {
    // Vérifier les codes promo
    const promo = MOCK_PROMO_CODES.find((p) => p.code.toLowerCase() === code.toLowerCase())
    if (promo) {
      // Vérifier les conditions
      if (promo.minAmount && servicePrice < promo.minAmount) {
        throw new Error(`Montant minimum requis: ${promo.minAmount} FCFA`)
      }
      if (promo.expiresAt && new Date() > promo.expiresAt) {
        throw new Error("Ce code promo a expiré")
      }
      if (promo.usageLimit && promo.usedCount && promo.usedCount >= promo.usageLimit) {
        throw new Error("Ce code promo a atteint sa limite d'utilisation")
      }
      return promo
    }

    // Vérifier les codes de parrainage
    const referral = MOCK_REFERRAL_CODES.find((r) => r.code.toLowerCase() === code.toLowerCase())
    if (referral) {
      return referral
    }

    return null
  }

  const calculateDiscount = (
    discount: number,
    type: "percentage" | "fixed",
    price: number,
    maxDiscount?: number,
  ): number => {
    if (type === "percentage") {
      const calculatedDiscount = (price * discount) / 100
      return maxDiscount ? Math.min(calculatedDiscount, maxDiscount) : calculatedDiscount
    }
    return Math.min(discount, price) // Ne pas dépasser le prix du service
  }

  const handleApplyPromo = async () => {
    if (!promoCode.trim()) {
      setError("Veuillez saisir un code")
      return
    }

    setIsLoading(true)
    setError("")
    setSuccess("")

    try {
      // Simuler un délai d'API
      await new Promise((resolve) => setTimeout(resolve, 1000))

      const validCode = validatePromoCode(promoCode.trim())

      if (!validCode) {
        throw new Error("Code promo invalide")
      }

      const discountAmount = calculateDiscount(
        validCode.discount,
        validCode.type,
        servicePrice,
        "maxDiscount" in validCode ? validCode.maxDiscount : undefined,
      )

      const promoData = {
        code: validCode.code,
        discount: validCode.discount,
        type: validCode.type,
        description: validCode.description,
      }

      setAppliedPromo(promoData)
      onPromoApplied({
        code: validCode.code,
        discount: validCode.discount,
        type: validCode.type,
      })

      setSuccess(
        `Code appliqué ! Vous économisez ${
          validCode.type === "percentage" ? `${validCode.discount}%` : `${discountAmount} FCFA`
        }`,
      )
      setPromoCode("")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors de l'application du code")
    } finally {
      setIsLoading(false)
    }
  }

  const handleRemovePromo = () => {
    setAppliedPromo(null)
    onPromoRemoved()
    setSuccess("")
    setError("")
  }

  const copyReferralCode = async () => {
    try {
      await navigator.clipboard.writeText(userReferralCode)
      setSuccess("Code de parrainage copié !")
      setTimeout(() => setSuccess(""), 2000)
    } catch (err) {
      setError("Impossible de copier le code")
      setTimeout(() => setError(""), 2000)
    }
  }

  // Effacer les messages après un délai
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(""), 5000)
      return () => clearTimeout(timer)
    }
  }, [error])

  useEffect(() => {
    if (success && !success.includes("copié")) {
      const timer = setTimeout(() => setSuccess(""), 5000)
      return () => clearTimeout(timer)
    }
  }, [success])

  return (
    <Card className="bg-white dark:bg-slate-800 border-stone-200 dark:border-slate-700">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-slate-900 dark:text-white text-sm">
          <Gift size={16} className="text-indigo-600" />
          Codes promo & Parrainage
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Messages d'état */}
        {error && (
          <Alert className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20">
            <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
            <AlertDescription className="text-red-700 dark:text-red-300 text-sm">{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20">
            <Check className="h-4 w-4 text-green-600 dark:text-green-400" />
            <AlertDescription className="text-green-700 dark:text-green-300 text-sm">{success}</AlertDescription>
          </Alert>
        )}

        {/* Code promo appliqué */}
        {appliedPromo && (
          <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
            <div className="flex items-center gap-2">
              <Percent size={16} className="text-green-600 dark:text-green-400" />
              <div>
                <div className="font-medium text-green-800 dark:text-green-200 text-sm">{appliedPromo.code}</div>
                <div className="text-xs text-green-600 dark:text-green-400">{appliedPromo.description}</div>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleRemovePromo}
              className="h-6 w-6 text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-200"
            >
              <X size={14} />
            </Button>
          </div>
        )}

        {/* Saisie du code promo */}
        {!appliedPromo && (
          <div className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="promoCode" className="text-slate-900 dark:text-white text-sm">
                Code promo ou parrainage
              </Label>
              <div className="flex gap-2">
                <Input
                  id="promoCode"
                  type="text"
                  placeholder="Saisissez votre code"
                  value={promoCode}
                  onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                  className="bg-white dark:bg-slate-800 border-stone-200 dark:border-slate-700 text-sm"
                  disabled={isLoading}
                  onKeyPress={(e) => {
                    if (e.key === "Enter") {
                      handleApplyPromo()
                    }
                  }}
                />
                <Button
                  onClick={handleApplyPromo}
                  disabled={isLoading || !promoCode.trim()}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm px-4"
                >
                  {isLoading ? "..." : "Appliquer"}
                </Button>
              </div>
            </div>

            {/* Codes promo disponibles */}
            <div className="space-y-2">
              <Label className="text-slate-900 dark:text-white text-xs">Codes disponibles :</Label>
              <div className="flex flex-wrap gap-1">
                {MOCK_PROMO_CODES.slice(0, 2).map((promo) => (
                  <Button
                    key={promo.code}
                    variant="outline"
                    size="sm"
                    onClick={() => setPromoCode(promo.code)}
                    className="border-stone-200 dark:border-slate-700 text-xs h-6 px-2"
                    disabled={
                      (promo.minAmount && servicePrice < promo.minAmount) ||
                      (promo.expiresAt && new Date() > promo.expiresAt)
                    }
                  >
                    {promo.code}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Code de parrainage de l'utilisateur */}
        <div className="border-t border-stone-200 dark:border-slate-700 pt-4">
          <div className="space-y-2">
            <Label className="text-slate-900 dark:text-white text-sm">Votre code de parrainage</Label>
            <div className="flex items-center gap-2 p-2 bg-stone-50 dark:bg-slate-700 rounded-lg">
              <Badge
                variant="secondary"
                className="bg-indigo-100 text-indigo-800 dark:bg-indigo-900/20 dark:text-indigo-400"
              >
                {userReferralCode}
              </Badge>
              <Button
                variant="ghost"
                size="sm"
                onClick={copyReferralCode}
                className="text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-200 text-xs h-6 px-2"
              >
                Copier
              </Button>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Partagez ce code avec vos amis pour gagner des réductions !
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default PromoCodeSystem

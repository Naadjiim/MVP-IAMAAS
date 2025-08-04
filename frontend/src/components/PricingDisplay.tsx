'use client'

import { useEffect, useState } from 'react'
import { apiService } from '@/services/api'

interface PricingTier {
  duration_hours: number
  base_price: number
  discount_percent: number
  final_price: number
  price_per_hour: number
}

interface PricingInfo {
  base_price_per_hour: number
  pricing_tiers: PricingTier[]
}

interface PricingDisplayProps {
  durationHours: number
  onPriceChange?: (price: number) => void
}

export default function PricingDisplay({ durationHours, onPriceChange }: PricingDisplayProps) {
  const [pricingInfo, setPricingInfo] = useState<PricingInfo | null>(null)
  const [currentPrice, setCurrentPrice] = useState<number>(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchPricing = async () => {
      try {
        const data = await apiService.getPricing()
        setPricingInfo(data)
      } catch (error) {
        console.error('Erreur lors du chargement du pricing:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchPricing()
  }, [])

  useEffect(() => {
    if (pricingInfo) {
      // Calculer le prix pour la durée sélectionnée
      const basePrice = durationHours * pricingInfo.base_price_per_hour
      let discountRate = 0

      // Trouver la remise applicable
      for (const tier of pricingInfo.pricing_tiers) {
        if (durationHours <= tier.duration_hours) {
          discountRate = tier.discount_percent / 100
          break
        }
      }

      // Si la durée est supérieure à 72h, appliquer la remise maximale
      if (durationHours > 72) {
        discountRate = 0.30 // 30% de remise maximale
      }

      const finalPrice = basePrice * (1 - discountRate)
      const roundedPrice = Math.round(finalPrice * 100) / 100
      
      setCurrentPrice(roundedPrice)
      onPriceChange?.(roundedPrice)
    }
  }, [durationHours, pricingInfo, onPriceChange])

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-1/2 mb-2"></div>
        <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded w-1/3"></div>
      </div>
    )
  }

  if (!pricingInfo) {
    return (
      <div className="text-sm text-gray-500 dark:text-gray-400">
        Impossible de charger les informations de prix
      </div>
    )
  }

  const getDiscountInfo = () => {
    for (const tier of pricingInfo.pricing_tiers) {
      if (durationHours <= tier.duration_hours) {
        return {
          discount: tier.discount_percent,
          pricePerHour: tier.price_per_hour
        }
      }
    }
    return { discount: 30, pricePerHour: 0.35 } // Remise maximale
  }

  const { discount, pricePerHour } = getDiscountInfo()
  const basePrice = durationHours * pricingInfo.base_price_per_hour

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-600 dark:text-gray-400">
          Prix de base ({durationHours}h × {pricingInfo.base_price_per_hour}€/h)
        </span>
        <span className="text-sm text-gray-900 dark:text-gray-100">
          {basePrice.toFixed(2)}€
        </span>
      </div>
      
      {discount > 0 && (
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600 dark:text-gray-400">
            Remise ({discount}%)
          </span>
          <span className="text-sm text-green-600 dark:text-green-400">
            -{(basePrice * discount / 100).toFixed(2)}€
          </span>
        </div>
      )}
      
                  <div className="border-t border-gray-200 dark:border-gray-600 pt-2">
        <div className="flex items-center justify-between">
          <span className="font-medium text-gray-900 dark:text-white">
            Prix total
          </span>
          <span className="text-lg font-bold text-blue-600 dark:text-blue-400">
            {currentPrice.toFixed(2)}€
          </span>
        </div>
        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          {pricePerHour > 0 && `${pricePerHour.toFixed(2)}€/heure en moyenne`}
        </div>
      </div>
    </div>
  )
} 
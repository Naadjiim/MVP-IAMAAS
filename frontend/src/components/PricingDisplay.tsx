'use client'

import { useEffect, useState } from 'react'
import { apiService } from '@/services/api'

interface PricingTier {
  duration_hours: number
  final_price: number
  price_per_hour: number
}

interface PricingInfo {
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
      // Trouver le prix pour la durée sélectionnée
      const availableDurations = pricingInfo.pricing_tiers.map(tier => tier.duration_hours).sort((a, b) => a - b)
      
      // Si la durée exacte existe, l'utiliser
      const exactTier = pricingInfo.pricing_tiers.find(tier => tier.duration_hours === durationHours)
      if (exactTier) {
        setCurrentPrice(exactTier.final_price)
        onPriceChange?.(exactTier.final_price)
        return
      }
      
      // Sinon, trouver la durée la plus proche
      const closestDuration = availableDurations.reduce((prev, curr) => 
        Math.abs(curr - durationHours) < Math.abs(prev - durationHours) ? curr : prev
      )
      
      const closestTier = pricingInfo.pricing_tiers.find(tier => tier.duration_hours === closestDuration)
      if (closestTier) {
        setCurrentPrice(closestTier.final_price)
        onPriceChange?.(closestTier.final_price)
      }
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

  const getPriceInfo = () => {
    const exactTier = pricingInfo.pricing_tiers.find(tier => tier.duration_hours === durationHours)
    if (exactTier) {
      return {
        pricePerHour: exactTier.price_per_hour
      }
    }
    
    // Trouver la durée la plus proche
    const availableDurations = pricingInfo.pricing_tiers.map(tier => tier.duration_hours).sort((a, b) => a - b)
    const closestDuration = availableDurations.reduce((prev, curr) => 
      Math.abs(curr - durationHours) < Math.abs(prev - durationHours) ? curr : prev
    )
    
    const closestTier = pricingInfo.pricing_tiers.find(tier => tier.duration_hours === closestDuration)
    return {
      pricePerHour: closestTier?.price_per_hour || 0
    }
  }

  const { pricePerHour } = getPriceInfo()

  return (
    <div className="space-y-2">
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
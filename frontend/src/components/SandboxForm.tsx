'use client'

import React, { useState, useEffect } from 'react'
import { apiService } from '@/services/api'
import SuccessModal from './SuccessModal'
import StripePaymentModal from './StripePaymentModal'

interface SoftwareType {
  id: string
  name: string
  description: string
  base_price_per_hour: number
  is_active: string
}

interface PricingOption {
  duration_hours: number
  price: number
  is_active: string
}

interface PricingInfo {
  [key: string]: {
    software_type_id: string
    base_price_per_hour: number
    pricing_options: PricingOption[]
  }
}

interface SandboxFormData {
  name: string
  duration_hours: number
  description: string
  software_type_id: string
}

export default function SandboxForm() {
  const [formData, setFormData] = useState<SandboxFormData>({
    name: '',
    duration_hours: 24,
    description: '',
    software_type_id: ''
  })
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [createdSandbox, setCreatedSandbox] = useState<any>(null)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [paymentIntent, setPaymentIntent] = useState<any>(null)
  
  // États pour les données dynamiques
  const [softwareTypes, setSoftwareTypes] = useState<SoftwareType[]>([])
  const [pricingInfo, setPricingInfo] = useState<PricingInfo | null>(null)
  const [currentPrice, setCurrentPrice] = useState<number>(0)
  const [pricePerHour, setPricePerHour] = useState<number>(0)

  // Charger les types de logiciels et les prix
  useEffect(() => {
    const loadData = async () => {
      try {
        const [types, pricing] = await Promise.all([
          apiService.getSoftwareTypes(),
          apiService.getPricing()
        ])
        
        setSoftwareTypes(types)
        setPricingInfo(pricing)
        
        // Sélectionner Keycloak par défaut
        const keycloakType = types.find((type: SoftwareType) => type.name.toLowerCase() === 'keycloak')
        if (keycloakType) {
          setFormData((prev: SandboxFormData) => ({ ...prev, software_type_id: keycloakType.id }))
        }
      } catch (error) {
        console.error('Erreur lors du chargement des données:', error)
        setMessage({
          type: 'error',
          text: 'Erreur lors du chargement des données. Veuillez recharger la page.'
        })
      }
    }
    
    loadData()
  }, [])

  // Calculer le prix quand le type de logiciel ou la durée change
  useEffect(() => {
    if (pricingInfo && formData.software_type_id) {
      const selectedType = softwareTypes.find((type: SoftwareType) => type.id === formData.software_type_id)
      if (selectedType) {
        // Essayer plusieurs façons de trouver les données de pricing
        let pricing = null
        
        // Méthode 1: Par nom exact
        if (pricingInfo[selectedType.name]) {
          pricing = pricingInfo[selectedType.name]
        }
        // Méthode 2: Par nom en minuscules
        else if (pricingInfo[selectedType.name.toLowerCase()]) {
          pricing = pricingInfo[selectedType.name.toLowerCase()]
        }
        // Méthode 3: Par ID
        else {
          const pricingEntries = Object.entries(pricingInfo)
          const matchingEntry = pricingEntries.find(([key, data]) => data.software_type_id === selectedType.id)
          if (matchingEntry) {
            pricing = matchingEntry[1]
          }
        }
        
        if (pricing) {
          // Vérifier que pricing_options existe et est un tableau
          if (pricing.pricing_options && Array.isArray(pricing.pricing_options)) {
            const pricingOptions = pricing.pricing_options.filter((option: PricingOption) => option.is_active === "true")
            
            // Trouver le prix pour la durée sélectionnée
            const exactOption = pricingOptions.find((option: PricingOption) => option.duration_hours === formData.duration_hours)
            if (exactOption) {
              setCurrentPrice(exactOption.price)
              setPricePerHour(exactOption.price / exactOption.duration_hours)
            } else {
              // Calculer avec le prix de base
              const calculatedPrice = pricing.base_price_per_hour * formData.duration_hours
              setCurrentPrice(calculatedPrice)
              setPricePerHour(pricing.base_price_per_hour)
            }
          } else {
            // Fallback: utiliser le prix de base
            const calculatedPrice = pricing.base_price_per_hour * formData.duration_hours
            setCurrentPrice(calculatedPrice)
            setPricePerHour(pricing.base_price_per_hour)
          }
        }
      }
    }
  }, [formData.software_type_id, formData.duration_hours, pricingInfo, softwareTypes])

  // Réinitialiser la durée quand le type de logiciel change
  useEffect(() => {
    if (formData.software_type_id) {
      const availableDurations = getAvailableDurations()
      if (availableDurations.length > 0) {
        // Sélectionner la première durée disponible par défaut
        setFormData(prev => ({ ...prev, duration_hours: availableDurations[0].duration_hours }))
      }
    }
  }, [formData.software_type_id, pricingInfo, softwareTypes])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setMessage(null)

    if (!formData.software_type_id) {
      setMessage({
        type: 'error',
        text: 'Veuillez sélectionner un type de logiciel.'
      })
      setIsLoading(false)
      return
    }

    try {
      // Récupérer l'utilisateur connecté pour obtenir l'email
      const currentUser = await apiService.getCurrentUser()
      
      const sandboxData = {
        ...formData,
        email: currentUser.email
      }
      
      const response = await apiService.createSandboxPayment(sandboxData)
      setPaymentIntent({
        ...response,
        sandbox_id: response.payment_intent_id
      })
      setShowPaymentModal(true)
    } catch (error: any) {
      console.error('Erreur détaillée lors de la création de la sandbox:', error)
      console.error('Réponse d\'erreur:', error.response?.data)
      console.error('Status:', error.response?.status)
      
      const errorMessage = error.response?.data?.detail || error.message || 'Erreur lors de la création de la sandbox. Veuillez réessayer.'
      setMessage({
        type: 'error',
        text: errorMessage
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handlePaymentSuccess = (sandbox: any) => {
    setShowPaymentModal(false)
    setPaymentIntent(null)
    setCreatedSandbox(sandbox)
    setShowSuccessModal(true)
    setFormData((prev: SandboxFormData) => ({
      ...prev,
      name: '',
      duration_hours: 24,
      description: ''
    }))
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData((prev: SandboxFormData) => ({
      ...prev,
      [name]: name === 'duration_hours' ? parseInt(value) : value
    }))
  }

  const getAvailableDurations = () => {
    if (!pricingInfo || !formData.software_type_id) {
      return []
    }
    
    const selectedType = softwareTypes.find((type: SoftwareType) => type.id === formData.software_type_id)
    if (!selectedType) {
      return []
    }
    
    // Essayer plusieurs façons de trouver les données de pricing
    let pricingData = null
    
    // Méthode 1: Par nom exact
    if (pricingInfo[selectedType.name]) {
      pricingData = pricingInfo[selectedType.name]
    }
    // Méthode 2: Par nom en minuscules
    else if (pricingInfo[selectedType.name.toLowerCase()]) {
      pricingData = pricingInfo[selectedType.name.toLowerCase()]
    }
    // Méthode 3: Par ID
    else {
      const pricingEntries = Object.entries(pricingInfo)
      const matchingEntry = pricingEntries.find(([key, data]) => data.software_type_id === selectedType.id)
      if (matchingEntry) {
        pricingData = matchingEntry[1]
      }
    }
    
    if (!pricingData) {
      return []
    }
    
    // Vérifier que pricing_options existe et est un tableau
    if (!pricingData.pricing_options || !Array.isArray(pricingData.pricing_options)) {
      return []
    }
    
    const availableOptions = pricingData.pricing_options
      .filter((option: PricingOption) => option.is_active === "true")
      .sort((a: PricingOption, b: PricingOption) => a.duration_hours - b.duration_hours)
    
    return availableOptions
  }

  const formatDuration = (hours: number) => {
    if (hours === 1) return '1 heure'
    if (hours < 24) return `${hours} heures`
    if (hours === 24) return '1 jour'
    if (hours === 48) return '2 jours'
    if (hours === 72) return '3 jours'
    return `${hours} heures`
  }

  return (
    <div className="w-full">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 px-6 py-8 text-white">
          <div className="flex items-center space-x-3">
            <div className="bg-white/20 rounded-lg p-2">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-bold">Créer une sandbox</h1>
              <p className="text-purple-100 mt-1">Déployez automatiquement un environnement pour vos tests et formations</p>
            </div>
          </div>
        </div>

        {/* Form Layout - Two Columns Full Width */}
        <div className="p-8">
          <div className="grid lg:grid-cols-3 gap-12">
            {/* Left Column - Form Fields */}
            <div className="lg:col-span-2 space-y-8">
              <form onSubmit={handleSubmit} className="space-y-8">
                {/* Nom de la sandbox */}
                <div>
                  <label htmlFor="name" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                    Nom de la sandbox *
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    required
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full px-6 py-4 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-colors text-lg"
                    placeholder="ex: Formation-IAM-2024"
                  />
                </div>

                {/* Type de logiciel et Durée de vie en ligne */}
                <div className="grid lg:grid-cols-2 gap-6">
                  {/* Type de logiciel */}
                  <div>
                    <label htmlFor="software_type_id" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                      Type de logiciel *
                    </label>
                    <select
                      id="software_type_id"
                      name="software_type_id"
                      value={formData.software_type_id}
                      onChange={handleChange}
                      required
                      className="w-full px-6 py-4 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors text-lg"
                    >
                      <option value="">Sélectionnez un logiciel</option>
                      {softwareTypes
                        .filter(type => type.is_active === "true")
                        .map(type => (
                          <option key={type.id} value={type.id}>
                            {type.name}
                          </option>
                        ))
                      }
                    </select>
                    {formData.software_type_id && (
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                        {softwareTypes.find(t => t.id === formData.software_type_id)?.description}
                      </p>
                    )}
                  </div>

                  {/* Durée de vie */}
                  <div>
                    <label htmlFor="duration_hours" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                      Durée de vie *
                    </label>
                    <select
                      id="duration_hours"
                      name="duration_hours"
                      value={formData.duration_hours}
                      onChange={handleChange}
                      required
                      disabled={!formData.software_type_id}
                      className="w-full px-6 py-4 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors text-lg disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <option value="">
                        {formData.software_type_id ? 'Sélectionnez une durée' : 'Sélectionnez d\'abord un logiciel'}
                      </option>
                      {getAvailableDurations().map(option => (
                        <option key={option.duration_hours} value={option.duration_hours}>
                          {formatDuration(option.duration_hours)} - {option.price.toFixed(2)}€
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label htmlFor="description" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                    Description (optionnel)
                  </label>
                  <textarea
                    id="description"
                    name="description"
                    rows={5}
                    value={formData.description}
                    onChange={handleChange}
                    className="w-full px-6 py-4 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-colors resize-none text-lg"
                    placeholder="Description de l'usage prévu..."
                  />
                </div>

                {/* Messages d'erreur */}
                {message && (
                  <div className={`p-6 rounded-lg border ${
                    message.type === 'success' 
                      ? 'bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-200 border-green-200 dark:border-green-800' 
                      : 'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200 border-red-200 dark:border-red-800'
                  }`}>
                    <div className="flex items-center">
                      {message.type === 'success' ? (
                        <svg className="w-6 h-6 mr-3" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      ) : (
                        <svg className="w-6 h-6 mr-3" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                      )}
                      <span className="text-lg">{message.text}</span>
                    </div>
                  </div>
                )}

                {/* Bouton de soumission */}
                <div className="flex justify-end pt-6">
                  <button
                    type="submit"
                    disabled={isLoading || !formData.software_type_id}
                    className="px-12 py-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold rounded-lg hover:from-purple-700 hover:to-blue-700 focus:ring-4 focus:ring-purple-300 dark:focus:ring-purple-800 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none transform hover:scale-105 text-lg"
                  >
                    {isLoading ? (
                      <div className="flex items-center">
                        <svg className="animate-spin -ml-1 mr-3 h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Création en cours...
                      </div>
                    ) : (
                      'Créer la sandbox'
                    )}
                  </button>
                </div>
              </form>
            </div>

            {/* Right Column - Cost Estimation */}
            <div className="lg:col-span-1">
              <div className="sticky top-6">
                {currentPrice > 0 ? (
                  <div className="bg-gradient-to-br from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 rounded-xl p-6 border border-green-200 dark:border-green-800 shadow-lg">
                    <div className="text-center mb-6">
                      <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                        Estimation du coût
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {pricePerHour > 0 && `${pricePerHour.toFixed(2)}€/heure en moyenne`}
                      </p>
                    </div>

                    <div className="space-y-4">
                      {/* Prix total */}
                      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            Prix total
                          </span>
                          <span className="text-2xl font-bold text-green-600 dark:text-green-400">
                            {currentPrice.toFixed(2)}€
                          </span>
                        </div>
                      </div>

                      {/* Détails */}
                      <div className="space-y-3">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600 dark:text-gray-400">Type de logiciel</span>
                          <span className="font-medium text-gray-900 dark:text-white">
                            {softwareTypes.find(t => t.id === formData.software_type_id)?.name || 'Non sélectionné'}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600 dark:text-gray-400">Durée</span>
                          <span className="font-medium text-gray-900 dark:text-white">
                            {formatDuration(formData.duration_hours)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600 dark:text-gray-400">Prix par heure</span>
                          <span className="font-medium text-gray-900 dark:text-white">
                            {pricePerHour.toFixed(2)}€
                          </span>
                        </div>
                      </div>

                      {/* Informations supplémentaires */}
                      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
                        <div className="flex items-start space-x-2">
                          <svg className="w-5 h-5 text-blue-500 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <div className="text-xs text-blue-700 dark:text-blue-300">
                            <p className="font-medium mb-1">Inclus dans le prix :</p>
                            <ul className="space-y-1">
                              <li>• Déploiement automatique</li>
                              <li>• Accès administrateur</li>
                              <li>• Support technique</li>
                              <li>• Nettoyage automatique</li>
                            </ul>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-6 border border-gray-200 dark:border-gray-600">
                    <div className="text-center">
                      <div className="w-16 h-16 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                        Estimation du coût
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Sélectionnez un type de logiciel et une durée pour voir l'estimation
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <SuccessModal
        isOpen={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        sandbox={createdSandbox}
        onViewSandboxes={() => {
          setShowSuccessModal(false)
          window.location.href = '/dashboard?tab=list'
        }}
      />
      
      <StripePaymentModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        onSuccess={handlePaymentSuccess}
        paymentIntent={paymentIntent}
        sandboxName={formData.name}
      />
    </div>
  )
} 
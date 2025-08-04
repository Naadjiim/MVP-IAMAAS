'use client'

import { useState, useEffect } from 'react'
import { apiService } from '@/services/api'
import PricingDisplay from './PricingDisplay'
import SuccessModal from './SuccessModal'

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
  const [currentPrice, setCurrentPrice] = useState<number>(0)
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [createdSandbox, setCreatedSandbox] = useState<any>(null)

  // Récupérer l'ID du type de logiciel Keycloak au chargement
  useEffect(() => {
    const loadKeycloakSoftwareType = async () => {
      try {
        const softwareTypes = await apiService.getSoftwareTypes()
        const keycloakType = softwareTypes.find(type => type.name.toLowerCase() === 'keycloak')
        console.log('Types de logiciels chargés:', softwareTypes)
        console.log('Type Keycloak trouvé:', keycloakType)
        if (keycloakType) {
          setFormData(prev => ({ ...prev, software_type_id: keycloakType.id }))
          console.log('software_type_id défini:', keycloakType.id)
        } else {
          console.error('Type Keycloak non trouvé dans la liste')
        }
      } catch (error) {
        console.error('Erreur lors du chargement des types de logiciels:', error)
      }
    }
    
    loadKeycloakSoftwareType()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setMessage(null)

    // Vérifier que software_type_id est défini
    if (!formData.software_type_id) {
      setMessage({
        type: 'error',
        text: 'Erreur : Type de logiciel non défini. Veuillez recharger la page.'
      })
      setIsLoading(false)
      return
    }

    try {
      console.log('Envoi des données:', formData)
      const response = await apiService.createSandbox(formData)
      console.log('Réponse reçue:', response)
      setCreatedSandbox(response)
      setShowSuccessModal(true)
      setFormData(prev => ({
        ...prev,
        name: '',
        duration_hours: 24,
        description: ''
      }))
    } catch (error) {
      console.error('Erreur lors de la création de la sandbox:', error)
      setMessage({
        type: 'error',
        text: 'Erreur lors de la création de la sandbox. Veuillez réessayer.'
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: name === 'duration_hours' ? parseInt(value) : value
    }))
  }

  return (
    <div className="card">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Nom de la sandbox *
          </label>
          <input
            type="text"
            id="name"
            name="name"
            required
            value={formData.name}
            onChange={handleChange}
            className="input-field"
            placeholder="ex: Formation-IAM-2024"
          />
        </div>



        <div>
          <label htmlFor="software_type" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Type de logiciel
          </label>
          <input
            type="text"
            id="software_type"
            name="software_type"
            value="Keycloak"
            disabled
            className="input-field bg-gray-100 dark:bg-gray-600 cursor-not-allowed"
          />
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            D'autres options seront disponibles prochainement
          </p>
          {/* Champ caché pour l'ID du type de logiciel */}
          <input
            type="hidden"
            name="software_type_id"
            value={formData.software_type_id}
          />
        </div>

        <div>
          <label htmlFor="duration_hours" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Durée de vie (heures) *
          </label>
          <select
            id="duration_hours"
            name="duration_hours"
            value={formData.duration_hours}
            onChange={handleChange}
            className="input-field"
          >
            <option value={1}>1 heure</option>
            <option value={2}>2 heures</option>
            <option value={4}>4 heures</option>
            <option value={8}>8 heures</option>
            <option value={24}>24 heures</option>
            <option value={48}>48 heures</option>
            <option value={72}>72 heures</option>
          </select>
        </div>

        <div className="card bg-gray-50 dark:bg-gray-600">
          <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
            💰 Estimation du coût
          </h3>
          <PricingDisplay 
            durationHours={formData.duration_hours} 
            onPriceChange={setCurrentPrice}
          />
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Description (optionnel)
          </label>
          <textarea
            id="description"
            name="description"
            rows={3}
            value={formData.description}
            onChange={handleChange}
            className="input-field"
            placeholder="Description de l'usage prévu..."
          />
        </div>

        {message && (
          <div className={`p-4 rounded-md ${
            message.type === 'success' 
              ? 'bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-200 border border-green-200 dark:border-green-800' 
              : 'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200 border border-red-200 dark:border-red-800'
          }`}>
            {message.text}
          </div>
        )}

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isLoading}
            className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Création en cours...' : 'Créer la sandbox'}
          </button>
        </div>
      </form>
      
      <SuccessModal
        isOpen={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        sandbox={createdSandbox}
        onViewSandboxes={() => {
          setShowSuccessModal(false)
          // Naviguer vers la liste des sandboxes
          window.location.href = '/?tab=list'
        }}
      />
    </div>
  )
} 
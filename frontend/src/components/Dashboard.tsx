'use client'

import { useState, useEffect } from 'react'
import { apiService } from '@/services/api'
import { 
  CubeIcon, 
  ClockIcon, 
  ExclamationTriangleIcon,
  PlusIcon,
  EyeIcon,
  TrashIcon
} from '@heroicons/react/24/outline'

interface Sandbox {
  id: string
  name: string
  status: 'running' | 'stopped' | 'expired'
  created_at: string
  expires_at: string
  price: number
  software_type: 'keycloak'
}

export default function Dashboard() {
  const [sandboxes, setSandboxes] = useState<Sandbox[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [stats, setStats] = useState({
    total: 0,
    running: 0,
    stopped: 0,
    expired: 0,
    totalCost: 0
  })

  useEffect(() => {
    loadSandboxes()
  }, [])

  useEffect(() => {
    calculateStats()
  }, [sandboxes])

  const loadSandboxes = async () => {
    try {
      const data = await apiService.getSandboxes()
      setSandboxes(data)
    } catch (err) {
      console.error('Erreur lors du chargement des sandboxes:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const calculateStats = () => {
    const total = sandboxes.length
    const running = sandboxes.filter(s => s.status === 'running').length
    const stopped = sandboxes.filter(s => s.status === 'stopped').length
    const expired = sandboxes.filter(s => s.status === 'expired').length
    const totalCost = sandboxes.reduce((sum, s) => sum + s.price, 0)

    setStats({ total, running, stopped, expired, totalCost })
  }

  const getRecentSandboxes = () => {
    return sandboxes
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 5)
  }

  const getExpiringSoon = () => {
    const now = new Date()
    const in24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000)
    
    return sandboxes.filter(sandbox => {
      const expiresAt = new Date(sandbox.expires_at)
      return sandbox.status === 'running' && expiresAt <= in24Hours && expiresAt > now
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running':
        return 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
      case 'stopped':
        return 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200'
      case 'expired':
        return 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200'
      default:
        return 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'running':
        return 'En cours'
      case 'stopped':
        return 'Arrêtée'
      case 'expired':
        return 'Expirée'
      default:
        return 'Inconnu'
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-500 dark:text-gray-400">Chargement...</div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* En-tête */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Tableau de bord</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Bienvenue ! Voici un aperçu de vos sandboxes et de votre activité.
        </p>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <CubeIcon className="h-8 w-8 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total sandboxes</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">{stats.total}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="h-8 w-8 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                <div className="h-3 w-3 bg-green-600 dark:bg-green-400 rounded-full"></div>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">En cours</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">{stats.running}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="h-8 w-8 bg-yellow-100 dark:bg-yellow-900 rounded-full flex items-center justify-center">
                <div className="h-3 w-3 bg-yellow-600 dark:bg-yellow-400 rounded-full"></div>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Arrêtées</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">{stats.stopped}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="h-8 w-8 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center">
                <div className="h-3 w-3 bg-red-600 dark:bg-red-400 rounded-full"></div>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Expirées</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">{stats.expired}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Actions rapides */}
      <div className="card">
        <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Actions rapides</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={() => window.location.href = '/?tab=create'}
            className="flex items-center justify-center p-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-blue-500 dark:hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
          >
            <PlusIcon className="h-6 w-6 text-gray-400 mr-2" />
            <span className="text-gray-600 dark:text-gray-400">Créer une sandbox</span>
          </button>
          
          <button
            onClick={() => window.location.href = '/?tab=list'}
            className="flex items-center justify-center p-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-blue-500 dark:hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
          >
            <EyeIcon className="h-6 w-6 text-gray-400 mr-2" />
            <span className="text-gray-600 dark:text-gray-400">Voir mes sandboxes</span>
          </button>

          <button
            onClick={() => window.location.href = '/profile'}
            className="flex items-center justify-center p-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-blue-500 dark:hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
          >
            <svg className="h-6 w-6 text-gray-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <span className="text-gray-600 dark:text-gray-400">Mon profil</span>
          </button>
        </div>
      </div>

      {/* Alertes */}
      {getExpiringSoon().length > 0 && (
        <div className="card border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-900/20">
          <div className="flex items-center">
            <ExclamationTriangleIcon className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mr-2" />
            <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
              {getExpiringSoon().length} sandbox{getExpiringSoon().length > 1 ? 's' : ''} expire{getExpiringSoon().length > 1 ? 'nt' : ''} dans les 24h
            </h3>
          </div>
          <div className="mt-3">
            <div className="text-sm text-yellow-700 dark:text-yellow-300">
              {getExpiringSoon().map(sandbox => (
                <div key={sandbox.id} className="flex items-center justify-between py-1">
                  <span>{sandbox.name}</span>
                  <span>Expire le {formatDate(sandbox.expires_at)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Sandboxes récentes */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white">Sandboxes récentes</h2>
          <button
            onClick={() => window.location.href = '/?tab=list'}
            className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
          >
            Voir tout
          </button>
        </div>
        
        {getRecentSandboxes().length === 0 ? (
          <div className="text-center py-8">
            <CubeIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400">Aucune sandbox créée</p>
            <button
              onClick={() => window.location.href = '/?tab=create'}
              className="mt-2 btn-primary"
            >
              Créer votre première sandbox
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {getRecentSandboxes().map((sandbox) => (
              <div key={sandbox.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0">
                    <CubeIcon className="h-5 w-5 text-gray-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{sandbox.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Créée le {formatDate(sandbox.created_at)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(sandbox.status)}`}>
                    {getStatusText(sandbox.status)}
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {sandbox.price.toFixed(2)} €
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
} 
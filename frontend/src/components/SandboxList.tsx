'use client'

import { useState, useEffect } from 'react'
import { apiService } from '@/services/api'
import { ClockIcon, TrashIcon, EyeIcon } from '@heroicons/react/24/outline'
import DeleteModal from './DeleteModal'
import SandboxFilters, { SandboxFilters as SandboxFiltersType } from './SandboxFilters'

interface Sandbox {
  id: string
  name: string
  email: string
  status: 'running' | 'stopped' | 'expired'
  price: number
  user_id: string
  software_type: 'keycloak'
  created_at: string
  expires_at: string
  access_url: string
  admin_username?: string
  container_id?: string
  description?: string
}

export default function SandboxList() {
  const [sandboxes, setSandboxes] = useState<Sandbox[]>([])
  const [filteredSandboxes, setFilteredSandboxes] = useState<Sandbox[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filters, setFilters] = useState<SandboxFiltersType>({})
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean
    sandboxId: string | null
    sandboxName: string
    isLoading: boolean
  }>({
    isOpen: false,
    sandboxId: null,
    sandboxName: '',
    isLoading: false
  })

  useEffect(() => {
    loadSandboxes()
  }, [])

  // Appliquer les filtres quand les sandboxes ou les filtres changent
  useEffect(() => {
    let filtered = [...sandboxes]

    // Filtre par recherche
    if (filters.search) {
      filtered = filtered.filter(sandbox =>
        sandbox.name.toLowerCase().includes(filters.search!.toLowerCase())
      )
    }

    // Filtre par statut
    if (filters.status) {
      filtered = filtered.filter(sandbox => sandbox.status === filters.status)
    }

    // Filtre par type de logiciel
    if (filters.software_type) {
      filtered = filtered.filter(sandbox => sandbox.software_type === filters.software_type)
    }

    setFilteredSandboxes(filtered)
  }, [sandboxes, filters])

  const loadSandboxes = async () => {
    try {
      const data = await apiService.getSandboxes()
      setSandboxes(data)
    } catch (err) {
      setError('Erreur lors du chargement des sandboxes')
    } finally {
      setIsLoading(false)
    }
  }

  const handleFiltersChange = (newFilters: SandboxFiltersType) => {
    setFilters(newFilters)
  }

  const handleDeleteClick = (id: string, name: string) => {
    setDeleteModal({
      isOpen: true,
      sandboxId: id,
      sandboxName: name,
      isLoading: false
    })
  }

  const handleDeleteConfirm = async () => {
    if (!deleteModal.sandboxId) return

    setDeleteModal(prev => ({ ...prev, isLoading: true }))

    try {
      await apiService.deleteSandbox(deleteModal.sandboxId)
      setSandboxes(prev => prev.filter(sb => sb.id !== deleteModal.sandboxId))
      setDeleteModal({
        isOpen: false,
        sandboxId: null,
        sandboxName: '',
        isLoading: false
      })
    } catch (err) {
      alert('Erreur lors de la suppression')
      setDeleteModal(prev => ({ ...prev, isLoading: false }))
    }
  }

  const handleDeleteCancel = () => {
    setDeleteModal({
      isOpen: false,
      sandboxId: null,
      sandboxName: '',
      isLoading: false
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
        return 'bg-gray-100 dark:bg-gray-600 text-gray-800 dark:text-gray-200'
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
    return new Date(dateString).toLocaleString('fr-FR')
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-500">Chargement...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center">
        <div className="text-red-600 mb-4">{error}</div>
        <button onClick={loadSandboxes} className="btn-primary">
          Réessayer
        </button>
      </div>
    )
  }

  if (sandboxes.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-500 mb-4">Aucune sandbox trouvée</div>
        <p className="text-gray-400">Créez votre première sandbox pour commencer</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Mes sandboxes</h2>
        <button onClick={loadSandboxes} className="btn-secondary">
          Actualiser
        </button>
      </div>

      {/* Filtres */}
      <SandboxFilters
        filters={filters}
        onFiltersChange={handleFiltersChange}
        activeFiltersCount={Object.keys(filters).filter(key => filters[key as keyof SandboxFiltersType]).length}
      />

      {/* Résultats */}
      <div className="flex justify-between items-center">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {filteredSandboxes.length} sandbox{filteredSandboxes.length !== 1 ? 's' : ''} trouvée{filteredSandboxes.length !== 1 ? 's' : ''}
        </p>
      </div>

      {filteredSandboxes.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-500 mb-4">Aucune sandbox ne correspond aux filtres</div>
          <button onClick={() => setFilters({})} className="btn-secondary">
            Effacer les filtres
          </button>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredSandboxes.map((sandbox) => (
            <div key={sandbox.id} className="card">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
                  {sandbox.name}
                </h3>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(sandbox.status)}`}>
                  {getStatusText(sandbox.status)}
                </span>
              </div>

              {sandbox.description && (
                <p className="text-gray-600 dark:text-gray-300 text-sm mb-4 line-clamp-2">
                  {sandbox.description}
                </p>
              )}

              <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400 mb-4">
                <div className="flex items-center">
                  <ClockIcon className="h-4 w-4 mr-2" />
                  <span>Créée le {formatDate(sandbox.created_at)}</span>
                </div>
                <div className="flex items-center">
                  <ClockIcon className="h-4 w-4 mr-2" />
                  <span>Expire le {formatDate(sandbox.expires_at)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded">
                    {sandbox.software_type}
                  </span>
                  <span className="text-xs font-medium text-green-600 dark:text-green-400">
                    {sandbox.price.toFixed(2)} €
                  </span>
                </div>
              </div>

              <div className="flex space-x-2">
                {sandbox.status === 'running' && (
                  <a
                    href={sandbox.access_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-primary flex-1 flex items-center justify-center"
                  >
                    <EyeIcon className="h-4 w-4 mr-2" />
                    Accéder
                  </a>
                )}
                <button
                  onClick={() => handleDeleteClick(sandbox.id, sandbox.name)}
                  className="btn-secondary flex items-center justify-center px-3"
                  title="Supprimer"
                >
                  <TrashIcon className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modale de suppression */}
      <DeleteModal
        isOpen={deleteModal.isOpen}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        sandboxName={deleteModal.sandboxName}
        isLoading={deleteModal.isLoading}
      />
    </div>
  )
} 
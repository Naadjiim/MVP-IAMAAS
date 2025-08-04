'use client'

import { useState } from 'react'
import { FunnelIcon, XMarkIcon } from '@heroicons/react/24/outline'

export interface SandboxFilters {
  status?: 'running' | 'stopped' | 'expired'
  software_type?: 'keycloak'
  search?: string
}

interface SandboxFiltersProps {
  filters: SandboxFilters
  onFiltersChange: (filters: SandboxFilters) => void
  activeFiltersCount: number
}

export default function SandboxFilters({ filters, onFiltersChange, activeFiltersCount }: SandboxFiltersProps) {
  const [isOpen, setIsOpen] = useState(false)

  const handleFilterChange = (key: keyof SandboxFilters, value: string | undefined) => {
    const newFilters = { ...filters }
    if (value && value !== 'all') {
      newFilters[key] = value as any
    } else {
      delete newFilters[key]
    }
    onFiltersChange(newFilters)
  }

  const clearAllFilters = () => {
    onFiltersChange({})
  }

  const getActiveFiltersCount = () => {
    return Object.keys(filters).filter(key => filters[key as keyof SandboxFilters]).length
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 mb-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <FunnelIcon className="h-5 w-5 text-gray-500 dark:text-gray-400" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">Filtres</h3>
          {getActiveFiltersCount() > 0 && (
            <span className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs font-medium px-2 py-1 rounded-full">
              {getActiveFiltersCount()}
            </span>
          )}
        </div>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
        >
          {isOpen ? 'Masquer' : 'Afficher'}
        </button>
      </div>

      {isOpen && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Recherche */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Rechercher
              </label>
              <input
                type="text"
                placeholder="Nom de la sandbox..."
                value={filters.search || ''}
                onChange={(e) => handleFilterChange('search', e.target.value || undefined)}
                className="input-field"
              />
            </div>

            {/* Statut */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Statut
              </label>
              <select
                value={filters.status || 'all'}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="input-field"
              >
                <option value="all">Tous les statuts</option>
                <option value="running">En cours</option>
                <option value="stopped">Arrêté</option>
                <option value="expired">Expiré</option>
              </select>
            </div>

            {/* Type de logiciel */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Type de logiciel
              </label>
              <select
                value={filters.software_type || 'all'}
                onChange={(e) => handleFilterChange('software_type', e.target.value)}
                className="input-field"
              >
                <option value="all">Tous les types</option>
                <option value="keycloak">Keycloak</option>
              </select>
            </div>
          </div>

          {/* Boutons d'action */}
          <div className="flex justify-between items-center pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={clearAllFilters}
              disabled={getActiveFiltersCount() === 0}
              className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <XMarkIcon className="h-4 w-4" />
              <span>Effacer tous les filtres</span>
            </button>
          </div>
        </div>
      )}
    </div>
  )
} 
'use client'

import { useState, useEffect } from 'react'
import { apiService } from '@/services/api'
import ConfirmModal from './ConfirmModal'
import ErrorModal from './ErrorModal'

interface Sandbox {
  id: string
  name: string
  email: string
  duration_hours: number
  status: 'running' | 'stopped' | 'expired'
  price: number
  user_id: string
  software_type_id: string
  created_at: string
  expires_at: string
  access_url: string
  admin_username?: string
  container_id?: string
  description?: string
}

interface User {
  id: string
  name: string
  email: string
}

export default function AdminSandboxList() {
  const [sandboxes, setSandboxes] = useState<Sandbox[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showErrorModal, setShowErrorModal] = useState(false)
  const [selectedSandbox, setSelectedSandbox] = useState<Sandbox | null>(null)
  const [errorDetails, setErrorDetails] = useState<{ title: string; message: string; details?: string } | null>(null)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      const [sandboxesData, usersData] = await Promise.all([
        apiService.getAllSandboxes(),
        apiService.getUsers()
      ])
      setSandboxes(sandboxesData)
      setUsers(usersData)
    } catch (err) {
      setError('Erreur lors du chargement des données')
      console.error('Erreur:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteSandbox = (sandbox: Sandbox) => {
    setSelectedSandbox(sandbox)
    setShowDeleteModal(true)
  }

  const confirmDeleteSandbox = async () => {
    if (!selectedSandbox) return

    try {
      await apiService.deleteSandbox(selectedSandbox.id)
      setSandboxes(sandboxes.filter(s => s.id !== selectedSandbox.id))
      setSelectedSandbox(null)
    } catch (err: any) {
      console.error('Erreur lors de la suppression:', err)
      setErrorDetails({
        title: 'Erreur lors de la suppression',
        message: 'Impossible de supprimer cette sandbox.',
        details: err.response?.data?.detail || err.message
      })
      setShowErrorModal(true)
    }
  }

  const getUserName = (userId: string) => {
    const user = users.find(u => u.id === userId)
    return user ? user.name : 'Utilisateur inconnu'
  }

  const getUserEmail = (userId: string) => {
    const user = users.find(u => u.id === userId)
    return user ? user.email : 'Email inconnu'
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running':
        return 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
      case 'stopped':
        return 'bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200'
      case 'expired':
        return 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200'
      default:
        return 'bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200'
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
        return status
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-4">
        <p className="text-red-800 dark:text-red-200">{error}</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          Toutes les sandboxes ({sandboxes.length})
        </h2>
        <button
          onClick={loadData}
          className="btn-primary text-sm"
        >
          Actualiser
        </button>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Sandbox
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Utilisateur
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Statut
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Prix
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Créée le
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Expire le
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
              {sandboxes.map((sandbox) => (
                <tr key={sandbox.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {sandbox.name}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {sandbox.description || 'Aucune description'}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {getUserName(sandbox.user_id)}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {getUserEmail(sandbox.user_id)}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(sandbox.status)}`}>
                      {getStatusText(sandbox.status)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {sandbox.price.toFixed(2)}€
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {formatDate(sandbox.created_at)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {formatDate(sandbox.expires_at)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    {sandbox.access_url && (
                      <a
                        href={sandbox.access_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                      >
                        Accéder
                      </a>
                    )}
                    <button
                      onClick={() => window.location.href = `/sandbox/${sandbox.id}`}
                      className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300"
                    >
                      Détails
                    </button>
                    <button
                      onClick={() => handleDeleteSandbox(sandbox)}
                      className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300"
                    >
                      Supprimer
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={confirmDeleteSandbox}
        title="Supprimer la sandbox"
        message={`Êtes-vous sûr de vouloir supprimer la sandbox "${selectedSandbox?.name}" ? Cette action est irréversible.`}
        confirmText="Supprimer"
        cancelText="Annuler"
        type="danger"
      />

      {errorDetails && (
        <ErrorModal
          isOpen={showErrorModal}
          onClose={() => setShowErrorModal(false)}
          title={errorDetails.title}
          message={errorDetails.message}
          details={errorDetails.details}
        />
      )}
    </div>
  )
} 
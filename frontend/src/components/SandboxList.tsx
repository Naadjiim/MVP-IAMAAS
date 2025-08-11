'use client'

import { useState, useEffect } from 'react'
import { apiService } from '@/services/api'
import ConfirmModal from './ConfirmModal'
import ErrorModal from './ErrorModal'
import SuccessModal from './SuccessModal'

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
  admin_password?: string
  container_id?: string
  description?: string
}

export default function SandboxList() {
  const [sandboxes, setSandboxes] = useState<Sandbox[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [sandboxToDelete, setSandboxToDelete] = useState<Sandbox | null>(null)
  const [fixPasswordModalOpen, setFixPasswordModalOpen] = useState(false)
  const [sandboxToFix, setSandboxToFix] = useState<Sandbox | null>(null)
  const [fixingPassword, setFixingPassword] = useState(false)
  const [visiblePasswords, setVisiblePasswords] = useState<Set<string>>(new Set())

  useEffect(() => {
    fetchSandboxes()
  }, [])

  const fetchSandboxes = async () => {
    try {
      setLoading(true)
      const data = await apiService.getSandboxes()
      setSandboxes(data)
    } catch (err) {
      setError('Erreur lors du chargement des sandboxes')
      console.error('Erreur:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = (sandbox: Sandbox) => {
    setSandboxToDelete(sandbox)
    setDeleteModalOpen(true)
  }

  const confirmDelete = async () => {
    if (!sandboxToDelete) return

    try {
      await apiService.deleteSandbox(sandboxToDelete.id)
      setSandboxes(sandboxes.filter(s => s.id !== sandboxToDelete.id))
      setDeleteModalOpen(false)
      setSandboxToDelete(null)
    } catch (err) {
      setError('Erreur lors de la suppression')
      console.error('Erreur:', err)
    }
  }

  const handleFixPassword = (sandbox: Sandbox) => {
    setSandboxToFix(sandbox)
    setFixPasswordModalOpen(true)
  }

  const confirmFixPassword = async () => {
    if (!sandboxToFix) return

    try {
      setFixingPassword(true)
      // Note: Il n'y a pas de méthode spécifique pour fix-password dans apiService
      // On utilise une requête directe pour l'instant
      const response = await fetch(`/api/v1/sandboxes/${sandboxToFix.id}/fix-password`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          'Content-Type': 'application/json'
        }
      })
      
      if (!response.ok) {
        throw new Error('Erreur lors de la correction du mot de passe')
      }
      
      const updatedSandbox = await response.json()
      
      // Mettre à jour la sandbox dans la liste
      setSandboxes(sandboxes.map(s => 
        s.id === sandboxToFix.id ? updatedSandbox : s
      ))
      
      setFixPasswordModalOpen(false)
      setSandboxToFix(null)
    } catch (err) {
      setError('Erreur lors de la correction du mot de passe')
      console.error('Erreur:', err)
    } finally {
      setFixingPassword(false)
    }
  }

  const togglePasswordVisibility = (sandboxId: string) => {
    const newVisiblePasswords = new Set(visiblePasswords)
    if (newVisiblePasswords.has(sandboxId)) {
      newVisiblePasswords.delete(sandboxId)
    } else {
      newVisiblePasswords.add(sandboxId)
    }
    setVisiblePasswords(newVisiblePasswords)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('fr-FR')
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running':
        return 'text-green-600 bg-green-100'
      case 'stopped':
        return 'text-red-600 bg-red-100'
      case 'expired':
        return 'text-gray-600 bg-gray-100'
      default:
        return 'text-gray-600 bg-gray-100'
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (sandboxes.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Aucune sandbox trouvée</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {sandboxes.map((sandbox) => (
        <div key={sandbox.id} className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {sandbox.name}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {sandbox.description || 'Aucune description'}
              </p>
              
              <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium text-gray-700 dark:text-gray-300">Statut:</span>
                  <span className={`ml-2 px-2 py-1 rounded-full text-xs ${getStatusColor(sandbox.status)}`}>
                    {sandbox.status}
                  </span>
                </div>
                <div>
                  <span className="font-medium text-gray-700 dark:text-gray-300">Durée:</span>
                  <span className="ml-2 text-gray-900 dark:text-white">{sandbox.duration_hours}h</span>
                </div>
                <div>
                  <span className="font-medium text-gray-700 dark:text-gray-300">Prix:</span>
                  <span className="ml-2 text-gray-900 dark:text-white">{sandbox.price}€</span>
                </div>
                <div>
                  <span className="font-medium text-gray-700 dark:text-gray-300">Expire le:</span>
                  <span className="ml-2 text-gray-900 dark:text-white">
                    {formatDate(sandbox.expires_at)}
                  </span>
                </div>
              </div>

              {sandbox.admin_username && (
                <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-md">
                  <h4 className="font-medium text-gray-900 dark:text-white mb-2">Identifiants d'accès:</h4>
                  <div className="space-y-1 text-sm">
                    <div>
                      <span className="font-medium text-gray-700 dark:text-gray-300">Utilisateur:</span>
                      <span className="ml-2 text-gray-900 dark:text-white">{sandbox.admin_username}</span>
                    </div>
                    <div className="flex items-center">
                      <span className="font-medium text-gray-700 dark:text-gray-300">Mot de passe:</span>
                      <span className="ml-2 text-gray-900 dark:text-white">
                        {visiblePasswords.has(sandbox.id) 
                          ? (sandbox.admin_password || 'Non disponible')
                          : '••••••••••••••••'
                        }
                      </span>
                      <button
                        onClick={() => togglePasswordVisibility(sandbox.id)}
                        className="ml-2 px-2 py-1 text-xs bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors"
                        title={visiblePasswords.has(sandbox.id) ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                      >
                        {visiblePasswords.has(sandbox.id) ? "Masquer" : "Voir"}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {sandbox.access_url && (
                <div className="mt-4">
                  <a
                    href={sandbox.access_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                  >
                    Accéder à la sandbox
                  </a>
                </div>
              )}
            </div>

            <div className="flex space-x-2 ml-4">
              {sandbox.status === 'running' && sandbox.admin_password === 'admin' && (
                <button
                  onClick={() => handleFixPassword(sandbox)}
                  className="px-3 py-1 text-sm bg-yellow-600 text-white rounded hover:bg-yellow-700 transition-colors"
                >
                  Corriger mot de passe
                </button>
              )}
              <button
                onClick={() => handleDelete(sandbox)}
                className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
              >
                Supprimer
              </button>
            </div>
          </div>
        </div>
      ))}

      {/* Modal de confirmation de suppression */}
      <ConfirmModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={confirmDelete}
        title="Confirmer la suppression"
        message={`Êtes-vous sûr de vouloir supprimer la sandbox "${sandboxToDelete?.name}" ?`}
      />

      {/* Modal de confirmation de correction du mot de passe */}
      <ConfirmModal
        isOpen={fixPasswordModalOpen}
        onClose={() => setFixPasswordModalOpen(false)}
        onConfirm={confirmFixPassword}
        title="Corriger le mot de passe"
        message={`Voulez-vous corriger le mot de passe de la sandbox "${sandboxToFix?.name}" ?`}
        confirmText={fixingPassword ? "Correction en cours..." : "Corriger"}
        disabled={fixingPassword}
      />

      {/* Modal d'erreur */}
      <ErrorModal
        isOpen={!!error}
        onClose={() => setError(null)}
        message={error || ''}
      />
    </div>
  )
} 
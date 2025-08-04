'use client'

import { useState, useEffect } from 'react'
import { apiService } from '@/services/api'
import ConfirmModal from './ConfirmModal'
import ErrorModal from './ErrorModal'

interface User {
  id: string
  email: string
  name: string
  roles: string[]
  is_active: boolean
  is_verified: boolean
  created_at: string
}

export default function UserManagement() {
  const [users, setUsers] = useState<User[]>([])
  const [roles, setRoles] = useState<{id: string, name: string, description: string}[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showDeactivateModal, setShowDeactivateModal] = useState(false)
  const [showErrorModal, setShowErrorModal] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [errorDetails, setErrorDetails] = useState<{ title: string; message: string; details?: string } | null>(null)

  useEffect(() => {
    loadUsers()
  }, [])

  const loadUsers = async () => {
    try {
      setLoading(true)
      const [usersData, rolesData] = await Promise.all([
        apiService.getUsers(),
        apiService.getRoles()
      ])
      setUsers(usersData)
      setRoles(rolesData)
    } catch (err) {
      setError('Erreur lors du chargement des données')
      console.error('Erreur:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleAddRole = async (userId: string, roleName: string) => {
    try {
      await apiService.addRoleToUser(userId, roleName)
      await loadUsers() // Recharger la liste
    } catch (err) {
      setError('Erreur lors de l\'ajout du rôle')
      console.error('Erreur:', err)
    }
  }

  const handleRemoveRole = async (userId: string, roleName: string) => {
    try {
      await apiService.removeRoleFromUser(userId, roleName)
      await loadUsers() // Recharger la liste
    } catch (err) {
      setError('Erreur lors de la suppression du rôle')
      console.error('Erreur:', err)
    }
  }

  const handleToggleUserStatus = async (userId: string, isActive: boolean) => {
    try {
      if (isActive) {
        await apiService.activateUser(userId)
      } else {
        await apiService.deactivateUser(userId)
      }
      await loadUsers() // Recharger la liste
    } catch (err: any) {
      console.error('Erreur lors de la mise à jour du statut:', err)
      setErrorDetails({
        title: 'Erreur lors de la mise à jour du statut',
        message: 'Impossible de modifier le statut de cet utilisateur.',
        details: err.response?.data?.detail || err.message
      })
      setShowErrorModal(true)
    }
  }

  const handleDeleteUser = async (userId: string) => {
    const user = users.find(u => u.id === userId)
    if (!user) return

    setSelectedUser(user)
    setShowDeleteModal(true)
  }

  const confirmDeleteUser = async () => {
    if (!selectedUser) return

    try {
      await apiService.deleteUser(selectedUser.id)
      await loadUsers() // Recharger la liste
      setSelectedUser(null)
    } catch (err: any) {
      console.error('Erreur lors de la suppression:', err)
      setErrorDetails({
        title: 'Erreur lors de la suppression',
        message: 'Impossible de supprimer cet utilisateur.',
        details: err.response?.data?.detail || err.message
      })
      setShowErrorModal(true)
    }
  }

  const handleDeactivateUser = async (userId: string) => {
    const user = users.find(u => u.id === userId)
    if (!user) return

    setSelectedUser(user)
    setShowDeactivateModal(true)
  }

  const confirmDeactivateUser = async () => {
    if (!selectedUser) return

    try {
      await apiService.deactivateUser(selectedUser.id)
      await loadUsers() // Recharger la liste
      setSelectedUser(null)
    } catch (err: any) {
      console.error('Erreur lors de la désactivation:', err)
      setErrorDetails({
        title: 'Erreur lors de la désactivation',
        message: 'Impossible de désactiver cet utilisateur.',
        details: err.response?.data?.detail || err.message
      })
      setShowErrorModal(true)
    }
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
          Gestion des utilisateurs ({users.length})
        </h2>
        <button
          onClick={loadUsers}
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
                  Utilisateur
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Rôle
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Statut
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Créé le
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                          <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
                            {user.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {user.name}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {user.email}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-wrap gap-1">
                      {user.roles.map((role) => (
                        <span
                          key={role}
                          className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200"
                        >
                          {role}
                          <button
                            onClick={() => handleRemoveRole(user.id, role)}
                            className="ml-1 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                      <select
                        onChange={(e) => {
                          if (e.target.value) {
                            handleAddRole(user.id, e.target.value)
                            e.target.value = ''
                          }
                        }}
                        className="text-sm border border-gray-300 dark:border-gray-600 rounded px-2 py-1 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                      >
                        <option value="">+ Ajouter</option>
                        {roles.map((role) => (
                          <option key={role.id} value={role.name}>
                            {role.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      user.is_active
                        ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
                        : 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200'
                    }`}>
                      {user.is_active ? 'Actif' : 'Inactif'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {formatDate(user.created_at)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    <button
                      onClick={() => user.is_active ? handleDeactivateUser(user.id) : handleToggleUserStatus(user.id, true)}
                      className={`text-sm px-3 py-1 rounded ${
                        user.is_active
                          ? 'text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300'
                          : 'text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-300'
                      }`}
                    >
                      {user.is_active ? 'Désactiver' : 'Activer'}
                    </button>
                    <button
                      onClick={() => handleDeleteUser(user.id)}
                      className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 text-sm px-3 py-1 rounded"
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
        onConfirm={confirmDeleteUser}
        title="Supprimer l'utilisateur"
        message={`Êtes-vous sûr de vouloir supprimer l'utilisateur "${selectedUser?.name}" ? Cette action est irréversible.`}
        confirmText="Supprimer"
        cancelText="Annuler"
        type="danger"
      />

      <ConfirmModal
        isOpen={showDeactivateModal}
        onClose={() => setShowDeactivateModal(false)}
        onConfirm={confirmDeactivateUser}
        title="Désactiver l'utilisateur"
        message={`Êtes-vous sûr de vouloir désactiver l'utilisateur "${selectedUser?.name}" ? Il ne pourra plus se connecter à l'application.`}
        confirmText="Désactiver"
        cancelText="Annuler"
        type="warning"
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
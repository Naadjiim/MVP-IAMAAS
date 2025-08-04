'use client'

import { useState, useEffect } from 'react'
import { apiService } from '@/services/api'
import { UserIcon, TrashIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline'
import { Dialog, Transition } from '@headlessui/react'
import { Fragment } from 'react'

interface User {
  id: string
  name: string
  email: string
  avatar?: string
  is_active: boolean
  is_verified: boolean
  created_at: string
}

export default function UserProfilePage() {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isUpdating, setIsUpdating] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [formData, setFormData] = useState({
    name: ''
  })
  const [passwordFormData, setPasswordFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  const [passwordError, setPasswordError] = useState<string | null>(null)

  useEffect(() => {
    loadUserProfile()
  }, [])

  const loadUserProfile = async () => {
    try {
      const userData = await apiService.getCurrentUser()
      setUser(userData)
      setFormData({ name: userData.name })
    } catch (err) {
      setError('Erreur lors du chargement du profil')
    } finally {
      setIsLoading(false)
    }
  }

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsUpdating(true)
    setError(null)
    setSuccess(null)

    try {
      const updatedUser = await apiService.updateProfile(formData.name)
      setUser(updatedUser)
      setSuccess('Profil mis à jour avec succès')
    } catch (err) {
      setError('Erreur lors de la mise à jour du profil')
    } finally {
      setIsUpdating(false)
    }
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsChangingPassword(true)
    setError(null)
    setSuccess(null)
    setPasswordError(null)

    // Vérifier que les mots de passe correspondent
    if (passwordFormData.newPassword !== passwordFormData.confirmPassword) {
      setPasswordError('Les nouveaux mots de passe ne correspondent pas')
      setIsChangingPassword(false)
      return
    }

    // Vérifier la longueur du mot de passe
    if (passwordFormData.newPassword.length < 6) {
      setPasswordError('Le nouveau mot de passe doit contenir au moins 6 caractères')
      setIsChangingPassword(false)
      return
    }

    // Vérifier que le nouveau mot de passe est différent de l'ancien
    if (passwordFormData.currentPassword === passwordFormData.newPassword) {
      setPasswordError('Le nouveau mot de passe doit être différent de l\'ancien')
      setIsChangingPassword(false)
      return
    }

    try {
      await apiService.changePassword(passwordFormData.currentPassword, passwordFormData.newPassword)
      setSuccess('Mot de passe modifié avec succès')
      setShowPasswordModal(false)
      setPasswordFormData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      })
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || 'Une erreur inattendue s\'est produite lors de la modification du mot de passe. Veuillez réessayer.'
      setPasswordError(errorMessage)
    } finally {
      setIsChangingPassword(false)
    }
  }

  const handleDeleteAccount = async () => {
    setIsDeleting(true)
    try {
      await apiService.deleteAccount()
      localStorage.removeItem('auth_token')
      window.location.href = '/'
    } catch (err) {
      setError('Erreur lors de la suppression du compte')
      setIsDeleting(false)
      setShowDeleteModal(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
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

  if (!user) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 dark:text-red-400 mb-4">Erreur lors du chargement du profil</div>
        <button onClick={loadUserProfile} className="btn-primary">
          Réessayer
        </button>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* En-tête */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Mon Profil</h1>
        <p className="text-gray-600 dark:text-gray-400">Gérez vos informations personnelles</p>
      </div>

      {/* Messages d'erreur/succès */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="text-red-800 dark:text-red-200">{error}</div>
        </div>
      )}

      {success && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
          <div className="text-green-800 dark:text-green-200">{success}</div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Informations du profil */}
        <div className="lg:col-span-2 space-y-6">
          {/* Avatar et informations de base */}
          <div className="card">
            <div className="flex items-center space-x-4 mb-6">
              <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                {user.avatar ? (
                  <img src={user.avatar} alt={user.name} className="w-16 h-16 rounded-full" />
                ) : (
                  <UserIcon className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                )}
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{user.name}</h2>
                <p className="text-gray-600 dark:text-gray-400">{user.email}</p>
                <div className="flex items-center space-x-2 mt-1">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    user.is_active 
                      ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200' 
                      : 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200'
                  }`}>
                    {user.is_active ? 'Actif' : 'Inactif'}
                  </span>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    user.is_verified 
                      ? 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200' 
                      : 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200'
                  }`}>
                    {user.is_verified ? 'Vérifié' : 'Non vérifié'}
                  </span>
                </div>
              </div>
            </div>

            <div className="border-t border-gray-200 dark:border-gray-600 pt-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Membre depuis le {formatDate(user.created_at)}
              </p>
            </div>
          </div>

          {/* Formulaire de modification */}
          <div className="card">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              Modifier mes informations
            </h3>
            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Nom complet
                </label>
                <input
                  type="text"
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="input-field"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Adresse email
                </label>
                <input
                  type="email"
                  value={user.email}
                  disabled
                  className="input-field bg-gray-100 dark:bg-gray-600 cursor-not-allowed"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  L'adresse email ne peut pas être modifiée
                </p>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={isUpdating}
                  className="btn-primary"
                >
                  {isUpdating ? 'Mise à jour...' : 'Mettre à jour'}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Actions et informations */}
        <div className="space-y-6">
          {/* Actions rapides */}
          <div className="card">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              Actions
            </h3>
            <div className="space-y-3">
              <button
                onClick={() => window.location.href = '/'}
                className="w-full btn-secondary"
              >
                Retour au tableau de bord
              </button>
              <button
                onClick={() => {
                  setShowPasswordModal(true)
                  setPasswordError(null)
                  setPasswordFormData({
                    currentPassword: '',
                    newPassword: '',
                    confirmPassword: ''
                  })
                }}
                className="w-full btn-primary"
              >
                Modifier mon mot de passe
              </button>
              <button
                onClick={() => {
                  localStorage.removeItem('auth_token')
                  window.location.reload()
                }}
                className="w-full btn-secondary"
              >
                Se déconnecter
              </button>
            </div>
          </div>

          {/* Zone de danger */}
          <div className="card border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20">
            <h3 className="text-lg font-medium text-red-900 dark:text-red-100 mb-4">
              Zone de danger
            </h3>
            <p className="text-sm text-red-700 dark:text-red-300 mb-4">
              La suppression de votre compte est irréversible. Toutes vos données et sandboxes seront définitivement supprimées.
            </p>
            <button
              onClick={() => setShowDeleteModal(true)}
              className="w-full btn-danger"
            >
              <TrashIcon className="w-4 h-4 mr-2" />
              Supprimer mon compte
            </button>
          </div>
        </div>
      </div>

      {/* Modal de confirmation de suppression */}
      <Transition appear show={showDeleteModal} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={() => setShowDeleteModal(false)}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black bg-opacity-25" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 text-center">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white dark:bg-dark-surface p-6 text-left align-middle shadow-xl transition-all">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="flex-shrink-0">
                      <ExclamationTriangleIcon className="h-6 w-6 text-red-600 dark:text-red-400" />
                    </div>
                    <Dialog.Title as="h3" className="text-lg font-medium text-gray-900 dark:text-white">
                      Supprimer le compte
                    </Dialog.Title>
                  </div>

                  <div className="mt-2">
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Êtes-vous sûr de vouloir supprimer votre compte ? Cette action est irréversible et supprimera définitivement :
                    </p>
                    <ul className="mt-3 text-sm text-gray-500 dark:text-gray-400 space-y-1">
                      <li>• Toutes vos sandboxes</li>
                      <li>• Vos données personnelles</li>
                      <li>• Votre historique d'activité</li>
                    </ul>
                  </div>

                  <div className="mt-6 flex space-x-3">
                    <button
                      type="button"
                      className="flex-1 btn-secondary"
                      onClick={() => setShowDeleteModal(false)}
                    >
                      Annuler
                    </button>
                    <button
                      type="button"
                      className="flex-1 btn-danger"
                      onClick={handleDeleteAccount}
                      disabled={isDeleting}
                    >
                      {isDeleting ? 'Suppression...' : 'Supprimer définitivement'}
                    </button>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>

      {/* Modal de modification de mot de passe */}
      <Transition appear show={showPasswordModal} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={() => {
          setShowPasswordModal(false)
          setPasswordError(null)
          setPasswordFormData({
            currentPassword: '',
            newPassword: '',
            confirmPassword: ''
          })
        }}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black bg-opacity-25" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 text-center">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white dark:bg-dark-surface p-6 text-left align-middle shadow-xl transition-all">
                  <Dialog.Title as="h3" className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                    Modifier mon mot de passe
                  </Dialog.Title>

                  {passwordError && (
                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 mb-4">
                      <div className="text-red-800 dark:text-red-200 text-sm">{passwordError}</div>
                    </div>
                  )}

                  <form onSubmit={handleChangePassword} className="space-y-4">
                    <div>
                      <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Mot de passe actuel
                      </label>
                      <input
                        type="password"
                        id="currentPassword"
                        value={passwordFormData.currentPassword}
                        onChange={(e) => setPasswordFormData({ ...passwordFormData, currentPassword: e.target.value })}
                        className="input-field"
                        required
                      />
                    </div>

                    <div>
                      <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Nouveau mot de passe
                      </label>
                      <input
                        type="password"
                        id="newPassword"
                        value={passwordFormData.newPassword}
                        onChange={(e) => setPasswordFormData({ ...passwordFormData, newPassword: e.target.value })}
                        className={`input-field ${
                          passwordFormData.newPassword && 
                          passwordFormData.currentPassword && 
                          passwordFormData.newPassword === passwordFormData.currentPassword
                            ? 'border-red-300 dark:border-red-600 focus:ring-red-500 focus:border-red-500'
                            : ''
                        }`}
                        required
                        minLength={6}
                      />
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Le mot de passe doit contenir au moins 6 caractères
                      </p>
                      {passwordFormData.newPassword && 
                       passwordFormData.currentPassword && 
                       passwordFormData.newPassword === passwordFormData.currentPassword && (
                        <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                          Le nouveau mot de passe doit être différent de l'ancien
                        </p>
                      )}
                    </div>

                    <div>
                      <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Confirmer le nouveau mot de passe
                      </label>
                      <input
                        type="password"
                        id="confirmPassword"
                        value={passwordFormData.confirmPassword}
                        onChange={(e) => setPasswordFormData({ ...passwordFormData, confirmPassword: e.target.value })}
                        className={`input-field ${
                          passwordFormData.confirmPassword && 
                          passwordFormData.newPassword && 
                          passwordFormData.confirmPassword !== passwordFormData.newPassword
                            ? 'border-red-300 dark:border-red-600 focus:ring-red-500 focus:border-red-500'
                            : ''
                        }`}
                        required
                      />
                      {passwordFormData.confirmPassword && 
                       passwordFormData.newPassword && 
                       passwordFormData.confirmPassword !== passwordFormData.newPassword && (
                        <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                          Les mots de passe ne correspondent pas
                        </p>
                      )}
                    </div>

                    <div className="flex space-x-3 mt-6">
                      <button
                        type="button"
                        className="flex-1 btn-secondary"
                        onClick={() => {
                          setShowPasswordModal(false)
                          setPasswordError(null)
                          setPasswordFormData({
                            currentPassword: '',
                            newPassword: '',
                            confirmPassword: ''
                          })
                        }}
                      >
                        Annuler
                      </button>
                      <button
                        type="submit"
                        className="flex-1 btn-primary"
                        disabled={isChangingPassword}
                      >
                        {isChangingPassword ? 'Modification...' : 'Modifier le mot de passe'}
                      </button>
                    </div>
                  </form>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
    </div>
  )
} 
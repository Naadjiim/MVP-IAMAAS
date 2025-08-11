'use client'

import { Fragment, useState, useEffect } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { ExclamationTriangleIcon, TrashIcon } from '@heroicons/react/24/outline'
import { apiService, SandboxResponse } from '@/services/api'

interface User {
  id: string
  email: string
  name: string
  roles: string[]
  is_active: boolean
  is_verified: boolean
  avatar_url?: string
  google_id?: string
  created_at: string
}

interface UserDeleteModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (deletedSandboxes: Array<{
    id: string
    name: string
    status: string
    container_name?: string
  }>) => void
  user: User | null
  isLoading?: boolean
}

export default function UserDeleteModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  user, 
  isLoading = false 
}: UserDeleteModalProps) {
  const [userSandboxes, setUserSandboxes] = useState<SandboxResponse[]>([])
  const [loadingSandboxes, setLoadingSandboxes] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen && user) {
      loadUserSandboxes()
    }
  }, [isOpen, user])

  const loadUserSandboxes = async () => {
    if (!user) return

    try {
      setLoadingSandboxes(true)
      setError(null)
      const sandboxes = await apiService.getUserSandboxes(user.id)
      setUserSandboxes(sandboxes)
    } catch (err: any) {
      console.error('Erreur lors du chargement des sandboxes:', err)
      setError('Erreur lors du chargement des sandboxes de l\'utilisateur')
    } finally {
      setLoadingSandboxes(false)
    }
  }

  const handleConfirm = () => {
    const sandboxesToDelete = userSandboxes.map(sandbox => ({
      id: sandbox.id,
      name: sandbox.name,
      status: sandbox.status,
      container_name: sandbox.container_id
    }))
    onConfirm(sandboxesToDelete)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running':
        return 'text-green-600 bg-green-100 dark:bg-green-900 dark:text-green-200'
      case 'stopped':
        return 'text-red-600 bg-red-100 dark:bg-red-900 dark:text-red-200'
      case 'expired':
        return 'text-gray-600 bg-gray-100 dark:bg-gray-900 dark:text-gray-200'
      default:
        return 'text-gray-600 bg-gray-100 dark:bg-gray-900 dark:text-gray-200'
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

  return (
    <Transition.Root show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-white dark:bg-gray-800 px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-2xl sm:p-6">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-red-100 dark:bg-red-900 sm:mx-0 sm:h-10 sm:w-10">
                    <ExclamationTriangleIcon className="h-6 w-6 text-red-600 dark:text-red-400" aria-hidden="true" />
                  </div>
                  <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left w-full">
                    <Dialog.Title as="h3" className="text-base font-semibold leading-6 text-gray-900 dark:text-white">
                      Supprimer l'utilisateur
                    </Dialog.Title>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Êtes-vous sûr de vouloir supprimer l'utilisateur <strong>"{user?.name}"</strong> ? 
                        Cette action est irréversible et supprimera définitivement toutes les données associées.
                      </p>
                      
                      {/* Récapitulatif des sandboxes */}
                      <div className="mt-4">
                        <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                          Sandboxes de l'utilisateur ({userSandboxes.length})
                        </h4>
                        
                        {loadingSandboxes ? (
                          <div className="flex items-center justify-center py-4">
                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                          </div>
                        ) : error ? (
                          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-3">
                            <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
                          </div>
                        ) : userSandboxes.length > 0 ? (
                          <div className="bg-gray-50 dark:bg-gray-700 rounded-md p-3 max-h-48 overflow-y-auto">
                            <div className="space-y-2">
                              {userSandboxes.map((sandbox) => (
                                <div key={sandbox.id} className="flex items-center justify-between text-sm">
                                  <div className="flex-1">
                                    <span className="font-medium text-gray-900 dark:text-white">
                                      {sandbox.name}
                                    </span>
                                    {sandbox.container_id && (
                                      <span className="text-gray-500 dark:text-gray-400 ml-2">
                                        (Conteneur: {sandbox.container_id})
                                      </span>
                                    )}
                                  </div>
                                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(sandbox.status)}`}>
                                    {getStatusText(sandbox.status)}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <div className="bg-gray-50 dark:bg-gray-700 rounded-md p-3">
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              Aucune sandbox trouvée pour cet utilisateur.
                            </p>
                          </div>
                        )}
                        
                        {userSandboxes.length > 0 && (
                          <div className="mt-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md">
                            <div className="flex">
                              <div className="flex-shrink-0">
                                <ExclamationTriangleIcon className="h-5 w-5 text-yellow-400" aria-hidden="true" />
                              </div>
                              <div className="ml-3">
                                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                                  <strong>Attention :</strong> La suppression de cet utilisateur supprimera également 
                                  toutes ses sandboxes ({userSandboxes.length}) et leurs conteneurs Docker associés.
                                </p>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                  <button
                    type="button"
                    className="inline-flex w-full justify-center rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-500 sm:ml-3 sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed"
                    onClick={handleConfirm}
                    disabled={isLoading || loadingSandboxes}
                  >
                    {isLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Suppression...
                      </>
                    ) : (
                      <>
                        <TrashIcon className="h-4 w-4 mr-2" />
                        Supprimer l'utilisateur
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    className="mt-3 inline-flex w-full justify-center rounded-md bg-white dark:bg-gray-700 px-3 py-2 text-sm font-semibold text-gray-900 dark:text-white shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 sm:mt-0 sm:w-auto"
                    onClick={onClose}
                    disabled={isLoading}
                  >
                    Annuler
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  )
}

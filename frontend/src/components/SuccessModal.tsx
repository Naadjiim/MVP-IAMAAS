'use client'

import { Fragment, useState } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { CheckCircleIcon } from '@heroicons/react/24/outline'

interface Sandbox {
  id: string
  name: string
  access_url: string
  admin_username?: string
  admin_password?: string
  expires_at: string
  price: number
}

interface SuccessModalProps {
  isOpen: boolean
  onClose: () => void
  sandbox: Sandbox | null
  onViewSandboxes: () => void
}

export default function SuccessModal({ isOpen, onClose, sandbox, onViewSandboxes }: SuccessModalProps) {
  const [showPassword, setShowPassword] = useState(false)
  
  if (!sandbox) return null

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <Transition.Root show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-500"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-300"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-500"
              enterFrom="opacity-0 translate-y-8 sm:translate-y-0 sm:scale-90"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-300"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-8 sm:translate-y-0 sm:scale-90"
            >
              <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-white dark:bg-dark-surface px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6">
                <div>
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
                    <CheckCircleIcon className="h-6 w-6 text-green-600 dark:text-green-400" aria-hidden="true" />
                  </div>
                  <div className="mt-3 text-center sm:mt-5">
                    <Dialog.Title as="h3" className="text-lg font-semibold leading-6 text-gray-900 dark:text-white">
                      Sandbox créée avec succès !
                    </Dialog.Title>
                    <div className="mt-4 space-y-4">
                      <div className="text-left">
                        <h4 className="font-medium text-gray-900 dark:text-white mb-2">Détails de votre sandbox :</h4>
                        <div className="space-y-2 text-sm">
                          <div>
                            <span className="font-medium text-gray-700 dark:text-gray-300">Nom :</span>
                            <span className="ml-2 text-gray-900 dark:text-white">{sandbox.name}</span>
                          </div>
                          <div>
                            <span className="font-medium text-gray-700 dark:text-gray-300">Prix :</span>
                            <span className="ml-2 text-gray-900 dark:text-white">
                              {sandbox.price ? `${sandbox.price.toFixed(2)}€` : 'N/A'}
                            </span>
                          </div>
                          <div>
                            <span className="font-medium text-gray-700 dark:text-gray-300">Expire le :</span>
                            <span className="ml-2 text-gray-900 dark:text-white">
                              {sandbox.expires_at ? formatDate(sandbox.expires_at) : 'N/A'}
                            </span>
                          </div>
                          {sandbox.admin_username && (
                            <div>
                              <span className="font-medium text-gray-700 dark:text-gray-300">Nom d'utilisateur admin :</span>
                              <span className="ml-2 text-gray-900 dark:text-white">{sandbox.admin_username}</span>
                            </div>
                          )}
                          {sandbox.admin_password && (
                            <div className="flex items-center">
                              <span className="font-medium text-gray-700 dark:text-gray-300">Mot de passe admin :</span>
                              <span className="ml-2 text-gray-900 dark:text-white">
                                {showPassword ? sandbox.admin_password : '••••••••••••••••'}
                              </span>
                              <button
                                onClick={() => setShowPassword(!showPassword)}
                                className="ml-2 px-2 py-1 text-xs bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors"
                                title={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                              >
                                {showPassword ? "Masquer" : "Voir"}
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md p-3">
                        <p className="text-sm text-blue-800 dark:text-blue-200">
                          Votre sandbox est maintenant prête ! Cliquez sur le lien ci-dessous pour y accéder.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="mt-6 sm:mt-8 space-y-3">
                  {sandbox.access_url && (
                    <a
                      href={sandbox.access_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      Accéder à ma sandbox
                    </a>
                  )}
                  <button
                    type="button"
                    onClick={onViewSandboxes}
                    className="w-full inline-flex justify-center items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Voir mes sandboxes
                  </button>
                  <button
                    type="button"
                    onClick={onClose}
                    className="w-full inline-flex justify-center items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Fermer
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
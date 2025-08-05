'use client'

import { useState, useEffect } from 'react'
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline'

interface InactivityWarningProps {
  isVisible: boolean
  onExtend: () => void
  onLogout: () => void
  timeLeft: number
}

export default function InactivityWarning({ isVisible, onExtend, onLogout, timeLeft }: InactivityWarningProps) {
  const [countdown, setCountdown] = useState(timeLeft)

  useEffect(() => {
    if (!isVisible) {
      setCountdown(timeLeft)
      return
    }

    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          onLogout()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [isVisible, timeLeft, onLogout])

  if (!isVisible) return null

  const minutes = Math.floor(countdown / 60)
  const seconds = countdown % 60

  return (
    <div className="fixed top-4 right-4 z-50 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 shadow-lg max-w-sm">
      <div className="flex items-start space-x-3">
        <ExclamationTriangleIcon className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0" />
        <div className="flex-1">
          <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
            Session expirée
          </h3>
          <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
            Votre session expirera dans {minutes}:{seconds.toString().padStart(2, '0')} en raison de l'inactivité.
          </p>
          <div className="mt-3 flex space-x-2">
            <button
              onClick={onExtend}
              className="text-xs bg-yellow-600 hover:bg-yellow-700 text-white px-3 py-1 rounded-md transition-colors"
            >
              Rester connecté
            </button>
            <button
              onClick={onLogout}
              className="text-xs bg-gray-600 hover:bg-gray-700 text-white px-3 py-1 rounded-md transition-colors"
            >
              Se déconnecter
            </button>
          </div>
        </div>
      </div>
    </div>
  )
} 
'use client'

import { useState } from 'react'
import AuthModal from './AuthModal'
import UserProfile from './UserProfile'
import { SunIcon, MoonIcon } from '@heroicons/react/24/outline'
import { useTheme } from '@/contexts/ThemeContext'

interface User {
  id: string
  name: string
  email: string
  avatar?: string
}

interface HeaderProps {
  user: User | null
  onLogin: (email: string, password: string) => Promise<void>
  onRegister: (email: string, password: string, name: string) => Promise<void>
  onGoogleLogin: () => Promise<void>
  onLogout: () => void
  isLoading: boolean
}

export default function Header({ 
  user, 
  onLogin, 
  onRegister, 
  onGoogleLogin, 
  onLogout, 
  isLoading 
}: HeaderProps) {
  const [showAuthModal, setShowAuthModal] = useState(false)
  const { theme, toggleTheme } = useTheme()

  return (
    <>
      <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                IA IAMAAS
              </h1>
              <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">
                Identity Access Management
              </span>
            </div>

            {/* Right side */}
            <div className="flex items-center space-x-4">
              {/* Theme toggle */}
              <button
                onClick={toggleTheme}
                className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              >
                {theme === 'dark' ? (
                  <SunIcon className="h-5 w-5" />
                ) : (
                  <MoonIcon className="h-5 w-5" />
                )}
              </button>

              {/* Auth */}
              {user ? (
                <UserProfile user={user} onLogout={onLogout} />
              ) : (
                <button
                  onClick={() => setShowAuthModal(true)}
                  className="btn-primary"
                  disabled={isLoading}
                >
                  {isLoading ? 'Chargement...' : 'Se connecter'}
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Auth Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onLogin={onLogin}
        onRegister={onRegister}
        onGoogleLogin={onGoogleLogin}
        isLoading={isLoading}
      />
    </>
  )
} 
'use client'

import { useState, useEffect } from 'react'
import Header from '@/components/Header'
import GitLabHeader from '@/components/GitLabHeader'
import Sidebar from '@/components/Sidebar'
import SandboxForm from '@/components/SandboxForm'
import SandboxList from '@/components/SandboxList'
import Dashboard from '@/components/Dashboard'
import UserManagement from '@/components/UserManagement'
import AuthModal from '@/components/AuthModal'
import { apiService } from '@/services/api'

interface User {
  id: string
  name: string
  email: string
  avatar?: string
}

export default function Home() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'create' | 'list' | 'users'>('dashboard')
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isAuthLoading, setIsAuthLoading] = useState(true)
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  // Gérer le paramètre tab dans l'URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const tabParam = urlParams.get('tab')
    if (tabParam && ['dashboard', 'create', 'list', 'users'].includes(tabParam)) {
      setActiveTab(tabParam as 'dashboard' | 'create' | 'list' | 'users')
    }
  }, [])

  // Check if user is already logged in
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem('auth_token')
        if (token) {
          const userData = await apiService.getCurrentUser()
          setUser(userData)
        }
      } catch (error) {
        localStorage.removeItem('auth_token')
      } finally {
        setIsAuthLoading(false)
      }
    }
    
    checkAuth()
  }, [])

  const handleLogin = async (email: string, password: string) => {
    setIsLoading(true)
    try {
      const response = await apiService.login(email, password)
      localStorage.setItem('auth_token', response.token)
      setUser(response.user)
    } catch (error) {
      console.error('Login error:', error)
      alert('Erreur de connexion')
    } finally {
      setIsLoading(false)
    }
  }

  const handleRegister = async (email: string, password: string, name: string) => {
    setIsLoading(true)
    try {
      const response = await apiService.register(email, password, name)
      localStorage.setItem('auth_token', response.token)
      setUser(response.user)
    } catch (error) {
      console.error('Register error:', error)
      alert('Erreur lors de la création du compte')
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    setIsLoading(true)
    try {
      // For MVP, we'll simulate Google login
      // In production, you would integrate with Google OAuth
      const mockUser = {
        id: 'google-user-1',
        name: 'Utilisateur Google',
        email: 'google@example.com',
        avatar: 'https://via.placeholder.com/32'
      }
      setUser(mockUser)
      localStorage.setItem('auth_token', 'google-token-mock')
    } catch (error) {
      console.error('Google login error:', error)
      alert('Erreur lors de la connexion Google')
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('auth_token')
    setUser(null)
  }

  const handleTabChange = (tab: string) => {
    setActiveTab(tab as 'dashboard' | 'create' | 'list' | 'users')
    // Mettre à jour l'URL sans recharger la page
    const url = new URL(window.location.href)
    url.searchParams.set('tab', tab)
    window.history.pushState({}, '', url.toString())
  }

  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-dark-bg flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-dark-bg">
        <Header 
          user={user}
          onLogin={handleLogin}
          onRegister={handleRegister}
          onGoogleLogin={handleGoogleLogin}
          onLogout={handleLogout}
          isLoading={isLoading}
        />
        
        <main className="max-w-7xl mx-auto py-12 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <div className="text-center">
              <h1 className="text-4xl font-bold text-gray-900 mb-4">
                Bienvenue sur IAMAAS
              </h1>
              <p className="text-xl text-gray-600 mb-8">
                Créez et gérez vos environnements IAM sandbox en quelques clics
              </p>
              <div className="bg-white rounded-lg shadow-sm p-8 max-w-md mx-auto">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                  Commencez maintenant
                </h2>
                <p className="text-gray-600 mb-6">
                  Connectez-vous pour accéder à votre tableau de bord et créer vos premières sandboxes.
                </p>
                <button
                  onClick={() => setShowAuthModal(true)}
                  className="btn-primary w-full"
                >
                  Se connecter
                </button>
              </div>
            </div>
          </div>
        </main>

        <AuthModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          onLogin={handleLogin}
          onRegister={handleRegister}
          onGoogleLogin={handleGoogleLogin}
          isLoading={isLoading}
        />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-bg">
      {/* Sidebar - Fixed */}
              <Sidebar
          user={user}
          activeTab={activeTab}
          onTabChange={handleTabChange}
          onLogout={handleLogout}
          isCollapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        />

              {/* Main content - Takes remaining space */}
        <div className="min-h-screen flex flex-col ml-64">
        {/* Header */}
        <GitLabHeader 
          onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)} 
          activeTab={activeTab}
        />
        
                  {/* Content */}
          <main className="flex-1 px-6 pb-6 pt-4 overflow-auto">
                      {activeTab === 'dashboard' && <Dashboard />}
            {activeTab === 'create' && (
              <div className="max-w-2xl mx-auto">
                <SandboxForm />
              </div>
            )}
            {activeTab === 'list' && <SandboxList />}
            {activeTab === 'users' && user?.role === 'admin' && <UserManagement />}
        </main>
      </div>
    </div>
  )
} 
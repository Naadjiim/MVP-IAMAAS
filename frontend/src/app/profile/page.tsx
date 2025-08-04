'use client'

import { useEffect, useState } from 'react'
import Sidebar from '@/components/Sidebar'
import GitLabHeader from '@/components/GitLabHeader'
import UserProfilePage from '@/components/UserProfilePage'
import { apiService } from '@/services/api'

interface User {
  id: string
  name: string
  email: string
  avatar?: string
}

export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null)
  const [isAuthLoading, setIsAuthLoading] = useState(true)

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('auth_token')
      if (token) {
        try {
          const userData = await apiService.getCurrentUser()
          setUser(userData)
        } catch (error) {
          localStorage.removeItem('auth_token')
          window.location.href = '/'
        }
      } else {
        window.location.href = '/'
      }
      setIsAuthLoading(false)
    }

    checkAuth()
  }, [])

  const handleLogin = async (email: string, password: string) => {
    // Cette fonction ne devrait pas être appelée sur cette page
  }

  const handleRegister = async (email: string, password: string, name: string) => {
    // Cette fonction ne devrait pas être appelée sur cette page
  }

  const handleGoogleLogin = async () => {
    // Cette fonction ne devrait pas être appelée sur cette page
  }

  const handleLogout = () => {
    localStorage.removeItem('auth_token')
    setUser(null)
    window.location.href = '/'
  }

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-dark-bg flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Chargement...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null // Redirection en cours
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-bg">
      {/* Sidebar - Fixed */}
      <Sidebar
        user={user}
        activeTab="profile"
        onTabChange={() => {}}
        onLogout={handleLogout}
        isCollapsed={sidebarCollapsed}

        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
      />

              {/* Main content - Takes remaining space */}
        <div className="min-h-screen flex flex-col ml-64">
        {/* Header */}
        <GitLabHeader 
          onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)} 
          activeTab="profile"
        />
        
                  {/* Content */}
          <main className="flex-1 px-6 pb-6 pt-4 overflow-auto">
          <UserProfilePage />
        </main>
      </div>
    </div>
  )
} 
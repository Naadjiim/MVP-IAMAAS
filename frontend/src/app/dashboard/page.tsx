'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import Header from '@/components/Header'
import GitLabHeader from '@/components/GitLabHeader'
import Sidebar from '@/components/Sidebar'
import SandboxForm from '@/components/SandboxForm'
import SandboxList from '@/components/SandboxList'
import Dashboard from '@/components/Dashboard'
import UserManagement from '@/components/UserManagement'
import RoleManagement from '@/components/RoleManagement'
import SoftwareTypeManagement from '@/components/SoftwareTypeManagement'
import PricingManagement from '@/components/PricingManagement'
import AdminSandboxList from '@/components/AdminSandboxList'
import AuthModal from '@/components/AuthModal'

export default function DashboardPage() {
  const { user, isLoading, isAuthenticated, login, register, logout } = useAuth()
  const [activeTab, setActiveTab] = useState<'dashboard' | 'create' | 'list' | 'all-sandboxes' | 'users' | 'roles' | 'software-types' | 'pricing'>('dashboard')
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const router = useRouter()

  // Gérer le paramètre tab dans l'URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const tabParam = urlParams.get('tab')
    if (tabParam && ['dashboard', 'create', 'list', 'all-sandboxes', 'users', 'roles', 'software-types', 'pricing'].includes(tabParam)) {
      setActiveTab(tabParam as 'dashboard' | 'create' | 'list' | 'all-sandboxes' | 'users' | 'roles' | 'software-types' | 'pricing')
    }
  }, [])

  // Rediriger vers la landing page si pas connecté
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/')
    }
  }, [isLoading, isAuthenticated, router])

  const handleLogin = async (email: string, password: string) => {
    try {
      await login(email, password)
      setShowAuthModal(false)
    } catch (error) {
      throw error
    }
  }

  const handleRegister = async (email: string, password: string, name: string) => {
    try {
      await register(email, password, name)
      setShowAuthModal(false)
    } catch (error) {
      throw error
    }
  }

  const handleGoogleLogin = async () => {
    // For MVP, we'll simulate Google login
    // In production, you would integrate with Google OAuth
    const mockUser = {
      id: 'google-user-1',
      name: 'Utilisateur Google',
      email: 'google@example.com',
      avatar: 'https://via.placeholder.com/32'
    }
    // Note: This would need to be implemented in the auth context
    console.log('Google login simulation')
  }

  const handleLogout = () => {
    logout()
    router.push('/')
  }

  const handleTabChange = (tab: string) => {
    setActiveTab(tab as 'dashboard' | 'create' | 'list' | 'all-sandboxes' | 'users' | 'roles' | 'software-types' | 'pricing')
    // Mettre à jour l'URL sans recharger la page
    const url = new URL(window.location.href)
    url.searchParams.set('tab', tab)
    window.history.pushState({}, '', url.toString())
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-dark-bg flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement...</p>
          <p className="mt-2 text-sm text-gray-500">Vérification de l'authentification...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null // La redirection sera gérée par useEffect
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-bg">
      {/* Sidebar - Fixed */}
      <Sidebar
        activeTab={activeTab}
        onTabChange={handleTabChange}
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
          {activeTab === 'create' && <SandboxForm />}
          {activeTab === 'list' && <SandboxList />}
          {activeTab === 'all-sandboxes' && user?.roles.includes('admin') && <AdminSandboxList />}
          {activeTab === 'users' && user?.roles.includes('admin') && <UserManagement />}
          {activeTab === 'roles' && user?.roles.includes('admin') && <RoleManagement />}
          {activeTab === 'software-types' && user?.roles.includes('admin') && <SoftwareTypeManagement />}
          {activeTab === 'pricing' && user?.roles.includes('admin') && <PricingManagement />}
        </main>
      </div>
    </div>
  )
} 
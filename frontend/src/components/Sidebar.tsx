'use client'

import { useState } from 'react'
import { 
  HomeIcon, 
  CubeIcon, 
  UserIcon, 
  Cog6ToothIcon,
  Bars3Icon,
  XMarkIcon,
  ChartBarIcon,
  CreditCardIcon
} from '@heroicons/react/24/outline'
import { useTheme } from '@/contexts/ThemeContext'

interface User {
  id: string
  name: string
  email: string
  avatar?: string
}

interface SidebarProps {
  user: User
  activeTab: string
  onTabChange: (tab: string) => void
  onLogout: () => void
  isCollapsed: boolean
  onToggleCollapse: () => void
}

export default function Sidebar({ 
  user, 
  activeTab, 
  onTabChange, 
  onLogout, 
  isCollapsed, 
  onToggleCollapse 
}: SidebarProps) {
  const { theme } = useTheme()

  const navigation = [
    { name: 'Tableau de bord', href: 'dashboard', icon: HomeIcon, current: activeTab === 'dashboard' },
    { name: 'Mes sandboxes', href: 'list', icon: CubeIcon, current: activeTab === 'list' },
    { name: 'Créer une sandbox', href: 'create', icon: CubeIcon, current: activeTab === 'create' },
    { name: 'Mon profil', href: 'profile', icon: UserIcon, current: activeTab === 'profile' },
    { name: 'Prix', href: 'pricing', icon: CreditCardIcon, current: activeTab === 'pricing' },
    { name: 'Statistiques', href: 'stats', icon: ChartBarIcon, current: activeTab === 'stats' },
  ]

  const handleNavigation = (href: string) => {
    if (href === 'profile') {
      window.location.href = '/profile'
    } else {
      onTabChange(href)
    }
  }

  return (
    <>
      {/* Overlay pour mobile */}
      {!isCollapsed && (
        <div 
          className="fixed inset-0 z-40 bg-gray-600 bg-opacity-75 lg:hidden"
          onClick={onToggleCollapse}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 
        transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0
        ${isCollapsed ? '-translate-x-full' : 'translate-x-0'}
      `}>
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="flex h-16 items-center justify-between px-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="h-8 w-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">IA</span>
                </div>
              </div>
              <div className="ml-3">
                <h1 className="text-lg font-semibold text-gray-900 dark:text-white">IAMAAS</h1>
                <p className="text-xs text-gray-500 dark:text-gray-400">Identity Access Management</p>
              </div>
            </div>
            <button
              onClick={onToggleCollapse}
              className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1 px-2 py-4">
            {navigation.map((item) => (
              <button
                key={item.name}
                onClick={() => handleNavigation(item.href)}
                className={`
                  group flex items-center px-2 py-2 text-sm font-medium rounded-md w-full
                  ${item.current
                    ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-200'
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'
                  }
                `}
              >
                <item.icon
                  className={`
                    mr-3 h-5 w-5 flex-shrink-0
                    ${item.current
                      ? 'text-blue-500 dark:text-blue-400'
                      : 'text-gray-400 dark:text-gray-500 group-hover:text-gray-500 dark:group-hover:text-gray-400'
                    }
                  `}
                />
                {item.name}
              </button>
            ))}
          </nav>

          {/* User section */}
          <div className="border-t border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                {user.avatar ? (
                  <img
                    className="h-8 w-8 rounded-full"
                    src={user.avatar}
                    alt={user.name}
                  />
                ) : (
                  <div className="h-8 w-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                    <UserIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                )}
              </div>
              <div className="ml-3 flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                  {user.name}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                  {user.email}
                </p>
              </div>
              <button
                onClick={onLogout}
                className="ml-2 p-1 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
                title="Se déconnecter"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
} 
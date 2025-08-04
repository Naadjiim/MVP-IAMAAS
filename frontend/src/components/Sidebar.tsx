'use client'

import { useState } from 'react'
import {
  HomeIcon,
  CubeIcon,
  UserIcon,
  Cog6ToothIcon,
  Bars3Icon,
  ChartBarIcon,
  CreditCardIcon,
  UserGroupIcon
} from '@heroicons/react/24/outline'
import { useTheme } from '@/contexts/ThemeContext'

interface User {
  id: string
  name: string
  email: string
  avatar?: string
  role: 'customer' | 'admin'
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
    { name: 'Explorer', href: 'dashboard', icon: HomeIcon, current: activeTab === 'dashboard' },
    { name: 'Mes sandboxes', href: 'list', icon: CubeIcon, current: activeTab === 'list' },
    { name: 'Créer une sandbox', href: 'create', icon: CubeIcon, current: activeTab === 'create' },
  ]

  // Navigation admin seulement
  const adminNavigation = [
    { name: 'Utilisateurs', href: 'users', icon: UserGroupIcon, current: activeTab === 'users' },
  ]

  const handleNavigation = (href: string) => {
    // Si on est sur la page profile, rediriger vers la page principale avec le bon onglet
    if (activeTab === 'profile') {
      window.location.href = `/?tab=${href}`
    } else {
      onTabChange(href)
    }
  }

  return (
    <>
      {/* Sidebar */}
              <div className={`
          w-64 h-screen bg-white dark:bg-dark-surface border-r border-gray-200 dark:border-gray-600 
          flex flex-col fixed left-0 top-0 overflow-y-auto z-50
        `}>
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="flex h-16 items-center justify-between px-4 border-b border-gray-200 dark:border-gray-600">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="h-7 w-7 bg-blue-600 rounded flex items-center justify-center">
                  <span className="text-white font-bold text-xs">IA</span>
                </div>
              </div>
              <div className="ml-3">
                <h1 className="text-base font-semibold text-gray-900 dark:text-white">IAMAAS</h1>
                <p className="text-xs text-gray-500 dark:text-gray-400">Identity Access Management</p>
              </div>
            </div>
            
            {/* Profile Image with Hover Menu */}
            <div className="relative">
              <div className="flex-shrink-0 cursor-pointer group">
                {user.avatar ? (
                  <img
                    className="h-6 w-6 rounded-full"
                    src={user.avatar}
                    alt={user.name}
                  />
                ) : (
                  <div className="h-6 w-6 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                    <UserIcon className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  </div>
                )}
                
                {/* Hover Menu */}
                <div className="absolute right-0 top-8 w-32 bg-white dark:bg-dark-surface rounded-md shadow-lg border border-gray-200 dark:border-gray-600 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                  <div className="py-1">
                    <button
                      onClick={() => window.location.href = '/profile'}
                      className="w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600"
                    >
                      Mon profil
                    </button>
                    <button
                      onClick={onLogout}
                      className="w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600"
                    >
                      Déconnexion
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-3 py-2">
            {navigation.map((item) => (
              <button
                key={item.name}
                onClick={() => handleNavigation(item.href)}
                className={`
                  group flex items-center px-3 py-2.5 text-sm font-medium rounded w-full mb-1
                  ${item.current
                    ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-200'
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'
                  }
                `}
              >
                <item.icon
                  className={`
                    mr-3 h-4 w-4 flex-shrink-0
                    ${item.current
                      ? 'text-blue-500 dark:text-blue-400'
                      : 'text-gray-400 dark:text-gray-500 group-hover:text-gray-500 dark:group-hover:text-gray-400'
                    }
                  `}
                />
                {item.name}
              </button>
            ))}
            
            {/* Navigation admin */}
            {user.role === 'admin' && (
              <>
                <div className="border-t border-gray-200 dark:border-gray-600 my-3"></div>
                <div className="text-xs font-medium text-gray-500 dark:text-gray-400 px-3 mb-2">Administration</div>
                {adminNavigation.map((item) => (
                  <button
                    key={item.name}
                    onClick={() => handleNavigation(item.href)}
                    className={`
                      group flex items-center px-3 py-2.5 text-sm font-medium rounded w-full mb-1
                      ${item.current
                        ? 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-200'
                        : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'
                      }
                    `}
                  >
                    <item.icon
                      className={`
                        mr-3 h-4 w-4 flex-shrink-0
                        ${item.current
                          ? 'text-red-500 dark:text-red-400'
                          : 'text-gray-400 dark:text-gray-500 group-hover:text-gray-500 dark:group-hover:text-gray-400'
                        }
                      `}
                    />
                    {item.name}
                  </button>
                ))}
              </>
            )}
          </nav>


        </div>
      </div>
    </>
  )
} 
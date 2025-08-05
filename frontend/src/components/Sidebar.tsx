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
  UserGroupIcon,
  SunIcon,
  MoonIcon
} from '@heroicons/react/24/outline'
import { useTheme } from '@/contexts/ThemeContext'
import { useAuth } from '@/contexts/AuthContext'

interface User {
  id: string
  name: string
  email: string
  avatar?: string
  roles: string[]
}

interface SidebarProps {
  activeTab: string
  onTabChange: (tab: string) => void
  isCollapsed: boolean
  onToggleCollapse: () => void
}

export default function Sidebar({ 
  activeTab, 
  onTabChange, 
  isCollapsed, 
  onToggleCollapse 
}: SidebarProps) {
  const { user, logout } = useAuth()
  const { theme, toggleTheme } = useTheme()

  const navigation = [
    { name: 'Explorer', href: 'dashboard', icon: HomeIcon, current: activeTab === 'dashboard' },
    { name: 'Mes sandboxes', href: 'list', icon: CubeIcon, current: activeTab === 'list' },
    { name: 'Créer une sandbox', href: 'create', icon: CubeIcon, current: activeTab === 'create' },
  ]

  // Navigation admin seulement
  const adminNavigation = [
    { name: 'Toutes les sandboxes', href: 'all-sandboxes', icon: CubeIcon, current: activeTab === 'all-sandboxes' },
    { name: 'Utilisateurs', href: 'users', icon: UserGroupIcon, current: activeTab === 'users' },
    { name: 'Rôles', href: 'roles', icon: Cog6ToothIcon, current: activeTab === 'roles' },
    { name: 'Types de logiciels', href: 'software-types', icon: CubeIcon, current: activeTab === 'software-types' },
    { name: 'Tarifs', href: 'pricing', icon: CreditCardIcon, current: activeTab === 'pricing' },
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
          w-64 h-screen bg-gradient-to-b from-indigo-600 to-purple-700 border-r border-indigo-500 
          flex flex-col fixed left-0 top-0 overflow-y-auto z-50
        `}>
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="flex h-16 items-center justify-between px-4 border-b border-white/20">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="h-8 w-8 bg-white rounded-full flex items-center justify-center">
                  <span className="text-indigo-600 font-bold text-sm">GL</span>
                </div>
              </div>
              <div className="ml-3">
                <h1 className="text-base font-semibold text-white">GateLabs</h1>
                <p className="text-xs text-indigo-100">Identity Access Management</p>
              </div>
            </div>
            
            {/* Profile Image with Hover Menu */}
            <div className="relative">
              <div className="flex-shrink-0 cursor-pointer group">
                {user?.avatar ? (
                  <img
                    className="h-6 w-6 rounded-full"
                    src={user.avatar}
                    alt={user.name || 'Avatar utilisateur'}
                  />
                ) : (
                  <div className="h-6 w-6 bg-white/20 rounded-full flex items-center justify-center">
                    <UserIcon className="h-4 w-4 text-white" />
                  </div>
                )}
                
                {/* Hover Menu */}
                <div className="absolute right-0 top-8 w-32 bg-white rounded-md shadow-lg border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                  <div className="py-1">
                    <button
                      onClick={() => window.location.href = '/profile'}
                      className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      Mon profil
                    </button>
                    <button
                      onClick={logout}
                      className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
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
            {/* Theme Toggle Button */}
            <div className="mb-4 px-3">
              <button
                onClick={toggleTheme}
                className="w-full flex items-center justify-center px-3 py-2.5 text-sm font-medium rounded-lg bg-white/10 text-indigo-100 hover:bg-white/20 hover:text-white transition-all duration-200"
                aria-label={theme === 'light' ? 'Passer au mode sombre' : 'Passer au mode clair'}
              >
                {theme === 'light' ? (
                  <MoonIcon className="h-4 w-4 mr-2" />
                ) : (
                  <SunIcon className="h-4 w-4 mr-2" />
                )}
                {theme === 'light' ? 'Mode sombre' : 'Mode clair'}
              </button>
            </div>
            
            {navigation.map((item) => (
              <button
                key={item.name}
                onClick={() => handleNavigation(item.href)}
                className={`
                  group flex items-center px-3 py-2.5 text-sm font-medium rounded-lg w-full mb-1 transition-all duration-200
                  ${item.current
                    ? 'bg-white text-indigo-600 shadow-lg'
                    : 'text-indigo-100 hover:bg-white/10 hover:text-white'
                  }
                `}
              >
                <item.icon
                  className={`
                    mr-3 h-4 w-4 flex-shrink-0
                    ${item.current
                      ? 'text-indigo-600'
                      : 'text-indigo-200 group-hover:text-white'
                    }
                  `}
                />
                {item.name}
              </button>
            ))}
            
            {/* Navigation admin */}
            {user?.roles?.includes('admin') && (
              <>
                <div className="border-t border-white/20 my-3"></div>
                <div className="text-xs font-medium text-indigo-200 px-3 mb-2">Administration</div>
                {adminNavigation.map((item) => (
                  <button
                    key={item.name}
                    onClick={() => handleNavigation(item.href)}
                    className={`
                      group flex items-center px-3 py-2.5 text-sm font-medium rounded-lg w-full mb-1 transition-all duration-200
                      ${item.current
                        ? 'bg-white text-indigo-600 shadow-lg'
                        : 'text-indigo-100 hover:bg-white/10 hover:text-white'
                      }
                    `}
                  >
                    <item.icon
                      className={`
                        mr-3 h-4 w-4 flex-shrink-0
                        ${item.current
                          ? 'text-indigo-600'
                          : 'text-indigo-200 group-hover:text-white'
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
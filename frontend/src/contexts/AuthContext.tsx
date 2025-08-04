'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { apiService } from '@/services/api'

interface User {
  id: string
  email: string
  name: string
  roles: string[]
  is_active: boolean
  is_verified: boolean
  created_at: string
}

interface AuthContextType {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string, name: string) => Promise<void>
  logout: () => void
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

interface AuthProviderProps {
  children: ReactNode
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Fonction pour sauvegarder le token de manière persistante
  const saveToken = (token: string) => {
    localStorage.setItem('auth_token', token)
    sessionStorage.setItem('auth_token', token) // Backup pour la session
  }

  // Fonction pour récupérer le token
  const getToken = (): string | null => {
    const localToken = localStorage.getItem('auth_token')
    const sessionToken = sessionStorage.getItem('auth_token')
    
    // Priorité au localStorage, puis sessionStorage
    const token = localToken || sessionToken
    
    // Si on a un token dans sessionStorage mais pas dans localStorage, le copier
    if (sessionToken && !localToken) {
      localStorage.setItem('auth_token', sessionToken)
    }
    
    return token
  }

  // Fonction pour supprimer le token
  const removeToken = () => {
    localStorage.removeItem('auth_token')
    sessionStorage.removeItem('auth_token')
  }

  // Vérifier l'authentification au chargement
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = getToken()
        console.log('Token trouvé:', token ? 'Oui' : 'Non')
        
        if (token && token.trim() !== '') {
          console.log('Tentative de récupération des données utilisateur...')
          const userData = await apiService.getCurrentUser()
          console.log('Données utilisateur récupérées:', userData)
          setUser(userData)
        } else {
          console.log('Aucun token trouvé, utilisateur non connecté')
        }
      } catch (error) {
        console.error('Erreur lors de la vérification de l\'authentification:', error)
        removeToken()
        setUser(null)
      } finally {
        setIsLoading(false)
      }
    }

    checkAuth()
  }, [])

  const login = async (email: string, password: string) => {
    try {
      const response = await apiService.login(email, password)
      saveToken(response.token)
      setUser(response.user)
    } catch (error) {
      console.error('Erreur de connexion:', error)
      throw error
    }
  }

  const register = async (email: string, password: string, name: string) => {
    try {
      const response = await apiService.register(email, password, name)
      saveToken(response.token)
      setUser(response.user)
    } catch (error) {
      console.error('Erreur lors de l\'inscription:', error)
      throw error
    }
  }

  const logout = () => {
    removeToken()
    setUser(null)
  }

  const refreshUser = async () => {
    try {
      const userData = await apiService.getCurrentUser()
      setUser(userData)
    } catch (error) {
      console.error('Erreur lors du rafraîchissement des données utilisateur:', error)
      removeToken()
      setUser(null)
    }
  }

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    register,
    logout,
    refreshUser
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
} 
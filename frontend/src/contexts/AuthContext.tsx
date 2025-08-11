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
  googleLogin: (token: string) => Promise<void>
  logout: () => void
  refreshUser: () => Promise<void>
  showInactivityWarning: boolean
  extendSession: () => void
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
  const [lastActivity, setLastActivity] = useState<number>(Date.now())
  const [showInactivityWarning, setShowInactivityWarning] = useState(false)

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
    localStorage.removeItem('last_activity')
  }

  // Fonction pour mettre à jour l'activité utilisateur
  const updateActivity = () => {
    const now = Date.now()
    setLastActivity(now)
    localStorage.setItem('last_activity', now.toString())
  }

  // Fonction pour vérifier l'inactivité (4 heures = 4 * 60 * 60 * 1000 ms)
  const checkInactivity = () => {
    const now = Date.now()
    const fourHours = 4 * 60 * 60 * 1000 // 4 heures en millisecondes
    const warningThreshold = 3.5 * 60 * 60 * 1000 // Avertissement 30 minutes avant
    
    if (now - lastActivity > fourHours) {
      console.log('Déconnexion automatique due à l\'inactivité (4h)')
      logout()
    } else if (now - lastActivity > warningThreshold && !showInactivityWarning) {
      console.log('Affichage de l\'avertissement d\'inactivité')
      setShowInactivityWarning(true)
    }
  }

  // Fonction pour étendre la session
  const extendSession = () => {
    updateActivity()
    setShowInactivityWarning(false)
  }

  // Vérifier l'authentification au chargement
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = getToken()
        
        if (token && token.trim() !== '') {
          // Vérifier l'inactivité avant de récupérer les données utilisateur
          const savedActivity = localStorage.getItem('last_activity')
          if (savedActivity) {
            const lastActivityTime = parseInt(savedActivity)
            const now = Date.now()
            const fourHours = 4 * 60 * 60 * 1000
            
            if (now - lastActivityTime > fourHours) {
              console.log('Déconnexion automatique due à l\'inactivité (4h)')
              removeToken()
              setUser(null)
              setIsLoading(false)
              return
            }
            
            setLastActivity(lastActivityTime)
          }
          
          const userData = await apiService.getCurrentUser()
          setUser(userData)
          updateActivity() // Mettre à jour l'activité après connexion réussie
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

  // Gestion de l'inactivité utilisateur
  useEffect(() => {
    if (!user) return // Ne pas surveiller si l'utilisateur n'est pas connecté

    // Événements pour détecter l'activité utilisateur
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click']
    
    const handleActivity = () => {
      updateActivity()
    }

    // Ajouter les event listeners
    events.forEach(event => {
      document.addEventListener(event, handleActivity, true)
    })

    // Timer pour vérifier l'inactivité toutes les minutes
    const inactivityTimer = setInterval(() => {
      checkInactivity()
    }, 60000) // Vérifier toutes les minutes

    // Cleanup
    return () => {
      events.forEach(event => {
        document.removeEventListener(event, handleActivity, true)
      })
      clearInterval(inactivityTimer)
    }
  }, [user, lastActivity])

  const login = async (email: string, password: string) => {
    try {
      const response = await apiService.login(email, password)
      saveToken(response.token)
      setUser(response.user)
      updateActivity() // Mettre à jour l'activité après connexion
      // Rediriger vers le dashboard après connexion
      if (typeof window !== 'undefined') {
        window.location.href = '/dashboard'
      }
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
      updateActivity() // Mettre à jour l'activité après inscription
      // Rediriger vers le dashboard après inscription
      if (typeof window !== 'undefined') {
        window.location.href = '/dashboard'
      }
    } catch (error) {
      console.error('Erreur lors de l\'inscription:', error)
      throw error
    }
  }

  const googleLogin = async (token: string) => {
    try {
      const response = await apiService.googleLogin(token)
      saveToken(response.token)
      setUser(response.user)
      updateActivity() // Mettre à jour l'activité après connexion Google
      // Rediriger vers le dashboard après connexion Google
      if (typeof window !== 'undefined') {
        window.location.href = '/dashboard'
      }
    } catch (error) {
      console.error('Erreur de connexion Google:', error)
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
    googleLogin,
    logout,
    refreshUser,
    showInactivityWarning,
    extendSession
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
} 
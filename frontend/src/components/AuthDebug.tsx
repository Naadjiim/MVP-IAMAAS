'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useEffect, useState } from 'react'

export default function AuthDebug() {
  const { user, isLoading, isAuthenticated } = useAuth()
  const [localToken, setLocalToken] = useState<string | null>(null)
  const [sessionToken, setSessionToken] = useState<string | null>(null)

  useEffect(() => {
    const checkTokens = () => {
      setLocalToken(localStorage.getItem('auth_token'))
      setSessionToken(sessionStorage.getItem('auth_token'))
    }

    checkTokens()
    const interval = setInterval(checkTokens, 1000)
    return () => clearInterval(interval)
  }, [])

  if (process.env.NODE_ENV === 'production') {
    return null
  }

  return (
    <div className="fixed bottom-4 right-4 bg-black bg-opacity-75 text-white p-4 rounded-lg text-xs max-w-sm z-50">
      <h3 className="font-bold mb-2">Debug Auth</h3>
      <div className="space-y-1">
        <div>Loading: {isLoading ? 'Oui' : 'Non'}</div>
        <div>Authenticated: {isAuthenticated ? 'Oui' : 'Non'}</div>
        <div>User: {user ? user.name : 'Aucun'}</div>
        <div>LocalStorage Token: {localToken ? 'Présent' : 'Absent'}</div>
        <div>SessionStorage Token: {sessionToken ? 'Présent' : 'Absent'}</div>
        {localToken && (
          <div className="text-xs break-all">
            Token: {localToken.substring(0, 20)}...
          </div>
        )}
      </div>
    </div>
  )
} 
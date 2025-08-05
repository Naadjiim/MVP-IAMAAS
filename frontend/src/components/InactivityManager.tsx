'use client'

import { useAuth } from '@/contexts/AuthContext'
import InactivityWarning from './InactivityWarning'

export default function InactivityManager() {
  const { showInactivityWarning, extendSession, logout } = useAuth()
  
  return (
    <InactivityWarning
      isVisible={showInactivityWarning}
      onExtend={extendSession}
      onLogout={logout}
      timeLeft={300} // 5 minutes de compte à rebours
    />
  )
} 
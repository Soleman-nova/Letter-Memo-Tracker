import React, { createContext, useContext, useState, useEffect } from 'react'
import api from '../api'
import { getAccessToken, clearTokens } from '../store/auth'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  const idleTimeoutMs = (() => {
    const raw = import.meta?.env?.VITE_IDLE_TIMEOUT_MINUTES
    const minutes = raw ? Number(raw) : 30
    return Number.isFinite(minutes) && minutes > 0 ? minutes * 60 * 1000 : 30 * 60 * 1000
  })()

  const activityKey = 'eeu_last_activity'

  const fetchUser = async () => {
    const token = getAccessToken()
    if (!token) {
      setUser(null)
      setLoading(false)
      return
    }
    try {
      const res = await api.get('/api/core/me/')
      setUser(res.data)
    } catch (err) {
      console.error('Failed to fetch user:', err)
      clearTokens()
      setUser(null)
      window.location.href = '/login'
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUser()
  }, [])

  const logout = () => {
    clearTokens()
    setUser(null)
    window.location.href = '/login'
  }

  const refreshUser = () => {
    fetchUser()
  }

  useEffect(() => {
    const markActivity = () => {
      localStorage.setItem(activityKey, String(Date.now()))
    }

    const events = ['mousemove', 'mousedown', 'keydown', 'scroll', 'touchstart']
    events.forEach((e) => window.addEventListener(e, markActivity, { passive: true }))
    markActivity()

    const interval = window.setInterval(() => {
      const token = getAccessToken()
      if (!token) return
      const last = Number(localStorage.getItem(activityKey) || '0')
      if (last && Date.now() - last > idleTimeoutMs) {
        logout()
      }
    }, 10_000)

    return () => {
      events.forEach((e) => window.removeEventListener(e, markActivity))
      window.clearInterval(interval)
    }
  }, [])

  // Helper permission checks
  const canManageUsers = user?.profile?.can_manage_users || false
  const canCreateDocuments = user?.profile?.can_create_documents || false
  const canEditAllDocuments = user?.profile?.can_edit_all_documents || false
  const canViewAllDocuments = user?.profile?.can_view_all_documents || false
  const userRole = user?.profile?.role || null
  const userDepartment = user?.profile?.department || null

  const value = {
    user,
    loading,
    logout,
    refreshUser,
    canManageUsers,
    canCreateDocuments,
    canEditAllDocuments,
    canViewAllDocuments,
    userRole,
    userDepartment,
    isSuperAdmin: userRole === 'SUPER_ADMIN',
    isCeoSecretary: userRole === 'CEO_SECRETARY',
    isCxoSecretary: userRole === 'CXO_SECRETARY',
    isCeo: userRole === 'CEO',
    isCxo: userRole === 'CXO',
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export default AuthContext

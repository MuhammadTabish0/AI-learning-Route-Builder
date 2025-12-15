"use client"

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

interface User {
  username: string
  email: string
  accountType: string
  subscriptionPlan: string
}

interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  initialized: boolean
  login: (userData: User) => void
  logout: () => void
  checkAuth: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [initialized, setInitialized] = useState(false)

  useEffect(() => {
    // Check if user is logged in from localStorage
    checkAuth()
    setInitialized(true)

    // Listen for storage changes (when login happens in another tab/window)
    const handleStorageChange = () => {
      checkAuth()
    }

    window.addEventListener('storage', handleStorageChange)
    // Also listen for custom event for same-window updates
    window.addEventListener('auth-update', handleStorageChange)

    return () => {
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('auth-update', handleStorageChange)
    }
  }, [])

  const checkAuth = () => {
    if (typeof window === 'undefined') return
    try {
      const saved = localStorage.getItem('currentUser')
      if (saved) {
        setUser(JSON.parse(saved))
      }
    } catch (e) {
      console.error('Failed to load user from storage', e)
    }
  }

  const login = (userData: User) => {
    setUser(userData)
    if (typeof window !== 'undefined') {
      localStorage.setItem('currentUser', JSON.stringify(userData))
    }
  }

  const logout = () => {
    setUser(null)
    if (typeof window !== 'undefined') {
      localStorage.removeItem('currentUser')
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        initialized,
        login,
        logout,
        checkAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}


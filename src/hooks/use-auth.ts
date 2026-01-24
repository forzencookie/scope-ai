'use client'

import { useState, useEffect } from 'react'
import { User } from '@supabase/supabase-js'
import { 
  signIn, 
  signUp, 
  signOut, 
  signInWithOAuth,
  getCurrentUser,
  onAuthStateChange,
  resetPassword,
  updatePassword
} from '@/lib/database/supabase-auth'

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    let isMounted = true

    // Get initial user with proper error handling
    getCurrentUser()
      .then((currentUser) => {
        if (isMounted) {
          setUser(currentUser)
          setError(null)
        }
      })
      .catch((err) => {
        if (isMounted) {
          console.error('Failed to get current user:', err)
          setUser(null)
          setError(err instanceof Error ? err : new Error('Failed to get user'))
        }
      })
      .finally(() => {
        if (isMounted) {
          setLoading(false)
        }
      })

    // Listen for auth changes
    const subscription = onAuthStateChange((authUser) => {
      if (isMounted) {
        setUser(authUser)
        setLoading(false)
        setError(null)
      }
    })

    return () => {
      isMounted = false
      subscription.unsubscribe()
    }
  }, [])

  return {
    user,
    loading,
    error,
    signIn,
    signUp,
    signOut,
    signInWithOAuth,
    resetPassword,
    updatePassword,
    isAuthenticated: !!user,
  }
}

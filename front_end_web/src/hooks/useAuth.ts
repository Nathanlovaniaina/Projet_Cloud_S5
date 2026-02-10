import { useState, useEffect } from 'react'

interface AuthUser {
  uid: string
  email: string | null
  displayName: string | null
  token: string | null
}

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Récupérer le token depuis localStorage (celui stocké lors du login)
    const token = localStorage.getItem('token')
    const userData = localStorage.getItem('user')

    if (token && userData) {
      try {
        const parsedUser = JSON.parse(userData)
        setUser({
          uid: parsedUser.uid || parsedUser.firebase_uid || parsedUser.idUtilisateur || '',
          email: parsedUser.email || null,
          displayName: parsedUser.nom && parsedUser.prenom 
            ? `${parsedUser.prenom} ${parsedUser.nom}` 
            : parsedUser.displayName || null,
          token
        })
      } catch (e) {
        console.error('Erreur parsing user data:', e)
        setUser(null)
      }
    } else {
      setUser(null)
    }

    setLoading(false)
  }, [])

  return { user, loading, isAuthenticated: !!user }
}

export function getAuthToken(): string | null {
  return localStorage.getItem('token')
}

export function getAuthHeaders(): HeadersInit {
  const token = getAuthToken()
  return token ? { 'Authorization': `Bearer ${token}` } : {}
}

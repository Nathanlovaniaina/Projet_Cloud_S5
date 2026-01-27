import axios from 'axios'
import { enqueue } from './offlineQueue'
import { initializeApp } from 'firebase/app'
import {
  getAuth,
  signInWithEmailAndPassword
} from 'firebase/auth'

// Firebase holders
let app: any = null
let auth: any = null

async function ensureFirebaseInitialized() {
  if (auth) return
  // Try to import project-local config.js (shared file at repo root)
  try {
    // Fetch runtime config served from public at /firebase/config.json
    const res = await fetch('/firebase/config.json')
    if (res.ok) {
      const cfg = await res.json()
      if (cfg) {
        app = initializeApp(cfg)
        auth = getAuth(app)
        return
      }
    }
  } catch (e) {
    console.warn('No local firebase config found at /firebase/config.json or fetch failed:', e)
  }

  // Fallback to Vite env variables if present
  const viteApiKey = (import.meta.env.VITE_FIREBASE_API_KEY as string) || ''
  if (viteApiKey) {
    try {
      const viteConfig = {
        apiKey: viteApiKey,
        authDomain: (import.meta.env.VITE_FIREBASE_AUTH_DOMAIN as string) || '',
        projectId: (import.meta.env.VITE_FIREBASE_PROJECT_ID as string) || ''
      }
      app = initializeApp(viteConfig)
      auth = getAuth(app)
      return
    } catch (e) {
      console.warn('Firebase init from Vite env failed:', e)
    }
  }

  console.warn('No Firebase config found (local config or Vite env). Firebase disabled in frontend.')
}

const BACKEND_URL = (import.meta.env.VITE_BACKEND_URL as string) || 'http://localhost:8080/api/auth'

export async function login(email: string, password: string, online: boolean) {
  // Ensure Firebase is initialized (try local config.js first, then Vite env)
  if (online) {
    await ensureFirebaseInitialized()
  }

  // If online and Firebase is configured, prefer Firebase
  if (online && auth) {
    try {
      const userCred = await signInWithEmailAndPassword(auth, email, password)
      const idToken = await userCred.user.getIdToken()
      // Exchange idToken with backend to get a backend session token + user info
      try {
        const res = await axios.post(`${BACKEND_URL}/firebase-login`, { idToken })
        return { success: true, source: 'firebase', ...res.data }
      } catch (be: any) {
        // If backend exchange fails, fall back to returning Firebase token information
        console.warn('Échange idToken → backend échoué, utilisation du token Firebase localement:', be?.message)
        return {
          success: true,
          source: 'firebase',
          user: { uid: userCred.user.uid, email: userCred.user.email, displayName: userCred.user.displayName },
          token: idToken
        }
      }
    } catch (error: any) {
      // If Firebase fails, fall back to backend if possible
      console.warn('Firebase login failed, will try backend if available:', error?.message)
    }
  }

  // Try backend (either offline mode or Firebase unavailable/failed)
  try {
    const res = await axios.post(`${BACKEND_URL}/login`, { email, password })
    return { success: true, source: 'postgres', ...res.data }
  } catch (error: any) {
    // If backend fails, enqueue for later sync
    await enqueue({ type: 'login', email, timestamp: Date.now() })
    throw new Error('Backend local indisponible. Action enregistrée pour synchronisation.')
  }
}

export async function syncOfflineActions() {
  const { drainQueue } = await import('./offlineQueue')
  await drainQueue(async (action) => {
    switch (action.type) {
      case 'login':
        // logins are ephemeral — nothing to do here, or notify backend if desired
        break
      default:
        console.warn('Unknown offline action', action)
    }
  })
}

import axios from 'axios'
import { initializeApp } from 'firebase/app'
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth'

// TODO: remplacer par votre configuration front-end si besoin
const firebaseConfig = {
  // apiKey..., projectId..., etc.
}

let app: any
let auth: any
try {
  app = initializeApp(firebaseConfig)
  auth = getAuth(app)
} catch (e) {
  // initialization may fail in SSR or if config missing
}

class ConnectivityAuthService {
  isOnline: boolean = typeof navigator !== 'undefined' ? navigator.onLine : true

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => this.handleOnline())
      window.addEventListener('offline', () => this.handleOffline())
    }
  }

  handleOnline() {
    this.isOnline = true
    // TODO: synchroniser la file d'attente
  }

  handleOffline() {
    this.isOnline = false
  }

  async login(email: string, password: string) {
    if (this.isOnline && auth) {
      try {
        const userCred = await signInWithEmailAndPassword(auth, email, password)
        const token = await userCred.user.getIdToken()
        localStorage.setItem('authToken', token)
        return { provider: 'firebase', token }
      } catch (err) {
        return this.loginBackend(email, password)
      }
    } else {
      // offline: try local session
      const token = localStorage.getItem('authToken')
      if (token) return { provider: 'local', token }
      throw new Error('Hors-ligne et pas de session locale')
    }
  }

  async loginBackend(email: string, password: string) {
    const resp = await axios.post('/api/auth/login', { email, motDePasse: password })
    const token = resp.data?.token
    if (token) localStorage.setItem('authToken', token)
    return { provider: 'backend', token }
  }

  async register(email: string, password: string) {
    if (this.isOnline && auth) {
      try {
        await createUserWithEmailAndPassword(auth, email, password)
        return { provider: 'firebase' }
      } catch (err) {
        return axios.post('/api/auth/inscription', { email, motDePasse: password })
      }
    } else {
      // Queue registration for sync when online
      // TODO: implement IndexedDB queue
      return { queued: true }
    }
  }

  logout() {
    localStorage.removeItem('authToken')
    if (auth) {
      try { auth.signOut() } catch (e) {}
    }
  }

  getToken() {
    return localStorage.getItem('authToken')
  }
}

export default new ConnectivityAuthService()

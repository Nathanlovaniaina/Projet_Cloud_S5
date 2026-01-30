import axios from 'axios'
import { enqueue } from './offlineQueue'
import { initializeApp } from 'firebase/app'
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile as firebaseUpdateProfile,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
  signOut
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
        // If backend explicitly reports user blocked, surface that as an error
        const backendMessage: string | undefined = res.data?.message
        if (backendMessage && /bloqu/i.test(backendMessage)) {
          throw new Error(backendMessage)
        }

        // Persist token/user for frontend state
        try {
          if (res.data?.token) localStorage.setItem('token', res.data.token)
          if (res.data?.user) localStorage.setItem('user', JSON.stringify(res.data.user))
          // notify app of auth change in this tab
          window.dispatchEvent(new Event('authchange'))
        } catch (e) {
          console.warn('Unable to persist auth data locally', e)
        }

        return { success: true, source: 'firebase', ...res.data }
      } catch (be: any) {
        // If backend exchange fails, check if backend responded with a blocked message
        const respData = be?.response?.data
        const backendMsg = respData?.message || respData?.error
        if (backendMsg && /bloqu/i.test(backendMsg)) {
          throw new Error(backendMsg)
        }

        // Otherwise fall back to returning Firebase token information
        console.warn('Échange idToken → backend échoué, utilisation du token Firebase localement:', be?.message)
        try {
          const userObj = { uid: userCred.user.uid, email: userCred.user.email, displayName: userCred.user.displayName }
          localStorage.setItem('token', idToken)
          localStorage.setItem('user', JSON.stringify(userObj))
          window.dispatchEvent(new Event('authchange'))
        } catch (e) {
          console.warn('Unable to persist firebase token locally', e)
        }

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
    const res = await axios.post(`${BACKEND_URL}/login`, { email, motDePasse: password })
    // persist token/user locally
    try {
      if (res.data?.token) localStorage.setItem('token', res.data.token)

      // Backend may return either a wrapped `user` object (res.data.user)
      // or flat fields (res.data.idUtilisateur, res.data.nom, res.data.prenom, res.data.email, res.data.typeUtilisateur).
      let userObj = null
      if (res.data?.user) {
        userObj = res.data.user
      } else if (res.data?.idUtilisateur) {
        userObj = {
          idUtilisateur: res.data.idUtilisateur,
          nom: res.data.nom,
          prenom: res.data.prenom,
          email: res.data.email,
          // keep typeUtilisateur as-is (could be a string libelle or an object).
          typeUtilisateur: res.data.typeUtilisateur || null
        }
      }

      if (userObj) localStorage.setItem('user', JSON.stringify(userObj))
      window.dispatchEvent(new Event('authchange'))
    } catch (e) {
      console.warn('Unable to persist auth data locally', e)
    }

    return { success: true, source: 'postgres', ...res.data }
  } catch (error: any) {
    // If backend responded with an HTTP error, surface its message to the UI
    const resp = error?.response?.data
    if (resp) {
      const backendMsg = typeof resp === 'string' ? resp : resp.message || resp.error || error?.response?.statusText
      throw new Error(backendMsg || 'Erreur lors de la connexion via le backend')
    }

    // Otherwise (network error), enqueue for later sync
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

// Fonction pour l'inscription
export async function register(
  userData: {
    nom: string
    prenom: string
    email: string
    password: string
    telephone?: string
    typeUtilisateur: string
  },
  online: boolean
) {
  // Persist the registration info locally first so we can retry/complete insertion
  try {
    localStorage.setItem('pendingRegister', JSON.stringify({
      nom: userData.nom,
      prenom: userData.prenom,
      email: userData.email,
      motDePasse: userData.password,
      telephone: userData.telephone || null,
      typeUtilisateur: userData.typeUtilisateur
    }))
  } catch (e) {
    console.warn('Unable to persist pending registration locally', e)
  }

  // Ensure Firebase is initialized if online
  if (online) {
    await ensureFirebaseInitialized()
  }

  // If online and Firebase is configured, prefer Firebase flow
  if (online && auth) {
    try {
      // Create the user in Firebase Auth
      const userCred = await createUserWithEmailAndPassword(auth, userData.email, userData.password)

      // Update the displayName in Firebase (best-effort)
      try {
        await firebaseUpdateProfile(userCred.user, { displayName: `${userData.prenom} ${userData.nom}` })
      } catch (e) {
        console.warn('Could not update firebase displayName', e)
      }

      // Retrieve the Firebase idToken
      const idToken = await userCred.user.getIdToken()

      // Read the persisted info to send to backend (fallback to current data)
      let stored = null
      try {
        const raw = localStorage.getItem('pendingRegister')
        stored = raw ? JSON.parse(raw) : null
      } catch (e) {
        stored = null
      }

      const payload = {
        idToken,
        nom: stored?.nom || userData.nom,
        prenom: stored?.prenom || userData.prenom,
        email: userData.email,
        motDePasse: stored?.motDePasse || userData.password,
        telephone: stored?.telephone || userData.telephone || null,
        typeUtilisateur: stored?.typeUtilisateur || userData.typeUtilisateur
      }

      // Send to backend to create user record (backend should verify idToken and persist firebase_uid)
      const res = await axios.post(`${BACKEND_URL}/register`, payload)

      // Clear pending register on success
      try { localStorage.removeItem('pendingRegister') } catch (e) { /* ignore */ }

      return { success: true, source: 'firebase', ...res.data }
    } catch (error: any) {
      // Keep pendingRegister for retry and surface error
      console.error('Firebase registration flow failed', error)
      throw new Error(error?.message || 'Inscription Firebase échouée. Réessayez plus tard.')
    }
  }

  // Fallback: Try backend only (offline mode or Firebase unavailable)
  try {
    const res = await axios.post(`${BACKEND_URL}/inscription`, {
      nom: userData.nom,
      prenom: userData.prenom,
      email: userData.email,
      motDePasse: userData.password,
      telephone: userData.telephone,
      typeUtilisateur: userData.typeUtilisateur
    })

    // Clear pending register on success
    try { localStorage.removeItem('pendingRegister') } catch (e) { /* ignore */ }

    return { success: true, source: 'postgres', ...res.data }
  } catch (error: any) {
    // If backend fails, enqueue for later sync (keeps pendingRegister in localStorage)
    await enqueue({ type: 'register', userData, timestamp: Date.now() })
    throw new Error('Backend local indisponible. Inscription enregistrée pour synchronisation.')
  }
}

// Fonction pour récupérer l'utilisateur actuel
export async function getCurrentUser() {
  // Vérifier si un token existe en localStorage
  const token = localStorage.getItem('token')
  const userStr = localStorage.getItem('user')
  
  if (!token) {
    throw new Error('Non authentifié')
  }
  
  // Si on a déjà l'utilisateur en localStorage
  if (userStr) {
    return JSON.parse(userStr)
  }
  
  // Sinon, récupérer depuis le backend
  try {
    const res = await axios.get(`${BACKEND_URL}/me`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    return res.data.user
  } catch (err) {
    throw new Error('Impossible de récupérer les informations utilisateur')
  }
}

// Fonction pour mettre à jour le profil
export async function updateProfile(
  updateData: {
    nom?: string
    prenom?: string
    telephone?: string
    currentPassword?: string
    newPassword?: string
  },
  online: boolean
) {
  const token = localStorage.getItem('token')
  if (!token) {
    throw new Error('Non authentifié')
  }
  
  // Si en ligne et Firebase initialisé
  if (online) {
    await ensureFirebaseInitialized()
  }
  
  // Mise à jour Firebase si en ligne et disponible
  if (online && auth && auth.currentUser) {
    try {
      // Mettre à jour le displayName dans Firebase
      if (updateData.nom || updateData.prenom) {
        const currentUser = auth.currentUser
        await firebaseUpdateProfile(currentUser, {
          displayName: `${updateData.prenom || ''} ${updateData.nom || ''}`.trim()
        })
      }
      
      // Changer le mot de passe Firebase si demandé
      if (updateData.newPassword && updateData.currentPassword) {
        const credential = EmailAuthProvider.credential(
          auth.currentUser.email,
          updateData.currentPassword
        )
        await reauthenticateWithCredential(auth.currentUser, credential)
        await updatePassword(auth.currentUser, updateData.newPassword)
      }
      
      // Récupérer le token mis à jour
      const idToken = await auth.currentUser.getIdToken(true)
      
      // Synchroniser avec le backend: preferer le token de session si présent, sinon utiliser idToken
      try {
        // try to get session token and user id from localStorage
        let sessionToken = localStorage.getItem('token')
        let userRaw = localStorage.getItem('user')
        let idUtilisateur: any = null
        if (userRaw) {
          try { idUtilisateur = JSON.parse(userRaw).idUtilisateur } catch (e) { idUtilisateur = null }
        }

        // if no id found, attempt to fetch /me
        if (!idUtilisateur) {
          try {
            const me = await axios.get(`${BACKEND_URL}/me`, { headers: sessionToken ? { Authorization: `Bearer ${sessionToken}` } : {} })
            idUtilisateur = me.data?.user?.idUtilisateur
          } catch (e) {
            // ignore
          }
        }

        const authHeader = sessionToken ? { Authorization: `Bearer ${sessionToken}` } : { Authorization: `Bearer ${idToken}` }
        const targetId = idUtilisateur ? idUtilisateur : (updateData as any).idUtilisateur

        if (!targetId) {
          // Try to let the backend identify the user from token by hitting /me first
          try {
            const me = await axios.get(`${BACKEND_URL}/me`, { headers: authHeader })
            const meId = me.data?.user?.idUtilisateur
            if (meId) {
              // set targetId for PUT below
              // eslint-disable-next-line no-unused-vars
              ;(updateData as any).idUtilisateur = meId
            }
          } catch (e) {
            // ignore
          }
        }

        const finalTargetId = idUtilisateur ? idUtilisateur : (updateData as any).idUtilisateur
        if (!finalTargetId) {
          return { success: true, source: 'firebase', warning: 'Profil mis à jour localement sur Firebase mais impossible de sync backend (id utilisateur manquant)' }
        }

        // Build payload matching backend DTO (UpdateUtilisateurRequest)
        const backendPayload: any = {}
        if ((updateData as any).nom) backendPayload.nom = (updateData as any).nom
        if ((updateData as any).prenom) backendPayload.prenom = (updateData as any).prenom
        if ((updateData as any).email) backendPayload.email = (updateData as any).email
        if ((updateData as any).newPassword) backendPayload.motDePasse = (updateData as any).newPassword
        // include firebase uid when available
        if (auth.currentUser && auth.currentUser.uid) backendPayload.firebaseUid = auth.currentUser.uid

        const res = await axios.put(
          `${BACKEND_URL}/utilisateur/${finalTargetId}`,
          backendPayload,
          { headers: authHeader }
        )

        // After successful update, try to fetch updated user from backend for frontend state
        try {
          const me = await axios.get(`${BACKEND_URL}/me`, { headers: authHeader })
          return { success: true, source: 'firebase', ...res.data, user: me.data?.user }
        } catch (e) {
          return { success: true, source: 'firebase', ...res.data }
        }
      } catch (be: any) {
        console.warn('Sync backend échouée:', be?.message)
        return {
          success: true,
          source: 'firebase',
          warning: 'Modifications Firebase réussies mais sync backend échouée'
        }
      }
    } catch (error: any) {
      throw new Error(`Mise à jour Firebase échouée: ${error.message}`)
    }
  }
  
  // Mise à jour backend uniquement (mode hors ligne)
    try {
      // Determine user id to update
      let idUtilisateur: any = null
      try {
        const raw = localStorage.getItem('user')
        if (raw) idUtilisateur = JSON.parse(raw).idUtilisateur
      } catch (e) { idUtilisateur = null }

      if (!idUtilisateur) {
        // fallback: call /me to get id
        try {
          const me = await axios.get(`${BACKEND_URL}/me`, { headers: { Authorization: `Bearer ${token}` } })
          idUtilisateur = me.data?.user?.idUtilisateur
        } catch (e) { /* ignore */ }
      }

      if (!idUtilisateur) throw new Error('Impossible de déterminer l\'ID utilisateur pour la mise à jour')

      // Map frontend fields to backend DTO
      const backendPayload: any = {}
      if ((updateData as any).nom) backendPayload.nom = (updateData as any).nom
      if ((updateData as any).prenom) backendPayload.prenom = (updateData as any).prenom
      if ((updateData as any).email) backendPayload.email = (updateData as any).email
      if ((updateData as any).newPassword) backendPayload.motDePasse = (updateData as any).newPassword
      if (auth && auth.currentUser && auth.currentUser.uid) backendPayload.firebaseUid = auth.currentUser.uid

      const res = await axios.put(
        `${BACKEND_URL}/utilisateur/${idUtilisateur}`,
        backendPayload,
        { headers: { Authorization: `Bearer ${token}` } }
      )
      // Try to refresh user state
      try {
        const me = await axios.get(`${BACKEND_URL}/me`, { headers: { Authorization: `Bearer ${token}` } })
        return { success: true, source: 'postgres', ...res.data, user: me.data?.user }
      } catch (e) {
        return { success: true, source: 'postgres', ...res.data }
      }
    } catch (error: any) {
    // Enqueue pour sync ultérieure
    await enqueue({
      type: 'updateProfile',
      updateData,
      timestamp: Date.now()
    })
    throw new Error('Backend indisponible. Modifications enregistrées pour synchronisation.')
  }
}

// Fonction pour se déconnecter
export async function logout() {
  // Déconnexion Firebase si initialisé
  if (auth && auth.currentUser) {
    try {
      await signOut(auth)
    } catch (err) {
      console.warn('Firebase signOut failed:', err)
    }
  }
  
  // Nettoyer localStorage
  localStorage.removeItem('token')
  localStorage.removeItem('user')
  
  // Rediriger vers login
  window.location.href = '/login'
}

// Fonction pour vérifier si l'utilisateur est connecté
export function isAuthenticated(): boolean {
  return !!localStorage.getItem('token')
}

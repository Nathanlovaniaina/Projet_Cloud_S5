# Guide d'Implémentation - Tâches 41, 43 et Amélioration du Dashboard

## 📋 Vue d'ensemble

Ce guide détaille l'implémentation de :
- **Tâche 41** : Composant d'inscription avec basculement Firebase/PostgreSQL
- **Tâche 43** : Composant de modification de profil utilisateur
- **Dashboard amélioré** : Gestion dynamique de l'affichage selon l'état de connexion
- **CSS harmonisé** : Style unifié pour tous les composants d'authentification

---

## 🎯 Tâche 41 : Composant d'Inscription (RegisterForm)

### Objectif
Créer un composant d'inscription qui s'adapte automatiquement selon la connectivité Internet :
- **En ligne** : Inscription via Firebase (créé dans Firebase Auth + enregistrement backend)
- **Hors ligne** : Inscription via PostgreSQL local uniquement

### Fichier à créer
`front_end_web/src/components/RegisterForm.tsx`

### Structure du composant

```tsx
import React, { useState } from 'react'
import { useConnectivity } from '../hooks/useConnectivity'
import { register } from '../services/authService'
import '../styles/auth.css' // CSS unifié pour auth

export default function RegisterForm() {
  const isOnline = useConnectivity()
  
  const [formData, setFormData] = useState({
    nom: '',
    prenom: '',
    email: '',
    password: '',
    confirmPassword: '',
    telephone: '',
    typeUtilisateur: 'CITOYEN' // Par défaut CITOYEN
  })
  
  const [status, setStatus] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    
    // Validation
    if (formData.password !== formData.confirmPassword) {
      setStatus('❌ Les mots de passe ne correspondent pas')
      return
    }
    
    if (formData.password.length < 6) {
      setStatus('❌ Le mot de passe doit contenir au moins 6 caractères')
      return
    }

    setLoading(true)
    setStatus('En cours...')
    
    try {
      const result = await register(formData, isOnline)
      
      if (result.source === 'firebase') {
        setStatus('✅ Inscription réussie via Firebase (cloud)')
        if (result.token) localStorage.setItem('token', result.token)
        if (result.user) localStorage.setItem('user', JSON.stringify(result.user))
        // Redirection après inscription
        setTimeout(() => window.location.href = '/', 1500)
      } else if (result.source === 'postgres') {
        setStatus('✅ Inscription réussie via PostgreSQL (local)')
        if (result.token) localStorage.setItem('token', result.token)
        if (result.user) localStorage.setItem('user', JSON.stringify(result.user))
        setTimeout(() => window.location.href = '/', 1500)
      }
    } catch (err: any) {
      setStatus(`❌ ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  const statusClass = status?.startsWith('✅') 
    ? 'auth-status success' 
    : status?.startsWith('❌') 
    ? 'auth-status error' 
    : 'auth-status'

  return (
    <div className="auth-container">
      <div className="auth-card">
        <form onSubmit={handleSubmit}>
          <div className="auth-brand">Signalement</div>
          <h2 className="auth-title">Inscription</h2>
          
          <div className="auth-mode">
            {isOnline 
              ? '🌐 Mode en ligne - Inscription Firebase + Backend' 
              : '📴 Mode hors ligne - Inscription locale PostgreSQL'
            }
          </div>

          {/* Nom */}
          <label className="auth-label">Nom</label>
          <input 
            className="auth-input" 
            value={formData.nom}
            onChange={e => setFormData({...formData, nom: e.target.value})}
            placeholder="Votre nom"
            required
          />

          {/* Prénom */}
          <label className="auth-label">Prénom</label>
          <input 
            className="auth-input" 
            value={formData.prenom}
            onChange={e => setFormData({...formData, prenom: e.target.value})}
            placeholder="Votre prénom"
            required
          />

          {/* Email */}
          <label className="auth-label">Email</label>
          <input 
            className="auth-input" 
            type="email"
            value={formData.email}
            onChange={e => setFormData({...formData, email: e.target.value})}
            placeholder="votre@email.com"
            required
          />

          {/* Téléphone */}
          <label className="auth-label">Téléphone</label>
          <input 
            className="auth-input" 
            type="tel"
            value={formData.telephone}
            onChange={e => setFormData({...formData, telephone: e.target.value})}
            placeholder="+261 34 00 000 00"
          />

          {/* Type Utilisateur */}
          <label className="auth-label">Type d'utilisateur</label>
          <select 
            className="auth-input"
            value={formData.typeUtilisateur}
            onChange={e => setFormData({...formData, typeUtilisateur: e.target.value})}
          >
            <option value="CITOYEN">Citoyen</option>
            <option value="MANAGER">Manager</option>
          </select>

          {/* Mot de passe */}
          <label className="auth-label">Mot de passe</label>
          <input 
            className="auth-input" 
            type="password"
            value={formData.password}
            onChange={e => setFormData({...formData, password: e.target.value})}
            placeholder="••••••••"
            required
          />

          {/* Confirmation mot de passe */}
          <label className="auth-label">Confirmer le mot de passe</label>
          <input 
            className="auth-input" 
            type="password"
            value={formData.confirmPassword}
            onChange={e => setFormData({...formData, confirmPassword: e.target.value})}
            placeholder="••••••••"
            required
          />

          <button 
            className="auth-button" 
            type="submit" 
            disabled={loading}
          >
            {loading ? 'Inscription...' : 'S\'INSCRIRE'}
          </button>
          
          {status && <p className={statusClass}>{status}</p>}
          
          <div className="auth-footer">
            <span style={{color: '#64748b', fontSize: '13px'}}>Déjà inscrit ? </span>
            <a href="/login" className="auth-forgot">Se connecter</a>
          </div>
        </form>
      </div>
    </div>
  )
}
```

---

## 🔧 Mise à jour du service d'authentification

### Fichier à modifier
`front_end_web/src/services/authService.ts`

### Ajouter la fonction `register`

```typescript
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile
} from 'firebase/auth'

// ... code existant ...

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
  // Ensure Firebase is initialized if online
  if (online) {
    await ensureFirebaseInitialized()
  }

  // If online and Firebase is configured, prefer Firebase
  if (online && auth) {
    try {
      // 1. Créer l'utilisateur dans Firebase Auth
      const userCred = await createUserWithEmailAndPassword(
        auth, 
        userData.email, 
        userData.password
      )
      
      // 2. Mettre à jour le displayName dans Firebase
      await updateProfile(userCred.user, {
        displayName: `${userData.prenom} ${userData.nom}`
      })
      
      // 3. Récupérer le token Firebase
      const idToken = await userCred.user.getIdToken()
      
      // 4. Envoyer au backend pour enregistrement en base PostgreSQL
      try {
        const res = await axios.post(`${BACKEND_URL}/register`, {
          firebaseUid: userCred.user.uid,
          nom: userData.nom,
          prenom: userData.prenom,
          email: userData.email,
          telephone: userData.telephone,
          typeUtilisateur: userData.typeUtilisateur,
          idToken: idToken
        })
        
        return { 
          success: true, 
          source: 'firebase', 
          ...res.data 
        }
      } catch (be: any) {
        console.warn('Enregistrement backend échoué après création Firebase:', be?.message)
        // Firebase user créé mais pas enregistré en backend
        return {
          success: true,
          source: 'firebase',
          user: { 
            uid: userCred.user.uid, 
            email: userCred.user.email, 
            displayName: userCred.user.displayName 
          },
          token: idToken,
          warning: 'Utilisateur créé dans Firebase mais pas encore synchronisé avec le backend'
        }
      }
    } catch (error: any) {
      console.warn('Firebase registration failed:', error?.message)
      throw new Error(`Inscription Firebase échouée: ${error.message}`)
    }
  }

  // Try backend only (offline mode or Firebase unavailable)
  try {
    const res = await axios.post(`${BACKEND_URL}/inscription`, {
      nom: userData.nom,
      prenom: userData.prenom,
      email: userData.email,
      motDePasse: userData.password,
      telephone: userData.telephone,
      typeUtilisateur: userData.typeUtilisateur
    })
    
    return { success: true, source: 'postgres', ...res.data }
  } catch (error: any) {
    // If backend fails, enqueue for later sync
    await enqueue({ 
      type: 'register', 
      userData, 
      timestamp: Date.now() 
    })
    throw new Error('Backend local indisponible. Inscription enregistrée pour synchronisation.')
  }
}
```

---

## 👤 Tâche 43 : Composant de Modification de Profil

### Objectif
Permettre à l'utilisateur de modifier ses informations personnelles avec synchronisation Firebase/PostgreSQL

### Fichier à créer
`front_end_web/src/components/ProfileForm.tsx`

### Structure du composant

```tsx
import React, { useState, useEffect } from 'react'
import { useConnectivity } from '../hooks/useConnectivity'
import { updateProfile as updateUserProfile, getCurrentUser } from '../services/authService'
import '../styles/auth.css'

export default function ProfileForm() {
  const isOnline = useConnectivity()
  
  const [formData, setFormData] = useState({
    nom: '',
    prenom: '',
    email: '',
    telephone: '',
    currentPassword: '',
    newPassword: '',
    confirmNewPassword: ''
  })
  
  const [status, setStatus] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [loadingUser, setLoadingUser] = useState(true)

  // Charger les infos utilisateur au montage
  useEffect(() => {
    async function loadUser() {
      try {
        const user = await getCurrentUser()
        if (user) {
          setFormData({
            nom: user.nom || '',
            prenom: user.prenom || '',
            email: user.email || '',
            telephone: user.telephone || '',
            currentPassword: '',
            newPassword: '',
            confirmNewPassword: ''
          })
        }
      } catch (err) {
        console.error('Erreur chargement utilisateur:', err)
      } finally {
        setLoadingUser(false)
      }
    }
    loadUser()
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    
    // Validation si changement de mot de passe
    if (formData.newPassword) {
      if (formData.newPassword !== formData.confirmNewPassword) {
        setStatus('❌ Les nouveaux mots de passe ne correspondent pas')
        return
      }
      
      if (formData.newPassword.length < 6) {
        setStatus('❌ Le nouveau mot de passe doit contenir au moins 6 caractères')
        return
      }
      
      if (!formData.currentPassword) {
        setStatus('❌ Veuillez saisir votre mot de passe actuel')
        return
      }
    }

    setLoading(true)
    setStatus('Mise à jour en cours...')
    
    try {
      const updateData: any = {
        nom: formData.nom,
        prenom: formData.prenom,
        telephone: formData.telephone
      }
      
      // Ajout du mot de passe si modification
      if (formData.newPassword) {
        updateData.currentPassword = formData.currentPassword
        updateData.newPassword = formData.newPassword
      }
      
      const result = await updateUserProfile(updateData, isOnline)
      
      if (result.success) {
        setStatus('✅ Profil mis à jour avec succès')
        // Réinitialiser les champs de mot de passe
        setFormData({
          ...formData,
          currentPassword: '',
          newPassword: '',
          confirmNewPassword: ''
        })
        
        // Mettre à jour localStorage si modifié
        if (result.user) {
          localStorage.setItem('user', JSON.stringify(result.user))
        }
      }
    } catch (err: any) {
      setStatus(`❌ ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  if (loadingUser) {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <p>Chargement...</p>
        </div>
      </div>
    )
  }

  const statusClass = status?.startsWith('✅') 
    ? 'auth-status success' 
    : status?.startsWith('❌') 
    ? 'auth-status error' 
    : 'auth-status'

  return (
    <div className="auth-container">
      <div className="auth-card">
        <form onSubmit={handleSubmit}>
          <div className="auth-brand">Signalement</div>
          <h2 className="auth-title">Mon Profil</h2>
          
          <div className="auth-mode">
            {isOnline 
              ? '🌐 Mode en ligne - Synchronisation avec Firebase' 
              : '📴 Mode hors ligne - Modifications locales'
            }
          </div>

          {/* Informations personnelles */}
          <label className="auth-label">Nom</label>
          <input 
            className="auth-input" 
            value={formData.nom}
            onChange={e => setFormData({...formData, nom: e.target.value})}
            placeholder="Votre nom"
          />

          <label className="auth-label">Prénom</label>
          <input 
            className="auth-input" 
            value={formData.prenom}
            onChange={e => setFormData({...formData, prenom: e.target.value})}
            placeholder="Votre prénom"
          />

          <label className="auth-label">Email</label>
          <input 
            className="auth-input" 
            type="email"
            value={formData.email}
            disabled
            style={{background: '#e2e8f0', cursor: 'not-allowed'}}
          />
          <small style={{color: '#64748b', fontSize: '11px', marginTop: '-10px', display: 'block'}}>
            L'email ne peut pas être modifié
          </small>

          <label className="auth-label">Téléphone</label>
          <input 
            className="auth-input" 
            type="tel"
            value={formData.telephone}
            onChange={e => setFormData({...formData, telephone: e.target.value})}
            placeholder="+261 34 00 000 00"
          />

          {/* Changement de mot de passe (optionnel) */}
          <div style={{marginTop: '20px', paddingTop: '20px', borderTop: '1px solid #e2e8f0'}}>
            <h3 style={{fontSize: '16px', marginBottom: '12px', color: '#0f172a'}}>
              Changer le mot de passe (optionnel)
            </h3>
            
            <label className="auth-label">Mot de passe actuel</label>
            <input 
              className="auth-input" 
              type="password"
              value={formData.currentPassword}
              onChange={e => setFormData({...formData, currentPassword: e.target.value})}
              placeholder="••••••••"
            />

            <label className="auth-label">Nouveau mot de passe</label>
            <input 
              className="auth-input" 
              type="password"
              value={formData.newPassword}
              onChange={e => setFormData({...formData, newPassword: e.target.value})}
              placeholder="••••••••"
            />

            <label className="auth-label">Confirmer nouveau mot de passe</label>
            <input 
              className="auth-input" 
              type="password"
              value={formData.confirmNewPassword}
              onChange={e => setFormData({...formData, confirmNewPassword: e.target.value})}
              placeholder="••••••••"
            />
          </div>

          <button 
            className="auth-button" 
            type="submit" 
            disabled={loading}
          >
            {loading ? 'Mise à jour...' : 'METTRE À JOUR'}
          </button>
          
          {status && <p className={statusClass}>{status}</p>}
          
          <div className="auth-footer">
            <a href="/" className="auth-forgot">Retour à l'accueil</a>
          </div>
        </form>
      </div>
    </div>
  )
}
```

---

## 🔧 Ajout des fonctions au service

### Fichier à modifier : `authService.ts`

```typescript
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
        await updateProfile(currentUser, {
          displayName: `${updateData.prenom || ''} ${updateData.nom || ''}`.trim()
        })
      }
      
      // Changer le mot de passe Firebase si demandé
      if (updateData.newPassword && updateData.currentPassword) {
        const { updatePassword, reauthenticateWithCredential, EmailAuthProvider } = await import('firebase/auth')
        const credential = EmailAuthProvider.credential(
          auth.currentUser.email,
          updateData.currentPassword
        )
        await reauthenticateWithCredential(auth.currentUser, credential)
        await updatePassword(auth.currentUser, updateData.newPassword)
      }
      
      // Récupérer le token mis à jour
      const idToken = await auth.currentUser.getIdToken(true)
      
      // Synchroniser avec le backend
      try {
        const res = await axios.put(
          `${BACKEND_URL}/profile`, 
          updateData,
          { headers: { Authorization: `Bearer ${idToken}` } }
        )
        return { success: true, source: 'firebase', ...res.data }
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
    const res = await axios.put(
      `${BACKEND_URL}/profile`,
      updateData,
      { headers: { Authorization: `Bearer ${token}` } }
    )
    return { success: true, source: 'postgres', ...res.data }
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
      const { signOut } = await import('firebase/auth')
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
```

---

## 🎨 CSS Unifié pour tous les composants d'authentification

### Renommer le fichier
`front_end_web/src/styles/login.css` → `front_end_web/src/styles/auth.css`

### Contenu du fichier CSS (déjà modernisé)
Le fichier `login.css` actuel contient déjà un style moderne. Il suffit de :
1. Le renommer en `auth.css`
2. Mettre à jour les imports dans tous les composants pour utiliser `auth.css`

### Classes supplémentaires à ajouter (si besoin)

```css
/* Ajouts pour les selects et textarea */
.auth-input, 
select.auth-input {
  width: 100%;
  padding: 13px 16px;
  margin: 0 0 18px 0;
  border-radius: 8px;
  border: 1.5px solid #e0e7ef;
  background: #f8fafc;
  outline: none;
  font-size: 15px;
  color: #0f172a;
  box-sizing: border-box;
  transition: border 0.2s, box-shadow 0.2s;
  font-family: inherit;
}

select.auth-input {
  cursor: pointer;
}

/* Small text hints */
.auth-hint {
  font-size: 11px;
  color: #64748b;
  margin-top: -12px;
  margin-bottom: 12px;
  display: block;
}

/* Section dividers */
.auth-section-divider {
  margin: 20px 0;
  padding-top: 20px;
  border-top: 1px solid #e2e8f0;
}

.auth-section-title {
  font-size: 16px;
  margin-bottom: 12px;
  color: #0f172a;
  font-weight: 600;
}
```

---

## 📱 Modification du Dashboard (App.tsx)

### Objectif
Afficher dynamiquement les boutons selon l'état de connexion de l'utilisateur

### Fichier à modifier
`front_end_web/src/App.tsx`

### Code mis à jour

```tsx
import React, { Suspense, lazy, useState, useEffect } from 'react'
import './App.css'
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom'
import ErrorBoundary from './components/ErrorBoundary'
import { isAuthenticated, logout } from './services/authService'

const MapLibreMap = lazy(() => import('./components/MapLibreMap'))
const LoginForm = lazy(() => import('./components/LoginForm'))
const RegisterForm = lazy(() => import('./components/RegisterForm'))
const ProfileForm = lazy(() => import('./components/ProfileForm'))

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [userName, setUserName] = useState<string>('')

  // Vérifier l'authentification au montage et aux changements
  useEffect(() => {
    const checkAuth = () => {
      const authenticated = isAuthenticated()
      setIsLoggedIn(authenticated)
      
      if (authenticated) {
        const userStr = localStorage.getItem('user')
        if (userStr) {
          try {
            const user = JSON.parse(userStr)
            setUserName(`${user.prenom || ''} ${user.nom || ''}`.trim() || user.email)
          } catch (e) {
            setUserName('Utilisateur')
          }
        }
      }
    }
    
    checkAuth()
    
    // Écouter les changements de localStorage (pour multi-onglets)
    window.addEventListener('storage', checkAuth)
    return () => window.removeEventListener('storage', checkAuth)
  }, [])

  const handleLogout = async () => {
    if (confirm('Voulez-vous vraiment vous déconnecter ?')) {
      await logout()
      setIsLoggedIn(false)
    }
  }

  return (
    <div style={{ color: 'white', minHeight: '100vh' }}>
      <BrowserRouter>
        <header style={{ 
          padding: '12px 24px', 
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'linear-gradient(90deg, #1e293b 0%, #334155 100%)'
        }}>
          <div>
            <strong style={{ fontSize: '18px' }}>Projet S5 — Signalement</strong>
          </div>
          
          <nav style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
            <Link to="/" style={{ color: '#60a5fa', textDecoration: 'none' }}>
              Carte
            </Link>
            
            {isLoggedIn ? (
              <>
                <Link to="/profile" style={{ color: '#60a5fa', textDecoration: 'none' }}>
                  👤 {userName}
                </Link>
                <button
                  onClick={handleLogout}
                  style={{
                    background: '#dc2626',
                    color: 'white',
                    border: 'none',
                    padding: '6px 12px',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: 600
                  }}
                >
                  Déconnexion
                </button>
              </>
            ) : (
              <>
                <Link to="/login" style={{ color: '#60a5fa', textDecoration: 'none' }}>
                  Se connecter
                </Link>
                <Link 
                  to="/register" 
                  style={{ 
                    background: '#2563eb',
                    color: 'white',
                    padding: '6px 12px',
                    borderRadius: '6px',
                    textDecoration: 'none',
                    fontWeight: 600
                  }}
                >
                  S'inscrire
                </Link>
              </>
            )}
          </nav>
        </header>

        <main style={{ height: 'calc(100vh - 48px)' }}>
          <Suspense fallback={<div style={{ padding: 16 }}>Chargement…</div>}>
            <ErrorBoundary>
              <Routes>
                <Route path="/login" element={<LoginForm />} />
                <Route path="/register" element={<RegisterForm />} />
                <Route path="/profile" element={<ProfileForm />} />
                <Route path="/" element={<MapLibreMap />} />
                <Route path="*" element={<MapLibreMap />} />
              </Routes>
            </ErrorBoundary>
          </Suspense>
        </main>
      </BrowserRouter>
    </div>
  )
}

export default App
```

---

## 🔐 Backend - Endpoints nécessaires

### Routes à implémenter côté Java Spring Boot

```java
// AuthenticationController.java

@PostMapping("/register")
public ResponseEntity<?> register(@RequestBody InscriptionRequest request) {
    // Créer utilisateur en base PostgreSQL
    // Stocker firebaseUid si fourni
    // Retourner token + infos user
}

@PostMapping("/firebase-login")
public ResponseEntity<?> firebaseLogin(@RequestBody Map<String, String> request) {
    // Vérifier idToken Firebase
    // Créer/récupérer utilisateur en base via firebaseUid
    // Retourner token session + infos user
}

@GetMapping("/me")
public ResponseEntity<?> getCurrentUser(HttpServletRequest request) {
    // Récupérer utilisateur depuis token dans header
    // Retourner infos user
}

@PutMapping("/profile")
public ResponseEntity<?> updateProfile(
    @RequestBody UpdateUtilisateurRequest request,
    HttpServletRequest httpRequest
) {
    // Mettre à jour infos utilisateur
    // Gérer changement de mot de passe si fourni
    // Retourner user mis à jour
}
```

---

## 📝 Checklist d'implémentation

### Tâche 41 : Inscription
- [ ] Créer `RegisterForm.tsx`
- [ ] Ajouter fonction `register()` dans `authService.ts`
- [ ] Importer `createUserWithEmailAndPassword` depuis Firebase
- [ ] Gérer validation des champs (email, password, etc.)
- [ ] Tester inscription en ligne (Firebase + Backend)
- [ ] Tester inscription hors ligne (Backend seul)
- [ ] Ajouter route `/register` dans `App.tsx`

### Tâche 43 : Profil
- [ ] Créer `ProfileForm.tsx`
- [ ] Ajouter fonction `getCurrentUser()` dans `authService.ts`
- [ ] Ajouter fonction `updateProfile()` dans `authService.ts`
- [ ] Importer `updateProfile`, `updatePassword`, `reauthenticateWithCredential` depuis Firebase
- [ ] Gérer validation changement mot de passe
- [ ] Tester modification profil en ligne
- [ ] Tester modification profil hors ligne
- [ ] Ajouter route `/profile` dans `App.tsx`

### Dashboard amélioré
- [ ] Importer `isAuthenticated()` et `logout()` dans `App.tsx`
- [ ] Ajouter state `isLoggedIn` et `userName`
- [ ] Implémenter `useEffect` pour vérifier auth au montage
- [ ] Afficher conditionnellement les boutons Login/Register
- [ ] Afficher nom utilisateur et bouton Déconnexion si connecté
- [ ] Tester navigation selon état connexion

### CSS unifié
- [ ] Renommer `login.css` en `auth.css`
- [ ] Mettre à jour imports dans `LoginForm.tsx`
- [ ] Mettre à jour imports dans `RegisterForm.tsx`
- [ ] Mettre à jour imports dans `ProfileForm.tsx`
- [ ] Ajouter styles pour `select`, `textarea`, hints
- [ ] Tester rendu sur tous les composants
- [ ] Vérifier responsive mobile

### Backend
- [ ] Implémenter endpoint `POST /api/auth/register`
- [ ] Implémenter endpoint `GET /api/auth/me`
- [ ] Implémenter endpoint `PUT /api/auth/profile`
- [ ] Gérer changement mot de passe
- [ ] Tester tous les endpoints avec Swagger

---

## 🚀 Ordre d'implémentation recommandé

1. **Renommer CSS** : `login.css` → `auth.css` et mettre à jour imports
2. **Service auth** : Ajouter `register()`, `getCurrentUser()`, `updateProfile()`, `logout()`, `isAuthenticated()`
3. **RegisterForm** : Créer composant d'inscription
4. **ProfileForm** : Créer composant de profil
5. **App.tsx** : Modifier dashboard avec gestion auth dynamique
6. **Backend** : Implémenter/vérifier tous les endpoints
7. **Tests** : Tester tous les parcours utilisateur

---

## 🧪 Scénarios de test

### Inscription
1. Inscription en ligne → Firebase + Backend
2. Inscription hors ligne → Backend seul
3. Validation email invalide
4. Validation mots de passe différents
5. Validation mot de passe < 6 caractères

### Profil
1. Modification nom/prénom en ligne
2. Modification téléphone hors ligne
3. Changement mot de passe avec réauthentification
4. Tentative changement mot de passe sans mot de passe actuel
5. Tentative modification sans être connecté

### Dashboard
1. Accès sans connexion → Afficher Login/Register
2. Connexion réussie → Afficher nom + Déconnexion
3. Déconnexion → Retour à Login/Register
4. Navigation entre pages avec auth
5. Multi-onglets : connexion dans un onglet se reflète dans l'autre

---

## 📚 Ressources

- [Firebase Auth Documentation](https://firebase.google.com/docs/auth/web/start)
- [React Router v6](https://reactrouter.com/en/main)
- [Axios Documentation](https://axios-http.com/docs/intro)
- [TypeScript React](https://react-typescript-cheatsheet.netlify.app/)

---

**Date de création** : 25 janvier 2026  
**Auteur** : ETU003337  
**Version** : 1.0

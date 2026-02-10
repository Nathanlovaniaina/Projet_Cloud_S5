import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import '../styles/createVisitorForm.css'
import '../styles/manager.css'

const BACKEND_URL = (import.meta.env.VITE_BACKEND_URL as string) || 'http://localhost:8080/api/auth'

export default function CreateVisitorForm() {
  const navigate = useNavigate()
  
  const [formData, setFormData] = useState({
    nom: '',
    prenom: '',
    email: '',
    password: '',
    confirmPassword: ''
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
    setStatus('En cours de création...')
    
    try {
      // Ensure manager is authenticated locally
      const token = localStorage.getItem('token')
      if (!token) {
        setStatus('❌ Vous devez être connecté en tant que Manager')
        setLoading(false)
        return
      }

      // Initialize Firebase client dynamically using runtime config served at /firebase/config.json
      const cfgRes = await fetch('/firebase/config.json')
      if (!cfgRes.ok) {
        setStatus('❌ Configuration Firebase introuvable sur /firebase/config.json')
        setLoading(false)
        return
      }
      const firebaseConfig = await cfgRes.json()

      const { initializeApp } = await import('firebase/app')
      const { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } = await import('firebase/auth')
      const app = initializeApp(firebaseConfig)
      const auth = getAuth(app)

      // Create the user in Firebase (or sign in if already exists) to obtain an idToken
      let userCredential: any = null
      try {
        userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password)
      } catch (fbErr: any) {
        const code = fbErr?.code || ''
        if (code === 'auth/email-already-in-use') {
          // Try to sign in to get idToken if the account already exists
          try {
            userCredential = await signInWithEmailAndPassword(auth, formData.email, formData.password)
          } catch (signErr: any) {
            setStatus(`❌ Erreur Firebase: ${signErr?.message || signErr?.code || 'auth error'}`)
            setLoading(false)
            return
          }
        } else {
          setStatus(`❌ Erreur Firebase: ${fbErr?.message || fbErr?.code || 'auth error'}`)
          setLoading(false)
          return
        }
      }

      const idToken = await userCredential.user.getIdToken()

      // Call backend endpoint that verifies idToken and inserts user into Postgres
      const res = await fetch(`${BACKEND_URL}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          idToken,
          nom: formData.nom,
          prenom: formData.prenom,
          typeUtilisateur: 'Visiteur'
        })
      })

      const result = await res.json().catch(() => ({}))

      if (res.ok && result.success) {
        setStatus('✅ Utilisateur créé avec succès')
        setTimeout(() => navigate('/manager/utilisateurs'), 1500)
      } else {
        setStatus(`❌ ${result.message || 'Erreur lors de la création'}`)
      }
    } catch (err: any) {
      setStatus(`❌ ${err?.message || 'Erreur réseau'}`)
    } finally {
      setLoading(false)
    }
  }

  const statusClass = status?.startsWith('✅') 
    ? 'status-message success' 
    : status?.startsWith('❌') 
    ? 'status-message error' 
    : 'status-message'

  return (
    <div className="manager-container">
      <div className="manager-header">
        <div className="header-content">
          <div>
            <h1 className="manager-title">Créer un compte Visiteur</h1>
            <p className="manager-subtitle">
              Créer un nouveau compte utilisateur de type Visiteur
            </p>
          </div>
          <div className="header-actions">
            <button
              type="button"
              onClick={() => navigate('/manager/utilisateurs')}
              className="btn-secondary"
            >
              ← Retour
            </button>
          </div>
        </div>
      </div>

      <div className="form-card">
        <form onSubmit={handleSubmit}>
          <div className="form-section">
            <h3 className="form-section-title">Informations personnelles</h3>
            
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Nom *</label>
                <input 
                  className="form-input" 
                  value={formData.nom}
                  onChange={e => setFormData({...formData, nom: e.target.value})}
                  placeholder="Dupont"
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Prénom *</label>
                <input 
                  className="form-input" 
                  value={formData.prenom}
                  onChange={e => setFormData({...formData, prenom: e.target.value})}
                  placeholder="Jean"
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Adresse email *</label>
              <input 
                className="form-input" 
                type="email"
                value={formData.email}
                onChange={e => setFormData({...formData, email: e.target.value})}
                placeholder="exemple@email.com"
                required
              />
            </div>
          </div>

          <div className="form-section">
            <h3 className="form-section-title">Mot de passe</h3>
            
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Mot de passe *</label>
                <input 
                  className="form-input" 
                  type="password"
                  value={formData.password}
                  onChange={e => setFormData({...formData, password: e.target.value})}
                  placeholder="••••••••"
                  required
                />
                <p className="form-hint">Minimum 6 caractères</p>
              </div>
              <div className="form-group">
                <label className="form-label">Confirmation du mot de passe *</label>
                <input 
                  className="form-input" 
                  type="password"
                  value={formData.confirmPassword}
                  onChange={e => setFormData({...formData, confirmPassword: e.target.value})}
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>
          </div>

          <div className="form-info">
            <div className="info-badge">
              <span className="info-icon">ℹ️</span>
              <span>Type d'utilisateur : <strong>Visiteur</strong></span>
            </div>
          </div>

          {status && <div className={statusClass}>{status}</div>}

          <div className="form-actions">
            <button 
              type="button"
              onClick={() => navigate('/manager/utilisateurs')}
              className="btn-secondary"
              disabled={loading}
            >
              Annuler
            </button>
            <button 
              type="submit"
              className="btn-primary" 
              disabled={loading}
            >
              {loading ? 'Création en cours...' : 'Créer l\'utilisateur'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

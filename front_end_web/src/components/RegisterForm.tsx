import React, { useState, useEffect } from 'react'
import { useConnectivity } from '../hooks/useConnectivity'
import { register } from '../services/authService'
// import '../styles/auth.css'
import '../styles/register.css' // Fichier CSS additionnel pour l'inscription

export default function RegisterForm() {
  const isOnline = useConnectivity()
  
  const [formData, setFormData] = useState({
    nom: '',
    prenom: '',
    email: '',
    password: '',
    confirmPassword: '',
    typeUtilisateur: ''
  })
  const [types, setTypes] = useState<Array<{id: number, libelle: string}>>([])

  useEffect(() => {
    // fetch available types from backend
    let cancelled = false
    async function loadTypes() {
      try {
        const res = await fetch('/api/auth/types')
        if (!res.ok) return
        const data = await res.json()
        if (!cancelled && Array.isArray(data)) {
          setTypes(data)
          // default to first returned type so select reflects backend values
          if (data.length > 0) {
            setFormData(prev => ({ ...prev, typeUtilisateur: data[0].libelle }))
          }
        }
      } catch (e) {
        console.warn('Could not load types:', e)
      }
    }
    loadTypes()
    return () => { cancelled = true }
  }, [])
  
  const [status, setStatus] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    
    // Validation
    if (formData.password !== formData.confirmPassword) {
      setStatus('Les mots de passe ne correspondent pas')
      return
    }
    
    if (formData.password.length < 6) {
      setStatus('Le mot de passe doit contenir au moins 6 caractères')
    }

    setLoading(true)
    setStatus('En cours...')
    
    try {
      const result = await register(formData, isOnline)
      
      if (result.source === 'firebase') {
        setStatus('Inscription réussie via Firebase (cloud)')
        if (result.token) localStorage.setItem('token', result.token)
        if (result.user) localStorage.setItem('user', JSON.stringify(result.user))
        setTimeout(() => window.location.href = '/', 1500)
      } else if (result.source === 'postgres') {
        setStatus('Inscription réussie via PostgreSQL (local)')
        if (result.token) localStorage.setItem('token', result.token)
        if (result.user) localStorage.setItem('user', JSON.stringify(result.user))
        setTimeout(() => window.location.href = '/', 1500)
      }
    } catch (err: any) {
      setStatus(`${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  const statusClass = status?.includes('réussie') 
    ? 'auth-status success' 
    : status?.includes('pas') || status?.includes('caractères') 
    ? 'auth-status error' 
    : 'auth-status'

  return (
    <div className="auth-container">
      <div className="auth-card">
        <form onSubmit={handleSubmit}>
          <div className="auth-brand">SIGNALEMENT</div>
          
          <h2 className="auth-title">Créer un compte</h2>
          
          <p className="auth-subtitle">
            Rejoignez notre plateforme de signalement de roues abîmées en créant votre compte.
          </p>

          <div className="auth-row double">
            <div className="auth-column">
              <label className="auth-label">Nom</label>
              <input 
                className="auth-input" 
                value={formData.nom}
                onChange={e => setFormData({...formData, nom: e.target.value})}
                placeholder="Dupont"
                required
              />
            </div>
            <div className="auth-column">
              <label className="auth-label">Prénom</label>
              <input 
                className="auth-input" 
                value={formData.prenom}
                onChange={e => setFormData({...formData, prenom: e.target.value})}
                placeholder="Jean"
                required
              />
            </div>
          </div>

          <label className="auth-label">Adresse email</label>
          <input 
            className="auth-input" 
            type="email"
            value={formData.email}
            onChange={e => setFormData({...formData, email: e.target.value})}
            placeholder="exemple@email.com"
            required
          />

          <label className="auth-label">Type d'utilisateur</label>
          <select 
            className="auth-input auth-select"
            value={formData.typeUtilisateur}
            onChange={e => setFormData({...formData, typeUtilisateur: e.target.value})}
            required
          >
            {types.length > 0 ? (
              types.map(t => (
                <option key={t.id} value={t.libelle}>{t.libelle}</option>
              ))
            ) : (
              <>
                <option value="">Sélectionnez un type</option>
                <option value="Visiteur">Visiteur</option>
                <option value="Manager">Manager</option>
              </>
            )}
          </select>

          <div className="auth-row double">
            <div className="auth-column">
              <label className="auth-label">Mot de passe</label>
              <input 
                className="auth-input" 
                type="password"
                value={formData.password}
                onChange={e => setFormData({...formData, password: e.target.value})}
                placeholder="••••••••"
                required
              />
            </div>
            <div className="auth-column">
              <label className="auth-label">Confirmation</label>
              <input 
                className="auth-input" 
                type="password"
                value={formData.confirmPassword}
                onChange={e => setFormData({...formData, confirmPassword: e.target.value})}
                placeholder="••••••••"
                required
              />
            </div>
          </div>

          <div className="auth-info">
            <p className="auth-info-text">
              {isOnline 
                ? 'Mode en ligne - Inscription sur Firebase et backend' 
                : 'Mode hors ligne - Inscription sur PostgreSQL local'
              }
            </p>
            <p className="auth-hint">
              Le mot de passe doit contenir au moins 6 caractères.
            </p>
          </div>

          <button 
            className="auth-button" 
            type="submit" 
            disabled={loading}
          >
            {loading ? 'Inscription en cours...' : 'S\'INSCRIRE'}
          </button>
          
          {status && <div className={statusClass}>{status}</div>}
          
          <div className="auth-footer">
            <div className="auth-footer-links">
              <span className="auth-footer-text">Déjà inscrit ? </span>
              <a href="/login" className="auth-forgot">Se connecter</a>
            </div>
            <p className="auth-copyright">SIGNALEMENT ROUE - Plateforme de signalement</p>
          </div>
        </form>
      </div>
    </div>
  )
}
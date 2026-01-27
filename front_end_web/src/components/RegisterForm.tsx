import React, { useState, useEffect } from 'react'
import { useConnectivity } from '../hooks/useConnectivity'
import { register } from '../services/authService'
import '../styles/auth.css'

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

          <label className="auth-label">Nom</label>
          <input 
            className="auth-input" 
            value={formData.nom}
            onChange={e => setFormData({...formData, nom: e.target.value})}
            placeholder="Votre nom"
            required
          />

          <label className="auth-label">Prénom</label>
          <input 
            className="auth-input" 
            value={formData.prenom}
            onChange={e => setFormData({...formData, prenom: e.target.value})}
            placeholder="Votre prénom"
            required
          />

          <label className="auth-label">Email</label>
          <input 
            className="auth-input" 
            type="email"
            value={formData.email}
            onChange={e => setFormData({...formData, email: e.target.value})}
            placeholder="votre@email.com"
            required
          />

          <label className="auth-label">Type d'utilisateur</label>
          <select 
            className="auth-input"
            value={formData.typeUtilisateur}
            onChange={e => setFormData({...formData, typeUtilisateur: e.target.value})}
          >
            {types.length > 0 ? (
              types.map(t => (
                <option key={t.id} value={t.libelle}>{t.libelle}</option>
              ))
            ) : (
              <>
                <option value="Visiteur">Visiteur</option>
                <option value="Manager">Manager</option>
              </>
            )}
          </select>

          <label className="auth-label">Mot de passe</label>
          <input 
            className="auth-input" 
            type="password"
            value={formData.password}
            onChange={e => setFormData({...formData, password: e.target.value})}
            placeholder="••••••••"
            required
          />

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

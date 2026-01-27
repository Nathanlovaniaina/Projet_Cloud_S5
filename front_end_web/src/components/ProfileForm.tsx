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
    currentPassword: '',
    newPassword: '',
    confirmNewPassword: ''
  })
  
  const [status, setStatus] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [loadingUser, setLoadingUser] = useState(true)

  useEffect(() => {
    async function loadUser() {
      try {
        const user = await getCurrentUser()
        if (user) {
          setFormData({
            nom: user.nom || '',
            prenom: user.prenom || '',
            email: user.email || '',
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
          // telephone removed - not stored in the backend
      }
      
      if (formData.newPassword) {
        updateData.currentPassword = formData.currentPassword
        updateData.newPassword = formData.newPassword
      }
      
      const result = await updateUserProfile(updateData, isOnline)
      
      if (result.success) {
        setStatus('✅ Profil mis à jour avec succès')
        setFormData({
          ...formData,
          currentPassword: '',
          newPassword: '',
          confirmNewPassword: ''
        })
        
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
          <small className="auth-hint">
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

          <div className="auth-section-divider">
            <h3 className="auth-section-title">
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

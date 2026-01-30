import React, { useState, useEffect } from 'react'
import { useConnectivity } from '../hooks/useConnectivity'
import { updateProfile as updateUserProfile, getCurrentUser } from '../services/authService'
// import '../styles/auth.css'
import '../styles/profil.css'

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
  const [userInitial, setUserInitial] = useState<string>('')

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
          
          // Initiale pour l'avatar
          const name = `${user.prenom || ''} ${user.nom || ''}`.trim()
          if (name) {
            const initial = name.charAt(0).toUpperCase()
            setUserInitial(initial)
          } else if (user.email) {
            setUserInitial(user.email.charAt(0).toUpperCase())
          }
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
          // Mettre à jour l'initiale
          const name = `${result.user.prenom || ''} ${result.user.nom || ''}`.trim()
          if (name) {
            setUserInitial(name.charAt(0).toUpperCase())
          }
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
          <div className="profile-loading">
            <div className="loading-spinner"></div>
            <p>Chargement de votre profil...</p>
          </div>
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
        <div className="profile-header">
          <div className="profile-avatar">
            {userInitial}
          </div>
          <div className="profile-info">
            <h1 className="profile-name">{formData.prenom} {formData.nom}</h1>
            <p className="profile-email">{formData.email}</p>
            <div className={`profile-status ${isOnline ? 'online' : 'offline'}`}>
              {isOnline ? '🌐 En ligne' : '📴 Hors ligne'}
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-section">
            <h2 className="section-title">Informations personnelles</h2>
            <p className="section-description">
              Mettez à jour vos informations personnelles et votre mot de passe
            </p>
            
            <div className="form-row double">
              <div className="form-column">
                <label className="auth-label">Nom</label>
                <input 
                  className="auth-input" 
                  value={formData.nom}
                  onChange={e => setFormData({...formData, nom: e.target.value})}
                  placeholder="Dupont"
                />
              </div>
              <div className="form-column">
                <label className="auth-label">Prénom</label>
                <input 
                  className="auth-input" 
                  value={formData.prenom}
                  onChange={e => setFormData({...formData, prenom: e.target.value})}
                  placeholder="Jean"
                />
              </div>
            </div>

            <div className="form-group">
              <label className="auth-label">Adresse email</label>
              <input 
                className="auth-input disabled" 
                type="email"
                value={formData.email}
                disabled
              />
              <p className="field-hint">
                L'adresse email ne peut pas être modifiée
              </p>
            </div>
          </div>

          <div className="form-section password-section">
            <div className="section-header">
              <h2 className="section-title">Sécurité du compte</h2>
              <p className="section-description">
                Changez votre mot de passe pour renforcer la sécurité de votre compte
              </p>
            </div>

            <div className="form-group">
              <label className="auth-label">Mot de passe actuel</label>
              <input 
                className="auth-input" 
                type="password"
                value={formData.currentPassword}
                onChange={e => setFormData({...formData, currentPassword: e.target.value})}
                placeholder="Entrez votre mot de passe actuel"
              />
            </div>

            <div className="form-row double">
              <div className="form-column">
                <label className="auth-label">Nouveau mot de passe</label>
                <input 
                  className="auth-input" 
                  type="password"
                  value={formData.newPassword}
                  onChange={e => setFormData({...formData, newPassword: e.target.value})}
                  placeholder="Minimum 6 caractères"
                />
              </div>
              <div className="form-column">
                <label className="auth-label">Confirmation</label>
                <input 
                  className="auth-input" 
                  type="password"
                  value={formData.confirmNewPassword}
                  onChange={e => setFormData({...formData, confirmNewPassword: e.target.value})}
                  placeholder="Confirmez le nouveau mot de passe"
                />
              </div>
            </div>

            <div className="password-requirements">
              <p className="requirements-title">Exigences de sécurité :</p>
              <ul className="requirements-list">
                <li className={formData.newPassword.length >= 6 ? 'met' : ''}>
                  Au moins 6 caractères
                </li>
                <li className={formData.newPassword === formData.confirmNewPassword && formData.newPassword.length > 0 ? 'met' : ''}>
                  Les mots de passe correspondent
                </li>
              </ul>
            </div>
          </div>

          <div className="form-actions">
            <button 
              className="auth-button update-button" 
              type="submit" 
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="loading-dots"></span>
                  Mise à jour en cours
                </>
              ) : 'METTRE À JOUR LE PROFIL'}
            </button>
            
            {status && <div className={statusClass}>{status}</div>}
          </div>

          <div className="profile-footer">
            <div className="footer-links">
              <a href="/" className="footer-link">
                ← Retour à l'accueil
              </a>
              <a href="/profile/help" className="footer-link secondary">
                Besoin d'aide ?
              </a>
            </div>
            <p className="footer-copyright">
              SIGNALEMENT ROUE • Plateforme de signalement
            </p>
          </div>
        </form>
      </div>
    </div>
  )
}
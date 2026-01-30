import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useConnectivity } from '../hooks/useConnectivity'
import { login } from '../services/authService'
import '../styles/login.css'

export default function LoginForm() {
  const isOnline = useConnectivity()
  React.useEffect(() => {
    console.log('LoginForm mounted, isOnline=', isOnline)
    return () => console.log('LoginForm unmounted')
  }, [isOnline])
  const navigate = useNavigate()
  
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [remember, setRemember] = useState(false)
  const [status, setStatus] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setStatus('En cours...')
    try {
      // If the browser reports offline, avoid attempting Firebase and use backend API only
      const canUseFirebase = !!(isOnline && window.navigator.onLine)
      const result = await login(email, password, canUseFirebase)
      if (result.source === 'firebase') {
        setStatus('✅ Connecté via Firebase (cloud)')
        if (result.token) localStorage.setItem('token', result.token)
      } else if (result.source === 'postgres') {
        setStatus('✅ Connecté via PostgreSQL (local)')
        if (result.token) localStorage.setItem('token', result.token)
        if (result.user) localStorage.setItem('user', JSON.stringify(result.user))
      }
      // redirect to map on successful login
      navigate('/map')
    } catch (err: any) {
      // Normalize axios / firebase / generic errors into user-friendly French messages
      const formatError = (e: any) => {
        // axios HTTP error with response body
        const resp = e?.response?.data
        if (resp) {
          if (typeof resp === 'string') return resp
          if (resp.message) return resp.message
          if (resp.error) return resp.error
        }

        const msg: string = e?.message || ''
        const lmsg = msg.toLowerCase()

        if (lmsg.includes('bloqu')) return 'Votre compte est bloqué. Contactez un administrateur.'
        if (lmsg.includes('email ou mot de passe incorrect') || lmsg.includes('wrong-password') || lmsg.includes('user-not-found') || lmsg.includes('invalid-email')) return 'Email ou mot de passe incorrect.'
        if (lmsg.includes('backend local indisponible') || lmsg.includes('backend indisponible')) return 'Le service backend est momentanément indisponible. Veuillez réessayer plus tard.'
        if (lmsg.includes('network') || lmsg.includes('network-request-failed') || lmsg.includes('failed to fetch')) return 'Erreur réseau. Vérifiez votre connexion internet.'
        // fallback to original message
        return msg || 'Erreur inconnue lors de la connexion.'
      }

      setStatus(`❌ ${formatError(err)}`)
    } finally {
      setLoading(false)
    }
  }
  
  const statusClass = status?.startsWith('✅') ? 'auth-status success' : status?.startsWith('❌') ? 'auth-status error' : 'auth-status'

  return (
    <div className="auth-container">
      <div className="auth-card">
        <form onSubmit={handleSubmit}>
          <div className="auth-brand">SIGNALEMENT</div>
          
          <h2 className="auth-title">Bon retour parmi nous</h2>
          
          <p className="auth-subtitle">
            Merci de votre retour. Veuillez vous connecter à votre compte en remplissant ces champs :
          </p>
          
          <label className="auth-label">Adresse email</label>
          <input 
            className="auth-input" 
            value={email} 
            onChange={e => setEmail(e.target.value)} 
            placeholder="exemple@email.com"
            type="email"
            required
          />
          
          <label className="auth-label">Mot de passe</label>
          <input 
            className="auth-input" 
            type="password" 
            value={password} 
            onChange={e => setPassword(e.target.value)} 
            placeholder="••••••••"
            required
          />
          
          <div className="auth-row">
            <label className="auth-remember">
              <input 
                type="checkbox" 
                checked={remember} 
                onChange={e => setRemember(e.target.checked)} 
              />
              <span>Se souvenir de moi</span>
            </label>
            <a 
              href="#" 
              onClick={(e) => { 
                e.preventDefault(); 
                alert('Fonctionnalité non implémentée'); 
              }} 
              className="auth-forgot"
            >
              Mot de passe oublié ?
            </a>
          </div>
          
          <button 
            className="auth-button" 
            type="submit" 
            disabled={loading}
          >
            {loading ? 'Connexion en cours...' : 'SE CONNECTER'}
          </button>
          
          {status && <div className={statusClass}>{status}</div>}
          
          <div className="auth-footer">
            <a 
              href="#" 
              onClick={(e) => { 
                e.preventDefault(); 
                alert('Fonctionnalité non implémentée'); 
              }} 
              className="auth-forgot"
            >
              Pas encore de compte ? S'inscrire
            </a>
            <p>SIGNALEMENT ROUE - Plateforme de signalement de roues abîmées</p>
          </div>
        </form>
      </div>
    </div>
  )
}
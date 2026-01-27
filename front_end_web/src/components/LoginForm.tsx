import React, { useState } from 'react'
import { useConnectivity } from '../hooks/useConnectivity'
import { login } from '../services/authService'
import '../styles/login.css'

export default function LoginForm() {
  const isOnline = useConnectivity()
  React.useEffect(() => {
    console.log('LoginForm mounted, isOnline=', isOnline)
    return () => console.log('LoginForm unmounted')
  }, [isOnline])
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
      const result = await login(email, password, isOnline)
      if (result.source === 'firebase') {
        setStatus('✅ Connecté via Firebase (cloud)')
        if (result.token) localStorage.setItem('token', result.token)
      } else if (result.source === 'postgres') {
        setStatus('✅ Connecté via PostgreSQL (local)')
        if (result.token) localStorage.setItem('token', result.token)
        if (result.user) localStorage.setItem('user', JSON.stringify(result.user))
      }
    } catch (err: any) {
      setStatus(`❌ ${err.message}`)
    } finally {
      setLoading(false)
    }
  }
  const statusClass = status?.startsWith('✅') ? 'auth-status success' : status?.startsWith('❌') ? 'auth-status error' : 'auth-status'

  return (
    <div className="auth-container">
      <div className="auth-card">
        <form onSubmit={handleSubmit}>
          <div className="auth-brand">Signalement</div>
          <h2 className="auth-title">Connexion</h2>
          <label className="auth-label">Email</label>
          <input className="auth-input" value={email} onChange={e => setEmail(e.target.value)} placeholder="votre@email.com" />

          <label className="auth-label">Mot de passe</label>
          <input className="auth-input" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" />

          <div className="auth-row">
            <label className="auth-remember">
              <input type="checkbox" checked={remember} onChange={e => setRemember(e.target.checked)} />
              <span> Se souvenir de moi</span>
            </label>
            <a href="#" onClick={(e) => { e.preventDefault(); alert('Fonctionnalité non implémentée'); }} className="auth-forgot">Mot de passe oublié ?</a>
          </div>

          <button className="auth-button" type="submit" disabled={loading}>{loading ? 'Connexion...' : 'SE CONNECTER'}</button>
          {status && <p className={statusClass}>{status}</p>}
          <div className="auth-footer">
            <a href="#" onClick={(e) => { e.preventDefault(); alert('Fonctionnalité non implémentée'); }} className="auth-forgot">Mot de passe oublié ?</a>
          </div>
        </form>
      </div>
    </div>
  )
}

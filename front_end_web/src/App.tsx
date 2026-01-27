import { Suspense, lazy, useState, useEffect } from 'react'
import './App.css'
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom'
import ErrorBoundary from './components/ErrorBoundary'
import { isAuthenticated, logout } from './services/authService'

const MapLibreMap = lazy(() => import('./components/MapLibreMap'))
const LoginForm = lazy(() => import('./components/LoginForm'))
const RegisterForm = lazy(() => import('./components/RegisterForm'))
const ProfileForm = lazy(() => import('./components/ProfileForm'))
const VisitorPage = lazy(() => import('./components/VisitorPage'))

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [userName, setUserName] = useState<string>('')

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
    
    window.addEventListener('storage', checkAuth)
    window.addEventListener('authchange', checkAuth)
    return () => {
      window.removeEventListener('storage', checkAuth)
      window.removeEventListener('authchange', checkAuth)
    }
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
            <Link to="/visiteur" style={{ color: '#60a5fa', textDecoration: 'none' }}>
              Visiteur
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
                <Route path="/visiteur" element={<VisitorPage />} />
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

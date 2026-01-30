import { Suspense, lazy, useState, useEffect } from 'react'
import './App.css'
import './styles/navbar.css'
import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom'
import ErrorBoundary from './components/ErrorBoundary'
import { isAuthenticated, logout, getCurrentUser } from './services/authService'

const MapLibreMap = lazy(() => import('./components/MapLibreMap'))
const LoginForm = lazy(() => import('./components/LoginForm'))
const RegisterForm = lazy(() => import('./components/RegisterForm'))
const ProfileForm = lazy(() => import('./components/ProfileForm'))
const VisitorPage = lazy(() => import('./components/VisitorPage'))
const ManagerSignalementsPage = lazy(() => import('./components/ManagerSignalementsPage'))
const ManagerSignalementDetail = lazy(() => import('./components/ManagerSignalementDetail'))
const ManagerUsersPage = lazy(() => import('./components/ManagerUsersPage'))
const MapOnlyPage = lazy(() => import('./components/MapOnlyPage'))

function NavbarLink({ to, children, isManager = false }: { to: string, children: React.ReactNode, isManager?: boolean }) {
  const location = useLocation()
  const isActive = location.pathname === to
  
  return (
    <Link 
      to={to} 
      className={`navbar-link ${isActive ? 'active' : ''} ${isManager ? 'manager-link' : ''}`}
    >
      {children}
    </Link>
  )
}

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [userName, setUserName] = useState<string>('')
  const [userInitial, setUserInitial] = useState<string>('')
  const [isManager, setIsManager] = useState(false)

  useEffect(() => {
    const checkAuth = () => {
      ;(async () => {
        const authenticated = isAuthenticated()
        setIsLoggedIn(authenticated)

        if (!authenticated) {
          setIsManager(false)
          setUserName('')
          setUserInitial('')
          return
        }

        try {
          const user = await getCurrentUser()
          if (user) {
            const name = `${user.prenom || ''} ${user.nom || ''}`.trim() || user.email || ''
            setUserName(name)
            
            // Initiale pour l'avatar
            const initial = name.charAt(0).toUpperCase()
            setUserInitial(initial)
            
            let manager = false
            const t = user.typeUtilisateur
            if (t == null) {
              manager = user.idTypeUtilisateur === 2 || user.id_type_utilisateur === 2
            } else if (typeof t === 'string') {
              manager = t.toLowerCase().includes('manager') || t.toLowerCase().includes('gestion')
            } else if (typeof t === 'number') {
              manager = t === 2
            } else if (typeof t === 'object') {
              manager = (t.idTypeUtilisateur === 2) || (t.id === 2) || (t.id_type_utilisateur === 2) || (t.libelle && (t.libelle.toLowerCase().includes('manager') || t.libelle.toLowerCase().includes('gestion')))
            }

            setIsManager(Boolean(manager))
            return
          }
        } catch (e) {
          const userStr = localStorage.getItem('user')
          if (userStr) {
            try {
              const user = JSON.parse(userStr)
              const name = `${user.prenom || ''} ${user.nom || ''}`.trim() || user.email || 'Utilisateur'
              setUserName(name)
              
              const initial = name.charAt(0).toUpperCase()
              setUserInitial(initial)

              let manager = false
              const t = user.typeUtilisateur
              if (t == null) {
                manager = user.idTypeUtilisateur === 2 || user.id_type_utilisateur === 2
              } else if (typeof t === 'string') {
                manager = t.toLowerCase().includes('manager') || t.toLowerCase().includes('gestion')
              } else if (typeof t === 'number') {
                manager = t === 2
              } else if (typeof t === 'object') {
                manager = (t.idTypeUtilisateur === 2) || (t.id === 2) || (t.id_type_utilisateur === 2) || (t.libelle && (t.libelle.toLowerCase().includes('manager') || t.libelle.toLowerCase().includes('gestion')))
              }

              setIsManager(Boolean(manager))
            } catch (err) {
              setUserName('Utilisateur')
              setUserInitial('U')
              setIsManager(false)
            }
          }
        }
      })()
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
      setUserName('')
      setUserInitial('')
    }
  }

  return (
    <div className="navbar-container">
      <BrowserRouter>
        <header className="navbar-header">
          <div className="navbar-content">
            <div className="navbar-brand">
              <div className="navbar-title">
                Signalement
              </div>
              <div className="navbar-subtitle">
                Plateforme de signalement
              </div>
            </div>
            
            <nav className="navbar-nav">
              <NavbarLink to="/map">Carte</NavbarLink>
              <NavbarLink to="/visiteur">Recapitulatif</NavbarLink>
              
              {isManager && (
                <NavbarLink to="/manager/signalements" isManager>
                  🔑 Manager
                </NavbarLink>
              )}
              {isManager && (
                <NavbarLink to="/manager/utilisateurs" isManager>
                  👥 Utilisateurs
                </NavbarLink>
              )}
              
              {isLoggedIn ? (
                <div className="navbar-user">
                  <div className="user-info">
                    <div className="user-avatar">
                      {userInitial}
                    </div>
                    <span>{userName}</span>
                  </div>
                  <NavbarLink to="/profile">Profil</NavbarLink>
                  <button
                    onClick={handleLogout}
                    className="logout-button"
                  >
                    Déconnexion
                  </button>
                </div>
              ) : (
                <div className="auth-links">
                  <NavbarLink to="/login">Se connecter</NavbarLink>
                  <Link to="/register" className="register-button">
                    S'inscrire
                  </Link>
                </div>
              )}
            </nav>
          </div>
        </header>

        <main className="navbar-main">
          <Suspense fallback={<div className="loading-container">Chargement…</div>}>
            <ErrorBoundary>
              <Routes>
                <Route path="/login" element={<LoginForm />} />
                <Route path="/register" element={<RegisterForm />} />
                <Route path="/profile" element={<ProfileForm />} />
                <Route path="/visiteur" element={<VisitorPage />} />
                <Route path="/manager/signalements" element={<ManagerSignalementsPage />} />
                <Route path="/manager/signalements/:id" element={<ManagerSignalementDetail />} />
                <Route path="/manager/utilisateurs" element={<ManagerUsersPage />} />
                <Route path="/visiteur" element={<VisitorPage />} />
                <Route path="/map" element={<MapOnlyPage />} />
                <Route path="/" element={<VisitorPage />} />
                <Route path="*" element={<VisitorPage />} />
              </Routes>
            </ErrorBoundary>
          </Suspense>
        </main>
      </BrowserRouter>
    </div>
  )
}

export default App
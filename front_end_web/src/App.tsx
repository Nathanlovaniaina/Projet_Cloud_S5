import React, { Suspense, lazy } from 'react'
import './App.css'
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom'
import ErrorBoundary from './components/ErrorBoundary'

const MapLibreMap = lazy(() => import('./components/MapLibreMap'))
const LoginForm = lazy(() => import('./components/LoginForm'))

function App() {
  return (
    <div style={{ color: 'white', minHeight: '100vh' }}>
      <BrowserRouter>
        <header style={{ padding: 12, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <strong>Projet S5 — Frontend</strong> — <Link to="/login" style={{ color: '#60a5fa' }}>Login</Link>
        </header>

        <main style={{ height: 'calc(100vh - 48px)' }}>
          <Suspense fallback={<div style={{ padding: 16 }}>Chargement…</div>}>
            <ErrorBoundary>
              <Routes>
                <Route path="/login" element={<LoginForm />} />
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

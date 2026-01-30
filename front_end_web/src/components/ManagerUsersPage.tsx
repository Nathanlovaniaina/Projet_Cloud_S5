import { useEffect, useState } from 'react'
import '../styles/manager.css'
import { useNavigate } from 'react-router-dom'

interface User { 
  idUtilisateur: number; 
  nom: string; 
  prenom: string; 
  email: string; 
  isBlocked: boolean; 
  typeUtilisateur?: string; 
  lastLogin?: string 
}

export default function ManagerUsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [search, setSearch] = useState('')
  const [etatFilter, setEtatFilter] = useState<string>('')
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const navigate = useNavigate()

  async function loadUsers() {
    setLoading(true)
    try {
      const token = localStorage.getItem('token')
      const params = new URLSearchParams({ page: String(page), limit: '20' })
      if (search) params.append('search', search)
      if (etatFilter) params.append('etat', etatFilter)

      const res = await fetch(`/api/manager/utilisateurs?${params}`, { 
        headers: { Authorization: `Bearer ${token}` } 
      })
      
      if (res.status === 403) {
        alert('Accès réservé aux Managers')
        return
      }
      
      if (!res.ok) throw new Error('Erreur chargement utilisateurs')
      
      const body = await res.json().catch(() => ({}))
      const data = body.data || { items: [] }
      
      setUsers(data.items || [])
      setTotal(data.total || 0)
      setTotalPages(data.totalPages || 1)
    } catch (err) {
      console.error(err)
      alert('Erreur lors du chargement des utilisateurs')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadUsers() }, [page, search, etatFilter])

  async function toggleBlock(userId: number, block: boolean) {
    if (!confirm(block ? 'Bloquer cet utilisateur ?' : 'Débloquer cet utilisateur ?')) return
    try {
      const token = localStorage.getItem('token')
      const path = block ? `/api/auth/bloquer/${userId}` : `/api/auth/debloquer/${userId}`
      const res = await fetch(path, { 
        method: 'POST', 
        headers: { Authorization: `Bearer ${token}` } 
      })
      const body = await res.json().catch(() => ({}))
      if (res.ok && body?.success !== false) {
        alert('Opération réussie')
        loadUsers()
      } else {
        alert('Erreur: ' + (body?.message || res.status))
      }
    } catch (err) {
      console.error(err)
      alert('Erreur réseau')
    }
  }

  // Fonction pour obtenir la classe CSS du badge de type utilisateur
  const getUserTypeBadgeClass = (type?: string) => {
    if (!type) return 'user-type-unknown'
    
    const typeLower = type.toLowerCase()
    if (typeLower.includes('admin') || typeLower.includes('administrateur')) {
      return 'user-type-admin'
    }
    if (typeLower.includes('manager') || typeLower.includes('gestion')) {
      return 'user-type-manager'
    }
    if (typeLower.includes('visiteur') || typeLower.includes('user')) {
      return 'user-type-visitor'
    }
    return 'user-type-unknown'
  }

  // Fonction pour formater la date de dernière connexion
  const formatLastLogin = (dateStr?: string) => {
    if (!dateStr) return 'Jamais'
    
    try {
      const date = new Date(dateStr)
      const now = new Date()
      const diffHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))
      
      if (diffHours < 24) {
        return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
      } else if (diffHours < 48) {
        return 'Hier'
      } else if (diffHours < 168) { // 7 jours
        return date.toLocaleDateString('fr-FR', { weekday: 'short' })
      } else {
        return date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })
      }
    } catch {
      return dateStr
    }
  }

  if (loading && users.length === 0) {
    return (
      <div className="manager-container">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Chargement des utilisateurs...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="manager-container">
      <div className="manager-header">
        <div className="header-content">
          <div>
            <h1 className="manager-title">Gestion des Utilisateurs</h1>
            <p className="manager-subtitle">
              {total} utilisateur{total !== 1 ? 's' : ''} au total • Accès Manager
            </p>
          </div>
          <div className="header-actions">
            <button 
              className="action-button action-refresh" 
              onClick={() => loadUsers()}
            >
              ↻ Actualiser
            </button>
          </div>
        </div>
      </div>

      <div className="manager-filters">
        <div className="filter-group">
          <label className="filter-label">Recherche</label>
          <input
            className="filter-input"
            placeholder="Rechercher par nom ou email..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1) }}
          />
        </div>

        <div className="filter-group">
          <label className="filter-label">Statut</label>
          <select 
            className="filter-select"
            value={etatFilter} 
            onChange={e => { setEtatFilter(e.target.value); setPage(1) }}
          >
            <option value="">Tous les statuts</option>
            <option value="active">Actifs</option>
            <option value="blocked">Bloqués</option>
          </select>
        </div>
      </div>

      <div className="table-container">
        <div className="table-header">
          <div className="table-title-section">
            <h2 className="table-title">Liste des Utilisateurs</h2>
            <p className="table-subtitle">Gérez les accès et statuts des utilisateurs</p>
          </div>
        </div>

        <div className="table-wrapper">
          <table className="manager-table">
            <thead>
              <tr>
                <th className="table-header-cell">ID</th>
                <th className="table-header-cell">Utilisateur</th>
                <th className="table-header-cell">Email</th>
                <th className="table-header-cell">Type</th>
                <th className="table-header-cell">Dernière connexion</th>
                <th className="table-header-cell">Statut</th>
                <th className="table-header-cell">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 ? (
                <tr>
                  <td colSpan={7} className="empty-message">
                    <div className="empty-state">
                      <div className="empty-icon">👥</div>
                      <p>Aucun utilisateur trouvé</p>
                      {(search || etatFilter) && (
                        <p className="empty-hint">Essayez de modifier vos filtres</p>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                users.map(u => (
                  <tr key={u.idUtilisateur} className="table-row">
                    <td className="cell-id">
                      <span className="id-badge">#{u.idUtilisateur}</span>
                    </td>
                    <td className="cell-user">
                      <div className="user-content">
                        <div className="user-name">
                          {u.prenom} {u.nom}
                        </div>
                        <div className="user-id">ID: {u.idUtilisateur}</div>
                      </div>
                    </td>
                    <td className="cell-email">
                      <div className="email-content">
                        <div className="email-address">{u.email}</div>
                      </div>
                    </td>
                    <td className="cell-type">
                      <span className={`user-type-badge ${getUserTypeBadgeClass(u.typeUtilisateur)}`}>
                        {u.typeUtilisateur || 'Non défini'}
                      </span>
                    </td>
                    <td className="cell-lastlogin">
                      <div className="lastlogin-content">
                        <div className="lastlogin-time">{formatLastLogin(u.lastLogin)}</div>
                        {u.lastLogin && (
                          <div className="lastlogin-hint">Dernière connexion</div>
                        )}
                      </div>
                    </td>
                    <td className="cell-status">
                      <span className={`status-badge ${u.isBlocked ? 'status-blocked' : 'status-active'}`}>
                        {u.isBlocked ? '🔒 Bloqué' : '✅ Actif'}
                      </span>
                    </td>
                    <td className="cell-actions">
                      <div className="actions-container">
                        <button
                          className={`action-button ${u.isBlocked ? 'action-unblock' : 'action-block'}`}
                          onClick={() => toggleBlock(u.idUtilisateur, !u.isBlocked)}
                        >
                          {u.isBlocked ? '🔓 Débloquer' : '🚫 Bloquer'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {totalPages > 1 && (
        <div className="pagination-container">
          <div className="pagination">
            <button
              className="pagination-button prev"
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              ← Précédent
            </button>

            <div className="pagination-pages">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum: number
                if (totalPages <= 5) {
                  pageNum = i + 1
                } else if (page <= 3) {
                  pageNum = i + 1
                } else if (page >= totalPages - 2) {
                  pageNum = totalPages - 4 + i
                } else {
                  pageNum = page - 2 + i
                }

                if (pageNum < 1 || pageNum > totalPages) return null

                return (
                  <button
                    key={pageNum}
                    className={`pagination-page ${page === pageNum ? 'active' : ''}`}
                    onClick={() => setPage(pageNum)}
                  >
                    {pageNum}
                  </button>
                )
              })}
            </div>

            <button
              className="pagination-button next"
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
            >
              Suivant →
            </button>
          </div>
          
          <div className="pagination-info">
            <span className="pagination-text">
              Page {page} sur {totalPages} • {total} utilisateur{total !== 1 ? 's' : ''}
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
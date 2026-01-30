import { useEffect, useState } from 'react'
import '../styles/manager.css'
import { useNavigate } from 'react-router-dom'

interface User { idUtilisateur: number; nom: string; prenom: string; email: string; isBlocked: boolean; typeUtilisateur?: string; lastLogin?: string }

export default function ManagerUsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [search, setSearch] = useState('')
  const [etatFilter, setEtatFilter] = useState<string>('')
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  async function loadUsers() {
    setLoading(true)
    try {
      const token = localStorage.getItem('token')
      const params = new URLSearchParams({ page: String(page), limit: '20' })
      if (search) params.append('search', search)
      if (etatFilter) params.append('etat', etatFilter)

      const res = await fetch(`/api/manager/utilisateurs?${params}`, { headers: { Authorization: `Bearer ${token}` } })
      if (res.status === 403) {
        alert('Accès réservé aux Managers')
        return
      }
      if (!res.ok) throw new Error('Erreur chargement utilisateurs')
      const body = await res.json().catch(() => ({}))
      const data = body.data || { items: [] }
      setUsers(data.items || [])
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
      const res = await fetch(path, { method: 'POST', headers: { Authorization: `Bearer ${token}` } })
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

  return (
    <div className="manager-container">
      <div className="manager-header">
        <h1>Gestion des utilisateurs</h1>
        <div style={{ marginLeft: 'auto' }}>
          <button className="btn-action" onClick={() => loadUsers()}>Refresh</button>
        </div>
      </div>

      <div className="manager-filters">
        <input
          placeholder="Rechercher nom / email"
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1) }}
        />

        <select value={etatFilter} onChange={e => { setEtatFilter(e.target.value); setPage(1) }}>
          <option value="">Tous</option>
          <option value="blocked">Bloqué</option>
          <option value="active">Actif</option>
        </select>
      </div>

      <div className="manager-table-wrapper">
        <table className="manager-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Nom</th>
              <th>Email</th>
              <th>Type</th>
              <th>Bloqué</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.idUtilisateur}>
                <td>{u.idUtilisateur}</td>
                <td>{u.nom} {u.prenom}</td>
                <td>{u.email}</td>
                <td>{u.typeUtilisateur || '-'}</td>
                <td>{u.isBlocked ? 'Oui' : 'Non'}</td>
                <td>
                  <button className="btn-action" onClick={() => toggleBlock(u.idUtilisateur, !u.isBlocked)}>
                    {u.isBlocked ? 'Débloquer' : 'Bloquer'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

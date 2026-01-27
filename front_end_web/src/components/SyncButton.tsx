import { useState } from 'react'

export default function SyncButton() {
  const [loading, setLoading] = useState(false)

  async function runSync() {
    if (!confirm('Lancer la synchronisation complète (Firebase ⇄ PostgreSQL) ?')) return
    setLoading(true)
    try {
      const token = localStorage.getItem('token')
      const res = await fetch('/api/sync/full', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      let body: any = {}
      try { body = await res.json() } catch (e) { /* ignore parse errors */ }

      if (res.ok && body.success) {
        alert('Synchronisation réussie:\n' + (body.message || 'OK'))
      } else if (res.status === 403) {
        alert('Accès refusé: vous devez être Manager pour effectuer cette action.')
      } else if (res.status === 401) {
        alert('Non authentifié: veuillez vous reconnecter.')
      } else {
        alert('Erreur de synchronisation:\n' + (body.message || res.status))
      }
    } catch (err) {
      console.error('Sync error', err)
      alert('Erreur réseau lors de la synchronisation')
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      className="btn-action"
      onClick={runSync}
      disabled={loading}
      title="Synchroniser avec Firebase"
    >
      {loading ? 'Synchronisation...' : 'Synchroniser (Firebase)'}
    </button>
  )
}

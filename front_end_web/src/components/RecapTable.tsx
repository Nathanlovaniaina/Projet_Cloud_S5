import React from 'react'
import '../styles/visitor.css'

interface Signalement {
  idSignalement: number
  titre: string
  description: string
  latitude: number
  longitude: number
  surfaceMetreCarree: number
  dateCreation: string
  urlPhoto?: string
  etatActuelId?: number
  etatLibelle?: string
  idTypeTravail?: number
  typeTravauxLibelle?: string
}

interface RecapTableProps {
  signalements: Signalement[]
  selectedId: number | null
  onRowClick: (id: number) => void
  currentPage: number
  totalPages: number
  total: number
  onPageChange: (page: number) => void
  onStatusFilter?: (status: number | undefined) => void
  onTypeFilter?: (type: number | undefined) => void
  statusOptions?: {idEtatSignalement: number, libelle: string}[]
  typeOptions?: {idTypeTravail: number, libelle: string}[]
}

export default function RecapTable({
  signalements,
  selectedId,
  onRowClick,
  currentPage,
  totalPages,
  total,
  onPageChange,
  onStatusFilter,
  onTypeFilter,
  statusOptions = [],
  typeOptions = []
}: RecapTableProps) {

  const [sortColumn, setSortColumn] = React.useState<string>('dateCreation')
  const [sortDirection, setSortDirection] = React.useState<'asc' | 'desc'>('desc')

  function handleSort(column: string) {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortColumn(column)
      setSortDirection('asc')
    }
  }

  function formatDate(dateStr: string) {
    try {
      const date = new Date(dateStr)
      return date.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    } catch (e) {
      return dateStr
    }
  }

  function getStatutBadgeClass(etatId?: number) {
    switch (etatId) {
      case 1: return 'badge-pending'
      case 2: return 'badge-inprogress'
      case 3: return 'badge-completed'
      default: return 'badge-unknown'
    }
  }

  // Tri local (optionnel, car backend pourrait gérer le tri)
  const sortedSignalements = [...signalements].sort((a, b) => {
    let aVal: any = a[sortColumn as keyof Signalement]
    let bVal: any = b[sortColumn as keyof Signalement]
    
    if (sortColumn === 'dateCreation') {
      aVal = new Date(aVal).getTime()
      bVal = new Date(bVal).getTime()
    }
    
    if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1
    if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1
    return 0
  })

  return (
    <div className="recap-table-container">
      <div className="recap-header">
        <h2>Tableau récapitulatif</h2>
        <div className="recap-filters">
          <select 
            className="filter-select"
            onChange={(e) => onStatusFilter?.(e.target.value ? Number(e.target.value) : undefined)}
            defaultValue=""
          >
            <option value="">Tous les statuts</option>
            {statusOptions.map(option => (
              <option key={option.idEtatSignalement} value={option.idEtatSignalement}>
                {option.libelle}
              </option>
            ))}
          </select>

          <select 
            className="filter-select"
            onChange={(e) => onTypeFilter?.(e.target.value ? Number(e.target.value) : undefined)}
            defaultValue=""
          >
            <option value="">Tous les types</option>
            {typeOptions.map(option => (
              <option key={option.idTypeTravail} value={option.idTypeTravail}>
                {option.libelle}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="table-wrapper">
        <table className="recap-table">
          <thead>
            <tr>
              <th onClick={() => handleSort('idSignalement')}>
                ID {sortColumn === 'idSignalement' && (sortDirection === 'asc' ? '↑' : '↓')}
              </th>
              <th onClick={() => handleSort('titre')}>
                Titre {sortColumn === 'titre' && (sortDirection === 'asc' ? '↑' : '↓')}
              </th>
              <th onClick={() => handleSort('dateCreation')}>
                Date {sortColumn === 'dateCreation' && (sortDirection === 'asc' ? '↑' : '↓')}
              </th>
              <th>Statut</th>
              <th>Type</th>
              <th>Surface (m²)</th>
            </tr>
          </thead>
          <tbody>
            {sortedSignalements.length === 0 ? (
              <tr>
                <td colSpan={6} className="empty-message">
                  Aucun signalement trouvé
                </td>
              </tr>
            ) : (
              sortedSignalements.map((sig) => (
                <tr 
                  key={sig.idSignalement}
                  className={selectedId === sig.idSignalement ? 'selected-row' : ''}
                  onClick={() => onRowClick(sig.idSignalement)}
                  style={{ cursor: 'pointer' }}
                >
                  <td>{sig.idSignalement}</td>
                  <td className="title-cell">{sig.titre || 'Sans titre'}</td>
                  <td>{formatDate(sig.dateCreation)}</td>
                  <td>
                    <span className={`status-badge ${getStatutBadgeClass(sig.etatActuelId)}`}>
                      {sig.etatLibelle || 'Inconnu'}
                    </span>
                  </td>
                  <td>{sig.typeTravauxLibelle || '-'}</td>
                  <td>{sig.surfaceMetreCarree?.toFixed(2) || '-'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="pagination">
          <button 
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="pagination-button"
          >
            ← Précédent
          </button>

          <span className="pagination-info">
            Page {currentPage} sur {totalPages} ({total} résultat{total !== 1 ? 's' : ''})
          </span>

          <button 
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="pagination-button"
          >
            Suivant →
          </button>
        </div>
      )}
    </div>
  )
}

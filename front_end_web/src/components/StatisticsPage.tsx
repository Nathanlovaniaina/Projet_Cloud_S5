import { useState, useEffect } from 'react'
import '../styles/statistics.css'

interface StatisticsData {
  totalSignalements: number
  signalementsEnAttente: number
  signalementsEnCours: number
  signalementsTermines: number
  totalUtilisateurs: number
  citoyens: number
  managers: number
  comptesBloques: number
  totalEntreprises: number
  entreprisesActives: number
  entreprisesInactives: number
  totalAssignations: number
  assignationsEnCours: number
  assignationsTerminees: number
  tauxCompletionMoyen: number
  tauxPonctualiteMoyen: number
  delaiTraitementMoyenJours: number
  top5Entreprises: Array<{
    idEntreprise: number
    nomEntreprise: string
    tachesAssignees: number
    tachesTerminees: number
    tauxCompletion: number
    tauxPonctualite: number
  }>
  dateCalcul: string
}

export default function StatisticsPage() {
  const [statistics, setStatistics] = useState<StatisticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadStatistics()
  }, [])

  async function loadStatistics() {
    try {
      setLoading(true)
      setError(null)
      
      const token = localStorage.getItem('token')
      if (!token) {
        setError('Non authentifié')
        return
      }

      const response = await fetch('/api/statistics/summary', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      
      if (response.status === 403) {
        setError('Accès réservé aux Managers')
        return
      }
      
      if (!response.ok) {
        throw new Error('Erreur lors du chargement des statistiques')
      }
      
      const apiResponse = await response.json()
      setStatistics(apiResponse.data)
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="statistics-container">
        <div className="statistics-loading">
          <div className="loading-spinner"></div>
          <p>Chargement des statistiques...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="statistics-container">
        <div className="statistics-error">
          <div className="error-content">
            <h3>Erreur de chargement</h3>
            <p>{error}</p>
            <button onClick={loadStatistics} className="retry-button">
              Réessayer
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (!statistics) {
    return (
      <div className="statistics-container">
        <div className="statistics-error">
          <div className="error-content">
            <h3>Aucune donnée disponible</h3>
            <p>Les statistiques ne sont pas disponibles pour le moment.</p>
            <button onClick={loadStatistics} className="retry-button">
              Actualiser
            </button>
          </div>
        </div>
      </div>
    )
  }

  const signalementProgress = statistics.totalSignalements > 0
    ? ((statistics.signalementsTermines / statistics.totalSignalements) * 100)
    : 0
    
  const assignationProgress = statistics.totalAssignations > 0
    ? ((statistics.assignationsTerminees / statistics.totalAssignations) * 100)
    : 0

  return (
    <div className="statistics-container">
      <div className="statistics-header">
        <div className="header-content">
          <div className="header-title-section">
            <h1 className="statistics-title">Statistiques Globales</h1>
            <p className="statistics-subtitle">
              Dernière mise à jour : {new Date(statistics.dateCalcul).toLocaleString('fr-FR')}
            </p>
          </div>
          
          <div className="header-actions-section">
            <button onClick={loadStatistics} className="refresh-button">
              Actualiser
            </button>
          </div>
        </div>
      </div>

      <div className="statistics-content">
        {/* Signalements */}
        <div className="stats-section">
          <div className="section-header">
            <h2 className="section-title">Signalements</h2>
            <p className="section-subtitle">{statistics.totalSignalements} signalements au total</p>
          </div>
          
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-value">{statistics.totalSignalements}</div>
              <div className="stat-label">Total</div>
            </div>
            
            <div className="stat-card">
              <div className="stat-value status-waiting">{statistics.signalementsEnAttente}</div>
              <div className="stat-label">En Attente</div>
            </div>
            
            <div className="stat-card">
              <div className="stat-value status-inprogress">{statistics.signalementsEnCours}</div>
              <div className="stat-label">En Cours</div>
            </div>
            
            <div className="stat-card">
              <div className="stat-value status-done">{statistics.signalementsTermines}</div>
              <div className="stat-label">Terminés</div>
            </div>
          </div>
          
          <div className="progress-container">
            <div className="progress-info">
              <span className="progress-label">Progression globale</span>
              <span className="progress-value">{signalementProgress.toFixed(1)}%</span>
            </div>
            <div className="progress-bar">
              <div 
                className="progress-fill" 
                style={{ width: `${signalementProgress}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Utilisateurs */}
        <div className="stats-section">
          <div className="section-header">
            <h2 className="section-title">Utilisateurs</h2>
            <p className="section-subtitle">{statistics.totalUtilisateurs} utilisateurs enregistrés</p>
          </div>
          
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-value">{statistics.totalUtilisateurs}</div>
              <div className="stat-label">Total Utilisateurs</div>
            </div>
            
            <div className="stat-card">
              <div className="stat-value status-citizen">{statistics.citoyens}</div>
              <div className="stat-label">Citoyens</div>
            </div>
            
            <div className="stat-card">
              <div className="stat-value status-manager">{statistics.managers}</div>
              <div className="stat-label">Managers</div>
            </div>
            
            <div className="stat-card">
              <div className="stat-value status-blocked">{statistics.comptesBloques}</div>
              <div className="stat-label">Comptes Bloqués</div>
            </div>
          </div>
        </div>

        {/* Entreprises */}
        <div className="stats-section">
          <div className="section-header">
            <h2 className="section-title">Entreprises</h2>
            <p className="section-subtitle">{statistics.totalEntreprises} entreprises partenaires</p>
          </div>
          
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-value">{statistics.totalEntreprises}</div>
              <div className="stat-label">Total Entreprises</div>
            </div>
            
            <div className="stat-card">
              <div className="stat-value status-active">{statistics.entreprisesActives}</div>
              <div className="stat-label">Actives</div>
            </div>
            
            <div className="stat-card">
              <div className="stat-value status-inactive">{statistics.entreprisesInactives}</div>
              <div className="stat-label">Inactives</div>
            </div>
          </div>
        </div>

        {/* Assignations */}
        <div className="stats-section">
          <div className="section-header">
            <h2 className="section-title">Assignations</h2>
            <p className="section-subtitle">{statistics.totalAssignations} tâches assignées</p>
          </div>
          
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-value">{statistics.totalAssignations}</div>
              <div className="stat-label">Total Assignations</div>
            </div>
            
            <div className="stat-card">
              <div className="stat-value status-inprogress">{statistics.assignationsEnCours}</div>
              <div className="stat-label">En Cours</div>
            </div>
            
            <div className="stat-card">
              <div className="stat-value status-done">{statistics.assignationsTerminees}</div>
              <div className="stat-label">Terminées</div>
            </div>
          </div>
          
          <div className="progress-container">
            <div className="progress-info">
              <span className="progress-label">Progression des assignations</span>
              <span className="progress-value">{assignationProgress.toFixed(1)}%</span>
            </div>
            <div className="progress-bar">
              <div 
                className="progress-fill" 
                style={{ width: `${assignationProgress}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Indicateurs de performance */}
        <div className="stats-section">
          <div className="section-header">
            <h2 className="section-title">Indicateurs de Performance</h2>
            <p className="section-subtitle">Moyennes globales</p>
          </div>
          
          <div className="performance-grid">
            <div className="performance-card">
              <div className="performance-value">{statistics.tauxCompletionMoyen.toFixed(1)}%</div>
              <div className="performance-label">Taux Complétion Moyen</div>
              <div className="performance-description">
                Pourcentage moyen de tâches complétées
              </div>
            </div>
            
            <div className="performance-card">
              <div className="performance-value">{statistics.tauxPonctualiteMoyen.toFixed(1)}%</div>
              <div className="performance-label">Taux Ponctualité Moyen</div>
              <div className="performance-description">
                Pourcentage moyen de tâches réalisées à temps
              </div>
            </div>
            
            <div className="performance-card">
              <div className="performance-value">{statistics.delaiTraitementMoyenJours.toFixed(0)}</div>
              <div className="performance-label">Délai Moyen (jours)</div>
              <div className="performance-description">
                Délai moyen de traitement des signalements
              </div>
            </div>
          </div>
        </div>

        {/* Top 5 Entreprises */}
        <div className="stats-section">
          <div className="section-header">
            <h2 className="section-title">Top 5 Entreprises</h2>
            <p className="section-subtitle">Classement par performance</p>
          </div>
          
          <div className="table-container">
            <table className="stats-table">
              <thead>
                <tr>
                  <th>Position</th>
                  <th>Entreprise</th>
                  <th>Tâches Assignées</th>
                  <th>Tâches Terminées</th>
                  <th>Taux Complétion</th>
                  <th>Taux Ponctualité</th>
                </tr>
              </thead>
              <tbody>
                {statistics.top5Entreprises.map((entreprise, index) => {
                  const completionRate = (entreprise.tachesTerminees / entreprise.tachesAssignees * 100) || 0
                  return (
                    <tr key={entreprise.idEntreprise} className="enterprise-row">
                      <td className="rank-cell">
                        <span className={`rank-badge rank-${index + 1}`}>
                          #{index + 1}
                        </span>
                      </td>
                      <td className="company-name">{entreprise.nomEntreprise}</td>
                      <td className="text-center">{entreprise.tachesAssignees}</td>
                      <td className="text-center">{entreprise.tachesTerminees}</td>
                      <td className="text-center">
                        <div className="percentage-container">
                          <div className="percentage-value">{completionRate.toFixed(1)}%</div>
                          <div className="percentage-bar">
                            <div 
                              className="percentage-fill"
                              style={{ width: `${Math.min(completionRate, 100)}%` }}
                            ></div>
                          </div>
                        </div>
                      </td>
                      <td className="text-center">
                        <span className={`percentage-tag ${entreprise.tauxPonctualite >= 90 ? 'high' : entreprise.tauxPonctualite >= 70 ? 'medium' : 'low'}`}>
                          {entreprise.tauxPonctualite.toFixed(1)}%
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
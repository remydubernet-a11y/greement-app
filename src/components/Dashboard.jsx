import { AlertCircle, Clock, CheckCircle2, FileText } from 'lucide-react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import './Dashboard.css'

const STATUT_LABELS = {
  tracking_attente: 'Tracking en attente',
  devis_a_faire: 'Devis à faire',
  suivi_marc: 'Suivi Marc',
  en_cours: 'En cours',
  termine: 'Terminé'
}

const PRIORITE_ICONS = {
  haute: AlertCircle,
  normal: Clock,
  basse: CheckCircle2
}

const PRIORITE_COLORS = {
  haute: 'red',
  normal: 'amber',
  basse: 'green'
}

export default function Dashboard({ dossiers, onSelectDossier }) {
  // Calculer les statistiques
  const stats = {
    total: dossiers.length,
    devis: dossiers.filter(d => d.devis && d.devis.length > 0).length,
    actionsUrgentes: dossiers.reduce((acc, d) => 
      acc + (d.taches?.filter(t => !t.fait && t.priorite === 'haute').length || 0), 0
    ),
    mailsNonLus: dossiers.reduce((acc, d) => 
      acc + (d.mails?.filter(m => m.nonLu).length || 0), 0
    )
  }

  // Toutes les tâches urgentes de tous les dossiers
  const tachesUrgentes = dossiers.flatMap(dossier => 
    (dossier.taches || [])
      .filter(t => !t.fait && t.priorite === 'haute')
      .map(t => ({ ...t, dossier }))
  ).sort((a, b) => {
    if (a.priorite === b.priorite) return 0
    return a.priorite === 'haute' ? -1 : 1
  })

  // Dossiers récents
  const dossiersRecents = [...dossiers]
    .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
    .slice(0, 6)

  return (
    <div className="dashboard">
      <div className="page-header">
        <h1 className="page-title">Tableau de bord</h1>
        <p className="page-subtitle">
          {format(new Date(), 'EEEE d MMMM yyyy', { locale: fr })}
        </p>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon stat-blue">
            <FileText size={24} />
          </div>
          <div className="stat-content">
            <div className="stat-value">{stats.total}</div>
            <div className="stat-label">Dossiers actifs</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon stat-amber">
            <AlertCircle size={24} />
          </div>
          <div className="stat-content">
            <div className="stat-value">{stats.actionsUrgentes}</div>
            <div className="stat-label">Actions urgentes</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon stat-green">
            <FileText size={24} />
          </div>
          <div className="stat-content">
            <div className="stat-value">{stats.devis}</div>
            <div className="stat-label">Devis en cours</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon stat-coral">
            <Clock size={24} />
          </div>
          <div className="stat-content">
            <div className="stat-value">{stats.mailsNonLus}</div>
            <div className="stat-label">Mails non lus</div>
          </div>
        </div>
      </div>

      <div className="dashboard-grid">
        {/* Actions urgentes */}
        <div className="dashboard-section">
          <div className="card">
            <div className="card-header">
              <h2 className="card-title">Actions urgentes</h2>
              <span className="badge badge-red">{tachesUrgentes.length}</span>
            </div>

            {tachesUrgentes.length === 0 ? (
              <div className="empty-state">
                <CheckCircle2 size={48} className="empty-state-icon" />
                <p className="empty-state-title">Aucune action urgente</p>
                <p className="empty-state-text">Tous les dossiers sont à jour</p>
              </div>
            ) : (
              <div className="actions-list">
                {tachesUrgentes.map(tache => {
                  const Icon = PRIORITE_ICONS[tache.priorite]
                  return (
                    <div 
                      key={`${tache.dossier.id}-${tache.id}`}
                      className="action-item"
                      onClick={() => onSelectDossier(tache.dossier.id)}
                    >
                      <div className={`action-icon icon-${PRIORITE_COLORS[tache.priorite]}`}>
                        <Icon size={16} />
                      </div>
                      <div className="action-content">
                        <div className="action-title">{tache.texte}</div>
                        <div className="action-meta">
                          <span className="action-dossier">{tache.dossier.nom}</span>
                          {tache.meta && <span className="action-detail">{tache.meta}</span>}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* Dossiers récents */}
        <div className="dashboard-section">
          <div className="card">
            <div className="card-header">
              <h2 className="card-title">Dossiers récents</h2>
            </div>

            {dossiersRecents.length === 0 ? (
              <div className="empty-state">
                <FileText size={48} className="empty-state-icon" />
                <p className="empty-state-title">Aucun dossier</p>
                <p className="empty-state-text">Créez votre premier dossier</p>
              </div>
            ) : (
              <div className="dossiers-list">
                {dossiersRecents.map(dossier => (
                  <div
                    key={dossier.id}
                    className="dossier-card"
                    onClick={() => onSelectDossier(dossier.id)}
                  >
                    <div className={`dossier-card-avatar avatar-${dossier.couleur}`}>
                      {dossier.nom.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                    </div>
                    <div className="dossier-card-info">
                      <div className="dossier-card-name">{dossier.nom}</div>
                      <div className="dossier-card-bateau">{dossier.bateau}</div>
                      {dossier.lieu && <div className="dossier-card-lieu">{dossier.lieu}</div>}
                    </div>
                    <div className="dossier-card-status">
                      <span className={`badge badge-${dossier.couleur}`}>
                        {STATUT_LABELS[dossier.statut] || dossier.statut}
                      </span>
                      {dossier.taches && dossier.taches.filter(t => !t.fait).length > 0 && (
                        <div className="dossier-card-tasks">
                          {dossier.taches.filter(t => !t.fait).length} à faire
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

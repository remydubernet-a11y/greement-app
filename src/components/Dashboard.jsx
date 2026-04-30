import { useRef } from 'react'
import { AlertCircle, Clock, CheckCircle2, FileText, ChevronRight, Mail, Anchor, MapPin, ListTodo, DollarSign } from 'lucide-react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import './Dashboard.css'

const STATUT_LABELS = {
  tracking_attente: 'Tracking en attente',
  devis_a_faire: 'Devis à faire',
  suivi_marc: 'Suivi Marc',
  attente_assurance: 'Attente assurance',
  en_cours: 'En cours',
  termine: 'Terminé'
}

const PRIORITE_COLORS = {
  haute: 'red',
  normal: 'amber',
  basse: 'green'
}

export default function Dashboard({ dossiers, onSelectDossier, onChangeView, onOpenSidebar }) {
  const actionsRef = useRef(null)
  const devisRef = useRef(null)

  // Stats
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

  // Actions urgentes
  const tachesUrgentes = dossiers.flatMap(dossier => 
    (dossier.taches || [])
      .filter(t => !t.fait && t.priorite === 'haute')
      .map(t => ({ ...t, dossier }))
  )

  // Dossiers récents
  const dossiersRecents = [...dossiers]
    .sort((a, b) => new Date(b.updated_at || b.updatedAt) - new Date(a.updated_at || a.updatedAt))
    .slice(0, 6)

  // Dossiers avec devis en cours
  const dossiersAvecDevis = dossiers.filter(d => d.devis && d.devis.length > 0)

  const scrollToActions = () => {
    actionsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const scrollToDevis = () => {
    devisRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const handleClickDossiersTotal = () => {
    if (onOpenSidebar) onOpenSidebar()
  }

  const handleClickMailsNonLus = () => {
    if (onChangeView) onChangeView('planning')
  }

  return (
    <div className="dashboard">
      <div className="page-header">
        <h1 className="page-title">Tableau de bord</h1>
        <p className="page-subtitle">
          {format(new Date(), 'EEEE d MMMM yyyy', { locale: fr })}
        </p>
      </div>

      {/* Stats CLIQUABLES */}
      <div className="stats-grid">
        <button 
          className="stat-card clickable"
          onClick={handleClickDossiersTotal}
          type="button"
        >
          <div className="stat-icon stat-blue">
            <FileText size={24} />
          </div>
          <div className="stat-content">
            <div className="stat-value">{stats.total}</div>
            <div className="stat-label">Dossiers actifs</div>
          </div>
          <ChevronRight size={18} className="stat-chevron" />
        </button>

        <button 
          className="stat-card clickable"
          onClick={scrollToActions}
          type="button"
        >
          <div className="stat-icon stat-amber">
            <AlertCircle size={24} />
          </div>
          <div className="stat-content">
            <div className="stat-value">{stats.actionsUrgentes}</div>
            <div className="stat-label">Actions urgentes</div>
          </div>
          <ChevronRight size={18} className="stat-chevron" />
        </button>

        <button 
          className="stat-card clickable"
          onClick={scrollToDevis}
          type="button"
        >
          <div className="stat-icon stat-green">
            <DollarSign size={24} />
          </div>
          <div className="stat-content">
            <div className="stat-value">{stats.devis}</div>
            <div className="stat-label">Devis en cours</div>
          </div>
          <ChevronRight size={18} className="stat-chevron" />
        </button>

        <button 
          className="stat-card clickable"
          onClick={handleClickMailsNonLus}
          type="button"
        >
          <div className="stat-icon stat-coral">
            <Mail size={24} />
          </div>
          <div className="stat-content">
            <div className="stat-value">{stats.mailsNonLus}</div>
            <div className="stat-label">Mails non lus</div>
          </div>
          <ChevronRight size={18} className="stat-chevron" />
        </button>
      </div>

      <div className="dashboard-grid">
        {/* Actions urgentes */}
        <div className="dashboard-section" ref={actionsRef}>
          <div className="card">
            <div className="card-header">
              <div className="card-title-wrapper">
                <AlertCircle size={20} className="card-title-icon urgent" />
                <h2 className="card-title">Actions urgentes</h2>
              </div>
              {tachesUrgentes.length > 0 && (
                <span className="badge badge-red">{tachesUrgentes.length}</span>
              )}
            </div>

            {tachesUrgentes.length === 0 ? (
              <div className="empty-state">
                <CheckCircle2 size={48} className="empty-state-icon success" />
                <p className="empty-state-title">Tout est sous contrôle !</p>
                <p className="empty-state-text">Aucune action urgente</p>
              </div>
            ) : (
              <div className="actions-list">
                {tachesUrgentes.map(tache => (
                  <button 
                    key={`${tache.dossier.id}-${tache.id}`}
                    className="action-item-btn"
                    onClick={() => onSelectDossier(tache.dossier.id)}
                    type="button"
                  >
                    <div className={`action-icon icon-${PRIORITE_COLORS[tache.priorite]}`}>
                      <AlertCircle size={16} />
                    </div>
                    <div className="action-content">
                      <div className="action-title">{tache.texte}</div>
                      <div className="action-meta">
                        <span className="action-dossier-badge">
                          <Anchor size={10} />
                          {tache.dossier.nom}
                        </span>
                        {tache.meta && <span className="action-detail">{tache.meta}</span>}
                      </div>
                    </div>
                    <ChevronRight size={16} className="action-chevron" />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Dossiers récents */}
        <div className="dashboard-section">
          <div className="card">
            <div className="card-header">
              <div className="card-title-wrapper">
                <FileText size={20} className="card-title-icon" />
                <h2 className="card-title">Dossiers récents</h2>
              </div>
            </div>

            {dossiersRecents.length === 0 ? (
              <div className="empty-state">
                <FileText size={48} className="empty-state-icon" />
                <p className="empty-state-title">Aucun dossier</p>
                <p className="empty-state-text">Créez votre premier dossier</p>
              </div>
            ) : (
              <div className="dossiers-list">
                {dossiersRecents.map(dossier => {
                  const tachesCount = dossier.taches?.filter(t => !t.fait).length || 0
                  return (
                    <button
                      key={dossier.id}
                      className="dossier-card-btn"
                      onClick={() => onSelectDossier(dossier.id)}
                      type="button"
                    >
                      <div className={`dossier-card-avatar avatar-${dossier.couleur}`}>
                        {dossier.nom.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                      </div>
                      <div className="dossier-card-info">
                        <div className="dossier-card-name">{dossier.nom}</div>
                        <div className="dossier-card-bateau">
                          <Anchor size={12} />
                          {dossier.bateau}
                        </div>
                        {dossier.lieu && (
                          <div className="dossier-card-lieu">
                            <MapPin size={12} />
                            {dossier.lieu}
                          </div>
                        )}
                      </div>
                      <div className="dossier-card-right">
                        <span className={`badge badge-${dossier.couleur}`}>
                          {STATUT_LABELS[dossier.statut] || dossier.statut}
                        </span>
                        {tachesCount > 0 && (
                          <div className="dossier-card-tasks">
                            <ListTodo size={12} />
                            {tachesCount} tâche{tachesCount > 1 ? 's' : ''}
                          </div>
                        )}
                        <ChevronRight size={18} className="dossier-card-chevron" />
                      </div>
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Section Devis en cours */}
      {dossiersAvecDevis.length > 0 && (
        <div className="dashboard-section dashboard-full-width" ref={devisRef}>
          <div className="card">
            <div className="card-header">
              <div className="card-title-wrapper">
                <DollarSign size={20} className="card-title-icon" />
                <h2 className="card-title">Devis en cours</h2>
              </div>
              <span className="badge badge-green">{dossiersAvecDevis.length} dossier{dossiersAvecDevis.length > 1 ? 's' : ''}</span>
            </div>

            <div className="dossiers-list">
              {dossiersAvecDevis.map(dossier => (
                <button
                  key={dossier.id}
                  className="dossier-card-btn"
                  onClick={() => onSelectDossier(dossier.id)}
                  type="button"
                >
                  <div className={`dossier-card-avatar avatar-${dossier.couleur}`}>
                    {dossier.nom.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                  </div>
                  <div className="dossier-card-info">
                    <div className="dossier-card-name">{dossier.nom}</div>
                    <div className="dossier-card-bateau">
                      <Anchor size={12} />
                      {dossier.bateau}
                    </div>
                  </div>
                  <div className="dossier-card-right">
                    <span className="badge badge-green">
                      {dossier.devis.length} devis
                    </span>
                    <ChevronRight size={18} className="dossier-card-chevron" />
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { X, Printer } from 'lucide-react'
import './Resume.css'

const STATUT_LABELS = {
  tracking_attente: 'Tracking en attente',
  devis_a_faire: 'Devis à faire',
  suivi_marc: 'Suivi Marc',
  attente_assurance: 'Attente assurance',
  en_cours: 'En cours',
  termine: 'Terminé'
}

const PRIORITE_LABELS = {
  haute: '🔴',
  normal: '🟡',
  basse: '🟢'
}

export default function Resume({ dossiers, onClose }) {
  // Trier les dossiers par urgence (couleur rouge en premier, puis amber, etc.)
  const ordreUrgence = { red: 1, coral: 2, amber: 3, blue: 4, gray: 5, green: 6 }
  const dossiersTriés = [...dossiers].sort((a, b) => {
    return (ordreUrgence[a.couleur] || 99) - (ordreUrgence[b.couleur] || 99)
  })

  // Stats globales
  const totalTaches = dossiers.reduce((acc, d) => 
    acc + (d.taches?.filter(t => !t.fait).length || 0), 0
  )
  const tachesUrgentes = dossiers.reduce((acc, d) => 
    acc + (d.taches?.filter(t => !t.fait && t.priorite === 'haute').length || 0), 0
  )

  const handlePrint = () => {
    window.print()
  }

  return (
    <div className="resume-modal">
      {/* Barre d'outils (cachée à l'impression) */}
      <div className="resume-toolbar no-print">
        <h2>Résumé des opérations</h2>
        <div className="resume-toolbar-actions">
          <button className="btn-primary" onClick={handlePrint}>
            <Printer size={18} />
            Imprimer / PDF
          </button>
          <button className="btn-ghost btn-icon" onClick={onClose}>
            <X size={20} />
          </button>
        </div>
      </div>

      {/* Page A4 */}
      <div className="resume-page">
        {/* En-tête */}
        <div className="resume-header">
          <div>
            <h1 className="resume-title">Agreement Gréement</h1>
            <p className="resume-subtitle">Résumé des opérations en cours</p>
          </div>
          <div className="resume-date">
            {format(new Date(), 'EEEE d MMMM yyyy', { locale: fr })}
          </div>
        </div>

        {/* Stats globales */}
        <div className="resume-stats">
          <div className="resume-stat">
            <div className="resume-stat-value">{dossiers.length}</div>
            <div className="resume-stat-label">Dossiers actifs</div>
          </div>
          <div className="resume-stat urgent">
            <div className="resume-stat-value">{tachesUrgentes}</div>
            <div className="resume-stat-label">Tâches urgentes</div>
          </div>
          <div className="resume-stat">
            <div className="resume-stat-value">{totalTaches}</div>
            <div className="resume-stat-label">Tâches au total</div>
          </div>
        </div>

        {/* Liste des dossiers */}
        <div className="resume-dossiers">
          {dossiersTriés.map(dossier => {
            const tachesNonFaites = (dossier.taches || []).filter(t => !t.fait)
            if (tachesNonFaites.length === 0) return null

            return (
              <div key={dossier.id} className={`resume-dossier dossier-color-${dossier.couleur}`}>
                <div className="resume-dossier-header">
                  <div>
                    <div className="resume-dossier-name">{dossier.nom}</div>
                    <div className="resume-dossier-info">
                      {dossier.bateau}
                      {dossier.lieu && ` · ${dossier.lieu}`}
                    </div>
                  </div>
                  <div className={`resume-dossier-statut statut-${dossier.couleur}`}>
                    {STATUT_LABELS[dossier.statut] || dossier.statut}
                  </div>
                </div>

                <ul className="resume-taches">
                  {tachesNonFaites.map(tache => (
                    <li key={tache.id} className={`resume-tache priorite-${tache.priorite}`}>
                      <span className="resume-tache-priorite">{PRIORITE_LABELS[tache.priorite]}</span>
                      <div className="resume-tache-content">
                        <div className="resume-tache-text">{tache.texte}</div>
                        {tache.meta && <div className="resume-tache-meta">{tache.meta}</div>}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )
          })}
        </div>

        {/* Pied de page */}
        <div className="resume-footer">
          <div>Document généré automatiquement le {format(new Date(), 'd/MM/yyyy à HH:mm', { locale: fr })}</div>
          <div>Agreement Gréement · Rémy Dubernet</div>
        </div>
      </div>
    </div>
  )
}

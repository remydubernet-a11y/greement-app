import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { X, Printer } from 'lucide-react'
import './Resume.css'

const STATUT_LABELS = {
  tracking_attente: 'Tracking',
  devis_a_faire: 'Devis',
  suivi_marc: 'Suivi Marc',
  attente_assurance: 'Attente assu.',
  en_cours: 'En cours',
  termine: 'Terminé'
}

const PRIORITE_SYMBOL = {
  haute: '!',
  normal: '•',
  basse: '·'
}

export default function Resume({ dossiers, onClose }) {
  // Trier par urgence
  const ordreUrgence = { red: 1, coral: 2, amber: 3, blue: 4, gray: 5, green: 6 }
  const dossiersAvecTaches = dossiers
    .filter(d => d.taches?.some(t => !t.fait))
    .sort((a, b) => (ordreUrgence[a.couleur] || 99) - (ordreUrgence[b.couleur] || 99))

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

      <div className="resume-page">
        {/* En-tête compact */}
        <div className="resume-header">
          <div className="resume-header-left">
            <h1>Agreement Gréement — Opérations en cours</h1>
            <div className="resume-meta">
              {dossiersAvecTaches.length} dossiers actifs · {totalTaches} tâches · <strong>{tachesUrgentes} urgentes</strong>
            </div>
          </div>
          <div className="resume-date">
            {format(new Date(), 'd MMM yyyy', { locale: fr })}
          </div>
        </div>

        {/* Tableau compact des dossiers */}
        <table className="resume-table">
          <thead>
            <tr>
              <th className="col-priority"></th>
              <th className="col-client">Client / Bateau</th>
              <th className="col-statut">Statut</th>
              <th className="col-taches">Tâches à réaliser</th>
            </tr>
          </thead>
          <tbody>
            {dossiersAvecTaches.map(dossier => {
              const tachesNonFaites = (dossier.taches || []).filter(t => !t.fait)
              const aTacheUrgente = tachesNonFaites.some(t => t.priorite === 'haute')
              
              return (
                <tr key={dossier.id} className={aTacheUrgente ? 'row-urgent' : ''}>
                  <td className="col-priority">
                    {aTacheUrgente && <span className="urgent-mark">●</span>}
                  </td>
                  <td className="col-client">
                    <div className="client-name">{dossier.nom}</div>
                    <div className="client-bateau">
                      {dossier.bateau}
                      {dossier.lieu && ` · ${dossier.lieu}`}
                    </div>
                  </td>
                  <td className="col-statut">
                    {STATUT_LABELS[dossier.statut] || dossier.statut}
                  </td>
                  <td className="col-taches">
                    <ul className="taches-list">
                      {tachesNonFaites.map(tache => (
                        <li key={tache.id} className={`tache-${tache.priorite}`}>
                          <span className="tache-symbol">{PRIORITE_SYMBOL[tache.priorite]}</span>
                          <span className="tache-text">
                            {tache.texte}
                            {tache.meta && <span className="tache-meta"> — {tache.meta}</span>}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>

        {/* Légende et pied de page */}
        <div className="resume-footer">
          <div className="resume-legend">
            <span><strong>!</strong> = Urgent</span>
            <span><strong>•</strong> = Normal</span>
            <span><strong>·</strong> = Basse priorité</span>
          </div>
          <div className="resume-footer-right">
            Document généré le {format(new Date(), 'd/MM/yyyy à HH:mm', { locale: fr })} · Agreement Gréement
          </div>
        </div>
      </div>
    </div>
  )
}

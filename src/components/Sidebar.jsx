import { Plus, ChevronLeft, ChevronRight, Folder } from 'lucide-react'
import './Sidebar.css'

const STATUT_COLORS = {
  tracking_attente: 'amber',
  devis_a_faire: 'gray',
  suivi_marc: 'coral',
  en_cours: 'blue',
  termine: 'green'
}

const STATUT_LABELS = {
  tracking_attente: 'Tracking en attente',
  devis_a_faire: 'Devis à faire',
  suivi_marc: 'Suivi Marc',
  en_cours: 'En cours',
  termine: 'Terminé'
}

export default function Sidebar({ dossiers, selectedDossier, onSelectDossier, onAddDossier, isOpen, onToggle }) {
  const handleAddNew = () => {
    const nom = prompt('Nom du client :')
    if (!nom) return
    
    const bateau = prompt('Nom du bateau :')
    if (!bateau) return
    
    onAddDossier({
      nom,
      bateau,
      lieu: '',
      type: 'autre',
      statut: 'en_cours',
      couleur: 'blue',
      mails: [],
      notes: [],
      taches: [],
      devis: [],
      historique: `Dossier créé le ${new Date().toLocaleDateString('fr-FR')}`
    })
  }

  return (
    <aside className={`sidebar ${isOpen ? 'open' : 'closed'}`}>
      <div className="sidebar-header">
        {isOpen && <h2 className="sidebar-title">Dossiers</h2>}
        <button className="sidebar-toggle" onClick={onToggle} title={isOpen ? 'Réduire' : 'Agrandir'}>
          {isOpen ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
        </button>
      </div>
      
      {isOpen && (
        <button className="sidebar-add-btn" onClick={handleAddNew}>
          <Plus size={18} />
          Nouveau dossier
        </button>
      )}
      
      <div className="sidebar-list">
        {dossiers.length === 0 && isOpen && (
          <div className="sidebar-empty">
            <Folder size={32} strokeWidth={1.5} />
            <p>Aucun dossier</p>
          </div>
        )}
        
        {dossiers.map(dossier => (
          <button
            key={dossier.id}
            className={`dossier-item ${selectedDossier?.id === dossier.id ? 'active' : ''}`}
            onClick={() => onSelectDossier(dossier.id)}
            title={isOpen ? '' : dossier.nom}
          >
            <div className={`dossier-avatar avatar-${dossier.couleur}`}>
              {dossier.nom.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
            </div>
            
            {isOpen && (
              <div className="dossier-info">
                <div className="dossier-name">{dossier.nom}</div>
                <div className="dossier-meta">
                  {dossier.bateau}
                  {dossier.taches.filter(t => !t.fait).length > 0 && (
                    <span className="dossier-badge">
                      {dossier.taches.filter(t => !t.fait).length} à faire
                    </span>
                  )}
                </div>
              </div>
            )}
          </button>
        ))}
      </div>
    </aside>
  )
}

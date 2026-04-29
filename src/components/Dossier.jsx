import { useState } from 'react'
import { ArrowLeft, Mail, FileText, CheckSquare, DollarSign, Clock, Plus, Trash2, Edit2, Save, X, Pencil } from 'lucide-react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import './Dossier.css'

const TABS = [
  { id: 'mails', label: 'Mails', icon: Mail },
  { id: 'notes', label: 'Notes', icon: FileText },
  { id: 'taches', label: 'À faire', icon: CheckSquare },
  { id: 'devis', label: 'Devis', icon: DollarSign },
  { id: 'historique', label: 'Historique', icon: Clock }
]

const STATUTS = [
  { value: 'en_cours', label: 'En cours' },
  { value: 'attente_assurance', label: 'Attente assurance' },
  { value: 'devis_a_faire', label: 'Devis à faire' },
  { value: 'tracking_attente', label: 'Tracking en attente' },
  { value: 'termine', label: 'Terminé' }
]

const PRIORITES = [
  { value: 'haute', label: 'Haute' },
  { value: 'normal', label: 'Normale' },
  { value: 'basse', label: 'Basse' }
]

export default function Dossier({ dossier, onUpdate, onDelete, onBack }) {
  const [activeTab, setActiveTab] = useState('taches')
  const [newNote, setNewNote] = useState({ titre: '', texte: '' })
  const [newTache, setNewTache] = useState({ texte: '', meta: '', priorite: 'normal' })
  
  // États pour l'édition
  const [editingHeader, setEditingHeader] = useState(false)
  const [editedHeader, setEditedHeader] = useState({
    nom: dossier.nom,
    bateau: dossier.bateau,
    lieu: dossier.lieu || '',
    statut: dossier.statut
  })
  
  const [editingNoteId, setEditingNoteId] = useState(null)
  const [editedNote, setEditedNote] = useState({})
  
  const [editingTacheId, setEditingTacheId] = useState(null)
  const [editedTache, setEditedTache] = useState({})
  
  const [editingHistorique, setEditingHistorique] = useState(false)
  const [editedHistorique, setEditedHistorique] = useState(dossier.historique || '')

  // === HEADER ===
  const handleSaveHeader = () => {
    onUpdate(dossier.id, editedHeader)
    setEditingHeader(false)
  }

  const handleCancelHeader = () => {
    setEditedHeader({
      nom: dossier.nom,
      bateau: dossier.bateau,
      lieu: dossier.lieu || '',
      statut: dossier.statut
    })
    setEditingHeader(false)
  }

  // === TÂCHES ===
  const handleToggleTache = (tacheId) => {
    const updatedTaches = dossier.taches.map(t =>
      t.id === tacheId ? { ...t, fait: !t.fait } : t
    )
    onUpdate(dossier.id, { taches: updatedTaches })
  }

  const handleAddTache = () => {
    if (!newTache.texte.trim()) return
    const tache = {
      id: Date.now().toString(),
      texte: newTache.texte,
      meta: newTache.meta,
      fait: false,
      priorite: newTache.priorite
    }
    onUpdate(dossier.id, { taches: [...(dossier.taches || []), tache] })
    setNewTache({ texte: '', meta: '', priorite: 'normal' })
  }

  const handleStartEditTache = (tache) => {
    setEditingTacheId(tache.id)
    setEditedTache({
      texte: tache.texte,
      meta: tache.meta || '',
      priorite: tache.priorite
    })
  }

  const handleSaveTache = (tacheId) => {
    const updatedTaches = dossier.taches.map(t =>
      t.id === tacheId ? { ...t, ...editedTache } : t
    )
    onUpdate(dossier.id, { taches: updatedTaches })
    setEditingTacheId(null)
  }

  const handleDeleteTache = (tacheId) => {
    if (confirm('Supprimer cette tâche ?')) {
      onUpdate(dossier.id, { 
        taches: dossier.taches.filter(t => t.id !== tacheId) 
      })
    }
  }

  // === NOTES ===
  const handleAddNote = () => {
    if (!newNote.texte.trim()) return
    const note = {
      id: Date.now().toString(),
      date: new Date().toISOString().split('T')[0],
      titre: newNote.titre || 'Note',
      texte: newNote.texte
    }
    onUpdate(dossier.id, { notes: [...(dossier.notes || []), note] })
    setNewNote({ titre: '', texte: '' })
  }

  const handleStartEditNote = (note) => {
    setEditingNoteId(note.id)
    setEditedNote({
      titre: note.titre,
      texte: note.texte
    })
  }

  const handleSaveNote = (noteId) => {
    const updatedNotes = dossier.notes.map(n =>
      n.id === noteId ? { ...n, ...editedNote } : n
    )
    onUpdate(dossier.id, { notes: updatedNotes })
    setEditingNoteId(null)
  }

  const handleDeleteNote = (noteId) => {
    if (confirm('Supprimer cette note ?')) {
      onUpdate(dossier.id, { 
        notes: dossier.notes.filter(n => n.id !== noteId) 
      })
    }
  }

  // === HISTORIQUE ===
  const handleSaveHistorique = () => {
    onUpdate(dossier.id, { historique: editedHistorique })
    setEditingHistorique(false)
  }

  const handleDeleteDossier = () => {
    if (confirm(`Supprimer le dossier ${dossier.nom} ?`)) {
      onDelete(dossier.id)
    }
  }

  return (
    <div className="dossier-view">
      {/* HEADER ÉDITABLE */}
      <div className="dossier-header-section">
        <button className="btn-ghost btn-icon" onClick={onBack}>
          <ArrowLeft size={20} />
        </button>
        
        {editingHeader ? (
          <div className="dossier-edit-header">
            <input
              type="text"
              className="input dossier-edit-nom"
              value={editedHeader.nom}
              onChange={(e) => setEditedHeader({...editedHeader, nom: e.target.value})}
              placeholder="Nom du client"
            />
            <input
              type="text"
              className="input"
              value={editedHeader.bateau}
              onChange={(e) => setEditedHeader({...editedHeader, bateau: e.target.value})}
              placeholder="Bateau"
            />
            <input
              type="text"
              className="input"
              value={editedHeader.lieu}
              onChange={(e) => setEditedHeader({...editedHeader, lieu: e.target.value})}
              placeholder="Lieu"
            />
            <select
              className="input"
              value={editedHeader.statut}
              onChange={(e) => setEditedHeader({...editedHeader, statut: e.target.value})}
            >
              {STATUTS.map(s => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
            <div className="dossier-edit-actions">
              <button className="btn-primary btn-sm" onClick={handleSaveHeader}>
                <Save size={16} /> Enregistrer
              </button>
              <button className="btn-ghost btn-sm" onClick={handleCancelHeader}>
                <X size={16} /> Annuler
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="dossier-title-section">
              <h1 className="dossier-title">{dossier.nom}</h1>
              <p className="dossier-subtitle">
                {dossier.bateau}{dossier.lieu ? ` · ${dossier.lieu}` : ''}
              </p>
            </div>
            <button className="btn-ghost btn-sm" onClick={() => setEditingHeader(true)}>
              <Edit2 size={16} /> Éditer
            </button>
            <button className="btn-danger btn-sm" onClick={handleDeleteDossier}>
              <Trash2 size={16} /> Supprimer
            </button>
          </>
        )}
      </div>

      <div className="tabs">
        {TABS.map(tab => {
          const Icon = tab.icon
          return (
            <button
              key={tab.id}
              className={`tab ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <Icon size={18} />
              {tab.label}
              {tab.id === 'taches' && dossier.taches?.filter(t => !t.fait).length > 0 && (
                <span className="tab-badge">{dossier.taches.filter(t => !t.fait).length}</span>
              )}
            </button>
          )
        })}
      </div>

      <div className="tab-content-wrapper">
        {/* MAILS */}
        {activeTab === 'mails' && (
          <div className="card">
            {(dossier.mails || []).length === 0 ? (
              <div className="empty-state">
                <Mail size={48} className="empty-state-icon" />
                <p className="empty-state-title">Aucun mail</p>
              </div>
            ) : (
              <div className="mails-list">
                {dossier.mails.map(mail => (
                  <div key={mail.id} className="mail-item">
                    <div className="mail-header">
                      <div className="mail-sender">{mail.expediteur}</div>
                      <div className="mail-date">
                        {mail.date && format(new Date(mail.date), 'd MMM', { locale: fr })}
                      </div>
                    </div>
                    <div className="mail-subject">{mail.sujet}</div>
                    <div className="mail-preview">{mail.apercu}</div>
                    {mail.nonLu && <span className="badge badge-red">Non lu</span>}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* NOTES ÉDITABLES */}
        {activeTab === 'notes' && (
          <div className="card">
            <div className="notes-list">
              {(dossier.notes || []).map(note => (
                <div key={note.id} className="note-item">
                  {editingNoteId === note.id ? (
                    <div className="note-edit">
                      <input
                        type="text"
                        className="input"
                        value={editedNote.titre}
                        onChange={(e) => setEditedNote({...editedNote, titre: e.target.value})}
                        placeholder="Titre"
                      />
                      <textarea
                        className="input"
                        value={editedNote.texte}
                        onChange={(e) => setEditedNote({...editedNote, texte: e.target.value})}
                        rows={4}
                        placeholder="Contenu de la note"
                      />
                      <div className="note-edit-actions">
                        <button className="btn-primary btn-sm" onClick={() => handleSaveNote(note.id)}>
                          <Save size={14} /> Enregistrer
                        </button>
                        <button className="btn-ghost btn-sm" onClick={() => setEditingNoteId(null)}>
                          <X size={14} /> Annuler
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="note-header">
                        <span className="note-titre">{note.titre}</span>
                        <div className="note-actions">
                          <span className="note-date">{note.date}</span>
                          <button className="btn-icon-sm" onClick={() => handleStartEditNote(note)} title="Éditer">
                            <Pencil size={14} />
                          </button>
                          <button className="btn-icon-sm danger" onClick={() => handleDeleteNote(note.id)} title="Supprimer">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                      <div className="note-text">{note.texte}</div>
                    </>
                  )}
                </div>
              ))}
            </div>
            
            <div className="note-add">
              <h3 className="add-section-title">Ajouter une note</h3>
              <input
                type="text"
                className="input"
                placeholder="Titre (optionnel)"
                value={newNote.titre}
                onChange={(e) => setNewNote({...newNote, titre: e.target.value})}
              />
              <textarea
                className="input"
                placeholder="Contenu de la note..."
                value={newNote.texte}
                onChange={(e) => setNewNote({...newNote, texte: e.target.value})}
                rows={4}
              />
              <button className="btn-primary" onClick={handleAddNote} disabled={!newNote.texte.trim()}>
                <Plus size={18} />
                Ajouter la note
              </button>
            </div>
          </div>
        )}

        {/* TÂCHES ÉDITABLES */}
        {activeTab === 'taches' && (
          <div className="card">
            {(dossier.taches || []).length === 0 ? (
              <div className="empty-state">
                <CheckSquare size={48} className="empty-state-icon" />
                <p className="empty-state-title">Aucune tâche</p>
              </div>
            ) : (
              <div className="taches-list">
                {dossier.taches.map(tache => (
                  <div key={tache.id} className="tache-item">
                    {editingTacheId === tache.id ? (
                      <div className="tache-edit">
                        <input
                          type="text"
                          className="input"
                          value={editedTache.texte}
                          onChange={(e) => setEditedTache({...editedTache, texte: e.target.value})}
                          placeholder="Description de la tâche"
                          autoFocus
                        />
                        <input
                          type="text"
                          className="input"
                          value={editedTache.meta}
                          onChange={(e) => setEditedTache({...editedTache, meta: e.target.value})}
                          placeholder="Détails (optionnel)"
                        />
                        <select
                          className="input"
                          value={editedTache.priorite}
                          onChange={(e) => setEditedTache({...editedTache, priorite: e.target.value})}
                        >
                          {PRIORITES.map(p => (
                            <option key={p.value} value={p.value}>{p.label}</option>
                          ))}
                        </select>
                        <div className="tache-edit-actions">
                          <button className="btn-primary btn-sm" onClick={() => handleSaveTache(tache.id)}>
                            <Save size={14} /> Enregistrer
                          </button>
                          <button className="btn-ghost btn-sm" onClick={() => setEditingTacheId(null)}>
                            <X size={14} /> Annuler
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <input
                          type="checkbox"
                          checked={tache.fait}
                          onChange={() => handleToggleTache(tache.id)}
                          className="tache-checkbox"
                        />
                        <div className="tache-content">
                          <div className={`tache-text ${tache.fait ? 'done' : ''}`}>
                            {tache.texte}
                          </div>
                          {tache.meta && (
                            <div className="tache-meta">{tache.meta}</div>
                          )}
                        </div>
                        <span className={`badge badge-${tache.priorite === 'haute' ? 'red' : tache.priorite === 'basse' ? 'green' : 'amber'}`}>
                          {tache.priorite}
                        </span>
                        <div className="tache-actions">
                          <button className="btn-icon-sm" onClick={() => handleStartEditTache(tache)} title="Éditer">
                            <Pencil size={14} />
                          </button>
                          <button className="btn-icon-sm danger" onClick={() => handleDeleteTache(tache.id)} title="Supprimer">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}
            
            <div className="tache-add">
              <h3 className="add-section-title">Ajouter une tâche</h3>
              <input
                type="text"
                className="input"
                placeholder="Description de la tâche"
                value={newTache.texte}
                onChange={(e) => setNewTache({...newTache, texte: e.target.value})}
              />
              <input
                type="text"
                className="input"
                placeholder="Détails (optionnel)"
                value={newTache.meta}
                onChange={(e) => setNewTache({...newTache, meta: e.target.value})}
              />
              <select
                className="input"
                value={newTache.priorite}
                onChange={(e) => setNewTache({...newTache, priorite: e.target.value})}
              >
                {PRIORITES.map(p => (
                  <option key={p.value} value={p.value}>{p.label}</option>
                ))}
              </select>
              <button className="btn-primary" onClick={handleAddTache} disabled={!newTache.texte.trim()}>
                <Plus size={18} />
                Ajouter la tâche
              </button>
            </div>
          </div>
        )}

        {/* DEVIS */}
        {activeTab === 'devis' && (
          <div className="card">
            {(dossier.devis || []).length === 0 ? (
              <div className="empty-state">
                <DollarSign size={48} className="empty-state-icon" />
                <p className="empty-state-title">Aucun devis</p>
              </div>
            ) : (
              <div className="devis-list">
                {dossier.devis.map(devis => (
                  <div key={devis.id} className="devis-item">
                    <div className="devis-ref">#{devis.ref}</div>
                    <div className="devis-content">
                      <div className="devis-libelle">{devis.libelle}</div>
                      <div className="devis-detail">{devis.detail}</div>
                    </div>
                    <span className="badge badge-gray">{devis.statut}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* HISTORIQUE ÉDITABLE */}
        {activeTab === 'historique' && (
          <div className="card">
            {editingHistorique ? (
              <div className="historique-edit">
                <textarea
                  className="input"
                  value={editedHistorique}
                  onChange={(e) => setEditedHistorique(e.target.value)}
                  rows={10}
                  placeholder="Historique du dossier..."
                />
                <div className="historique-edit-actions">
                  <button className="btn-primary btn-sm" onClick={handleSaveHistorique}>
                    <Save size={14} /> Enregistrer
                  </button>
                  <button className="btn-ghost btn-sm" onClick={() => {
                    setEditedHistorique(dossier.historique || '')
                    setEditingHistorique(false)
                  }}>
                    <X size={14} /> Annuler
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="historique-header">
                  <button className="btn-ghost btn-sm" onClick={() => setEditingHistorique(true)}>
                    <Pencil size={14} /> Éditer
                  </button>
                </div>
                <div className="historique-text">
                  {dossier.historique || 'Aucun historique. Cliquez sur Éditer pour en ajouter un.'}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

import { useState } from 'react'
import { ArrowLeft, Mail, FileText, CheckSquare, DollarSign, Clock, Plus, Trash2 } from 'lucide-react'
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

export default function Dossier({ dossier, onUpdate, onDelete, onBack }) {
  const [activeTab, setActiveTab] = useState('taches')
  const [newNote, setNewNote] = useState('')

  const handleToggleTache = (tacheId) => {
    const updatedTaches = dossier.taches.map(t =>
      t.id === tacheId ? { ...t, fait: !t.fait } : t
    )
    onUpdate(dossier.id, { taches: updatedTaches })
  }

  const handleAddNote = () => {
    if (!newNote.trim()) return
    const note = {
      id: Date.now().toString(),
      date: new Date().toISOString().split('T')[0],
      titre: 'Note',
      texte: newNote
    }
    onUpdate(dossier.id, { notes: [...(dossier.notes || []), note] })
    setNewNote('')
  }

  const handleDeleteDossier = () => {
    if (confirm(`Supprimer le dossier ${dossier.nom} ?`)) {
      onDelete(dossier.id)
    }
  }

  return (
    <div className="dossier-view">
      <div className="dossier-header-section">
        <button className="btn-ghost btn-icon" onClick={onBack}>
          <ArrowLeft size={20} />
        </button>
        <div className="dossier-title-section">
          <h1 className="dossier-title">{dossier.nom}</h1>
          <p className="dossier-subtitle">{dossier.bateau} · {dossier.lieu}</p>
        </div>
        <button className="btn-danger btn-sm" onClick={handleDeleteDossier}>
          <Trash2 size={16} />
          Supprimer
        </button>
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
            </button>
          )
        })}
      </div>

      <div className="tab-content-wrapper">
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
                        {format(new Date(mail.date), 'd MMM', { locale: fr })}
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

        {activeTab === 'notes' && (
          <div className="card">
            <div className="notes-list">
              {(dossier.notes || []).map(note => (
                <div key={note.id} className="note-item">
                  <div className="note-header">
                    <span className="note-titre">{note.titre}</span>
                    <span className="note-date">{note.date}</span>
                  </div>
                  <div className="note-text">{note.texte}</div>
                </div>
              ))}
            </div>
            <div className="note-add">
              <textarea
                className="input"
                placeholder="Ajouter une note..."
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                rows={4}
              />
              <button className="btn-primary" onClick={handleAddNote}>
                <Plus size={18} />
                Ajouter
              </button>
            </div>
          </div>
        )}

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
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

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

        {activeTab === 'historique' && (
          <div className="card">
            <div className="historique-text">
              {dossier.historique || 'Aucun historique'}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

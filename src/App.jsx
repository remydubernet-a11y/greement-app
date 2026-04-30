import { useState, useEffect } from 'react'
import Header from './components/Header'
import Sidebar from './components/Sidebar'
import Dashboard from './components/Dashboard'
import Dossier from './components/Dossier'
import Planning from './components/Planning'
import ChatPanel from './components/ChatPanel'
import './App.css'

// API helper functions
const api = {
  async getDossiers() {
    try {
      const res = await fetch('/api/dossiers')
      if (!res.ok) throw new Error('Erreur chargement')
      return await res.json()
    } catch (error) {
      console.error('Erreur GET dossiers:', error)
      return []
    }
  },

  async addDossier(dossier) {
    try {
      const res = await fetch('/api/dossiers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dossier)
      })
      if (!res.ok) throw new Error('Erreur ajout')
      return await res.json()
    } catch (error) {
      console.error('Erreur POST dossier:', error)
      return null
    }
  },

  async updateDossier(id, updates) {
    try {
      const res = await fetch(`/api/dossier/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      })
      if (!res.ok) throw new Error('Erreur mise à jour')
      return await res.json()
    } catch (error) {
      console.error('Erreur PATCH dossier:', error)
      return null
    }
  },

  async deleteDossier(id) {
    try {
      const res = await fetch(`/api/dossier/${id}`, {
        method: 'DELETE'
      })
      return res.ok
    } catch (error) {
      console.error('Erreur DELETE dossier:', error)
      return false
    }
  }
}

function App() {
  const [dossiers, setDossiers] = useState([])
  const [currentView, setCurrentView] = useState('dashboard')
  const [selectedDossier, setSelectedDossier] = useState(null)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)

  // Charger les dossiers au démarrage
  useEffect(() => {
    loadDossiers()
  }, [])

  const loadDossiers = async () => {
    setLoading(true)
    const data = await api.getDossiers()
    setDossiers(data)
    setLoading(false)
  }

  const handleSelectDossier = (dossierId) => {
    const dossier = dossiers.find(d => d.id === dossierId)
    setSelectedDossier(dossier)
    setCurrentView('dossier')
  }

  const handleUpdateDossier = async (dossierId, updates) => {
    // Mise à jour optimiste locale
    setDossiers(prev => 
      prev.map(d => d.id === dossierId ? { ...d, ...updates } : d)
    )
    if (selectedDossier?.id === dossierId) {
      setSelectedDossier(prev => ({ ...prev, ...updates }))
    }

    // Mise à jour serveur
    await api.updateDossier(dossierId, updates)
  }

  const handleAddDossier = async (dossier) => {
    // Normaliser les données
    const normalizedDossier = {
      ...dossier,
      id: dossier.id || Date.now().toString(),
      taches: (dossier.taches || []).map((t, i) => ({
        id: t.id || (Date.now() + i).toString(),
        texte: t.texte || t.label || t.title || t.description || 'Tâche sans titre',
        meta: t.meta || t.detail || t.subtitle || '',
        fait: t.fait || t.done || false,
        priorite: t.priorite || t.priority || 'normal'
      })),
      mails: (dossier.mails || []).map((m, i) => ({
        id: m.id || (Date.now() + i).toString(),
        expediteur: m.expediteur || m.sender || m.from || '',
        sujet: m.sujet || m.subject || m.title || '',
        apercu: m.apercu || m.preview || m.body || m.content || '',
        date: m.date || new Date().toISOString(),
        nonLu: m.nonLu !== undefined ? m.nonLu : true
      })),
      notes: (dossier.notes || []).map((n, i) => ({
        id: n.id || (Date.now() + i).toString(),
        date: n.date || new Date().toISOString().split('T')[0],
        titre: n.titre || n.title || 'Note',
        texte: n.texte || n.text || n.content || ''
      })),
      devis: (dossier.devis || []).map((d, i) => ({
        id: d.id || (Date.now() + i).toString(),
        ref: d.ref || (i + 1).toString(),
        libelle: d.libelle || d.label || d.title || '',
        detail: d.detail || d.description || '',
        statut: d.statut || d.status || 'a_chiffrer'
      }))
    }

    // Ajout optimiste local
    setDossiers(prev => [normalizedDossier, ...prev])

    // Ajout serveur
    await api.addDossier(normalizedDossier)
  }

  const handleDeleteDossier = async (dossierId) => {
    // Suppression optimiste locale
    setDossiers(prev => prev.filter(d => d.id !== dossierId))
    if (selectedDossier?.id === dossierId) {
      setSelectedDossier(null)
      setCurrentView('dashboard')
    }

    // Suppression serveur
    await api.deleteDossier(dossierId)
  }

  const handleBackToDashboard = () => {
    setSelectedDossier(null)
    setCurrentView('dashboard')
  }

  const filteredDossiers = searchQuery
    ? dossiers.filter(d => 
        d.nom.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.bateau.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (d.lieu && d.lieu.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : dossiers

  return (
    <div className="app">
      <Header 
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        currentView={currentView}
        onViewChange={setCurrentView}
      />
      
      <div className="app-body">
        <Sidebar
          dossiers={filteredDossiers}
          selectedDossier={selectedDossier}
          onSelectDossier={handleSelectDossier}
          onAddDossier={handleAddDossier}
          isOpen={sidebarOpen}
          onToggle={() => setSidebarOpen(!sidebarOpen)}
        />
        
        <main className={`main-content ${sidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
          {loading ? (
            <div className="loading">
              <div className="spinner"></div>
              <p style={{marginTop: '16px', color: 'var(--text-secondary)'}}>Chargement des dossiers...</p>
            </div>
          ) : (
            <>
              {currentView === 'dashboard' && (
                <Dashboard
                  dossiers={dossiers}
                  onSelectDossier={handleSelectDossier}
                />
              )}
              
              {currentView === 'dossier' && selectedDossier && (
                <Dossier
                  dossier={selectedDossier}
                  onUpdate={handleUpdateDossier}
                  onDelete={handleDeleteDossier}
                  onBack={handleBackToDashboard}
                />
              )}
              
              {currentView === 'planning' && (
                <Planning 
                  dossiers={dossiers}
                  onReloadDossiers={loadDossiers}
                />
              )}
            </>
          )}
        </main>
      </div>
      
      <ChatPanel 
        dossiers={dossiers}
        onUpdateDossier={handleUpdateDossier}
        onAddDossier={handleAddDossier}
      />
    </div>
  )
}

export default App

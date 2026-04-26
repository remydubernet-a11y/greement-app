import { useState, useEffect } from 'react'
import { storage } from './utils/storage'
import Header from './components/Header'
import Sidebar from './components/Sidebar'
import Dashboard from './components/Dashboard'
import Dossier from './components/Dossier'
import Planning from './components/Planning'
import ChatPanel from './components/ChatPanel'
import './App.css'

function App() {
  const [dossiers, setDossiers] = useState([])
  const [currentView, setCurrentView] = useState('dashboard') // 'dashboard', 'dossier', 'planning'
  const [selectedDossier, setSelectedDossier] = useState(null)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  // Charger les dossiers au démarrage
  useEffect(() => {
    const loaded = storage.getDossiers()
    setDossiers(loaded)
  }, [])

  // Sauvegarder automatiquement les dossiers quand ils changent
  useEffect(() => {
    if (dossiers.length > 0) {
      storage.saveDossiers(dossiers)
    }
  }, [dossiers])

  const handleSelectDossier = (dossierId) => {
    const dossier = dossiers.find(d => d.id === dossierId)
    setSelectedDossier(dossier)
    setCurrentView('dossier')
  }

  const handleUpdateDossier = (dossierId, updates) => {
    setDossiers(prev => 
      prev.map(d => d.id === dossierId ? { ...d, ...updates, updatedAt: new Date().toISOString() } : d)
    )
    
    // Mettre à jour aussi le dossier sélectionné si c'est le même
    if (selectedDossier?.id === dossierId) {
      setSelectedDossier(prev => ({ ...prev, ...updates }))
    }
  }

  const handleAddDossier = (dossier) => {
    const newDossier = storage.addDossier(dossier)
    setDossiers(prev => [...prev, newDossier])
  }

  const handleDeleteDossier = (dossierId) => {
    storage.deleteDossier(dossierId)
    setDossiers(prev => prev.filter(d => d.id !== dossierId))
    if (selectedDossier?.id === dossierId) {
      setSelectedDossier(null)
      setCurrentView('dashboard')
    }
  }

  const handleBackToDashboard = () => {
    setSelectedDossier(null)
    setCurrentView('dashboard')
  }

  const filteredDossiers = searchQuery
    ? dossiers.filter(d => 
        d.nom.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.bateau.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.lieu.toLowerCase().includes(searchQuery.toLowerCase())
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
            <Planning />
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

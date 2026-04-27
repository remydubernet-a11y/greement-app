import { useState, useEffect } from 'react'
import { supabase } from './utils/supabase'
import Header from './components/Header'
import Sidebar from './components/Sidebar'
import Dashboard from './components/Dashboard'
import Dossier from './components/Dossier'
import Planning from './components/Planning'
import ChatPanel from './components/ChatPanel'
import './App.css'

function App() {
  const [dossiers, setDossiers] = useState([])
  const [currentView, setCurrentView] = useState('dashboard')
  const [selectedDossier, setSelectedDossier] = useState(null)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)

  // Charger les dossiers depuis Supabase au démarrage
  useEffect(() => {
    loadDossiers()
  }, [])

  const loadDossiers = async () => {
    setLoading(true)
    const data = await supabase.getDossiers()
    setDossiers(data)
    setLoading(false)
  }

  const handleSelectDossier = (dossierId) => {
    const dossier = dossiers.find(d => d.id === dossierId)
    setSelectedDossier(dossier)
    setCurrentView('dossier')
  }

  const handleUpdateDossier = async (dossierId, updates) => {
    await supabase.updateDossier(dossierId, updates)
    await loadDossiers() // Recharger depuis Supabase
    
    if (selectedDossier?.id === dossierId) {
      const updated = await supabase.getDossiers()
      setSelectedDossier(updated.find(d => d.id === dossierId))
    }
  }

  const handleAddDossier = async (dossier) => {
    await supabase.addDossier(dossier)
    await loadDossiers() // Recharger depuis Supabase
  }

  const handleDeleteDossier = async (dossierId) => {
    await supabase.deleteDossier(dossierId)
    await loadDossiers() // Recharger depuis Supabase
    
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
          {loading ? (
            <div className="loading">
              <div className="spinner"></div>
              <p>Chargement des dossiers...</p>
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
                <Planning />
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

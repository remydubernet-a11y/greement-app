import { Search, Mail, LayoutDashboard, Anchor, Menu } from 'lucide-react'
import './Header.css'

export default function Header({ searchQuery, onSearchChange, currentView, onViewChange, onToggleSidebar }) {
  return (
    <header className="header">
      <div className="header-content">
        <div className="header-left">
          <button className="mobile-menu-btn" onClick={onToggleSidebar} title="Menu">
            <Menu size={22} />
          </button>
          
          <div className="logo">
            <Anchor size={28} strokeWidth={2.5} />
            <span className="logo-text">Gréement</span>
          </div>
          
          <nav className="nav-tabs">
            <button
              className={`nav-tab ${currentView === 'dashboard' ? 'active' : ''}`}
              onClick={() => onViewChange('dashboard')}
            >
              <LayoutDashboard size={18} />
              Tableau de bord
            </button>
            <button
              className={`nav-tab ${currentView === 'planning' ? 'active' : ''}`}
              onClick={() => onViewChange('planning')}
            >
              <Mail size={18} />
              Mails Gmail
            </button>
          </nav>
        </div>
        
        <div className="header-right">
          <div className="search-box">
            <Search size={18} className="search-icon" />
            <input
              type="text"
              placeholder="Rechercher un dossier, client, bateau..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="search-input"
            />
          </div>
        </div>
      </div>
    </header>
  )
}

import { Calendar, RefreshCw } from 'lucide-react'
import './Planning.css'

export default function Planning() {
  return (
    <div className="planning-view">
      <div className="page-header">
        <div>
          <h1 className="page-title">Planning Google Calendar</h1>
          <p className="page-subtitle">Vos événements à venir</p>
        </div>
        <button className="btn-primary">
          <RefreshCw size={18} />
          Synchroniser
        </button>
      </div>

      <div className="card">
        <div className="empty-state">
          <Calendar size={64} className="empty-state-icon" />
          <p className="empty-state-title">Google Calendar non connecté</p>
          <p className="empty-state-text">
            Connectez votre compte Google pour afficher votre planning ici
          </p>
          <button className="btn-primary" style={{marginTop: '20px'}}>
            Connecter Google Calendar
          </button>
        </div>
      </div>
    </div>
  )
}

import { useState, useEffect } from 'react'
import { Mail, RefreshCw, Link, Check, AlertCircle, Loader2, ExternalLink } from 'lucide-react'
import './Planning.css'

export default function Planning() {
  const [gmailConnected, setGmailConnected] = useState(false)
  const [gmailEmail, setGmailEmail] = useState('')
  const [mails, setMails] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadingMails, setLoadingMails] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    checkGmailStatus()

    // Vérifier si on revient du flux OAuth
    const params = new URLSearchParams(window.location.search)
    if (params.get('gmail_connected') === 'true') {
      setGmailConnected(true)
      window.history.replaceState({}, '', '/')
      fetchMails()
    }
    if (params.get('gmail_error')) {
      setMessage('Erreur connexion Gmail: ' + params.get('gmail_error'))
      window.history.replaceState({}, '', '/')
    }
  }, [])

  const checkGmailStatus = async () => {
    try {
      const res = await fetch('/api/gmail/status')
      const data = await res.json()
      setGmailConnected(data.connected)
      if (data.email) setGmailEmail(data.email)
      if (data.connected) fetchMails()
    } catch (err) {
      console.error('Erreur statut Gmail:', err)
    } finally {
      setLoading(false)
    }
  }

  const fetchMails = async () => {
    setLoadingMails(true)
    try {
      const res = await fetch('/api/gmail/mails')
      const data = await res.json()
      setMails(data.mails || [])
      if (data.message) setMessage(data.message)
    } catch (err) {
      console.error('Erreur mails:', err)
      setMessage('Erreur lors du chargement des mails')
    } finally {
      setLoadingMails(false)
    }
  }

  const connectGmail = () => {
    window.location.href = '/api/auth/gmail'
  }

  if (loading) {
    return (
      <div className="planning-view">
        <div className="loading">
          <div className="spinner"></div>
          <p>Vérification connexion Gmail...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="planning-view">
      <div className="planning-header">
        <div>
          <h1 className="page-title">Mails Gmail</h1>
          <p className="page-subtitle">
            {gmailConnected 
              ? `Connecté à ${gmailEmail} · Label "Greement"`
              : 'Connectez Gmail pour importer vos mails clients'
            }
          </p>
        </div>
        {gmailConnected && (
          <button className="btn-primary" onClick={fetchMails} disabled={loadingMails}>
            {loadingMails ? <Loader2 size={18} className="spinner-icon" /> : <RefreshCw size={18} />}
            Actualiser
          </button>
        )}
      </div>

      {!gmailConnected ? (
        <div className="card">
          <div className="gmail-connect">
            <Mail size={64} className="gmail-icon" />
            <h2>Connecter Gmail</h2>
            <p>Connectez votre compte Gmail pour importer automatiquement les mails de vos clients.</p>
            <ol className="gmail-steps">
              <li>Créez un label <strong>"Greement"</strong> dans Gmail</li>
              <li>Glissez vos mails clients dans ce label</li>
              <li>L'app les récupère et les analyse automatiquement</li>
            </ol>
            <button className="btn-primary btn-lg" onClick={connectGmail}>
              <Link size={20} />
              Connecter mon compte Gmail
            </button>
          </div>
        </div>
      ) : (
        <>
          {message && (
            <div className="gmail-message">
              <AlertCircle size={16} />
              {message}
            </div>
          )}

          {loadingMails ? (
            <div className="loading">
              <div className="spinner"></div>
              <p>Chargement des mails...</p>
            </div>
          ) : mails.length === 0 ? (
            <div className="card">
              <div className="gmail-empty">
                <Mail size={48} />
                <h3>Aucun mail dans le label "Greement"</h3>
                <p>Ajoutez des mails dans le label "Greement" dans Gmail pour les voir ici.</p>
                <a href="https://mail.google.com" target="_blank" rel="noopener" className="btn-secondary">
                  <ExternalLink size={16} />
                  Ouvrir Gmail
                </a>
              </div>
            </div>
          ) : (
            <div className="mails-grid">
              {mails.map(mail => (
                <div key={mail.id} className={`card mail-card ${mail.isUnread ? 'unread' : ''}`}>
                  <div className="mail-card-header">
                    <div className="mail-card-from">{mail.from}</div>
                    <div className="mail-card-date">{mail.date}</div>
                  </div>
                  <div className="mail-card-subject">{mail.subject}</div>
                  <div className="mail-card-body">{mail.snippet}</div>
                  <div className="mail-card-actions">
                    {mail.isUnread && <span className="badge badge-red">Non lu</span>}
                    <button 
                      className="btn-primary btn-sm"
                      onClick={() => {
                        // Copier le mail dans le presse-papier pour le coller dans le chat
                        const mailText = `De: ${mail.from}\nSujet: ${mail.subject}\nDate: ${mail.date}\n\n${mail.body}`
                        navigator.clipboard.writeText(mailText)
                        alert('Mail copié ! Collez-le dans le chat Claude pour créer un dossier.')
                      }}
                    >
                      Copier pour le chat
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}

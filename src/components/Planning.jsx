import { useState, useEffect } from 'react'
import { Mail, RefreshCw, Link, Loader2, ExternalLink, Sparkles, CheckCircle2, AlertCircle } from 'lucide-react'
import './Planning.css'

export default function Planning({ dossiers, onReloadDossiers }) {
  const [gmailConnected, setGmailConnected] = useState(false)
  const [gmailEmail, setGmailEmail] = useState('')
  const [mails, setMails] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadingMails, setLoadingMails] = useState(false)
  const [message, setMessage] = useState('')
  const [processing, setProcessing] = useState({}) // ID -> status
  const [batchProcessing, setBatchProcessing] = useState(false)
  const [batchResult, setBatchResult] = useState(null)

  useEffect(() => {
    checkGmailStatus()

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
    setBatchResult(null)
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

  const reconnectGmail = async () => {
    if (!confirm('Reconnecter Gmail ? Cela permettra d\'autoriser les nouvelles permissions (modifier les labels).')) return
    
    try {
      await fetch('/api/gmail/disconnect', { method: 'POST' })
      window.location.href = '/api/auth/gmail'
    } catch (err) {
      alert('Erreur : ' + err.message)
    }
  }

  const processOneMail = async (mail) => {
    setProcessing(prev => ({ ...prev, [mail.id]: 'processing' }))
    
    try {
      const res = await fetch('/api/gmail/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mail, dossiers })
      })
      const data = await res.json()
      
      if (data.action === 'created') {
        setProcessing(prev => ({ ...prev, [mail.id]: { status: 'success', message: `✅ Dossier ${data.dossier.nom} créé` } }))
      } else if (data.action === 'updated') {
        setProcessing(prev => ({ ...prev, [mail.id]: { status: 'success', message: `✅ Ajouté au dossier ${data.dossier.nom}` } }))
      } else if (data.action === 'ignored') {
        setProcessing(prev => ({ ...prev, [mail.id]: { status: 'ignored', message: `⊘ Ignoré : ${data.reason}` } }))
      } else {
        setProcessing(prev => ({ ...prev, [mail.id]: { status: 'error', message: '❌ Erreur de traitement' } }))
      }
      
      // Recharger les dossiers dans l'app
      if (onReloadDossiers) onReloadDossiers()
      
      // Retirer le mail de la liste après 2 secondes (sauf en cas d'erreur)
      if (data.action === 'created' || data.action === 'updated' || data.action === 'ignored') {
        setTimeout(() => {
          setMails(prev => prev.filter(m => m.id !== mail.id))
        }, 2000)
      }
    } catch (err) {
      setProcessing(prev => ({ ...prev, [mail.id]: { status: 'error', message: '❌ ' + err.message } }))
    }
  }

  const processAllMails = async () => {
    if (!confirm(`Traiter automatiquement les ${mails.length} mails du label "Greement" ?`)) return
    
    setBatchProcessing(true)
    setBatchResult(null)
    
    let created = 0
    let updated = 0
    let ignored = 0
    let errors = 0
    
    for (const mail of mails) {
      try {
        const res = await fetch('/api/gmail/process', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ mail, dossiers })
        })
        const data = await res.json()
        
        if (data.action === 'created') created++
        else if (data.action === 'updated') updated++
        else if (data.action === 'ignored') ignored++
        else errors++
        
        setProcessing(prev => ({ 
          ...prev, 
          [mail.id]: { 
            status: data.action === 'created' ? 'success' : data.action === 'updated' ? 'success' : data.action === 'ignored' ? 'ignored' : 'error',
            message: data.action === 'created' ? `✅ Dossier ${data.dossier?.nom} créé` :
                     data.action === 'updated' ? `✅ Ajouté à ${data.dossier?.nom}` :
                     data.action === 'ignored' ? `⊘ Ignoré` : '❌ Erreur'
          } 
        }))
      } catch (err) {
        errors++
        setProcessing(prev => ({ ...prev, [mail.id]: { status: 'error', message: '❌ ' + err.message } }))
      }
    }
    
    setBatchResult({ created, updated, ignored, errors })
    setBatchProcessing(false)
    
    // Recharger les dossiers
    if (onReloadDossiers) onReloadDossiers()
    
    // Recharger la liste des mails (les mails marqués lus auront disparu si on filtre les non-lus)
    setTimeout(() => fetchMails(), 1000)
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
          <div style={{display: 'flex', gap: '8px', flexWrap: 'wrap'}}>
            <button className="btn-secondary" onClick={fetchMails} disabled={loadingMails || batchProcessing}>
              {loadingMails ? <Loader2 size={18} className="spinner-icon" /> : <RefreshCw size={18} />}
              Actualiser
            </button>
            {mails.length > 0 && (
              <button className="btn-primary" onClick={processAllMails} disabled={batchProcessing}>
                {batchProcessing ? <Loader2 size={18} className="spinner-icon" /> : <Sparkles size={18} />}
                Traiter tous les mails ({mails.length})
              </button>
            )}
            <button className="btn-ghost" onClick={reconnectGmail} title="Reconnecter Gmail (mise à jour des permissions)">
              <Link size={16} />
              Reconnecter
            </button>
          </div>
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
              <li>Cliquez sur <strong>"Traiter tous les mails"</strong> dans l'app</li>
              <li>L'IA crée/met à jour les dossiers automatiquement</li>
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

          {batchResult && (
            <div className="batch-result">
              <CheckCircle2 size={20} />
              <div>
                <strong>Traitement terminé !</strong>
                <div className="batch-stats">
                  {batchResult.created > 0 && <span className="stat-success">✅ {batchResult.created} dossier(s) créé(s)</span>}
                  {batchResult.updated > 0 && <span className="stat-success">📝 {batchResult.updated} dossier(s) mis à jour</span>}
                  {batchResult.ignored > 0 && <span className="stat-neutral">⊘ {batchResult.ignored} mail(s) ignoré(s)</span>}
                  {batchResult.errors > 0 && <span className="stat-error">❌ {batchResult.errors} erreur(s)</span>}
                </div>
              </div>
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
              {mails.map(mail => {
                const status = processing[mail.id]
                return (
                  <div key={mail.id} className={`card mail-card ${mail.isUnread ? 'unread' : ''} ${status?.status || ''}`}>
                    <div className="mail-card-header">
                      <div className="mail-card-from">{mail.from}</div>
                      <div className="mail-card-date">{mail.date}</div>
                    </div>
                    <div className="mail-card-subject">{mail.subject}</div>
                    <div className="mail-card-body">{mail.snippet}</div>
                    <div className="mail-card-actions">
                      {mail.isUnread && !status && <span className="badge badge-red">Non lu</span>}
                      
                      {status === 'processing' ? (
                        <div className="processing-status">
                          <Loader2 size={14} className="spinner-icon" />
                          <span>Analyse en cours...</span>
                        </div>
                      ) : status?.message ? (
                        <div className={`processing-result ${status.status}`}>
                          {status.message}
                        </div>
                      ) : (
                        <button 
                          className="btn-primary btn-sm"
                          onClick={() => processOneMail(mail)}
                          disabled={batchProcessing}
                        >
                          <Sparkles size={14} />
                          Traiter avec l'IA
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </>
      )}
    </div>
  )
}

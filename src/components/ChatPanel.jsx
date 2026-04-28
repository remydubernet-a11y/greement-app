import { useState, useRef, useEffect } from 'react'
import { MessageCircle, X, Send, Loader2 } from 'lucide-react'
import './ChatPanel.css'

export default function ChatPanel({ dossiers, onUpdateDossier, onAddDossier }) {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: "Bonjour Rémy ! Je suis votre assistant pour gérer vos dossiers de gréement.\n\nVous pouvez :\n• Coller un mail → je crée le dossier automatiquement\n• Me demander d'ajouter une note à un dossier\n• Ajouter des tâches à un dossier\n• Me demander de rédiger une réponse\n• Me poser des questions sur vos dossiers\n\nComment puis-je vous aider ?"
    }
  ])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Fonction pour exécuter une action sur un dossier
  const executeAction = (parsed) => {
    if (parsed.action === 'create_dossier' && parsed.dossier) {
      onAddDossier(parsed.dossier)
      return parsed.message || `✅ Dossier ${parsed.dossier.nom} créé avec succès !`
    }
    
    if (parsed.action === 'add_note' && parsed.dossierId && parsed.note) {
      const dossier = dossiers.find(d => d.id === parsed.dossierId)
      if (!dossier) return `❌ Dossier ${parsed.dossierId} introuvable`
      
      const newNote = {
        id: Date.now().toString(),
        date: new Date().toISOString().split('T')[0],
        titre: parsed.note.titre || 'Note',
        texte: parsed.note.texte || ''
      }
      
      onUpdateDossier(parsed.dossierId, {
        notes: [...(dossier.notes || []), newNote]
      })
      
      return parsed.message || `✅ Note ajoutée au dossier ${dossier.nom}`
    }
    
    if (parsed.action === 'add_tache' && parsed.dossierId && parsed.tache) {
      const dossier = dossiers.find(d => d.id === parsed.dossierId)
      if (!dossier) return `❌ Dossier ${parsed.dossierId} introuvable`
      
      const newTache = {
        id: Date.now().toString(),
        texte: parsed.tache.texte || parsed.tache.label || 'Tâche',
        meta: parsed.tache.meta || '',
        fait: false,
        priorite: parsed.tache.priorite || 'normal'
      }
      
      onUpdateDossier(parsed.dossierId, {
        taches: [...(dossier.taches || []), newTache]
      })
      
      return parsed.message || `✅ Tâche ajoutée au dossier ${dossier.nom}`
    }
    
    if (parsed.action === 'add_taches' && parsed.dossierId && parsed.taches) {
      const dossier = dossiers.find(d => d.id === parsed.dossierId)
      if (!dossier) return `❌ Dossier ${parsed.dossierId} introuvable`
      
      const newTaches = parsed.taches.map((t, i) => ({
        id: (Date.now() + i).toString(),
        texte: t.texte || t.label || 'Tâche',
        meta: t.meta || '',
        fait: false,
        priorite: t.priorite || 'normal'
      }))
      
      onUpdateDossier(parsed.dossierId, {
        taches: [...(dossier.taches || []), ...newTaches]
      })
      
      return parsed.message || `✅ ${newTaches.length} tâches ajoutées au dossier ${dossier.nom}`
    }
    
    return null
  }

  const handleSend = async () => {
    if (!input.trim() || isLoading) return

    const userMessage = input.trim()
    setInput('')
    setMessages(prev => [...prev, { role: 'user', content: userMessage }])
    setIsLoading(true)

    try {
      // Préparer le contexte avec les dossiers actuels
      const context = {
        dossiers: dossiers.map(d => ({
          id: d.id,
          nom: d.nom,
          bateau: d.bateau,
          lieu: d.lieu,
          statut: d.statut,
          tachesNonFaites: d.taches?.filter(t => !t.fait).length || 0,
          mailsNonLus: d.mails?.filter(m => m.nonLu).length || 0
        }))
      }

      const systemPrompt = `Tu es l'assistant personnel de Rémy, gérant d'une société de gréement pour bateaux à voile (Agreement Gréement). Tu gères ses dossiers clients.

CONTEXTE ACTUEL - DOSSIERS EXISTANTS:
${JSON.stringify(context, null, 2)}

TES CAPACITÉS:
1. Créer un nouveau dossier à partir d'un mail
2. Ajouter une note à un dossier existant
3. Ajouter des tâches à un dossier existant
4. Rédiger des réponses aux clients (professionnelles mais chaleureuses)
5. Répondre à des questions sur les dossiers

RÈGLE IMPORTANTE:
Tu dois TOUJOURS répondre EXCLUSIVEMENT avec un objet JSON valide (pas de texte avant ou après, pas de balises \`\`\`json) quand tu fais une action.
Pour les questions ou rédactions de mails, réponds normalement en texte.

ACTION 1 - CRÉER UN DOSSIER (à partir d'un mail):
{
  "action": "create_dossier",
  "dossier": {
    "nom": "Nom complet du client",
    "bateau": "Type et nom du bateau",
    "lieu": "Port ou lieu",
    "type": "rematage",
    "statut": "en_cours",
    "couleur": "blue",
    "mails": [
      {
        "expediteur": "Nom de l'expéditeur",
        "sujet": "Sujet du mail",
        "apercu": "Résumé court (1-2 phrases)",
        "nonLu": true
      }
    ],
    "notes": [
      {
        "titre": "Titre de la note",
        "texte": "Contenu de la note"
      }
    ],
    "taches": [
      {
        "texte": "Description de la tâche (OBLIGATOIRE)",
        "meta": "Détails (optionnel)",
        "priorite": "haute"
      }
    ],
    "historique": "Résumé en 1-2 phrases"
  },
  "message": "Confirmation pour Rémy"
}

ACTION 2 - AJOUTER UNE NOTE à un dossier existant:
{
  "action": "add_note",
  "dossierId": "id_du_dossier_existant",
  "note": {
    "titre": "Titre de la note",
    "texte": "Contenu détaillé"
  },
  "message": "Confirmation"
}

ACTION 3 - AJOUTER UNE OU PLUSIEURS TÂCHES à un dossier existant:
{
  "action": "add_taches",
  "dossierId": "id_du_dossier_existant",
  "taches": [
    {
      "texte": "Description de la tâche (OBLIGATOIRE)",
      "meta": "Détails optionnels",
      "priorite": "haute"
    }
  ],
  "message": "Confirmation"
}

VALEURS POSSIBLES:
- type: "rematage" | "voilerie" | "cable" | "entretien" | "autre"
- statut: "en_cours" | "attente_assurance" | "devis_a_faire" | "tracking_attente" | "termine"
- couleur: "blue" | "amber" | "red" | "green" | "coral" | "gray"
- priorite: "haute" | "normal" | "basse"

RÈGLES IMPORTANTES:
- Le champ "texte" des tâches est OBLIGATOIRE
- Quand on te demande d'ajouter une note ET des tâches, fais 2 actions séparées (réponds avec la première, l'utilisateur enchaînera)
- OU mieux : utilise l'action "create_or_update" combinée
- Si tu identifies à la fois une note ET des tâches dans la demande, privilégie d'abord les tâches (plus actionables)
- Si Rémy veut simplement discuter ou poser une question, réponds normalement sans JSON

ACTION 4 - AJOUTER NOTE ET TÂCHES en une seule action (RECOMMANDÉ quand applicable):
{
  "action": "add_note_and_taches",
  "dossierId": "id_du_dossier",
  "note": {
    "titre": "Titre",
    "texte": "Contenu"
  },
  "taches": [
    {
      "texte": "Tâche 1",
      "priorite": "haute"
    }
  ],
  "message": "Confirmation"
}

INSTRUCTIONS POUR RÉDIGER UN MAIL:
Format professionnel mais chaleureux. Signe "Rémy Dubernet - Agreement Gréement".
Réponds en texte normal (pas en JSON) pour les rédactions.

INSTRUCTIONS GÉNÉRALES:
- Réponds en français
- Sois concis et professionnel
- Quand un dossier est mentionné par son nom, retrouve son ID dans le CONTEXTE ACTUEL pour l'utiliser dans tes actions`

      const response = await fetch('/api/claude', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-5-20250929',
          max_tokens: 2000,
          system: systemPrompt,
          messages: [
            ...messages.filter(m => m.role !== 'system'),
            { role: 'user', content: userMessage }
          ]
        })
      })

      const data = await response.json()
      
      if (data.content && data.content[0]) {
        const assistantMessage = data.content[0].text

        // Essayer de parser le JSON (avec ou sans balises ```json)
        try {
          // Nettoyer le message (enlever les balises ```json et ```)
          let cleanMessage = assistantMessage
            .replace(/```json\s*/g, '')
            .replace(/```\s*/g, '')
            .trim()
          
          // Chercher un JSON valide
          const jsonMatch = cleanMessage.match(/\{[\s\S]*"action"[\s\S]*\}/)
          
          if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0])
            
            // Gérer l'action combinée note + tâches
            if (parsed.action === 'add_note_and_taches' && parsed.dossierId) {
              const dossier = dossiers.find(d => d.id === parsed.dossierId)
              if (dossier) {
                const updates = {}
                
                if (parsed.note) {
                  const newNote = {
                    id: Date.now().toString(),
                    date: new Date().toISOString().split('T')[0],
                    titre: parsed.note.titre || 'Note',
                    texte: parsed.note.texte || ''
                  }
                  updates.notes = [...(dossier.notes || []), newNote]
                }
                
                if (parsed.taches && parsed.taches.length > 0) {
                  const newTaches = parsed.taches.map((t, i) => ({
                    id: (Date.now() + i + 1).toString(),
                    texte: t.texte || t.label || 'Tâche',
                    meta: t.meta || '',
                    fait: false,
                    priorite: t.priorite || 'normal'
                  }))
                  updates.taches = [...(dossier.taches || []), ...newTaches]
                }
                
                onUpdateDossier(parsed.dossierId, updates)
                
                setMessages(prev => [...prev, { 
                  role: 'assistant', 
                  content: parsed.message || `✅ Note et ${parsed.taches?.length || 0} tâches ajoutées au dossier ${dossier.nom}`
                }])
                return
              }
            }
            
            // Autres actions
            const result = executeAction(parsed)
            if (result) {
              setMessages(prev => [...prev, { 
                role: 'assistant', 
                content: result
              }])
              return
            }
          }
          
          // Pas de JSON ou action non reconnue : afficher le message tel quel
          setMessages(prev => [...prev, { role: 'assistant', content: assistantMessage }])
        } catch (e) {
          console.error('Erreur parsing JSON:', e)
          setMessages(prev => [...prev, { role: 'assistant', content: assistantMessage }])
        }
      } else if (data.error) {
        setMessages(prev => [...prev, { 
          role: 'assistant', 
          content: `❌ Erreur API : ${JSON.stringify(data.error)}`
        }])
      }
    } catch (error) {
      console.error('Erreur API:', error)
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: "❌ Erreur de connexion à l'API Claude. Vérifiez votre connexion internet et réessayez."
      }])
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <>
      {/* Bouton flottant */}
      {!isOpen && (
        <button className="chat-fab" onClick={() => setIsOpen(true)} title="Assistant Claude">
          <MessageCircle size={24} />
        </button>
      )}

      {/* Panel de chat */}
      {isOpen && (
        <div className="chat-panel">
          <div className="chat-header">
            <div className="chat-header-left">
              <MessageCircle size={20} />
              <span className="chat-title">Assistant Claude</span>
            </div>
            <button className="chat-close" onClick={() => setIsOpen(false)}>
              <X size={20} />
            </button>
          </div>

          <div className="chat-messages">
            {messages.map((msg, idx) => (
              <div key={idx} className={`chat-message ${msg.role}`}>
                <div className="chat-message-content">
                  {msg.content.split('\n').map((line, i) => (
                    <p key={i}>{line}</p>
                  ))}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="chat-message assistant">
                <div className="chat-message-content">
                  <Loader2 size={16} className="spinner-icon" />
                  <span>Claude réfléchit...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="chat-input-wrapper">
            <textarea
              className="chat-input"
              placeholder="Collez un mail, posez une question..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              rows={2}
            />
            <button 
              className="chat-send-btn" 
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
            >
              <Send size={18} />
            </button>
          </div>
        </div>
      )}
    </>
  )
}

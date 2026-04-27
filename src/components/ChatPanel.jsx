import { useState, useRef, useEffect } from 'react'
import { MessageCircle, X, Send, Loader2 } from 'lucide-react'
import './ChatPanel.css'

export default function ChatPanel({ dossiers, onUpdateDossier, onAddDossier }) {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: "Bonjour Rémy ! Je suis votre assistant pour gérer vos dossiers de gréement.\n\nVous pouvez :\n• Coller un mail → je crée le dossier automatiquement\n• Me demander de rédiger une réponse\n• Ajouter des notes à un dossier\n• Me poser des questions sur vos dossiers\n\nComment puis-je vous aider ?"
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

CONTEXTE ACTUEL:
${JSON.stringify(context, null, 2)}

TES CAPACITÉS:
1. Analyser des mails clients et créer des dossiers automatiquement
2. Rédiger des réponses aux clients (professionnelles mais chaleureuses)
3. Ajouter des notes à des dossiers existants
4. Répondre à des questions sur les dossiers en cours

INSTRUCTIONS POUR CRÉER UN DOSSIER:
Quand Rémy te colle un mail, tu dois identifier le client, le bateau, le lieu, le type d'intervention, extraire les tâches urgentes et créer un résumé.

IMPORTANT - FORMAT EXACT À RESPECTER:
Tu dois répondre EXCLUSIVEMENT avec un objet JSON valide (pas de texte avant ou après) avec cette structure EXACTE:

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
        "apercu": "Résumé court du mail (1-2 phrases)",
        "nonLu": true
      }
    ],
    "notes": [
      {
        "titre": "Titre de la note",
        "texte": "Contenu détaillé de la note"
      }
    ],
    "taches": [
      {
        "texte": "Description de la tâche à faire (OBLIGATOIRE)",
        "meta": "Détails ou contexte (optionnel)",
        "priorite": "haute"
      }
    ],
    "historique": "Résumé général du dossier en 1-2 phrases"
  },
  "message": "Message court pour Rémy expliquant ce que tu as créé"
}

VALEURS POSSIBLES:
- type: "rematage" | "voilerie" | "cable" | "entretien" | "autre"
- statut: "en_cours" | "attente_assurance" | "devis_a_faire" | "tracking_attente" | "termine"
- couleur: "blue" | "amber" | "red" | "green" | "coral" | "gray"
- priorite: "haute" | "normal" | "basse"

RÈGLES IMPORTANTES:
- Le champ "texte" des tâches est OBLIGATOIRE et doit toujours être rempli avec une description claire
- Si le client est urgent/pressé, utilise priorite: "haute" et couleur: "red"
- Si c'est un litige/sinistre, utilise statut: "attente_assurance"
- Extrais TOUTES les tâches actionnables du mail

INSTRUCTIONS POUR RÉDIGER UN MAIL:
Format professionnel mais chaleureux. Signe toujours "Rémy Dubernet - Agreement Gréement".
Réponds normalement (pas en JSON) pour les rédactions de mails.

INSTRUCTIONS POUR LES AUTRES DEMANDES:
Réponds en français de manière concise et professionnelle.`

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

        // Vérifier si c'est une action de création de dossier
        try {
          const jsonMatch = assistantMessage.match(/\{[\s\S]*"action"\s*:\s*"create_dossier"[\s\S]*\}/)
          if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0])
            
            if (parsed.action === 'create_dossier' && parsed.dossier) {
              // Créer le dossier
              onAddDossier(parsed.dossier)
              
              // Afficher le message de confirmation
              setMessages(prev => [...prev, { 
                role: 'assistant', 
                content: parsed.message || `✅ Dossier ${parsed.dossier.nom} créé avec succès !`
              }])
            } else {
              setMessages(prev => [...prev, { role: 'assistant', content: assistantMessage }])
            }
          } else {
            setMessages(prev => [...prev, { role: 'assistant', content: assistantMessage }])
          }
        } catch (e) {
          // Si ce n'est pas du JSON, afficher normalement
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

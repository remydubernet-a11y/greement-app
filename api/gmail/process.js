import { neon } from '@neondatabase/serverless';

async function getAccessToken(sql) {
  const rows = await sql`SELECT value FROM settings WHERE key = 'gmail_tokens'`;
  if (rows.length === 0) return null;

  let tokens = rows[0].value;

  const test = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/profile', {
    headers: { 'Authorization': `Bearer ${tokens.access_token}` }
  });

  if (test.status === 401 && tokens.refresh_token) {
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        refresh_token: tokens.refresh_token,
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        grant_type: 'refresh_token'
      })
    });

    const newTokens = await response.json();
    if (newTokens.error) return null;

    tokens.access_token = newTokens.access_token;
    await sql`
      UPDATE settings
      SET value = ${JSON.stringify(tokens)}::jsonb, updated_at = NOW()
      WHERE key = 'gmail_tokens'
    `;
  }

  return tokens.access_token;
}

async function markAsRead(accessToken, messageId) {
  await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}/modify`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      removeLabelIds: ['UNREAD']
    })
  });
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { mail, dossiers } = req.body;

  if (!mail) {
    return res.status(400).json({ error: 'Mail required' });
  }

  const sql = neon(process.env.POSTGRES_URL);

  try {
    // 1. Préparer le contexte des dossiers existants pour Claude
    const context = (dossiers || []).map(d => ({
      id: d.id,
      nom: d.nom,
      bateau: d.bateau,
      lieu: d.lieu,
      statut: d.statut
    }));

    // 2. Demander à Claude d'analyser le mail
    const systemPrompt = `Tu es l'assistant de Rémy Dubernet (Agreement Gréement). Analyse ce mail Gmail et détermine s'il faut :
1. Créer un nouveau dossier client
2. Ajouter une note/tâche à un dossier existant

DOSSIERS EXISTANTS:
${JSON.stringify(context, null, 2)}

RÈGLE: Réponds EXCLUSIVEMENT avec un objet JSON valide (pas de texte, pas de balises).

Si c'est un nouveau client/sujet :
{
  "action": "create_dossier",
  "dossier": {
    "nom": "Nom complet du client",
    "bateau": "Type et nom du bateau (ex: 'First 30', 'Outremer 45')",
    "lieu": "Port ou lieu",
    "type": "rematage|voilerie|cable|entretien|autre",
    "statut": "en_cours|attente_assurance|devis_a_faire|tracking_attente|termine",
    "couleur": "blue|amber|red|green|coral|gray",
    "mails": [{
      "expediteur": "Nom de l'expéditeur",
      "sujet": "Sujet",
      "apercu": "Résumé court",
      "nonLu": false
    }],
    "notes": [{"titre": "Titre", "texte": "Contenu"}],
    "taches": [{"texte": "Tâche", "meta": "Détails", "priorite": "haute|normal|basse"}],
    "historique": "Résumé"
  }
}

Si ça concerne un dossier existant (le client/bateau correspond à un dossier dans la liste) :
{
  "action": "add_note_and_taches",
  "dossierId": "id_existant",
  "note": {"titre": "Titre", "texte": "Contenu du mail synthétisé"},
  "taches": [{"texte": "Tâche", "meta": "Détails", "priorite": "haute"}]
}

Si c'est une publicité/spam/non pertinent :
{
  "action": "ignore",
  "reason": "Pourquoi ignorer"
}`;

    const claudeResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'anthropic-version': '2023-06-01',
        'x-api-key': process.env.ANTHROPIC_API_KEY
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-5-20250929',
        max_tokens: 2000,
        system: systemPrompt,
        messages: [{
          role: 'user',
          content: `Analyse ce mail :

DE: ${mail.from}
SUJET: ${mail.subject}
DATE: ${mail.date}

CORPS:
${mail.body}`
        }]
      })
    });

    const claudeData = await claudeResponse.json();

    if (!claudeData.content || !claudeData.content[0]) {
      return res.status(500).json({ error: 'Réponse Claude invalide', detail: claudeData });
    }

    const responseText = claudeData.content[0].text;

    // 3. Parser le JSON
    let parsed;
    try {
      const cleanText = responseText.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
      const jsonMatch = cleanText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error('Pas de JSON trouvé');
      parsed = JSON.parse(jsonMatch[0]);
    } catch (e) {
      return res.status(500).json({ error: 'Parsing failed', detail: responseText });
    }

    // 4. Exécuter l'action
    const accessToken = await getAccessToken(sql);

    if (parsed.action === 'ignore') {
      // Marquer comme lu mais ne rien faire
      if (accessToken) await markAsRead(accessToken, mail.id);
      return res.status(200).json({ 
        action: 'ignored', 
        reason: parsed.reason 
      });
    }

    if (parsed.action === 'create_dossier' && parsed.dossier) {
      // Normaliser et créer le dossier
      const dossier = parsed.dossier;
      const id = Date.now().toString();
      
      // Ajouter le mail original aux mails du dossier
      const mails = dossier.mails || [];
      mails.unshift({
        id: mail.id,
        expediteur: mail.from,
        sujet: mail.subject,
        apercu: mail.snippet || mail.body.substring(0, 200),
        date: mail.date,
        nonLu: false,
        gmailId: mail.id
      });

      const taches = (dossier.taches || []).map((t, i) => ({
        id: (Date.now() + i).toString(),
        texte: t.texte || t.label || 'Tâche',
        meta: t.meta || '',
        fait: false,
        priorite: t.priorite || 'normal'
      }));

      const notes = (dossier.notes || []).map((n, i) => ({
        id: (Date.now() + i + 100).toString(),
        date: new Date().toISOString().split('T')[0],
        titre: n.titre || 'Note',
        texte: n.texte || ''
      }));

      await sql`
        INSERT INTO dossiers (id, nom, bateau, lieu, type, statut, couleur, mails, notes, taches, devis, historique, created_at, updated_at)
        VALUES (
          ${id},
          ${dossier.nom},
          ${dossier.bateau},
          ${dossier.lieu || ''},
          ${dossier.type || 'autre'},
          ${dossier.statut || 'en_cours'},
          ${dossier.couleur || 'blue'},
          ${JSON.stringify(mails)}::jsonb,
          ${JSON.stringify(notes)}::jsonb,
          ${JSON.stringify(taches)}::jsonb,
          ${JSON.stringify([])}::jsonb,
          ${dossier.historique || ''},
          NOW(),
          NOW()
        )
      `;

      // Marquer le mail comme lu
      if (accessToken) await markAsRead(accessToken, mail.id);

      return res.status(200).json({
        action: 'created',
        dossier: { id, nom: dossier.nom, bateau: dossier.bateau }
      });
    }

    if (parsed.action === 'add_note_and_taches' && parsed.dossierId) {
      const existing = await sql`SELECT * FROM dossiers WHERE id = ${parsed.dossierId}`;
      if (existing.length === 0) {
        return res.status(404).json({ error: 'Dossier introuvable' });
      }

      const dossier = existing[0];
      const updates = {};

      // Ajouter le mail
      const mails = dossier.mails || [];
      mails.unshift({
        id: mail.id,
        expediteur: mail.from,
        sujet: mail.subject,
        apercu: mail.snippet || mail.body.substring(0, 200),
        date: mail.date,
        nonLu: false,
        gmailId: mail.id
      });
      
      await sql`UPDATE dossiers SET mails = ${JSON.stringify(mails)}::jsonb WHERE id = ${parsed.dossierId}`;

      // Ajouter la note
      if (parsed.note) {
        const notes = dossier.notes || [];
        notes.push({
          id: Date.now().toString(),
          date: new Date().toISOString().split('T')[0],
          titre: parsed.note.titre || 'Note',
          texte: parsed.note.texte || ''
        });
        await sql`UPDATE dossiers SET notes = ${JSON.stringify(notes)}::jsonb WHERE id = ${parsed.dossierId}`;
      }

      // Ajouter les tâches
      if (parsed.taches && parsed.taches.length > 0) {
        const taches = dossier.taches || [];
        parsed.taches.forEach((t, i) => {
          taches.push({
            id: (Date.now() + i + 1).toString(),
            texte: t.texte || t.label || 'Tâche',
            meta: t.meta || '',
            fait: false,
            priorite: t.priorite || 'normal'
          });
        });
        await sql`UPDATE dossiers SET taches = ${JSON.stringify(taches)}::jsonb WHERE id = ${parsed.dossierId}`;
      }

      await sql`UPDATE dossiers SET updated_at = NOW() WHERE id = ${parsed.dossierId}`;

      // Marquer comme lu
      if (accessToken) await markAsRead(accessToken, mail.id);

      return res.status(200).json({
        action: 'updated',
        dossier: { id: parsed.dossierId, nom: dossier.nom }
      });
    }

    return res.status(500).json({ error: 'Action inconnue', parsed });
  } catch (err) {
    console.error('Process mail error:', err);
    return res.status(500).json({ error: err.message });
  }
}

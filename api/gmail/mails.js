import { neon } from '@neondatabase/serverless';

async function getAccessToken(sql) {
  const rows = await sql`SELECT value FROM settings WHERE key = 'gmail_tokens'`;
  if (rows.length === 0) return null;

  let tokens = rows[0].value;

  // Tester le token
  const test = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/profile', {
    headers: { 'Authorization': `Bearer ${tokens.access_token}` }
  });

  if (test.status === 401 && tokens.refresh_token) {
    // Rafraîchir le token
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

function decodeBase64Url(str) {
  const base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  try {
    return Buffer.from(base64, 'base64').toString('utf-8');
  } catch {
    return str;
  }
}

function getHeader(headers, name) {
  const header = headers.find(h => h.name.toLowerCase() === name.toLowerCase());
  return header ? header.value : '';
}

function getBody(payload) {
  if (payload.body && payload.body.data) {
    return decodeBase64Url(payload.body.data);
  }

  if (payload.parts) {
    for (const part of payload.parts) {
      if (part.mimeType === 'text/plain' && part.body && part.body.data) {
        return decodeBase64Url(part.body.data);
      }
    }
    for (const part of payload.parts) {
      if (part.mimeType === 'text/html' && part.body && part.body.data) {
        const html = decodeBase64Url(part.body.data);
        return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
      }
    }
    // Chercher dans les sous-parties
    for (const part of payload.parts) {
      if (part.parts) {
        const body = getBody(part);
        if (body) return body;
      }
    }
  }

  return '';
}

export default async function handler(req, res) {
  const sql = neon(process.env.POSTGRES_URL);

  try {
    const accessToken = await getAccessToken(sql);
    if (!accessToken) {
      return res.status(401).json({ error: 'Gmail non connecté' });
    }

    // 1. Trouver le label "Greement"
    const labelsResponse = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/labels', {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });
    const labelsData = await labelsResponse.json();
    
    const greementLabel = labelsData.labels?.find(l => 
      l.name.toLowerCase() === 'greement'
    );

    if (!greementLabel) {
      return res.status(200).json({ 
        mails: [], 
        message: 'Label "Greement" introuvable dans Gmail. Créez-le d\'abord.' 
      });
    }

    // 2. Lire les mails avec ce label
    const messagesResponse = await fetch(
      `https://gmail.googleapis.com/gmail/v1/users/me/messages?labelIds=${greementLabel.id}&maxResults=20`, {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });
    const messagesData = await messagesResponse.json();

    if (!messagesData.messages || messagesData.messages.length === 0) {
      return res.status(200).json({ 
        mails: [], 
        message: 'Aucun mail dans le label Greement' 
      });
    }

    // 3. Récupérer le détail de chaque mail
    const mails = [];
    for (const msg of messagesData.messages.slice(0, 10)) {
      const msgResponse = await fetch(
        `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}?format=full`, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });
      const msgData = await msgResponse.json();

      const headers = msgData.payload?.headers || [];
      const body = getBody(msgData.payload || {});

      mails.push({
        id: msgData.id,
        threadId: msgData.threadId,
        from: getHeader(headers, 'From'),
        to: getHeader(headers, 'To'),
        subject: getHeader(headers, 'Subject'),
        date: getHeader(headers, 'Date'),
        body: body.substring(0, 2000),
        snippet: msgData.snippet || '',
        labelIds: msgData.labelIds || [],
        isUnread: (msgData.labelIds || []).includes('UNREAD')
      });
    }

    return res.status(200).json({ mails });
  } catch (err) {
    console.error('Gmail mails error:', err);
    return res.status(500).json({ error: err.message });
  }
}

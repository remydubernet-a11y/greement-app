import { neon } from '@neondatabase/serverless';

async function refreshToken(sql, tokens) {
  try {
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

    if (newTokens.error) {
      return null;
    }

    // Garder le refresh_token existant s'il n'est pas retourné
    const updatedTokens = {
      ...tokens,
      access_token: newTokens.access_token,
      expires_in: newTokens.expires_in
    };

    await sql`
      UPDATE settings
      SET value = ${JSON.stringify(updatedTokens)}::jsonb, updated_at = NOW()
      WHERE key = 'gmail_tokens'
    `;

    return updatedTokens;
  } catch (err) {
    console.error('Refresh token error:', err);
    return null;
  }
}

export default async function handler(req, res) {
  const sql = neon(process.env.POSTGRES_URL);

  try {
    // Vérifier si la table settings existe
    const tables = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_name = 'settings'
      )
    `;

    if (!tables[0].exists) {
      return res.status(200).json({ connected: false });
    }

    const rows = await sql`SELECT value FROM settings WHERE key = 'gmail_tokens'`;

    if (rows.length === 0) {
      return res.status(200).json({ connected: false });
    }

    let tokens = rows[0].value;

    // Tester si le token fonctionne encore
    const testResponse = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/profile', {
      headers: { 'Authorization': `Bearer ${tokens.access_token}` }
    });

    if (testResponse.status === 401) {
      // Token expiré, essayer de rafraîchir
      if (tokens.refresh_token) {
        tokens = await refreshToken(sql, tokens);
        if (!tokens) {
          return res.status(200).json({ connected: false, reason: 'refresh_failed' });
        }
      } else {
        return res.status(200).json({ connected: false, reason: 'no_refresh_token' });
      }
    }

    const profile = await testResponse.json();

    return res.status(200).json({
      connected: true,
      email: profile.emailAddress
    });
  } catch (err) {
    console.error('Gmail status error:', err);
    return res.status(200).json({ connected: false, reason: 'error' });
  }
}

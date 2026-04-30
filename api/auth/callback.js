import { neon } from '@neondatabase/serverless';

export default async function handler(req, res) {
  const { code, error } = req.query;

  if (error) {
    return res.redirect('/?gmail_error=' + error);
  }

  if (!code) {
    return res.redirect('/?gmail_error=no_code');
  }

  try {
    // Échanger le code contre un access token
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        redirect_uri: process.env.GOOGLE_REDIRECT_URI,
        grant_type: 'authorization_code'
      })
    });

    const tokens = await tokenResponse.json();

    if (tokens.error) {
      console.error('Token error:', tokens);
      return res.redirect('/?gmail_error=token_error');
    }

    // Stocker les tokens dans la base de données
    const sql = neon(process.env.POSTGRES_URL);

    // Créer la table settings si elle n'existe pas
    await sql`
      CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value JSONB NOT NULL,
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `;

    // Sauvegarder les tokens
    await sql`
      INSERT INTO settings (key, value, updated_at)
      VALUES ('gmail_tokens', ${JSON.stringify(tokens)}::jsonb, NOW())
      ON CONFLICT (key)
      DO UPDATE SET value = ${JSON.stringify(tokens)}::jsonb, updated_at = NOW()
    `;

    // Rediriger vers l'app avec succès
    res.redirect('/?gmail_connected=true');
  } catch (err) {
    console.error('OAuth callback error:', err);
    res.redirect('/?gmail_error=server_error');
  }
}

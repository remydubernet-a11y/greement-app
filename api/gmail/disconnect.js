import { neon } from '@neondatabase/serverless';

export default async function handler(req, res) {
  if (req.method !== 'POST' && req.method !== 'DELETE') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const sql = neon(process.env.POSTGRES_URL);

  try {
    await sql`DELETE FROM settings WHERE key = 'gmail_tokens'`;
    return res.status(200).json({ disconnected: true });
  } catch (err) {
    console.error('Disconnect error:', err);
    return res.status(500).json({ error: err.message });
  }
}

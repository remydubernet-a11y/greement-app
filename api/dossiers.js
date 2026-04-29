import { neon } from '@neondatabase/serverless';

export default async function handler(req, res) {
  const sql = neon(process.env.POSTGRES_URL);

  try {
    if (req.method === 'GET') {
      const rows = await sql`SELECT * FROM dossiers ORDER BY created_at DESC`;
      return res.status(200).json(rows);
    }

    if (req.method === 'POST') {
      const dossier = req.body;
      const id = dossier.id || Date.now().toString();
      
      const rows = await sql`
        INSERT INTO dossiers (id, nom, bateau, lieu, type, statut, couleur, mails, notes, taches, devis, historique, created_at, updated_at)
        VALUES (
          ${id},
          ${dossier.nom},
          ${dossier.bateau},
          ${dossier.lieu || ''},
          ${dossier.type || 'autre'},
          ${dossier.statut || 'en_cours'},
          ${dossier.couleur || 'blue'},
          ${JSON.stringify(dossier.mails || [])},
          ${JSON.stringify(dossier.notes || [])},
          ${JSON.stringify(dossier.taches || [])},
          ${JSON.stringify(dossier.devis || [])},
          ${dossier.historique || ''},
          NOW(),
          NOW()
        )
        RETURNING *
      `;
      
      return res.status(201).json(rows[0]);
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('DB Error:', error);
    return res.status(500).json({ error: error.message });
  }
}

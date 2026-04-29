import { neon } from '@neondatabase/serverless';

export default async function handler(req, res) {
  const sql = neon(process.env.POSTGRES_URL);
  const { id } = req.query;

  if (!id) {
    return res.status(400).json({ error: 'ID required' });
  }

  try {
    if (req.method === 'GET') {
      const rows = await sql`SELECT * FROM dossiers WHERE id = ${id}`;
      if (rows.length === 0) {
        return res.status(404).json({ error: 'Dossier not found' });
      }
      return res.status(200).json(rows[0]);
    }

    if (req.method === 'PATCH' || req.method === 'PUT') {
      const updates = req.body;
      
      if (updates.nom !== undefined) await sql`UPDATE dossiers SET nom = ${updates.nom}, updated_at = NOW() WHERE id = ${id}`;
      if (updates.bateau !== undefined) await sql`UPDATE dossiers SET bateau = ${updates.bateau}, updated_at = NOW() WHERE id = ${id}`;
      if (updates.lieu !== undefined) await sql`UPDATE dossiers SET lieu = ${updates.lieu}, updated_at = NOW() WHERE id = ${id}`;
      if (updates.type !== undefined) await sql`UPDATE dossiers SET type = ${updates.type}, updated_at = NOW() WHERE id = ${id}`;
      if (updates.statut !== undefined) await sql`UPDATE dossiers SET statut = ${updates.statut}, updated_at = NOW() WHERE id = ${id}`;
      if (updates.couleur !== undefined) await sql`UPDATE dossiers SET couleur = ${updates.couleur}, updated_at = NOW() WHERE id = ${id}`;
      if (updates.historique !== undefined) await sql`UPDATE dossiers SET historique = ${updates.historique}, updated_at = NOW() WHERE id = ${id}`;
      if (updates.mails !== undefined) await sql`UPDATE dossiers SET mails = ${JSON.stringify(updates.mails)}::jsonb, updated_at = NOW() WHERE id = ${id}`;
      if (updates.notes !== undefined) await sql`UPDATE dossiers SET notes = ${JSON.stringify(updates.notes)}::jsonb, updated_at = NOW() WHERE id = ${id}`;
      if (updates.taches !== undefined) await sql`UPDATE dossiers SET taches = ${JSON.stringify(updates.taches)}::jsonb, updated_at = NOW() WHERE id = ${id}`;
      if (updates.devis !== undefined) await sql`UPDATE dossiers SET devis = ${JSON.stringify(updates.devis)}::jsonb, updated_at = NOW() WHERE id = ${id}`;

      const rows = await sql`SELECT * FROM dossiers WHERE id = ${id}`;
      return res.status(200).json(rows[0]);
    }

    if (req.method === 'DELETE') {
      await sql`DELETE FROM dossiers WHERE id = ${id}`;
      return res.status(200).json({ deleted: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('DB Error:', error);
    return res.status(500).json({ error: error.message });
  }
}

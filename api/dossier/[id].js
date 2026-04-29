import { sql } from '@vercel/postgres';

export default async function handler(req, res) {
  const { id } = req.query;

  if (!id) {
    return res.status(400).json({ error: 'ID required' });
  }

  try {
    if (req.method === 'GET') {
      const { rows } = await sql`SELECT * FROM dossiers WHERE id = ${id}`;
      if (rows.length === 0) {
        return res.status(404).json({ error: 'Dossier not found' });
      }
      return res.status(200).json(rows[0]);
    }

    if (req.method === 'PATCH' || req.method === 'PUT') {
      const updates = req.body;
      
      // Construire la mise à jour dynamiquement
      const fields = [];
      const values = [];
      
      if (updates.nom !== undefined) { fields.push('nom'); values.push(updates.nom); }
      if (updates.bateau !== undefined) { fields.push('bateau'); values.push(updates.bateau); }
      if (updates.lieu !== undefined) { fields.push('lieu'); values.push(updates.lieu); }
      if (updates.type !== undefined) { fields.push('type'); values.push(updates.type); }
      if (updates.statut !== undefined) { fields.push('statut'); values.push(updates.statut); }
      if (updates.couleur !== undefined) { fields.push('couleur'); values.push(updates.couleur); }
      if (updates.mails !== undefined) { fields.push('mails'); values.push(JSON.stringify(updates.mails)); }
      if (updates.notes !== undefined) { fields.push('notes'); values.push(JSON.stringify(updates.notes)); }
      if (updates.taches !== undefined) { fields.push('taches'); values.push(JSON.stringify(updates.taches)); }
      if (updates.devis !== undefined) { fields.push('devis'); values.push(JSON.stringify(updates.devis)); }
      if (updates.historique !== undefined) { fields.push('historique'); values.push(updates.historique); }
      
      if (fields.length === 0) {
        return res.status(400).json({ error: 'No fields to update' });
      }

      // Utiliser des requêtes SQL individuelles pour chaque champ modifié
      for (let i = 0; i < fields.length; i++) {
        const field = fields[i];
        const value = values[i];
        
        if (field === 'nom') await sql`UPDATE dossiers SET nom = ${value}, updated_at = NOW() WHERE id = ${id}`;
        if (field === 'bateau') await sql`UPDATE dossiers SET bateau = ${value}, updated_at = NOW() WHERE id = ${id}`;
        if (field === 'lieu') await sql`UPDATE dossiers SET lieu = ${value}, updated_at = NOW() WHERE id = ${id}`;
        if (field === 'type') await sql`UPDATE dossiers SET type = ${value}, updated_at = NOW() WHERE id = ${id}`;
        if (field === 'statut') await sql`UPDATE dossiers SET statut = ${value}, updated_at = NOW() WHERE id = ${id}`;
        if (field === 'couleur') await sql`UPDATE dossiers SET couleur = ${value}, updated_at = NOW() WHERE id = ${id}`;
        if (field === 'mails') await sql`UPDATE dossiers SET mails = ${value}::jsonb, updated_at = NOW() WHERE id = ${id}`;
        if (field === 'notes') await sql`UPDATE dossiers SET notes = ${value}::jsonb, updated_at = NOW() WHERE id = ${id}`;
        if (field === 'taches') await sql`UPDATE dossiers SET taches = ${value}::jsonb, updated_at = NOW() WHERE id = ${id}`;
        if (field === 'devis') await sql`UPDATE dossiers SET devis = ${value}::jsonb, updated_at = NOW() WHERE id = ${id}`;
        if (field === 'historique') await sql`UPDATE dossiers SET historique = ${value}, updated_at = NOW() WHERE id = ${id}`;
      }

      const { rows } = await sql`SELECT * FROM dossiers WHERE id = ${id}`;
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

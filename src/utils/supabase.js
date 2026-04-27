// Connexion à Supabase
const SUPABASE_URL = 'https://nuposkndluovkmlnlwkc.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im51cG9za25kbHVvdmttbG5sd2tjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcyNjA4MDQsImV4cCI6MjA5MjgzNjgwNH0.uvKh90sXMpeOHkZgESgoFHVtD-AFSv-JcMm3q9dcH6s'

export const supabase = {
  // Récupérer tous les dossiers
  async getDossiers() {
    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/dossiers?select=*&order=created_at.desc`, {
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
        }
      })

      if (!response.ok) {
        throw new Error('Erreur récupération dossiers')
      }

      const data = await response.json()
      return data
    } catch (error) {
      console.error('Erreur Supabase:', error)
      return []
    }
  },

  // Ajouter un dossier
  async addDossier(dossier) {
    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/dossiers`, {
        method: 'POST',
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        },
        body: JSON.stringify({
          id: Date.now().toString(),
          ...dossier,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
      })

      if (!response.ok) {
        throw new Error('Erreur ajout dossier')
      }

      const data = await response.json()
      return data[0]
    } catch (error) {
      console.error('Erreur Supabase:', error)
      return null
    }
  },

  // Mettre à jour un dossier
  async updateDossier(id, updates) {
    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/dossiers?id=eq.${id}`, {
        method: 'PATCH',
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        },
        body: JSON.stringify({
          ...updates,
          updated_at: new Date().toISOString()
        })
      })

      if (!response.ok) {
        throw new Error('Erreur mise à jour dossier')
      }

      const data = await response.json()
      return data[0]
    } catch (error) {
      console.error('Erreur Supabase:', error)
      return null
    }
  },

  // Supprimer un dossier
  async deleteDossier(id) {
    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/dossiers?id=eq.${id}`, {
        method: 'DELETE',
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
        }
      })

      return response.ok
    } catch (error) {
      console.error('Erreur Supabase:', error)
      return false
    }
  }
}

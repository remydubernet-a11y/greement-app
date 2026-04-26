// LocalStorage manager pour les dossiers clients
const STORAGE_KEY = 'greement_dossiers';
const SETTINGS_KEY = 'greement_settings';

export const storage = {
  // Dossiers
  getDossiers() {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : this.getInitialDossiers();
    } catch (error) {
      console.error('Erreur lecture dossiers:', error);
      return this.getInitialDossiers();
    }
  },

  saveDossiers(dossiers) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(dossiers));
      return true;
    } catch (error) {
      console.error('Erreur sauvegarde dossiers:', error);
      return false;
    }
  },

  addDossier(dossier) {
    const dossiers = this.getDossiers();
    const newDossier = {
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      ...dossier
    };
    dossiers.push(newDossier);
    this.saveDossiers(dossiers);
    return newDossier;
  },

  updateDossier(id, updates) {
    const dossiers = this.getDossiers();
    const index = dossiers.findIndex(d => d.id === id);
    if (index !== -1) {
      dossiers[index] = { ...dossiers[index], ...updates, updatedAt: new Date().toISOString() };
      this.saveDossiers(dossiers);
      return dossiers[index];
    }
    return null;
  },

  deleteDossier(id) {
    const dossiers = this.getDossiers();
    const filtered = dossiers.filter(d => d.id !== id);
    this.saveDossiers(filtered);
    return true;
  },

  getDossier(id) {
    const dossiers = this.getDossiers();
    return dossiers.find(d => d.id === id);
  },

  // Settings
  getSettings() {
    try {
      const data = localStorage.getItem(SETTINGS_KEY);
      return data ? JSON.parse(data) : {
        googleCalendarConnected: false,
        gmailConnected: false,
        theme: 'light'
      };
    } catch (error) {
      console.error('Erreur lecture settings:', error);
      return {};
    }
  },

  saveSettings(settings) {
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
      return true;
    } catch (error) {
      console.error('Erreur sauvegarde settings:', error);
      return false;
    }
  },

  // Données initiales
  getInitialDossiers() {
    return [
      {
        id: 'valeyre',
        nom: 'Valeyre Paul',
        bateau: 'Outremer 45 Danson "Essentiel"',
        lieu: 'Nassau, Bahamas',
        type: 'cable',
        statut: 'tracking_attente',
        couleur: 'amber',
        mails: [
          {
            id: '1',
            expediteur: 'Pierre Le Goff (Sparcraft)',
            sujet: 'Outremer 45 Danson — réglage dormant',
            apercu: 'J\'ai eu le client au téléphone. Pas de tensiomètre aux Bermudes. Pas de valeurs d\'origine disponibles pour cette série.',
            date: '2026-04-24T16:00:00Z',
            nonLu: false
          },
          {
            id: '2',
            expediteur: 'Paul Valeyre (WhatsApp)',
            sujet: 'Suivi expédition câble',
            apercu: 'Pouvez-vous me communiquer le numéro de tracking ? Pouvez-vous aider à trouver quelqu\'un sur Nassau avec un tensiomètre ?',
            date: '2026-04-24T17:10:00Z',
            nonLu: true
          }
        ],
        notes: [
          {
            id: '1',
            date: '2026-04-22',
            titre: 'WhatsApp',
            texte: 'Client OK pour le câble. Virement 638,21 € HT / 765,85 € TTC reçu. Facture transport séparée demandée. Expédition FedEx Eco — livraison annoncée 29/04.'
          },
          {
            id: '2',
            date: '2026-04-24',
            titre: 'Position',
            texte: 'Rôle = approvisionnement et logistique du câble, terminé. Réglage = Sparcraft (Pierre Le Goff) et Grand Large Services. Ne pas donner de valeurs de tension.'
          }
        ],
        taches: [
          {
            id: '1',
            texte: 'Envoyer le numéro de tracking FedEx à Paul Valeyre',
            meta: 'En attente du retour transporteur · Livraison annoncée 29/04',
            fait: false,
            priorite: 'haute'
          },
          {
            id: '2',
            texte: 'Câble expédié via FedEx Eco — 638,21 € HT réglés',
            meta: 'Fait le 22/04/2026',
            fait: true,
            priorite: 'normal'
          }
        ],
        devis: [],
        historique: 'Câble galhauban Sparcraft commandé et expédié jusqu\'à Nassau. Paiement reçu le 22/04. Livraison FedEx Eco annoncée le 29/04/2026.',
        createdAt: '2026-04-22T10:00:00Z',
        updatedAt: '2026-04-24T17:10:00Z'
      },
      {
        id: 'chappin',
        nom: 'Chappin Jean',
        bateau: 'Voilier (GV Spectra)',
        lieu: 'Port (panne B)',
        type: 'voilerie',
        statut: 'devis_a_faire',
        couleur: 'gray',
        mails: [
          {
            id: '1',
            expediteur: 'Jean Chappin',
            sujet: 'Grand voile, génois, solent, easy bag — devis',
            apercu: 'GV Spectra avec cassure à la pointe de latte supérieure. Latte inférieure brisée en 3 morceaux. Déchirures easy bag côté babord.',
            date: '2026-04-25T14:00:00Z',
            nonLu: true
          }
        ],
        notes: [
          {
            id: '1',
            date: '2026-04-25',
            titre: 'Analyse mail',
            texte: 'GV Spectra principale chez nous pour réparation. Client demande d\'intégrer discrètement la modification latte forcée + boîtier coulisseau dans le devis de réparation.'
          }
        ],
        taches: [
          {
            id: '1',
            texte: 'Établir devis : GV Spectra + latte brisée',
            meta: 'Latte profilée 8mm, largeur 40mm. Option latte forcée + boîtier coulisseau',
            fait: false,
            priorite: 'haute'
          },
          {
            id: '2',
            texte: 'Établir devis : Génois',
            meta: 'À chiffrer',
            fait: false,
            priorite: 'normal'
          },
          {
            id: '3',
            texte: 'Établir devis : Solent',
            meta: 'À chiffrer',
            fait: false,
            priorite: 'normal'
          },
          {
            id: '4',
            texte: 'Établir devis : Easy bag — déchirures côté babord',
            meta: 'Vérifier si seul le côté babord est concerné',
            fait: false,
            priorite: 'normal'
          }
        ],
        devis: [
          {
            id: '1',
            ref: '1',
            libelle: 'Grand voile Spectra — réparation + latte brisée',
            detail: 'Latte profilée 8mm · L. 40mm. Option : latte forcée + boîtier coulisseau',
            statut: 'a_chiffrer'
          },
          {
            id: '2',
            ref: '2',
            libelle: 'Génois — réparation',
            detail: 'État à vérifier',
            statut: 'a_chiffrer'
          },
          {
            id: '3',
            ref: '3',
            libelle: 'Solent — réparation',
            detail: 'État à vérifier',
            statut: 'a_chiffrer'
          },
          {
            id: '4',
            ref: '4',
            libelle: 'Easy bag — réparation côté babord',
            detail: 'Déchirures prise de ris et fermeture éclair',
            statut: 'a_chiffrer'
          }
        ],
        historique: 'RDV constat confirmé le 29/04 à 12h avec Jade. GV Spectra en dépôt pour réparation. Devis à établir pour 4 éléments après retour de congés.',
        createdAt: '2026-04-25T10:00:00Z',
        updatedAt: '2026-04-25T14:00:00Z'
      },
      {
        id: 'milon',
        nom: 'Milon Christophe',
        bateau: 'Outremer 5X "S\'arannella"',
        lieu: 'Port Saint-Louis du Rhône',
        type: 'rematage',
        statut: 'suivi_marc',
        couleur: 'coral',
        mails: [],
        notes: [
          {
            id: '1',
            date: '2026-04-26',
            titre: 'Situation',
            texte: 'Remâtage effectué. Client affirme qu\'on a oublié d\'attacher la drisse à la housse de génois. Équipe formelle : ce point n\'a jamais été mentionné lors du chantier.'
          },
          {
            id: '2',
            date: '2026-04-26',
            titre: 'Délégation Marc',
            texte: 'Marc chargé de trouver une solution pendant les congés. Il n\'a pas rappelé. RDV téléphonique fixé lundi 28 avril à 10h.'
          }
        ],
        taches: [
          {
            id: '1',
            texte: 'Appeler Marc lundi 10h — faire le point dossier Milon',
            meta: 'Situation réglée ? Marc est allé sur place ? Position du client ?',
            fait: false,
            priorite: 'haute'
          },
          {
            id: '2',
            texte: 'Clarifier avec le client : drisse housse génois mentionnée dans brief initial ?',
            meta: 'Vérifier bons de travaux / mails / échanges avant chantier',
            fait: false,
            priorite: 'normal'
          }
        ],
        devis: [],
        historique: 'Remâtage Outremer 5X effectué. Litige client : drisse housse génois non attachée. Équipe affirme que ce n\'était pas dans le brief. Marc en charge de la résolution.',
        createdAt: '2026-04-26T09:00:00Z',
        updatedAt: '2026-04-26T09:00:00Z'
      },
      {
        id: 'allardet',
        nom: 'Allardet-Servent Jean-Paul',
        bateau: 'First 30',
        lieu: 'Port Camargue',
        type: 'rematage',
        statut: 'attente_assurance',
        couleur: 'red',
        mails: [
          {
            id: '1',
            expediteur: 'Jean-Paul Allardet-Servent',
            sujet: 'Délai remplacement mât + points techniques',
            apercu: 'Urgent : courses 100 milles prévues 1er et 8 mai. Demande activation procédure, ne veut pas être pénalisé par le rapport assurance du sous-traitant. Problèmes : pataras accroche GV, feux de mât mal câblés.',
            date: '2026-04-26T10:00:00Z',
            nonLu: true
          }
        ],
        notes: [
          {
            id: '1',
            date: '2026-03-04',
            titre: 'Sinistre déclaré',
            texte: 'Problème signalé à Mme Bonnefoy le 4 mars. Sous-traitant électricien a fait un mauvais trou lors du remâtage. Nécessite remplacement complet du mât.'
          },
          {
            id: '2',
            date: '2026-04-26',
            titre: 'Position client',
            texte: 'Client très pressé : course 100 milles le 1er mai, puis 8 mai, puis croisière 1 mois. Exige que le sous-traitant assume financièrement sans attendre l\'assurance. Ne veut pas être pénalisé par les délais administratifs. 20 jours déjà perdus depuis le 4 mars.'
          },
          {
            id: '3',
            date: '2026-04-26',
            titre: 'Points techniques à régler',
            texte: '1) Latte de pataras : renforcer/remplacer la latte (plus raide) + raccourcir le bout de poulie car accroche la chute de GV lors des virement de bord. 2) Feux de mât : problème de câblage - le feu de hune éteint le tricolore et allume le mouillage 360°, rendant la navigation impossible. Vérifier branchements avant démâtage ou remettre feux rouge/vert d\'origine.'
          }
        ],
        taches: [
          {
            id: '1',
            texte: 'Obtenir date exacte de livraison du nouveau mât auprès du sous-traitant',
            meta: 'URGENT : client a course le 1er mai (dans 5 jours)',
            fait: false,
            priorite: 'haute'
          },
          {
            id: '2',
            texte: 'Pousser validation assurance électricien pour débloquer commande mât',
            meta: 'Client demande que sous-traitant avance les fonds si besoin',
            fait: false,
            priorite: 'haute'
          },
          {
            id: '3',
            texte: 'Prévoir remplacement/renforcement latte de pataras lors du remâtage',
            meta: 'Latte plus raide + raccourcir bout de poulie',
            fait: false,
            priorite: 'normal'
          },
          {
            id: '4',
            texte: 'Vérifier câblage feux de mât AVANT démâtage',
            meta: 'Feu de hune éteint le tricolore et allume le mouillage - croisement de fils ?',
            fait: false,
            priorite: 'normal'
          },
          {
            id: '5',
            texte: 'Répondre au client sur délai de remplacement',
            meta: 'Mail urgent reçu le 26/04 - réponse attendue rapidement',
            fait: false,
            priorite: 'haute'
          }
        ],
        devis: [],
        historique: 'Remâtage First 30 à Port Camargue. Sinistre le 4 mars : sous-traitant électricien a fait un mauvais trou, nécessite remplacement complet du mât. Attente validation assurance pour passer commande nouveau mât. Client sous pression (courses 1er et 8 mai + croisière). 20 jours de retard déjà accumulés.',
        createdAt: '2026-03-04T10:00:00Z',
        updatedAt: '2026-04-26T10:00:00Z'
      }
    ];
  }
};

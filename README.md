# Gestion Gréement - Application Web

Application web professionnelle pour gérer vos dossiers de gréement nautique.

## 🚀 Fonctionnalités

- ✅ Tableau de bord avec statistiques et actions urgentes
- ✅ Gestion complète des dossiers clients
- ✅ Mails, notes, tâches, devis par dossier
- ✅ Recherche rapide
- ✅ Sauvegarde automatique (localStorage)
- ✅ Interface responsive (desktop, tablette, mobile)
- 📅 Planning Google Calendar (à connecter)

## 📦 Installation

```bash
# Installer les dépendances
npm install

# Lancer en mode développement
npm run dev

# Builder pour la production
npm run build
```

## 🌐 Déploiement sur Vercel (GRATUIT)

### Option 1 : Depuis votre ordinateur

1. Installez Vercel CLI :
```bash
npm install -g vercel
```

2. Déployez :
```bash
cd greement-app
vercel
```

3. Suivez les instructions (appuyez sur Entrée pour tout accepter)

4. Votre app sera accessible à une URL type : `https://greement-app-xxx.vercel.app`

### Option 2 : Depuis GitHub (recommandé)

1. Créez un compte sur https://vercel.com (gratuit)
2. Uploadez ce dossier sur GitHub
3. Sur Vercel, cliquez "New Project"
4. Importez votre repo GitHub
5. Vercel détecte automatiquement Vite et déploie !

## 💾 Données

Les données sont stockées localement dans votre navigateur (localStorage).
Pour migrer vers une vraie base de données (Supabase, Firebase), contactez-moi.

## 🔧 Structure

```
greement-app/
├── src/
│   ├── components/       # Composants React
│   ├── utils/           # Utilitaires (storage)
│   ├── App.jsx          # Application principale
│   └── main.jsx         # Point d'entrée
├── package.json         # Dépendances
└── vite.config.js       # Configuration Vite
```

## 📝 Notes

- Les dossiers Valeyre, Chappin et Milon sont pré-chargés au premier lancement
- Vous pouvez ajouter/supprimer des dossiers librement
- La recherche fonctionne sur nom, bateau et lieu
- Google Calendar sera connecté dans une prochaine version

## ❓ Support

Pour toute question, demandez à Claude !

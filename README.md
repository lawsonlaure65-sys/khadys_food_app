# KHADY'S FOOD & EVENT - App Mobile (PWA)

Une application professionnelle moderne pour le restaurant **Khady's Food & Event** à Niamey.

## ✨ Points forts
- **Interface Mobile-First** : Expérience fluide type application native.
- **Salutations Chaleureuses** : Système "Salam 👋🏾" et "Bonjour 👋🏾" dynamique.
- **IA Khady** : Assistante culinaire intelligente intégrée.
- **PWA Ready** : Installable sur Android et iOS.

## 🚀 Comment mettre à jour GitHub ?
1. Allez sur votre dépôt GitHub.
2. Cliquez sur **Add file** > **Upload files**.
3. Glissez-déposez le fichier `App.tsx` (et les autres si besoin).
4. Cliquez sur **Commit changes** en bas.

## ⚠️ Sécurité
NE JAMAIS mettre votre fichier `.env.local` sur GitHub. Si vous l'avez fait, supprimez-le immédiatement de l'interface GitHub.

## ⚙️ Configuration Supabase
Assurez-vous d'avoir exécuté le fichier `db_schema.sql` dans votre éditeur SQL Supabase pour activer les fonctionnalités dynamiques.

## 📦 Déploiement Vercel
Connectez votre dépôt GitHub à Vercel. Ajoutez vos clés API dans les **Environment Variables** de Vercel :
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `API_KEY` (pour l'IA)
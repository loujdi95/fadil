# FD7.CUT — Site de réservation barber

Site vitrine + réservation en ligne pour le barbershop **fd7.cut**.
Next.js 16 · React 19 · Tailwind v4 · Firebase.

## Ce que fait le site

- **Page d'accueil** premium (noir / violet électrique sur blanc cassé)
- **Galerie** des coupes (alimentée depuis l'espace admin)
- **Réservation** : calendrier semaine par semaine → créneaux de 40 min → formulaire (sans compte)
- **After hour** : créneaux dès 20h avec supplément +5 signalé
- **Espace admin** (`/admin`) : gérer les jours d'ouverture, voir/annuler les réservations, ajouter des photos
- **Réseaux** : Instagram `fd7.cut` · TikTok `fd7.sdn` · Snapchat `fd7.cut`

## Démarrer en local

```bash
npm install
npm run dev
```

Ouvre http://localhost:3000 — et http://localhost:3000/admin pour l'admin.

### Mode démo (par défaut, sans config)

Sans clés Firebase, le site tourne en **mode démo** : réservations, dispos et
photos sont stockées dans le navigateur (localStorage).
Code d'accès admin en démo : **`fd7admin`** (à changer dans `lib/auth.ts`).

## Passer en vrai (Firebase)

1. Crée un projet sur https://console.firebase.google.com
2. Active **Firestore**, **Authentication** (méthode Email/mot de passe) et **Storage**
3. Crée un utilisateur admin dans Authentication (l'email/mdp de ton pote)
4. Copie `.env.local.example` → `.env.local` et remplis les clés (Config SDK)
5. Déploie les règles de sécurité : `firebase deploy --only firestore:rules`

Dès que les clés sont présentes, le site bascule automatiquement sur Firebase.

## Déploiement

```bash
npm run build
firebase deploy
```

Hébergement gratuit sur Firebase Hosting (ou Vercel).

## Personnaliser

- Couleurs / polices : `app/globals.css`
- Prestations proposées : `PRESTATIONS` dans `lib/booking.ts`
- Horaires par défaut : `DEFAULT_AVAILABILITY` dans `lib/store.ts`
- Réseaux sociaux : `lib/site.ts`

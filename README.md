# KIABA RENCONTRE — Plateforme de Petites Annonces pour Adultes

Plateforme web moderne, ultra-rapide et responsive mobile-first conçue avec **Next.js 15, TypeScript, Tailwind CSS, Supabase et GeniusPay**.

---

## 🎨 Charte Graphique "Rose & Bleu"
- **Rose Fuchsia Électrique** (`#EC4899`) : Actions prioritaires, bouton `+ Publier`, badges VIP, étoiles.
- **Rose Blush / Poudré** (`#FDF2F8`) : Surbrillances subtiles des annonces mises en avant.
- **Bleu Profond** (`#1E3A8A` / `#1E40AF`) : Header, typographie principale, boutons d'appel téléphonique.
- **Bleu Cyan** (`#0284C7`) : Badges PRO, filtres actifs.

---

## ⚡ Formules & Tarification en FCFA
1. **Standard** : 7 jours | 1 200 FCFA | **1ère annonce 100% GRATUITE pour chaque nouvel inscrit**.
2. **Pro** : 10 jours (7 jours de mise en avant) | 3 400 FCFA.
3. **Pro (+)** : 15 jours (15 jours de mise en avant totale) | 5 600 FCFA.
4. **VIP** : 30 jours (30 jours de mise en avant permanente + carrousel VIP) | 15 800 FCFA.
5. **Boost en cours de vie** : **60% du prix d'origine** pour mettre l'annonce en avant pour le reste de sa durée de vie.
6. **Modification d'annonce active** : Forfait fixe de **999 FCFA**.
7. **Renouvellement après expiration** : Même prix que la formule d'origine.

---

## 💳 Passerelle de Paiement GeniusPay (Côte d'Ivoire & Afrique)
L'intégration utilise le **Checkout hébergé GeniusPay** (`https://geniuspay.ci`) :
- **Moyens supportés** : Wave, Orange Money, MTN MoMo, Moov Money, Cartes Bancaires Visa/Mastercard.
- **Webhooks sécurisés** : Validation cryptographique HMAC-SHA256 (`x-webhook-signature`, `x-webhook-timestamp` anti-rejeu < 300s).

---

## 🔒 Sécurité, Inscription & Règle d'Interdiction (Blacklist Email)
- Inscription obligatoire pour publier.
- **Photo de profil obligatoire** dès l'inscription.
- Contrôle de majorité strict (+18 ans obligatoire).
- Validation de l'inscription via **code OTP à 6 chiffres** par email.
- **Suppression de compte irréversible** : Toutes les annonces et données sont purgées, et l'adresse email est inscrite à vie dans `blacklisted_emails` (interdiction définitive de réinscription).

---

## 🚀 Démarrage Rapide

### 1. Lancer le serveur de développement
```bash
npm run dev
```
Ouvrez [http://localhost:3000](http://localhost:3000) dans votre navigateur.

### 2. Configuration de Supabase
1. Créez un projet sur [Supabase.com](https://supabase.com).
2. Rendez-vous dans le **SQL Editor** de Supabase et exécutez le script situé dans `supabase/schema.sql`.
3. Renseignez vos clés dans le fichier `.env.local` :
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://votre-projet.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=votre_cle_anon
   SUPABASE_SERVICE_ROLE_KEY=votre_cle_service_role
   ```

### 3. Configuration de GeniusPay
Dans votre compte [GeniusPay.ci](https://geniuspay.ci) (Paramètres → API) :
```env
GENIUSPAY_API_KEY=pk_live_... (ou pk_sandbox_...)
GENIUSPAY_API_SECRET=sk_live_... (ou sk_sandbox_...)
GENIUSPAY_WEBHOOK_SECRET=whsec_...
```
URL de votre webhook à enregistrer sur GeniusPay :
`https://votre-domaine.com/api/webhooks/geniuspay`

---

## 🛡️ Modération Automatique
Aucune modération humaine n'est requise. Le filtre automatique (`src/lib/moderation.ts`) analyse instantanément les textes pour bloquer les propos haineux, racistes ou interdits. Dès paiement réussi, l'annonce est mise en ligne instantanément.

# 🚀 Déployer Market BF gratuitement (Render.com)

Ce guide vous amène de votre machine à une URL publique du type
`https://marketbf.onrender.com` — **sans carte bancaire**.

L'application est déployée en « tout-en-un » : un seul service gratuit qui sert
à la fois l'API et le site (même URL, pas de configuration CORS à gérer).

## ⚠️ Limites du plan gratuit (à connaître)

| Limite | Conséquence |
|---|---|
| Le service s'endort après 15 min sans visite | Le premier chargement prend ~1 minute, ensuite c'est rapide |
| Disque non persistant | La base SQLite et les images uploadées sont **réinitialisées à chaque redéploiement/redémarrage**. Les données de démonstration se recréent automatiquement (admin, boutiques, produits) |
| 750 h/mois | Largement suffisant pour un seul service |

👉 Parfait pour une **démo, une soutenance ou des tests utilisateurs**.
Pour de vrais clients, passez plus tard sur un petit VPS (~5 €/mois) avec le
`docker-compose.yml` déjà présent dans le projet — les données y sont conservées.

---

## Étape 1 — Pousser le code sur GitHub

Le dépôt Git local est déjà prêt (secrets et base de données exclus).

1. Créez un dépôt sur https://github.com/new
   - Nom : `marketbf` (par exemple)
   - **Privé** ou public, au choix
   - Ne cochez AUCUNE option (pas de README, pas de .gitignore)
2. Dans un terminal, depuis le dossier du projet :

```bash
git remote add origin https://github.com/VOTRE_PSEUDO/marketbf.git
git push -u origin main
```

(GitHub vous demandera de vous connecter la première fois.)

## Étape 2 — Créer le service sur Render

1. Créez un compte sur https://render.com (connexion avec GitHub recommandée — aucune carte demandée)
2. Cliquez sur **New → Blueprint**
3. Sélectionnez votre dépôt `marketbf` → Render détecte le fichier `render.yaml` → **Apply**
4. Render construit l'image Docker (5 à 10 min la première fois)

## Étape 3 — Renseigner les variables d'environnement

Dans le dashboard Render → votre service `marketbf` → **Environment**, complétez
les variables marquées « à renseigner » (reprenez les valeurs de votre `backend/.env` local) :

| Variable | Valeur |
|---|---|
| `GOOGLE_CLIENT_ID` | votre ID `xxxx.apps.googleusercontent.com` |
| `SMTP_HOST` | `smtp.gmail.com` |
| `SMTP_USER` | votre adresse Gmail |
| `SMTP_PASS` | votre mot de passe d'application Gmail |
| `EMAIL_FROM` | `"Market BF" <votre@gmail.com>` |

`JWT_SECRET` est généré automatiquement par Render.
`FRONTEND_URL` et `CORS_ORIGINS` sont inutiles : l'application détecte
automatiquement son URL publique Render.

Après modification, cliquez **Save, rebuild, and deploy**.

## Étape 4 — Autoriser votre URL Render chez Google

Pour que « Continuer avec Google » fonctionne en ligne :

1. https://console.cloud.google.com/apis/credentials → votre ID client OAuth
2. Dans **Origines JavaScript autorisées**, ajoutez :
   `https://marketbf.onrender.com` (votre URL exacte, sans / final)
3. Enregistrez (la prise en compte peut prendre quelques minutes)

## Étape 5 — Vérifier

- `https://VOTRE-URL.onrender.com` → le site s'affiche
- `https://VOTRE-URL.onrender.com/api/health` → `{"status":"ok"}`
- Connexion : `admin@marketbf.com` / `Admin123!` (compte de démo recréé à chaque déploiement)
- Passez une commande test → vérifiez la réception du reçu par email

## Mettre à jour le site

À chaque modification du code :

```bash
git add -A
git commit -m "description du changement"
git push
```

Render redéploie automatiquement. (Rappel : cela réinitialise la base de démo.)

---

## Alternative gratuite : garder le service éveillé

Pour éviter l'endormissement pendant une soutenance, ouvrez le site 2 minutes
avant, ou utilisez un service de ping gratuit (ex : https://uptimerobot.com,
ping toutes les 10 min sur `/api/health`).

## Plus tard : passage en production réelle (données conservées)

Le jour où vous voulez de vraies données persistantes :
1. Louez un petit VPS (Hetzner, DigitalOcean, Contabo… ~5 €/mois)
2. Installez Docker puis, dans le dossier du projet : `docker-compose up -d --build`
3. Le `docker-compose.yml` du projet conserve la base et les images dans des volumes.

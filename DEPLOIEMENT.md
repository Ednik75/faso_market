# 🚀 Déployer Market BF gratuitement (Render.com)

Ce guide vous amène de votre machine à une URL publique du type
`https://marketbf.onrender.com` — **sans carte bancaire**.

L'application est déployée en « tout-en-un » : un seul service gratuit qui sert
à la fois l'API et le site (même URL, pas de configuration CORS à gérer).

## ⚠️ Limites du plan gratuit (à connaître)

| Limite | Conséquence |
|---|---|
| Le service s'endort après 15 min sans visite | Le premier chargement prend ~1 minute, ensuite c'est rapide |
| Disque non persistant | Les **images uploadées** sont perdues au redémarrage. La **base de données**, elle, est conservée grâce à Turso (voir Étape 2) |
| 750 h/mois | Largement suffisant pour un seul service |

👉 Grâce à Turso (base SQLite hébergée, gratuite), **les comptes, boutiques,
produits et commandes sont conservés** même quand Render redémarre le service.
Seules les images uploadées restent éphémères sur le plan gratuit.

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

## Étape 2 — Créer la base de données Turso (gratuit, données persistantes)

Turso héberge une base SQLite accessible par le réseau : c'est elle qui garde
vos données quand Render redémarre.

1. Créez un compte sur https://turso.tech (connexion avec GitHub possible, aucune carte demandée)
2. Installez l'outil en ligne de commande :

```bash
curl -sSfL https://get.tur.so/install.sh | bash
turso auth login
```

3. Créez la base et récupérez les deux valeurs à donner à Render :

```bash
turso db create marketbf
turso db show marketbf --url        # → TURSO_DATABASE_URL (libsql://marketbf-xxxx.turso.io)
turso db tokens create marketbf     # → TURSO_AUTH_TOKEN (longue chaîne eyJ...)
```

Notez ces deux valeurs, vous les renseignerez à l'Étape 4.

> 💡 Alternative sans terminal : sur https://app.turso.tech, créez la base
> puis copiez l'URL et générez un token depuis l'interface web.
>
> En développement local, ne mettez rien dans `.env` : l'application utilise
> automatiquement un fichier SQLite local (`backend/database/marketbf.db`).

## Étape 3 — Créer le service sur Render

1. Créez un compte sur https://render.com (connexion avec GitHub recommandée — aucune carte demandée)
2. Cliquez sur **New → Blueprint**
3. Sélectionnez votre dépôt `marketbf` → Render détecte le fichier `render.yaml` → **Apply**
4. Render construit l'image Docker (5 à 10 min la première fois)

## Étape 4 — Renseigner les variables d'environnement

Dans le dashboard Render → votre service `marketbf` → **Environment**, complétez
les variables marquées « à renseigner » (reprenez les valeurs de votre `backend/.env` local) :

| Variable | Valeur |
|---|---|
| `TURSO_DATABASE_URL` | l'URL `libsql://marketbf-xxxx.turso.io` (Étape 2) |
| `TURSO_AUTH_TOKEN` | le token `eyJ...` (Étape 2) |
| `GOOGLE_CLIENT_ID` | votre ID `xxxx.apps.googleusercontent.com` |
| `SMTP_HOST` | `smtp.gmail.com` |
| `SMTP_USER` | votre adresse Gmail |
| `SMTP_PASS` | votre mot de passe d'application Gmail |
| `EMAIL_FROM` | `"Market BF" <votre@gmail.com>` |

`JWT_SECRET` est généré automatiquement par Render.
`FRONTEND_URL` et `CORS_ORIGINS` sont inutiles : l'application détecte
automatiquement son URL publique Render.

Après modification, cliquez **Save, rebuild, and deploy**.

## Étape 5 — Autoriser votre URL Render chez Google

Pour que « Continuer avec Google » fonctionne en ligne :

1. https://console.cloud.google.com/apis/credentials → votre ID client OAuth
2. Dans **Origines JavaScript autorisées**, ajoutez :
   `https://marketbf.onrender.com` (votre URL exacte, sans / final)
3. Enregistrez (la prise en compte peut prendre quelques minutes)

## Étape 6 — Vérifier

- `https://VOTRE-URL.onrender.com` → le site s'affiche
- `https://VOTRE-URL.onrender.com/api/health` → `{"status":"ok"}`
- Connexion : `admin@marketbf.com` / `Admin123!` (créé au premier démarrage ;
  les données de démo ne sont insérées que si la base Turso est vide)
- Passez une commande test → vérifiez la réception du reçu par email
- **Test de persistance** : créez un compte, attendez 20 min que le service
  s'endorme, revenez → le compte est toujours là ✅

## Mettre à jour le site

À chaque modification du code :

```bash
git add -A
git commit -m "description du changement"
git push
```

Render redéploie automatiquement. Les données restent dans Turso : un
redéploiement ne les touche pas.

---

## Alternative gratuite : garder le service éveillé

Pour éviter l'endormissement pendant une soutenance, ouvrez le site 2 minutes
avant, ou utilisez un service de ping gratuit (ex : https://uptimerobot.com,
ping toutes les 10 min sur `/api/health`).

## Plus tard : conserver aussi les images uploadées

Les données (comptes, boutiques, commandes…) sont déjà persistantes grâce à
Turso. Seules les **images uploadées** disparaissent au redémarrage sur le plan
gratuit Render. Options quand ce sera gênant :
1. **Cloudinary** (gratuit, 25 Go) : stockage d'images externe — demande une
   petite adaptation du code d'upload
2. **Disque persistant Render** (~7 $/mois, plan Starter)
3. **Petit VPS** (Hetzner, Contabo… ~5 €/mois) avec le `docker-compose.yml` du
   projet : `docker-compose up -d --build` (volumes persistants pour les images ;
   la base peut rester sur Turso ou revenir en fichier local)

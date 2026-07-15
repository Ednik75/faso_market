# Market BF 🇧🇫

Marketplace locale pour le Burkina Faso — une plateforme qui connecte les commerçants de Ouagadougou (et environs) à leurs clients : catalogue produits, commandes, gestion de stock, statistiques de vente et validation des boutiques par un administrateur.

**🌍 Démo en ligne : https://marketbf.onrender.com** *(hébergement gratuit Render : le premier chargement peut prendre ~1 minute si le service était endormi)*

## Sommaire

- [Fonctionnalités](#fonctionnalités)
- [Sécurité](#sécurité)
- [Stack technique](#stack-technique)
- [Architecture du projet](#architecture-du-projet)
- [Modèle de données](#modèle-de-données)
- [Démarrage rapide](#démarrage-rapide)
- [Démarrage avec Docker](#démarrage-avec-docker)
- [Déploiement en production](#déploiement-en-production)
- [Variables d'environnement](#variables-denvironnement)
- [Comptes de démonstration](#comptes-de-démonstration)
- [API — vue d'ensemble](#api--vue-densemble)
- [Scripts disponibles](#scripts-disponibles)

## Fonctionnalités

Le projet gère trois rôles distincts, chacun avec son propre espace :

**Client**
- Parcourir le catalogue de produits et rechercher par nom/catégorie
- Consulter les boutiques sur une carte interactive (Leaflet)
- Voir le détail d'une boutique et de ses produits
- Ajouter au panier et passer commande (paiement Orange Money, Moov Money, Wave ou paiement à la livraison)
- Recevoir un **reçu par email** à la commande et un **email de confirmation à la livraison**
- Suivre l'état de ses commandes
- Laisser un avis (note + commentaire) sur une boutique

**Authentification**
- Inscription / connexion classique (email + mot de passe, JWT)
- **Connexion avec Google** (Google Identity Services)
- **Mot de passe oublié** : lien de réinitialisation envoyé par email (valable 1 heure)

**Commerçant**
- Créer et gérer le profil de sa boutique
- Ajouter, modifier, supprimer des produits (avec upload d'image)
- Gérer le stock : quantités, seuils d'alerte, mouvements d'entrée/sortie
- Suivre et mettre à jour le statut de ses commandes
- Consulter des statistiques de vente (chiffre d'affaires, produits les plus vendus, etc.)

**Administrateur**
- Valider ou rejeter les boutiques en attente
- Gérer les utilisateurs (liste, suppression)
- Vue d'ensemble des statistiques de la plateforme

## Sécurité

- **Helmet** : en-têtes HTTP de sécurité (XSS, sniffing, clickjacking…)
- **Rate limiting** : 300 requêtes / 15 min par IP en global, 20 tentatives / 15 min sur les routes d'authentification (anti brute-force)
- **CORS restreint** aux origines autorisées (`CORS_ORIGINS`, + URL publique Render détectée automatiquement)
- **JWT signé HS256** avec secret fort obligatoire en production (le serveur refuse de démarrer sinon)
- **Mots de passe** : bcrypt (12 rounds), politique de 8 caractères minimum avec lettres et chiffres
- **Anti-énumération de comptes** : réponse identique que l'email existe ou non (mot de passe oublié), comparaison bcrypt systématique (temps constant)
- **Tokens de réinitialisation** : aléatoires (256 bits), stockés hachés (SHA-256), usage unique, expiration 1 h
- **Validation des entrées** sur toutes les routes (express-validator + contrôles numériques), quantités et prix bornés
- **Commandes transactionnelles** : décrément de stock atomique et protégé contre les courses, restitution du stock en cas d'annulation
- **Uploads durcis** : extension + type MIME vérifiés, 5 Mo max, nom de fichier aléatoire
- **Payload JSON limité** à 100 ko, erreurs internes jamais exposées au client

## Stack technique

| Côté | Technologies |
|---|---|
| **Backend** | Node.js, Express, `@libsql/client` (Turso en production / fichier SQLite en local), JWT (`jsonwebtoken`), `bcryptjs`, `express-validator`, `helmet`, `express-rate-limit`, `multer` + **Cloudinary** (images), `nodemailer` (emails), `google-auth-library` (connexion Google) |
| **Frontend** | React 18, Vite, React Router, Tailwind CSS, Axios, Leaflet / React-Leaflet (carte), Recharts (graphiques), Lucide React (icônes), React Hot Toast |
| **Infra** | Docker (image « tout-en-un » : l'API Express sert aussi le build React), Docker Compose (variante 2 services), Render.com (hébergement), Turso (base de données), Cloudinary (stockage d'images) |

### Persistance des données

- **Base de données** : `@libsql/client` se connecte à **Turso** (SQLite hébergé, gratuit) si `TURSO_DATABASE_URL` est défini, sinon à un fichier SQLite local (`backend/database/marketbf.db`) — idéal en développement.
- **Images uploadées** : envoyées sur **Cloudinary** si `CLOUDINARY_URL` est défini, sinon stockées sur le disque local (`backend/uploads/`).

Ce double mode permet à l'application de survivre au disque éphémère du plan gratuit de Render : données et photos sont conservées entre les redémarrages.

## Architecture du projet

```
projet_lebian/
├── backend/
│   ├── database/
│   │   └── db.js              # Client libSQL (Turso ou fichier local), schéma, seed de démo
│   ├── middleware/
│   │   ├── auth.js            # Vérification JWT + contrôle des rôles
│   │   └── asyncHandler.js    # Gestion centralisée des erreurs async
│   ├── routes/
│   │   ├── auth.js            # Inscription / connexion / Google / mot de passe oublié
│   │   ├── shops.js           # Boutiques
│   │   ├── products.js        # Produits
│   │   ├── stock.js           # Gestion des stocks
│   │   ├── orders.js          # Commandes
│   │   ├── reviews.js         # Avis clients
│   │   ├── stats.js           # Statistiques commerçant
│   │   ├── admin.js           # Administration
│   │   └── upload.js          # Upload d'images (Cloudinary ou disque local)
│   ├── utils/
│   │   └── mailer.js          # Envoi d'emails (SMTP ou simulation console)
│   ├── uploads/                # Images uploadées (mode local uniquement)
│   ├── public/                 # Build frontend servi par l'API (créé par le Dockerfile)
│   ├── server.js               # Point d'entrée Express
│   └── Dockerfile              # Image backend seule (pour docker-compose)
├── frontend/
│   ├── src/
│   │   ├── api/axios.js        # Instance Axios configurée (base URL, token)
│   │   ├── contexts/AuthContext.jsx  # Contexte d'authentification global
│   │   ├── components/         # Navbar, ProductCard, ShopCard, StarRating...
│   │   └── pages/
│   │       ├── client/         # Catalogue, panier, commandes, carte des boutiques...
│   │       ├── merchant/       # Dashboard, produits, stock, commandes, stats
│   │       └── admin/          # Dashboard, validation boutiques, utilisateurs
│   ├── nginx.conf              # Config Nginx (variante docker-compose)
│   └── Dockerfile              # Image frontend Nginx (pour docker-compose)
├── Dockerfile                  # Image de production « tout-en-un » (utilisée par Render)
├── render.yaml                 # Blueprint de déploiement Render.com
├── DEPLOIEMENT.md              # Guide pas-à-pas : Render + Turso + Cloudinary
├── docker-compose.yml
└── start.sh                    # Script de démarrage local (backend + frontend)
```

## Modèle de données

Base SQLite/libSQL avec les tables suivantes (voir `backend/database/db.js`) :

- **users** — clients, commerçants, admins (`role`: `client` \| `merchant` \| `admin`)
- **shops** — boutiques, géolocalisées (latitude/longitude), statut `pending` \| `active` \| `rejected`
- **products** — produits rattachés à une boutique
- **stock** / **stock_movements** — quantités en stock, seuil d'alerte, historique des entrées/sorties
- **orders** / **order_items** — commandes et leurs lignes de produits
- **payments** — paiement lié à une commande (Orange Money, Moov Money, Wave, cash à la livraison)
- **reviews** — avis clients sur une boutique (note 1-5 + commentaire)

Au premier démarrage, la base est automatiquement créée et peuplée avec des données de démonstration (boutiques d'Ouagadougou, produits typiques burkinabè, commandes et avis d'exemple).

## Démarrage rapide

### Prérequis

- Node.js 18+ et npm

### Installation

```bash
# Backend
cd backend
npm install
cp .env.example .env   # à adapter si besoin

# Frontend
cd ../frontend
npm install
```

### Lancer l'application

Le plus simple, depuis la racine du projet :

```bash
./start.sh
```

Ce script démarre le backend (port 5000) et le frontend (port 3000) en parallèle.

Ou manuellement, dans deux terminaux séparés :

```bash
# Terminal 1 — backend
cd backend
npm run dev      # avec nodemon, ou `npm start` en mode simple

# Terminal 2 — frontend
cd frontend
npm run dev
```

Accès :
- Frontend : http://localhost:3000
- API Backend : http://localhost:5000
- Health check : http://localhost:5000/api/health

En local, aucune configuration Turso ou Cloudinary n'est nécessaire : la base est un fichier SQLite et les images vont sur le disque.

## Démarrage avec Docker

Deux options :

**Image « tout-en-un »** (celle utilisée en production) — l'API sert aussi le frontend, une seule URL :

```bash
docker build -t marketbf .
docker run -p 5000:5000 -e JWT_SECRET=$(openssl rand -hex 48) marketbf
# → http://localhost:5000 (site + API)
```

**Docker Compose** (backend + frontend Nginx séparés) :

```bash
JWT_SECRET=$(openssl rand -hex 48) docker-compose up --build
```

- Frontend (Nginx) : http://localhost:3000
- Backend (API) : http://localhost:5000
- Base SQLite persistée dans le volume `marketbf_db`, images dans `marketbf_uploads`
- Toutes les variables optionnelles (Turso, Cloudinary, SMTP, Google…) peuvent être passées en variables d'environnement

## Déploiement en production

L'application est déployée sur **Render.com** (plan gratuit) en mode « tout-en-un » : un seul service Docker sert l'API et le site sur la même URL.

- **Blueprint** : `render.yaml` (New → Blueprint sur le dashboard Render)
- **Base de données** : [Turso](https://turso.tech) (SQLite hébergé, gratuit) via `TURSO_DATABASE_URL` + `TURSO_AUTH_TOKEN`
- **Images** : [Cloudinary](https://cloudinary.com) (gratuit) via `CLOUDINARY_URL`

👉 Le guide complet pas-à-pas (création des comptes Turso/Cloudinary, configuration Render, limites du plan gratuit) est dans **[DEPLOIEMENT.md](DEPLOIEMENT.md)**.

## Variables d'environnement

### Backend (`backend/.env`)

| Variable | Description | Défaut |
|---|---|---|
| `PORT` | Port d'écoute de l'API | `5000` |
| `JWT_SECRET` | Secret de signature des tokens JWT (**32 caractères minimum**, obligatoire en production — `openssl rand -hex 48`) | *(à changer en production)* |
| `NODE_ENV` | Environnement (`development` / `production`) | `development` |
| `TURSO_DATABASE_URL` | URL `libsql://…` de la base Turso (production) | *(si vide, fichier SQLite local)* |
| `TURSO_AUTH_TOKEN` | Token d'accès Turso (`turso db tokens create <base>`) | — |
| `CLOUDINARY_URL` | URL `cloudinary://…` pour le stockage des images (production) | *(si vide, disque local)* |
| `FRONTEND_URL` | URL du frontend, utilisée dans les liens des emails | `http://localhost:3000` |
| `CORS_ORIGINS` | Origines autorisées (séparées par des virgules) | localhost 3000/4173/5173 |
| `GOOGLE_CLIENT_ID` | Client ID OAuth Google pour « Continuer avec Google » | *(désactivé si vide)* |
| `SMTP_HOST` / `SMTP_PORT` / `SMTP_SECURE` / `SMTP_USER` / `SMTP_PASS` | Serveur SMTP pour l'envoi des emails (reçus, livraisons, réinitialisation) | *(si vide, emails simulés dans la console)* |
| `EMAIL_FROM` | Expéditeur des emails | `"Market BF" <no-reply@marketbf.com>` |

#### Activer la connexion Google

1. Créez un projet sur [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Créez un identifiant **OAuth 2.0 → Application Web**
3. Ajoutez `http://localhost:3000` (et l'URL de production) aux **Origines JavaScript autorisées**
4. Copiez le Client ID dans `GOOGLE_CLIENT_ID` du fichier `backend/.env` et redémarrez le backend

Le bouton « Continuer avec Google » apparaît automatiquement sur les pages de connexion et d'inscription dès que la variable est renseignée.

#### Activer l'envoi réel d'emails (exemple Gmail)

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=votre@gmail.com
SMTP_PASS=mot-de-passe-application   # https://myaccount.google.com/apppasswords
```

Sans configuration SMTP, les emails sont affichés dans la console du backend (pratique en développement).

### Frontend

| Variable | Description |
|---|---|
| `VITE_API_URL` | URL de base de l'API backend (utilisée au build ; inutile en mode « tout-en-un » où API et site partagent la même URL) |

## Comptes de démonstration

| Rôle | Email | Mot de passe |
|---|---|---|
| Admin | admin@marketbf.com | Admin123! |
| Commerçant 1 | merchant1@marketbf.com | Merchant1! |
| Commerçant 2 | merchant2@marketbf.com | Merchant2! |
| Client | client@marketbf.com | Client123! |

## API — vue d'ensemble

Toutes les routes sont préfixées par `/api`. Les routes protégées nécessitent un header `Authorization: Bearer <token>` obtenu via `/api/auth/login`.

| Ressource | Endpoints principaux |
|---|---|
| `auth` | `POST /register`, `POST /login`, `POST /google`, `POST /forgot-password`, `POST /reset-password`, `GET /config`, `GET /me` |
| `shops` | `GET /`, `GET /:id`, `POST /` (commerçant), `PUT /:id` (commerçant/admin), `GET /merchant/mine`, `GET /categories/list` |
| `products` | `GET /`, `GET /:id`, `POST /` (commerçant), `PUT /:id`, `DELETE /:id`, `GET /merchant/mine`, `GET /categories/list` |
| `stock` | `GET /product/:productId`, `PUT /product/:productId`, `POST /movement`, `GET /movements/:productId`, `GET /alerts` (tout commerçant) |
| `orders` | `POST /` (client), `GET /`, `GET /:id`, `PUT /:id/status` (commerçant/admin) |
| `reviews` | `GET /shop/:shopId`, `POST /` (client), `DELETE /:id` |
| `stats` | `GET /overview`, `GET /sales`, `GET /products` (commerçant) |
| `admin` | `GET /shops`, `PUT /shops/:id/validate`, `GET /users`, `DELETE /users/:id`, `GET /stats` |
| `upload` | `POST /` (upload d'image, authentifié — Cloudinary ou disque local) |

Health check : `GET /api/health`

## Scripts disponibles

**Backend**
```bash
npm start   # démarrage standard
npm run dev # démarrage avec nodemon (rechargement auto)
```

**Frontend**
```bash
npm run dev      # serveur de développement Vite
npm run build    # build de production dans dist/
npm run preview  # prévisualiser le build de production
```

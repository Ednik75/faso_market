# Market BF 🇧🇫

Marketplace locale pour le Burkina Faso — une plateforme qui connecte les commerçants de Ouagadougou (et environs) à leurs clients : catalogue produits, commandes, gestion de stock, statistiques de vente et validation des boutiques par un administrateur.

## Sommaire

- [Fonctionnalités](#fonctionnalités)
- [Stack technique](#stack-technique)
- [Architecture du projet](#architecture-du-projet)
- [Modèle de données](#modèle-de-données)
- [Démarrage rapide](#démarrage-rapide)
- [Démarrage avec Docker](#démarrage-avec-docker)
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
- **CORS restreint** aux origines autorisées (`CORS_ORIGINS`)
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
| **Backend** | Node.js, Express, better-sqlite3 (SQLite), JWT (`jsonwebtoken`), `bcryptjs`, `express-validator`, `multer` (upload d'images) |
| **Frontend** | React 18, Vite, React Router, Tailwind CSS, Axios, Leaflet / React-Leaflet (carte), Recharts (graphiques), Lucide React (icônes), React Hot Toast |
| **Infra** | Docker (backend Node + frontend Nginx), Docker Compose, volume persistant pour la base SQLite |

## Architecture du projet

```
projet_lebian/
├── backend/
│   ├── database/
│   │   └── db.js              # Connexion SQLite, schéma, seed de données de démo
│   ├── middleware/
│   │   └── auth.js            # Vérification JWT + contrôle des rôles
│   ├── routes/
│   │   ├── auth.js            # Inscription / connexion / profil
│   │   ├── shops.js           # Boutiques
│   │   ├── products.js        # Produits
│   │   ├── stock.js           # Gestion des stocks
│   │   ├── orders.js          # Commandes
│   │   ├── reviews.js         # Avis clients
│   │   ├── stats.js           # Statistiques commerçant
│   │   ├── admin.js           # Administration
│   │   └── upload.js          # Upload d'images produits/boutiques
│   ├── uploads/                # Fichiers uploadés (images)
│   ├── server.js               # Point d'entrée Express
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── api/axios.js        # Instance Axios configurée (base URL, token)
│   │   ├── contexts/AuthContext.jsx  # Contexte d'authentification global
│   │   ├── components/         # Navbar, ProductCard, ShopCard, StarRating...
│   │   └── pages/
│   │       ├── client/         # Catalogue, panier, commandes, carte des boutiques...
│   │       ├── merchant/       # Dashboard, produits, stock, commandes, stats
│   │       └── admin/          # Dashboard, validation boutiques, utilisateurs
│   ├── nginx.conf              # Config Nginx pour servir le build en production
│   └── Dockerfile
├── docker-compose.yml
├── start.sh                    # Script de démarrage local (backend + frontend)
└── Cahier_des_charges_application_commerce.pdf
```

## Modèle de données

Base SQLite avec les tables suivantes (voir `backend/database/db.js`) :

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

## Démarrage avec Docker

```bash
docker-compose up --build
```

- Frontend (Nginx) : http://localhost:3000
- Backend (API) : http://localhost:5000
- La base SQLite est persistée dans le volume Docker `marketbf_db`

Le mot de passe JWT de production peut être surchargé via la variable d'environnement `JWT_SECRET` avant de lancer `docker-compose up`.

## Variables d'environnement

### Backend (`backend/.env`)

| Variable | Description | Défaut |
|---|---|---|
| `PORT` | Port d'écoute de l'API | `5000` |
| `JWT_SECRET` | Secret de signature des tokens JWT (**32 caractères minimum**, obligatoire en production — `openssl rand -hex 48`) | *(à changer en production)* |
| `NODE_ENV` | Environnement (`development` / `production`) | `development` |
| `FRONTEND_URL` | URL du frontend, utilisée dans les liens des emails | `http://localhost:3000` |
| `CORS_ORIGINS` | Origines autorisées (séparées par des virgules) | localhost 3000/4173/5173 |
| `GOOGLE_CLIENT_ID` | Client ID OAuth Google pour « Continuer avec Google » | *(désactivé si vide)* |
| `SMTP_HOST` / `SMTP_PORT` / `SMTP_SECURE` / `SMTP_USER` / `SMTP_PASS` | Serveur SMTP pour l'envoi des emails (reçus, livraisons, réinitialisation) | *(si vide, emails simulés dans la console)* |
| `EMAIL_FROM` | Expéditeur des emails | `"Market BF" <no-reply@marketbf.com>` |

#### Activer la connexion Google

1. Créez un projet sur [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Créez un identifiant **OAuth 2.0 → Application Web**
3. Ajoutez `http://localhost:3000` aux **Origines JavaScript autorisées**
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
| `VITE_API_URL` | URL de base de l'API backend (utilisée au build, notamment via Docker) |

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
| `upload` | `POST /` (upload d'image, authentifié) |

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

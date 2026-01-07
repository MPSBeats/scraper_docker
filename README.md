# orium_agence_scrapper


# API Restaurants Île-de-France

## Introduction
*Le blabla de l'intro décrivant le projet en quoi il consiste , que je vais déveloper tout à l'heure*

Cette API REST recense les restaurants en Île-de-France depuis un CSV, avec options de filtrage, recherche et historique des utilisateurs. Elle utilise une architecture REST + MVC + POO, et est sécurisée avec JWT, rate limiting et CORS.  

---

## Installation

### 1. Cloner le projet
```bash
git clone https://github.com/MPSBeats/scraper_docker.git
cd orium_agence_scrapper
````

### 2. Installer les dépendances

```bash
npm init -y

npm i express dotenv cors
npm i swagger-ui-express swagger-jsdoc
npm i pg mongoose mongodb-memory-server
npm i -D jest supertest cross-env
npm i bcrypt jsonwebtoken express-rate-limit
npm install swagger-ui-express js-yaml
```

Pour installer toutes les dépendances du projet :

```bash
# à la racine (backend)
npm install

# installer aussi les dépendances du front-end (client) qui utilise Vite
cd client
npm install
```

Remarque : le client utilise `vite` (installé dans `client/devDependencies`). Lancer `npm run dev` doit être exécuté depuis le dossier `client`.
---

## Configuration

Créer un fichier `.env` à la racine du projet et définir vos variables d'environnement, par exemple :

```
PORT=3000
DATABASE_URL=postgresql://postgres:votre_mot_de_passe@127.0.0.1:5432/orium_agence_scrapper_sql
MONGO_URI=mongodb://127.0.0.1:27017/orium_agence_scrapper_nosql
JWT_SECRET=ton_secret_jwt_key
```

Rate limiting: le projet utilise `express-rate-limit`. La configuration par défaut se trouve dans `src/middlewares/rateLimiter.js` (fenêtre 5 minutes, 100 requêtes). Vous pouvez modifier ces valeurs ou créer des limiteurs spécifiques via la factory `createLimiter` exportée par ce fichier.

CORS: Le projet utilise `cors` pour gérer les origines autorisées. Vous pouvez configurer le comportement via ces variables d'environnement dans votre `.env`:

```
# Autoriser toutes les origines (utile en dev)
CORS_ALLOW_ALL=true

# Ou limiter aux origines listées (CSV)
CORS_ALLOWED_ORIGINS=https://example.com,https://frontend.local
```

Par défaut (si aucune variable n'est définie) le serveur autorise toutes les origines pour faciliter le développement.

---

## Démarrage

### Backend (API)

Lancer le serveur en développement/production depuis la racine :

```bash
# installez les dépendances à la racine puis démarrez le serveur
npm install
npm start
# (le script 'start' exécute `node src/server.js`)
```

Si vous souhaitez un redémarrage automatique en développement, installez `nodemon` et ajoutez un script `dev` dans `package.json` :

```bash
# exemple (optionnel) :
npm i -D nodemon
# puis dans package.json ajouter "dev": "nodemon src/server.js"
# et lancer :
npm run dev
```

### Frontend (client - Vite)

Le frontend se trouve dans le dossier `client` et utilise Vite. Pour lancer le serveur de développement :

```bash
cd client
npm install
npm run dev
```

Pour construire le frontend :

```bash
cd client
npm run build
```

Pour prévisualiser le build :

```bash
cd client
npm run preview
```


---

## Déploiement avec Docker

Ce projet est entièrement conteneurisé. Vous pouvez lancer toute la stack (Frontend + Backend + Bases de données) d'un seul coup.

### Prérequis
- [Docker](https://www.docker.com/products/docker-desktop) installé.

### Architecture

```mermaid
graph TD
    User((Utilisateur))
    Client[Conteneur Frontend\n(Nginx + React)\nPort 8080]
    Backend[Conteneur Backend\n(Node.js API)\nPort 3000]
    Postgres[(Conteneur PostgreSQL)]
    Mongo[(Conteneur MongoDB)]
    
    User -->|HTTP| Client
    Client -->|HTTP / API| Backend
    Backend -->|TCP 5432| Postgres
    Backend -->|TCP 27017| Mongo
```

### Lancement rapide

1. **Construire et démarrer les conteneurs** :
   ```bash
   docker-compose up --build
   ```

2. **Accéder à l'application** :
   - **Frontend** : http://localhost:8080
   - **Backend API** : http://localhost:3000
   - **Documentation API** : http://localhost:3000/api-docs

## Structure du projet

Arborescence adaptée au dépôt actuel (backend + frontend séparés) :

```
package.json               # scripts & dépendances backend
README.md                  # documentation (ce fichier)
client/                    # frontend React + Vite
	├─ package.json          # scripts & dépendances front (vite)
	└─ src/                  # code source frontend (React)
scripts/                   # utilitaires et scripts (CSV, conversion...)
src/                       # code backend (API)
	├─ app.js                # configuration de l'app Express (optionnel)
	├─ server.js             # point d'entrée (démarrage du serveur)
	├─ controllers/          # logique des endpoints (auth, restaurants...)
	├─ db/                   # connexions BDD (Postgres / Mongo)
	├─ middlewares/          # middlewares (auth, rate limiter, CORS...)
	├─ models/               # modèles (SQL / NoSQL)
	└─ routes/               # définition des routes
db/                        # fichiers SQL init / structure-bdd
structure-bdd/             # scripts / dump SQL pour la BDD
tests/                     # tests Jest / Supertest
.env                       # fichier d'exemple (à créer localement)
```

Notes :
- Le frontend est contenu dans le dossier `client` et utilise Vite. Lancer le dev server depuis `client` (`npm run dev`).
- Le backend se situe à la racine dans `src/` et se lance avec `npm start` (ou `npm run dev` si vous ajoutez `nodemon`).
On a donc besoin de deux terminal d'ouvert pour pouvoir lancer l'api

---

## Documentation

La documentation Swagger est générée automatiquement et disponible sur :

```
http://localhost:3000/api-docs
```

---

## Tests

Les tests sont écrits avec Jest et Supertest.
Pour lancer les tests :

```bash
npm test
```

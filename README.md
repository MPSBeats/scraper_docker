# Restaurant API - Ile-de-France

## Introduction

Cette API REST recense les restaurants en Ile-de-France depuis un CSV, avec options de filtrage, recherche et historique des utilisateurs. Elle utilise une architecture REST + MVC + POO, et est securisee avec JWT, rate limiting et CORS.

---

## Installation

### 1. Cloner le projet

```bash
git clone https://github.com/MPSBeats/scraper_docker.git
cd scraper_docker
```

### 2. Installer les dependances

```bash
npm init -y

npm i express dotenv cors
npm i swagger-ui-express swagger-jsdoc
npm i pg mongoose mongodb-memory-server
npm i -D jest supertest cross-env
npm i bcrypt jsonwebtoken express-rate-limit
npm install swagger-ui-express js-yaml
```

Pour installer toutes les dependances du projet :

```bash
# A la racine (backend)
npm install

# Installer aussi les dependances du front-end (client) qui utilise Vite
cd client
npm install
```

Remarque : le client utilise `vite` (installe dans `client/devDependencies`). Lancer `npm run dev` doit etre execute depuis le dossier `client`.

---

## Configuration

Creer un fichier `.env` a la racine du projet et definir vos variables d'environnement, par exemple :

```
PORT=3000
DATABASE_URL=postgresql://postgres:votre_mot_de_passe@127.0.0.1:5432/orium_agence_scrapper_sql
MONGO_URI=mongodb://127.0.0.1:27017/orium_agence_scrapper_nosql
JWT_SECRET=ton_secret_jwt_key
```

Rate limiting: le projet utilise `express-rate-limit`. La configuration par defaut se trouve dans `src/middlewares/rateLimiter.js` (fenetre 5 minutes, 100 requetes). Vous pouvez modifier ces valeurs ou creer des limiteurs specifiques via la factory `createLimiter` exportee par ce fichier.

CORS: Le projet utilise `cors` pour gerer les origines autorisees. Vous pouvez configurer le comportement via ces variables d'environnement dans votre `.env`:

```
# Autoriser toutes les origines (utile en dev)
CORS_ALLOW_ALL=true

# Ou limiter aux origines listees (CSV)
CORS_ALLOWED_ORIGINS=https://example.com,https://frontend.local
```

Par defaut (si aucune variable n'est definie) le serveur autorise toutes les origines pour faciliter le developpement.

---

## Demarrage

### Backend (API)

Lancer le serveur en developpement/production depuis la racine :

```bash
# Installez les dependances a la racine puis demarrez le serveur
npm install
npm start
# (le script 'start' execute `node src/server.js`)
```

Si vous souhaitez un redemarrage automatique en developpement, installez `nodemon` et ajoutez un script `dev` dans `package.json` :

```bash
# Exemple (optionnel) :
npm i -D nodemon
# Puis dans package.json ajouter "dev": "nodemon src/server.js"
# Et lancer :
npm run dev
```

### Frontend (client - Vite)

Le frontend se trouve dans le dossier `client` et utilise Vite. Pour lancer le serveur de developpement :

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

Pour previsualiser le build :

```bash
cd client
npm run preview
```

---

## Deploiement avec Docker

Ce projet est entierement conteneurise. Vous pouvez lancer toute la stack (Frontend + Backend + Bases de donnees) d'un seul coup.

### Prerequis

- [Docker](https://www.docker.com/products/docker-desktop) installe

### Architecture

```mermaid
graph TD
    User((Utilisateur))
    Client["Conteneur Frontend<br>(Nginx + React)<br>Port 8080"]
    Backend["Conteneur Backend<br>(Node.js API)<br>Port 3000"]
    Postgres[("Conteneur PostgreSQL")]
    Mongo[("Conteneur MongoDB")]
    
    User -->|HTTP| Client
    Client -->|HTTP / API| Backend
    Backend -->|TCP 5432| Postgres
    Backend -->|TCP 27017| Mongo
```

### Lancement rapide

1. Construire et demarrer les conteneurs :

```bash
docker-compose up --build
```

2. Acceder a l'application :
   - Frontend: http://localhost:8080
   - Backend API: http://localhost:3000
   - Documentation API: http://localhost:3000/api-docs

---

## Deploiement avec Kubernetes

Ce projet peut egalement etre deploye sur Kubernetes pour beneficier de l'orchestration, du scaling automatique et de la haute disponibilite.

### Architecture Kubernetes

```mermaid
graph TB
    User((Utilisateur))
    Ingress[Ingress Controller<br/>nginx]
    FrontSvc[Service Frontend<br/>ClusterIP]
    BackSvc[Service Backend<br/>ClusterIP]
    FrontPod[Frontend Pods<br/>Nginx + React]
    BackPod[Backend Pods<br/>Node.js API<br/>HPA: 2-10 replicas]
    PgSts[(PostgreSQL<br/>StatefulSet + PVC)]
    MongoSts[(MongoDB<br/>StatefulSet + PVC)]
    
    User -->|HTTP/HTTPS| Ingress
    Ingress -->|/| FrontSvc
    Ingress -->|/api| BackSvc
    FrontSvc --> FrontPod
    BackSvc --> BackPod
    BackPod --> PgSts
    BackPod --> MongoSts
```

### Fonctionnalites Kubernetes implementees

- Ingress : Exposition externe via nginx-ingress
- ConfigMaps & Secrets : Gestion de la configuration
- PersistentVolumeClaims : Persistance des donnees PostgreSQL et MongoDB
- StatefulSets : Deploiement des bases de donnees avec identite stable
- HorizontalPodAutoscaler : Auto-scaling base sur CPU/Memory (2-10 replicas)
- Rolling Updates : Deploiement sans interruption de service
- Health Probes : Liveness et Readiness checks sur `/health`
- Self-Healing : Redemarrage automatique des pods defaillants

### Deploiement rapide

```bash
# Prerequis : cluster Kubernetes, kubectl, ingress-controller, metrics-server
cd k8s

# Construire les images Docker
docker build -t orium_backend:latest ..
docker build -t orium_frontend:latest ../client

# Deployer sur Kubernetes
./deploy.sh  # Linux/macOS
# ou
.\deploy.ps1  # Windows PowerShell

# Acces : http://restaurant-api.local (apres configuration du fichier hosts)
```

### Documentation Kubernetes complete

Pour plus de details sur le deploiement Kubernetes :

- [Guide de deploiement rapide](k8s/DEPLOY-GUIDE.md) : Instructions pas-a-pas
- [Documentation complete](k8s/README.md) : Reponses aux questions du projet
  - Diagramme du fonctionnement interne de Kubernetes
  - Observations des rolling updates
  - Commandes de scaling manuel et automatique
  - Tests d'auto-scaling avec `hey`
  - Configuration des health probes
  - Differences liveness vs readiness

### Tests et Monitoring

```bash
# Voir l'etat du cluster
kubectl get all -n restaurant-api

# Observer le HPA
kubectl get hpa -n restaurant-api

# Logs du backend
kubectl logs -f deployment/backend-deployment -n restaurant-api

# Tester le rolling update
./k8s/test-rolling-update.sh

# Tester l'auto-scaling
./k8s/test-autoscaling.sh
```

---

## Structure du projet

Arborescence adaptee au depot actuel (backend + frontend separes) :

```
package.json               # scripts & dependances backend
README.md                  # documentation (ce fichier)
client/                    # frontend React + Vite
  |- package.json          # scripts & dependances front (vite)
  |- src/                  # code source frontend (React)
scripts/                   # utilitaires et scripts (CSV, conversion...)
src/                       # code backend (API)
  |- app.js                # configuration de l'app Express (optionnel)
  |- server.js             # point d'entree (demarrage du serveur)
  |- controllers/          # logique des endpoints (auth, restaurants...)
  |- db/                   # connexions BDD (Postgres / Mongo)
  |- middlewares/          # middlewares (auth, rate limiter, CORS...)
  |- models/               # modeles (SQL / NoSQL)
  |- routes/               # definition des routes
db/                        # fichiers SQL init / structure-bdd
structure-bdd/             # scripts / dump SQL pour la BDD
tests/                     # tests Jest / Supertest
.env                       # fichier d'exemple (a creer localement)
```

Notes :
- Le frontend est contenu dans le dossier `client` et utilise Vite. Lancer le dev server depuis `client` (`npm run dev`)
- Le backend se situe a la racine dans `src/` et se lance avec `npm start` (ou `npm run dev` si vous ajoutez `nodemon`)
- On a donc besoin de deux terminaux ouverts pour pouvoir lancer l'API

---

## Documentation

La documentation Swagger est generee automatiquement et disponible sur :

```
http://localhost:3000/api-docs
```

---

## Tests

Les tests sont ecrits avec Jest et Supertest.
Pour lancer les tests :

```bash
npm test
```

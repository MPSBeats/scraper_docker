# Node.js
FROM node:22-alpine

# Répertoire de travail
WORKDIR /app

# Copie des fichiers de dépendances
COPY package*.json ./

# Installation des dépendances
RUN npm install

# Copie du reste du code source
COPY . .

# Port de l'API
EXPOSE 3000

# Démarrage
CMD ["npm", "start"]

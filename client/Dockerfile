# Build de l'application React
FROM node:22-alpine as builder

WORKDIR /app

# Copie des dépendances
COPY package*.json ./
RUN npm install

# Copie du code source et build
COPY . .
RUN npm run build

# Serveur Nginx
FROM nginx:alpine

# Copie des fichiers buildés
COPY --from=builder /app/dist /usr/share/nginx/html

# Copie de la configuration Nginx personnalisée
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Exposition du port 80
EXPOSE 80

# Démarrage de Nginx
CMD ["nginx", "-g", "daemon off;"]

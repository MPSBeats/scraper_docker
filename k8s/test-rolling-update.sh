#!/bin/bash
# Script pour tester le rolling update du backend

echo "========================================="
echo "Test Rolling Update - Backend"
echo "========================================="
echo ""

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}[INFO]${NC} Ce script va :"
echo "  1. Observer l'état actuel des pods"
echo "  2. Déclencher un rolling update (changement d'image)"
echo "  3. Observer le processus de rolling update"
echo ""

echo -e "${YELLOW}[ATTENTION]${NC} Assurez-vous d'avoir une nouvelle version de l'image backend"
echo "             (ex: orium_backend:v2)"
echo ""

# Afficher l'état actuel
echo "État actuel des pods backend :"
kubectl get pods -n restaurant-api -l app=backend

echo ""
read -p "Appuyez sur Entrée pour déclencher le rolling update..."

# Lancer le rolling update en arrière-plan
echo ""
echo -e "${GREEN}[DÉMARRAGE]${NC} Rolling update en cours..."
echo ""

# Observer les pods en temps réel
kubectl get pods -n restaurant-api -l app=backend -w &
WATCH_PID=$!

# Dans un autre processus, déclencher l'update
sleep 2
kubectl set image deployment/backend-deployment backend=orium_backend:v2 -n restaurant-api

# Attendre que le rollout soit complet
echo ""
echo "Attente de la fin du rolling update..."
kubectl rollout status deployment/backend-deployment -n restaurant-api

# Arrêter le watch
kill $WATCH_PID 2>/dev/null

echo ""
echo -e "${GREEN}[TERMINÉ]${NC} Rolling update terminé !"
echo ""

# Afficher l'historique
echo "Historique des déploiements :"
kubectl rollout history deployment/backend-deployment -n restaurant-api

echo ""
echo "État final des pods :"
kubectl get pods -n restaurant-api -l app=backend

echo ""
echo "Pour revenir à la version précédente :"
echo "  kubectl rollout undo deployment/backend-deployment -n restaurant-api"
echo ""

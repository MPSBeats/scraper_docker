#!/bin/bash
# Script pour tester l'auto-scaling avec génération de charge

echo "========================================="
echo "Test Auto-Scaling - Backend"
echo "========================================="
echo ""

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Vérifier que hey est installé
if ! command -v hey &> /dev/null; then
    echo -e "${RED}[ERREUR]${NC} L'outil 'hey' n'est pas installé."
    echo ""
    echo "Installation :"
    echo "  - macOS: brew install hey"
    echo "  - Linux: wget https://hey-release.s3.us-east-2.amazonaws.com/hey_linux_amd64"
    echo "  - Windows: choco install hey"
    echo "  - Go: go install github.com/rakyll/hey@latest"
    echo ""
    exit 1
fi

# Obtenir l'URL de l'Ingress
echo -e "${GREEN}[INFO]${NC} Obtention de l'URL de l'Ingress..."
INGRESS_IP=$(kubectl get ingress restaurant-ingress -n restaurant-api -o jsonpath='{.status.loadBalancer.ingress[0].ip}')

if [ -z "$INGRESS_IP" ]; then
    # Essayer avec minikube
    INGRESS_IP=$(minikube ip 2>/dev/null)
fi

if [ -z "$INGRESS_IP" ]; then
    echo -e "${YELLOW}[ATTENTION]${NC} Impossible d'obtenir l'IP automatiquement."
    echo "Veuillez entrer l'URL de votre application :"
    read -p "URL (ex: http://restaurant-api.local): " APP_URL
else
    APP_URL="http://$INGRESS_IP"
fi

echo ""
echo -e "${GREEN}[INFO]${NC} URL cible : $APP_URL/api/restaurants"
echo ""

# Afficher l'état initial
echo "État initial du HPA :"
kubectl get hpa -n restaurant-api

echo ""
echo "État initial des pods backend :"
kubectl get pods -n restaurant-api -l app=backend

echo ""
read -p "Appuyez sur Entrée pour lancer le test de charge..."

# Lancer le watch du HPA en arrière-plan
echo ""
echo -e "${GREEN}[DÉMARRAGE]${NC} Observation du HPA et des pods..."
echo ""

# Terminal 1 : Observer HPA
kubectl get hpa -n restaurant-api -w &
HPA_PID=$!

# Terminal 2 : Observer pods
kubectl get pods -n restaurant-api -l app=backend -w &
PODS_PID=$!

# Attendre un peu pour voir l'état initial
sleep 3

# Terminal 3 : Générer la charge
echo ""
echo -e "${YELLOW}[CHARGE]${NC} Génération de charge pendant 2 minutes..."
echo "  - 50 connexions concurrentes"
echo "  - 10 requêtes/seconde par worker"
echo ""

hey -z 2m -c 50 -q 10 "$APP_URL/api/restaurants"

# Attendre que le scaling down se fasse
echo ""
echo -e "${GREEN}[TERMINÉ]${NC} Charge terminée. Observation du scale down (5 minutes)..."
echo ""

sleep 300

# Arrêter les watch
kill $HPA_PID 2>/dev/null
kill $PODS_PID 2>/dev/null

echo ""
echo "État final du HPA :"
kubectl get hpa -n restaurant-api

echo ""
echo "État final des pods backend :"
kubectl get pods -n restaurant-api -l app=backend

echo ""
echo -e "${GREEN}[INFO]${NC} Test d'auto-scaling terminé !"
echo ""

# Afficher les événements du HPA
echo "Événements du HPA :"
kubectl describe hpa backend-hpa -n restaurant-api | grep -A 10 "Events:"
echo ""

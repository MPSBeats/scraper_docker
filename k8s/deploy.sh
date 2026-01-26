#!/bin/bash
# Script de déploiement complet de l'application Restaurant API sur Kubernetes

echo "========================================="
echo "Déploiement Restaurant API - Kubernetes"
echo "========================================="
echo ""

# Couleurs pour les messages
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Fonction pour afficher les messages
print_step() {
    echo -e "${GREEN}[ÉTAPE]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[ATTENTION]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERREUR]${NC} $1"
}

# Vérifier que kubectl est installé
if ! command -v kubectl &> /dev/null; then
    print_error "kubectl n'est pas installé. Veuillez l'installer d'abord."
    exit 1
fi

# Vérifier la connexion au cluster
print_step "Vérification de la connexion au cluster Kubernetes..."
if ! kubectl cluster-info &> /dev/null; then
    print_error "Impossible de se connecter au cluster Kubernetes."
    print_warning "Assurez-vous que votre cluster est démarré (minikube start, kind, etc.)"
    exit 1
fi

echo ""
print_step "1/9 - Création du namespace restaurant-api..."
kubectl apply -f namespace.yaml

echo ""
print_step "2/9 - Configuration des Secrets et ConfigMaps..."
kubectl apply -f secrets.yaml
kubectl apply -f configmap.yaml

echo ""
print_step "3/9 - Déploiement de PostgreSQL..."
kubectl apply -f postgres-pvc.yaml
kubectl apply -f postgres-statefulset.yaml
kubectl apply -f postgres-service.yaml

echo ""
print_step "4/9 - Déploiement de MongoDB..."
kubectl apply -f mongo-pvc.yaml
kubectl apply -f mongo-statefulset.yaml
kubectl apply -f mongo-service.yaml

echo ""
print_step "5/9 - Attente que les bases de données soient prêtes..."
echo "   → Attente PostgreSQL..."
kubectl wait --for=condition=ready pod -l app=postgres -n restaurant-api --timeout=300s
echo "   → Attente MongoDB..."
kubectl wait --for=condition=ready pod -l app=mongo -n restaurant-api --timeout=300s

echo ""
print_step "6/9 - Déploiement du Backend..."
kubectl apply -f backend-deployment.yaml
kubectl apply -f backend-service.yaml
kubectl apply -f backend-hpa.yaml

echo ""
print_step "7/9 - Déploiement du Frontend..."
kubectl apply -f frontend-deployment.yaml
kubectl apply -f frontend-service.yaml

echo ""
print_step "8/9 - Configuration de l'Ingress..."
kubectl apply -f ingress.yaml

echo ""
print_step "9/9 - Vérification du déploiement..."
echo ""
kubectl get all -n restaurant-api

echo ""
echo "========================================="
echo -e "${GREEN}Déploiement terminé avec succès !${NC}"
echo "========================================="
echo ""

# Obtenir l'IP de l'Ingress
echo "Pour accéder à l'application :"
echo ""
echo "1. Obtenir l'IP de l'Ingress :"
echo "   kubectl get ingress -n restaurant-api"
echo ""
echo "2. Ajouter dans votre fichier hosts :"
echo "   - Windows: C:\\Windows\\System32\\drivers\\etc\\hosts"
echo "   - Linux/Mac: /etc/hosts"
echo ""
echo "   <INGRESS-IP> restaurant-api.local"
echo ""
echo "3. Accéder à l'application :"
echo "   - Frontend: http://restaurant-api.local"
echo "   - Backend API: http://restaurant-api.local/api"
echo "   - Swagger: http://restaurant-api.local/api-docs"
echo ""
echo "Pour minikube, obtenir l'IP avec : minikube ip"
echo ""

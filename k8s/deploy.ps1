# Script de déploiement complet de l'application Restaurant API sur Kubernetes
# PowerShell version

Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "Déploiement Restaurant API - Kubernetes" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""

function Print-Step {
    param($message)
    Write-Host "[ÉTAPE] " -ForegroundColor Green -NoNewline
    Write-Host $message
}

function Print-Warning {
    param($message)
    Write-Host "[ATTENTION] " -ForegroundColor Yellow -NoNewline
    Write-Host $message
}

function Print-Error {
    param($message)
    Write-Host "[ERREUR] " -ForegroundColor Red -NoNewline
    Write-Host $message
}

# Vérifier que kubectl est installé
if (-not (Get-Command kubectl -ErrorAction SilentlyContinue)) {
    Print-Error "kubectl n'est pas installé. Veuillez l'installer d'abord."
    exit 1
}

# Vérifier la connexion au cluster
Print-Step "Vérification de la connexion au cluster Kubernetes..."
try {
    kubectl cluster-info | Out-Null
} catch {
    Print-Error "Impossible de se connecter au cluster Kubernetes."
    Print-Warning "Assurez-vous que votre cluster est démarré (Docker Desktop Kubernetes, minikube, etc.)"
    exit 1
}

Write-Host ""
Print-Step "1/9 - Création du namespace restaurant-api..."
kubectl apply -f namespace.yaml

Write-Host ""
Print-Step "2/9 - Configuration des Secrets et ConfigMaps..."
kubectl apply -f secrets.yaml
kubectl apply -f configmap.yaml

Write-Host ""
Print-Step "3/9 - Déploiement de PostgreSQL..."
kubectl apply -f postgres-pvc.yaml
kubectl apply -f postgres-statefulset.yaml
kubectl apply -f postgres-service.yaml

Write-Host ""
Print-Step "4/9 - Déploiement de MongoDB..."
kubectl apply -f mongo-pvc.yaml
kubectl apply -f mongo-statefulset.yaml
kubectl apply -f mongo-service.yaml

Write-Host ""
Print-Step "5/9 - Attente que les bases de données soient prêtes..."
Write-Host "   → Attente PostgreSQL..."
kubectl wait --for=condition=ready pod -l app=postgres -n restaurant-api --timeout=300s
Write-Host "   → Attente MongoDB..."
kubectl wait --for=condition=ready pod -l app=mongo -n restaurant-api --timeout=300s

Write-Host ""
Print-Step "6/9 - Déploiement du Backend..."
kubectl apply -f backend-deployment.yaml
kubectl apply -f backend-service.yaml
kubectl apply -f backend-hpa.yaml

Write-Host ""
Print-Step "7/9 - Déploiement du Frontend..."
kubectl apply -f frontend-deployment.yaml
kubectl apply -f frontend-service.yaml

Write-Host ""
Print-Step "8/9 - Configuration de l'Ingress..."
kubectl apply -f ingress.yaml

Write-Host ""
Print-Step "9/9 - Vérification du déploiement..."
Write-Host ""
kubectl get all -n restaurant-api

Write-Host ""
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "Déploiement terminé avec succès !" -ForegroundColor Green
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Pour accéder à l'application :" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. Obtenir l'IP de l'Ingress :"
Write-Host "   kubectl get ingress -n restaurant-api"
Write-Host ""
Write-Host "2. Ajouter dans C:\Windows\System32\drivers\etc\hosts :"
Write-Host "   <INGRESS-IP> restaurant-api.local"
Write-Host ""
Write-Host "3. Accéder à l'application :"
Write-Host "   - Frontend: http://restaurant-api.local"
Write-Host "   - Backend API: http://restaurant-api.local/api"
Write-Host "   - Swagger: http://restaurant-api.local/api-docs"
Write-Host ""

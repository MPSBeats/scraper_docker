# Guide de Deploiement Rapide - Kubernetes

## Prerequis

**Cluster Kubernetes fonctionnel**
- Minikube : `minikube start`
- Docker Desktop : Activer Kubernetes dans les parametres
- Kind : `kind create cluster`

**kubectl installe et configure**
```bash
kubectl version --client
kubectl cluster-info
```

**Ingress Controller (nginx)**
```bash
# Pour Kubernetes standard
kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/controller-v1.8.2/deploy/static/provider/cloud/deploy.yaml

# Pour minikube
minikube addons enable ingress
```

**Metrics Server (pour HPA)**
```bash
# Pour Kubernetes standard
kubectl apply -f https://github.com/kubernetes-sigs/metrics-server/releases/latest/download/components.yaml

# Pour minikube
minikube addons enable metrics-server
```

---

## Deploiement Rapide

### Option 1 : Script automatique (recommande)

**Windows (PowerShell) :**
```powershell
cd k8s
.\deploy.ps1
```

**Linux/macOS :**
```bash
cd k8s
chmod +x deploy.sh
./deploy.sh
```

### Option 2 : Deploiement manuel

```bash
cd k8s

# 1. Namespace et configuration
kubectl apply -f namespace.yaml
kubectl apply -f secrets.yaml
kubectl apply -f configmap.yaml

# 2. Bases de donnees
kubectl apply -f postgres-pvc.yaml
kubectl apply -f postgres-statefulset.yaml
kubectl apply -f postgres-service.yaml

kubectl apply -f mongo-pvc.yaml
kubectl apply -f mongo-statefulset.yaml
kubectl apply -f mongo-service.yaml

# Attendre que les bases soient pretes
kubectl wait --for=condition=ready pod -l app=postgres -n restaurant-api --timeout=300s
kubectl wait --for=condition=ready pod -l app=mongo -n restaurant-api --timeout=300s

# 3. Application
kubectl apply -f backend-deployment.yaml
kubectl apply -f backend-service.yaml
kubectl apply -f backend-hpa.yaml

kubectl apply -f frontend-deployment.yaml
kubectl apply -f frontend-service.yaml

# 4. Ingress
kubectl apply -f ingress.yaml
```

---

## Construction des Images Docker

Avant de deployer, vous devez construire les images Docker :

```bash
# Dans le repertoire racine du projet

# Backend
docker build -t orium_backend:latest .

# Frontend
cd client
docker build -t orium_frontend:latest .
cd ..
```

**Pour minikube**, utilisez le daemon Docker de minikube :
```bash
eval $(minikube docker-env)
docker build -t orium_backend:latest .
cd client && docker build -t orium_frontend:latest . && cd ..
```

---

## Acceder a l'Application

### 1. Obtenir l'IP de l'Ingress

```bash
kubectl get ingress -n restaurant-api

# Ou pour minikube
minikube ip
```

### 2. Configurer le fichier hosts

**Windows** : `C:\Windows\System32\drivers\etc\hosts`  
**Linux/Mac** : `/etc/hosts`

Ajouter la ligne :
```
<INGRESS-IP> restaurant-api.local
```

### 3. Acces aux services

- Frontend : http://restaurant-api.local
- Backend API : http://restaurant-api.local/api
- Documentation : http://restaurant-api.local/api-docs
- Health Check : http://restaurant-api.local/health

---

## Verification

```bash
# Voir tous les pods
kubectl get pods -n restaurant-api

# Voir tous les services
kubectl get svc -n restaurant-api

# Voir l'Ingress
kubectl get ingress -n restaurant-api

# Voir le HPA
kubectl get hpa -n restaurant-api

# Logs du backend
kubectl logs -f deployment/backend-deployment -n restaurant-api
```

---

## Tests

### Test Rolling Update

```bash
chmod +x test-rolling-update.sh
./test-rolling-update.sh
```

### Test Auto-Scaling

```bash
# Installer hey d'abord (voir k8s/README.md)
chmod +x test-autoscaling.sh
./test-autoscaling.sh
```

---

## Nettoyage

```bash
# Supprimer tout le namespace (efface tout)
kubectl delete namespace restaurant-api

# Ou supprimer ressource par ressource
kubectl delete -f k8s/
```

---

## Depannage

### Les pods ne demarrent pas
```bash
kubectl describe pod <pod-name> -n restaurant-api
kubectl logs <pod-name> -n restaurant-api
```

### L'Ingress ne fonctionne pas
```bash
# Verifier que l'Ingress Controller est installe
kubectl get pods -n ingress-nginx

# Pour minikube, utiliser le tunnel
minikube tunnel
```

### Metrics Server ne fonctionne pas
```bash
# Pour minikube avec Docker Desktop
minikube start --extra-config=kubelet.housekeeping-interval=10s
```

### Les images ne sont pas trouvees
```bash
# S'assurer que imagePullPolicy est IfNotPresent
# Pour minikube, utiliser le daemon Docker de minikube
eval $(minikube docker-env)
# Puis reconstruire les images
```

---

Pour plus de details, voir [k8s/README.md](README.md)

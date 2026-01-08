# Bilan TD : Limites de Docker et Docker Compose

## 2. Limites face à une panne de service
- **Redémarrage automatique ?**
  - Avec `docker stop` : Non (arrêt volontaire).
  - Avec `docker kill` : Non, sauf si une politique `restart: always` ou `unless-stopped` est définie. Par défaut (`no`), le conteneur reste arrêté (Exited).
- **État fonctionnel ?**
  - Si le backend est coupé, le frontend affiche des erreurs (ou charge indéfiniment si pas de timeout), l'application est inutilisable.
- **Détection de panne ?**
  - Docker détecte la fin du processus (PID 1), mais ne "monitor" pas la santé applicative sans `healthcheck`. Docker Compose ne relance pas automatiquement les dépendances coupées.
- **Intervention humaine ?**
  - Oui, nécessaire pour relancer le service (`docker start`) ou diagnostiquer la cause.

## 3. Simulation de surcharge
- **Saturation du service ?**
  - Sans limites (`deploy.resources`), un conteneur peut consommer 100% du CPU hôte, impactant tout le système.
- **Protection des autres services ?**
  - Non garantie par défaut. Si un conteneur accapare le CPU/RAM, les autres (BDD, frontend) ralentissent voire crashent.
  - L'ajout de `cpus: '0.5'` et `memory: '512M'` a permis de cantonner la charge.
- **Adaptation automatique ?**
  - Non. Docker ne scale pas tout seul (pas d'autoscaling natif dans Compose).

## 4. Montée en charge (Scaling)
- **Répartition du trafic ?**
  - Oui, Docker utilise un DNS interne Round-Robin. Le frontend (`client`) résout `backend` vers l'une des IPs des 3 répliques tour à tour.
- **Load balancer natif ?**
  - Oui (basique, niveau L3/L4 via DNS/VIP).
- **Type de scaling ?**
  - Manuel. Il faut exécuter `docker-compose up --scale backend=3`. Pas d'autoscaling basé sur la charge.
- **Note** : Le scaling a nécessité de supprimer le mapping de port hôte fixe (`3000:3000`) pour éviter les conflits "Port already allocated".

## 5. Gestion des mises à jour
- **Coupure ?**
  - Oui. Docker Compose arrête l'ancien conteneur puis démarre le nouveau (recreate). Il y a une interruption de service (downtime).
- **Retour arrière (Rollback) ?**
  - Pas automatique. Il faut manuellement retagger l'image précédente ou checkout l'ancien code et redéployer.
- **Ordre de redémarrage ?**
  - Compose gère les dépendances (`depends_on`), mais lors d'une mise à jour d'un service feuille (backend), il le redémarre simplement.

## 6. Bilan Général des Limites
Docker Compose est excellent pour le développement et les environnements simples, mais montre ses limites en production critique :
1.  **Haute Disponibilité (HA)** : Pas de failover automatique natif complexe.
2.  **Scalabilité** : Scaling manuel uniquement.
3.  **Zero-Downtime Deployment** : Difficile à atteindre sans orchestrateur (Swarm/K8s) ou proxy externe (Blue/Green).
4.  **Monitoring** : Healthchecks présents mais actions limitées (restart uniquement).

# Gestion de la Suppression des Sandboxes

## Problème Identifié

Lors de la suppression d'une sandbox via l'interface utilisateur, le conteneur Docker correspondant restait actif dans Docker Desktop. Cela était dû à plusieurs problèmes dans le code :

### 1. Route de Suppression Utilisateur
- **Fichier** : `backend/app/api/routes/sandboxes.py` (lignes 320-360)
- **Problème** : Utilisait seulement `delete_keycloak_container()` qui ne fonctionne que pour Keycloak
- **Impact** : Les sandboxes d'autres types de logiciels IAM n'étaient pas correctement supprimées

### 2. Route de Suppression Admin
- **Fichier** : `backend/app/api/routes/admin.py` (lignes 128-141)
- **Problème** : Ne supprimait que l'enregistrement de la base de données, pas le conteneur Docker
- **Impact** : Les conteneurs restaient actifs même après suppression via l'interface admin

### 3. Service de Suppression
- **Fichier** : `backend/app/services/sandbox_service.py`
- **Problème** : Ne gérait pas la suppression des conteneurs Docker
- **Impact** : Suppression incomplète des sandboxes

## Solutions Implémentées

### 1. Amélioration du SandboxService
```python
# backend/app/services/sandbox_service.py
async def delete_sandbox(db: Session, sandbox_id: str) -> bool:
    """Supprime une sandbox et son conteneur Docker"""
    sandbox = db.query(Sandbox).filter(Sandbox.id == sandbox_id).first()
    if sandbox:
        try:
            # Supprimer le conteneur Docker
            if sandbox.container_name:
                docker_service = DockerService()
                
                # Déterminer le type de logiciel pour utiliser la bonne méthode
                if sandbox.software_type_id:
                    await docker_service.delete_iam_sandbox(sandbox.container_name)
                else:
                    await docker_service.delete_keycloak_container(sandbox.container_name)
            
            # Supprimer l'enregistrement de la base de données
            db.delete(sandbox)
            db.commit()
            return True
            
        except Exception as e:
            logger.error(f"Erreur lors de la suppression: {str(e)}")
            db.rollback()
            return False
    return False
```

### 2. Correction des Routes de Suppression
- **Route utilisateur** : Utilise maintenant la méthode générique `delete_iam_sandbox()` pour tous les types de logiciels
- **Route admin** : Utilise la nouvelle méthode asynchrone du `SandboxService`

### 3. Scripts de Nettoyage

#### Script Interactif
```bash
# scripts/cleanup_orphaned_containers.py
# Script Python avec confirmation pour nettoyer les conteneurs orphelins
```

#### Script Automatique
```bash
# scripts/force_cleanup_containers.py
# Script Python qui supprime automatiquement les conteneurs orphelins
```

#### Script Rapide (Bash)
```bash
# scripts/quick_cleanup.sh
# Script bash simple pour nettoyage rapide
./scripts/quick_cleanup.sh
```

## Utilisation

### Nettoyage Manuel
Pour nettoyer les conteneurs orphelins manuellement :

```bash
# Nettoyage rapide avec confirmation
./scripts/quick_cleanup.sh

# Nettoyage automatique (sans confirmation)
python3 scripts/force_cleanup_containers.py
```

### Suppression via Interface
Maintenant, la suppression d'une sandbox via l'interface :
1. Supprime le conteneur Docker correspondant
2. Supprime l'enregistrement de la base de données
3. Fonctionne pour tous les types de logiciels IAM

## Prévention

### Nettoyage Automatique
Le système inclut maintenant un planificateur qui nettoie automatiquement les sandboxes expirées :

```python
# backend/app/services/scheduler.py
async def _check_expired_sandboxes(self):
    """Vérifier et nettoyer les sandboxes expirées"""
    expired_sandboxes = db.query(Sandbox).filter(
        Sandbox.expires_at <= datetime.utcnow(),
        Sandbox.status == "running"
    ).all()
    
    for sandbox in expired_sandboxes:
        # Arrêter et supprimer le conteneur
        if sandbox.container_name:
            await self.docker_service.delete_keycloak_container(sandbox.container_name)
        
        # Marquer comme expirée
        sandbox.status = "expired"
```

## Vérification

Pour vérifier que tout fonctionne correctement :

1. **Créer une sandbox** via l'interface
2. **Vérifier** qu'elle apparaît dans Docker Desktop
3. **Supprimer** la sandbox via l'interface
4. **Vérifier** que le conteneur a bien été supprimé de Docker Desktop

## Commandes Utiles

```bash
# Lister tous les conteneurs IAMAAS
docker ps -a | grep iamaas-

# Voir les logs d'un conteneur
docker logs <container_name>

# Arrêter un conteneur spécifique
docker stop <container_name>

# Supprimer un conteneur spécifique
docker rm <container_name>

# Nettoyer tous les conteneurs arrêtés
docker container prune

# Nettoyer les images non utilisées
docker image prune
```

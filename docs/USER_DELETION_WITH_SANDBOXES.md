# Suppression d'Utilisateur avec Récapitulatif des Sandboxes

## Fonctionnalité Implémentée

Lors de la suppression d'un utilisateur via l'interface admin, le système affiche maintenant un récapitulatif complet de ses sandboxes et supprime automatiquement tous les conteneurs Docker associés.

## Fonctionnalités

### 🔍 **Récapitulatif des Sandboxes**
- Affichage de toutes les sandboxes appartenant à l'utilisateur
- Statut de chaque sandbox (En cours, Arrêtée, Expirée)
- Nom du conteneur Docker associé (si applicable)
- Compteur total des sandboxes

### 🗑️ **Suppression Automatique**
- Suppression de l'utilisateur de la base de données
- Suppression de toutes ses sandboxes de la base de données
- Suppression automatique des conteneurs Docker associés
- Support pour tous les types de logiciels IAM

### ⚠️ **Avertissements**
- Message d'avertissement si l'utilisateur a des sandboxes actives
- Confirmation obligatoire avant suppression
- Protection contre la suppression d'utilisateurs admin

## Implémentation Technique

### Backend

#### 1. Nouvelle Route API
```python
# backend/app/api/routes/admin.py
@router.get("/users/{user_id}/sandboxes")
async def get_user_sandboxes(user_id: str, ...):
    """Récupère les sandboxes d'un utilisateur spécifique"""
    sandboxes = SandboxService.get_sandboxes_by_user_id(db, user_id)
    return sandboxes
```

#### 2. Méthode de Suppression Améliorée
```python
# backend/app/services/user_service.py
@staticmethod
async def delete_user_with_sandboxes(db: Session, user_id: str) -> bool:
    """Supprime un utilisateur et toutes ses sandboxes"""
    # Récupérer les sandboxes
    user_sandboxes = SandboxService.get_sandboxes_by_user_id(db, user_id)
    
    # Supprimer les conteneurs Docker
    for sandbox in user_sandboxes:
        if sandbox.container_name:
            await docker_service.delete_iam_sandbox(sandbox.container_name)
    
    # Supprimer les sandboxes et l'utilisateur
    for sandbox in user_sandboxes:
        db.delete(sandbox)
    db.delete(user)
    db.commit()
```

#### 3. Réponse Détaillée
```python
@router.delete("/users/{user_id}")
async def delete_user(user_id: str, ...):
    """Supprime un utilisateur et ses sandboxes"""
    result = await UserService.delete_user_with_sandboxes(db, user_id)
    return {
        "message": "Utilisateur supprimé avec succès",
        "deleted_sandboxes_count": len(user_sandboxes),
        "deleted_sandboxes": [
            {
                "id": sandbox.id,
                "name": sandbox.name,
                "status": sandbox.status,
                "container_name": sandbox.container_name
            } for sandbox in user_sandboxes
        ]
    }
```

### Frontend

#### 1. Nouveau Composant Modal
```typescript
// frontend/src/components/UserDeleteModal.tsx
interface UserDeleteModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (deletedSandboxes: Array<{
    id: string
    name: string
    status: string
    container_name?: string
  }>) => void
  user: User | null
  isLoading?: boolean
}
```

#### 2. Service API Étendu
```typescript
// frontend/src/services/api.ts
async getUserSandboxes(userId: string): Promise<SandboxResponse[]> {
  const response = await api.get(`/api/v1/admin/users/${userId}/sandboxes`)
  return response.data
}

async deleteUserWithSandboxes(userId: string): Promise<{
  message: string
  deleted_sandboxes_count: number
  deleted_sandboxes: Array<{
    id: string
    name: string
    status: string
    container_name?: string
  }>
}> {
  const response = await api.delete(`/api/v1/admin/users/${userId}`)
  return response.data
}
```

## Interface Utilisateur

### Modal de Suppression
- **Titre** : "Supprimer l'utilisateur"
- **Description** : Avertissement sur l'irréversibilité de l'action
- **Section Sandboxes** : Liste des sandboxes avec statuts
- **Avertissement** : Message spécial si des sandboxes sont présentes
- **Boutons** : "Supprimer l'utilisateur" et "Annuler"

### Affichage des Sandboxes
```
Sandboxes de l'utilisateur (3)
├── Keycloak Test (Conteneur: iamaas-keycloak-abc123) [En cours]
├── SailPoint Demo (Conteneur: iamaas-sailpoint-def456) [Arrêtée]
└── Okta Sandbox [Expirée]

⚠️ Attention : La suppression de cet utilisateur supprimera également 
   toutes ses sandboxes (3) et leurs conteneurs Docker associés.
```

## Utilisation

### 1. Accès à la Fonctionnalité
1. Connectez-vous en tant qu'administrateur
2. Allez dans "Administration" > "Utilisateurs"
3. Trouvez l'utilisateur à supprimer
4. Cliquez sur "Supprimer"

### 2. Processus de Suppression
1. **Modal de confirmation** s'ouvre avec le récapitulatif
2. **Vérification** des sandboxes de l'utilisateur
3. **Avertissement** si des sandboxes sont présentes
4. **Confirmation** de l'utilisateur
5. **Suppression** automatique de l'utilisateur et ses sandboxes
6. **Message de succès** avec détails

### 3. Résultat
- ✅ Utilisateur supprimé de la base de données
- ✅ Toutes ses sandboxes supprimées
- ✅ Conteneurs Docker supprimés
- ✅ Message de confirmation avec compteur

## Sécurité

### Protections
- **Vérification des rôles** : Impossible de supprimer un admin
- **Auto-protection** : Impossible de se supprimer soi-même
- **Confirmation obligatoire** : Double validation requise
- **Rollback automatique** : En cas d'erreur, annulation complète

### Logs
```python
logger.info(f"Utilisateur {user.email} supprimé avec {len(user_sandboxes)} sandboxes et {deleted_containers} conteneurs")
```

## Tests

### Script de Test
```bash
# Tester la fonctionnalité
python3 scripts/test_user_deletion.py
```

### Test Manuel
1. Créer un utilisateur de test
2. Créer quelques sandboxes pour cet utilisateur
3. Tenter la suppression via l'interface
4. Vérifier le récapitulatif
5. Confirmer la suppression
6. Vérifier que tout a été supprimé

## Gestion d'Erreurs

### Erreurs Possibles
- **Utilisateur non trouvé** : 404
- **Utilisateur admin** : 400 (protection)
- **Auto-suppression** : 400 (protection)
- **Erreur Docker** : Logs d'erreur mais continuation
- **Erreur base de données** : Rollback automatique

### Messages d'Erreur
- Messages clairs et informatifs
- Détails techniques dans les logs
- Interface utilisateur non bloquée

## Maintenance

### Nettoyage
- Suppression automatique des conteneurs orphelins
- Scripts de nettoyage disponibles
- Logs détaillés pour audit

### Monitoring
- Suivi des suppressions d'utilisateurs
- Compteurs de sandboxes supprimées
- Alertes en cas d'erreur

## Évolutions Futures

### Fonctionnalités Possibles
- **Suppression en lot** : Supprimer plusieurs utilisateurs
- **Archivage** : Sauvegarder les données avant suppression
- **Notifications** : Informer les utilisateurs avant suppression
- **Historique** : Garder une trace des suppressions

# 🏗️ Infrastructure IAMAAS - Architecture Scalable

## 📋 Vue d'ensemble

L'infrastructure IAMAAS a été conçue pour être **modulaire et scalable**, permettant d'intégrer facilement de nouveaux logiciels IAM au-delà de Keycloak.

## 🏛️ Architecture

### Structure des dossiers

```
infra/
├── config/
│   ├── software_config.json      # Configuration centralisée des logiciels
│   └── ports.json               # Configuration des ports (obsolète)
├── scripts/
│   ├── iam_software_manager.py  # Gestionnaire principal modulaire
│   ├── test_software_manager.py # Version de test (sans Docker)
│   ├── create_sandbox.py        # Script Keycloak (obsolète)
│   ├── delete_sandbox.py        # Script Keycloak (obsolète)
│   └── utils.py                 # Utilitaires Docker (obsolète)
├── software/                    # Configurations spécifiques par logiciel
│   ├── keycloak/               # Configuration Keycloak
│   ├── sailpoint/              # Configuration SailPoint
│   ├── okta/                   # Configuration Okta
│   └── azure-ad/               # Configuration Azure AD
└── templates/                   # Templates de déploiement
    ├── docker/                 # Templates Docker
    ├── kubernetes/             # Templates Kubernetes
    └── terraform/              # Templates Terraform
```

## 🔧 Configuration Centralisée

### `software_config.json`

Fichier de configuration centralisé définissant tous les logiciels IAM supportés :

```json
{
  "software_types": {
    "keycloak": {
      "name": "Keycloak",
      "version": "23.0.3",
      "image": "quay.io/keycloak/keycloak:23.0.3",
      "container_prefix": "iamaas-keycloak-",
      "admin_user": "admin",
      "default_port": 8080,
      "access_url_pattern": "http://localhost:{port}/admin/master/console/",
      "supported_versions": ["20.0.5", "21.1.2", "22.0.5", "23.0.3"]
    },
    "sailpoint": {
      "name": "SailPoint IdentityIQ",
      "version": "8.4",
      "image": "sailpoint/identityiq:8.4",
      "container_prefix": "iamaas-sailpoint-",
      "admin_user": "admin",
      "default_port": 8080,
      "access_url_pattern": "http://localhost:{port}/identityiq/"
    }
  },
  "infrastructure": {
    "network": {
      "name": "iamaas-network",
      "driver": "bridge",
      "subnet": "172.20.0.0/16"
    },
    "port_range": {
      "start": 8080,
      "end": 8099,
      "max_sandboxes": 20
    }
  }
}
```

## 🚀 Gestionnaire Modulaire

### `iam_software_manager.py`

Gestionnaire principal pour créer et gérer les sandboxes IAM :

```bash
# Lister les logiciels supportés
python3 iam_software_manager.py software-list

# Créer une sandbox Keycloak
python3 iam_software_manager.py create --software-type keycloak --name "Test Keycloak" --duration 24

# Créer une sandbox SailPoint
python3 iam_software_manager.py create --software-type sailpoint --name "Test SailPoint" --duration 48

# Lister les sandboxes actives
python3 iam_software_manager.py list

# Supprimer une sandbox
python3 iam_software_manager.py delete --container-name iamaas-keycloak-abc123
```

## 🔌 Intégration Backend

### Service Docker Modulaire

Le service `DockerService` a été mis à jour pour utiliser le gestionnaire modulaire :

```python
# Créer une sandbox IAM
sandbox_info = await docker_service.create_iam_sandbox(
    software_type="keycloak",
    sandbox_id="abc123",
    name="Test Sandbox",
    duration_hours=24,
    version="23.0.3"
)

# Supprimer une sandbox
success = await docker_service.delete_iam_sandbox("iamaas-keycloak-abc123")

# Lister les sandboxes
sandboxes = await docker_service.list_iam_sandboxes()

# Récupérer les logiciels supportés
software_types = await docker_service.get_supported_software_types()
```

## 📊 Modèles de Base de Données

### Table `sandboxes` - Nouveaux champs

```sql
ALTER TABLE sandboxes ADD COLUMN container_name VARCHAR;
ALTER TABLE sandboxes ADD COLUMN port INTEGER;
ALTER TABLE sandboxes ADD COLUMN software_version VARCHAR;
ALTER TABLE sandboxes ADD COLUMN metadata JSONB;
```

### Table `software_types` - Nouveaux champs

```sql
ALTER TABLE software_types ADD COLUMN display_name VARCHAR;
ALTER TABLE software_types ADD COLUMN category VARCHAR;
ALTER TABLE software_types ADD COLUMN default_version VARCHAR;
ALTER TABLE software_types ADD COLUMN supported_versions JSONB;
ALTER TABLE software_types ADD COLUMN docker_image VARCHAR;
ALTER TABLE software_types ADD COLUMN default_port INTEGER;
ALTER TABLE software_types ADD COLUMN access_url_pattern VARCHAR;
ALTER TABLE software_types ADD COLUMN admin_username VARCHAR;
```

## 🔄 Migration

### Script de migration

```bash
# Exécuter la migration
python3 backend/migrations/add_software_support.py
```

Le script de migration :
1. Ajoute les nouveaux champs aux tables
2. Met à jour les logiciels existants
3. Crée les nouveaux logiciels IAM

## 🆕 Ajouter un Nouveau Logiciel

### 1. Ajouter la configuration

Dans `software_config.json`, ajouter une nouvelle entrée :

```json
"nouveau_logiciel": {
  "name": "Nouveau Logiciel IAM",
  "version": "1.0.0",
  "image": "nouveau/logiciel:1.0.0",
  "container_prefix": "iamaas-nouveau-",
  "admin_user": "admin",
  "default_port": 8080,
  "access_url_pattern": "http://localhost:{port}/",
  "supported_versions": ["1.0.0", "1.1.0"]
}
```

### 2. Mettre à jour la base de données

Exécuter la migration ou ajouter manuellement dans `software_types` :

```sql
INSERT INTO software_types (
  id, name, display_name, description, category,
  default_version, supported_versions, docker_image,
  default_port, access_url_pattern, admin_username
) VALUES (
  'nouveau_logiciel', 'nouveau_logiciel', 'Nouveau Logiciel IAM',
  'Description du nouveau logiciel', 'IAM',
  '1.0.0', '["1.0.0", "1.1.0"]', 'nouveau/logiciel:1.0.0',
  8080, 'http://localhost:{port}/', 'admin'
);
```

### 3. Tester

```bash
# Tester le nouveau logiciel
python3 iam_software_manager.py create --software-type nouveau_logiciel --name "Test" --duration 24
```

## 🧪 Tests

### Version de test (sans Docker)

```bash
# Tester la configuration
python3 test_software_manager.py software-list
```

## 📈 Avantages de l'Architecture

### ✅ Scalabilité
- **Modulaire** : Chaque logiciel est configuré indépendamment
- **Extensible** : Ajout facile de nouveaux logiciels
- **Centralisé** : Configuration unique pour tous les logiciels

### ✅ Maintenabilité
- **Configuration unifiée** : Un seul fichier de configuration
- **Gestionnaire unique** : Une interface pour tous les logiciels
- **Métadonnées flexibles** : Support de configurations spécifiques

### ✅ Compatibilité
- **Rétrocompatible** : Les anciens scripts Keycloak fonctionnent encore
- **Migration automatique** : Script de migration inclus
- **API unifiée** : Interface cohérente pour tous les logiciels

## 🎯 Logiciels Supportés

| Logiciel | Type | Versions | Port | URL d'accès |
|----------|------|----------|------|-------------|
| **Keycloak** | IAM | 20.0.5, 21.1.2, 22.0.5, 23.0.3 | 8080 | `/admin/master/console/` |
| **SailPoint** | IAM | 8.3, 8.4, 8.5 | 8080 | `/identityiq/` |
| **Okta** | SSO | latest | 3000 | `/` |
| **Azure AD** | SSO | latest | 3000 | `/` |

## 🚀 Prochaines Étapes

1. **Tests complets** : Valider tous les logiciels
2. **Interface utilisateur** : Adapter le frontend
3. **Monitoring** : Ajouter des métriques
4. **Sécurité** : Renforcer l'isolation
5. **Performance** : Optimiser les déploiements 
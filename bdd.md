# Architecture Base de Données et Backend - IAMAAS

## Vue d'ensemble

Cette documentation décrit l'architecture refactorisée de la base de données et du backend pour IAMAAS (Identity Access Management as a Service). L'architecture a été conçue pour être scalable, maintenable et permettre une gestion complète des utilisateurs, rôles, types de logiciels et tarifs.

## Architecture de Base de Données

### Tables Principales

#### 1. Table `users`
```sql
CREATE TABLE users (
    id VARCHAR PRIMARY KEY,
    email VARCHAR UNIQUE NOT NULL,
    name VARCHAR NOT NULL,
    hashed_password VARCHAR,
    is_active BOOLEAN DEFAULT true,
    is_verified BOOLEAN DEFAULT false,
    avatar_url VARCHAR,
    google_id VARCHAR UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE
);
```

#### 2. Table `roles`
```sql
CREATE TABLE roles (
    id VARCHAR PRIMARY KEY,
    name VARCHAR UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE
);
```

#### 3. Table de liaison `user_roles` (Many-to-Many)
```sql
CREATE TABLE user_roles (
    user_id VARCHAR REFERENCES users(id) ON DELETE CASCADE,
    role_id VARCHAR REFERENCES roles(id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, role_id)
);
```

#### 4. Table `software_types`
```sql
CREATE TABLE software_types (
    id VARCHAR PRIMARY KEY,
    name VARCHAR UNIQUE NOT NULL,
    description TEXT,
    base_price_per_hour DECIMAL(10,2) NOT NULL DEFAULT 0.0,
    is_active VARCHAR DEFAULT 'true',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE
);
```

#### 5. Table `pricing`
```sql
CREATE TABLE pricing (
    id VARCHAR PRIMARY KEY,
    software_type_id VARCHAR REFERENCES software_types(id) ON DELETE CASCADE,
    duration_hours INTEGER NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    is_active VARCHAR DEFAULT 'true',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE
);
```

#### 6. Table `sandboxes`
```sql
CREATE TABLE sandboxes (
    id VARCHAR PRIMARY KEY,
    name VARCHAR NOT NULL,
    email VARCHAR NOT NULL,
    description TEXT,
    status VARCHAR DEFAULT 'running',
    container_id VARCHAR,
    access_url VARCHAR,
    admin_username VARCHAR,
    admin_password VARCHAR,
    price DECIMAL(10,2) NOT NULL DEFAULT 0.0,
    user_id VARCHAR REFERENCES users(id) ON DELETE CASCADE,
    software_type_id VARCHAR REFERENCES software_types(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    duration_hours INTEGER NOT NULL
);
```

### Relations

- **Users ↔ Roles** : Relation many-to-many via `user_roles`
- **SoftwareType → Sandboxes** : Relation one-to-many
- **SoftwareType → Pricing** : Relation one-to-many
- **User → Sandboxes** : Relation one-to-many

## Architecture Backend

### Structure des Modèles

#### 1. Modèle User
```python
class User(Base):
    __tablename__ = "users"
    
    id = Column(String, primary_key=True, index=True)
    email = Column(String, unique=True, nullable=False, index=True)
    name = Column(String, nullable=False)
    hashed_password = Column(String, nullable=True)
    is_active = Column(Boolean, default=True)
    is_verified = Column(Boolean, default=False)
    avatar_url = Column(String, nullable=True)
    google_id = Column(String, nullable=True, unique=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relations
    roles = relationship("Role", secondary=user_roles, back_populates="users")
    sandboxes = relationship("Sandbox", back_populates="user", cascade="all, delete-orphan", lazy="dynamic")
    
    # Méthodes
    def has_role(self, role_name: str) -> bool
    def is_admin(self) -> bool
    @property
    def roles_list(self) -> List[str]
```

#### 2. Modèle Role
```python
class Role(Base):
    __tablename__ = "roles"
    
    id = Column(String, primary_key=True, index=True)
    name = Column(String, unique=True, nullable=False, index=True)
    description = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relations
    users = relationship("User", secondary="user_roles", back_populates="roles")
```

#### 3. Modèle SoftwareType
```python
class SoftwareType(Base):
    __tablename__ = "software_types"
    
    id = Column(String, primary_key=True, index=True)
    name = Column(String, unique=True, nullable=False, index=True)
    description = Column(Text, nullable=True)
    base_price_per_hour = Column(Float, nullable=False, default=0.0)
    is_active = Column(String, default="true", nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relations
    sandboxes = relationship("Sandbox", back_populates="software_type")
```

#### 4. Modèle Pricing
```python
class Pricing(Base):
    __tablename__ = "pricing"
    
    id = Column(String, primary_key=True, index=True)
    software_type_id = Column(String, ForeignKey("software_types.id"), nullable=False)
    duration_hours = Column(Integer, nullable=False)
    price = Column(Float, nullable=False)
    is_active = Column(String, default="true", nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relations
    software_type = relationship("SoftwareType")
```

#### 5. Modèle Sandbox
```python
class Sandbox(Base):
    __tablename__ = "sandboxes"
    
    id = Column(String, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    status = Column(String, default="running", nullable=False)
    container_id = Column(String, nullable=True)
    access_url = Column(String, nullable=True)
    admin_username = Column(String, nullable=True)
    admin_password = Column(String, nullable=True)
    price = Column(Float, nullable=False, default=0.0)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    software_type_id = Column(String, ForeignKey("software_types.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    expires_at = Column(DateTime(timezone=True), nullable=False)
    duration_hours = Column(Integer, nullable=False)
    
    # Relations
    user = relationship("User", back_populates="sandboxes")
    software_type = relationship("SoftwareType", back_populates="sandboxes")
```

### Services

#### 1. RoleService
- `get_all_roles()` : Récupère tous les rôles
- `get_role_by_id()` : Récupère un rôle par ID
- `get_role_by_name()` : Récupère un rôle par nom
- `create_role()` : Crée un nouveau rôle
- `update_role()` : Met à jour un rôle
- `delete_role()` : Supprime un rôle
- `get_or_create_admin_role()` : Crée ou récupère le rôle admin
- `get_or_create_customer_role()` : Crée ou récupère le rôle customer

#### 2. SoftwareTypeService
- `get_all_software_types()` : Récupère tous les types de logiciels
- `get_active_software_types()` : Récupère les types actifs
- `get_software_type_by_id()` : Récupère un type par ID
- `get_software_type_by_name()` : Récupère un type par nom
- `create_software_type()` : Crée un nouveau type
- `update_software_type()` : Met à jour un type
- `delete_software_type()` : Supprime un type
- `get_or_create_keycloak_software_type()` : Crée ou récupère le type Keycloak

#### 3. PricingService
- `get_all_pricing()` : Récupère tous les tarifs
- `get_active_pricing()` : Récupère les tarifs actifs
- `get_pricing_by_id()` : Récupère un tarif par ID
- `get_pricing_by_software_type()` : Récupère les tarifs par type
- `create_pricing()` : Crée un nouveau tarif
- `update_pricing()` : Met à jour un tarif
- `delete_pricing()` : Supprime un tarif
- `calculate_price()` : Calcule le prix pour un type et une durée
- `create_default_pricing_for_keycloak()` : Crée les tarifs par défaut pour Keycloak

#### 4. UserService
- `get_all_users()` : Récupère tous les utilisateurs
- `get_user_by_id()` : Récupère un utilisateur par ID
- `get_user_by_email()` : Récupère un utilisateur par email
- `create_user()` : Crée un nouvel utilisateur
- `update_user()` : Met à jour un utilisateur
- `delete_user()` : Supprime un utilisateur
- `add_role_to_user()` : Ajoute un rôle à un utilisateur
- `remove_role_from_user()` : Supprime un rôle d'un utilisateur
- `create_admin_user()` : Crée l'utilisateur admin par défaut

### API Routes

#### Routes d'Authentification (`/api/v1/auth/`)
- `POST /login` : Connexion utilisateur
- `POST /register` : Inscription utilisateur
- `POST /google` : Connexion Google (simulée)
- `GET /me` : Informations utilisateur courant
- `PUT /profile` : Mise à jour du profil
- `DELETE /profile` : Suppression du compte

#### Routes d'Administration (`/api/v1/admin/`)

**Gestion des Utilisateurs**
- `GET /users` : Liste des utilisateurs
- `GET /users/{user_id}` : Détails d'un utilisateur
- `PUT /users/{user_id}` : Mise à jour d'un utilisateur
- `DELETE /users/{user_id}` : Suppression d'un utilisateur
- `POST /users/{user_id}/roles` : Ajouter un rôle
- `DELETE /users/{user_id}/roles/{role_name}` : Supprimer un rôle

**Gestion des Rôles**
- `GET /roles` : Liste des rôles
- `GET /roles/{role_id}` : Détails d'un rôle
- `POST /roles` : Créer un rôle
- `PUT /roles/{role_id}` : Mettre à jour un rôle
- `DELETE /roles/{role_id}` : Supprimer un rôle

**Gestion des Types de Logiciels**
- `GET /software-types` : Liste des types
- `GET /software-types/active` : Types actifs
- `GET /software-types/{type_id}` : Détails d'un type
- `POST /software-types` : Créer un type
- `PUT /software-types/{type_id}` : Mettre à jour un type
- `DELETE /software-types/{type_id}` : Supprimer un type

**Gestion des Tarifs**
- `GET /pricing` : Liste des tarifs
- `GET /pricing/active` : Tarifs actifs
- `GET /pricing/{pricing_id}` : Détails d'un tarif
- `GET /pricing/software-type/{software_type_id}` : Tarifs par type
- `POST /pricing` : Créer un tarif
- `PUT /pricing/{pricing_id}` : Mettre à jour un tarif
- `DELETE /pricing/{pricing_id}` : Supprimer un tarif
- `POST /pricing/calculate` : Calculer un prix

#### Routes des Sandboxes (`/api/v1/sandboxes/`)
- `GET /` : Liste des sandboxes
- `POST /` : Créer une sandbox
- `GET /{sandbox_id}` : Détails d'une sandbox
- `PUT /{sandbox_id}` : Mettre à jour une sandbox
- `DELETE /{sandbox_id}` : Supprimer une sandbox

### Sécurité

#### Authentification JWT
- Tokens avec expiration de 30 jours
- Vérification automatique des tokens
- Gestion des erreurs 401

#### Autorisation par Rôles
- Middleware `require_role()` pour vérifier les rôles
- Middleware `get_current_admin_user()` pour les routes admin
- Protection de l'utilisateur admin par défaut

#### Protection des Données
- Hachage des mots de passe avec bcrypt
- Validation des données avec Pydantic
- Gestion des erreurs centralisée

### Initialisation

#### Script d'Initialisation (`init_database.py`)
1. **Création des rôles par défaut**
   - Rôle "admin" : Administrateur du système
   - Rôle "customer" : Client utilisateur

2. **Création des types de logiciels par défaut**
   - Type "keycloak" : Serveur d'authentification Keycloak (5€/h)

3. **Création des tarifs par défaut pour Keycloak**
   - 1 heure : 5€
   - 2 heures : 9€
   - 4 heures : 17€
   - 8 heures : 32€
   - 24 heures : 90€

4. **Création de l'utilisateur admin par défaut**
   - Email : admin@admin.fr
   - Mot de passe : admin
   - Rôles : admin, customer

### Interface d'Administration

#### Composants Frontend
- **RoleManagement** : Gestion des rôles (CRUD)
- **SoftwareTypeManagement** : Gestion des types de logiciels (CRUD)
- **PricingManagement** : Gestion des tarifs (CRUD)
- **UserManagement** : Gestion des utilisateurs avec rôles multiples

#### Fonctionnalités
- **CRUD complet** pour toutes les entités
- **Interface responsive** avec thème sombre/clair
- **Validation en temps réel** des formulaires
- **Gestion des erreurs** avec messages utilisateur
- **Protection de l'admin** : impossibilité de supprimer l'utilisateur admin

### Calcul des Prix

#### Logique de Calcul
1. Recherche du tarif spécifique pour le type et la durée
2. Si trouvé, utilisation du prix défini
3. Sinon, calcul basé sur le prix de base par heure
4. Application de réductions pour les durées longues

#### Exemple de Calcul
- Type Keycloak : 5€/h
- Durée 2h : 9€ (réduction appliquée)
- Durée 24h : 90€ (réduction importante)

### Évolutivité

#### Ajout de Nouveaux Types de Logiciels
1. Créer le type dans `software_types`
2. Définir les tarifs dans `pricing`
3. Mettre à jour les composants frontend si nécessaire

#### Ajout de Nouveaux Rôles
1. Créer le rôle dans `roles`
2. Assigner aux utilisateurs via `user_roles`
3. Mettre à jour la logique d'autorisation

#### Ajout de Nouvelles Fonctionnalités
1. Étendre les modèles existants
2. Ajouter les services correspondants
3. Créer les routes API
4. Développer les composants frontend

### Monitoring et Maintenance

#### Logs
- Logs d'application avec niveaux
- Logs d'erreurs centralisés
- Monitoring des performances

#### Sauvegarde
- Sauvegarde automatique de la base PostgreSQL
- Rétention des logs Redis
- Stratégie de récupération

#### Mise à Jour
- Migrations de base de données
- Déploiement sans interruption
- Rollback en cas de problème

## Conclusion

Cette architecture refactorisée offre une base solide pour IAMAAS avec :
- **Séparation claire des responsabilités**
- **Évolutivité et maintenabilité**
- **Sécurité renforcée**
- **Interface d'administration complète**
- **Calcul dynamique des prix**
- **Protection des données sensibles**

L'architecture permet une croissance future tout en maintenant la simplicité d'utilisation pour les administrateurs et les utilisateurs finaux. 
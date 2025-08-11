# 🔒 Sécurité de l'API IAMAAS

## 📋 Vue d'ensemble

Ce document décrit les mesures de sécurité implémentées dans l'API IAMAAS pour protéger les utilisateurs, les données et l'infrastructure.

## 🛡️ Mesures de sécurité implémentées

### 1. **Authentification et autorisation**

#### JWT (JSON Web Tokens)
- ✅ **Clé secrète sécurisée** : Génération automatique avec `secrets.token_urlsafe(32)`
- ✅ **Expiration configurable** : 24h par défaut (configurable via `ACCESS_TOKEN_EXPIRE_MINUTES`)
- ✅ **Validation stricte** : Vérification de l'existence et de l'état actif de l'utilisateur
- ✅ **Headers de sécurité** : Headers `WWW-Authenticate` appropriés

#### Gestion des rôles
- ✅ **Système de rôles** : Admin et Customer avec permissions granulaires
- ✅ **Vérification des privilèges** : Middleware `require_role()` et `get_current_admin_user()`
- ✅ **Protection des routes admin** : Accès restreint aux utilisateurs administrateurs

### 2. **Validation des données**

#### Politique de mots de passe
- ✅ **Longueur minimale** : 8 caractères minimum (configurable)
- ✅ **Complexité requise** :
  - Au moins une majuscule
  - Au moins une minuscule
  - Au moins un chiffre
  - Au moins un caractère spécial
- ✅ **Validation en temps réel** : Vérification lors de l'inscription et du changement de mot de passe

#### Validation des entrées
- ✅ **Pydantic schemas** : Validation automatique des données d'entrée
- ✅ **Sanitisation** : Nettoyage des chaînes de caractères
- ✅ **Limites de taille** : Contraintes sur les noms, descriptions, etc.

### 3. **Rate Limiting**

#### Protection contre les attaques par force brute
- ✅ **Limite par minute** : 60 requêtes/minute par IP (configurable)
- ✅ **Limite par heure** : 1000 requêtes/heure par IP (configurable)
- ✅ **Limites spécifiques** :
  - Inscription : 5/minute, 20/heure
  - Connexion : 10/minute, 100/heure
  - Création de sandboxes : 3/minute, 20/heure

#### Stockage des limites
- ⚠️ **En développement** : Stockage en mémoire (à remplacer par Redis en production)

### 4. **Configuration CORS sécurisée**

#### Origines autorisées
- ✅ **Origines restreintes** : Seulement `localhost:3000` et `127.0.0.1:3000`
- ✅ **Méthodes limitées** : GET, POST, PUT, DELETE, OPTIONS
- ✅ **Headers exposés** : Seulement `X-Total-Count`
- ✅ **Cache CORS** : 1 heure maximum

### 5. **Protection des hôtes**

#### Trusted Hosts
- ✅ **Hôtes autorisés** : `localhost`, `127.0.0.1`, `0.0.0.0`
- ✅ **Middleware TrustedHost** : Rejet des requêtes d'hôtes non autorisés

### 6. **Gestion d'erreurs sécurisée**

#### Sanitisation des messages d'erreur
- ✅ **Mode production** : Messages d'erreur génériques
- ✅ **Mode debug** : Messages détaillés (uniquement en développement)
- ✅ **Filtrage automatique** : Masquage des informations sensibles (mots de passe, tokens, etc.)

#### Logs de sécurité
- ✅ **Logs d'authentification** : Connexions réussies et échouées
- ✅ **Logs d'actions sensibles** : Création/suppression de sandboxes, changements de mots de passe
- ✅ **Logs d'erreurs** : Erreurs avec contexte pour le debugging

### 7. **Sécurité des sandboxes**

#### Isolation des conteneurs
- ✅ **Conteneurs isolés** : Chaque sandbox dans son propre conteneur Docker
- ✅ **Mots de passe uniques** : Génération sécurisée pour chaque sandbox
- ✅ **Expiration automatique** : Suppression automatique après expiration
- ✅ **Validation des accès** : Vérification de la propriété des sandboxes

#### Protection des données
- ✅ **Chiffrement des mots de passe** : Hachage bcrypt pour les mots de passe utilisateurs
- ✅ **Séparation des données** : Isolation des données par utilisateur
- ✅ **Suppression en cascade** : Suppression automatique des données associées

### 8. **Configuration de sécurité**

#### Variables d'environnement
- ✅ **Fichier d'exemple** : `env.example` avec paramètres sécurisés
- ✅ **Validation des variables** : Vérification de la présence des variables critiques
- ✅ **Valeurs par défaut sécurisées** : Configuration sécurisée par défaut

#### Mode debug
- ✅ **Désactivation en production** : `DEBUG=false` par défaut
- ✅ **Endpoints conditionnels** : `/docs` et `/redoc` uniquement en debug
- ✅ **Informations sensibles** : Endpoint `/security-info` protégé

## 🔧 Configuration recommandée pour la production

### Variables d'environnement critiques
```bash
# Sécurité
SECRET_KEY=your-super-secure-random-key-here
DEBUG=false
ACCESS_TOKEN_EXPIRE_MINUTES=1440

# Rate Limiting
RATE_LIMIT_PER_MINUTE=30
RATE_LIMIT_PER_HOUR=500

# CORS
CORS_ORIGINS=["https://yourdomain.com"]
ALLOWED_HOSTS=["yourdomain.com", "api.yourdomain.com"]

# Politique de mots de passe
MIN_PASSWORD_LENGTH=12
REQUIRE_SPECIAL_CHAR=true
REQUIRE_UPPERCASE=true
REQUIRE_LOWERCASE=true
REQUIRE_DIGIT=true
```

### Recommandations supplémentaires

#### Infrastructure
- 🔄 **Redis** : Remplacer le stockage en mémoire par Redis pour le rate limiting
- 🔄 **HTTPS** : Forcer HTTPS en production
- 🔄 **WAF** : Web Application Firewall pour protection supplémentaire
- 🔄 **Monitoring** : Surveillance des tentatives d'attaque

#### Base de données
- 🔄 **Chiffrement au repos** : Chiffrer les données sensibles
- 🔄 **Backup sécurisé** : Sauvegardes chiffrées
- 🔄 **Audit logs** : Journalisation des accès à la base de données

#### Conteneurs
- 🔄 **Images signées** : Utiliser des images Docker signées
- 🔄 **Scan de vulnérabilités** : Scanner régulier des images
- 🔄 **Limites de ressources** : Limiter CPU/mémoire par conteneur

## 🚨 Réponse aux incidents

### Logs de sécurité
Les logs de sécurité sont disponibles dans les logs de l'application :
```bash
docker logs iamaas-backend
```

### Signaux d'alerte
- Tentatives de connexion échouées répétées
- Accès non autorisés aux routes admin
- Création excessive de sandboxes
- Erreurs de validation répétées

### Actions recommandées
1. **Analyser les logs** pour identifier la source
2. **Bloquer l'IP** si nécessaire
3. **Révoquer les tokens** compromis
4. **Changer les clés** si compromission suspectée
5. **Notifier les utilisateurs** si données compromises

## 📞 Contact sécurité

Pour signaler des vulnérabilités de sécurité :
- Email : security@iamaas.com
- Réponse : Sous 24h
- Programme de bug bounty : À venir

---

**Dernière mise à jour** : Août 2024  
**Version** : 1.0.0


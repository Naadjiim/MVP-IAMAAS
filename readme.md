# 🧩 GateLabs - Identity Access Management as a Service

> MVP d'une plateforme SaaS permettant de créer, gérer et détruire automatiquement des environnements **IAM sandbox (Keycloak)** à la demande. Ce projet repose sur une architecture **React (frontend)** + **FastAPI (backend)**, et utilise **Docker Desktop** pour les déploiements de développement locaux.

---

## 🚀 Objectif du projet

Créer une plateforme **sandbox IAM-as-a-Service** (IAMAAS) à destination des :

- Consultants IAM
- Formateurs
- Intégrateurs
- Équipes sécurité / DevSecOps

Le MVP permet :
- L'automatisation de la création de sandbox IAM (Keycloak)
- L'accès web temporaire à la sandbox
- La destruction automatique après expiration
- L'orchestration via interface utilisateur

---

## ⚙️ Stack technique

### 🖥️ Frontend
- **React** avec Next.js
- Interface utilisateur simple (formulaire de déploiement, tableau de bord des sandboxes)
- Auth utilisateur par magic link ou compte simple
- Communication avec le backend via API REST

### 🧠 Backend
- **FastAPI** (Python 3.11+)
- API RESTful pour :
  - Création des sandboxes
  - Gestion TTL / destruction auto
  - Envoi des liens d'accès
- Base de données : **PostgreSQL**
- Intégration email (SendGrid) pour notifications

### 📦 Infrastructure / DevOps
- **Docker Desktop** : sandbox locale de Keycloak
- **Docker Compose** : gestion des conteneurs (Keycloak + DB)
- Déploiement cloud futur : **AWS EC2 / Terraform** (non MVP)
- Journaux et logs : stdout / fichiers / CloudWatch (plus tard)

---

## 🧱 Fonctionnalités MVP

- [x] Formulaire de demande d'environnement IAM
- [x] Déploiement automatique d'un conteneur **Keycloak**
- [x] Génération d'un lien d'accès
- [x] Expiration automatique de la sandbox (TTL)
- [x] Dashboard utilisateur minimal (statut, durée, suppression)
- [x] Intégration Stripe pour paiements
- [ ] Multi-version Keycloak (étape future)
- [ ] Upload BYOL (ex. SailPoint) (non inclus dans MVP)

---

## 📁 Structure du projet

```plaintext
MVP-IAMAAS/
├── frontend/                 # Application React (Next.js)
│   ├── src/
│   │   ├── app/             # Pages Next.js 13+
│   │   ├── components/      # Composants UI réutilisables
│   │   ├── contexts/        # Contextes React
│   │   └── services/        # Appels à l'API FastAPI
│   ├── package.json         # Dépendances Node.js
│   └── Dockerfile           # Image Docker frontend
│
├── backend/                 # Application FastAPI (Python)
│   ├── app/
│   │   ├── api/             # Routes API (REST)
│   │   ├── services/        # Logique métier (sandbox, TTL, etc.)
│   │   ├── models/          # Schémas Pydantic et ORM
│   │   ├── schemas/         # Schémas de validation
│   │   └── main.py          # Point d'entrée FastAPI
│   ├── requirements.txt     # Dépendances Python
│   └── Dockerfile           # Image Docker backend
│
├── infra/                   # Infrastructure Keycloak
│   ├── scripts/             # Scripts de création/suppression
│   ├── config/              # Configuration ports et réseau
│   └── README.md            # Documentation infrastructure
│
├── docker-compose.yml       # Environnement local complet
├── .env.example             # Variables d'environnement
├── KEYCLOAK_DEV_MODE.md     # Configuration Keycloak
└── README.md                # Ce fichier
```

---

## 🚀 Démarrage rapide

### Prérequis
- Docker Desktop installé et en cours d'exécution
- Docker Compose installé
- Git

### Installation et lancement

1. **Cloner le repository**
```bash
git clone <repository-url>
cd MVP-IAMAAS
```

2. **Configurer les variables d'environnement**
```bash
cp .env.example .env
# Éditer .env avec vos clés API (Stripe, SendGrid, etc.)
```

3. **Lancer l'application**
```bash
docker-compose up -d
```

4. **Accéder à l'application**
- Frontend : http://localhost:3000
- Backend API : http://localhost:8000
- Documentation API : http://localhost:8000/docs

---

## 🔧 Configuration Keycloak

Pour accéder aux sandboxes Keycloak créées :

1. **URL d'accès :** `http://localhost:8080/admin/master/console/`
2. **Identifiants :** `admin` / `[mot_de_passe_généré]`

Voir `KEYCLOAK_DEV_MODE.md` pour plus de détails.

---

## 📚 Documentation

- [Configuration Keycloak](KEYCLOAK_DEV_MODE.md)
- [Base de données](bdd.md)
- [Tâches de production](todo_prod.md)

---

## 🤝 Contribution

1. Fork le projet
2. Créer une branche feature (`git checkout -b feature/AmazingFeature`)
3. Commit les changements (`git commit -m 'Add some AmazingFeature'`)
4. Push vers la branche (`git push origin feature/AmazingFeature`)
5. Ouvrir une Pull Request

---

## 📄 Licence

Ce projet est sous licence MIT. Voir le fichier `LICENSE` pour plus de détails.
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
- **React** avec Next.js (ou Vite)
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
- Intégration email (SendGrid ou Mailgun) pour notifications

### 📦 Infrastructure / DevOps
- **Docker Desktop** : sandbox locale de Keycloak
- **Docker Compose** : gestion des conteneurs (Keycloak + DB si besoin)
- Déploiement cloud futur : **AWS EC2 / Terraform** (non MVP)
- Journaux et logs : stdout / fichiers / CloudWatch (plus tard)

---

## 🧱 Fonctionnalités MVP

- [x] Formulaire de demande d'environnement IAM
- [x] Déploiement automatique d'un conteneur **Keycloak**
- [x] Génération d'un lien d'accès
- [x] Expiration automatique de la sandbox (TTL)
- [x] Dashboard utilisateur minimal (statut, durée, suppression)
- [ ] Multi-version Keycloak (étape future)
- [ ] Upload BYOL (ex. SailPoint) (non inclus dans MVP)

---

## 📁 Structure du projet

```plaintext
MVP-IAMAAS/
├── frontend/                 # Application React (Next.js ou Vite)
│   ├── public/              # Assets publics (favicon, logos, etc.)
│   └── src/
│       ├── components/      # Composants UI réutilisables
│       ├── pages/           # Pages (formulaire, dashboard)
│       └── services/        # Appels à l'API FastAPI
│
├── backend/                 # Application FastAPI (Python)
│   ├── app/
│   │   ├── api/             # Routes API (REST)
│   │   ├── services/        # Logique métier (sandbox, TTL, etc.)
│   │   ├── models/          # Schémas Pydantic et ORM
│   │   └── main.py          # Point d'entrée FastAPI
│   └── requirements.txt     # Dépendances Python
│
├── docker/
│   └── keycloak/            # Dockerfiles personnalisés, scripts init
│
├── docker-compose.yml       # Environnement local complet (Keycloak, DB, etc.)
├── .env                     # Variables d'environnement
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
git clone https://github.com/Naadjiim/MVP-IAMAAS.git
cd MVP-IAMAAS
```

2. **Lancer le script de configuration automatique**
```bash
./scripts/setup.sh
```

3. **Ou lancer manuellement avec Docker Compose**
```bash
# Copier le fichier d'environnement
cp env.example .env

# Lancer tous les services
docker-compose up --build -d

# Vérifier que tout fonctionne
docker-compose ps
```

4. **Accéder à l'application**
- Frontend : http://localhost:3000
- Backend API : http://localhost:8000
- Documentation API : http://localhost:8000/docs

---

## 🧪 Lancer le projet en local (développement)

> Prérequis : Docker Desktop, Node.js 18+, Python 3.11+, pip, Docker Compose

```bash
# 1. Cloner le repo
git clone https://github.com/Naadjiim/MVP-IAMAAS.git
cd mvp-iamaas

# 2. Lancer les containers (Keycloak + DB)
docker-compose up --build

# 3. Lancer le frontend (dans un autre terminal)
cd frontend
npm install
npm run dev

# 4. Lancer le backend (dans un autre terminal)
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload
```

---

## 🔧 Configuration

### Variables d'environnement

Copiez le fichier `env.example` vers `.env` et configurez :

```bash
# Configuration de la base de données
DATABASE_URL=postgresql://iamaas:iamaas@localhost:5432/iamaas

# Configuration SendGrid pour les emails (optionnel)
SENDGRID_API_KEY=your_sendgrid_api_key_here
FROM_EMAIL=noreply@iamaas.com
FROM_NAME=IAMAAS Platform

# Configuration du frontend
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### Configuration SendGrid (optionnel)

Pour activer les notifications par email :

1. Créez un compte sur [SendGrid](https://sendgrid.com/)
2. Générez une clé API
3. Ajoutez la clé dans le fichier `.env`

### 🧪 Cartes de test Stripe

Pour tester les paiements en mode développement, utilisez ces cartes de test Stripe :

#### ✅ Paiements réussis
- **Visa** : `4242 4242 4242 4242`
- **Mastercard** : `5555 5555 5555 4444`
- **American Express** : `3782 822463 10005`

#### ❌ Paiements échoués
- **Carte refusée** : `4000 0000 0000 0002`
- **Carte expirée** : `4000 0000 0000 0069`
- **Carte incorrecte** : `4000 0000 0000 0127`

#### 📝 Informations communes pour tous les tests
- **Date d'expiration** : N'importe quelle date future (ex: `12/25`)
- **CVC** : N'importe quels 3 chiffres (ex: `123`)
- **Code postal** : N'importe quel code postal (ex: `12345`)

> **Note** : Ces cartes ne fonctionnent qu'en mode test. En production, utilisez de vraies cartes bancaires.

---

## 📚 API Documentation

Une fois le backend démarré, la documentation interactive est disponible sur :
- Swagger UI : http://localhost:8000/docs
- ReDoc : http://localhost:8000/redoc

### Endpoints principaux

- `POST /api/v1/sandboxes/` - Créer une nouvelle sandbox
- `GET /api/v1/sandboxes/` - Lister toutes les sandboxes
- `GET /api/v1/sandboxes/{id}` - Récupérer une sandbox
- `DELETE /api/v1/sandboxes/{id}` - Supprimer une sandbox
- `PUT /api/v1/sandboxes/{id}` - Mettre à jour une sandbox

---

## 🐳 Commandes Docker utiles

```bash
# Voir les logs en temps réel
docker-compose logs -f

# Voir les logs d'un service spécifique
docker-compose logs -f backend

# Arrêter tous les services
docker-compose down

# Arrêter et supprimer les volumes
docker-compose down -v

# Reconstruire un service
docker-compose up --build backend

# Voir l'état des services
docker-compose ps
```

---

## 🔍 Dépannage

### Problèmes courants

1. **Ports déjà utilisés**
   - Vérifiez qu'aucun service n'utilise les ports 3000, 8000, 5432
   - Modifiez les ports dans `docker-compose.yml` si nécessaire

2. **Erreur de connexion à la base de données**
   - Attendez que PostgreSQL soit complètement démarré
   - Vérifiez les logs : `docker-compose logs postgres`

3. **Conteneurs Keycloak ne démarrent pas**
   - Vérifiez que Docker Desktop a suffisamment de ressources
   - Consultez les logs : `docker-compose logs backend`

4. **Emails non envoyés**
   - Vérifiez la configuration SendGrid dans `.env`
   - Les emails sont optionnels, l'application fonctionne sans

---

## 🚧 Développement

### Structure du code

- **Frontend** : Composants React avec TypeScript et Tailwind CSS
- **Backend** : API FastAPI avec SQLAlchemy et Pydantic
- **Services** : Docker, Email, Planificateur de tâches

### Ajouter de nouvelles fonctionnalités

1. **Backend** : Ajoutez les routes dans `backend/app/api/routes/`
2. **Frontend** : Créez les composants dans `frontend/src/components/`
3. **Base de données** : Modifiez les modèles dans `backend/app/models/`

---

## 📄 Licence

Ce projet est sous licence MIT. Voir le fichier `LICENSE` pour plus de détails.

---

## 🤝 Contribution

Les contributions sont les bienvenues ! N'hésitez pas à :

1. Fork le projet
2. Créer une branche pour votre fonctionnalité
3. Commiter vos changements
4. Pousser vers la branche
5. Ouvrir une Pull Request

---

## 📞 Support

Pour toute question ou problème :
- Ouvrez une issue sur GitHub
- Consultez la documentation API
- Vérifiez les logs Docker

---

**🎉 Bon développement avec IAMAAS !**
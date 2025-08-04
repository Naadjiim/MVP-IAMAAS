#!/bin/bash

echo "🧩 Configuration du projet IAMAAS..."

# Vérifier que Docker est installé
if ! command -v docker &> /dev/null; then
    echo "❌ Docker n'est pas installé. Veuillez installer Docker Desktop."
    exit 1
fi

# Vérifier que Docker Compose est installé
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose n'est pas installé. Veuillez installer Docker Compose."
    exit 1
fi

# Créer le fichier .env s'il n'existe pas
if [ ! -f .env ]; then
    echo "📝 Création du fichier .env..."
    cp env.example .env
    echo "✅ Fichier .env créé. Veuillez le configurer selon vos besoins."
fi

# Construire et démarrer les services
echo "🐳 Démarrage des services Docker..."
docker-compose up --build -d

# Attendre que les services soient prêts
echo "⏳ Attente du démarrage des services..."
sleep 30

# Vérifier l'état des services
echo "🔍 Vérification de l'état des services..."
docker-compose ps

echo ""
echo "🎉 Configuration terminée !"
echo ""
echo "📋 Services disponibles :"
echo "  - Frontend: http://localhost:3000"
echo "  - Backend API: http://localhost:8000"
echo "  - Documentation API: http://localhost:8000/docs"
echo "  - Base de données PostgreSQL: localhost:5432"
echo ""
echo "📝 Prochaines étapes :"
echo "  1. Configurez votre clé API SendGrid dans le fichier .env"
echo "  2. Accédez à l'interface web sur http://localhost:3000"
echo "  3. Créez votre première sandbox IAM !"
echo ""
echo "🛑 Pour arrêter les services : docker-compose down" 
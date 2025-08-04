#!/bin/bash

echo "🚀 Démarrage de IAMAAS Backend..."

# Attendre que la base de données soit prête
echo "⏳ Attente de la base de données..."
sleep 10

# Initialiser l'utilisateur admin
echo "👤 Initialisation de l'utilisateur admin..."
python3 /app/init_admin_docker.py

# Lancer l'API
echo "🌐 Lancement de l'API..."
exec uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload 
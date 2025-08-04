#!/bin/bash

echo "🚀 Démarrage de IAMAAS Backend..."

# Attendre que la base de données soit prête
echo "⏳ Attente de la base de données..."
sleep 10

# Initialiser la base de données avec la nouvelle architecture
echo "🗄️ Initialisation de la base de données..."
python3 /app/init_database.py

# Lancer l'API
echo "🌐 Lancement de l'API..."
exec uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload 
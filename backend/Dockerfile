FROM python:3.11-slim

# Définir le répertoire de travail
WORKDIR /app

# Installer les dépendances système
RUN apt-get update && apt-get install -y \
    gcc \
    postgresql-client \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copier les fichiers de dépendances
COPY requirements.txt .

# Installer les dépendances Python
RUN pip install --no-cache-dir -r requirements.txt

# Copier le code source
COPY . .

# Exposer le port
EXPOSE 8000

# Script de démarrage qui initialise l'admin et lance l'API
COPY init_admin_docker.py /app/init_admin_docker.py

CMD ["sh", "-c", "sleep 10 && python3 /app/init_admin_docker.py && uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload"] 
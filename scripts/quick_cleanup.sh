#!/bin/bash

echo "🧹 Nettoyage rapide des conteneurs Docker orphelins"
echo "=================================================="

# Lister tous les conteneurs Docker qui commencent par 'iamaas-'
echo "🔍 Recherche des conteneurs IAMAAS..."
containers=$(docker ps -a --format "table {{.Names}}\t{{.Status}}\t{{.CreatedAt}}" | grep "iamaas-")

if [ -z "$containers" ]; then
    echo "✅ Aucun conteneur IAMAAS trouvé"
    exit 0
fi

echo "📋 Conteneurs IAMAAS trouvés:"
echo "$containers"
echo ""

# Demander confirmation
read -p "❓ Voulez-vous supprimer ces conteneurs ? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Suppression annulée"
    exit 0
fi

# Supprimer les conteneurs
echo "🗑️  Suppression des conteneurs..."
deleted_count=0

while IFS= read -r line; do
    if [[ $line =~ iamaas- ]]; then
        container_name=$(echo "$line" | awk '{print $1}')
        echo "  Suppression de $container_name..."
        
        # Arrêter le conteneur s'il est en cours d'exécution
        docker stop "$container_name" 2>/dev/null
        
        # Supprimer le conteneur
        if docker rm "$container_name" 2>/dev/null; then
            echo "    ✅ $container_name supprimé"
            ((deleted_count++))
        else
            echo "    ❌ Erreur lors de la suppression de $container_name"
        fi
    fi
done <<< "$containers"

echo ""
echo "🎉 Nettoyage terminé: $deleted_count conteneurs supprimés"

# Nettoyer aussi les images non utilisées
echo ""
echo "🧹 Nettoyage des images non utilisées..."
docker image prune -f

echo "✅ Nettoyage complet terminé"

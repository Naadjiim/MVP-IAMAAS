#!/usr/bin/env python3
"""
Script pour nettoyer les conteneurs Docker orphelins
Supprime les conteneurs qui ne correspondent plus à des sandboxes dans la base de données
"""

import sys
import os
import asyncio
import docker
from pathlib import Path

# Ajouter le répertoire backend au path pour importer les modules
backend_path = Path(__file__).parent.parent / 'backend'
sys.path.insert(0, str(backend_path))

from app.database import SessionLocal
from app.models.sandbox import Sandbox
from app.services.docker_service import DockerService

async def cleanup_orphaned_containers():
    """Nettoie les conteneurs Docker orphelins"""
    print("🔍 Recherche des conteneurs Docker orphelins...")
    
    # Connexion à la base de données
    db = SessionLocal()
    
    try:
        # Récupérer tous les noms de conteneurs de la base de données
        sandboxes = db.query(Sandbox).filter(Sandbox.container_name.isnot(None)).all()
        db_container_names = {sandbox.container_name for sandbox in sandboxes}
        
        print(f"📊 Sandboxes dans la base de données: {len(sandboxes)}")
        print(f"📋 Conteneurs enregistrés: {list(db_container_names)}")
        
        # Connexion à Docker
        try:
            client = docker.from_env()
        except Exception as e:
            print(f"❌ Erreur de connexion à Docker: {str(e)}")
            return
        
        # Lister tous les conteneurs Docker
        containers = client.containers.list(all=True)
        docker_container_names = {container.name for container in containers}
        
        print(f"🐳 Conteneurs Docker trouvés: {len(containers)}")
        
        # Identifier les conteneurs orphelins (dans Docker mais pas en base)
        orphaned_containers = []
        for container in containers:
            if container.name.startswith('iamaas-') and container.name not in db_container_names:
                orphaned_containers.append(container)
        
        print(f"🧹 Conteneurs orphelins trouvés: {len(orphaned_containers)}")
        
        if not orphaned_containers:
            print("✅ Aucun conteneur orphelin trouvé")
            return
        
        # Afficher les conteneurs orphelins
        print("\n📋 Conteneurs orphelins:")
        for container in orphaned_containers:
            status = container.status
            created = container.attrs['Created'][:19]  # Format: 2024-01-01T12:00:00
            print(f"  - {container.name} (Status: {status}, Créé: {created})")
        
        # Demander confirmation
        response = input(f"\n❓ Voulez-vous supprimer ces {len(orphaned_containers)} conteneurs orphelins ? (y/N): ")
        if response.lower() != 'y':
            print("❌ Suppression annulée")
            return
        
        # Supprimer les conteneurs orphelins
        docker_service = DockerService()
        deleted_count = 0
        
        for container in orphaned_containers:
            try:
                print(f"🗑️  Suppression de {container.name}...")
                
                # Utiliser le service Docker pour la suppression
                success = await docker_service.delete_iam_sandbox(container.name)
                
                if success:
                    print(f"✅ {container.name} supprimé avec succès")
                    deleted_count += 1
                else:
                    print(f"⚠️  Échec de la suppression de {container.name}")
                    
            except Exception as e:
                print(f"❌ Erreur lors de la suppression de {container.name}: {str(e)}")
        
        print(f"\n🎉 Nettoyage terminé: {deleted_count}/{len(orphaned_containers)} conteneurs supprimés")
        
    except Exception as e:
        print(f"❌ Erreur lors du nettoyage: {str(e)}")
    finally:
        db.close()

def main():
    """Point d'entrée principal"""
    print("🧹 Script de nettoyage des conteneurs Docker orphelins")
    print("=" * 60)
    
    asyncio.run(cleanup_orphaned_containers())

if __name__ == "__main__":
    main()

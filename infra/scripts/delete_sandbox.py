#!/usr/bin/env python3
"""
Script de suppression d'une sandbox Keycloak
"""

import argparse
import sys
import json
from pathlib import Path

# Ajouter le dossier parent au path pour importer utils
sys.path.append(str(Path(__file__).parent))
from utils import DockerManager

def delete_keycloak_sandbox(sandbox_id: str) -> dict:
    """
    Supprimer une sandbox Keycloak
    
    Args:
        sandbox_id: ID unique de la sandbox
        
    Returns:
        dict: Informations de la suppression
    """
    
    print(f"🗑️  Suppression de la sandbox Keycloak: {sandbox_id}")
    
    # Initialiser le gestionnaire Docker
    docker_manager = DockerManager()
    
    try:
        container_name = f"iamaas-keycloak-{sandbox_id}"
        
        # 1. Vérifier si le conteneur existe
        try:
            container = docker_manager.client.containers.get(container_name)
        except docker.errors.NotFound:
            return {
                'sandbox_id': sandbox_id,
                'status': 'not_found',
                'message': f'Conteneur {container_name} non trouvé'
            }
        
        # 2. Récupérer les informations avant suppression
        container_info = docker_manager.get_container_info(container_name)
        
        # 3. Arrêter le conteneur
        print(f"⏹️  Arrêt du conteneur {container_name}...")
        container.stop(timeout=30)
        
        # 4. Supprimer le conteneur
        print(f"🗑️  Suppression du conteneur {container_name}...")
        container.remove(force=True)
        
        result = {
            'sandbox_id': sandbox_id,
            'container_id': container_info['id'] if container_info else None,
            'container_name': container_name,
            'status': 'deleted',
            'message': f'Sandbox {sandbox_id} supprimée avec succès'
        }
        
        print(f"✅ Sandbox supprimée avec succès: {sandbox_id}")
        return result
        
    except Exception as e:
        print(f"❌ Erreur lors de la suppression de la sandbox: {str(e)}")
        raise

def main():
    """Point d'entrée principal"""
    parser = argparse.ArgumentParser(description='Supprimer une sandbox Keycloak')
    parser.add_argument('--sandbox-id', required=True, help='ID unique de la sandbox')
    parser.add_argument('--output', help='Fichier de sortie JSON (optionnel)')
    
    args = parser.parse_args()
    
    try:
        # Supprimer la sandbox
        result = delete_keycloak_sandbox(sandbox_id=args.sandbox_id)
        
        # Sauvegarder dans un fichier si demandé
        if args.output:
            with open(args.output, 'w') as f:
                json.dump(result, f, indent=2)
            print(f"📄 Résultat sauvegardé dans: {args.output}")
        
        # Afficher le résultat en JSON
        print(json.dumps(result, indent=2))
        
    except Exception as e:
        print(f"❌ Erreur: {str(e)}")
        sys.exit(1)

if __name__ == "__main__":
    main() 
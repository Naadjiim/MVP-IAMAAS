#!/usr/bin/env python3
"""
Script de création d'une sandbox Keycloak
"""

import argparse
import sys
import json
import time
from pathlib import Path

# Ajouter le dossier parent au path pour importer utils
sys.path.append(str(Path(__file__).parent))
from utils import DockerManager

def create_keycloak_sandbox(sandbox_id: str, name: str, duration_hours: int = 24) -> dict:
    """
    Créer une sandbox Keycloak
    
    Args:
        sandbox_id: ID unique de la sandbox
        name: Nom de la sandbox
        duration_hours: Durée en heures
        
    Returns:
        dict: Informations de la sandbox créée
    """
    
    print(f"🚀 Création de la sandbox Keycloak: {name} (ID: {sandbox_id})")
    
    # Initialiser le gestionnaire Docker
    docker_manager = DockerManager()
    
    try:
        # 1. S'assurer que le réseau existe
        print("📡 Vérification du réseau Docker...")
        if not docker_manager.ensure_network_exists():
            raise Exception("Impossible de créer le réseau Docker")
        
        # 2. Trouver un port disponible
        print("🔍 Recherche d'un port disponible...")
        port = docker_manager.get_available_port()
        if not port:
            raise Exception("Aucun port disponible dans la plage configurée")
        
        print(f"✅ Port trouvé: {port}")
        
        # 3. Générer les identifiants admin
        admin_password = docker_manager.generate_admin_password()
        container_name = f"iamaas-keycloak-{sandbox_id}"
        
        print(f"🔐 Génération des identifiants admin...")
        print(f"   - Container: {container_name}")
        print(f"   - Port: {port}")
        print(f"   - Admin: admin / {admin_password}")
        
        # 4. Créer le conteneur Keycloak
        print("🐳 Création du conteneur Keycloak...")
        
        # Configuration du conteneur
        container_config = {
            'image': docker_manager.config['keycloak']['image'],
            'name': container_name,
            'command': ['start-dev'],  # Démarrer en mode développement
            'environment': {
                'KEYCLOAK_ADMIN': docker_manager.config['keycloak']['admin_user'],
                'KEYCLOAK_ADMIN_PASSWORD': admin_password,
                'KC_DB': 'dev-file',  # Base de données en mémoire pour le développement
                'KC_HOSTNAME_STRICT': 'false',
                'KC_HOSTNAME_STRICT_HTTPS': 'false',
                'KC_HTTP_ENABLED': 'true',
                'KC_HEALTH_ENABLED': 'true',
                'KC_METRICS_ENABLED': 'true'
            },
            'ports': {
                '8080/tcp': port
            },
            'labels': {
                'iamaas.sandbox.id': sandbox_id,
                'iamaas.sandbox.name': name,
                'iamaas.sandbox.duration': str(duration_hours),
                'iamaas.created_at': str(int(time.time()))
            },
            'detach': True
        }
        
        # Créer le conteneur
        container = docker_manager.client.containers.run(**container_config)
        
        # Connecter le conteneur au réseau
        network = docker_manager.client.networks.get(docker_manager.network_name)
        network.connect(container.id)
        
        print(f"✅ Conteneur créé avec succès: {container.id}")
        
        # 5. Attendre que le conteneur soit en bonne santé
        print("⏳ Attente du démarrage de Keycloak...")
        if not docker_manager.wait_for_container_health(container_name):
            raise Exception("Le conteneur Keycloak n'a pas démarré correctement")
        
        # 6. Récupérer les informations finales
        container_info = docker_manager.get_container_info(container_name)
        if not container_info:
            raise Exception("Impossible de récupérer les informations du conteneur")
        
        # 7. Préparer la réponse
        sandbox_info = {
            'sandbox_id': sandbox_id,
            'name': name,
            'container_id': container_info['id'],
            'container_name': container_info['name'],
            'access_url': f"http://localhost:{port}",
            'admin_username': docker_manager.config['keycloak']['admin_user'],
            'admin_password': admin_password,
            'port': port,
            'status': 'running',
            'created_at': int(time.time()),
            'expires_at': int(time.time() + (duration_hours * 3600))
        }
        
        print("🎉 Sandbox Keycloak créée avec succès!")
        print(f"   - URL: {sandbox_info['access_url']}")
        print(f"   - Admin: {sandbox_info['admin_username']} / {sandbox_info['admin_password']}")
        print(f"   - Container ID: {sandbox_info['container_id']}")
        
        return sandbox_info
        
    except Exception as e:
        print(f"❌ Erreur lors de la création de la sandbox: {str(e)}")
        
        # Nettoyer en cas d'erreur
        try:
            container_name = f"iamaas-keycloak-{sandbox_id}"
            container = docker_manager.client.containers.get(container_name)
            container.remove(force=True)
            print(f"🧹 Conteneur nettoyé: {container_name}")
        except:
            pass
        
        raise

def main():
    """Point d'entrée principal"""
    parser = argparse.ArgumentParser(description='Créer une sandbox Keycloak')
    parser.add_argument('--sandbox-id', required=True, help='ID unique de la sandbox')
    parser.add_argument('--name', required=True, help='Nom de la sandbox')
    parser.add_argument('--duration', type=int, default=24, help='Durée en heures (défaut: 24)')
    parser.add_argument('--output', help='Fichier de sortie JSON (optionnel)')
    
    args = parser.parse_args()
    
    try:
        # Créer la sandbox
        sandbox_info = create_keycloak_sandbox(
            sandbox_id=args.sandbox_id,
            name=args.name,
            duration_hours=args.duration
        )
        
        # Sauvegarder dans un fichier si demandé
        if args.output:
            with open(args.output, 'w') as f:
                json.dump(sandbox_info, f, indent=2)
            print(f"📄 Informations sauvegardées dans: {args.output}")
        
        # Afficher le résultat en JSON
        print(json.dumps(sandbox_info, indent=2))
        
    except Exception as e:
        print(f"❌ Erreur: {str(e)}")
        sys.exit(1)

if __name__ == "__main__":
    main() 
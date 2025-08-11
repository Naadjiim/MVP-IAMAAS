#!/usr/bin/env python3
"""
Gestionnaire modulaire pour les logiciels IAM
Permet de créer, gérer et supprimer des sandboxes pour différents logiciels IAM
"""

import json
import os
import sys
import time
import uuid
import docker
from pathlib import Path
from typing import Dict, Any, Optional
from dataclasses import dataclass

@dataclass
class SandboxConfig:
    """Configuration d'une sandbox IAM"""
    software_type: str
    version: str
    name: str
    duration_hours: int
    port: int
    admin_username: str
    admin_password: str
    container_name: str
    access_url: str

class IAMSoftwareManager:
    """Gestionnaire principal pour les logiciels IAM"""
    
    def __init__(self, config_path: str = "infra/config/software_config.json"):
        self.config_path = Path(config_path)
        self.config = self._load_config()
        self.client = docker.from_env()
        self.network_name = self.config['infrastructure']['network']['name']
        
    def _load_config(self) -> Dict[str, Any]:
        """Charger la configuration des logiciels"""
        try:
            with open(self.config_path, 'r') as f:
                return json.load(f)
        except FileNotFoundError:
            print(f"❌ Fichier de configuration non trouvé: {self.config_path}")
            sys.exit(1)
        except json.JSONDecodeError as e:
            print(f"❌ Erreur de parsing JSON: {e}")
            sys.exit(1)
    
    def get_software_config(self, software_type: str) -> Dict[str, Any]:
        """Récupérer la configuration d'un logiciel"""
        if software_type not in self.config['software_types']:
            raise ValueError(f"Type de logiciel non supporté: {software_type}")
        return self.config['software_types'][software_type]
    
    def list_supported_software(self) -> Dict[str, str]:
        """Lister tous les logiciels supportés"""
        return {
            software_id: config['name'] 
            for software_id, config in self.config['software_types'].items()
        }
    
    def create_sandbox(self, software_type: str, name: str, duration_hours: int, 
                      version: Optional[str] = None) -> SandboxConfig:
        """Créer une sandbox pour un logiciel IAM"""
        
        # Récupérer la configuration du logiciel
        software_config = self.get_software_config(software_type)
        
        # Utiliser la version par défaut si non spécifiée
        if version is None:
            version = software_config['version']
        
        # Vérifier que la version est supportée
        if version not in software_config['supported_versions']:
            raise ValueError(f"Version {version} non supportée pour {software_type}")
        
        # Générer un ID unique pour la sandbox
        sandbox_id = str(uuid.uuid4())
        
        # Trouver un port disponible
        port = self._find_available_port(software_config['default_port'])
        
        # Générer des identifiants admin
        admin_password = self._generate_password()
        
        # Créer le nom du conteneur
        container_name = f"{software_config['container_prefix']}{sandbox_id}"
        
        # Créer l'URL d'accès
        access_url = software_config['access_url_pattern'].format(port=port)
        
        # Créer la configuration de la sandbox
        sandbox_config = SandboxConfig(
            software_type=software_type,
            version=version,
            name=name,
            duration_hours=duration_hours,
            port=port,
            admin_username=software_config['admin_user'],
            admin_password=admin_password,
            container_name=container_name,
            access_url=access_url
        )
        
        # Créer le conteneur
        self._create_container(sandbox_config, software_config)
        
        return sandbox_config
    
    def delete_sandbox(self, container_name: str) -> bool:
        """Supprimer une sandbox"""
        try:
            container = self.client.containers.get(container_name)
            container.stop()
            container.remove()
            print(f"✅ Sandbox supprimée: {container_name}")
            return True
        except docker.errors.NotFound:
            print(f"⚠️  Conteneur non trouvé: {container_name}")
            return False
        except Exception as e:
            print(f"❌ Erreur lors de la suppression: {e}")
            return False
    
    def list_sandboxes(self) -> list:
        """Lister toutes les sandboxes actives"""
        sandboxes = []
        for container in self.client.containers.list():
            if any(prefix in container.name for prefix in 
                   [config['container_prefix'] for config in self.config['software_types'].values()]):
                sandboxes.append({
                    'name': container.name,
                    'status': container.status,
                    'ports': container.ports,
                    'created': container.attrs['Created']
                })
        return sandboxes
    
    def _find_available_port(self, default_port: int) -> int:
        """Trouver un port disponible"""
        port_range = self.config['infrastructure']['port_range']
        start_port = port_range['start']
        end_port = port_range['end']
        
        # Essayer d'abord le port par défaut
        if self._is_port_available(default_port):
            return default_port
        
        # Chercher un port disponible dans la plage
        for port in range(start_port, end_port + 1):
            if self._is_port_available(port):
                return port
        
        raise RuntimeError(f"Aucun port disponible dans la plage {start_port}-{end_port}")
    
    def _is_port_available(self, port: int) -> bool:
        """Vérifier si un port est disponible"""
        try:
            import socket
            with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
                s.bind(('localhost', port))
                return True
        except OSError:
            return False
    
    def _generate_password(self) -> str:
        """Générer un mot de passe sécurisé"""
        import secrets
        import string
        
        alphabet = string.ascii_letters + string.digits + "!@#$%^&*"
        return ''.join(secrets.choice(alphabet) for _ in range(16))
    
    def _create_container(self, sandbox_config: SandboxConfig, software_config: Dict[str, Any]):
        """Créer le conteneur Docker"""
        
        # S'assurer que le réseau existe
        self._ensure_network_exists()
        
        # Préparer la configuration du conteneur
        container_config = {
            'image': software_config['image'],
            'name': sandbox_config.container_name,
            'environment': {
                **software_config['environment'],
                f'{software_config["admin_user"].upper()}_PASSWORD': sandbox_config.admin_password
            },
            'ports': {
                f'{software_config["default_port"]}/tcp': sandbox_config.port
            },
            'labels': {
                'iamaas.sandbox.id': str(uuid.uuid4()),
                'iamaas.sandbox.name': sandbox_config.name,
                'iamaas.sandbox.duration': str(sandbox_config.duration_hours),
                'iamaas.software.type': sandbox_config.software_type,
                'iamaas.software.version': sandbox_config.version,
                'iamaas.created_at': str(int(time.time()))
            },
            'detach': True
        }
        
        # Ajouter la commande de démarrage si spécifiée
        if 'command' in software_config:
            container_config['command'] = software_config['command']
        
        # Créer le conteneur
        try:
            container = self.client.containers.run(**container_config)
            print(f"✅ Conteneur créé: {container.id}")
            
            # Connecter au réseau
            network = self.client.networks.get(self.network_name)
            network.connect(container.id)
            
            # Attendre que le conteneur soit prêt
            self._wait_for_container_ready(container)
            
        except Exception as e:
            print(f"❌ Erreur lors de la création du conteneur: {e}")
            raise
    
    def _ensure_network_exists(self):
        """S'assurer que le réseau Docker existe"""
        try:
            self.client.networks.get(self.network_name)
        except docker.errors.NotFound:
            network_config = self.config['infrastructure']['network']
            self.client.networks.create(
                name=self.network_name,
                driver=network_config['driver']
            )
            print(f"✅ Réseau créé: {self.network_name}")
    
    def _wait_for_container_ready(self, container, timeout: int = 60):
        """Attendre que le conteneur soit prêt"""
        print("⏳ Attente du démarrage...")
        start_time = time.time()
        
        while time.time() - start_time < timeout:
            container.reload()
            if container.status == 'running':
                print(f"✅ Conteneur prêt: {container.name}")
                return
            time.sleep(2)
        
        raise TimeoutError(f"Conteneur {container.name} n'a pas démarré dans les {timeout} secondes")

def main():
    """Point d'entrée principal"""
    import argparse
    
    parser = argparse.ArgumentParser(description="Gestionnaire de sandboxes IAM")
    parser.add_argument('action', choices=['create', 'delete', 'list', 'software-list'],
                       help='Action à effectuer')
    parser.add_argument('--software-type', '-s', 
                       help='Type de logiciel IAM (keycloak, sailpoint, okta, azure-ad)')
    parser.add_argument('--name', '-n', help='Nom de la sandbox')
    parser.add_argument('--duration', '-d', type=int, default=24,
                       help='Durée en heures (défaut: 24)')
    parser.add_argument('--version', '-v', help='Version du logiciel')
    parser.add_argument('--container-name', '-c', help='Nom du conteneur à supprimer')
    
    args = parser.parse_args()
    
    manager = IAMSoftwareManager()
    
    if args.action == 'software-list':
        software_list = manager.list_supported_software()
        print("📋 Logiciels IAM supportés:")
        for software_id, software_name in software_list.items():
            print(f"  - {software_id}: {software_name}")
    
    elif args.action == 'list':
        sandboxes = manager.list_sandboxes()
        print("📋 Sandboxes actives:")
        for sandbox in sandboxes:
            print(f"  - {sandbox['name']}: {sandbox['status']}")
    
    elif args.action == 'create':
        if not args.software_type or not args.name:
            print("❌ --software-type et --name sont requis pour créer une sandbox")
            sys.exit(1)
        
        try:
            sandbox = manager.create_sandbox(
                software_type=args.software_type,
                name=args.name,
                duration_hours=args.duration,
                version=args.version
            )
            print(f"🎉 Sandbox créée avec succès!")
            print(f"   - Type: {sandbox.software_type}")
            print(f"   - Nom: {sandbox.name}")
            print(f"   - URL: {sandbox.access_url}")
            print(f"   - Admin: {sandbox.admin_username} / {sandbox.admin_password}")
            print(f"   - Port: {sandbox.port}")
        except Exception as e:
            print(f"❌ Erreur lors de la création: {e}")
            sys.exit(1)
    
    elif args.action == 'delete':
        if not args.container_name:
            print("❌ --container-name est requis pour supprimer une sandbox")
            sys.exit(1)
        
        success = manager.delete_sandbox(args.container_name)
        if not success:
            sys.exit(1)

if __name__ == "__main__":
    main() 
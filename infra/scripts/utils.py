#!/usr/bin/env python3
"""
Utilitaires pour la gestion de l'infrastructure IAMAAS
"""

import json
import docker
import random
import string
import time
import os
from typing import Optional, Dict, Any, List
from pathlib import Path

class DockerManager:
    def __init__(self):
        self.client = docker.from_env()
        self.config = self._load_config()
        self.network_name = self.config['network']['name']
        
    def _load_config(self) -> Dict[str, Any]:
        """Charger la configuration depuis le fichier JSON"""
        config_path = Path(__file__).parent.parent / 'config' / 'ports.json'
        with open(config_path, 'r') as f:
            return json.load(f)
    
    def ensure_network_exists(self) -> bool:
        """S'assurer que le réseau Docker existe"""
        try:
            # Vérifier si le réseau existe déjà
            try:
                network = self.client.networks.get(self.network_name)
                print(f"Réseau existant trouvé: {self.network_name}")
                return True
            except docker.errors.NotFound:
                pass
            
            # Créer le réseau s'il n'existe pas
            print(f"Création du réseau Docker: {self.network_name}")
            self.client.networks.create(
                name=self.network_name,
                driver=self.config['network']['driver']
            )
            print(f"Réseau créé avec succès: {self.network_name}")
            return True
            
        except Exception as e:
            print(f"Erreur lors de la création du réseau: {str(e)}")
            return False
    
    def get_available_port(self) -> Optional[int]:
        """Trouver un port disponible dans la plage configurée"""
        start_port = self.config['port_range']['start']
        end_port = self.config['port_range']['end']
        
        # Récupérer tous les conteneurs en cours d'exécution
        containers = self.client.containers.list()
        used_ports = set()
        
        for container in containers:
            try:
                # Récupérer les ports exposés
                ports = container.attrs['NetworkSettings']['Ports']
                if ports:
                    for port_mapping in ports.values():
                        if port_mapping:
                            for mapping in port_mapping:
                                host_port = int(mapping['HostPort'])
                                if start_port <= host_port <= end_port:
                                    used_ports.add(host_port)
            except Exception as e:
                print(f"Erreur lors de la récupération des ports du conteneur {container.name}: {str(e)}")
                continue
        
        # Trouver le premier port disponible
        for port in range(start_port, end_port + 1):
            if port not in used_ports:
                return port
        
        return None
    
    def generate_admin_password(self, length: int = 16) -> str:
        """Générer un mot de passe admin sécurisé"""
        characters = string.ascii_letters + string.digits + "!@#$%^&*"
        return ''.join(random.choice(characters) for _ in range(length))
    
    def wait_for_container_health(self, container_name: str, timeout: int = 300) -> bool:
        """Attendre que le conteneur soit en cours d'exécution"""
        start_time = time.time()
        
        while time.time() - start_time < timeout:
            try:
                container = self.client.containers.get(container_name)
                
                # Vérifier que le conteneur est running
                if container.status == 'running':
                    print(f"Conteneur {container_name} est en cours d'exécution")
                    return True
                elif container.status == 'exited':
                    print(f"Conteneur {container_name} s'est arrêté")
                    return False
                
                time.sleep(5)
            except Exception as e:
                print(f"Erreur lors de la vérification du conteneur {container_name}: {str(e)}")
                time.sleep(5)
        
        print(f"Timeout atteint pour le conteneur {container_name}")
        return False
    
    def get_container_info(self, container_name: str) -> Optional[Dict[str, Any]]:
        """Récupérer les informations d'un conteneur"""
        try:
            container = self.client.containers.get(container_name)
            return {
                'id': container.id,
                'name': container.name,
                'status': container.status,
                'ports': container.attrs['NetworkSettings']['Ports'],
                'ip': container.attrs['NetworkSettings']['Networks'].get(self.network_name, {}).get('IPAddress')
            }
        except Exception as e:
            print(f"Erreur lors de la récupération des informations du conteneur {container_name}: {str(e)}")
            return None
    
    def cleanup_old_containers(self, max_age_hours: int = 24) -> int:
        """Nettoyer les anciens conteneurs Keycloak"""
        try:
            containers = self.client.containers.list(all=True)
            prefix = self.config['keycloak']['container_prefix']
            cleaned_count = 0
            
            for container in containers:
                if container.name.startswith(prefix):
                    # Vérifier l'âge du conteneur
                    created_time = container.attrs['Created']
                    age_hours = (time.time() - created_time) / 3600
                    
                    if age_hours > max_age_hours:
                        try:
                            container.remove(force=True)
                            print(f"Conteneur supprimé: {container.name}")
                            cleaned_count += 1
                        except Exception as e:
                            print(f"Erreur lors de la suppression du conteneur {container.name}: {str(e)}")
            
            return cleaned_count
        except Exception as e:
            print(f"Erreur lors du nettoyage des conteneurs: {str(e)}")
            return 0 
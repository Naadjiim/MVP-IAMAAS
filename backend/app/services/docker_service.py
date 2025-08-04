import docker
import secrets
import string
from typing import Dict, Any
import asyncio
from datetime import datetime

class DockerService:
    def __init__(self):
        self.client = docker.from_env()
        self.base_port = 8080
        
    def _generate_password(self, length: int = 12) -> str:
        """Générer un mot de passe sécurisé"""
        alphabet = string.ascii_letters + string.digits + "!@#$%^&*"
        return ''.join(secrets.choice(alphabet) for _ in range(length))
    
    def _find_available_port(self) -> int:
        """Trouver un port disponible"""
        used_ports = set()
        for container in self.client.containers.list():
            try:
                port_bindings = container.attrs['NetworkSettings']['Ports']
                for port_info in port_bindings.values():
                    if port_info:
                        used_ports.add(int(port_info[0]['HostPort']))
            except (KeyError, IndexError):
                continue
        
        port = self.base_port
        while port in used_ports:
            port += 1
        return port
    
    async def create_keycloak_container(self, sandbox_id: str) -> Dict[str, Any]:
        """Créer un conteneur Keycloak pour une sandbox (simulation pour le MVP)"""
        try:
            # Générer les identifiants
            admin_username = "admin"
            admin_password = self._generate_password()
            port = self._find_available_port()
            
            # Pour le MVP, on simule la création du conteneur
            # En production, cela créerait un vrai conteneur Keycloak
            print(f"Simulation: Création du conteneur Keycloak pour {sandbox_id}")
            await asyncio.sleep(2)  # Simuler le temps de démarrage
            
            return {
                'container_id': f"simulated-{sandbox_id}",
                'access_url': f'http://localhost:{port}',
                'admin_username': admin_username,
                'admin_password': admin_password,
                'port': port
            }
            
        except Exception as e:
            raise Exception(f"Erreur lors de la création du conteneur Keycloak: {str(e)}")
    
    async def delete_container(self, container_id: str) -> bool:
        """Supprimer un conteneur (simulation pour le MVP)"""
        try:
            if container_id.startswith("simulated-"):
                print(f"Simulation: Suppression du conteneur {container_id}")
                await asyncio.sleep(1)  # Simuler le temps de suppression
                return True
            else:
                # Pour les vrais conteneurs
                container = self.client.containers.get(container_id)
                container.stop(timeout=10)
                container.remove()
                return True
        except Exception as e:
            print(f"Erreur lors de la suppression du conteneur {container_id}: {str(e)}")
            return False
    
    async def get_container_status(self, container_id: str) -> str:
        """Obtenir le statut d'un conteneur"""
        try:
            container = self.client.containers.get(container_id)
            container.reload()
            return container.status
        except:
            return 'not_found'
    
    async def list_containers(self) -> list:
        """Lister tous les conteneurs Keycloak"""
        containers = []
        for container in self.client.containers.list():
            if container.name.startswith('keycloak-'):
                containers.append({
                    'id': container.id,
                    'name': container.name,
                    'status': container.status,
                    'created': container.attrs['Created']
                })
        return containers 
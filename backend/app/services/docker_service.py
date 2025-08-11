"""
Service pour la gestion des conteneurs Docker IAM
Utilise le gestionnaire modulaire pour créer et gérer les sandboxes
"""

import asyncio
import json
import subprocess
from pathlib import Path
from typing import Dict, Any, Optional
from datetime import datetime, timedelta

class DockerService:
    """Service pour la gestion des conteneurs Docker IAM"""
    
    def __init__(self):
        # Chemin vers les scripts d'infrastructure
        self.infra_path = Path('/app/infra')
        self.manager_script = self.infra_path / 'scripts' / 'iam_software_manager.py'
        self.config_path = self.infra_path / 'config' / 'software_config.json'
        
    async def create_iam_sandbox(self, software_type: str, sandbox_id: str, 
                                name: str, duration_hours: int, 
                                version: Optional[str] = None) -> Dict[str, Any]:
        """
        Créer une sandbox IAM avec le gestionnaire modulaire
        
        Args:
            software_type: Type de logiciel IAM (keycloak, sailpoint, okta, azure-ad)
            sandbox_id: ID unique de la sandbox
            name: Nom de la sandbox
            duration_hours: Durée en heures
            version: Version du logiciel (optionnel)
            
        Returns:
            Dict contenant les informations de la sandbox créée
        """
        try:
            # Construire la commande
            cmd = [
                'python3', str(self.manager_script),
                'create',
                '--software-type', software_type,
                '--name', name,
                '--duration', str(duration_hours)
            ]
            
            if version:
                cmd.extend(['--version', version])
            
            # Exécuter la commande
            process = await asyncio.create_subprocess_exec(
                *cmd,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE
            )
            
            stdout, stderr = await process.communicate()
            
            if process.returncode != 0:
                error_msg = stderr.decode().strip()
                raise Exception(f"Erreur lors de la création de la sandbox: {error_msg}")
            
            # Parser la sortie pour extraire les informations
            output = stdout.decode().strip()
            sandbox_info = self._parse_sandbox_output(output, software_type, sandbox_id)
            
            return sandbox_info
            
        except Exception as e:
            raise Exception(f"Erreur lors de la création de la sandbox {software_type}: {str(e)}")
    
    async def delete_iam_sandbox(self, container_name: str) -> bool:
        """
        Supprimer une sandbox IAM
        
        Args:
            container_name: Nom du conteneur à supprimer
            
        Returns:
            True si la suppression a réussi
        """
        try:
            cmd = [
                'python3', str(self.manager_script),
                'delete',
                '--container-name', container_name
            ]
            
            process = await asyncio.create_subprocess_exec(
                *cmd,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE
            )
            
            stdout, stderr = await process.communicate()
            
            if process.returncode != 0:
                error_msg = stderr.decode().strip()
                print(f"⚠️  Erreur lors de la suppression: {error_msg}")
                return False
            
            return True
            
        except Exception as e:
            print(f"❌ Erreur lors de la suppression de {container_name}: {str(e)}")
            return False
    
    async def list_iam_sandboxes(self) -> list:
        """
        Lister toutes les sandboxes IAM actives
        
        Returns:
            Liste des sandboxes actives
        """
        try:
            cmd = [
                'python3', str(self.manager_script),
                'list'
            ]
            
            process = await asyncio.create_subprocess_exec(
                *cmd,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE
            )
            
            stdout, stderr = await process.communicate()
            
            if process.returncode != 0:
                error_msg = stderr.decode().strip()
                print(f"⚠️  Erreur lors du listing: {error_msg}")
                return []
            
            # Parser la sortie
            output = stdout.decode().strip()
            return self._parse_list_output(output)
            
        except Exception as e:
            print(f"❌ Erreur lors du listing des sandboxes: {str(e)}")
            return []
    
    async def get_supported_software_types(self) -> Dict[str, str]:
        """
        Récupérer la liste des logiciels IAM supportés
        
        Returns:
            Dict des logiciels supportés
        """
        try:
            cmd = [
                'python3', str(self.manager_script),
                'software-list'
            ]
            
            process = await asyncio.create_subprocess_exec(
                *cmd,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE
            )
            
            stdout, stderr = await process.communicate()
            
            if process.returncode != 0:
                error_msg = stderr.decode().strip()
                print(f"⚠️  Erreur lors du listing des logiciels: {error_msg}")
                return {}
            
            # Parser la sortie
            output = stdout.decode().strip()
            return self._parse_software_list_output(output)
            
        except Exception as e:
            print(f"❌ Erreur lors du listing des logiciels: {str(e)}")
            return {}
    
    def _parse_sandbox_output(self, output: str, software_type: str, sandbox_id: str) -> Dict[str, Any]:
        """Parser la sortie de création de sandbox"""
        lines = output.split('\n')
        sandbox_info = {
            'sandbox_id': sandbox_id,
            'software_type': software_type,
            'status': 'running',
            'created_at': int(datetime.now().timestamp()),
            'expires_at': int((datetime.now() + timedelta(hours=24)).timestamp())
        }
        
        for line in lines:
            line = line.strip()
            if 'URL:' in line:
                sandbox_info['access_url'] = line.split('URL:')[1].strip()
            elif 'Admin:' in line:
                admin_info = line.split('Admin:')[1].strip()
                username, password = admin_info.split(' / ')
                sandbox_info['admin_username'] = username.strip()
                sandbox_info['admin_password'] = password.strip()
            elif 'Port:' in line:
                sandbox_info['port'] = int(line.split('Port:')[1].strip())
            elif 'Container:' in line:
                sandbox_info['container_id'] = line.split('Container:')[1].strip()
        
        return sandbox_info
    
    def _parse_list_output(self, output: str) -> list:
        """Parser la sortie de listing des sandboxes"""
        sandboxes = []
        lines = output.split('\n')
        
        for line in lines:
            line = line.strip()
            if line.startswith('- ') and ':' in line:
                name, status = line[2:].split(': ', 1)
                sandboxes.append({
                    'name': name,
                    'status': status
                })
        
        return sandboxes
    
    def _parse_software_list_output(self, output: str) -> Dict[str, str]:
        """Parser la sortie de listing des logiciels"""
        software_types = {}
        lines = output.split('\n')
        
        for line in lines:
            line = line.strip()
            if line.startswith('- ') and ':' in line:
                software_id, software_name = line[2:].split(': ', 1)
                software_types[software_id] = software_name
        
        return software_types
    
    # Méthodes de compatibilité pour l'ancien système Keycloak
    async def create_keycloak_container(self, sandbox_id: str, name: str, 
                                       duration_hours: int) -> Dict[str, Any]:
        """Créer un conteneur Keycloak (compatibilité)"""
        try:
            # Utiliser l'ancien script qui fonctionne
            cmd = [
                'python3', str(self.infra_path / 'scripts' / 'create_sandbox.py'),
                '--sandbox-id', sandbox_id,
                '--name', name,
                '--duration', str(duration_hours)
            ]
            
            process = await asyncio.create_subprocess_exec(
                *cmd,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE
            )
            
            stdout, stderr = await process.communicate()
            
            if process.returncode != 0:
                error_msg = stderr.decode().strip()
                raise Exception(f"Erreur lors de la création: {error_msg}")
            
            # Parser la sortie de l'ancien script
            output = stdout.decode().strip()
            return self._parse_old_sandbox_output(output, sandbox_id)
            
        except Exception as e:
            raise Exception(f"Erreur lors de la création du conteneur Keycloak: {str(e)}")
    
    async def get_keycloak_admin_password(self, container_name: str) -> Optional[str]:
        """Récupérer le mot de passe admin depuis le conteneur Keycloak"""
        try:
            import docker
            client = docker.from_env()
            container = client.containers.get(container_name)
            
            # Récupérer toutes les variables d'environnement
            result = container.exec_run('env')
            
            if result.exit_code == 0:
                env_output = result.output.decode('utf-8')
                for line in env_output.split('\n'):
                    if line.startswith('KEYCLOAK_ADMIN_PASSWORD='):
                        admin_password = line.split('=', 1)[1]
                        return admin_password
            
            return None
        except Exception:
            return None

    def _parse_old_sandbox_output(self, output: str, sandbox_id: str) -> Dict[str, Any]:
        """Parser la sortie de l'ancien script de création"""
        # L'ancien script retourne un JSON
        try:
            import json
            result = json.loads(output)
            
            # Vérifier que le mot de passe est bien présent
            admin_password = result.get('admin_password')
            if not admin_password or admin_password == 'admin':
                # Essayer de récupérer le mot de passe depuis le conteneur
                container_name = result.get('container_name', f'iamaas-keycloak-{sandbox_id}')
                try:
                    import docker
                    client = docker.from_env()
                    container = client.containers.get(container_name)
                    
                    # Récupérer toutes les variables d'environnement
                    result_exec = container.exec_run('env')
                    
                    if result_exec.exit_code == 0:
                        env_output = result_exec.output.decode('utf-8')
                        for line in env_output.split('\n'):
                            if line.startswith('KEYCLOAK_ADMIN_PASSWORD='):
                                admin_password = line.split('=', 1)[1]
                                break
                except Exception:
                    # En cas d'erreur, garder le mot de passe par défaut
                    pass
            
            # Construire l'URL dynamique avec le bon port
            port = result.get('port', 8080)
            access_url = result.get('access_url', f'http://localhost:{port}')
            
            return {
                'container_id': result.get('container_id', f'iamaas-keycloak-{sandbox_id}'),
                'container_name': result.get('container_name', f'iamaas-keycloak-{sandbox_id}'),
                'access_url': access_url,
                'admin_username': result.get('admin_username', 'admin'),
                'admin_password': admin_password or 'admin',
                'port': port
            }
        except json.JSONDecodeError:
            # Fallback si le JSON n'est pas valide
            # Essayer de récupérer le port depuis le conteneur Docker
            try:
                import docker
                client = docker.from_env()
                container_name = f'iamaas-keycloak-{sandbox_id}'
                container = client.containers.get(container_name)
                
                # Récupérer le port mappé
                ports = container.ports.get('8080/tcp', [])
                if ports:
                    host_port = ports[0]['HostPort']
                    access_url = f'http://localhost:{host_port}'
                else:
                    access_url = f'http://localhost:8080'
            except Exception:
                access_url = f'http://localhost:8080'
            
            return {
                'container_id': f'iamaas-keycloak-{sandbox_id}',
                'container_name': f'iamaas-keycloak-{sandbox_id}',
                'access_url': access_url,
                'admin_username': 'admin',
                'admin_password': 'admin',
                'port': 8080
            }
    
    async def delete_keycloak_container(self, container_name: str) -> bool:
        """Supprimer un conteneur Keycloak (compatibilité)"""
        try:
            # Utiliser l'ancien script qui fonctionne
            cmd = [
                'python3', str(self.infra_path / 'scripts' / 'delete_sandbox.py'),
                '--container-name', container_name
            ]
            
            process = await asyncio.create_subprocess_exec(
                *cmd,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE
            )
            
            stdout, stderr = await process.communicate()
            
            if process.returncode != 0:
                error_msg = stderr.decode().strip()
                print(f"⚠️  Erreur lors de la suppression: {error_msg}")
                return False
            
            return True
            
        except Exception as e:
            print(f"❌ Erreur lors de la suppression: {str(e)}")
            return False 
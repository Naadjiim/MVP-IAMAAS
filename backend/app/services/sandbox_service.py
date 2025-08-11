from typing import List, Optional
from sqlalchemy.orm import Session
from app.models.sandbox import Sandbox
from app.services.docker_service import DockerService
import logging

logger = logging.getLogger(__name__)

class SandboxService:
    @staticmethod
    def get_all_sandboxes(db: Session) -> List[Sandbox]:
        """Récupère toutes les sandboxes"""
        return db.query(Sandbox).order_by(Sandbox.created_at.desc()).all()
    
    @staticmethod
    def get_sandbox_by_id(db: Session, sandbox_id: str) -> Optional[Sandbox]:
        """Récupère une sandbox par son ID"""
        return db.query(Sandbox).filter(Sandbox.id == sandbox_id).first()
    
    @staticmethod
    def get_sandboxes_by_user_id(db: Session, user_id: str) -> List[Sandbox]:
        """Récupère toutes les sandboxes d'un utilisateur"""
        return db.query(Sandbox).filter(Sandbox.user_id == user_id).order_by(Sandbox.created_at.desc()).all()
    
    @staticmethod
    async def delete_sandbox(db: Session, sandbox_id: str) -> bool:
        """Supprime une sandbox et son conteneur Docker"""
        sandbox = db.query(Sandbox).filter(Sandbox.id == sandbox_id).first()
        if sandbox:
            try:
                # Supprimer le conteneur Docker
                if sandbox.container_name:
                    try:
                        docker_service = DockerService()
                        
                        # Déterminer le type de logiciel pour utiliser la bonne méthode de suppression
                        if sandbox.software_type_id:
                            # Utiliser la méthode générique pour les nouveaux types de logiciels
                            await docker_service.delete_iam_sandbox(sandbox.container_name)
                        else:
                            # Fallback pour les anciennes sandboxes Keycloak
                            await docker_service.delete_keycloak_container(sandbox.container_name)
                            
                        logger.info(f"Conteneur Docker supprimé: {sandbox.container_name}")
                    except Exception as e:
                        logger.warning(f"Erreur lors de la suppression du conteneur {sandbox.container_name}: {str(e)}")
                        # Continuer même si la suppression du conteneur échoue
                
                # Supprimer l'enregistrement de la base de données
                db.delete(sandbox)
                db.commit()
                logger.info(f"Sandbox supprimée de la base de données: {sandbox.name}")
                return True
                
            except Exception as e:
                logger.error(f"Erreur lors de la suppression de la sandbox: {str(e)}")
                db.rollback()
                return False
        return False 
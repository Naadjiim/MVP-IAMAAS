from typing import List, Optional
from sqlalchemy.orm import Session
from app.models.sandbox import Sandbox

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
    def delete_sandbox(db: Session, sandbox_id: str) -> bool:
        """Supprime une sandbox"""
        sandbox = db.query(Sandbox).filter(Sandbox.id == sandbox_id).first()
        if sandbox:
            db.delete(sandbox)
            db.commit()
            return True
        return False 
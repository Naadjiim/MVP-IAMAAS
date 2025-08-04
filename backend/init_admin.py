#!/usr/bin/env python3
"""
Script pour initialiser l'utilisateur admin par défaut
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.database import SessionLocal
from app.services.user_service import UserService

def init_admin():
    """Initialise l'utilisateur admin par défaut"""
    db = SessionLocal()
    try:
        admin_user = UserService.create_admin_user(db)
        print(f"✅ Utilisateur admin créé avec succès:")
        print(f"   Email: {admin_user.email}")
        print(f"   Nom: {admin_user.name}")
        print(f"   Rôle: {admin_user.role.value}")
        print(f"   ID: {admin_user.id}")
    except Exception as e:
        print(f"❌ Erreur lors de la création de l'admin: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    print("🚀 Initialisation de l'utilisateur admin...")
    init_admin()
    print("✅ Script terminé!") 
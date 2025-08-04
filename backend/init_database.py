#!/usr/bin/env python3
"""
Script d'initialisation de la base de données avec la nouvelle architecture
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.database import SessionLocal
from app.services.role_service import RoleService
from app.services.software_type_service import SoftwareTypeService
from app.services.pricing_service import PricingService
from app.services.user_service import UserService

def init_database():
    """Initialise la base de données avec les données par défaut"""
    db = SessionLocal()
    try:
        print("🚀 Initialisation de la base de données...")
        
        # 1. Créer les rôles par défaut
        print("📋 Création des rôles...")
        admin_role = RoleService.get_or_create_admin_role(db)
        customer_role = RoleService.get_or_create_customer_role(db)
        print(f"   ✅ Rôle admin créé: {admin_role.name}")
        print(f"   ✅ Rôle customer créé: {customer_role.name}")
        
        # 2. Créer les types de logiciels par défaut
        print("💻 Création des types de logiciels...")
        keycloak_type = SoftwareTypeService.get_or_create_keycloak_software_type(db)
        print(f"   ✅ Type Keycloak créé: {keycloak_type.name} (${keycloak_type.base_price_per_hour}/h)")
        
        # 3. Créer les tarifs par défaut
        print("💰 Création des tarifs...")
        pricing_list = PricingService.create_default_pricing_for_keycloak(db)
        print(f"   ✅ {len(pricing_list)} tarifs créés pour Keycloak")
        
        # 4. Créer l'utilisateur admin
        print("👤 Création de l'utilisateur admin...")
        admin_user = UserService.create_admin_user(db)
        print(f"   ✅ Admin créé: {admin_user.email}")
        
        print("✅ Initialisation terminée avec succès!")
        
    except Exception as e:
        print(f"❌ Erreur lors de l'initialisation : {e}")
        raise
    finally:
        db.close()

if __name__ == "__main__":
    init_database() 
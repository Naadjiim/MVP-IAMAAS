#!/usr/bin/env python3
"""
Migration pour ajouter le support multi-logiciels IAM
"""

import asyncio
import json
from sqlalchemy import text
from app.database import get_db

async def migrate_sandbox_table():
    """Ajouter les nouveaux champs à la table sandboxes"""
    db = next(get_db())
    
    try:
        # Ajouter les nouveaux champs
        migrations = [
            "ALTER TABLE sandboxes ADD COLUMN IF NOT EXISTS container_name VARCHAR",
            "ALTER TABLE sandboxes ADD COLUMN IF NOT EXISTS port INTEGER",
            "ALTER TABLE sandboxes ADD COLUMN IF NOT EXISTS software_version VARCHAR",
            "ALTER TABLE sandboxes ADD COLUMN IF NOT EXISTS sandbox_metadata JSONB"
        ]
        
        for migration in migrations:
            db.execute(text(migration))
            print(f"✅ Migration exécutée: {migration}")
        
        db.commit()
        print("✅ Migration sandboxes terminée")
        
    except Exception as e:
        db.rollback()
        print(f"❌ Erreur lors de la migration sandboxes: {e}")
        raise

async def migrate_software_type_table():
    """Ajouter les nouveaux champs à la table software_types"""
    db = next(get_db())
    
    try:
        # Ajouter les nouveaux champs
        migrations = [
            "ALTER TABLE software_types ADD COLUMN IF NOT EXISTS display_name VARCHAR",
            "ALTER TABLE software_types ADD COLUMN IF NOT EXISTS category VARCHAR",
            "ALTER TABLE software_types ADD COLUMN IF NOT EXISTS default_version VARCHAR",
            "ALTER TABLE software_types ADD COLUMN IF NOT EXISTS supported_versions JSONB",
            "ALTER TABLE software_types ADD COLUMN IF NOT EXISTS docker_image VARCHAR",
            "ALTER TABLE software_types ADD COLUMN IF NOT EXISTS default_port INTEGER",
            "ALTER TABLE software_types ADD COLUMN IF NOT EXISTS access_url_pattern VARCHAR",
            "ALTER TABLE software_types ADD COLUMN IF NOT EXISTS admin_username VARCHAR"
        ]
        
        for migration in migrations:
            db.execute(text(migration))
            print(f"✅ Migration exécutée: {migration}")
        
        # Mettre à jour les types de logiciels existants
        await update_existing_software_types(db)
        
        db.commit()
        print("✅ Migration software_types terminée")
        
    except Exception as e:
        db.rollback()
        print(f"❌ Erreur lors de la migration software_types: {e}")
        raise

async def update_existing_software_types(db):
    """Mettre à jour les types de logiciels existants avec les nouvelles données"""
    
    # Configuration des logiciels IAM
    software_configs = {
        "keycloak": {
            "display_name": "Keycloak",
            "category": "IAM",
            "default_version": "23.0.3",
            "supported_versions": ["20.0.5", "21.1.2", "22.0.5", "23.0.3"],
            "docker_image": "quay.io/keycloak/keycloak:23.0.3",
            "default_port": 8080,
            "access_url_pattern": "http://localhost:{port}/admin/master/console/",
            "admin_username": "admin"
        },
        "sailpoint": {
            "display_name": "SailPoint IdentityIQ",
            "category": "IAM",
            "default_version": "8.4",
            "supported_versions": ["8.3", "8.4", "8.5"],
            "docker_image": "sailpoint/identityiq:8.4",
            "default_port": 8080,
            "access_url_pattern": "http://localhost:{port}/identityiq/",
            "admin_username": "admin"
        },
        "okta": {
            "display_name": "Okta Developer Console",
            "category": "SSO",
            "default_version": "latest",
            "supported_versions": ["latest"],
            "docker_image": "okta/okta-developer-console:latest",
            "default_port": 3000,
            "access_url_pattern": "http://localhost:{port}/",
            "admin_username": "admin"
        },
        "azure_ad": {
            "display_name": "Azure AD B2C",
            "category": "SSO",
            "default_version": "latest",
            "supported_versions": ["latest"],
            "docker_image": "microsoft/azure-ad-b2c:latest",
            "default_port": 3000,
            "access_url_pattern": "http://localhost:{port}/",
            "admin_username": "admin"
        }
    }
    
    for software_id, config in software_configs.items():
        try:
            # Vérifier si le logiciel existe
            result = db.execute(
                text("SELECT id FROM software_types WHERE id = :id"),
                {"id": software_id}
            ).fetchone()
            
            if result:
                # Mettre à jour le logiciel existant
                update_query = """
                UPDATE software_types SET
                    display_name = :display_name,
                    category = :category,
                    default_version = :default_version,
                    supported_versions = :supported_versions,
                    docker_image = :docker_image,
                    default_port = :default_port,
                    access_url_pattern = :access_url_pattern,
                    admin_username = :admin_username
                WHERE id = :id
                """
                
                db.execute(text(update_query), {
                    "id": software_id,
                    "display_name": config["display_name"],
                    "category": config["category"],
                    "default_version": config["default_version"],
                    "supported_versions": json.dumps(config["supported_versions"]),
                    "docker_image": config["docker_image"],
                    "default_port": config["default_port"],
                    "access_url_pattern": config["access_url_pattern"],
                    "admin_username": config["admin_username"]
                })
                
                print(f"✅ Logiciel mis à jour: {software_id}")
            else:
                # Créer un nouveau logiciel
                insert_query = """
                INSERT INTO software_types (
                    id, name, display_name, description, category, base_price_per_hour,
                    default_version, supported_versions, docker_image, default_port,
                    access_url_pattern, admin_username
                ) VALUES (
                    :id, :name, :display_name, :description, :category, :base_price_per_hour,
                    :default_version, :supported_versions, :docker_image, :default_port,
                    :access_url_pattern, :admin_username
                )
                """
                
                db.execute(text(insert_query), {
                    "id": software_id,
                    "name": software_id,
                    "display_name": config["display_name"],
                    "description": f"Sandbox {config['display_name']} pour tests et développement",
                    "category": config["category"],
                    "base_price_per_hour": 1.0,
                    "default_version": config["default_version"],
                    "supported_versions": json.dumps(config["supported_versions"]),
                    "docker_image": config["docker_image"],
                    "default_port": config["default_port"],
                    "access_url_pattern": config["access_url_pattern"],
                    "admin_username": config["admin_username"]
                })
                
                print(f"✅ Nouveau logiciel créé: {software_id}")
                
        except Exception as e:
            print(f"⚠️  Erreur lors de la mise à jour de {software_id}: {e}")

async def main():
    """Exécuter toutes les migrations"""
    print("🚀 Début des migrations pour le support multi-logiciels...")
    
    try:
        await migrate_sandbox_table()
        await migrate_software_type_table()
        print("🎉 Toutes les migrations ont été exécutées avec succès!")
        
    except Exception as e:
        print(f"❌ Erreur lors des migrations: {e}")
        raise

if __name__ == "__main__":
    asyncio.run(main()) 
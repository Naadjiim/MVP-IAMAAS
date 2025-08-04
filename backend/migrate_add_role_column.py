#!/usr/bin/env python3
"""
Script de migration pour ajouter la colonne role à la table users
"""
import os
import sys
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    database_url: str = "postgresql://iamaas:iamaas@localhost:5432/iamaas"
    
    class Config:
        env_file = ".env"

def migrate_add_role_column():
    """Ajoute la colonne role à la table users"""
    settings = Settings()
    engine = create_engine(settings.database_url)
    
    try:
        with engine.connect() as conn:
            # Vérifier si la colonne existe déjà
            result = conn.execute(text("""
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name = 'users' AND column_name = 'role'
            """))
            
            if result.fetchone():
                print("✅ La colonne 'role' existe déjà dans la table 'users'")
                return
            
            # Créer l'enum si nécessaire
            conn.execute(text("""
                DO $$ 
                BEGIN
                    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'userrole') THEN
                        CREATE TYPE userrole AS ENUM ('customer', 'admin');
                    END IF;
                END $$;
            """))
            
            # Ajouter la colonne role sans valeur par défaut d'abord
            conn.execute(text("""
                ALTER TABLE users 
                ADD COLUMN role userrole
            """))
            
            # Mettre à jour les valeurs existantes
            conn.execute(text("""
                UPDATE users 
                SET role = 'customer'::userrole 
                WHERE role IS NULL
            """))
            
            # Ajouter la contrainte NOT NULL et la valeur par défaut
            conn.execute(text("""
                ALTER TABLE users 
                ALTER COLUMN role SET NOT NULL,
                ALTER COLUMN role SET DEFAULT 'customer'::userrole
            """))
            
            conn.commit()
            print("✅ Migration réussie : colonne 'role' ajoutée à la table 'users'")
            
    except Exception as e:
        print(f"❌ Erreur lors de la migration : {e}")
        raise

if __name__ == "__main__":
    migrate_add_role_column() 
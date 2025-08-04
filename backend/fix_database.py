#!/usr/bin/env python3
"""
Script simple pour corriger la base de données
"""
import os
import sys
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    database_url: str = "postgresql://iamaas:iamaas@postgres:5432/iamaas"
    
    class Config:
        env_file = ".env"

def fix_database():
    """Corrige la base de données"""
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
            
            # Ajouter la colonne role comme VARCHAR d'abord
            print("🔧 Ajout de la colonne 'role'...")
            conn.execute(text("""
                ALTER TABLE users 
                ADD COLUMN role VARCHAR(20) DEFAULT 'customer'
            """))
            
            # Mettre à jour les valeurs existantes
            print("🔧 Mise à jour des valeurs existantes...")
            conn.execute(text("""
                UPDATE users 
                SET role = 'customer' 
                WHERE role IS NULL
            """))
            
            conn.commit()
            print("✅ Migration réussie : colonne 'role' ajoutée à la table 'users'")
            
    except Exception as e:
        print(f"❌ Erreur lors de la migration : {e}")
        raise

if __name__ == "__main__":
    fix_database() 
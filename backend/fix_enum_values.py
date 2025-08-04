#!/usr/bin/env python3
"""
Script pour corriger les valeurs d'enum dans la base de données
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

def fix_enum_values():
    """Corrige les valeurs d'enum dans la base de données"""
    settings = Settings()
    engine = create_engine(settings.database_url)
    
    try:
        with engine.connect() as conn:
            print("🔧 Correction des valeurs d'enum...")
            
            # Mettre à jour les valeurs 'customer' vers 'CUSTOMER'
            conn.execute(text("""
                UPDATE users 
                SET role = 'CUSTOMER' 
                WHERE role = 'customer'
            """))
            
            # Mettre à jour les valeurs 'admin' vers 'ADMIN'
            conn.execute(text("""
                UPDATE users 
                SET role = 'ADMIN' 
                WHERE role = 'admin'
            """))
            
            # Recréer l'enum avec les bonnes valeurs
            conn.execute(text("""
                DO $$ 
                BEGIN
                    -- Supprimer l'ancien enum s'il existe
                    DROP TYPE IF EXISTS userrole CASCADE;
                    
                    -- Créer le nouvel enum avec les bonnes valeurs
                    CREATE TYPE userrole AS ENUM ('CUSTOMER', 'ADMIN');
                END $$;
            """))
            
            # Supprimer la valeur par défaut d'abord
            conn.execute(text("""
                ALTER TABLE users 
                ALTER COLUMN role DROP DEFAULT
            """))
            
            # Modifier la colonne pour utiliser le nouvel enum
            conn.execute(text("""
                ALTER TABLE users 
                ALTER COLUMN role TYPE userrole 
                USING role::text::userrole
            """))
            
            # Remettre la valeur par défaut
            conn.execute(text("""
                ALTER TABLE users 
                ALTER COLUMN role SET DEFAULT 'CUSTOMER'::userrole
            """))
            
            conn.commit()
            print("✅ Correction des valeurs d'enum terminée")
            
            # Vérifier le résultat
            result = conn.execute(text("SELECT email, role FROM users"))
            print("\n📊 État actuel de la table users:")
            for row in result:
                print(f"   {row[0]}: {row[1]}")
            
    except Exception as e:
        print(f"❌ Erreur lors de la correction : {e}")
        raise

if __name__ == "__main__":
    fix_enum_values() 
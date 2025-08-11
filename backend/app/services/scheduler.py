import asyncio
import threading
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.models.sandbox import Sandbox
from app.services.docker_service import DockerService
from app.services.email_service import EmailService
from app.services.stripe_service import StripeService
import time
import stripe
import os

# Configuration Stripe
stripe.api_key = os.getenv('STRIPE_SECRET_KEY', 'sk_test_...')

class SchedulerService:
    def __init__(self):
        self.running = False
        self.thread = None
        self.docker_service = DockerService()
        self.email_service = EmailService()
        
    def start(self):
        """Démarrer le planificateur"""
        if not self.running:
            self.running = True
            self.thread = threading.Thread(target=self._run_scheduler, daemon=True)
            self.thread.start()
            print("Planificateur démarré")
    
    def stop(self):
        """Arrêter le planificateur"""
        self.running = False
        if self.thread:
            self.thread.join()
        print("Planificateur arrêté")
    
    def _run_scheduler(self):
        """Boucle principale du planificateur"""
        while self.running:
            try:
                # Exécuter les tâches de planification
                asyncio.run(self._check_expired_sandboxes())
                asyncio.run(self._send_expiration_warnings())
                asyncio.run(self._cleanup_abandoned_payments())
                
                # Attendre 5 minutes avant la prochaine vérification
                for _ in range(300):  # 300 secondes = 5 minutes
                    if not self.running:
                        break
                    time.sleep(1)
                    
            except Exception as e:
                print(f"Erreur dans le planificateur: {str(e)}")
                time.sleep(60)  # Attendre 1 minute en cas d'erreur
    
    async def _check_expired_sandboxes(self):
        """Vérifier et nettoyer les sandboxes expirées"""
        db = SessionLocal()
        try:
            # Récupérer les sandboxes expirées
            expired_sandboxes = db.query(Sandbox).filter(
                Sandbox.expires_at <= datetime.utcnow(),
                Sandbox.status == "running"
            ).all()
            
            for sandbox in expired_sandboxes:
                try:
                    print(f"Nettoyage de la sandbox expirée: {sandbox.name} (ID: {sandbox.id})")
                    
                    # Arrêter et supprimer le conteneur
                    if sandbox.container_name:
                        try:
                            await self.docker_service.delete_keycloak_container(sandbox.container_name)
                        except Exception as e:
                            print(f"Erreur lors de la suppression du conteneur {sandbox.container_name}: {str(e)}")
                            # Continuer même si la suppression du conteneur échoue
                    
                    # Marquer comme expirée
                    sandbox.status = "expired"
                    db.commit()
                    
                    print(f"Sandbox {sandbox.name} nettoyée avec succès")
                    
                except Exception as e:
                    print(f"Erreur lors du nettoyage de la sandbox {sandbox.name}: {str(e)}")
                    db.rollback()
                    
        except Exception as e:
            print(f"Erreur lors de la vérification des sandboxes expirées: {str(e)}")
        finally:
            db.close()
    
    async def _send_expiration_warnings(self):
        """Envoyer des avertissements d'expiration"""
        db = SessionLocal()
        try:
            # Récupérer les sandboxes qui expirent dans les prochaines heures
            warning_times = [1, 6, 12]  # Heures avant expiration
            
            for hours in warning_times:
                warning_time = datetime.utcnow() + timedelta(hours=hours)
                
                # Sandboxes qui expirent dans X heures
                expiring_sandboxes = db.query(Sandbox).filter(
                    Sandbox.expires_at <= warning_time,
                    Sandbox.expires_at > datetime.utcnow(),
                    Sandbox.status == "running"
                ).all()
                
                for sandbox in expiring_sandboxes:
                    # Vérifier si on a déjà envoyé un avertissement récemment
                    # (simplification - en production, il faudrait un champ pour tracker)
                    try:
                        await self.email_service.send_sandbox_expiring_email(
                            sandbox.email,
                            sandbox.name,
                            sandbox.access_url,
                            sandbox.expires_at
                        )
                        print(f"Avertissement d'expiration envoyé pour {sandbox.name}")
                    except Exception as e:
                        print(f"Erreur lors de l'envoi de l'avertissement pour {sandbox.name}: {str(e)}")
                        
        except Exception as e:
            print(f"Erreur lors de l'envoi des avertissements d'expiration: {str(e)}")
        finally:
            db.close()
    
    async def _cleanup_abandoned_payments(self):
        """Nettoyer les intentions de paiement Stripe abandonnées"""
        try:
            # Récupérer les intentions de paiement créées il y a plus de 24h
            cutoff_time = datetime.utcnow() - timedelta(hours=24)
            cutoff_timestamp = int(cutoff_time.timestamp())
            
            # Lister les intentions de paiement (sans metadata car non supporté par l'API)
            payment_intents = stripe.PaymentIntent.list(
                created={'lt': cutoff_timestamp},
                limit=100
            )
            
            for payment_intent in payment_intents.data:
                # Vérifier si c'est une intention de paiement IAMAAS
                if (payment_intent.metadata and 
                    payment_intent.metadata.get('service') == 'iamaas_sandbox' and
                    payment_intent.status in ['requires_payment_method', 'requires_confirmation', 'requires_action']):
                    try:
                        # Annuler l'intention de paiement
                        stripe.PaymentIntent.cancel(payment_intent.id)
                        print(f"Intention de paiement abandonnée annulée: {payment_intent.id}")
                    except Exception as e:
                        print(f"Erreur lors de l'annulation de l'intention de paiement {payment_intent.id}: {str(e)}")
                        
        except Exception as e:
            print(f"Erreur lors du nettoyage des paiements abandonnés: {str(e)}")

# Instance globale du planificateur
scheduler = SchedulerService()

def start_scheduler():
    """Démarrer le planificateur"""
    scheduler.start()

def stop_scheduler():
    """Arrêter le planificateur"""
    scheduler.stop() 
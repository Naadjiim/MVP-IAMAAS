import stripe
import os
from typing import Optional, Dict, Any
from sqlalchemy.orm import Session
from app.models.sandbox import Sandbox
from app.models.user import User

# Configuration Stripe
stripe.api_key = os.getenv('STRIPE_SECRET_KEY', 'sk_test_...')  # À configurer dans les variables d'environnement

class StripeService:
    def __init__(self, db: Session):
        self.db = db

    def create_customer(self, user: User) -> str:
        """Créer un client Stripe pour un utilisateur"""
        try:
            customer = stripe.Customer.create(
                email=user.email,
                name=user.name,
                metadata={
                    'user_id': user.id
                }
            )
            return customer.id
        except Exception as e:
            raise ValueError(f"Erreur lors de la création du client Stripe: {str(e)}")

    def create_payment_intent(self, amount: float, currency: str = 'eur', customer_id: Optional[str] = None, metadata: Optional[Dict[str, str]] = None) -> Dict[str, Any]:
        """Créer une intention de paiement Stripe"""
        try:
            # Vérifier la configuration Stripe
            if not stripe.api_key or stripe.api_key == 'sk_test_...':
                raise ValueError("Clé API Stripe non configurée ou invalide")
            
            print(f"Création d'intention de paiement: amount={amount}, currency={currency}, customer_id={customer_id}")
            print(f"Métadonnées: {metadata}")
            
            payment_intent_data = {
                'amount': int(amount * 100),  # Stripe utilise les centimes
                'currency': currency,
                'automatic_payment_methods': {
                    'enabled': True,
                    'allow_redirects': 'never'
                },
                'metadata': {
                    'service': 'iamaas_sandbox'
                }
            }
            
            if customer_id:
                payment_intent_data['customer'] = customer_id
                
            if metadata:
                payment_intent_data['metadata'].update(metadata)

            print(f"Données d'intention de paiement: {payment_intent_data}")
            payment_intent = stripe.PaymentIntent.create(**payment_intent_data)
            
            return {
                'id': payment_intent.id,
                'client_secret': payment_intent.client_secret,
                'amount': payment_intent.amount,
                'currency': payment_intent.currency,
                'status': payment_intent.status
            }
        except Exception as e:
            raise ValueError(f"Erreur lors de la création de l'intention de paiement: {str(e)}")

    def confirm_payment_intent(self, payment_intent_id: str) -> Dict[str, Any]:
        """Confirmer une intention de paiement"""
        try:
            payment_intent = stripe.PaymentIntent.retrieve(payment_intent_id)
            return {
                'id': payment_intent.id,
                'status': payment_intent.status,
                'amount': payment_intent.amount,
                'currency': payment_intent.currency
            }
        except Exception as e:
            raise ValueError(f"Erreur lors de la confirmation du paiement: {str(e)}")

    def create_subscription(self, customer_id: str, price_id: str) -> str:
        """Créer un abonnement Stripe"""
        try:
            subscription = stripe.Subscription.create(
                customer=customer_id,
                items=[{'price': price_id}],
                payment_behavior='default_incomplete',
                expand=['latest_invoice.payment_intent'],
            )
            return subscription.id
        except Exception as e:
            raise ValueError(f"Erreur lors de la création de l'abonnement: {str(e)}")

    def cancel_subscription(self, subscription_id: str) -> bool:
        """Annuler un abonnement Stripe"""
        try:
            subscription = stripe.Subscription.modify(
                subscription_id,
                cancel_at_period_end=True
            )
            return True
        except Exception as e:
            raise ValueError(f"Erreur lors de l'annulation de l'abonnement: {str(e)}")

    def refund_payment(self, payment_intent_id: str, amount: Optional[int] = None) -> Dict[str, Any]:
        """Rembourser un paiement"""
        try:
            refund_data = {'payment_intent': payment_intent_id}
            if amount:
                refund_data['amount'] = amount

            refund = stripe.Refund.create(**refund_data)
            return {
                'id': refund.id,
                'status': refund.status,
                'amount': refund.amount
            }
        except Exception as e:
            raise ValueError(f"Erreur lors du remboursement: {str(e)}")

    def get_payment_intent(self, payment_intent_id: str) -> Dict[str, Any]:
        """Récupérer les détails d'une intention de paiement"""
        try:
            payment_intent = stripe.PaymentIntent.retrieve(payment_intent_id)
            return {
                'id': payment_intent.id,
                'status': payment_intent.status,
                'amount': payment_intent.amount,
                'currency': payment_intent.currency,
                'customer': payment_intent.customer,
                'created': payment_intent.created,
                'metadata': payment_intent.metadata
            }
        except Exception as e:
            raise ValueError(f"Erreur lors de la récupération du paiement: {str(e)}")

    def update_payment_intent_metadata(self, payment_intent_id: str, metadata: Dict[str, str]) -> bool:
        """Mettre à jour les métadonnées d'une intention de paiement"""
        try:
            stripe.PaymentIntent.modify(
                payment_intent_id,
                metadata=metadata
            )
            return True
        except Exception as e:
            raise ValueError(f"Erreur lors de la mise à jour des métadonnées: {str(e)}")

    def update_sandbox_payment_status(self, sandbox_id: str, payment_intent_id: str) -> Sandbox:
        """Mettre à jour le statut de paiement d'une sandbox"""
        try:
            payment_intent = stripe.PaymentIntent.retrieve(payment_intent_id)
            sandbox = self.db.query(Sandbox).filter(Sandbox.id == sandbox_id).first()
            
            if not sandbox:
                raise ValueError("Sandbox non trouvée")

            sandbox.stripe_payment_intent_id = payment_intent_id
            
            if payment_intent.status == 'succeeded':
                sandbox.payment_status = 'paid'
                sandbox.status = 'running'  # Activer la sandbox
            elif payment_intent.status == 'canceled':
                sandbox.payment_status = 'failed'
                sandbox.status = 'cancelled'
            else:
                sandbox.payment_status = 'pending'

            self.db.commit()
            self.db.refresh(sandbox)
            return sandbox
        except Exception as e:
            self.db.rollback()
            raise ValueError(f"Erreur lors de la mise à jour du statut: {str(e)}") 
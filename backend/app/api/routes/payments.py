from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from app.database import get_db
from app.services.stripe_service import StripeService
from app.services.sandbox_service import SandboxService
from app.schemas.payment import PaymentIntentCreate, PaymentIntentResponse, PaymentConfirm, PaymentStatus
from app.core.security import get_current_user
from app.models.user import User
import stripe
import os
from app.models.sandbox import Sandbox

router = APIRouter()

@router.post("/create-payment-intent", response_model=PaymentIntentResponse)
async def create_payment_intent(
    payment_data: PaymentIntentCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Créer une intention de paiement Stripe"""
    try:
        stripe_service = StripeService(db)
        
        # Vérifier que la sandbox existe et appartient à l'utilisateur
        sandbox_service = SandboxService(db)
        sandbox = sandbox_service.get_sandbox_by_id(payment_data.sandbox_id)
        
        if not sandbox or sandbox.user_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Sandbox non trouvée"
            )
        
        # Créer ou récupérer le client Stripe
        if not current_user.stripe_customer_id:
            customer_id = stripe_service.create_customer(current_user)
            current_user.stripe_customer_id = customer_id
            db.commit()
        else:
            customer_id = current_user.stripe_customer_id
        
        # Créer l'intention de paiement
        payment_intent = stripe_service.create_payment_intent(
            amount=payment_data.amount,
            currency=payment_data.currency,
            customer_id=customer_id
        )
        
        # Mettre à jour la sandbox avec l'ID de l'intention de paiement
        sandbox.stripe_payment_intent_id = payment_intent['id']
        db.commit()
        
        return PaymentIntentResponse(
            id=payment_intent['id'],
            client_secret=payment_intent['client_secret'],
            amount=payment_intent['amount'],
            currency=payment_intent['currency'],
            status=payment_intent['status']
        )
        
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erreur lors de la création du paiement: {str(e)}"
        )

@router.post("/confirm-payment", response_model=PaymentStatus)
async def confirm_payment(
    payment_data: PaymentConfirm,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Confirmer un paiement et activer la sandbox"""
    try:
        stripe_service = StripeService(db)
        
        # Vérifier que la sandbox existe et appartient à l'utilisateur
        sandbox_service = SandboxService(db)
        sandbox = sandbox_service.get_sandbox_by_id(payment_data.sandbox_id)
        
        if not sandbox or sandbox.user_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Sandbox non trouvée"
            )
        
        # Confirmer le paiement
        payment_status = stripe_service.confirm_payment_intent(payment_data.payment_intent_id)
        
        # Mettre à jour le statut de la sandbox
        updated_sandbox = stripe_service.update_sandbox_payment_status(
            payment_data.sandbox_id,
            payment_data.payment_intent_id
        )
        
        return PaymentStatus(
            payment_intent_id=payment_status['id'],
            status=payment_status['status'],
            amount=payment_status['amount'],
            currency=payment_status['currency']
        )
        
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erreur lors de la confirmation du paiement: {str(e)}"
        )

@router.get("/payment-status/{payment_intent_id}", response_model=PaymentStatus)
async def get_payment_status(
    payment_intent_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Récupérer le statut d'un paiement"""
    try:
        stripe_service = StripeService(db)
        payment_status = stripe_service.get_payment_intent(payment_intent_id)
        
        return PaymentStatus(
            payment_intent_id=payment_status['id'],
            status=payment_status['status'],
            amount=payment_status['amount'],
            currency=payment_status['currency']
        )
        
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erreur lors de la récupération du statut: {str(e)}"
        )

@router.post("/webhook")
async def stripe_webhook(request: Request, db: Session = Depends(get_db)):
    """Webhook Stripe pour les événements de paiement"""
    try:
        payload = await request.body()
        sig_header = request.headers.get('stripe-signature')
        
        # Vérifier la signature du webhook (à implémenter avec la clé secrète)
        webhook_secret = os.getenv('STRIPE_WEBHOOK_SECRET')
        
        try:
            event = stripe.Webhook.construct_event(
                payload, sig_header, webhook_secret
            )
        except ValueError as e:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid payload"
            )
        except stripe.error.SignatureVerificationError as e:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid signature"
            )
        
        # Traiter les événements
        if event['type'] == 'payment_intent.succeeded':
            payment_intent = event['data']['object']
            stripe_service = StripeService(db)
            
            # Trouver la sandbox associée à ce paiement
            sandbox = db.query(Sandbox).filter(
                Sandbox.stripe_payment_intent_id == payment_intent['id']
            ).first()
            
            if sandbox:
                stripe_service.update_sandbox_payment_status(
                    sandbox.id,
                    payment_intent['id']
                )
        
        elif event['type'] == 'payment_intent.payment_failed':
            payment_intent = event['data']['object']
            stripe_service = StripeService(db)
            
            # Trouver la sandbox associée à ce paiement
            sandbox = db.query(Sandbox).filter(
                Sandbox.stripe_payment_intent_id == payment_intent['id']
            ).first()
            
            if sandbox:
                sandbox.payment_status = 'failed'
                sandbox.status = 'cancelled'
                db.commit()
        
        return {"status": "success"}
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erreur lors du traitement du webhook: {str(e)}"
        ) 
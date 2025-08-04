from typing import Dict

class PricingService:
    """Service pour calculer les prix des sandboxes"""
    
    # Prix de base par heure (en euros)
    BASE_PRICE_PER_HOUR = 0.50
    
    # Remises selon la durée
    DISCOUNTS = {
        1: 0.0,      # 1h: pas de remise
        2: 0.05,     # 2h: 5% de remise
        4: 0.10,     # 4h: 10% de remise
        8: 0.15,     # 8h: 15% de remise
        24: 0.20,    # 24h: 20% de remise
        48: 0.25,    # 48h: 25% de remise
        72: 0.30,    # 72h: 30% de remise
    }
    
    @classmethod
    def calculate_price(cls, duration_hours: int) -> float:
        """Calcule le prix d'une sandbox selon sa durée"""
        base_price = duration_hours * cls.BASE_PRICE_PER_HOUR
        
        # Appliquer la remise selon la durée
        discount_rate = 0.0
        for duration, discount in cls.DISCOUNTS.items():
            if duration_hours <= duration:
                discount_rate = discount
                break
        
        # Si la durée est supérieure à 72h, appliquer la remise maximale
        if duration_hours > 72:
            discount_rate = cls.DISCOUNTS[72]
        
        final_price = base_price * (1 - discount_rate)
        return round(final_price, 2)
    
    @classmethod
    def get_pricing_info(cls) -> Dict:
        """Retourne les informations de pricing pour l'affichage"""
        pricing_info = []
        
        for duration, discount in cls.DISCOUNTS.items():
            base_price = duration * cls.BASE_PRICE_PER_HOUR
            final_price = base_price * (1 - discount)
            
            pricing_info.append({
                "duration_hours": duration,
                "base_price": round(base_price, 2),
                "discount_percent": int(discount * 100),
                "final_price": round(final_price, 2),
                "price_per_hour": round(final_price / duration, 2)
            })
        
        return {
            "base_price_per_hour": cls.BASE_PRICE_PER_HOUR,
            "pricing_tiers": pricing_info
        } 
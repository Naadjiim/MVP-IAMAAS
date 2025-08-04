from typing import Dict

class PricingService:
    """Service pour calculer les prix des sandboxes"""
    
    # Nouveaux prix fixes selon la durée
    PRICING_TABLE = {
        1: 0.50,
        2: 0.80,
        4: 1.20,
        8: 2.00,
        24: 4.00,
        36: 5.00,
        48: 6.00,
        72: 8.00,
    }
    
    @classmethod
    def calculate_price(cls, duration_hours: int) -> float:
        """Calcule le prix d'une sandbox selon sa durée"""
        # Trouver le prix le plus proche dans la table de prix
        available_durations = sorted(cls.PRICING_TABLE.keys())
        
        # Si la durée exacte existe, l'utiliser
        if duration_hours in cls.PRICING_TABLE:
            return cls.PRICING_TABLE[duration_hours]
        
        # Sinon, trouver la durée la plus proche
        closest_duration = min(available_durations, key=lambda x: abs(x - duration_hours))
        return cls.PRICING_TABLE[closest_duration]
    
    @classmethod
    def get_pricing_info(cls) -> Dict:
        """Retourne les informations de pricing pour l'affichage"""
        pricing_info = []
        
        for duration, price in cls.PRICING_TABLE.items():
            pricing_info.append({
                "duration_hours": duration,
                "final_price": price,
                "price_per_hour": round(price / duration, 2)
            })
        
        return {
            "pricing_tiers": pricing_info
        } 
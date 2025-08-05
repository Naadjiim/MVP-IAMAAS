from google.auth.transport import requests
from google.oauth2 import id_token
from google.auth.exceptions import GoogleAuthError
import requests as http_requests
from typing import Optional, Dict, Any
from app.core.config import settings

class GoogleAuthService:
    def __init__(self):
        self.google_client_id = getattr(settings, 'GOOGLE_CLIENT_ID', None)
    
    def verify_google_token(self, token: str) -> Optional[Dict[str, Any]]:
        """
        Vérifie un token Google ID et retourne les informations de l'utilisateur
        """
        try:
            # Vérifier le token avec Google
            idinfo = id_token.verify_oauth2_token(
                token, 
                requests.Request(), 
                self.google_client_id
            )
            
            # Extraire les informations utilisateur
            user_info = {
                'google_id': idinfo['sub'],
                'email': idinfo['email'],
                'name': idinfo.get('name', ''),
                'given_name': idinfo.get('given_name', ''),
                'family_name': idinfo.get('family_name', ''),
                'picture': idinfo.get('picture', ''),
                'email_verified': idinfo.get('email_verified', False)
            }
            
            return user_info
            
        except GoogleAuthError as e:
            print(f"Erreur de vérification Google token: {e}")
            return None
        except Exception as e:
            print(f"Erreur inattendue lors de la vérification Google token: {e}")
            return None
    
    def verify_google_token_mock(self, token: str) -> Optional[Dict[str, Any]]:
        """
        Version mock pour le MVP - simule la vérification Google
        """
        # Pour le MVP, on simule une vérification réussie
        if token.startswith('mock-google-token-'):
            return {
                'google_id': 'mock-google-123',
                'email': 'google.user@example.com',
                'name': 'Utilisateur Google',
                'given_name': 'Utilisateur',
                'family_name': 'Google',
                'picture': 'https://via.placeholder.com/150',
                'email_verified': True
            }
        return None
    
    def get_google_user_info(self, access_token: str) -> Optional[Dict[str, Any]]:
        """
        Récupère les informations utilisateur depuis l'API Google
        """
        try:
            url = "https://www.googleapis.com/oauth2/v2/userinfo"
            headers = {
                'Authorization': f'Bearer {access_token}'
            }
            
            response = http_requests.get(url, headers=headers)
            response.raise_for_status()
            
            user_info = response.json()
            return {
                'google_id': user_info['id'],
                'email': user_info['email'],
                'name': user_info.get('name', ''),
                'given_name': user_info.get('given_name', ''),
                'family_name': user_info.get('family_name', ''),
                'picture': user_info.get('picture', ''),
                'email_verified': user_info.get('verified_email', False)
            }
            
        except Exception as e:
            print(f"Erreur lors de la récupération des informations Google: {e}")
            return None 
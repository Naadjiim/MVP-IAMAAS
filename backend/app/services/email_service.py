import os
from typing import Optional
from datetime import datetime
from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail

class EmailService:
    def __init__(self):
        self.sendgrid_api_key = os.getenv('SENDGRID_API_KEY')
        self.from_email = os.getenv('FROM_EMAIL', 'noreply@iamaas.com')
        self.from_name = os.getenv('FROM_NAME', 'IAMAAS Platform')
        
    async def send_sandbox_created_email(
        self, 
        to_email: str, 
        sandbox_name: str, 
        access_url: str, 
        admin_username: str, 
        admin_password: str, 
        expires_at: datetime
    ) -> bool:
        """Envoyer un email de notification de création de sandbox"""
        if not self.sendgrid_api_key:
            print("SENDGRID_API_KEY non configurée, email non envoyé")
            return False
            
        try:
            subject = f"Votre sandbox IAM '{sandbox_name}' est prête !"
            
            html_content = f"""
            <html>
            <body>
                <h2>🧩 Votre environnement IAM sandbox est prêt !</h2>
                
                <p>Bonjour,</p>
                
                <p>Votre sandbox Keycloak <strong>{sandbox_name}</strong> a été créée avec succès.</p>
                
                <h3>🔗 Accès à votre sandbox :</h3>
                <p><a href="{access_url}" style="background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Accéder à Keycloak</a></p>
                
                <h3>🔑 Identifiants d'administration :</h3>
                <ul>
                    <li><strong>Nom d'utilisateur :</strong> {admin_username}</li>
                    <li><strong>Mot de passe :</strong> {admin_password}</li>
                </ul>
                
                <h3>⏰ Expiration :</h3>
                <p>Votre sandbox expirera automatiquement le <strong>{expires_at.strftime('%d/%m/%Y à %H:%M')}</strong></p>
                
                <div style="background-color: #f3f4f6; padding: 16px; border-radius: 6px; margin: 20px 0;">
                    <h4>📋 Informations importantes :</h4>
                    <ul>
                        <li>Cette sandbox est temporaire et sera automatiquement supprimée à l'expiration</li>
                        <li>Ne stockez pas de données sensibles de production</li>
                        <li>Pour prolonger la durée, contactez l'administrateur</li>
                    </ul>
                </div>
                
                <p>Cordialement,<br>L'équipe IAMAAS</p>
            </body>
            </html>
            """
            
            text_content = f"""
            Votre environnement IAM sandbox est prêt !
            
            Nom de la sandbox : {sandbox_name}
            URL d'accès : {access_url}
            
            Identifiants d'administration :
            - Nom d'utilisateur : {admin_username}
            - Mot de passe : {admin_password}
            
            Expiration : {expires_at.strftime('%d/%m/%Y à %H:%M')}
            
            Cette sandbox est temporaire et sera automatiquement supprimée à l'expiration.
            """
            
            message = Mail(
                from_email=(self.from_email, self.from_name),
                to_emails=to_email,
                subject=subject,
                html_content=html_content,
                plain_text_content=text_content
            )
            
            sg = SendGridAPIClient(api_key=self.sendgrid_api_key)
            response = sg.send(message)
            
            print(f"Email envoyé avec succès à {to_email}, status: {response.status_code}")
            return True
            
        except Exception as e:
            print(f"Erreur lors de l'envoi de l'email à {to_email}: {str(e)}")
            return False
    
    async def send_sandbox_expiring_email(
        self, 
        to_email: str, 
        sandbox_name: str, 
        access_url: str, 
        expires_at: datetime
    ) -> bool:
        """Envoyer un email d'alerte d'expiration"""
        if not self.sendgrid_api_key:
            return False
            
        try:
            subject = f"⚠️ Votre sandbox '{sandbox_name}' expire bientôt"
            
            html_content = f"""
            <html>
            <body>
                <h2>⚠️ Alerte d'expiration - Sandbox IAM</h2>
                
                <p>Bonjour,</p>
                
                <p>Votre sandbox Keycloak <strong>{sandbox_name}</strong> expirera le <strong>{expires_at.strftime('%d/%m/%Y à %H:%M')}</strong>.</p>
                
                <p><a href="{access_url}" style="background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Accéder à Keycloak</a></p>
                
                <p>Après expiration, toutes les données seront définitivement supprimées.</p>
                
                <p>Cordialement,<br>L'équipe IAMAAS</p>
            </body>
            </html>
            """
            
            message = Mail(
                from_email=(self.from_email, self.from_name),
                to_emails=to_email,
                subject=subject,
                html_content=html_content
            )
            
            sg = SendGridAPIClient(api_key=self.sendgrid_api_key)
            response = sg.send(message)
            
            return response.status_code == 202
            
        except Exception as e:
            print(f"Erreur lors de l'envoi de l'email d'expiration à {to_email}: {str(e)}")
            return False 
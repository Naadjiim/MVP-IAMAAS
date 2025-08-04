from jose import jwt
import uuid
from datetime import datetime, timedelta
from typing import Optional
from sqlalchemy.orm import Session
from app.models.user import User, UserRole
from app.schemas.auth import UserCreate, UserLogin
from app.core.config import settings

class AuthService:
    def __init__(self, db: Session):
        self.db = db

    def create_user(self, user_data: UserCreate) -> User:
        """Create a new user"""
        # Check if user already exists
        existing_user = self.db.query(User).filter(User.email == user_data.email).first()
        if existing_user:
            raise ValueError("User with this email already exists")

        # Create new user
        user = User(
            id=str(uuid.uuid4()),
            email=user_data.email,
            name=user_data.name,
            role=UserRole.CUSTOMER
        )
        user.set_password(user_data.password)
        
        self.db.add(user)
        self.db.commit()
        self.db.refresh(user)
        
        return user

    def authenticate_user(self, email: str, password: str) -> Optional[User]:
        """Authenticate user with email and password"""
        user = self.db.query(User).filter(User.email == email).first()
        if not user or not user.verify_password(password):
            return None
        return user

    def create_access_token(self, user: User) -> str:
        """Create JWT access token"""
        payload = {
            "sub": user.id,
            "email": user.email,
            "exp": datetime.utcnow() + timedelta(days=30)  # 30 days expiration for MVP
        }
        return jwt.encode(payload, settings.SECRET_KEY, algorithm="HS256")

    def verify_token(self, token: str) -> Optional[dict]:
        """Verify JWT token and return payload"""
        try:
            payload = jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])
            return payload
        except jwt.ExpiredSignatureError:
            return None
        except jwt.JWTError:
            return None

    def get_user_by_id(self, user_id: str) -> Optional[User]:
        """Get user by ID"""
        return self.db.query(User).filter(User.id == user_id).first()

    def get_user_by_email(self, email: str) -> Optional[User]:
        """Get user by email"""
        return self.db.query(User).filter(User.email == email).first()

    def create_google_user(self, email: str, name: str, google_id: str, avatar_url: Optional[str] = None) -> User:
        """Create or update user from Google OAuth"""
        # Check if user exists by email
        user = self.db.query(User).filter(User.email == email).first()
        
        if user:
            # Update existing user with Google info
            user.google_id = google_id
            user.avatar_url = avatar_url
            user.is_verified = True
            self.db.commit()
            self.db.refresh(user)
            return user
        
        # Create new user
        user = User(
            id=str(uuid.uuid4()),
            email=email,
            name=name,
            google_id=google_id,
            avatar_url=avatar_url,
            is_verified=True,
            role=UserRole.CUSTOMER
        )
        
        self.db.add(user)
        self.db.commit()
        self.db.refresh(user)
        
        return user 
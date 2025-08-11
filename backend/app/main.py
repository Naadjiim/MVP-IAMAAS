from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from contextlib import asynccontextmanager
import uvicorn
import logging
from datetime import datetime

from app.database import engine, Base
from app.api.routes import sandboxes, auth, admin, roles, software_types, pricing
from app.services.scheduler import start_scheduler, stop_scheduler
from app.core.config import settings
from app.core.security import rate_limit, sanitize_error_message

# Configuration des logs
logging.basicConfig(
    level=logging.INFO if not settings.DEBUG else logging.DEBUG,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    logger.info("Démarrage de l'application IAMAAS...")
    Base.metadata.create_all(bind=engine)
    start_scheduler()
    logger.info("Application IAMAAS démarrée avec succès")
    yield
    # Shutdown
    logger.info("Arrêt de l'application IAMAAS...")
    stop_scheduler()
    logger.info("Application IAMAAS arrêtée")

app = FastAPI(
    title="IAMAAS API",
    description="API pour la gestion des environnements IAM sandbox Keycloak",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs" if settings.DEBUG else None,
    redoc_url="/redoc" if settings.DEBUG else None
)

# Middleware de sécurité - Hosts de confiance
app.add_middleware(
    TrustedHostMiddleware,
    allowed_hosts=settings.ALLOWED_HOSTS
)

# Configuration CORS sécurisée
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
    expose_headers=["X-Total-Count"],
    max_age=3600,
)

# Middleware de logging des requêtes
@app.middleware("http")
async def log_requests(request: Request, call_next):
    start_time = datetime.now()
    
    # Log de la requête
    logger.info(f"Requête {request.method} {request.url} depuis {request.client.host}")
    
    response = await call_next(request)
    
    # Log de la réponse
    process_time = (datetime.now() - start_time).total_seconds()
    logger.info(f"Réponse {response.status_code} en {process_time:.3f}s")
    
    return response

# Middleware de gestion d'erreurs global
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Erreur non gérée: {str(exc)}", exc_info=True)
    
    if settings.DEBUG:
        raise exc
    else:
        return HTTPException(
            status_code=500,
            detail=sanitize_error_message("Erreur interne du serveur")
        )

# Inclusion des routes
app.include_router(auth.router, prefix="/api/v1/auth", tags=["auth"])
app.include_router(sandboxes.router, prefix="/api/v1", tags=["sandboxes"])
app.include_router(admin.router, prefix="/api/v1/admin", tags=["admin"])
app.include_router(roles.router, prefix="/api/v1/admin", tags=["roles"])
app.include_router(software_types.router, prefix="/api/v1/admin", tags=["software-types"])
app.include_router(pricing.router, prefix="/api/v1/admin", tags=["pricing"])

@app.get("/")
async def root():
    return {
        "message": "IAMAAS API - Identity Access Management as a Service",
        "version": "1.0.0",
        "status": "running",
        "timestamp": datetime.now().isoformat()
    }

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "version": "1.0.0"
    }

@app.get("/security-info")
async def security_info():
    """Endpoint pour vérifier la configuration de sécurité (admin seulement)"""
    if not settings.DEBUG:
        raise HTTPException(status_code=404, detail="Endpoint non disponible")
    
    return {
        "debug_mode": settings.DEBUG,
        "cors_origins": settings.CORS_ORIGINS,
        "allowed_hosts": settings.ALLOWED_HOSTS,
        "rate_limits": {
            "per_minute": settings.RATE_LIMIT_PER_MINUTE,
            "per_hour": settings.RATE_LIMIT_PER_HOUR
        },
        "password_policy": {
            "min_length": settings.MIN_PASSWORD_LENGTH,
            "require_special": settings.REQUIRE_SPECIAL_CHAR,
            "require_uppercase": settings.REQUIRE_UPPERCASE,
            "require_lowercase": settings.REQUIRE_LOWERCASE,
            "require_digit": settings.REQUIRE_DIGIT
        }
    }

if __name__ == "__main__":
    uvicorn.run(
        "app.main:app", 
        host="0.0.0.0", 
        port=8000, 
        reload=settings.DEBUG,
        log_level="debug" if settings.DEBUG else "info"
    ) 
"""
Aplicación principal de FastAPI para DANI-ETH.

Este es el entry point del backend. Configura:
- La aplicación FastAPI con metadata.
- CORS para permitir llamadas desde el frontend.
- Inicialización de Firebase al arrancar.
- Registro de los routers de la API.
"""
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.core.firebase import initialize_firebase
from app.api.v1.router import api_router

# Configurar logging
logging.basicConfig(
    level=logging.DEBUG if settings.app_debug else logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Eventos de ciclo de vida de la aplicación.
    Se ejecutan al iniciar y al apagar el servidor.
    """
    # --- Startup ---
    logger.info(f"Iniciando {settings.app_name} en modo {settings.app_env}")

    # Inicializar Firebase
    firebase_ok = initialize_firebase()
    if not firebase_ok:
        logger.warning(
            "Firebase no se pudo inicializar. "
            "Los endpoints protegidos no funcionarán hasta que se agreguen las credenciales."
        )
    else:
        logger.info("Firebase inicializado correctamente")

    yield  # La app corre aquí

    # --- Shutdown ---
    logger.info("Apagando aplicación")


# Crear la aplicación FastAPI
app = FastAPI(
    title=settings.app_name,
    description="Backend del orquestador inteligente de Ethical Hacking DANI-ETH",
    version="0.1.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

# Configurar CORS (debe ir antes de los routers)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Registrar el router principal de la API
app.include_router(api_router)


@app.get("/", tags=["root"])
async def root():
    """Endpoint raíz, redirige mentalmente a la documentación."""
    return {
        "message": f"Bienvenido a {settings.app_name}",
        "docs": "/docs",
        "health": "/api/v1/health",
    }

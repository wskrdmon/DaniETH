"""
Router principal de la API v1.
Agrupa todos los routers individuales y los expone con el prefijo /api/v1.
"""
from fastapi import APIRouter

from app.api.v1 import health, me

# Router principal de v1
api_router = APIRouter(prefix="/api/v1")

# Registrar routers individuales
api_router.include_router(health.router)
api_router.include_router(me.router)

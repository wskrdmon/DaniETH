# backend/app/api/v1/router.py
from fastapi import APIRouter
from app.api.v1 import health, me, auth, teams, assets

api_router = APIRouter(prefix="/api/v1")

api_router.include_router(health.router)
api_router.include_router(me.router)
api_router.include_router(auth.router)
api_router.include_router(teams.router)
api_router.include_router(assets.router)
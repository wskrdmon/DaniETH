"""
Endpoint protegido de ejemplo.

Sirve para verificar que el flujo de autenticación funciona:
1. Frontend hace login con Firebase Auth.
2. Frontend obtiene el ID Token.
3. Frontend lo envía en el header Authorization: Bearer <token>.
4. Backend valida el token y devuelve la info del usuario.
"""
from typing import Annotated

from fastapi import APIRouter, Depends
from pydantic import BaseModel

from app.core.security import get_current_user

router = APIRouter(prefix="/me", tags=["me"])


class UserResponse(BaseModel):
    """Información del usuario autenticado."""
    uid: str
    email: str | None = None
    name: str | None = None
    email_verified: bool = False


@router.get("", response_model=UserResponse)
async def get_me(user: Annotated[dict, Depends(get_current_user)]) -> UserResponse:
    """
    Devuelve la info del usuario autenticado actual.
    Requiere un token JWT válido de Firebase en el header Authorization.
    """
    return UserResponse(
        uid=user["uid"],
        email=user.get("email"),
        name=user.get("name"),
        email_verified=user.get("email_verified", False),
    )

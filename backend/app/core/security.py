"""
Dependencias de autenticación para FastAPI.

Validan el token JWT que envía Firebase en cada request,
y exponen el usuario actual a los endpoints protegidos.

Uso en un endpoint:
    from app.core.security import get_current_user

    @router.get("/protected")
    async def protected_route(user = Depends(get_current_user)):
        return {"uid": user["uid"], "email": user["email"]}
"""
import logging
from typing import Annotated

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.core.firebase import get_auth, is_firebase_ready

logger = logging.getLogger(__name__)

# Esquema Bearer para extraer el token del header Authorization
security_scheme = HTTPBearer(auto_error=False)


async def get_current_user(
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(security_scheme)]
) -> dict:
    """
    Valida el token JWT de Firebase y devuelve la info del usuario.

    Raises:
        HTTPException 401: si no hay token, está expirado o es inválido.
        HTTPException 503: si Firebase no está disponible.
    """
    if not is_firebase_ready():
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Servicio de autenticación no disponible",
        )

    if credentials is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token no proporcionado",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = credentials.credentials

    try:
        # Verificar y decodificar el token con Firebase
        decoded_token = get_auth().verify_id_token(token)
        return decoded_token
    except Exception as e:
        logger.warning(f"Token inválido: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token inválido o expirado",
            headers={"WWW-Authenticate": "Bearer"},
        )


async def get_current_user_optional(
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(security_scheme)]
) -> dict | None:
    """
    Versión opcional: si hay token lo valida, si no, devuelve None.
    Útil para endpoints que se comportan distinto según si hay usuario logueado.
    """
    if credentials is None:
        return None

    try:
        return await get_current_user(credentials)
    except HTTPException:
        return None

"""
Endpoints de autenticación del backend.

Nota de arquitectura:
- Firebase Auth maneja la creación de usuarios y los tokens JWT.
- Este módulo se encarga de persistir el perfil extendido (nombre, rol)
  en Firestore una vez que el usuario ya existe en Firebase Auth.
- El interceptor del frontend agrega el Bearer token automáticamente.
"""
from datetime import datetime, timezone
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field

from app.core.security import get_current_user
from app.core.firebase import get_firestore

router = APIRouter(prefix="/auth", tags=["auth"])

# ── Schemas ───────────────────────────────────────────────────────────────────

ALLOWED_ROLES = {"admin", "security_engineer", "pentester", "analyst", "viewer"}


class RegisterRequest(BaseModel):
    name: str = Field(..., min_length=2, max_length=255)
    role: str = Field(default="analyst")


class RegisterResponse(BaseModel):
    uid: str
    email: str | None
    name: str
    role: str
    created_at: str


class MeResponse(BaseModel):
    uid: str
    email: str | None
    name: str | None
    role: str
    email_verified: bool


# ── Endpoints ─────────────────────────────────────────────────────────────────

@router.post(
    "/register",
    response_model=RegisterResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Completar registro de perfil",
)
async def register_profile(
    body: RegisterRequest,
    user: Annotated[dict, Depends(get_current_user)],
) -> RegisterResponse:
    """
    Guarda el perfil extendido del usuario en Firestore.

    Flujo:
    1. El frontend ya creó el usuario en Firebase Auth.
    2. Este endpoint valida el token y persiste nombre + rol en Firestore.
    3. Idempotente: si el perfil ya existe, lo actualiza (merge=True).
    """
    if body.role not in ALLOWED_ROLES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Rol inválido. Opciones permitidas: {sorted(ALLOWED_ROLES)}",
        )

    uid = user["uid"]
    now = datetime.now(timezone.utc).isoformat()

    profile = {
        "uid": uid,
        "email": user.get("email"),
        "name": body.name,
        "role": body.role,
        "created_at": now,
        "updated_at": now,
    }

    try:
        db = get_firestore()
        db.collection("users").document(uid).set(profile, merge=True)
    except RuntimeError:
        # Firestore no configurado: respondemos igual para no bloquear el flujo
        pass

    return RegisterResponse(**profile)


@router.get(
    "/me/profile",
    response_model=MeResponse,
    summary="Perfil extendido del usuario actual",
)
async def get_my_profile(
    user: Annotated[dict, Depends(get_current_user)],
) -> MeResponse:
    """
    Devuelve el perfil del usuario combinando Firebase Auth + Firestore.
    """
    uid = user["uid"]
    role = "analyst"

    try:
        db = get_firestore()
        doc = db.collection("users").document(uid).get()
        if doc.exists:
            role = doc.to_dict().get("role", "analyst")
    except RuntimeError:
        pass

    return MeResponse(
        uid=uid,
        email=user.get("email"),
        name=user.get("name"),
        role=role,
        email_verified=user.get("email_verified", False),
    )
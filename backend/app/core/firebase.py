"""
Inicialización de Firebase Admin SDK.

Este módulo:
- Inicializa la conexión con Firebase usando el archivo de credenciales.
- Expone clientes para Auth y Firestore.
- Maneja el caso en que las credenciales no estén disponibles (modo degradado).
"""
import os
import logging
from pathlib import Path

import firebase_admin
from firebase_admin import credentials, auth, firestore

from app.core.config import settings

logger = logging.getLogger(__name__)

# Estado global de Firebase
_firebase_app: firebase_admin.App | None = None
_firestore_client = None


def initialize_firebase() -> bool:
    """
    Inicializa Firebase Admin SDK.

    Returns:
        True si la inicialización fue exitosa, False si las credenciales no existen.
    """
    global _firebase_app, _firestore_client

    if _firebase_app is not None:
        logger.info("Firebase ya estaba inicializado")
        return True

    cred_path = Path(settings.firebase_credentials_path)

    if not cred_path.exists():
        logger.warning(
            f"Archivo de credenciales no encontrado en {cred_path.absolute()}. "
            "Firebase no estará disponible. "
            "Descargue firebase-admin-key.json desde Firebase Console."
        )
        return False

    try:
        cred = credentials.Certificate(str(cred_path))
        _firebase_app = firebase_admin.initialize_app(cred, {
            "projectId": settings.firebase_project_id,
        })
        _firestore_client = firestore.client()
        logger.info(f"Firebase inicializado correctamente para proyecto: {settings.firebase_project_id}")
        return True
    except Exception as e:
        logger.error(f"Error inicializando Firebase: {e}")
        return False


def is_firebase_ready() -> bool:
    """Verifica si Firebase está listo para usarse."""
    return _firebase_app is not None


def get_firestore():
    """Devuelve el cliente de Firestore. Lanza error si Firebase no está inicializado."""
    if _firestore_client is None:
        raise RuntimeError(
            "Firestore no está disponible. "
            "Verificar que firebase-admin-key.json exista en backend/credentials/"
        )
    return _firestore_client


def get_auth():
    """Devuelve el módulo de Firebase Auth para validar tokens."""
    if _firebase_app is None:
        raise RuntimeError("Firebase Auth no está disponible.")
    return auth

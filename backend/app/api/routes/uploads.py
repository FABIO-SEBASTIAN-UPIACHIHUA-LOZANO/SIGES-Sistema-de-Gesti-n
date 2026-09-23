import os
import uuid
from datetime import datetime, timezone
from typing import Dict, Any, Optional
from fastapi import APIRouter, File, UploadFile, HTTPException, status
from pydantic import BaseModel

router = APIRouter()

# Directorio de almacenamiento de imágenes
UPLOAD_DIR = os.path.join(os.getcwd(), "static", "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

# Almacenamiento en memoria para sesiones de captura móvil por QR
# { session_id: { "status": "PENDING" | "COMPLETED", "photo_url": str, "created_at": datetime } }
upload_sessions: Dict[str, Dict[str, Any]] = {}

class SessionResponse(BaseModel):
    session_id: str
    status: str
    photo_url: Optional[str] = None
    created_at: str

@router.post("/file")
async def upload_file(file: UploadFile = File(...)):
    """
    Subida directa de archivos de imagen desde PC o móvil.
    """
    if not file.content_type.startswith("image/"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El archivo debe ser una imagen válida (.jpg, .png, .webp, .jpeg)"
        )
    
    ext = os.path.splitext(file.filename)[1] or ".jpg"
    filename = f"{uuid.uuid4().hex}{ext}"
    filepath = os.path.join(UPLOAD_DIR, filename)
    
    try:
        contents = await file.read()
        with open(filepath, "wb") as f:
            f.write(contents)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al guardar la imagen: {str(e)}"
        )
        
    photo_url = f"/static/uploads/{filename}"
    return {"url": photo_url, "filename": filename}

@router.post("/session/create", response_model=SessionResponse)
def create_upload_session():
    """
    Crea una sesión temporal para captura de foto mediante Código QR con celular.
    """
    session_id = uuid.uuid4().hex
    now_str = datetime.now(timezone.utc).isoformat()
    
    session_data = {
        "session_id": session_id,
        "status": "PENDING",
        "photo_url": None,
        "created_at": now_str
    }
    upload_sessions[session_id] = session_data
    return session_data

@router.get("/session/{session_id}", response_model=SessionResponse)
def get_upload_session(session_id: str):
    """
    Consulta el estado de una sesión QR en tiempo real (Polling desde la PC).
    """
    session = upload_sessions.get(session_id)
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Sesión de captura no encontrada o expirada"
        )
    return session

@router.post("/session/{session_id}/upload")
async def upload_session_photo(session_id: str, file: UploadFile = File(...)):
    """
    Endpoint público consumido desde el celular al tomar la foto y presionar 'Enviar foto'.
    """
    session = upload_sessions.get(session_id)
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Sesión de captura no encontrada o expirada"
        )
        
    if not file.content_type.startswith("image/"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El archivo enviado debe ser una imagen válida"
        )
        
    ext = os.path.splitext(file.filename)[1] or ".jpg"
    filename = f"qr_{session_id}_{uuid.uuid4().hex[:8]}{ext}"
    filepath = os.path.join(UPLOAD_DIR, filename)
    
    try:
        contents = await file.read()
        with open(filepath, "wb") as f:
            f.write(contents)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al guardar la foto del celular: {str(e)}"
        )
        
    photo_url = f"/static/uploads/{filename}"
    session["status"] = "COMPLETED"
    session["photo_url"] = photo_url
    
    return {"status": "COMPLETED", "photo_url": photo_url}

from pydantic import BaseModel, EmailStr
from typing import Optional, Dict, Any

class Token(BaseModel):
    access_token: str
    token_type: str
    user_id: int
    nombre: str
    email: str
    rol: str
    empresa_id: Optional[int] = None
    empresa_nombre: Optional[str] = None
    permisos: Optional[Dict[str, Any]] = None

class LoginRequest(BaseModel):
    email: EmailStr
    password: str
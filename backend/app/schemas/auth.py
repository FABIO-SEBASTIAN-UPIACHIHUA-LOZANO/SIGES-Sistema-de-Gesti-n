from pydantic import BaseModel, EmailStr

class Token(BaseModel):
    access_token: str
    token_type: str
    user_id: int
    nombre: str
    email: str
    rol: str

class LoginRequest(BaseModel):
    email: EmailStr
    password: str
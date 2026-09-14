from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.db.session import get_db
from app.models.product import Product
from app.schemas.product import ProductCreate, ProductUpdate, ProductResponse
from app.core.rbac import RoleChecker
from app.models.user import User
from app.services.audit_service import log_audit

router = APIRouter()

@router.get("/", response_model=List[ProductResponse])
def get_products(
    db: Session = Depends(get_db),
    current_user: User = Depends(RoleChecker(["ADMIN", "TECNICO", "VENDEDOR"]))
):
    return db.query(Product).filter(Product.activo == True).all()

@router.post("/", response_model=ProductResponse)
def create_product(
    prod_in: ProductCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(RoleChecker(["ADMIN"]))
):
    existing = db.query(Product).filter(Product.codigo == prod_in.codigo).first()
    if existing:
        raise HTTPException(status_code=400, detail="Código de producto duplicado")
        
    prod = Product(**prod_in.model_dump())
    db.add(prod)
    db.commit()
    db.refresh(prod)
    
    log_audit(db, usuario_id=current_user.id, accion="CREAR", entidad="Product", entidad_id=prod.id, descripcion=f"Producto creado: {prod.nombre}")
    return prod
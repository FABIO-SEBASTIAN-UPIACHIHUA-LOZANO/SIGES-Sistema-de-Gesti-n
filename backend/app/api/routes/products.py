from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.db.session import get_db
from app.models.product import Product
from app.schemas.product import ProductCreate, ProductUpdate, ProductResponse
from app.models.user import User
from app.api.deps import get_current_user, check_permission
from app.services.audit_service import log_audit

router = APIRouter()

@router.get("/", response_model=List[ProductResponse])
def get_products(
    db: Session = Depends(get_db),
    current_user: User = Depends(check_permission("productos", "ver"))
):
    query = db.query(Product).filter(Product.activo == True)
    if current_user.rol.nombre != "SUPERADMIN":
        query = query.filter(Product.empresa_id == current_user.empresa_id)
    return query.order_by(Product.created_at.desc()).all()

@router.post("/", response_model=ProductResponse, status_code=status.HTTP_201_CREATED)
def create_product(
    prod_in: ProductCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(check_permission("productos", "crear"))
):
    empresa_id = current_user.empresa_id or 1
    existing = db.query(Product).filter(
        Product.empresa_id == empresa_id,
        Product.codigo == prod_in.codigo
    ).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="El código de producto ya existe en su catálogo")
        
    prod = Product(**prod_in.model_dump(), empresa_id=empresa_id)
    db.add(prod)
    db.commit()
    db.refresh(prod)
    
    log_audit(
        db,
        usuario_id=current_user.id,
        empresa_id=empresa_id,
        accion="CREAR_PRODUCTO",
        entidad="Product",
        entidad_id=prod.id,
        descripcion=f"Producto creado: {prod.nombre} (Código: {prod.codigo})"
    )
    return prod
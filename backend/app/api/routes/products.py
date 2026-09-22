from fastapi import APIRouter, Depends, HTTPException, status
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

@router.put("/{product_id}", response_model=ProductResponse)
def update_product(
    product_id: int,
    prod_in: ProductUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(RoleChecker(["ADMIN"]))
):
    product = db.query(Product).filter(Product.id == product_id, Product.activo == True).first()
    if not product:
        raise HTTPException(status_code=404, detail="Producto no encontrado")

    changes = prod_in.model_dump(exclude_unset=True)
    new_code = changes.get("codigo")
    if new_code:
        duplicate = db.query(Product).filter(Product.codigo == new_code, Product.id != product_id).first()
        if duplicate:
            raise HTTPException(status_code=400, detail="Código de producto duplicado")

    # IMPLEMENTACIÓN: edición parcial siguiendo el esquema ProductUpdate.
    for field, value in changes.items():
        setattr(product, field, value)

    db.commit()
    db.refresh(product)
    log_audit(db, usuario_id=current_user.id, accion="ACTUALIZAR", entidad="Product", entidad_id=product.id, descripcion=f"Producto actualizado ID #{product.id}")
    return product

@router.delete("/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_product(
    product_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(RoleChecker(["ADMIN"]))
):
    product = db.query(Product).filter(Product.id == product_id, Product.activo == True).first()
    if not product:
        raise HTTPException(status_code=404, detail="Producto no encontrado")

    # IMPLEMENTACIÓN: baja lógica para conservar movimientos de inventario.
    product.activo = False
    log_audit(db, usuario_id=current_user.id, accion="ELIMINAR", entidad="Product", entidad_id=product.id, descripcion=f"Producto eliminado: {product.nombre}")
    db.commit()
    return None

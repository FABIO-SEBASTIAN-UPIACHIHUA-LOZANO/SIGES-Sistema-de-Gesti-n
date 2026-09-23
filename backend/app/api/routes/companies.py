from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.db.session import get_db
from app.api.deps import require_superadmin, get_current_user
from app.models.company import Company
from app.models.user import User
from app.models.role import Role
from app.schemas.company import CompanyResponse, CompanyCreate, CompanyUpdate, CompanyWithAdminCreate
from app.core.security import get_password_hash
from app.services.audit_service import log_audit

router = APIRouter()

@router.get("/", response_model=List[CompanyResponse])
def get_companies(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_superadmin)
):
    companies = db.query(Company).order_by(Company.created_at.desc()).all()
    res = []
    for comp in companies:
        total_users = db.query(func.count(User.id)).filter(User.empresa_id == comp.id).scalar() or 0
        res.append(
            CompanyResponse(
                id=comp.id,
                nombre=comp.nombre,
                ruc_documento=comp.ruc_documento,
                email_contacto=comp.email_contacto,
                telefono=comp.telefono,
                direccion=comp.direccion,
                activo=comp.activo,
                limite_usuarios=comp.limite_usuarios,
                modulos_permitidos=comp.modulos_permitidos,
                total_usuarios=total_users,
                created_at=comp.created_at,
                updated_at=comp.updated_at
            )
        )
    return res

@router.post("/", response_model=CompanyResponse, status_code=status.HTTP_201_CREATED)
def create_company_with_admin(
    comp_in: CompanyWithAdminCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_superadmin)
):
    # Validar que el email de admin no exista
    existing_user = db.query(User).filter(User.email == comp_in.admin_email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El correo electrónico del administrador ya está registrado"
        )
    
    admin_role = db.query(Role).filter(Role.nombre == "ADMIN").first()
    if not admin_role:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Rol ADMIN no encontrado en el sistema"
        )

    # Crear empresa
    new_company = Company(
        nombre=comp_in.nombre,
        ruc_documento=comp_in.ruc_documento,
        email_contacto=comp_in.email_contacto,
        telefono=comp_in.telefono,
        direccion=comp_in.direccion,
        limite_usuarios=comp_in.limite_usuarios,
        activo=True
    )
    db.add(new_company)
    db.commit()
    db.refresh(new_company)

    # Crear usuario Admin inicial para la nueva empresa
    admin_user = User(
        empresa_id=new_company.id,
        nombre=comp_in.admin_nombre,
        email=comp_in.admin_email,
        password_hash=get_password_hash(comp_in.admin_password),
        rol_id=admin_role.id,
        activo=True
    )
    db.add(admin_user)
    db.commit()

    log_audit(
        db,
        usuario_id=current_user.id,
        empresa_id=None,
        accion="CREAR_EMPRESA",
        entidad="Company",
        entidad_id=new_company.id,
        descripcion=f"Empresa '{new_company.nombre}' creada con su admin '{admin_user.email}'"
    )

    return CompanyResponse(
        id=new_company.id,
        nombre=new_company.nombre,
        ruc_documento=new_company.ruc_documento,
        email_contacto=new_company.email_contacto,
        telefono=new_company.telefono,
        direccion=new_company.direccion,
        activo=new_company.activo,
        limite_usuarios=new_company.limite_usuarios,
        modulos_permitidos=new_company.modulos_permitidos,
        total_usuarios=1,
        created_at=new_company.created_at,
        updated_at=new_company.updated_at
    )

@router.put("/{company_id}", response_model=CompanyResponse)
def update_company(
    company_id: int,
    comp_in: CompanyUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_superadmin)
):
    company = db.query(Company).filter(Company.id == company_id).first()
    if not company:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Empresa no encontrada")
    
    update_data = comp_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(company, field, value)
    
    db.commit()
    db.refresh(company)

    total_users = db.query(func.count(User.id)).filter(User.empresa_id == company.id).scalar() or 0

    log_audit(
        db,
        usuario_id=current_user.id,
        empresa_id=None,
        accion="ACTUALIZAR_EMPRESA",
        entidad="Company",
        entidad_id=company.id,
        descripcion=f"Empresa '{company.nombre}' actualizada"
    )

    return CompanyResponse(
        id=company.id,
        nombre=company.nombre,
        ruc_documento=company.ruc_documento,
        email_contacto=company.email_contacto,
        telefono=company.telefono,
        direccion=company.direccion,
        activo=company.activo,
        limite_usuarios=company.limite_usuarios,
        modulos_permitidos=company.modulos_permitidos,
        total_usuarios=total_users,
        created_at=company.created_at,
        updated_at=company.updated_at
    )

@router.patch("/{company_id}/toggle-status", response_model=CompanyResponse)
def toggle_company_status(
    company_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_superadmin)
):
    company = db.query(Company).filter(Company.id == company_id).first()
    if not company:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Empresa no encontrada")
    
    company.activo = not company.activo
    db.commit()
    db.refresh(company)

    estado_str = "activada" if company.activo else "suspendida"
    log_audit(
        db,
        usuario_id=current_user.id,
        empresa_id=None,
        accion="CAMBIAR_ESTADO_EMPRESA",
        entidad="Company",
        entidad_id=company.id,
        descripcion=f"Empresa '{company.nombre}' ha sido {estado_str}"
    )

    total_users = db.query(func.count(User.id)).filter(User.empresa_id == company.id).scalar() or 0
    return CompanyResponse(
        id=company.id,
        nombre=company.nombre,
        ruc_documento=company.ruc_documento,
        email_contacto=company.email_contacto,
        telefono=company.telefono,
        direccion=company.direccion,
        activo=company.activo,
        limite_usuarios=company.limite_usuarios,
        modulos_permitidos=company.modulos_permitidos,
        total_usuarios=total_users,
        created_at=company.created_at,
        updated_at=company.updated_at
    )

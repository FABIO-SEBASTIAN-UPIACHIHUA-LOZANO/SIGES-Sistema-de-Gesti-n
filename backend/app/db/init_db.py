from sqlalchemy.orm import Session
from app.db.session import SessionLocal, engine, Base
from app.models.company import Company
from app.models.role import Role
from app.models.user import User
from app.models.product import Product
from app.core.security import get_password_hash

def init_db():
    Base.metadata.create_all(bind=engine)

    db: Session = SessionLocal()

    try:
        # ROLES
        roles = ["SUPERADMIN", "ADMIN", "TECNICO", "VENDEDOR"]
        role_objs = {}

        for r_name in roles:
            role = db.query(Role).filter(Role.nombre == r_name).first()
            if not role:
                role = Role(nombre=r_name)
                db.add(role)
                db.commit()
                db.refresh(role)
            role_objs[r_name] = role

        # EMPRESA INICIAL DEMO
        demo_company = db.query(Company).filter(Company.id == 1).first()
        if not demo_company:
            demo_company = Company(
                id=1,
                nombre="Empresa Demo S.A.C.",
                ruc_documento="20123456789",
                email_contacto="contacto@sistec.com",
                telefono="999888777",
                direccion="Av. Principal 123, Lima",
                activo=True,
                limite_usuarios=20
            )
            db.add(demo_company)
            db.commit()
            db.refresh(demo_company)

        # Reset Postgres sequence for companies id
        try:
            from sqlalchemy import text
            db.execute(text("SELECT setval('companies_id_seq', (SELECT COALESCE(MAX(id), 1) FROM companies))"))
            db.commit()
        except Exception:
            pass

        # SUPERADMIN (Global SaaS Owner)
        superadmin = db.query(User).filter(User.email == "superadmin@sistec.com").first()
        if not superadmin:
            superadmin = User(
                empresa_id=None,
                nombre="Super Administrador SaaS",
                email="superadmin@sistec.com",
                password_hash=get_password_hash("SuperAdmin123!"),
                rol_id=role_objs["SUPERADMIN"].id,
                activo=True
            )
            db.add(superadmin)

        # ADMIN DEMO
        admin = db.query(User).filter(User.email == "admin@sistec.com").first()
        if not admin:
            admin = User(
                empresa_id=demo_company.id,
                nombre="Administrador General",
                email="admin@sistec.com",
                password_hash=get_password_hash("Admin123!"),
                rol_id=role_objs["ADMIN"].id,
                activo=True
            )
            db.add(admin)

        # TECNICO DEMO
        tecnico = db.query(User).filter(User.email == "tecnico@sistec.com").first()
        if not tecnico:
            tecnico = User(
                empresa_id=demo_company.id,
                nombre="Técnico de Campo",
                email="tecnico@sistec.com",
                password_hash=get_password_hash("Tecnico123!"),
                rol_id=role_objs["TECNICO"].id,
                activo=True,
                permisos={
                    "servicios": {"ver": True, "crear": True, "editar": True, "eliminar": False},
                    "clientes": {"ver": True, "crear": True, "editar": False, "eliminar": False},
                    "equipos": {"ver": True, "crear": True, "editar": True, "eliminar": False},
                    "productos": {"ver": True, "crear": False, "editar": False, "eliminar": False},
                    "pagos": {"ver": False, "crear": False, "editar": False, "eliminar": False},
                    "comprobantes": {"ver": False, "crear": False, "editar": False, "eliminar": False},
                    "licencias": {"ver": True, "crear": True, "editar": True, "eliminar": False}
                }
            )
            db.add(tecnico)

        # VENDEDOR DEMO
        vendedor = db.query(User).filter(User.email == "vendedor@sistec.com").first()
        if not vendedor:
            vendedor = User(
                empresa_id=demo_company.id,
                nombre="Vendedor Recepción",
                email="vendedor@sistec.com",
                password_hash=get_password_hash("Vendedor123!"),
                rol_id=role_objs["VENDEDOR"].id,
                activo=True,
                permisos={
                    "servicios": {"ver": True, "crear": True, "editar": False, "eliminar": False},
                    "clientes": {"ver": True, "crear": True, "editar": True, "eliminar": False},
                    "equipos": {"ver": True, "crear": True, "editar": False, "eliminar": False},
                    "productos": {"ver": True, "crear": False, "editar": False, "eliminar": False},
                    "pagos": {"ver": True, "crear": True, "editar": False, "eliminar": False},
                    "comprobantes": {"ver": True, "crear": True, "editar": False, "eliminar": False},
                    "licencias": {"ver": True, "crear": True, "editar": False, "eliminar": False}
                }
            )
            db.add(vendedor)

        # PRODUCTO DEMO
        prod = db.query(Product).filter(Product.codigo == "REP-001", Product.empresa_id == demo_company.id).first()
        if not prod:
            db.add(
                Product(
                    empresa_id=demo_company.id,
                    nombre="Disco SSD 500GB Kingston",
                    categoria="Repuestos",
                    codigo="REP-001",
                    stock=15,
                    stock_minimo=3,
                    precio_compra=35.00,
                    precio_venta=65.00
                )
            )

        # DEMO LICENSES
        from app.models.license import License
        from datetime import date, timedelta
        lic_demo = db.query(License).filter(License.clave_licencia == "KASP-2026-X892", License.empresa_id == demo_company.id).first()
        if not lic_demo:
            db.add(
                License(
                    empresa_id=demo_company.id,
                    categoria="ANTIVIRUS",
                    nombre_producto="Kaspersky Total Security 2026",
                    clave_licencia="KASP-2026-X892",
                    cantidad_dispositivos=3,
                    es_permanente=False,
                    fecha_inicio=date.today() - timedelta(days=300),
                    fecha_fin=date.today() + timedelta(days=65),
                    proveedor="Kaspersky Lab Perú",
                    notas="Licencia cliente corporativo"
                )
            )

        try:
            from sqlalchemy import text
            db.execute(text("SELECT setval('users_id_seq', (SELECT COALESCE(MAX(id), 1) FROM users))"))
            db.execute(text("SELECT setval('roles_id_seq', (SELECT COALESCE(MAX(id), 1) FROM roles))"))
            db.execute(text("SELECT setval('licenses_id_seq', (SELECT COALESCE(MAX(id), 1) FROM licenses))"))
            db.commit()
        except Exception:
            pass

        db.commit()

    finally:
        db.close()

if __name__ == "__main__":
    init_db()
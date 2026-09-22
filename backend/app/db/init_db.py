from sqlalchemy import or_
from sqlalchemy.orm import Session
from app.db.session import SessionLocal, engine, Base
from app.models.role import Role
from app.models.user import User
from app.models.product import Product
from app.core.security import get_password_hash


def init_db():
    Base.metadata.create_all(bind=engine)

    db: Session = SessionLocal()

    try:
        roles = ["ADMIN", "TECNICO", "VENDEDOR"]
        role_objs = {}

        for r_name in roles:
            role = db.query(Role).filter(Role.nombre == r_name).first()

            if not role:
                role = Role(nombre=r_name)
                db.add(role)
                db.commit()
                db.refresh(role)

            role_objs[r_name] = role

        # ADMIN
        admin = db.query(User).filter(
            or_(
                User.email == "admin@siges.com",
                (User.nombre == "Administrador General") &
                (User.rol_id == role_objs["ADMIN"].id),
            )
        ).first()

        if not admin:
            admin = User(
                nombre="Administrador General",
                email="admin@siges.com",
                password_hash=get_password_hash("Admin123!"),
                rol_id=role_objs["ADMIN"].id,
                activo=True
            )
            db.add(admin)

        # TECNICO
        tecnico = db.query(User).filter(
            or_(
                User.email == "tecnico@siges.com",
                (User.nombre == "Técnico de Campo") &
                (User.rol_id == role_objs["TECNICO"].id),
            )
        ).first()

        if not tecnico:
            tecnico = User(
                nombre="Técnico de Campo",
                email="tecnico@siges.com",
                password_hash=get_password_hash("Tecnico123!"),
                rol_id=role_objs["TECNICO"].id,
                activo=True
            )
            db.add(tecnico)

        # VENDEDOR
        vendedor = db.query(User).filter(
            or_(
                User.email == "vendedor@siges.com",
                (User.nombre == "Vendedor Recepción") &
                (User.rol_id == role_objs["VENDEDOR"].id),
            )
        ).first()

        if not vendedor:
            vendedor = User(
                nombre="Vendedor Recepción",
                email="vendedor@siges.com",
                password_hash=get_password_hash("Vendedor123!"),
                rol_id=role_objs["VENDEDOR"].id,
                activo=True
            )
            db.add(vendedor)

        # PRODUCTO
        prod = db.query(Product).filter(
            Product.codigo == "REP-001"
        ).first()

        if not prod:
            db.add(
                Product(
                    nombre="Disco SSD 500GB Kingston",
                    categoria="Repuestos",
                    codigo="REP-001",
                    stock=15,
                    stock_minimo=3,
                    precio_compra=35.00,
                    precio_venta=65.00
                )
            )

        db.commit()

    finally:
        db.close()


if __name__ == "__main__":
    init_db()

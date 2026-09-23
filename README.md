# SisTec — Sistema de Gestión de Servicios, Clientes, Inventario y Ventas

Plataforma empresarial SaaS Multi-Empresa desarrollada bajo arquitectura modular con **FastAPI**, **PostgreSQL**, **React (Vite, Tailwind CSS)** y **Docker**.

---

## 🔑 Credenciales por Defecto (Semilla Inicial)

* **SuperAdmin (Panel de Administración Global / Empresas y Licencias)**: `superadmin@sistec.com` / `SuperAdmin123!`
* **Administrador (Gestión de Sucursal / Empresa)**: `admin@sistec.com` / `Admin123!`
* **Técnico**: `tecnico@sistec.com` / `Tecnico123!`
* **Vendedor**: `vendedor@sistec.com` / `Vendedor123!`

---

## ✨ Características Principales

- **Gestión Multi-Empresa & Licencias (SuperAdmin)**: Creación de empresas, asignación de licencias y límites.
- **Órdenes de Servicio & Mantenimiento**: Registro, actualización de estados, firmas y piezas.
- **Vinculación Móvil QR de Fotos**: Carga directa de fotografías de equipos desde el smartphone escaneando un código QR en tiempo real sin instalar aplicaciones.
- **Control de Inventario & Productos**: Control de stock, precios y repuestos.
- **Gestión de Clientes & Equipos**: Historial técnico por cliente y equipo.
- **Facturación & Auditoría**: Registro de comprobantes y trazabilidad de acciones (RBAC).

---

## 🚀 Instrucciones de Despliegue con Docker Compose

1. Clonar el repositorio y acceder a la carpeta:
```bash
git clone https://github.com/FABIO-SEBASTIAN-UPIACHIHUA-LOZANO/SIGES-Sistema-de-Gesti-n.git
cd SIGES-Sistema-de-Gesti-n
```

2. Levantar el proyecto con Docker Compose:
```bash
docker compose up -d --build
```

3. Puertos por Defecto:
- **Frontend (React)**: `http://localhost:5173`
- **Backend (FastAPI & Swagger Docs)**: `http://localhost:8000/docs`
- **PostgreSQL**: `localhost:5433` (Base de datos: `sistec_db`)

4. Detener contenedores:
```bash
docker compose down
```


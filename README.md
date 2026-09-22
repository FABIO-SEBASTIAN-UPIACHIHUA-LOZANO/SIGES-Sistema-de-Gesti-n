# SIGES — Sistema de Gestión de Servicios, Clientes, Inventario y Ventas

MVP completo desarrollado bajo arquitectura de monolito modular con FastAPI, PostgreSQL, React (Vite, Tailwind CSS) y Docker.

## Credenciales por Defecto (Semilla Inicial)
- **Admin**: `admin@siges.local` / `Admin123!`
- **Técnico**: `tecnico@siges.local` / `Tecnico123!`
- **Vendedor**: `vendedor@siges.local` / `Vendedor123!`
## Credenciales por Defecto

- Administrador: `admin@siges.com` / `Admin123!`
- Técnico: `tecnico@siges.com` / `Tecnico123!`
- Vendedor: `vendedor@siges.com` / `Vendedor123!`
## Instrucciones de Despliegue con Docker Compose

1. Clonar el repositorio y acceder a la carpeta:
```bash
git clone <URL_REPOSITORIO>
cd siges

 docker compose exec postgres psql -U siges_user -d siges_dbS


  docker compose down   
  docker compose up -d   

  tree /F


  docker compose down --remove-orphans
docker compose build --no-cache
docker compose up -d

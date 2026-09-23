# SisTec — Sistema de Gestión de Servicios, Clientes, Inventario y Ventas

MVP completo desarrollado bajo arquitectura de monolito modular con FastAPI, PostgreSQL, React (Vite, Tailwind CSS) y Docker.

## Credenciales por Defecto (Semilla Inicial)
- **Administrador**: `admin@sistec.com` / `Admin123!`
- **Técnico**: `tecnico@sistec.com` / `Tecnico123!`
- **Vendedor**: `vendedor@sistec.com` / `Vendedor123!`

## Instrucciones de Despliegue con Docker Compose

1. Clonar el repositorio y acceder a la carpeta:
```bash
git clone <URL_REPOSITORIO>
cd sistec

docker compose exec postgres psql -U sistec_user -d sistec_db

docker compose down
docker compose up -d --build
```

/**
 * Permisos Granulares por Módulo - SisTec Business Suite
 */

export const MODULES = [
  { id: "servicios", label: "Servicios" },
  { id: "clientes", label: "Clientes" },
  { id: "equipos", label: "Equipos" },
  { id: "licencias", label: "Licencias" },
  { id: "productos", label: "Productos / Inventario" },
  { id: "pagos", label: "Pagos" },
  { id: "comprobantes", label: "Comprobantes / Invoices" },
];

export const DEFAULT_PERMISSIONS = {
  servicios: { ver: true, crear: true, editar: true, eliminar: false },
  clientes: { ver: true, crear: true, editar: true, eliminar: false },
  equipos: { ver: true, crear: true, editar: true, eliminar: false },
  licencias: { ver: true, crear: true, editar: true, eliminar: false },
  productos: { ver: true, crear: false, editar: false, eliminar: false },
  pagos: { ver: false, crear: false, editar: false, eliminar: false },
  comprobantes: { ver: false, crear: false, editar: false, eliminar: false },
};

/**
 * Normaliza y llena los permisos incompletos con los valores por defecto.
 */
export function buildUserPermissions(existingPermisos) {
  const normalized = {};
  MODULES.forEach((mod) => {
    const defaultMod = DEFAULT_PERMISSIONS[mod.id] || { ver: false, crear: false, editar: false, eliminar: false };
    if (existingPermisos && existingPermisos[mod.id]) {
      normalized[mod.id] = {
        ver: Boolean(existingPermisos[mod.id].ver),
        crear: Boolean(existingPermisos[mod.id].crear),
        editar: Boolean(existingPermisos[mod.id].editar),
        eliminar: Boolean(existingPermisos[mod.id].eliminar),
      };
    } else {
      normalized[mod.id] = { ...defaultMod };
    }
  });
  return normalized;
}

/**
 * Valida si un usuario posee un permiso granular específico en un módulo.
 * Los usuarios con rol ADMIN o SUPERADMIN tienen acceso completo automáticamente.
 */
export function hasModulePermission(user, moduleKey, action = "ver") {
  if (!user) return false;

  const role = (
    user?.rol ||
    user?.role ||
    user?.rol_nombre ||
    user?.role_name ||
    ""
  ).toString().toUpperCase();

  if (role === "ADMIN" || role === "SUPERADMIN") {
    return true;
  }

  if (!moduleKey || moduleKey === "dashboard" || moduleKey === "superadmin") {
    return true;
  }

  const permisos = user.permisos || DEFAULT_PERMISSIONS;
  const modPerms = permisos[moduleKey];

  return Boolean(modPerms && modPerms[action] === true);
}

import React, { useEffect, useState } from "react";
import {
  Search,
  Plus,
  UsersRound,
  ShieldCheck,
  UserRound,
  Pencil,
  X,
  CheckCircle2,
  XCircle,
  Mail,
  Lock,
  UserCog,
  KeyRound,
  Shield,
} from "lucide-react";
import api from "../services/api";

const MODULES = [
  { id: "servicios", label: "Servicios" },
  { id: "clientes", label: "Clientes" },
  { id: "equipos", label: "Equipos" },
  { id: "productos", label: "Productos / Inventario" },
  { id: "pagos", label: "Pagos" },
  { id: "comprobantes", label: "Comprobantes / Invoices" },
];

const DEFAULT_PERMISSIONS = {
  servicios: { ver: true, crear: true, editar: true, eliminar: false },
  clientes: { ver: true, crear: true, editar: true, eliminar: false },
  equipos: { ver: true, crear: true, editar: true, eliminar: false },
  productos: { ver: true, crear: false, editar: false, eliminar: false },
  pagos: { ver: false, crear: false, editar: false, eliminar: false },
  comprobantes: { ver: false, crear: false, editar: false, eliminar: false },
};

const EMPTY_FORM = {
  id: null,
  nombre: "",
  email: "",
  password: "",
  rol_id: 2, // Default Técnico (2) or Vendedor (3)
  permisos: DEFAULT_PERMISSIONS,
};

const ROLE_LABELS = {
  SUPERADMIN: "Superadmin Global",
  ADMIN: "Administrador",
  TECNICO: "Técnico",
  VENDEDOR: "Vendedor",
};

export function Users() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const loadUsers = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/users/");
      setUsers(response.data);
    } catch (err) {
      console.error(err);
      setError(
        err.response?.data?.detail || "No se pudieron cargar los usuarios."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const openCreateModal = () => {
    setEditingUser(null);
    setForm(EMPTY_FORM);
    setFormError("");
    setShowModal(true);
  };

  const openEditModal = (user) => {
    setEditingUser(user);
    setForm({
      id: user.id,
      nombre: user.nombre,
      email: user.email,
      password: "", // Dejar vacia si no cambia
      rol_id: user.rol_id,
      permisos: user.permisos || DEFAULT_PERMISSIONS,
    });
    setFormError("");
    setShowModal(true);
  };

  const closeModal = () => {
    if (saving) return;
    setShowModal(false);
    setEditingUser(null);
    setForm(EMPTY_FORM);
    setFormError("");
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handlePermissionChange = (moduleKey, actionKey) => {
    setForm((prev) => {
      const currentMod = prev.permisos?.[moduleKey] || {
        ver: false,
        crear: false,
        editar: false,
        eliminar: false,
      };
      return {
        ...prev,
        permisos: {
          ...prev.permisos,
          [moduleKey]: {
            ...currentMod,
            [actionKey]: !currentMod[actionKey],
          },
        },
      };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");

    if (!form.nombre.trim()) {
      setFormError("El nombre es obligatorio.");
      return;
    }

    if (!form.email.trim()) {
      setFormError("El correo es obligatorio.");
      return;
    }

    if (!editingUser && !form.password) {
      setFormError("La contraseña es obligatoria al crear un usuario.");
      return;
    }

    if (form.password && form.password.length < 6) {
      setFormError("La contraseña debe tener al menos 6 caracteres.");
      return;
    }

    try {
      setSaving(true);

      if (editingUser) {
        // Actualizar usuario
        const payload = {
          nombre: form.nombre.trim(),
          email: form.email.trim(),
          rol_id: Number(form.rol_id),
          permisos: form.permisos,
        };
        if (form.password) payload.password = form.password;

        await api.put(`/users/${editingUser.id}`, payload);
      } else {
        // Crear usuario
        await api.post("/users/", {
          nombre: form.nombre.trim(),
          email: form.email.trim(),
          password: form.password,
          rol_id: Number(form.rol_id),
          permisos: form.permisos,
        });
      }

      await loadUsers();
      closeModal();
    } catch (err) {
      console.error(err);
      setFormError(
        err.response?.data?.detail || "No se pudo guardar el usuario."
      );
    } finally {
      setSaving(false);
    }
  };

  const filteredUsers = users.filter((user) => {
    const text = `${user.nombre} ${user.email} ${user.rol?.nombre || ""}`.toLowerCase();
    return text.includes(search.toLowerCase());
  });

  const totalUsers = users.length;
  const activeUsers = users.filter((user) => user.activo).length;
  const inactiveUsers = users.filter((user) => !user.activo).length;
  const adminUsers = users.filter(
    (user) => user.rol?.nombre === "ADMIN" || user.rol?.nombre === "SUPERADMIN"
  ).length;

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="mb-1 flex items-center gap-2 text-sm text-slate-500">
            <UserCog size={16} />
            <span>Administración de Usuarios</span>
          </div>

          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Usuarios y Permisos Granulares
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Administra las cuentas de tu empresa y configura qué módulos puede ver y editar cada usuario.
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 active:scale-[0.98]"
        >
          <Plus size={18} />
          Nuevo usuario
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard icon={<UsersRound size={20} />} label="Total usuarios" value={totalUsers} />
        <KpiCard icon={<CheckCircle2 size={20} />} label="Usuarios activos" value={activeUsers} />
        <KpiCard icon={<XCircle size={20} />} label="Usuarios inactivos" value={inactiveUsers} />
        <KpiCard icon={<ShieldCheck size={20} />} label="Administradores" value={adminUsers} />
      </div>

      {/* LISTADO */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-slate-200 p-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="font-semibold text-slate-900">Personal de la Empresa</h2>
            <p className="text-sm text-slate-500">Listado de accesos autorizados en tu cuenta.</p>
          </div>

          <div className="relative w-full md:w-80">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar usuario por nombre o email..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-100"
            />
          </div>
        </div>

        {error && (
          <div className="m-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
            <button type="button" onClick={loadUsers} className="ml-3 font-semibold underline">
              Reintentar
            </button>
          </div>
        )}

        {loading ? (
          <div className="space-y-3 p-4">
            {[1, 2, 3].map((item) => (
              <div key={item} className="h-16 animate-pulse rounded-xl bg-slate-100" />
            ))}
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
              <UsersRound size={26} />
            </div>
            <h3 className="font-semibold text-slate-900">No hay usuarios</h3>
            <p className="mt-1 max-w-md text-sm text-slate-500">
              {search ? "No encontramos usuarios que coincidan con tu búsqueda." : "No se han registrado usuarios."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/70 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <th className="px-6 py-4">Usuario</th>
                  <th className="px-6 py-4">Rol</th>
                  <th className="px-6 py-4">Módulos Permitidos</th>
                  <th className="px-6 py-4">Estado</th>
                  <th className="px-6 py-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="transition hover:bg-slate-50/70">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <Avatar name={user.nombre} />
                        <div>
                          <p className="font-semibold text-slate-900">{user.nombre}</p>
                          <div className="mt-0.5 flex items-center gap-1.5 text-xs text-slate-500">
                            <Mail size={13} />
                            {user.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <RoleBadge role={user.rol?.nombre} />
                    </td>
                    <td className="px-6 py-4">
                      {user.rol?.nombre === "ADMIN" || user.rol?.nombre === "SUPERADMIN" ? (
                        <span className="text-xs font-semibold text-indigo-600">Acceso Total</span>
                      ) : (
                        <div className="flex flex-wrap gap-1">
                          {MODULES.map((m) => {
                            const hasAccess = user.permisos?.[m.id]?.ver;
                            return (
                              <span
                                key={m.id}
                                className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${
                                  hasAccess ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-400'
                                }`}
                              >
                                {m.label.split(' ')[0]}
                              </span>
                            );
                          })}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge active={user.activo} />
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => openEditModal(user)}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-indigo-600"
                        title="Editar permisos y usuario"
                      >
                        <Pencil size={15} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL CREAR / EDITAR USUARIO & PERMISOS */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl my-8">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  {editingUser ? `Editar Usuario: ${editingUser.nombre}` : "Nuevo Usuario de Empresa"}
                </h2>
                <p className="mt-1 text-xs text-slate-500">
                  Asigna las credenciales y define los accesos por módulo de este colaborador.
                </p>
              </div>
              <button onClick={closeModal} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              {formError && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-700">
                  {formError}
                </div>
              )}

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-700">Nombre completo *</label>
                  <input
                    name="nombre"
                    value={form.nombre}
                    onChange={handleChange}
                    placeholder="Ej. Carlos Pérez"
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-700">Correo electrónico *</label>
                  <input
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    placeholder="usuario@empresa.com"
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-700">
                    {editingUser ? "Contraseña (dejar en blanco para conservar)" : "Contraseña *"}
                  </label>
                  <input
                    type="password"
                    name="password"
                    value={form.password}
                    onChange={handleChange}
                    placeholder="••••••••"
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-700">Rol del Usuario *</label>
                  <select
                    name="rol_id"
                    value={form.rol_id}
                    onChange={handleChange}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-500"
                  >
                    <option value="2">Técnico</option>
                    <option value="3">Vendedor</option>
                    <option value="1">Administrador (Acceso Total)</option>
                  </select>
                </div>
              </div>

              {/* MATRIZ DE PERMISOS GRANULARES */}
              {Number(form.rol_id) !== 1 && (
                <div className="pt-3 border-t border-slate-200 space-y-3">
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-indigo-600" />
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                      Permisos Granulares por Módulo
                    </h3>
                  </div>

                  <div className="rounded-xl border border-slate-200 overflow-hidden text-xs">
                    <table className="w-full text-left">
                      <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold">
                        <tr>
                          <th className="px-4 py-2">Módulo</th>
                          <th className="px-3 py-2 text-center">Ver</th>
                          <th className="px-3 py-2 text-center">Crear</th>
                          <th className="px-3 py-2 text-center">Editar</th>
                          <th className="px-3 py-2 text-center">Eliminar</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {MODULES.map((m) => {
                          const p = form.permisos?.[m.id] || { ver: false, crear: false, editar: false, eliminar: false };
                          return (
                            <tr key={m.id} className="hover:bg-slate-50/50">
                              <td className="px-4 py-2 font-medium text-slate-800">{m.label}</td>
                              {['ver', 'crear', 'editar', 'eliminar'].map((action) => (
                                <td key={action} className="px-3 py-2 text-center">
                                  <input
                                    type="checkbox"
                                    checked={!!p[action]}
                                    onChange={() => handlePermissionChange(m.id, action)}
                                    className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                                  />
                                </td>
                              ))}
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={closeModal}
                  className="rounded-xl px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-xl bg-indigo-600 px-5 py-2 text-sm font-semibold text-white shadow-md hover:bg-indigo-700 disabled:opacity-50"
                >
                  {saving ? "Guardando..." : "Guardar Usuario"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function KpiCard({ icon, label, value }) {
  return (
    <div className="flex items-center gap-3.5 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
        {icon}
      </div>
      <div>
        <p className="text-xs font-medium text-slate-500">{label}</p>
        <p className="text-xl font-bold text-slate-900">{value}</p>
      </div>
    </div>
  );
}

function Avatar({ name }) {
  const initial = name ? name.charAt(0).toUpperCase() : "?";
  return (
    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-100 font-semibold text-indigo-700 text-sm">
      {initial}
    </div>
  );
}

function RoleBadge({ role }) {
  return (
    <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
      {ROLE_LABELS[role] || role || "Sin Rol"}
    </span>
  );
}

function StatusBadge({ active }) {
  return active ? (
    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
      Activo
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-700">
      Inactivo
    </span>
  );
}
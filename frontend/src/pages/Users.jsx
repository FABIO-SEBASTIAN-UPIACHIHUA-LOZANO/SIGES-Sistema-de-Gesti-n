import React, { useEffect, useState } from "react";
import {
  Search,
  Plus,
  UsersRound,
  ShieldCheck,
  UserRound,
  MoreHorizontal,
  Pencil,
  X,
  CheckCircle2,
  XCircle,
  Mail,
  Lock,
  UserCog,
} from "lucide-react";
import api from "../services/api";

const EMPTY_FORM = {
  nombre: "",
  email: "",
  password: "",
  rol_id: "",
};

const ROLE_LABELS = {
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
        err.response?.data?.detail ||
          "No se pudieron cargar los usuarios."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const openCreateModal = () => {
    setForm(EMPTY_FORM);
    setFormError("");
    setShowModal(true);
  };

  const closeModal = () => {
    if (saving) return;

    setShowModal(false);
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

    if (!form.password) {
      setFormError("La contraseña es obligatoria.");
      return;
    }

    if (form.password.length < 6) {
      setFormError("La contraseña debe tener al menos 6 caracteres.");
      return;
    }

    if (!form.rol_id) {
      setFormError("Selecciona un rol.");
      return;
    }

    try {
      setSaving(true);

      await api.post("/users/", {
        nombre: form.nombre.trim(),
        email: form.email.trim(),
        password: form.password,
        rol_id: Number(form.rol_id),
      });

      await loadUsers();

      closeModal();
    } catch (err) {
      console.error(err);

      setFormError(
        err.response?.data?.detail ||
          "No se pudo registrar el usuario."
      );
    } finally {
      setSaving(false);
    }
  };

  const filteredUsers = users.filter((user) => {
    const text = `
      ${user.nombre}
      ${user.email}
      ${user.rol?.nombre || ""}
    `.toLowerCase();

    return text.includes(search.toLowerCase());
  });

  const totalUsers = users.length;

  const activeUsers = users.filter((user) => user.activo).length;

  const inactiveUsers = users.filter((user) => !user.activo).length;

  const adminUsers = users.filter(
    (user) => user.rol?.nombre === "ADMIN"
  ).length;

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="mb-1 flex items-center gap-2 text-sm text-slate-500">
            <UserCog size={16} />
            <span>Administración</span>
          </div>

          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Usuarios
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Administra los usuarios y roles que tienen acceso a SIGES.
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
        <KpiCard
          icon={<UsersRound size={20} />}
          label="Total usuarios"
          value={totalUsers}
        />

        <KpiCard
          icon={<CheckCircle2 size={20} />}
          label="Usuarios activos"
          value={activeUsers}
        />

        <KpiCard
          icon={<XCircle size={20} />}
          label="Usuarios inactivos"
          value={inactiveUsers}
        />

        <KpiCard
          icon={<ShieldCheck size={20} />}
          label="Administradores"
          value={adminUsers}
        />
      </div>

      {/* CONTENT */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        {/* TOOLBAR */}
        <div className="flex flex-col gap-3 border-b border-slate-200 p-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="font-semibold text-slate-900">
              Usuarios del sistema
            </h2>

            <p className="text-sm text-slate-500">
              Gestiona las cuentas registradas en SIGES.
            </p>
          </div>

          <div className="relative w-full md:w-80">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar usuario..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-100"
            />
          </div>
        </div>

        {/* ERROR */}
        {error && (
          <div className="m-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}

            <button
              type="button"
              onClick={loadUsers}
              className="ml-3 font-semibold underline"
            >
              Reintentar
            </button>
          </div>
        )}

        {/* LOADING */}
        {loading ? (
          <div className="space-y-3 p-4">
            {[1, 2, 3, 4].map((item) => (
              <div
                key={item}
                className="h-16 animate-pulse rounded-xl bg-slate-100"
              />
            ))}
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
              <UsersRound size={26} />
            </div>

            <h3 className="font-semibold text-slate-900">
              No hay usuarios
            </h3>

            <p className="mt-1 max-w-md text-sm text-slate-500">
              {search
                ? "No encontramos usuarios que coincidan con tu búsqueda."
                : "Todavía no existen usuarios registrados."}
            </p>

            {!search && (
              <button
                type="button"
                onClick={openCreateModal}
                className="mt-5 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700"
              >
                <Plus size={17} />
                Registrar usuario
              </button>
            )}
          </div>
        ) : (
          <>
            {/* DESKTOP */}
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/70 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    <th className="px-6 py-4">Usuario</th>
                    <th className="px-6 py-4">Rol</th>
                    <th className="px-6 py-4">Estado</th>
                    <th className="px-6 py-4">Registro</th>
                    <th className="px-6 py-4 text-right">Acciones</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {filteredUsers.map((user) => (
                    <tr
                      key={user.id}
                      className="transition hover:bg-slate-50/70"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <Avatar name={user.nombre} />

                          <div>
                            <p className="font-semibold text-slate-900">
                              {user.nombre}
                            </p>

                            <div className="mt-0.5 flex items-center gap-1.5 text-sm text-slate-500">
                              <Mail size={14} />
                              {user.email}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <RoleBadge role={user.rol?.nombre} />
                      </td>

                      <td className="px-6 py-4">
                        <StatusBadge active={user.activo} />
                      </td>

                      <td className="px-6 py-4 text-sm text-slate-500">
                        {formatDate(user.created_at)}
                      </td>

                      <td className="px-6 py-4 text-right">
                        <button
                          type="button"
                          disabled
                          title="Edición pendiente de endpoint backend"
                          className="inline-flex h-9 w-9 cursor-not-allowed items-center justify-center rounded-lg text-slate-300"
                        >
                          <Pencil size={17} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* MOBILE */}
            <div className="divide-y divide-slate-100 md:hidden">
              {filteredUsers.map((user) => (
                <div key={user.id} className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <Avatar name={user.nombre} />

                      <div className="min-w-0">
                        <p className="truncate font-semibold text-slate-900">
                          {user.nombre}
                        </p>

                        <p className="mt-1 truncate text-sm text-slate-500">
                          {user.email}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      disabled
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-300"
                    >
                      <MoreHorizontal size={19} />
                    </button>
                  </div>

                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    <RoleBadge role={user.rol?.nombre} />
                    <StatusBadge active={user.activo} />
                  </div>

                  <p className="mt-3 text-xs text-slate-400">
                    Registrado: {formatDate(user.created_at)}
                  </p>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* MODAL */}
      {showModal && (
        <div className="siges-modal-overlay fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
          <div className="siges-modal-panel w-full max-w-lg rounded-2xl bg-white shadow-2xl">
            {/* MODAL HEADER */}
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  Nuevo usuario
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Crea una cuenta para acceder a SIGES.
                </p>
              </div>

              <button
                type="button"
                onClick={closeModal}
                className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
              >
                <X size={20} />
              </button>
            </div>

            {/* FORM */}
            <form onSubmit={handleSubmit} className="siges-modal-form">
              <div className="siges-modal-body space-y-5 p-6">
                {formError && (
                  <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {formError}
                  </div>
                )}

                {/* NOMBRE */}
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    Nombre completo
                  </label>

                  <div className="relative">
                    <UserRound
                      size={18}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                    />

                    <input
                      name="nombre"
                      value={form.nombre}
                      onChange={handleChange}
                      placeholder="Ej. Carlos Pérez"
                      className="w-full rounded-xl border border-slate-200 py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                    />
                  </div>
                </div>

                {/* EMAIL */}
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    Correo electrónico
                  </label>

                  <div className="relative">
                    <Mail
                      size={18}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                    />

                    <input
                      type="email"
                      name="email"
                      value={form.email}
                      onChange={handleChange}
                      placeholder="usuario@empresa.com"
                      className="w-full rounded-xl border border-slate-200 py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                    />
                  </div>
                </div>

                {/* PASSWORD */}
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    Contraseña
                  </label>

                  <div className="relative">
                    <Lock
                      size={18}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                    />

                    <input
                      type="password"
                      name="password"
                      value={form.password}
                      onChange={handleChange}
                      placeholder="Mínimo 6 caracteres"
                      className="w-full rounded-xl border border-slate-200 py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                    />
                  </div>
                </div>

                {/* ROLE */}
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    Rol
                  </label>

                  <div className="relative">
                    <ShieldCheck
                      size={18}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                    />

                    <select
                      name="rol_id"
                      value={form.rol_id}
                      onChange={handleChange}
                      className="w-full appearance-none rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                    >
                      <option value="">Seleccionar rol</option>
                      <option value="1">Administrador</option>
                      <option value="2">Técnico</option>
                      <option value="3">Vendedor</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* ACTIONS */}
              <div className="siges-modal-footer flex justify-end gap-3 border-t border-slate-200 bg-slate-50 px-6 py-4">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={saving}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:opacity-50"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving ? (
                    "Guardando..."
                  ) : (
                    <>
                      <Plus size={17} />
                      Crear usuario
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

/* =========================
   COMPONENTES
========================= */

function KpiCard({ icon, label, value }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
          {icon}
        </div>
      </div>

      <p className="mt-4 text-sm font-medium text-slate-500">
        {label}
      </p>

      <p className="mt-1 text-2xl font-bold text-slate-900">
        {value}
      </p>
    </div>
  );
}

function Avatar({ name }) {
  const initials = name
    ? name
        .split(" ")
        .slice(0, 2)
        .map((word) => word.charAt(0))
        .join("")
        .toUpperCase()
    : "US";

  return (
    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-100 text-sm font-bold text-indigo-700">
      {initials}
    </div>
  );
}

function RoleBadge({ role }) {
  const label = ROLE_LABELS[role] || role || "Sin rol";

  const styles = {
    ADMIN: "bg-indigo-50 text-indigo-700 border-indigo-100",
    TECNICO: "bg-blue-50 text-blue-700 border-blue-100",
    VENDEDOR: "bg-emerald-50 text-emerald-700 border-emerald-100",
  };

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${
        styles[role] || "bg-slate-50 text-slate-600 border-slate-200"
      }`}
    >
      {label}
    </span>
  );
}

function StatusBadge({ active }) {
  return active ? (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-100 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
      <CheckCircle2 size={13} />
      Activo
    </span>
  ) : (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-red-100 bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-700">
      <XCircle size={13} />
      Inactivo
    </span>
  );
}

function formatDate(date) {
  if (!date) return "—";

  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) {
    return "—";
  }

  return parsed.toLocaleDateString("es-PE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

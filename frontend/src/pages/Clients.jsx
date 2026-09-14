import React, { useEffect, useMemo, useState } from "react";
import {
  Search,
  Plus,
  Users,
  Phone,
  Mail,
  MoreHorizontal,
  Pencil,
  X,
  UserRound,
  MapPin,
  FileText,
  Loader2,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import api from "../services/api";
import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";

const emptyForm = {
  nombres: "",
  apellidos: "",
  documento: "",
  telefono: "",
  email: "",
  direccion: "",
  activo: true,
};

const getInitials = (nombres = "", apellidos = "") => {
  const first = nombres.trim().charAt(0);
  const second = apellidos.trim().charAt(0);

  return `${first}${second}`.toUpperCase() || "CL";
};

const getErrorMessage = (error) => {
  if (error?.response?.data?.detail) {
    return error.response.data.detail;
  }

  if (error?.response?.data?.message) {
    return error.response.data.message;
  }

  if (error?.message) {
    return error.message;
  }

  return "Ocurrió un error inesperado.";
};

export function Clients() {
  const { user } = useContext(AuthContext);

  const role = String(user?.rol || "").toUpperCase();

  const canCreate = role === "ADMIN" || role === "VENDEDOR";
  const canEdit = role === "ADMIN" || role === "VENDEDOR";

  const [clients, setClients] = useState([]);
  const [search, setSearch] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState(null);

  const [menuOpen, setMenuOpen] = useState(null);

  const [form, setForm] = useState(emptyForm);

  // ============================================================
  // CARGAR CLIENTES
  // ============================================================

  const loadClients = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await api.get("/clients/");
      setClients(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      console.error("Error cargando clientes:", err);
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadClients();
  }, []);

  // ============================================================
  // ESTADÍSTICAS
  // ============================================================

  const activeClients = useMemo(() => {
    return clients.filter((client) => client.activo).length;
  }, [clients]);

  const inactiveClients = useMemo(() => {
    return clients.filter((client) => !client.activo).length;
  }, [clients]);

  // ============================================================
  // BÚSQUEDA
  // ============================================================

  const filteredClients = useMemo(() => {
    const value = search.trim().toLowerCase();

    if (!value) {
      return clients;
    }

    return clients.filter((client) => {
      const fullName =
        `${client.nombres || ""} ${client.apellidos || ""}`.toLowerCase();

      return (
        fullName.includes(value) ||
        String(client.documento || "").toLowerCase().includes(value) ||
        String(client.telefono || "").toLowerCase().includes(value) ||
        String(client.email || "").toLowerCase().includes(value)
      );
    });
  }, [clients, search]);

  // ============================================================
  // FORMULARIO
  // ============================================================

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const openCreateModal = () => {
    setEditingClient(null);
    setForm(emptyForm);
    setFormError("");
    setMenuOpen(null);
    setModalOpen(true);
  };

  const openEditModal = (client) => {
    setEditingClient(client);

    setForm({
      nombres: client.nombres || "",
      apellidos: client.apellidos || "",
      documento: client.documento || "",
      telefono: client.telefono || "",
      email: client.email || "",
      direccion: client.direccion || "",
      activo: Boolean(client.activo),
    });

    setFormError("");
    setMenuOpen(null);
    setModalOpen(true);
  };

  const closeModal = () => {
    if (saving) return;

    setModalOpen(false);
    setEditingClient(null);
    setForm(emptyForm);
    setFormError("");
  };

  // ============================================================
  // VALIDACIÓN
  // ============================================================

  const validateForm = () => {
    if (!form.nombres.trim()) {
      return "Los nombres son obligatorios.";
    }

    if (!form.apellidos.trim()) {
      return "Los apellidos son obligatorios.";
    }

    if (!form.documento.trim()) {
      return "El documento es obligatorio.";
    }

    if (!form.telefono.trim()) {
      return "El teléfono es obligatorio.";
    }

    if (form.email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      if (!emailRegex.test(form.email.trim())) {
        return "Ingresa un correo electrónico válido.";
      }
    }

    return "";
  };

  // ============================================================
  // GUARDAR CLIENTE
  // ============================================================
const handleSubmit = async (event) => {
  event.preventDefault();

  const validationError = validateForm();

  if (validationError) {
    setFormError(validationError);
    return;
  }

  setSaving(true);
  setFormError("");

  const payload = {
    nombres: form.nombres.trim(),
    apellidos: form.apellidos.trim(),
    documento: form.documento.trim(),
    telefono: form.telefono.trim(),
    email: form.email.trim() || null,
    direccion: form.direccion.trim() || null,
  };

  try {
    if (editingClient) {
      await api.put(`/clients/${editingClient.id}`, {
        ...payload,
        activo: form.activo,
      });
    } else {
      await api.post("/clients/", payload);
    }

    // Cerramos directamente porque saving todavía es true
    setModalOpen(false);
    setEditingClient(null);
    setForm(emptyForm);
    setFormError("");

    await loadClients();
  } catch (err) {
    console.error("Error guardando cliente:", err);
    setFormError(getErrorMessage(err));
  } finally {
    setSaving(false);
  }
};
  // ============================================================
  // RENDER
  // ============================================================

  return (
    <div className="space-y-6">
      {/* ======================================================
          HEADER
      ======================================================= */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
              <Users size={21} />
            </div>

            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                Clientes
              </h1>

              <p className="mt-0.5 text-sm text-slate-500">
                Gestiona los clientes registrados en SIGES.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={loadClients}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-semibold text-slate-600 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <RefreshCw
              size={17}
              className={loading ? "animate-spin" : ""}
            />
            Actualizar
          </button>

          {canCreate && (
            <button
              type="button"
              onClick={openCreateModal}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 active:scale-[0.98]"
            >
              <Plus size={18} />
              Nuevo cliente
            </button>
          )}
        </div>
      </div>

      {/* ======================================================
          ERROR GENERAL
      ======================================================= */}
      {error && (
        <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4">
          <AlertCircle
            size={19}
            className="mt-0.5 shrink-0 text-red-600"
          />

          <div className="flex-1">
            <p className="font-semibold text-red-800">
              No se pudieron cargar los clientes
            </p>

            <p className="mt-1 text-sm text-red-700">{error}</p>
          </div>

          <button
            type="button"
            onClick={loadClients}
            className="rounded-lg bg-white px-3 py-1.5 text-sm font-semibold text-red-700 shadow-sm hover:bg-red-100"
          >
            Reintentar
          </button>
        </div>
      )}

      {/* ======================================================
          KPIs
      ======================================================= */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">
                Total clientes
              </p>

              <p className="mt-2 text-2xl font-bold text-slate-900">
                {loading ? "—" : clients.length}
              </p>
            </div>

            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
              <Users size={21} />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">
                Clientes activos
              </p>

              <p className="mt-2 text-2xl font-bold text-slate-900">
                {loading ? "—" : activeClients}
              </p>
            </div>

            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <UserRound size={21} />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">
                Clientes inactivos
              </p>

              <p className="mt-2 text-2xl font-bold text-slate-900">
                {loading ? "—" : inactiveClients}
              </p>
            </div>

            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-slate-500">
              <UserRound size={21} />
            </div>
          </div>
        </div>
      </div>

      {/* ======================================================
          TABLA
      ======================================================= */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        {/* Toolbar */}
        <div className="flex flex-col gap-4 border-b border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-semibold text-slate-900">
              Directorio de clientes
            </h2>

            <p className="mt-1 text-xs text-slate-500">
              {loading
                ? "Cargando registros..."
                : `${filteredClients.length} registros encontrados`}
            </p>
          </div>

          <div className="relative w-full sm:w-80">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar por nombre, documento..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-100"
            />
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div className="divide-y divide-slate-100">
            {[1, 2, 3, 4].map((item) => (
              <div
                key={item}
                className="flex items-center gap-4 px-6 py-5"
              >
                <div className="h-10 w-10 animate-pulse rounded-full bg-slate-200" />

                <div className="flex-1 space-y-2">
                  <div className="h-4 w-48 animate-pulse rounded bg-slate-200" />
                  <div className="h-3 w-32 animate-pulse rounded bg-slate-100" />
                </div>

                <div className="hidden h-4 w-32 animate-pulse rounded bg-slate-100 md:block" />
                <div className="hidden h-6 w-20 animate-pulse rounded-full bg-slate-100 md:block" />
              </div>
            ))}
          </div>
        )}

        {/* Desktop */}
        {!loading && (
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full">
              <thead className="bg-slate-50">
                <tr className="border-b border-slate-200">
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Cliente
                  </th>

                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Contacto
                  </th>

                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Dirección
                  </th>

                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Estado
                  </th>

                  <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Acción
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {filteredClients.map((client) => (
                  <tr
                    key={client.id}
                    className="transition hover:bg-slate-50/70"
                  >
                    {/* Cliente */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-indigo-50 font-semibold text-indigo-600">
                          {getInitials(
                            client.nombres,
                            client.apellidos
                          )}
                        </div>

                        <div>
                          <p className="font-semibold text-slate-800">
                            {client.nombres} {client.apellidos}
                          </p>

                          <p className="mt-0.5 text-xs text-slate-500">
                            {client.documento}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Contacto */}
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-sm text-slate-600">
                          <Phone size={14} />
                          <span>{client.telefono}</span>
                        </div>

                        {client.email ? (
                          <div className="flex items-center gap-2 text-xs text-slate-500">
                            <Mail size={14} />
                            <span>{client.email}</span>
                          </div>
                        ) : (
                          <span className="text-xs italic text-slate-400">
                            Sin correo
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Dirección */}
                    <td className="px-6 py-4">
                      {client.direccion ? (
                        <div className="flex max-w-xs items-start gap-2 text-sm text-slate-600">
                          <MapPin
                            size={15}
                            className="mt-0.5 shrink-0"
                          />
                          <span className="truncate">
                            {client.direccion}
                          </span>
                        </div>
                      ) : (
                        <span className="text-sm italic text-slate-400">
                          Sin dirección
                        </span>
                      )}
                    </td>

                    {/* Estado */}
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                          client.activo
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {client.activo ? "Activo" : "Inactivo"}
                      </span>
                    </td>

                    {/* Acciones */}
                    <td className="relative px-6 py-4 text-right">
                      {canEdit && (
                        <>
                          <button
                            type="button"
                            onClick={() =>
                              setMenuOpen(
                                menuOpen === client.id
                                  ? null
                                  : client.id
                              )
                            }
                            className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                          >
                            <MoreHorizontal size={18} />
                          </button>

                          {menuOpen === client.id && (
                            <div className="absolute right-6 top-12 z-20 w-44 rounded-xl border border-slate-200 bg-white p-1.5 text-left shadow-xl">
                              <button
                                type="button"
                                onClick={() =>
                                  openEditModal(client)
                                }
                                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-600 transition hover:bg-slate-50"
                              >
                                <Pencil size={15} />
                                Editar cliente
                              </button>
                            </div>
                          )}
                        </>
                      )}

                      {!canEdit && (
                        <span className="text-xs text-slate-400">
                          Solo lectura
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Mobile */}
        {!loading && (
          <div className="divide-y divide-slate-100 md:hidden">
            {filteredClients.map((client) => (
              <div key={client.id} className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-indigo-50 font-semibold text-indigo-600">
                      {getInitials(
                        client.nombres,
                        client.apellidos
                      )}
                    </div>

                    <div>
                      <p className="font-semibold text-slate-800">
                        {client.nombres} {client.apellidos}
                      </p>

                      <p className="text-xs text-slate-500">
                        {client.documento}
                      </p>
                    </div>
                  </div>

                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                      client.activo
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {client.activo ? "Activo" : "Inactivo"}
                  </span>
                </div>

                <div className="mt-4 space-y-2 text-sm text-slate-500">
                  <p className="flex items-center gap-2">
                    <Phone size={15} />
                    {client.telefono}
                  </p>

                  {client.email && (
                    <p className="flex items-center gap-2">
                      <Mail size={15} />
                      {client.email}
                    </p>
                  )}

                  {client.direccion && (
                    <p className="flex items-center gap-2">
                      <MapPin size={15} />
                      {client.direccion}
                    </p>
                  )}
                </div>

                {canEdit && (
                  <button
                    type="button"
                    onClick={() => openEditModal(client)}
                    className="mt-4 inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
                  >
                    <Pencil size={15} />
                    Editar
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Empty */}
        {!loading && filteredClients.length === 0 && !error && (
          <div className="p-12 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
              <Users size={28} />
            </div>

            <p className="mt-4 font-semibold text-slate-700">
              {search
                ? "No se encontraron clientes"
                : "Aún no hay clientes registrados"}
            </p>

            <p className="mt-1 text-sm text-slate-500">
              {search
                ? "Intenta realizar una búsqueda diferente."
                : canCreate
                ? "Puedes registrar el primer cliente desde el botón Nuevo cliente."
                : "Los clientes registrados aparecerán aquí."}
            </p>

            {!search && canCreate && (
              <button
                type="button"
                onClick={openCreateModal}
                className="mt-4 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700"
              >
                <Plus size={17} />
                Registrar cliente
              </button>
            )}
          </div>
        )}
      </div>

      {/* ======================================================
          MODAL CREAR / EDITAR
      ======================================================= */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeModal();
            }
          }}
        >
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
            {/* Modal header */}
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  {editingClient
                    ? "Editar cliente"
                    : "Nuevo cliente"}
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  {editingClient
                    ? "Actualiza la información del cliente."
                    : "Registra un nuevo cliente en SIGES."}
                </p>
              </div>

              <button
                type="button"
                onClick={closeModal}
                disabled={saving}
                className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50"
              >
                <X size={20} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit}>
              <div className="space-y-5 p-6">
                {formError && (
                  <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4">
                    <AlertCircle
                      size={18}
                      className="mt-0.5 shrink-0 text-red-600"
                    />

                    <p className="text-sm font-medium text-red-700">
                      {formError}
                    </p>
                  </div>
                )}

                {/* Datos personales */}
                <div>
                  <div className="mb-3 flex items-center gap-2">
                    <UserRound
                      size={17}
                      className="text-indigo-600"
                    />

                    <h3 className="font-semibold text-slate-800">
                      Datos del cliente
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-slate-700">
                        Nombres *
                      </label>

                      <input
                        type="text"
                        name="nombres"
                        value={form.nombres}
                        onChange={handleChange}
                        placeholder="Ej. Juan Carlos"
                        disabled={saving}
                        className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 disabled:bg-slate-50"
                      />
                    </div>

                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-slate-700">
                        Apellidos *
                      </label>

                      <input
                        type="text"
                        name="apellidos"
                        value={form.apellidos}
                        onChange={handleChange}
                        placeholder="Ej. Pérez López"
                        disabled={saving}
                        className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 disabled:bg-slate-50"
                      />
                    </div>

                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-slate-700">
                        Documento *
                      </label>

                      <div className="relative">
                        <FileText
                          size={16}
                          className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                        />

                        <input
                          type="text"
                          name="documento"
                          value={form.documento}
                          onChange={handleChange}
                          placeholder="DNI / RUC"
                          disabled={saving}
                          className="w-full rounded-xl border border-slate-200 py-2.5 pl-9 pr-3.5 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 disabled:bg-slate-50"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-slate-700">
                        Teléfono *
                      </label>

                      <div className="relative">
                        <Phone
                          size={16}
                          className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                        />

                        <input
                          type="text"
                          name="telefono"
                          value={form.telefono}
                          onChange={handleChange}
                          placeholder="Ej. 987654321"
                          disabled={saving}
                          className="w-full rounded-xl border border-slate-200 py-2.5 pl-9 pr-3.5 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 disabled:bg-slate-50"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Contacto */}
                <div>
                  <div className="mb-3 flex items-center gap-2">
                    <Mail size={17} className="text-indigo-600" />

                    <h3 className="font-semibold text-slate-800">
                      Información de contacto
                    </h3>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-slate-700">
                        Correo electrónico
                      </label>

                      <input
                        type="email"
                        name="email"
                        value={form.email}
                        onChange={handleChange}
                        placeholder="cliente@correo.com"
                        disabled={saving}
                        className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 disabled:bg-slate-50"
                      />
                    </div>

                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-slate-700">
                        Dirección
                      </label>

                      <div className="relative">
                        <MapPin
                          size={16}
                          className="absolute left-3 top-3 text-slate-400"
                        />

                        <textarea
                          name="direccion"
                          value={form.direccion}
                          onChange={handleChange}
                          placeholder="Dirección del cliente"
                          rows={3}
                          disabled={saving}
                          className="w-full resize-none rounded-xl border border-slate-200 py-2.5 pl-9 pr-3.5 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 disabled:bg-slate-50"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Estado */}
                {editingClient && (
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <label className="flex cursor-pointer items-center justify-between gap-4">
                      <div>
                        <p className="text-sm font-semibold text-slate-800">
                          Cliente activo
                        </p>

                        <p className="mt-0.5 text-xs text-slate-500">
                          Los clientes inactivos no aparecen en el listado
                          principal del backend.
                        </p>
                      </div>

                      <input
                        type="checkbox"
                        name="activo"
                        checked={form.activo}
                        onChange={handleChange}
                        disabled={saving}
                        className="h-5 w-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                      />
                    </label>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="flex flex-col-reverse gap-3 border-t border-slate-200 bg-slate-50 px-6 py-4 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={saving}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 disabled:opacity-50"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving && (
                    <Loader2 size={17} className="animate-spin" />
                  )}

                  {saving
                    ? "Guardando..."
                    : editingClient
                    ? "Guardar cambios"
                    : "Registrar cliente"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
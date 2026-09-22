
import React, { useEffect, useMemo, useState } from "react";
import {
  Search,
  Plus,
  Laptop,
  Smartphone,
  Monitor,
  MoreHorizontal,
  UserRound,
  X,
  Loader2,
  RefreshCw,
  PackageOpen,
  Cpu,
  Tablet,
  Pencil,
  Trash2,
} from "lucide-react";
import api from "../services/api";
import { ConfirmDeleteDialog } from "../components/ConfirmDeleteDialog";

const emptyForm = {
  cliente_id: "",
  tipo: "",
  marca: "",
  modelo: "",
  numero_serie: "",
  descripcion: "",
};

function EquipmentIcon({ type }) {
  const value = String(type || "").toLowerCase();

  if (
    value.includes("celular") ||
    value.includes("smartphone") ||
    value.includes("telefono") ||
    value.includes("teléfono")
  ) {
    return <Smartphone size={21} />;
  }

  if (value.includes("monitor")) {
    return <Monitor size={21} />;
  }

  if (value.includes("tablet")) {
    return <Tablet size={21} />;
  }

  if (
    value.includes("pc") ||
    value.includes("computadora") ||
    value.includes("desktop")
  ) {
    return <Cpu size={21} />;
  }

  return <Laptop size={21} />;
}

function getClientName(client) {
  if (!client) return "Cliente desconocido";

  return `${client.nombres || ""} ${client.apellidos || ""}`.trim();
}

function getInitials(name) {
  if (!name) return "?";

  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();
}

function getErrorMessage(error) {
  const detail = error?.response?.data?.detail;

  if (typeof detail === "string") {
    return detail;
  }

  if (Array.isArray(detail)) {
    return detail
      .map((item) => item?.msg || String(item))
      .join(", ");
  }

  if (detail && typeof detail === "object") {
    return detail.msg || JSON.stringify(detail);
  }

  return (
    error?.response?.data?.message ||
    error?.message ||
    "Ocurrió un error inesperado."
  );
}

function formatDate(date) {
  if (!date) return "—";

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return "—";
  }

  return parsedDate.toLocaleDateString("es-PE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export function Equipment() {
  const [equipment, setEquipment] = useState([]);
  const [clients, setClients] = useState([]);

  const [search, setSearch] = useState("");
  const [menuOpen, setMenuOpen] = useState(null);

  const [loading, setLoading] = useState(true);
  const [loadingClients, setLoadingClients] = useState(true);

  const [error, setError] = useState("");
  const [clientsError, setClientsError] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingEquipment, setEditingEquipment] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState("");

  const loadEquipment = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/equipment/");
      setEquipment(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      console.error("Error cargando equipos:", err);
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const loadClients = async () => {
    try {
      setLoadingClients(true);
      setClientsError("");

      const response = await api.get("/clients/");
      setClients(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      console.error("Error cargando clientes:", err);
      setClientsError(getErrorMessage(err));
    } finally {
      setLoadingClients(false);
    }
  };

  useEffect(() => {
    loadEquipment();
    loadClients();
  }, []);

  const clientsById = useMemo(() => {
    const map = {};

    clients.forEach((client) => {
      map[client.id] = client;
    });

    return map;
  }, [clients]);

  const equipmentWithClient = useMemo(() => {
    return equipment.map((item) => ({
      ...item,
      client: clientsById[item.cliente_id] || null,
    }));
  }, [equipment, clientsById]);

  const filteredEquipment = useMemo(() => {
    const value = search.trim().toLowerCase();

    if (!value) {
      return equipmentWithClient;
    }

    return equipmentWithClient.filter((item) => {
      const clientName = getClientName(item.client);

      return (
        String(item.id).includes(value) ||
        String(item.tipo || "").toLowerCase().includes(value) ||
        String(item.marca || "").toLowerCase().includes(value) ||
        String(item.modelo || "").toLowerCase().includes(value) ||
        String(item.numero_serie || "")
          .toLowerCase()
          .includes(value) ||
        String(item.descripcion || "")
          .toLowerCase()
          .includes(value) ||
        clientName.toLowerCase().includes(value)
      );
    });
  }, [equipmentWithClient, search]);

  const clientCount = useMemo(() => {
    return new Set(equipment.map((item) => item.cliente_id)).size;
  }, [equipment]);

  const typeCount = useMemo(() => {
    return new Set(
      equipment
        .map((item) => item.tipo)
        .filter(Boolean)
        .map((tipo) => tipo.toLowerCase())
    ).size;
  }, [equipment]);

  const openModal = () => {
    setEditingEquipment(null);
    setForm(emptyForm);
    setFormError("");
    setModalOpen(true);
  };

  const openEditModal = (item) => {
    setEditingEquipment(item);
    setMenuOpen(null);
    setFormError("");
    setForm({
      cliente_id: String(item.cliente_id || ""),
      tipo: item.tipo || "",
      marca: item.marca || "",
      modelo: item.modelo || "",
      numero_serie: item.numero_serie || "",
      descripcion: item.descripcion || "",
    });
    setModalOpen(true);
  };

  const closeModal = () => {
    if (saving) return;

    setModalOpen(false);
    setEditingEquipment(null);
    setForm(emptyForm);
    setFormError("");
  };

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));

    if (formError) {
      setFormError("");
    }
  };

  const validateForm = () => {
    if (!form.cliente_id) {
      return "Selecciona un cliente.";
    }

    if (!form.tipo.trim()) {
      return "Ingresa el tipo de equipo.";
    }

    if (!form.marca.trim()) {
      return "Ingresa la marca del equipo.";
    }

    if (!form.modelo.trim()) {
      return "Ingresa el modelo del equipo.";
    }

    return "";
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const validationError = validateForm();

    if (validationError) {
      setFormError(validationError);
      return;
    }

    try {
      setSaving(true);
      setFormError("");

      const payload = {
        cliente_id: Number(form.cliente_id),
        tipo: form.tipo.trim(),
        marca: form.marca.trim(),
        modelo: form.modelo.trim(),
        numero_serie: form.numero_serie.trim() || null,
        descripcion: form.descripcion.trim() || null,
      };

      if (editingEquipment) {
        await api.put(`/equipment/${editingEquipment.id}`, payload);
      } else {
        await api.post("/equipment/", payload);
      }

      setModalOpen(false);
      setEditingEquipment(null);
      setForm(emptyForm);
      setFormError("");

      await loadEquipment();
    } catch (err) {
      console.error("Error registrando equipo:", err);
      setFormError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  // IMPLEMENTACIÓN: acciones reales para el menú contextual de cada equipo.
  const requestDelete = (item) => {
    setMenuOpen(null);
    setDeleteError("");
    setDeleteTarget(item);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      setDeleting(true);
      setDeleteError("");
      await api.delete(`/equipment/${deleteTarget.id}`);
      setDeleteTarget(null);
      await loadEquipment();
    } catch (err) {
      setDeleteError(getErrorMessage(err));
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div
      className="space-y-6"
      onClick={() => {
        if (menuOpen !== null) {
          setMenuOpen(null);
        }
      }}
    >
      {/* HEADER */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Equipos
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Controla los equipos registrados y asociados a cada cliente.
          </p>
        </div>

        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            openModal();
          }}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700"
        >
          <Plus size={18} />
          Registrar equipo
        </button>
      </div>

      {/* KPIS */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">
                Total equipos
              </p>

              <p className="mt-2 text-2xl font-bold text-slate-900">
                {loading ? "—" : equipment.length}
              </p>
            </div>

            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
              <Laptop size={21} />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">
                Tipos registrados
              </p>

              <p className="mt-2 text-2xl font-bold text-slate-900">
                {loading ? "—" : typeCount}
              </p>
            </div>

            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
              <PackageOpen size={21} />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">
                Clientes asociados
              </p>

              <p className="mt-2 text-2xl font-bold text-slate-900">
                {loading ? "—" : clientCount}
              </p>
            </div>

            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <UserRound size={21} />
            </div>
          </div>
        </div>
      </div>

      {/* ERROR GENERAL */}
      {error && (
        <div className="flex flex-col gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-semibold text-red-800">
              No se pudieron cargar los equipos
            </p>

            <p className="mt-1 text-sm text-red-700">{error}</p>
          </div>

          <button
            type="button"
            onClick={loadEquipment}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-200 bg-white px-3 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-100"
          >
            <RefreshCw size={16} />
            Reintentar
          </button>
        </div>
      )}

      {/* TABLA */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        {/* TOOLBAR */}
        <div className="flex flex-col gap-4 border-b border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-semibold text-slate-900">
              Registro de equipos
            </h2>

            <p className="mt-1 text-xs text-slate-500">
              {loading
                ? "Cargando equipos..."
                : `${filteredEquipment.length} equipos encontrados`}
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
              placeholder="Buscar equipo, serie, cliente..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-100"
            />
          </div>
        </div>

        {/* LOADING */}
        {loading && (
          <div className="divide-y divide-slate-100">
            {[1, 2, 3].map((item) => (
              <div key={item} className="animate-pulse p-6">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-xl bg-slate-200" />

                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-48 rounded bg-slate-200" />
                    <div className="h-3 w-32 rounded bg-slate-100" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* DESKTOP */}
        {!loading && !error && (
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full">
              <thead className="bg-slate-50">
                <tr className="border-b border-slate-200">
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Equipo
                  </th>

                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Identificación
                  </th>

                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Cliente
                  </th>

                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Registro
                  </th>

                  <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Acción
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {filteredEquipment.map((item) => {
                  const clientName = getClientName(item.client);

                  return (
                    <tr
                      key={item.id}
                      className="transition hover:bg-slate-50/70"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                            <EquipmentIcon type={item.tipo} />
                          </div>

                          <div>
                            <p className="font-semibold text-slate-800">
                              {item.marca} {item.modelo}
                            </p>

                            <p className="mt-0.5 text-xs text-slate-500">
                              #{item.id} · {item.tipo}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <p className="text-sm font-medium text-slate-700">
                          {item.numero_serie || "Sin número de serie"}
                        </p>

                        {item.descripcion && (
                          <p className="mt-1 max-w-xs truncate text-xs text-slate-500">
                            {item.descripcion}
                          </p>
                        )}
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-600">
                            {getInitials(clientName)}
                          </div>

                          <div>
                            <p className="text-sm font-medium text-slate-700">
                              {clientName}
                            </p>

                            <p className="text-xs text-slate-400">
                              Cliente #{item.cliente_id}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <span className="inline-flex rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                          Registrado
                        </span>

                        <p className="mt-1 text-xs text-slate-400">
                          {formatDate(item.created_at)}
                        </p>
                      </td>

                      <td className="relative px-6 py-4 text-right">
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            setMenuOpen(
                              menuOpen === item.id ? null : item.id
                            );
                          }}
                          className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                          title="Opciones"
                        >
                          <MoreHorizontal size={18} />
                        </button>

                        {menuOpen === item.id && (
                          <div
                            onClick={(event) => event.stopPropagation()}
                            className="absolute bottom-12 right-6 z-20 w-48 rounded-xl border border-slate-200 bg-white p-1.5 text-left shadow-xl"
                          >
                            <button type="button" onClick={() => openEditModal(item)} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-600 hover:bg-slate-50">
                              <Pencil size={15} /> Editar equipo
                            </button>
                            <button type="button" onClick={() => requestDelete(item)} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-red-600 hover:bg-red-50">
                              <Trash2 size={15} /> Eliminar equipo
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* MOBILE */}
        {!loading && !error && (
          <div className="divide-y divide-slate-100 md:hidden">
            {filteredEquipment.map((item) => {
              const clientName = getClientName(item.client);

              return (
                <div key={item.id} className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                        <EquipmentIcon type={item.tipo} />
                      </div>

                      <div>
                        <p className="font-semibold text-slate-800">
                          {item.marca} {item.modelo}
                        </p>

                        <p className="text-xs text-slate-500">
                          #{item.id} · {item.tipo}
                        </p>
                      </div>
                    </div>

                    <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                      Registrado
                    </span>
                  </div>

                  <div className="mt-4 space-y-2 text-sm text-slate-500">
                    <p>
                      <span className="font-medium text-slate-700">
                        Serie:
                      </span>{" "}
                      {item.numero_serie || "No registrada"}
                    </p>

                    <p>
                      <span className="font-medium text-slate-700">
                        Cliente:
                      </span>{" "}
                      {clientName}
                    </p>

                    <p>
                      <span className="font-medium text-slate-700">
                        Registro:
                      </span>{" "}
                      {formatDate(item.created_at)}
                    </p>

                    {item.descripcion && (
                      <p>
                        <span className="font-medium text-slate-700">
                          Descripción:
                        </span>{" "}
                        {item.descripcion}
                      </p>
                    )}
                  </div>
                  <div className="mt-4 flex gap-2">
                    <button type="button" onClick={() => openEditModal(item)} className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"><Pencil size={15} /> Editar</button>
                    <button type="button" onClick={() => requestDelete(item)} className="inline-flex items-center gap-2 rounded-lg border border-red-200 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50"><Trash2 size={15} /> Eliminar</button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* EMPTY */}
        {!loading && !error && filteredEquipment.length === 0 && (
          <div className="p-12 text-center">
            <Laptop
              className="mx-auto text-slate-300"
              size={42}
            />

            <p className="mt-3 font-medium text-slate-700">
              {search
                ? "No se encontraron equipos"
                : "Todavía no hay equipos registrados"}
            </p>

            <p className="mt-1 text-sm text-slate-500">
              {search
                ? "Intenta realizar una búsqueda diferente."
                : "Registra el primer equipo para comenzar."}
            </p>

            {!search && (
              <button
                type="button"
                onClick={openModal}
                className="mt-4 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700"
              >
                <Plus size={17} />
                Registrar equipo
              </button>
            )}
          </div>
        )}
      </div>

      {/* MODAL */}
      {modalOpen && (
        <div
          className="siges-modal-overlay fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !saving) {
              closeModal();
            }
          }}
        >
          <div className="siges-modal-panel w-full max-w-2xl rounded-2xl bg-white shadow-2xl">
            {/* Modal header */}
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  {editingEquipment ? "Editar equipo" : "Registrar equipo"}
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  {editingEquipment ? "Actualiza la información del equipo." : "Asocia un equipo a un cliente existente."}
                </p>
              </div>

              <button
                type="button"
                onClick={closeModal}
                disabled={saving}
                className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal body */}
            <form onSubmit={handleSubmit} className="siges-modal-form">
              <div className="siges-modal-body px-6 py-6">
                {formError && (
                  <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {formError}
                  </div>
                )}

                {clientsError && (
                  <div className="mb-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
                    <p className="text-sm font-medium text-amber-800">
                      No se pudieron cargar los clientes.
                    </p>

                    <button
                      type="button"
                      onClick={loadClients}
                      className="mt-2 inline-flex items-center gap-2 text-sm font-semibold text-amber-700 hover:text-amber-900"
                    >
                      <RefreshCw size={15} />
                      Reintentar
                    </button>
                  </div>
                )}

                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                  {/* Cliente */}
                  <div className="sm:col-span-2">
                    <label
                      htmlFor="cliente_id"
                      className="mb-2 block text-sm font-semibold text-slate-700"
                    >
                      Cliente <span className="text-red-500">*</span>
                    </label>

                    <select
                      id="cliente_id"
                      name="cliente_id"
                      value={form.cliente_id}
                      onChange={handleChange}
                      disabled={saving || loadingClients}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 disabled:cursor-not-allowed disabled:bg-slate-50"
                    >
                      <option value="">
                        {loadingClients
                          ? "Cargando clientes..."
                          : "Seleccionar cliente"}
                      </option>

                      {clients.map((client) => (
                        <option key={client.id} value={client.id}>
                          {getClientName(client)} · {client.documento}
                        </option>
                      ))}
                    </select>

                    {!loadingClients && clients.length === 0 && (
                      <p className="mt-2 text-xs text-amber-600">
                        No hay clientes disponibles. Registra un cliente
                        antes de crear un equipo.
                      </p>
                    )}
                  </div>

                  {/* Tipo */}
                  <div>
                    <label
                      htmlFor="tipo"
                      className="mb-2 block text-sm font-semibold text-slate-700"
                    >
                      Tipo <span className="text-red-500">*</span>
                    </label>

                    <select
                      id="tipo"
                      name="tipo"
                      value={form.tipo}
                      onChange={handleChange}
                      disabled={saving}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 disabled:cursor-not-allowed disabled:bg-slate-50"
                    >
                      <option value="">Seleccionar tipo</option>
                      <option value="Laptop">Laptop</option>
                      <option value="PC">PC</option>
                      <option value="Celular">Celular</option>
                      <option value="Tablet">Tablet</option>
                      <option value="Monitor">Monitor</option>
                      <option value="Impresora">Impresora</option>
                      <option value="Otro">Otro</option>
                    </select>
                  </div>

                  {/* Marca */}
                  <div>
                    <label
                      htmlFor="marca"
                      className="mb-2 block text-sm font-semibold text-slate-700"
                    >
                      Marca <span className="text-red-500">*</span>
                    </label>

                    <input
                      id="marca"
                      name="marca"
                      type="text"
                      value={form.marca}
                      onChange={handleChange}
                      disabled={saving}
                      placeholder="Ej. Lenovo"
                      maxLength={50}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 disabled:cursor-not-allowed disabled:bg-slate-50"
                    />
                  </div>

                  {/* Modelo */}
                  <div>
                    <label
                      htmlFor="modelo"
                      className="mb-2 block text-sm font-semibold text-slate-700"
                    >
                      Modelo <span className="text-red-500">*</span>
                    </label>

                    <input
                      id="modelo"
                      name="modelo"
                      type="text"
                      value={form.modelo}
                      onChange={handleChange}
                      disabled={saving}
                      placeholder="Ej. ThinkPad T14"
                      maxLength={50}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 disabled:cursor-not-allowed disabled:bg-slate-50"
                    />
                  </div>

                  {/* Número de serie */}
                  <div>
                    <label
                      htmlFor="numero_serie"
                      className="mb-2 block text-sm font-semibold text-slate-700"
                    >
                      Número de serie
                    </label>

                    <input
                      id="numero_serie"
                      name="numero_serie"
                      type="text"
                      value={form.numero_serie}
                      onChange={handleChange}
                      disabled={saving}
                      placeholder="Ej. PF3ABC123"
                      maxLength={100}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 disabled:cursor-not-allowed disabled:bg-slate-50"
                    />
                  </div>

                  {/* Descripción */}
                  <div className="sm:col-span-2">
                    <label
                      htmlFor="descripcion"
                      className="mb-2 block text-sm font-semibold text-slate-700"
                    >
                      Descripción
                    </label>

                    <textarea
                      id="descripcion"
                      name="descripcion"
                      value={form.descripcion}
                      onChange={handleChange}
                      disabled={saving}
                      rows={3}
                      maxLength={255}
                      placeholder="Describe brevemente el estado o características del equipo..."
                      className="w-full resize-none rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 disabled:cursor-not-allowed disabled:bg-slate-50"
                    />
                  </div>
                </div>
              </div>

              {/* Modal footer */}
              <div className="siges-modal-footer flex flex-col-reverse gap-3 border-t border-slate-200 bg-slate-50 px-6 py-4 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={saving}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  disabled={saving || loadingClients || clients.length === 0}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving && <Loader2 size={17} className="animate-spin" />}
                  {saving ? "Guardando..." : editingEquipment ? "Guardar cambios" : "Registrar equipo"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmDeleteDialog
        open={Boolean(deleteTarget)}
        title="Eliminar equipo"
        description={`¿Deseas eliminar ${deleteTarget?.marca || "este equipo"} ${deleteTarget?.modelo || ""}? Esta acción no se puede deshacer.`}
        error={deleteError}
        deleting={deleting}
        onCancel={() => !deleting && setDeleteTarget(null)}
        onConfirm={handleDelete}
      />
    </div>
  );
}

import React, { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Clock3,
  Loader2,
  Plus,
  RefreshCw,
  Search,
  User,
  Wrench,
  X,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import api from "../services/api";
import { useAuth } from "../context/AuthContext";

const SERVICE_TYPES = [
  "Reparación",
  "Mantenimiento",
  "Venta",
  "Antivirus / Licencia",
  "Armado de PC",
  "Instalación",
  "Diagnóstico",
  "Otro",
];

const STATUS_CONFIG = {
  RECIBIDO: {
    label: "Recibido",
    className: "bg-blue-50 text-blue-700 border-blue-200",
  },
  DIAGNOSTICO: {
    label: "Diagnóstico",
    className: "bg-indigo-50 text-indigo-700 border-indigo-200",
  },
  EN_PROCESO: {
    label: "En proceso",
    className: "bg-amber-50 text-amber-700 border-amber-200",
  },
  ESPERA: {
    label: "En espera",
    className: "bg-orange-50 text-orange-700 border-orange-200",
  },
  TERMINADO: {
    label: "Terminado",
    className: "bg-green-50 text-green-700 border-green-200",
  },
  ENTREGADO: {
    label: "Entregado",
    className: "bg-slate-100 text-slate-700 border-slate-200",
  },
  CANCELADO: {
    label: "Cancelado",
    className: "bg-red-50 text-red-700 border-red-200",
  },
};

const INITIAL_FORM = {
  cliente_id: "",
  equipo_id: "",
  tipo_servicio: "Reparación",
  descripcion: "",
  fecha_estimada: "",
  usuario_responsable_id: "",
  monto: "",
};

function formatCurrency(value) {
  const number = Number(value || 0);

  return new Intl.NumberFormat("es-PE", {
    style: "currency",
    currency: "PEN",
  }).format(number);
}

function formatDate(value) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return date.toLocaleDateString("es-PE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function StatusBadge({ status }) {
  const config =
    STATUS_CONFIG[status] || {
      label: status || "Desconocido",
      className: "bg-slate-50 text-slate-600 border-slate-200",
    };

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${config.className}`}
    >
      {config.label}
    </span>
  );
}

function Modal({ open, onClose, children }) {
  if (!open) return null;

  return (
    <div className="siges-modal-overlay fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
      <div className="siges-modal-panel w-full max-w-2xl rounded-2xl bg-white shadow-2xl">
        {children}
      </div>
    </div>
  );
}

export const Services = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
 console.log("USUARIO ACTUAL:", user);
  const [services, setServices] = useState([]);
  const [clients, setClients] = useState([]);
  const [equipment, setEquipment] = useState([]);
  const [users, setUsers] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("TODOS");

  const [modalOpen, setModalOpen] = useState(false);

  const [form, setForm] = useState(INITIAL_FORM);

  const currentRole =
    typeof user?.rol === "string"
      ? user.rol
      : user?.rol?.nombre;

  const canCreate =
    currentRole === "ADMIN" ||
    currentRole === "TECNICO";

  const fetchData = async () => {
    setLoading(true);
    setError("");

    try {
      const requests = [
        api.get("/services/"),
        api.get("/clients/"),
        api.get("/equipment/"),
      ];

      if (currentRole === "ADMIN") {
        requests.push(api.get("/users/"));
      }

      const responses = await Promise.all(requests);

      setServices(responses[0].data || []);
      setClients(responses[1].data || []);
      setEquipment(responses[2].data || []);

      if (currentRole === "ADMIN") {
        setUsers(responses[3].data || []);
      }
    } catch (err) {
      console.error(err);

      setError(
        err?.response?.data?.detail ||
          "No se pudieron cargar los servicios."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user?.rol]);

  const getClientName = (clientId) => {
    const client = clients.find(
      (item) => item.id === Number(clientId)
    );

    if (!client) {
      return `Cliente #${clientId}`;
    }

    return `${client.nombres || ""} ${
      client.apellidos || ""
    }`.trim();
  };

  const getEquipmentName = (equipmentId) => {
    if (!equipmentId) {
      return null;
    }

    const item = equipment.find(
      (equipmentItem) =>
        equipmentItem.id === Number(equipmentId)
    );

    if (!item) {
      return `Equipo #${equipmentId}`;
    }

    return `${item.marca} ${item.modelo}`;
  };

  const selectedClientEquipment = useMemo(() => {
    if (!form.cliente_id) {
      return [];
    }

    return equipment.filter(
      (item) =>
        Number(item.cliente_id) === Number(form.cliente_id)
    );
  }, [equipment, form.cliente_id]);

  const filteredServices = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return services.filter((service) => {
      const clientName = getClientName(
        service.cliente_id
      ).toLowerCase();

      const matchesSearch =
        !normalizedSearch ||
        String(service.id).includes(normalizedSearch) ||
        String(service.tipo_servicio || "")
          .toLowerCase()
          .includes(normalizedSearch) ||
        String(service.descripcion || "")
          .toLowerCase()
          .includes(normalizedSearch) ||
        clientName.includes(normalizedSearch);

      const matchesStatus =
        statusFilter === "TODOS" ||
        service.estado === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [services, search, statusFilter, clients]);

  const stats = useMemo(() => {
    return {
      total: services.length,
      recibidos: services.filter(
        (item) => item.estado === "RECIBIDO"
      ).length,
      proceso: services.filter(
        (item) =>
          item.estado === "DIAGNOSTICO" ||
          item.estado === "EN_PROCESO"
      ).length,
      terminados: services.filter(
        (item) =>
          item.estado === "TERMINADO" ||
          item.estado === "ENTREGADO"
      ).length,
    };
  }, [services]);

  const openCreateModal = () => {
    setError("");

    setForm(INITIAL_FORM);

    setModalOpen(true);
  };

  const closeModal = () => {
    if (saving) return;

    setModalOpen(false);
    setForm(INITIAL_FORM);
  };

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));

    if (name === "cliente_id") {
      setForm((previous) => ({
        ...previous,
        cliente_id: value,
        equipo_id: "",
      }));
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!form.cliente_id) {
      setError("Selecciona un cliente.");
      return;
    }

    if (!form.tipo_servicio.trim()) {
      setError("Selecciona el tipo de servicio.");
      return;
    }

    if (!form.descripcion.trim()) {
      setError("Ingresa una descripción del servicio.");
      return;
    }

    if (
      form.monto !== "" &&
      Number(form.monto) < 0
    ) {
      setError("El monto no puede ser negativo.");
      return;
    }

    setSaving(true);
    setError("");

    try {
      const payload = {
        cliente_id: Number(form.cliente_id),
        equipo_id: form.equipo_id
          ? Number(form.equipo_id)
          : null,
        tipo_servicio: form.tipo_servicio.trim(),
        descripcion: form.descripcion.trim(),
        fecha_estimada: form.fecha_estimada
          ? new Date(
              `${form.fecha_estimada}T23:59:00`
            ).toISOString()
          : null,
        usuario_responsable_id:
          form.usuario_responsable_id
            ? Number(form.usuario_responsable_id)
            : null,
        monto:
          form.monto === ""
            ? 0
            : Number(form.monto),
      };

      await api.post("/services/", payload);

      await fetchData();

      setModalOpen(false);
      setForm(INITIAL_FORM);
    } catch (err) {
      console.error(err);

      setError(
        err?.response?.data?.detail ||
          "No se pudo registrar el servicio."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleStatusChange = async (
    serviceId,
    newStatus
  ) => {
    try {
      await api.patch(
        `/services/${serviceId}/status`,
        {
          estado: newStatus,
        }
      );

      await fetchData();
    } catch (err) {
      console.error(err);

      setError(
        err?.response?.data?.detail ||
          "No se pudo actualizar el estado."
      );
    }
  };

  const handleNotify = async (serviceId) => {
    try {
      await api.post("/notifications/send", {
        servicio_id: serviceId,
        mensaje:
          "Hola, su servicio se encuentra listo para ser recogido. Gracias por su confianza.",
      });

      window.alert(
        "Notificación registrada correctamente."
      );
    } catch (err) {
      console.error(err);

      window.alert(
        err?.response?.data?.detail ||
          "No se pudo registrar la notificación."
      );
    }
  };

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="mb-1 flex items-center gap-2 text-sm text-slate-500">
            <ClipboardList className="h-4 w-4" />
            Operaciones
          </div>

          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Servicios
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Gestiona órdenes, trabajos, ventas y servicios
            asociados a tus clientes.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchData}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <RefreshCw
              className={`h-4 w-4 ${
                loading ? "animate-spin" : ""
              }`}
            />

            Actualizar
          </button>

          {canCreate && (
            <button
              onClick={openCreateModal}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700"
            >
              <Plus className="h-4 w-4" />
              Nuevo servicio
            </button>
          )}
        </div>
      </div>

      {/* ERROR */}
      {error && !modalOpen && (
        <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />

          <div className="flex-1">
            <p className="font-semibold">
              Ocurrió un problema
            </p>

            <p className="mt-1">{error}</p>
          </div>

          <button
            onClick={() => setError("")}
            className="text-red-500 hover:text-red-700"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total servicios"
          value={stats.total}
          icon={ClipboardList}
          description="Órdenes registradas"
        />

        <StatCard
          label="Recibidos"
          value={stats.recibidos}
          icon={Clock3}
          description="Pendientes de atención"
        />

        <StatCard
          label="En proceso"
          value={stats.proceso}
          icon={Wrench}
          description="Diagnóstico o trabajo"
        />

        <StatCard
          label="Finalizados"
          value={stats.terminados}
          icon={CheckCircle2}
          description="Terminados o entregados"
        />
      </div>

      {/* FILTERS */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

            <input
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="Buscar por servicio, cliente o descripción..."
              className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(event.target.value)
            }
            className="h-11 rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm font-medium text-slate-700 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
          >
            <option value="TODOS">
              Todos los estados
            </option>

            {Object.entries(STATUS_CONFIG).map(
              ([value, config]) => (
                <option key={value} value={value}>
                  {config.label}
                </option>
              )
            )}
          </select>
        </div>
      </div>

      {/* TABLE */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-6 py-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="font-semibold text-slate-900">
                Órdenes de servicio
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                {filteredServices.length}{" "}
                {filteredServices.length === 1
                  ? "servicio encontrado"
                  : "servicios encontrados"}
              </p>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center px-6 py-20">
            <div className="flex items-center gap-3 text-sm text-slate-500">
              <Loader2 className="h-5 w-5 animate-spin" />
              Cargando servicios...
            </div>
          </div>
        ) : filteredServices.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100">
              <ClipboardList className="h-7 w-7 text-slate-400" />
            </div>

            <h3 className="mt-4 font-semibold text-slate-900">
              No hay servicios
            </h3>

            <p className="mx-auto mt-1 max-w-md text-sm text-slate-500">
              No encontramos servicios con los filtros
              actuales.
            </p>

            {canCreate && (
              <button
                onClick={openCreateModal}
                className="mt-5 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700"
              >
                <Plus className="h-4 w-4" />
                Registrar servicio
              </button>
            )}
          </div>
        ) : (
          <>
            {/* DESKTOP */}
            <div className="hidden overflow-x-auto lg:block">
              <table className="min-w-full">
                <thead className="border-b border-slate-100 bg-slate-50/70">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Servicio
                    </th>

                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Cliente
                    </th>

                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Tipo
                    </th>

                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Estado
                    </th>

                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Monto
                    </th>

                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Ingreso
                    </th>

                    <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Acción
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {filteredServices.map((service) => (
                    <tr
                      key={service.id}
                      className="transition hover:bg-slate-50/70"
                    >
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-semibold text-slate-900">
                            Servicio #{service.id}
                          </p>

                          <p className="mt-1 max-w-xs truncate text-xs text-slate-500">
                            {service.descripcion}
                          </p>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                            <User className="h-4 w-4" />
                          </div>

                          <span className="text-sm font-medium text-slate-700">
                            {getClientName(
                              service.cliente_id
                            )}
                          </span>
                        </div>
                      </td>

                      <td className="px-6 py-4 text-sm text-slate-600">
                        {service.tipo_servicio}
                      </td>

                      <td className="px-6 py-4">
                        <StatusBadge
                          status={service.estado}
                        />
                      </td>

                      <td className="px-6 py-4 text-sm font-semibold text-slate-900">
                        {formatCurrency(service.monto)}
                      </td>

                      <td className="px-6 py-4 text-sm text-slate-500">
                        {formatDate(
                          service.fecha_ingreso
                        )}
                      </td>

                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() =>
                            navigate(
                              `/servicios/${service.id}`
                            )
                          }
                          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700"
                        >
                          Ver detalle
                          <ArrowRight className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* MOBILE */}
            <div className="divide-y divide-slate-100 lg:hidden">
              {filteredServices.map((service) => (
                <div
                  key={service.id}
                  className="p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-900">
                        Servicio #{service.id}
                      </p>

                      <p className="mt-1 text-sm text-slate-500">
                        {getClientName(
                          service.cliente_id
                        )}
                      </p>
                    </div>

                    <StatusBadge
                      status={service.estado}
                    />
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-xs text-slate-400">
                        Tipo
                      </p>

                      <p className="mt-1 text-sm font-medium text-slate-700">
                        {service.tipo_servicio}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-slate-400">
                        Monto
                      </p>

                      <p className="mt-1 text-sm font-semibold text-slate-900">
                        {formatCurrency(
                          service.monto
                        )}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-slate-400">
                        Ingreso
                      </p>

                      <p className="mt-1 text-sm text-slate-700">
                        {formatDate(
                          service.fecha_ingreso
                        )}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-slate-400">
                        Equipo
                      </p>

                      <p className="mt-1 truncate text-sm text-slate-700">
                        {getEquipmentName(
                          service.equipo_id
                        ) || "No aplica"}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() =>
                      navigate(
                        `/servicios/${service.id}`
                      )
                    }
                    className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    Ver detalle
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* CREATE MODAL */}
      <Modal
        open={modalOpen}
        onClose={closeModal}
      >
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              Nuevo servicio
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Registra el servicio solicitado por el
              cliente.
            </p>
          </div>

          <button
            onClick={closeModal}
            disabled={saving}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="siges-modal-form"
        >
          <div className="siges-modal-body space-y-5 p-6">
            {error && modalOpen && (
              <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />

                <span>{error}</span>
              </div>
            )}

            <div className="grid gap-5 sm:grid-cols-2">
              {/* CLIENT */}
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                  Cliente *
                </label>

                <select
                  name="cliente_id"
                  value={form.cliente_id}
                  onChange={handleChange}
                  required
                  className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                >
                  <option value="">
                    Seleccionar cliente
                  </option>

                  {clients.map((client) => (
                    <option
                      key={client.id}
                      value={client.id}
                    >
                      {client.nombres}{" "}
                      {client.apellidos} —{" "}
                      {client.documento}
                    </option>
                  ))}
                </select>
              </div>

              {/* TYPE */}
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                  Tipo de servicio *
                </label>

                <select
                  name="tipo_servicio"
                  value={form.tipo_servicio}
                  onChange={handleChange}
                  required
                  className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                >
                  {SERVICE_TYPES.map((type) => (
                    <option
                      key={type}
                      value={type}
                    >
                      {type}
                    </option>
                  ))}
                </select>
              </div>

              {/* EQUIPMENT */}
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                  Equipo
                  <span className="ml-1 font-normal text-slate-400">
                    opcional
                  </span>
                </label>

                <select
                  name="equipo_id"
                  value={form.equipo_id}
                  onChange={handleChange}
                  disabled={!form.cliente_id}
                  className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none disabled:bg-slate-50 disabled:text-slate-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                >
                  <option value="">
                    {form.cliente_id
                      ? "No aplica"
                      : "Selecciona primero un cliente"}
                  </option>

                  {selectedClientEquipment.map(
                    (item) => (
                      <option
                        key={item.id}
                        value={item.id}
                      >
                        {item.marca} {item.modelo} —{" "}
                        {item.tipo}
                      </option>
                    )
                  )}
                </select>

                {form.cliente_id &&
                  selectedClientEquipment.length ===
                    0 && (
                    <p className="mt-1.5 text-xs text-amber-600">
                      Este cliente no tiene equipos
                      registrados.
                    </p>
                  )}
              </div>

              {/* AMOUNT */}
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                  Monto
                </label>

                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-slate-400">
                    S/
                  </span>

                  <input
                    type="number"
                    name="monto"
                    value={form.monto}
                    onChange={handleChange}
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                  />
                </div>
              </div>

              {/* ESTIMATED DATE */}
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                  Fecha estimada
                </label>

                <div className="relative">
                  <CalendarDays className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                  <input
                    type="date"
                    name="fecha_estimada"
                    value={form.fecha_estimada}
                    onChange={handleChange}
                    className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                  />
                </div>
              </div>

              {/* RESPONSIBLE */}
              {currentRole === "ADMIN" && (
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                    Responsable
                  </label>

                  <select
                    name="usuario_responsable_id"
                    value={
                      form.usuario_responsable_id
                    }
                    onChange={handleChange}
                    className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                  >
                    <option value="">
                      Sin asignar
                    </option>

                    {users
                      .filter(
                        (item) =>
                          item.rol?.nombre ===
                            "TECNICO" ||
                          item.rol?.nombre ===
                            "ADMIN"
                      )
                      .map((item) => (
                        <option
                          key={item.id}
                          value={item.id}
                        >
                          {item.nombre}
                        </option>
                      ))}
                  </select>
                </div>
              )}
            </div>

            {/* DESCRIPTION */}
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                Descripción *
              </label>

              <textarea
                name="descripcion"
                value={form.descripcion}
                onChange={handleChange}
                required
                rows={4}
                placeholder="Describe el trabajo solicitado, producto vendido o servicio que se realizará..."
                className="w-full resize-none rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
              />
            </div>

            {/* INFO */}
            <div className="rounded-xl border border-indigo-100 bg-indigo-50 p-4">
              <div className="flex gap-3">
                <ClipboardList className="h-5 w-5 shrink-0 text-indigo-600" />

                <div>
                  <p className="text-sm font-semibold text-indigo-900">
                    Registro comercial
                  </p>

                  <p className="mt-1 text-xs leading-5 text-indigo-700">
                    Después de crear el servicio podrás
                    asociar productos del inventario desde
                    el detalle de la orden.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* FOOTER */}
          <div className="siges-modal-footer flex flex-col-reverse gap-3 border-t border-slate-100 bg-slate-50 px-6 py-4 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={closeModal}
              disabled={saving}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4" />
                  Registrar servicio
                </>
              )}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

function StatCard({
  label,
  value,
  icon: Icon,
  description,
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">
            {label}
          </p>

          <p className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
            {value}
          </p>

          <p className="mt-1 text-xs text-slate-400">
            {description}
          </p>
        </div>

        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}

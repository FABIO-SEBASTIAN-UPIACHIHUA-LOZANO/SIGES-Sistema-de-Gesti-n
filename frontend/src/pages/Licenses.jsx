import React, { useState, useEffect, useMemo } from "react";
import api from "../services/api";
import {
  KeyRound,
  Plus,
  Search,
  ShieldCheck,
  ShieldAlert,
  Clock,
  CheckCircle2,
  XCircle,
  Copy,
  Check,
  Building,
  User,
  Monitor,
  Calendar,
  Sparkles,
  AlertTriangle,
  RefreshCw,
  X,
  FileKey,
  Laptop
} from "lucide-react";

export function Licenses() {
  const [licenses, setLicenses] = useState([]);
  const [clients, setClients] = useState([]);
  const [equipment, setEquipment] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("TODAS");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLicense, setEditingLicense] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [copiedId, setCopiedId] = useState(null);

  const [formData, setFormData] = useState({
    cliente_id: "",
    equipo_id: "",
    categoria: "ANTIVIRUS",
    nombre_producto: "",
    clave_licencia: "",
    cantidad_dispositivos: 1,
    es_permanente: false,
    fecha_inicio: "",
    fecha_fin: "",
    proveedor: "",
    notas: "",
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [licRes, cliRes, eqRes] = await Promise.all([
        api.get("/licenses/"),
        api.get("/clients/"),
        api.get("/equipment/"),
      ]);
      setLicenses(Array.isArray(licRes.data) ? licRes.data : []);
      setClients(Array.isArray(cliRes.data) ? cliRes.data : []);
      setEquipment(Array.isArray(eqRes.data) ? eqRes.data : []);
    } catch (err) {
      console.error("Error al cargar licencias:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCopyKey = (key, id) => {
    navigator.clipboard.writeText(key);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleCategoryChange = (cat) => {
    setFormData((prev) => {
      const isAnti = cat === "ANTIVIRUS";
      return {
        ...prev,
        categoria: cat,
        es_permanente: isAnti ? false : prev.es_permanente,
      };
    });
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const openCreateModal = () => {
    setEditingLicense(null);
    setErrorMsg("");
    setFormData({
      cliente_id: "",
      equipo_id: "",
      categoria: "ANTIVIRUS",
      nombre_producto: "",
      clave_licencia: "",
      cantidad_dispositivos: 1,
      es_permanente: false,
      fecha_inicio: "",
      fecha_fin: "",
      proveedor: "",
      notas: "",
    });
    setIsModalOpen(true);
  };

  const openEditModal = (lic) => {
    setEditingLicense(lic);
    setErrorMsg("");
    setFormData({
      cliente_id: lic.cliente_id || "",
      equipo_id: lic.equipo_id || "",
      categoria: lic.categoria || "ANTIVIRUS",
      nombre_producto: lic.nombre_producto || "",
      clave_licencia: lic.clave_licencia || "",
      cantidad_dispositivos: lic.cantidad_dispositivos || 1,
      es_permanente: lic.es_permanente || false,
      fecha_inicio: lic.fecha_inicio || "",
      fecha_fin: lic.fecha_fin || "",
      proveedor: lic.proveedor || "",
      notas: lic.notas || "",
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");

    // Validar Antivirus
    if (formData.categoria === "ANTIVIRUS") {
      if (formData.es_permanente) {
        setErrorMsg("Las licencias de Antivirus no pueden ser permanentes. Deben tener fecha de caducidad.");
        return;
      }
      if (!formData.fecha_inicio || !formData.fecha_fin) {
        setErrorMsg("Las licencias de Antivirus requieren fecha de inicio y fecha de finalización.");
        return;
      }
    }

    if (!formData.es_permanente && formData.fecha_inicio && formData.fecha_fin) {
      if (new Date(formData.fecha_fin) < new Date(formData.fecha_inicio)) {
        setErrorMsg("La fecha de finalización no puede ser anterior a la fecha de inicio.");
        return;
      }
    }

    setSubmitting(true);

    try {
      const payload = {
        ...formData,
        cliente_id: formData.cliente_id ? Number(formData.cliente_id) : null,
        equipo_id: formData.equipo_id ? Number(formData.equipo_id) : null,
        cantidad_dispositivos: Number(formData.cantidad_dispositivos) || 1,
        fecha_inicio: formData.es_permanente ? null : (formData.fecha_inicio || null),
        fecha_fin: formData.es_permanente ? null : (formData.fecha_fin || null),
      };

      if (editingLicense) {
        await api.put(`/licenses/${editingLicense.id}`, payload);
      } else {
        await api.post("/licenses/", payload);
      }

      setIsModalOpen(false);
      fetchData();
    } catch (err) {
      setErrorMsg(err.response?.data?.detail || "Error al guardar la licencia.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("¿Estás seguro de eliminar esta licencia?")) return;
    try {
      await api.delete(`/licenses/${id}`);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.detail || "Error al eliminar la licencia");
    }
  };

  const filteredLicenses = useMemo(() => {
    return licenses.filter((lic) => {
      const matchCategory =
        selectedCategory === "TODAS" || lic.categoria === selectedCategory;
      const q = search.toLowerCase().trim();
      const matchSearch =
        !q ||
        lic.nombre_producto.toLowerCase().includes(q) ||
        lic.clave_licencia.toLowerCase().includes(q) ||
        (lic.cliente_nombre && lic.cliente_nombre.toLowerCase().includes(q)) ||
        (lic.proveedor && lic.proveedor.toLowerCase().includes(q));
      return matchCategory && matchSearch;
    });
  }, [licenses, selectedCategory, search]);

  // Métricas
  const totalLicencias = licenses.length;
  const antivirusActivos = licenses.filter(
    (l) => l.categoria === "ANTIVIRUS" && l.estado_vencimiento === "ACTIVA"
  ).length;
  const porVencer = licenses.filter(
    (l) => l.estado_vencimiento === "POR_VENCER"
  ).length;
  const vencidas = licenses.filter(
    (l) => l.estado_vencimiento === "VENCIDA"
  ).length;

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <KeyRound className="h-7 w-7 text-indigo-600" />
            Control de Licencias de Software
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Administra claves de licencias (Antivirus, Office, Windows), vigencias y alertas de expiración.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-600/25 transition-all hover:bg-indigo-700"
        >
          <Plus className="h-4 w-4" />
          Nueva Licencia
        </button>
      </div>

      {/* Tarjetas de Métricas */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
              <FileKey className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500">Total Licencias</p>
              <p className="text-2xl font-bold text-slate-900">{totalLicencias}</p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500">Antivirus Activos</p>
              <p className="text-2xl font-bold text-slate-900">{antivirusActivos}</p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
              <Clock className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500">Por Vencer (≤30 días)</p>
              <p className="text-2xl font-bold text-amber-700">{porVencer}</p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-50 text-rose-600">
              <XCircle className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500">Licencias Vencidas</p>
              <p className="text-2xl font-bold text-rose-700">{vencidas}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Alerta de licencias próximas a vencer / vencidas */}
      {(porVencer > 0 || vencidas > 0) && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50/80 p-4 flex items-start gap-3 text-amber-900">
          <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-semibold">Atención con la vigencia de software</p>
            <p className="mt-0.5 text-amber-800">
              Tienes {porVencer > 0 && <span className="font-semibold">{porVencer} licencias por vencer próximamente</span>}
              {porVencer > 0 && vencidas > 0 && " y "}
              {vencidas > 0 && <span className="font-semibold">{vencidas} licencias vencidas</span>}. Se recomienda renovar para evitar vulnerabilidades de seguridad.
            </p>
          </div>
        </div>
      )}

      {/* Filtros de Pestaña y Búsqueda */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        {/* Categorías */}
        <div className="flex flex-wrap gap-1.5 rounded-xl border border-slate-200 bg-slate-50 p-1">
          {["TODAS", "ANTIVIRUS", "OFFICE", "WINDOWS", "OTROS"].map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all ${
                selectedCategory === cat
                  ? "bg-white text-indigo-600 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              {cat === "TODAS" ? "Todas" : cat.charAt(0) + cat.slice(1).toLowerCase()}
            </button>
          ))}
        </div>

        {/* Buscador */}
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por producto, clave o cliente..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-10 pr-4 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
          />
        </div>
      </div>

      {/* Listado de Licencias */}
      <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 font-semibold">Categoría / Producto</th>
                <th className="px-6 py-4 font-semibold">Clave de Licencia</th>
                <th className="px-6 py-4 font-semibold">Cliente / Equipo</th>
                <th className="px-6 py-4 font-semibold">Vigencia / Restante</th>
                <th className="px-6 py-4 font-semibold">Estado</th>
                <th className="px-6 py-4 font-semibold text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="6" className="py-8 text-center text-slate-400">
                    Cargando licencias de software...
                  </td>
                </tr>
              ) : filteredLicenses.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-8 text-center text-slate-400">
                    No se encontraron licencias registradas en esta categoría.
                  </td>
                </tr>
              ) : (
                filteredLicenses.map((lic) => (
                  <tr key={lic.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-6 py-4 font-medium text-slate-900">
                      <div className="flex items-center gap-2">
                        <span className={`inline-block rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                          lic.categoria === 'ANTIVIRUS' ? 'bg-indigo-100 text-indigo-700' :
                          lic.categoria === 'OFFICE' ? 'bg-amber-100 text-amber-700' :
                          lic.categoria === 'WINDOWS' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-700'
                        }`}>
                          {lic.categoria}
                        </span>
                      </div>
                      <div className="mt-1 font-semibold text-slate-800">{lic.nombre_producto}</div>
                      {lic.proveedor && (
                        <div className="text-xs text-slate-400">Prov: {lic.proveedor}</div>
                      )}
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <code className="rounded bg-slate-100 px-2 py-1 text-xs font-mono font-semibold text-slate-800">
                          {lic.clave_licencia}
                        </code>
                        <button
                          onClick={() => handleCopyKey(lic.clave_licencia, lic.id)}
                          title="Copiar clave"
                          className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
                        >
                          {copiedId === lic.id ? (
                            <Check className="h-3.5 w-3.5 text-emerald-600" />
                          ) : (
                            <Copy className="h-3.5 w-3.5" />
                          )}
                        </button>
                      </div>
                      <div className="mt-1 text-xs text-slate-400">
                        Slots: {lic.cantidad_dispositivos} {lic.cantidad_dispositivos === 1 ? 'equipo' : 'equipos'}
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      {lic.cliente_nombre ? (
                        <div className="flex items-center gap-1.5 text-xs text-slate-700 font-medium">
                          <User className="h-3.5 w-3.5 text-slate-400" />
                          {lic.cliente_nombre}
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400">No asignado a cliente</span>
                      )}
                      {lic.equipo_info && (
                        <div className="mt-0.5 flex items-center gap-1.5 text-xs text-slate-500">
                          <Laptop className="h-3.5 w-3.5 text-slate-400" />
                          {lic.equipo_info}
                        </div>
                      )}
                    </td>

                    <td className="px-6 py-4">
                      {lic.es_permanente ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                          <Sparkles className="h-3.5 w-3.5" />
                          Permanente
                        </span>
                      ) : (
                        <div>
                          <div className="text-xs text-slate-700 font-medium">
                            Fin: {lic.fecha_fin || "N/A"}
                          </div>
                          <div className="mt-1">
                            {lic.dias_restantes !== null && lic.dias_restantes !== undefined && (
                              <span className={`inline-flex items-center gap-1 text-xs font-semibold ${
                                lic.dias_restantes < 0
                                  ? 'text-rose-600'
                                  : lic.dias_restantes <= 30
                                  ? 'text-amber-600'
                                  : 'text-emerald-600'
                              }`}>
                                <Clock className="h-3.5 w-3.5" />
                                {lic.dias_restantes < 0
                                  ? `Vencida hace ${Math.abs(lic.dias_restantes)} días`
                                  : lic.dias_restantes === 0
                                  ? "Vence hoy"
                                  : `Quedan ${lic.dias_restantes} días`}
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                    </td>

                    <td className="px-6 py-4">
                      {lic.estado_vencimiento === "PERMANENTE" || lic.estado_vencimiento === "ACTIVA" ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          Activa
                        </span>
                      ) : lic.estado_vencimiento === "POR_VENCER" ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">
                          <Clock className="h-3.5 w-3.5" />
                          Por Vencer
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-700">
                          <XCircle className="h-3.5 w-3.5" />
                          Vencida
                        </span>
                      )}
                    </td>

                    <td className="px-6 py-4 text-right space-x-2">
                      <button
                        onClick={() => openEditModal(lic)}
                        className="rounded-lg px-2.5 py-1.5 text-xs font-semibold text-indigo-600 hover:bg-indigo-50 transition"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleDelete(lic.id)}
                        className="rounded-lg px-2.5 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 transition"
                      >
                        Eliminar
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Crear / Editar Licencia */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="w-full max-w-xl rounded-2xl bg-white p-6 shadow-2xl space-y-5 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <KeyRound className="h-5 w-5 text-indigo-600" />
                {editingLicense ? "Editar Licencia" : "Registrar Nueva Licencia"}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            {errorMsg && (
              <div className="rounded-xl bg-rose-50 p-3 text-xs font-medium text-rose-600 border border-rose-100">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Categoría */}
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Categoría *</label>
                <div className="grid grid-cols-4 gap-2">
                  {["ANTIVIRUS", "OFFICE", "WINDOWS", "OTROS"].map((cat) => (
                    <button
                      type="button"
                      key={cat}
                      onClick={() => handleCategoryChange(cat)}
                      className={`rounded-xl py-2 px-1 text-xs font-semibold border transition ${
                        formData.categoria === cat
                          ? "border-indigo-600 bg-indigo-50 text-indigo-700"
                          : "border-slate-200 text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      {cat.charAt(0) + cat.slice(1).toLowerCase()}
                    </button>
                  ))}
                </div>
              </div>

              {/* Nombre y Clave */}
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Nombre del Producto *</label>
                  <input
                    type="text"
                    name="nombre_producto"
                    required
                    value={formData.nombre_producto}
                    onChange={handleInputChange}
                    placeholder="Ej. Kaspersky Total Security 2026"
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Clave de Licencia / Serial *</label>
                  <input
                    type="text"
                    name="clave_licencia"
                    required
                    value={formData.clave_licencia}
                    onChange={handleInputChange}
                    placeholder="XXXXX-XXXXX-XXXXX-XXXXX"
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm font-mono outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Dispositivos y Proveedor */}
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Cantidad Dispositivos (Slots)</label>
                  <input
                    type="number"
                    name="cantidad_dispositivos"
                    min="1"
                    value={formData.cantidad_dispositivos}
                    onChange={handleInputChange}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Proveedor / Vendedor</label>
                  <input
                    type="text"
                    name="proveedor"
                    value={formData.proveedor}
                    onChange={handleInputChange}
                    placeholder="Ej. Licencias Perú SAC"
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Regla de Permanencia vs Fechas */}
              <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-700">Modo de Licenciamiento</span>
                  {formData.categoria === "ANTIVIRUS" ? (
                    <span className="text-[11px] font-semibold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                      Antivirus: Requiere Fecha Inicio y Fin
                    </span>
                  ) : (
                    <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
                      <input
                        type="checkbox"
                        name="es_permanente"
                        checked={formData.es_permanente}
                        onChange={handleInputChange}
                        className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                      />
                      Licencia Permanente (Sin expiración)
                    </label>
                  )}
                </div>

                {!formData.es_permanente && (
                  <div className="grid gap-3 sm:grid-cols-2 pt-1">
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">
                        Fecha de Inicio {formData.categoria === "ANTIVIRUS" && "*"}
                      </label>
                      <input
                        type="date"
                        name="fecha_inicio"
                        required={formData.categoria === "ANTIVIRUS"}
                        value={formData.fecha_inicio}
                        onChange={handleInputChange}
                        className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-500 bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">
                        Fecha de Finalización {formData.categoria === "ANTIVIRUS" && "*"}
                      </label>
                      <input
                        type="date"
                        name="fecha_fin"
                        required={formData.categoria === "ANTIVIRUS"}
                        value={formData.fecha_fin}
                        onChange={handleInputChange}
                        className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-500 bg-white"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Asignación a Cliente y Equipo */}
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Asignar a Cliente (Opcional)</label>
                  <select
                    name="cliente_id"
                    value={formData.cliente_id}
                    onChange={handleInputChange}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-500 bg-white"
                  >
                    <option value="">Sin asignar a cliente</option>
                    {clients.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.nombres} {c.apellidos}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Asignar a Equipo (Opcional)</label>
                  <select
                    name="equipo_id"
                    value={formData.equipo_id}
                    onChange={handleInputChange}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-500 bg-white"
                  >
                    <option value="">Sin asignar a equipo</option>
                    {equipment.map((eq) => (
                      <option key={eq.id} value={eq.id}>
                        #{eq.id} · {eq.tipo} {eq.marca} {eq.modelo}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Notas */}
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Notas / Observaciones</label>
                <textarea
                  name="notas"
                  rows="2"
                  value={formData.notas}
                  onChange={handleInputChange}
                  placeholder="Detalles adicionales, correo de activación, etc."
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-xl px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-xl bg-indigo-600 px-5 py-2 text-sm font-semibold text-white shadow-md hover:bg-indigo-700 disabled:opacity-50"
                >
                  {submitting ? "Guardando..." : editingLicense ? "Guardar Cambios" : "Crear Licencia"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

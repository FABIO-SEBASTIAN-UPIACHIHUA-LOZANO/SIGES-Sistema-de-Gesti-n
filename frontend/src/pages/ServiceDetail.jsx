import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Clock3,
  CreditCard,
  Package,
  User,
  Wrench,
  Loader2,
  AlertCircle,
  Save,
  Plus,
  Boxes,
  ShieldCheck,
  ReceiptText,
  Calculator,
  FileText,
  X,
  ExternalLink,
} from "lucide-react";
import api from "../services/api";
import { AuthContext } from "../context/AuthContext";
import { useContext } from "react";

const STATUS_OPTIONS = [
  { value: "RECIBIDO", label: "Recibido" },
  { value: "DIAGNOSTICO", label: "Diagnóstico" },
  { value: "EN_PROCESO", label: "En proceso" },
  { value: "ESPERA", label: "En espera" },
  { value: "TERMINADO", label: "Terminado" },
  { value: "ENTREGADO", label: "Entregado" },
  { value: "CANCELADO", label: "Cancelado" },
];

const STATUS_STYLES = {
  RECIBIDO: "bg-blue-50 text-blue-700 border-blue-100",
  DIAGNOSTICO: "bg-indigo-50 text-indigo-700 border-indigo-100",
  EN_PROCESO: "bg-amber-50 text-amber-700 border-amber-100",
  ESPERA: "bg-slate-100 text-slate-700 border-slate-200",
  TERMINADO: "bg-green-50 text-green-700 border-green-100",
  ENTREGADO: "bg-emerald-50 text-emerald-700 border-emerald-100",
  CANCELADO: "bg-red-50 text-red-700 border-red-100",
};

const INVOICE_TYPE_OPTIONS = [
  {
    value: "BOLETA",
    label: "Boleta",
    description: "Comprobante para consumidor final.",
    prefix: "B001",
  },
  {
    value: "FACTURA",
    label: "Factura",
    description: "Comprobante para operaciones con empresa.",
    prefix: "F001",
  },
  {
    value: "NOTA_VENTA",
    label: "Nota de venta",
    description: "Comprobante comercial interno.",
    prefix: "NV01",
  },
];

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

  return (
    error?.response?.data?.message ||
    error?.message ||
    "Ocurrió un error inesperado."
  );
}

function formatCurrency(value) {
  return new Intl.NumberFormat("es-PE", {
    style: "currency",
    currency: "PEN",
    minimumFractionDigits: 2,
  }).format(Number(value || 0));
}

function normalizeServiceType(value) {
  return String(value || "")
    .trim()
    .toLowerCase();
}

function isLicenseService(service) {
  const type = normalizeServiceType(service?.tipo_servicio);

  return (
    type.includes("antivirus") ||
    type.includes("licencia") ||
    type.includes("software")
  );
}

function isClosedService(service) {
  return (
    service?.estado === "ENTREGADO" ||
    service?.estado === "CANCELADO"
  );
}

function getRole(user) {
  return (
    user?.rol ||
    user?.role ||
    user?.rol_nombre ||
    user?.role_name ||
    ""
  )
    .toString()
    .toUpperCase();
}

export function ServiceDetail() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user } = useContext(AuthContext);

  const currentRole = getRole(user);

  const [service, setService] = useState(null);
  const [products, setProducts] = useState([]);

  const [selectedStatus, setSelectedStatus] = useState("");
  const [diagnostico, setDiagnostico] = useState("");

  const [selectedProduct, setSelectedProduct] = useState("");
  const [productQuantity, setProductQuantity] = useState(1);

  const [loading, setLoading] = useState(true);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [addingProduct, setAddingProduct] = useState(false);
  const [savingStatus, setSavingStatus] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [productModalOpen, setProductModalOpen] = useState(false);

  /* =========================================================
     COMPROBANTES
  ========================================================= */

  const [invoice, setInvoice] = useState(null);
  const [loadingInvoice, setLoadingInvoice] = useState(false);
  const [invoiceModalOpen, setInvoiceModalOpen] = useState(false);
  const [creatingInvoice, setCreatingInvoice] = useState(false);

  const [invoiceType, setInvoiceType] = useState("BOLETA");
  const [invoiceSerie, setInvoiceSerie] = useState("B001");
  const [invoiceObservations, setInvoiceObservations] = useState("");

  const canManageInvoice = currentRole === "ADMIN";

  const loadService = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get(`/services/${id}`);

      setService(response.data);
      setSelectedStatus(response.data.estado);
      setDiagnostico(response.data.diagnostico || "");
    } catch (err) {
      console.error("Error cargando servicio:", err);
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const loadProducts = async () => {
    try {
      setLoadingProducts(true);

      const response = await api.get("/products/");

      setProducts(
        Array.isArray(response.data)
          ? response.data
          : []
      );
    } catch (err) {
      console.error("Error cargando productos:", err);
      setError(getErrorMessage(err));
    } finally {
      setLoadingProducts(false);
    }
  };

  /*
   * El backend actual no incluye el comprobante dentro de
   * ServiceResponse.
   *
   * Solo ADMIN puede consultar /invoices/ actualmente.
   * Por eso evitamos hacer esta petición para TECNICO.
   */
  const loadInvoice = async () => {
    if (!id || !canManageInvoice) {
      return;
    }

    try {
      setLoadingInvoice(true);

      const response = await api.get("/invoices/");

      const invoices = Array.isArray(response.data)
        ? response.data
        : [];

      const existingInvoice = invoices.find(
        (item) =>
          String(item.servicio_id) === String(id)
      );

      setInvoice(existingInvoice || null);
    } catch (err) {
      console.error("Error cargando comprobante:", err);
    } finally {
      setLoadingInvoice(false);
    }
  };

  useEffect(() => {
    if (!id) {
      return;
    }

    loadService();
    loadProducts();
  }, [id]);

  useEffect(() => {
    if (!id || !canManageInvoice) {
      return;
    }

    loadInvoice();
  }, [id, canManageInvoice]);

  const handleUpdateStatus = async () => {
    if (!service || !selectedStatus) {
      return;
    }

    try {
      setSavingStatus(true);
      setError("");
      setSuccess("");

      const payload = {
        estado: selectedStatus,
      };

      if (diagnostico.trim()) {
        payload.diagnostico = diagnostico.trim();
      }

      const response = await api.patch(
        `/services/${service.id}/status`,
        payload
      );

      setService(response.data);
      setSelectedStatus(response.data.estado);
      setDiagnostico(response.data.diagnostico || "");

      setSuccess(
        "Estado del servicio actualizado correctamente."
      );

      setTimeout(() => {
        setSuccess("");
      }, 3000);
    } catch (err) {
      console.error("Error actualizando estado:", err);
      setError(getErrorMessage(err));
    } finally {
      setSavingStatus(false);
    }
  };

  const openProductModal = () => {
    if (isClosedService(service)) {
      return;
    }

    setSelectedProduct("");
    setProductQuantity(1);
    setProductModalOpen(true);
    setError("");
  };

  const closeProductModal = () => {
    if (addingProduct) {
      return;
    }

    setProductModalOpen(false);
    setSelectedProduct("");
    setProductQuantity(1);
  };

  const selectedProductData = useMemo(() => {
    if (!selectedProduct) {
      return null;
    }

    return (
      products.find(
        (product) =>
          String(product.id) === String(selectedProduct)
      ) || null
    );
  }, [products, selectedProduct]);

  const productSubtotal = useMemo(() => {
    if (!selectedProductData) {
      return 0;
    }

    return (
      Number(selectedProductData.precio_venta || 0) *
      Number(productQuantity || 0)
    );
  }, [selectedProductData, productQuantity]);

  const handleAddProduct = async (event) => {
    event.preventDefault();

    if (!selectedProductData) {
      setError("Selecciona un producto.");
      return;
    }

    const quantity = Number(productQuantity);

    if (!Number.isInteger(quantity) || quantity <= 0) {
      setError(
        "La cantidad debe ser un número entero mayor que cero."
      );
      return;
    }

    if (quantity > Number(selectedProductData.stock || 0)) {
      setError(
        `Stock insuficiente. Disponible: ${selectedProductData.stock}.`
      );
      return;
    }

    try {
      setAddingProduct(true);
      setError("");
      setSuccess("");

      await api.post(
        `/services/${service.id}/products`,
        {
          producto_id: Number(selectedProductData.id),
          cantidad: quantity,
        }
      );

      await loadService();
      await loadProducts();

      setProductModalOpen(false);
      setSelectedProduct("");
      setProductQuantity(1);

      setSuccess(
        `${selectedProductData.nombre} fue agregado al servicio correctamente.`
      );

      setTimeout(() => {
        setSuccess("");
      }, 3500);
    } catch (err) {
      console.error("Error agregando producto:", err);
      setError(getErrorMessage(err));
    } finally {
      setAddingProduct(false);
    }
  };

  /* =========================================================
     CÁLCULOS
  ========================================================= */

  const totalProducts = useMemo(() => {
    if (!service?.items) {
      return 0;
    }

    return service.items.reduce(
      (total, item) =>
        total + Number(item.subtotal || 0),
      0
    );
  }, [service]);

  const baseAmount = Number(service?.monto || 0);

  const totalService = baseAmount + totalProducts;

  const productMap = useMemo(() => {
    return products.reduce((map, product) => {
      map[product.id] = product;
      return map;
    }, {});
  }, [products]);

  const getProductName = (item) => {
    return (
      productMap[item.producto_id]?.nombre ||
      `Producto #${item.producto_id}`
    );
  };

  /* =========================================================
     FECHAS
  ========================================================= */

  const formatDate = (value) => {
    if (!value) {
      return "No registrada";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return "No registrada";
    }

    return date.toLocaleDateString("es-PE", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const formatDateTime = (value) => {
    if (!value) {
      return "No registrada";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return "No registrada";
    }

    return date.toLocaleString("es-PE", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getClientName = () => {
    if (!service?.cliente) {
      return `Cliente #${service?.cliente_id ?? "-"}`;
    }

    return `${service.cliente.nombres || ""} ${
      service.cliente.apellidos || ""
    }`.trim();
  };

  const getEquipmentName = () => {
    if (!service?.equipo) {
      return service?.equipo_id
        ? `Equipo #${service.equipo_id}`
        : "Sin equipo asociado";
    }

    return (
      service.equipo.nombre ||
      service.equipo.modelo ||
      service.equipo.descripcion ||
      `Equipo #${service.equipo_id}`
    );
  };

  /* =========================================================
     COMPROBANTE
  ========================================================= */

  const selectedInvoiceType = useMemo(() => {
    return (
      INVOICE_TYPE_OPTIONS.find(
        (option) => option.value === invoiceType
      ) || INVOICE_TYPE_OPTIONS[0]
    );
  }, [invoiceType]);

  const openInvoiceModal = () => {
    if (!service) {
      return;
    }

    if (service.estado === "CANCELADO") {
      setError(
        "No se puede emitir un comprobante para un servicio cancelado."
      );
      return;
    }

    if (invoice) {
      setError(
        "Este servicio ya tiene un comprobante emitido."
      );
      return;
    }

    setInvoiceType("BOLETA");
    setInvoiceSerie("B001");
    setInvoiceObservations("");
    setError("");
    setInvoiceModalOpen(true);
  };

  const closeInvoiceModal = () => {
    if (creatingInvoice) {
      return;
    }

    setInvoiceModalOpen(false);
    setInvoiceObservations("");
  };

  const handleInvoiceTypeChange = (value) => {
    setInvoiceType(value);

    const selected = INVOICE_TYPE_OPTIONS.find(
      (option) => option.value === value
    );

    if (selected) {
      setInvoiceSerie(selected.prefix);
    }
  };

  const handleCreateInvoice = async (event) => {
    event.preventDefault();

    if (!service) {
      return;
    }

    if (service.estado === "CANCELADO") {
      setError(
        "No se puede emitir un comprobante para un servicio cancelado."
      );
      return;
    }

    if (invoice) {
      setError(
        "Este servicio ya tiene un comprobante emitido."
      );
      setInvoiceModalOpen(false);
      return;
    }

    const serie = invoiceSerie.trim().toUpperCase();

    if (!serie) {
      setError("La serie del comprobante es obligatoria.");
      return;
    }

    if (serie.length > 10) {
      setError(
        "La serie no puede tener más de 10 caracteres."
      );
      return;
    }

    try {
      setCreatingInvoice(true);
      setError("");
      setSuccess("");

      const payload = {
        servicio_id: Number(service.id),
        tipo_comprobante: invoiceType,
        serie,
      };

      if (invoiceObservations.trim()) {
        payload.observaciones =
          invoiceObservations.trim();
      }

      const response = await api.post(
        "/invoices/",
        payload
      );

      setInvoice(response.data);
      setInvoiceModalOpen(false);

      setSuccess(
        `Comprobante ${response.data.tipo_comprobante} ${response.data.serie}-${response.data.numero} emitido correctamente.`
      );

      setTimeout(() => {
        setSuccess("");
      }, 5000);
    } catch (err) {
      console.error(
        "Error emitiendo comprobante:",
        err
      );

      /*
       * Si otro usuario ya emitió el comprobante,
       * actualizamos la información para no dejar
       * la interfaz desactualizada.
       */
      await loadInvoice();

      setError(getErrorMessage(err));
    } finally {
      setCreatingInvoice(false);
    }
  };

  const openInvoiceDetail = () => {
    if (!invoice?.id) {
      return;
    }

    navigate(`/comprobantes`);
  };

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="flex items-center gap-3 text-sm text-slate-500">
          <Loader2 className="h-5 w-5 animate-spin" />
          Cargando servicio...
        </div>
      </div>
    );
  }

  if (!service) {
    return (
      <div className="space-y-6">
        <button
          onClick={() => navigate("/servicios")}
          className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 shadow-sm transition hover:bg-slate-50"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver a servicios
        </button>

        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-700">
          <div className="flex items-center gap-3">
            <AlertCircle className="h-5 w-5" />
            {error || "No se encontró el servicio."}
          </div>
        </div>
      </div>
    );
  }

  const licenseService = isLicenseService(service);

  const statusLabel =
    STATUS_OPTIONS.find(
      (option) => option.value === service.estado
    )?.label || service.estado;

  return (
    <div className="space-y-6">

      {/* =====================================================
          HEADER
      ====================================================== */}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/servicios")}
            className="rounded-xl border border-slate-200 bg-white p-2.5 text-slate-500 shadow-sm transition hover:bg-slate-50"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>

          <div>
            <p className="text-sm font-medium text-indigo-600">
              Servicio
            </p>

            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              #{service.id}
            </h1>
          </div>
        </div>

        <span
          className={`inline-flex w-fit items-center rounded-full border px-3 py-1.5 text-xs font-semibold ${
            STATUS_STYLES[service.estado] ||
            "border-slate-200 bg-slate-50 text-slate-600"
          }`}
        >
          {statusLabel}
        </span>
      </div>

      {/* =====================================================
          ALERTAS
      ====================================================== */}

      {error && (
        <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span className="flex-1">{error}</span>

          <button
            type="button"
            onClick={() => setError("")}
            className="rounded-lg p-1 transition hover:bg-red-100"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {success && (
        <div className="flex items-center gap-2 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          {success}
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-3">

        {/* ===================================================
            MAIN
        ==================================================== */}

        <div className="space-y-6 xl:col-span-2">

          {/* INFORMACIÓN */}

          <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="font-semibold text-slate-900">
                    Información del servicio
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    Datos generales y descripción del trabajo.
                  </p>
                </div>

                {licenseService && (
                  <div className="hidden items-center gap-2 rounded-xl border border-indigo-100 bg-indigo-50 px-3 py-2 text-xs font-semibold text-indigo-700 sm:flex">
                    <ShieldCheck className="h-4 w-4" />
                    Licencia / software
                  </div>
                )}
              </div>
            </div>

            <div className="grid gap-6 p-6 sm:grid-cols-2">
              <InfoItem
                icon={User}
                label="Cliente"
                value={getClientName()}
              />

              <InfoItem
                icon={Wrench}
                label="Tipo de servicio"
                value={service.tipo_servicio}
              />

              {!licenseService && (
                <InfoItem
                  icon={Package}
                  label="Equipo"
                  value={getEquipmentName()}
                />
              )}

              <InfoItem
                icon={CreditCard}
                label="Mano de obra / servicio"
                value={formatCurrency(baseAmount)}
              />

              <InfoItem
                icon={CalendarDays}
                label="Fecha de ingreso"
                value={formatDateTime(service.fecha_ingreso)}
              />

              <InfoItem
                icon={Clock3}
                label={
                  licenseService
                    ? "Fecha de activación / referencia"
                    : "Fecha estimada de entrega"
                }
                value={formatDate(service.fecha_estimada)}
              />
            </div>
          </section>

          {/* BLOQUE LICENCIA */}

          {licenseService && (
            <section className="rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50 to-white p-6 shadow-sm">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-sm">
                  <ShieldCheck className="h-6 w-6" />
                </div>

                <div>
                  <h2 className="font-semibold text-slate-900">
                    Servicio de licencia o software
                  </h2>

                  <p className="mt-1 text-sm leading-6 text-slate-600">
                    Este servicio puede utilizarse para registrar
                    antivirus, licencias y otros productos de software.
                    Próximamente aquí podremos mostrar activación,
                    vencimiento y recordatorios.
                  </p>
                </div>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                <LicenseInfo
                  label="Tipo"
                  value={service.tipo_servicio}
                />

                <LicenseInfo
                  label="Fecha registrada"
                  value={formatDate(service.fecha_estimada)}
                />

                <LicenseInfo
                  label="Estado"
                  value={statusLabel}
                />
              </div>
            </section>
          )}

          {/* DESCRIPCIÓN */}

          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="font-semibold text-slate-900">
              Descripción
            </h2>

            <p className="mt-3 text-sm leading-7 text-slate-600">
              {service.descripcion ||
                "Sin descripción registrada."}
            </p>
          </section>

          {/* DIAGNÓSTICO */}

          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="font-semibold text-slate-900">
              Diagnóstico
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Información técnica del servicio.
            </p>

            <textarea
              value={diagnostico}
              onChange={(event) =>
                setDiagnostico(event.target.value)
              }
              rows={4}
              placeholder="Registrar diagnóstico técnico..."
              className="mt-4 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10"
            />
          </section>

          {/* PRODUCTOS */}

          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex flex-col gap-4 border-b border-slate-100 p-6 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="font-semibold text-slate-900">
                    Repuestos y productos
                  </h2>

                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-500">
                    {service.items?.length || 0}
                  </span>
                </div>

                <p className="mt-1 text-sm text-slate-500">
                  Productos utilizados y cargados al servicio.
                </p>
              </div>

              {!isClosedService(service) && (
                <button
                  type="button"
                  onClick={openProductModal}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700"
                >
                  <Plus className="h-4 w-4" />
                  Agregar producto
                </button>
              )}
            </div>

            {service.items?.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50">
                    <tr className="border-b border-slate-200">
                      <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Producto
                      </th>

                      <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Cantidad
                      </th>

                      <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Precio unitario
                      </th>

                      <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Subtotal
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100">
                    {service.items.map((item) => (
                      <tr
                        key={item.id}
                        className="transition hover:bg-slate-50/70"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                              <Boxes className="h-4 w-4" />
                            </div>

                            <div>
                              <p className="text-sm font-semibold text-slate-800">
                                {getProductName(item)}
                              </p>

                              <p className="text-xs text-slate-400">
                                Producto #{item.producto_id}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="px-6 py-4 text-sm text-slate-600">
                          {item.cantidad}
                        </td>

                        <td className="px-6 py-4 text-sm text-slate-600">
                          {formatCurrency(
                            item.precio_unitario
                          )}
                        </td>

                        <td className="px-6 py-4 text-right text-sm font-semibold text-slate-800">
                          {formatCurrency(item.subtotal)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-10 text-center">
                <Package className="mx-auto h-9 w-9 text-slate-300" />

                <p className="mt-3 text-sm font-semibold text-slate-600">
                  No hay productos utilizados
                </p>

                <p className="mt-1 text-xs text-slate-400">
                  Agrega repuestos o productos utilizados en este servicio.
                </p>

                {!isClosedService(service) && (
                  <button
                    type="button"
                    onClick={openProductModal}
                    className="mt-4 inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                  >
                    <Plus className="h-4 w-4" />
                    Agregar primer producto
                  </button>
                )}
              </div>
            )}

            <div className="border-t border-slate-100 bg-slate-50 px-6 py-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-slate-600">
                  Total de productos
                </span>

                <span className="text-sm font-bold text-slate-900">
                  {formatCurrency(totalProducts)}
                </span>
              </div>
            </div>
          </section>

          {/* RESUMEN ECONÓMICO */}

          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 p-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                  <Calculator className="h-5 w-5" />
                </div>

                <div>
                  <h2 className="font-semibold text-slate-900">
                    Resumen económico
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    El total se calcula con mano de obra más productos.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-4 p-6">
              <SummaryRow
                label="Mano de obra / servicio"
                value={formatCurrency(baseAmount)}
              />

              <SummaryRow
                label="Repuestos y productos"
                value={formatCurrency(totalProducts)}
              />

              <div className="border-t border-slate-200 pt-5">
                <div className="flex items-end justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                      Total del servicio
                    </p>

                    <p className="mt-1 text-sm text-slate-500">
                      Mano de obra + productos
                    </p>
                  </div>

                  <p className="text-2xl font-bold text-indigo-600">
                    {formatCurrency(totalService)}
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* =================================================
              COMPROBANTE
          ================================================== */}

          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 p-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex items-start gap-4">
                  <div
                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
                      invoice
                        ? "bg-emerald-50 text-emerald-600"
                        : "bg-indigo-50 text-indigo-600"
                    }`}
                  >
                    {invoice ? (
                      <CheckCircle2 className="h-5 w-5" />
                    ) : (
                      <ReceiptText className="h-5 w-5" />
                    )}
                  </div>

                  <div>
                    <h2 className="font-semibold text-slate-900">
                      Comprobante de venta
                    </h2>

                    <p className="mt-1 text-sm text-slate-500">
                      Comprobante asociado directamente a este servicio.
                    </p>
                  </div>
                </div>

                {canManageInvoice && loadingInvoice && (
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Verificando...
                  </div>
                )}
              </div>
            </div>

            <div className="p-6">

              {canManageInvoice && invoice ? (
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-5">
                  <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-start gap-4">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white text-emerald-600 shadow-sm">
                        <FileText className="h-6 w-6" />
                      </div>

                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-emerald-600">
                          Comprobante emitido
                        </p>

                        <p className="mt-1 text-lg font-bold text-slate-900">
                          {invoice.tipo_comprobante}{" "}
                          {invoice.serie}-{invoice.numero}
                        </p>

                        <p className="mt-1 text-sm text-slate-600">
                          Total:{" "}
                          <strong>
                            {formatCurrency(invoice.total)}
                          </strong>
                        </p>

                        <p className="mt-1 text-xs text-slate-500">
                          Emitido el{" "}
                          {formatDateTime(
                            invoice.fecha_emision
                          )}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={openInvoiceDetail}
                      className="inline-flex items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-white px-4 py-2.5 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-100"
                    >
                      <ExternalLink className="h-4 w-4" />
                      Ver comprobante
                    </button>
                  </div>
                </div>
              ) : canManageInvoice ? (
                <>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                    <div className="flex items-start gap-4">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-slate-500 shadow-sm">
                        <ReceiptText className="h-5 w-5" />
                      </div>

                      <div>
                        <p className="text-sm font-semibold text-slate-800">
                          Este servicio todavía no tiene comprobante
                        </p>

                        <p className="mt-1 text-sm leading-6 text-slate-500">
                          Puedes emitir una boleta, factura o nota de venta
                          utilizando el total calculado del servicio.
                        </p>
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={openInvoiceModal}
                    disabled={
                      service.estado === "CANCELADO" ||
                      loadingInvoice
                    }
                    className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <ReceiptText className="h-4 w-4" />

                    {service.estado === "CANCELADO"
                      ? "Servicio cancelado"
                      : "Emitir comprobante"}
                  </button>

                  {service.estado === "CANCELADO" && (
                    <p className="mt-2 text-center text-xs text-red-500">
                      Los servicios cancelados no pueden tener comprobantes.
                    </p>
                  )}
                </>
              ) : (
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                  <div className="flex items-start gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-slate-500 shadow-sm">
                      <ReceiptText className="h-5 w-5" />
                    </div>

                    <div>
                      <p className="text-sm font-semibold text-slate-800">
                        Gestión de comprobantes
                      </p>

                      <p className="mt-1 text-sm leading-6 text-slate-500">
                        La emisión y consulta de comprobantes está disponible
                        para usuarios autorizados.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </section>
        </div>

        {/* ===================================================
            SIDEBAR
        ==================================================== */}

        <div className="space-y-6">

          {/* CLIENTE */}

          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="font-semibold text-slate-900">
              Cliente
            </h2>

            <div className="mt-5 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-100 font-bold text-indigo-700">
                {getInitials(getClientName())}
              </div>

              <div>
                <p className="text-sm font-semibold text-slate-800">
                  {getClientName()}
                </p>

                <p className="mt-0.5 text-xs text-slate-500">
                  {service.cliente?.telefono ||
                    "Teléfono no registrado"}
                </p>

                {service.cliente?.documento && (
                  <p className="mt-0.5 text-xs text-slate-400">
                    Doc. {service.cliente.documento}
                  </p>
                )}
              </div>
            </div>

            <button
              onClick={() => navigate("/clientes")}
              className="mt-5 w-full rounded-xl border border-slate-200 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
            >
              Ver clientes
            </button>
          </section>

          {/* ESTADO */}

          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="font-semibold text-slate-900">
              Estado del servicio
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Actualiza el avance del trabajo técnico.
            </p>

            <select
              value={selectedStatus}
              onChange={(event) =>
                setSelectedStatus(event.target.value)
              }
              className="mt-4 h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-medium text-slate-700 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
            >
              {STATUS_OPTIONS.map((option) => (
                <option
                  key={option.value}
                  value={option.value}
                >
                  {option.label}
                </option>
              ))}
            </select>

            <button
              onClick={handleUpdateStatus}
              disabled={
                savingStatus ||
                selectedStatus === service.estado
              }
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-600/20 transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {savingStatus ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Actualizar estado
                </>
              )}
            </button>
          </section>

          {/* INFORMACIÓN TÉCNICA */}

          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="font-semibold text-slate-900">
              Información técnica
            </h2>

            <div className="mt-5 space-y-4">
              <InfoItem
                icon={Wrench}
                label="Responsable"
                value={
                  service.usuario_responsable_id
                    ? `Usuario #${service.usuario_responsable_id}`
                    : "Sin responsable"
                }
              />

              <InfoItem
                icon={CalendarDays}
                label="Finalización"
                value={formatDateTime(
                  service.fecha_finalizacion
                )}
              />
            </div>
          </section>
        </div>
      </div>

      {/* =====================================================
          MODAL AGREGAR PRODUCTO
      ====================================================== */}

      {productModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (
              event.target === event.currentTarget &&
              !addingProduct
            ) {
              closeProductModal();
            }
          }}
        >
          <div className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl">

            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  Agregar producto
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Agrega un repuesto o producto utilizado.
                </p>
              </div>

              <button
                type="button"
                onClick={closeProductModal}
                disabled={addingProduct}
                className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleAddProduct}>
              <div className="space-y-5 p-6">

                {loadingProducts ? (
                  <div className="flex items-center justify-center rounded-xl border border-slate-200 bg-slate-50 p-8">
                    <div className="flex items-center gap-2 text-sm text-slate-500">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Cargando inventario...
                    </div>
                  </div>
                ) : products.length === 0 ? (
                  <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                    <p className="text-sm font-semibold text-amber-800">
                      No hay productos disponibles.
                    </p>

                    <p className="mt-1 text-xs text-amber-700">
                      Registra productos en el módulo de Productos
                      antes de agregarlos al servicio.
                    </p>
                  </div>
                ) : (
                  <>
                    <div>
                      <label className="mb-2 block text-sm font-semibold text-slate-700">
                        Producto
                        <span className="text-red-500"> *</span>
                      </label>

                      <select
                        value={selectedProduct}
                        onChange={(event) =>
                          setSelectedProduct(
                            event.target.value
                          )
                        }
                        disabled={addingProduct}
                        className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 disabled:bg-slate-50"
                      >
                        <option value="">
                          Seleccionar producto...
                        </option>

                        {products
                          .filter(
                            (product) =>
                              Number(product.stock || 0) > 0 &&
                              product.activo !== false
                          )
                          .map((product) => (
                            <option
                              key={product.id}
                              value={product.id}
                            >
                              {product.nombre} — Stock:{" "}
                              {product.stock} —{" "}
                              {formatCurrency(
                                product.precio_venta
                              )}
                            </option>
                          ))}
                      </select>
                    </div>

                    {selectedProductData && (
                      <div className="rounded-xl border border-indigo-100 bg-indigo-50 p-4">
                        <div className="flex items-start gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white text-indigo-600">
                            <Package className="h-5 w-5" />
                          </div>

                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-indigo-900">
                              {selectedProductData.nombre}
                            </p>

                            <p className="mt-1 text-xs text-indigo-700">
                              Código:{" "}
                              {selectedProductData.codigo}
                            </p>

                            <p className="mt-1 text-xs text-indigo-700">
                              Stock disponible:{" "}
                              <strong>
                                {selectedProductData.stock}
                              </strong>
                            </p>

                            <p className="mt-1 text-xs text-indigo-700">
                              Precio de venta:{" "}
                              <strong>
                                {formatCurrency(
                                  selectedProductData.precio_venta
                                )}
                              </strong>
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    <div>
                      <label className="mb-2 block text-sm font-semibold text-slate-700">
                        Cantidad
                        <span className="text-red-500"> *</span>
                      </label>

                      <input
                        type="number"
                        min="1"
                        max={
                          selectedProductData?.stock ||
                          undefined
                        }
                        step="1"
                        value={productQuantity}
                        onChange={(event) =>
                          setProductQuantity(
                            event.target.value
                          )
                        }
                        disabled={addingProduct}
                        className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 disabled:bg-slate-50"
                      />
                    </div>

                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-slate-600">
                          Subtotal
                        </span>

                        <span className="text-xl font-bold text-slate-900">
                          {formatCurrency(productSubtotal)}
                        </span>
                      </div>
                    </div>
                  </>
                )}
              </div>

              <div className="flex flex-col-reverse gap-3 border-t border-slate-200 bg-slate-50 px-6 py-4 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={closeProductModal}
                  disabled={addingProduct}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:opacity-50"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  disabled={
                    addingProduct ||
                    !selectedProductData ||
                    products.length === 0
                  }
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {addingProduct ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Agregando...
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4" />
                      Agregar producto
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =====================================================
          MODAL EMITIR COMPROBANTE
      ====================================================== */}

      {invoiceModalOpen && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (
              event.target === event.currentTarget &&
              !creatingInvoice
            ) {
              closeInvoiceModal();
            }
          }}
        >
          <div className="w-full max-w-xl overflow-hidden rounded-2xl bg-white shadow-2xl">

            {/* HEADER */}

            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                  <ReceiptText className="h-5 w-5" />
                </div>

                <div>
                  <h2 className="text-lg font-bold text-slate-900">
                    Emitir comprobante
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    Servicio #{service.id}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={closeInvoiceModal}
                disabled={creatingInvoice}
                className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateInvoice}>

              <div className="space-y-6 p-6">

                {/* RESUMEN */}

                <div className="rounded-xl border border-indigo-100 bg-indigo-50 p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-indigo-500">
                        Total del servicio
                      </p>

                      <p className="mt-1 text-sm text-indigo-700">
                        Mano de obra + productos
                      </p>
                    </div>

                    <p className="text-xl font-bold text-indigo-700">
                      {formatCurrency(totalService)}
                    </p>
                  </div>
                </div>

                {/* TIPO */}

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Tipo de comprobante
                    <span className="text-red-500"> *</span>
                  </label>

                  <div className="grid gap-3 sm:grid-cols-3">
                    {INVOICE_TYPE_OPTIONS.map((option) => {
                      const selected =
                        invoiceType === option.value;

                      return (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() =>
                            handleInvoiceTypeChange(
                              option.value
                            )
                          }
                          disabled={creatingInvoice}
                          className={`rounded-xl border p-4 text-left transition ${
                            selected
                              ? "border-indigo-500 bg-indigo-50 ring-2 ring-indigo-500/10"
                              : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <div
                              className={`flex h-8 w-8 items-center justify-center rounded-lg ${
                                selected
                                  ? "bg-indigo-600 text-white"
                                  : "bg-slate-100 text-slate-500"
                              }`}
                            >
                              <FileText className="h-4 w-4" />
                            </div>

                            <span
                              className={`text-sm font-bold ${
                                selected
                                  ? "text-indigo-700"
                                  : "text-slate-700"
                              }`}
                            >
                              {option.label}
                            </span>
                          </div>

                          <p className="mt-2 text-[11px] leading-4 text-slate-500">
                            {option.description}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* SERIE */}

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Serie
                    <span className="text-red-500"> *</span>
                  </label>

                  <input
                    type="text"
                    value={invoiceSerie}
                    onChange={(event) =>
                      setInvoiceSerie(
                        event.target.value.toUpperCase()
                      )
                    }
                    maxLength={10}
                    disabled={creatingInvoice}
                    placeholder={
                      selectedInvoiceType.prefix
                    }
                    className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold uppercase text-slate-700 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 disabled:bg-slate-50"
                  />

                  <p className="mt-1.5 text-xs text-slate-400">
                    El número será asignado automáticamente por el backend.
                  </p>
                </div>

                {/* OBSERVACIONES */}

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Observaciones
                    <span className="ml-1 text-xs font-normal text-slate-400">
                      (opcional)
                    </span>
                  </label>

                  <textarea
                    value={invoiceObservations}
                    onChange={(event) =>
                      setInvoiceObservations(
                        event.target.value
                      )
                    }
                    rows={3}
                    disabled={creatingInvoice}
                    placeholder="Observaciones adicionales del comprobante..."
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 disabled:bg-slate-50"
                  />
                </div>

                {/* INFORMACIÓN */}

                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />

                    <p className="text-xs leading-5 text-slate-500">
                      El comprobante utilizará los datos actuales del
                      cliente y los productos registrados en este servicio.
                      La numeración será generada por el backend según el
                      tipo y serie seleccionados.
                    </p>
                  </div>
                </div>
              </div>

              {/* FOOTER */}

              <div className="flex flex-col-reverse gap-3 border-t border-slate-200 bg-slate-50 px-6 py-4 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={closeInvoiceModal}
                  disabled={creatingInvoice}
                  className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:opacity-50"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  disabled={
                    creatingInvoice ||
                    !invoiceSerie.trim()
                  }
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {creatingInvoice ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Emitiendo...
                    </>
                  ) : (
                    <>
                      <ReceiptText className="h-4 w-4" />
                      Emitir comprobante
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

function InfoItem({ icon: Icon, label, value }) {
  return (
    <div className="flex gap-3">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-50 text-slate-500">
        <Icon className="h-4 w-4" />
      </div>

      <div className="min-w-0">
        <p className="text-xs font-medium text-slate-400">
          {label}
        </p>

        <p className="mt-1 break-words text-sm font-semibold text-slate-800">
          {value}
        </p>
      </div>
    </div>
  );
}

function LicenseInfo({ label, value }) {
  return (
    <div className="rounded-xl border border-indigo-100 bg-white/80 p-4">
      <p className="text-xs font-medium text-slate-400">
        {label}
      </p>

      <p className="mt-1 text-sm font-semibold text-slate-800">
        {value}
      </p>
    </div>
  );
}

function SummaryRow({ label, value }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-sm text-slate-600">
        {label}
      </span>

      <span className="text-sm font-semibold text-slate-800">
        {value}
      </span>
    </div>
  );
}

function getInitials(name) {
  if (!name) {
    return "CL";
  }

  const parts = name
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (parts.length === 1) {
    return parts[0]
      .substring(0, 2)
      .toUpperCase();
  }

  return `${parts[0][0]}${
    parts[parts.length - 1][0]
  }`.toUpperCase();
}
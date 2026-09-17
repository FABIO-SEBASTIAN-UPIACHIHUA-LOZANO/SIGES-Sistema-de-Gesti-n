import React, { useEffect, useMemo, useState } from "react";
import {
  FileText,
  Search,
  RefreshCw,
  Eye,
  Ban,
  X,
  Receipt,
  User,
  CalendarDays,
  CircleDollarSign,
  AlertCircle,
  Download,
  Loader2,
} from "lucide-react";
import api from "../services/api";
import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";

const invoiceTypeLabels = {
  BOLETA: "Boleta",
  FACTURA: "Factura",
  NOTA_VENTA: "Nota de venta",
};

const statusStyles = {
  EMITIDO: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  ANULADO: "bg-red-50 text-red-700 ring-red-600/20",
};

function formatMoney(value) {
  const number = Number(value || 0);

  return new Intl.NumberFormat("es-PE", {
    style: "currency",
    currency: "PEN",
    minimumFractionDigits: 2,
  }).format(number);
}

function formatDate(value) {
  if (!value) return "—";

  return new Intl.DateTimeFormat("es-PE", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function StatusBadge({ status }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${
        statusStyles[status] ||
        "bg-slate-50 text-slate-600 ring-slate-600/20"
      }`}
    >
      {status === "EMITIDO" ? "Emitido" : "Anulado"}
    </span>
  );
}

function DetailModal({
  invoice,
  onClose,
  canCancel,
  onCancel,
  onDownloadPdf,
  downloadingPdf,
}) {
  if (!invoice) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-3xl overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <div>
            <div className="flex items-center gap-2">
              <Receipt className="h-5 w-5 text-indigo-600" />

              <h2 className="text-lg font-bold text-slate-900">
                {invoiceTypeLabels[invoice.tipo_comprobante] ||
                  invoice.tipo_comprobante}{" "}
                {invoice.serie}-{invoice.numero}
              </h2>
            </div>

            <p className="mt-1 text-sm text-slate-500">
              Comprobante #{invoice.id}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="max-h-[75vh] overflow-y-auto p-6">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                <User className="h-4 w-4" />
                Cliente
              </div>

              <p className="mt-2 font-semibold text-slate-900">
                {invoice.cliente_nombre}
              </p>

              <p className="mt-1 text-sm text-slate-500">
                Documento: {invoice.cliente_documento}
              </p>

              {invoice.cliente_direccion && (
                <p className="mt-1 text-sm text-slate-500">
                  {invoice.cliente_direccion}
                </p>
              )}
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                <CalendarDays className="h-4 w-4" />
                Emisión
              </div>

              <p className="mt-2 font-semibold text-slate-900">
                {formatDate(invoice.fecha_emision)}
              </p>

              <p className="mt-1 text-sm text-slate-500">
                Servicio #{invoice.servicio_id}
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                <CircleDollarSign className="h-4 w-4" />
                Total
              </div>

              <p className="mt-2 text-xl font-bold text-slate-900">
                {formatMoney(invoice.total)}
              </p>

              <div className="mt-2">
                <StatusBadge status={invoice.estado} />
              </div>
            </div>
          </div>

          <div className="mt-6">
            <h3 className="mb-3 text-sm font-bold text-slate-900">
              Detalle del comprobante
            </h3>

            <div className="overflow-hidden rounded-xl border border-slate-200">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Concepto
                      </th>

                      <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Cantidad
                      </th>

                      <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Precio
                      </th>

                      <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Subtotal
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100 bg-white">
                    {(invoice.detalles || []).map((item) => (
                      <tr key={item.id}>
                        <td className="px-4 py-3 text-sm text-slate-700">
                          {item.concepto}
                        </td>

                        <td className="px-4 py-3 text-right text-sm text-slate-600">
                          {Number(item.cantidad).toFixed(2)}
                        </td>

                        <td className="px-4 py-3 text-right text-sm text-slate-600">
                          {formatMoney(item.precio_unitario)}
                        </td>

                        <td className="px-4 py-3 text-right text-sm font-semibold text-slate-800">
                          {formatMoney(item.subtotal)}
                        </td>
                      </tr>
                    ))}

                    {(!invoice.detalles ||
                      invoice.detalles.length === 0) && (
                      <tr>
                        <td
                          colSpan="4"
                          className="px-4 py-8 text-center text-sm text-slate-500"
                        >
                          No hay detalles registrados.
                        </td>
                      </tr>
                    )}
                  </tbody>

                  <tfoot className="border-t border-slate-200 bg-slate-50">
                    <tr>
                      <td
                        colSpan="3"
                        className="px-4 py-3 text-right text-sm font-bold text-slate-700"
                      >
                        Total
                      </td>

                      <td className="px-4 py-3 text-right text-base font-bold text-slate-900">
                        {formatMoney(invoice.total)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </div>

          {invoice.observaciones && (
            <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Observaciones
              </p>

              <p className="mt-2 text-sm text-slate-700">
                {invoice.observaciones}
              </p>
            </div>
          )}
        </div>

        <div className="flex flex-col-reverse gap-3 border-t border-slate-200 bg-slate-50 px-6 py-4 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={() => onDownloadPdf(invoice)}
            disabled={downloadingPdf}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-indigo-200 bg-white px-4 py-2.5 text-sm font-semibold text-indigo-600 transition hover:bg-indigo-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {downloadingPdf ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}

            {downloadingPdf ? "Generando PDF..." : "Descargar PDF"}
          </button>

          {canCancel && invoice.estado === "EMITIDO" && (
            <button
              type="button"
              onClick={() => onCancel(invoice)}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-200 bg-white px-4 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-50"
            >
              <Ban className="h-4 w-4" />
              Anular comprobante
            </button>
          )}

          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}

export function Invoices() {
  const { user } = useContext(AuthContext);

  const role = String(user?.rol || "").toUpperCase();
  const canCancel = role === "ADMIN";

  const [invoices, setInvoices] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("TODOS");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  async function loadInvoices() {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/invoices/");
      setInvoices(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      console.error(err);

      setError(
        err?.response?.data?.detail ||
          "No se pudieron cargar los comprobantes."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadInvoices();
  }, []);

  async function openInvoice(invoice) {
    try {
      setProcessing(true);

      const response = await api.get(`/invoices/${invoice.id}`);
      setSelectedInvoice(response.data);
    } catch (err) {
      console.error(err);

      setError(
        err?.response?.data?.detail ||
          "No se pudo cargar el detalle del comprobante."
      );
    } finally {
      setProcessing(false);
    }
  }

  async function handleDownloadPdf(invoice) {
    try {
      setDownloadingPdf(true);
      setError("");

      const response = await api.get(
        `/invoices/${invoice.id}/pdf`,
        {
          responseType: "blob",
        }
      );

      const blob = new Blob([response.data], {
        type: "application/pdf",
      });

      const url = window.URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;

      const type =
        invoiceTypeLabels[invoice.tipo_comprobante] ||
        invoice.tipo_comprobante;

      const safeType = type
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/\s+/g, "_")
        .toLowerCase();

      link.download = `${safeType}_${invoice.serie}_${invoice.numero}.pdf`;

      document.body.appendChild(link);
      link.click();
      link.remove();

      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);

      setError(
        "No se pudo generar o descargar el PDF del comprobante."
      );
    } finally {
      setDownloadingPdf(false);
    }
  }

  async function handleCancel(invoice) {
    const confirmed = window.confirm(
      `¿Deseas anular el comprobante ${invoice.serie}-${invoice.numero}?`
    );

    if (!confirmed) return;

    try {
      setProcessing(true);
      setError("");

      await api.patch(`/invoices/${invoice.id}/anular`);

      setSelectedInvoice(null);

      await loadInvoices();
    } catch (err) {
      console.error(err);

      setError(
        err?.response?.data?.detail ||
          "No se pudo anular el comprobante."
      );
    } finally {
      setProcessing(false);
    }
  }

  const filteredInvoices = useMemo(() => {
    const term = search.trim().toLowerCase();

    return invoices.filter((invoice) => {
      const matchesStatus =
        statusFilter === "TODOS" ||
        invoice.estado === statusFilter;

      const searchable = [
        invoice.id,
        invoice.servicio_id,
        invoice.cliente_id,
        invoice.cliente_nombre,
        invoice.cliente_documento,
        invoice.serie,
        invoice.numero,
        invoice.tipo_comprobante,
        invoice.estado,
      ]
        .join(" ")
        .toLowerCase();

      return matchesStatus && (!term || searchable.includes(term));
    });
  }, [invoices, search, statusFilter]);

  const stats = useMemo(() => {
    const emitidos = invoices.filter(
      (invoice) => invoice.estado === "EMITIDO"
    );

    const anulados = invoices.filter(
      (invoice) => invoice.estado === "ANULADO"
    );

    const totalEmitido = emitidos.reduce(
      (sum, invoice) => sum + Number(invoice.total || 0),
      0
    );

    return {
      total: invoices.length,
      emitidos: emitidos.length,
      anulados: anulados.length,
      totalEmitido,
    };
  }, [invoices]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
              <FileText className="h-5 w-5" />
            </div>

            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                Comprobantes
              </h1>

              <p className="mt-1 text-sm text-slate-500">
                Consulta y gestión de comprobantes asociados a servicios.
              </p>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={loadInvoices}
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <RefreshCw
            className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
          />
          Actualizar
        </button>
      </div>

      {error && (
        <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />

          <div className="flex-1">
            <p className="font-semibold">Ocurrió un problema</p>

            <p className="mt-1">{error}</p>
          </div>

          <button
            type="button"
            onClick={() => setError("")}
            className="rounded-lg p-1 hover:bg-red-100"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-slate-500">
            Comprobantes
          </p>

          <p className="mt-2 text-2xl font-bold text-slate-900">
            {stats.total}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-slate-500">
            Emitidos
          </p>

          <p className="mt-2 text-2xl font-bold text-emerald-600">
            {stats.emitidos}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-slate-500">
            Anulados
          </p>

          <p className="mt-2 text-2xl font-bold text-red-600">
            {stats.anulados}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-slate-500">
            Total emitido
          </p>

          <p className="mt-2 text-2xl font-bold text-indigo-600">
            {formatMoney(stats.totalEmitido)}
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-slate-200 p-4 lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar por cliente, documento, serie, número o servicio..."
              className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
          >
            <option value="TODOS">Todos los estados</option>
            <option value="EMITIDO">Emitidos</option>
            <option value="ANULADO">Anulados</option>
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-5 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                  Comprobante
                </th>

                <th className="px-5 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                  Cliente
                </th>

                <th className="px-5 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                  Servicio
                </th>

                <th className="px-5 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                  Fecha
                </th>

                <th className="px-5 py-3 text-right text-xs font-bold uppercase tracking-wide text-slate-500">
                  Total
                </th>

                <th className="px-5 py-3 text-center text-xs font-bold uppercase tracking-wide text-slate-500">
                  Estado
                </th>

                <th className="px-5 py-3 text-right text-xs font-bold uppercase tracking-wide text-slate-500">
                  Acción
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 bg-white">
              {loading ? (
                Array.from({ length: 5 }).map((_, index) => (
                  <tr key={index}>
                    {Array.from({ length: 7 }).map((__, cell) => (
                      <td key={cell} className="px-5 py-4">
                        <div className="h-4 animate-pulse rounded bg-slate-100" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : filteredInvoices.length === 0 ? (
                <tr>
                  <td
                    colSpan="7"
                    className="px-5 py-16 text-center"
                  >
                    <FileText className="mx-auto h-10 w-10 text-slate-300" />

                    <p className="mt-3 text-sm font-semibold text-slate-700">
                      No hay comprobantes
                    </p>

                    <p className="mt-1 text-sm text-slate-500">
                      No se encontraron comprobantes con los filtros actuales.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredInvoices.map((invoice) => (
                  <tr
                    key={invoice.id}
                    className="transition hover:bg-slate-50"
                  >
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                          <FileText className="h-4 w-4" />
                        </div>

                        <div>
                          <p className="text-sm font-bold text-slate-900">
                            {invoice.serie}-{invoice.numero}
                          </p>

                          <p className="text-xs text-slate-500">
                            {invoiceTypeLabels[
                              invoice.tipo_comprobante
                            ] || invoice.tipo_comprobante}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="px-5 py-4">
                      <p className="text-sm font-semibold text-slate-800">
                        {invoice.cliente_nombre}
                      </p>

                      <p className="text-xs text-slate-500">
                        {invoice.cliente_documento}
                      </p>
                    </td>

                    <td className="px-5 py-4 text-sm text-slate-600">
                      #{invoice.servicio_id}
                    </td>

                    <td className="px-5 py-4 text-sm text-slate-600">
                      {formatDate(invoice.fecha_emision)}
                    </td>

                    <td className="px-5 py-4 text-right text-sm font-bold text-slate-900">
                      {formatMoney(invoice.total)}
                    </td>

                    <td className="px-5 py-4 text-center">
                      <StatusBadge status={invoice.estado} />
                    </td>

                    <td className="px-5 py-4 text-right">
                      <button
                        type="button"
                        onClick={() => openInvoice(invoice)}
                        disabled={processing}
                        className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-indigo-600 transition hover:bg-indigo-50 disabled:opacity-50"
                      >
                        <Eye className="h-4 w-4" />
                        Ver
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {!loading && filteredInvoices.length > 0 && (
          <div className="border-t border-slate-200 px-5 py-3 text-sm text-slate-500">
            Mostrando{" "}
            <span className="font-semibold text-slate-700">
              {filteredInvoices.length}
            </span>{" "}
            de{" "}
            <span className="font-semibold text-slate-700">
              {invoices.length}
            </span>{" "}
            comprobantes.
          </div>
        )}
      </div>

      <DetailModal
        invoice={selectedInvoice}
        onClose={() => setSelectedInvoice(null)}
        canCancel={canCancel}
        onCancel={handleCancel}
        onDownloadPdf={handleDownloadPdf}
        downloadingPdf={downloadingPdf}
      />
    </div>
  );
}
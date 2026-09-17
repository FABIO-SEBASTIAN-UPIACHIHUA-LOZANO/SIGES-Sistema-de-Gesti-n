import React, { useEffect, useMemo, useState } from "react";
import {
  CreditCard,
  Plus,
  Search,
  RefreshCw,
  X,
  CheckCircle2,
  Clock3,
  AlertCircle,
  Ban,
  WalletCards,
  Receipt,
} from "lucide-react";

import api from "../services/api";
import { useAuth } from "../context/AuthContext";


const PAYMENT_METHODS = [
  { value: "EFECTIVO", label: "Efectivo" },
  { value: "YAPE", label: "Yape" },
  { value: "PLIN", label: "Plin" },
  { value: "TRANSFERENCIA", label: "Transferencia" },
  { value: "TARJETA", label: "Tarjeta" },
  { value: "OTRO", label: "Otro" },
];


const formatCurrency = (value) => {
  return new Intl.NumberFormat("es-PE", {
    style: "currency",
    currency: "PEN",
  }).format(Number(value || 0));
};


const formatDate = (value) => {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return new Intl.DateTimeFormat("es-PE", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
};


const getServiceTotal = (service) => {
  const labor = Number(service?.monto || 0);

  const products = Array.isArray(service?.items)
    ? service.items.reduce(
        (total, item) => total + Number(item?.subtotal || 0),
        0
      )
    : 0;

  return labor + products;
};


const getStatusConfig = (status) => {
  switch (status) {
    case "PAGADO":
      return {
        label: "Pagado",
        className:
          "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",
        icon: CheckCircle2,
      };

    case "PARCIAL":
      return {
        label: "Pago parcial",
        className:
          "bg-amber-50 text-amber-700 ring-1 ring-amber-200",
        icon: Clock3,
      };

    default:
      return {
        label: "Pendiente",
        className:
          "bg-slate-100 text-slate-600 ring-1 ring-slate-200",
        icon: AlertCircle,
      };
  }
};


const getPaymentStatusConfig = (status) => {
  if (status === "ANULADO") {
    return {
      label: "Anulado",
      className:
        "bg-red-50 text-red-700 ring-1 ring-red-200",
    };
  }

  return {
    label: "Pagado",
    className:
      "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",
  };
};


export function Payments() {
  const { user, hasRole } = useAuth();

  const [payments, setPayments] = useState([]);
  const [services, setServices] = useState([]);
  const [clients, setClients] = useState([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [search, setSearch] = useState("");

  const [showModal, setShowModal] = useState(false);

  const [selectedServiceId, setSelectedServiceId] = useState("");
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("EFECTIVO");

  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [cancelingId, setCancelingId] = useState(null);


  const canRegisterPayments =
    hasRole("ADMIN", "VENDEDOR");

  const canCancelPayments =
    hasRole("ADMIN");


  const loadData = async (showRefresh = false) => {
    try {
      if (showRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      const [paymentsResponse, servicesResponse, clientsResponse] =
        await Promise.all([
          api.get("/payments/"),
          api.get("/services/"),
          api.get("/clients/"),
        ]);

      setPayments(
        Array.isArray(paymentsResponse.data)
          ? paymentsResponse.data
          : []
      );

      setServices(
        Array.isArray(servicesResponse.data)
          ? servicesResponse.data
          : []
      );

      setClients(
        Array.isArray(clientsResponse.data)
          ? clientsResponse.data
          : []
      );
    } catch (err) {
      console.error(err);

      setError(
        err.response?.data?.detail ||
          "No se pudo cargar la información de pagos."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };


  useEffect(() => {
    loadData();
  }, []);


  const clientMap = useMemo(() => {
    const map = new Map();

    clients.forEach((client) => {
      map.set(Number(client.id), client);
    });

    return map;
  }, [clients]);


  const paymentTotals = useMemo(() => {
    const totals = new Map();

    payments.forEach((payment) => {
      const serviceId = Number(payment.servicio_id);

      if (!totals.has(serviceId)) {
        totals.set(serviceId, 0);
      }

      if (payment.estado === "PAGADO") {
        totals.set(
          serviceId,
          totals.get(serviceId) + Number(payment.monto || 0)
        );
      }
    });

    return totals;
  }, [payments]);


  const serviceRows = useMemo(() => {
    return services.map((service) => {
      const total = getServiceTotal(service);

      const paid = Number(
        paymentTotals.get(Number(service.id)) || 0
      );

      const balance = Math.max(total - paid, 0);

      let financialStatus = "PENDIENTE";

      if (balance <= 0 && total > 0) {
        financialStatus = "PAGADO";
      } else if (paid > 0) {
        financialStatus = "PARCIAL";
      }

      return {
        ...service,
        total,
        paid,
        balance,
        financialStatus,
      };
    });
  }, [services, paymentTotals]);


  const filteredServices = useMemo(() => {
    const normalizedSearch = search
      .trim()
      .toLowerCase();

    if (!normalizedSearch) {
      return serviceRows;
    }

    return serviceRows.filter((service) => {
      const client = clientMap.get(
        Number(service.cliente_id)
      );

      const clientText = [
        client?.nombre,
        client?.apellido,
        client?.documento,
        client?.email,
      ]
        .filter(Boolean)
        .join(" ");

      const serviceText = [
        service.id,
        service.tipo_servicio,
        service.estado,
        clientText,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return serviceText.includes(normalizedSearch);
    });
  }, [serviceRows, search, clientMap]);


  const metrics = useMemo(() => {
    const total = serviceRows.reduce(
      (sum, service) => sum + service.total,
      0
    );

    const paid = serviceRows.reduce(
      (sum, service) => sum + service.paid,
      0
    );

    const balance = serviceRows.reduce(
      (sum, service) => sum + service.balance,
      0
    );

    const paidServices = serviceRows.filter(
      (service) => service.financialStatus === "PAGADO"
    ).length;

    const partialServices = serviceRows.filter(
      (service) => service.financialStatus === "PARCIAL"
    ).length;

    const pendingServices = serviceRows.filter(
      (service) => service.financialStatus === "PENDIENTE"
    ).length;

    return {
      total,
      paid,
      balance,
      paidServices,
      partialServices,
      pendingServices,
    };
  }, [serviceRows]);


  const availableServices = useMemo(() => {
    return serviceRows.filter(
      (service) =>
        service.balance > 0 &&
        service.estado !== "CANCELADO"
    );
  }, [serviceRows]);


  const selectedService = useMemo(() => {
    if (!selectedServiceId) return null;

    return serviceRows.find(
      (service) =>
        Number(service.id) === Number(selectedServiceId)
    );
  }, [selectedServiceId, serviceRows]);


  const selectedClient = selectedService
    ? clientMap.get(Number(selectedService.cliente_id))
    : null;


  const openPaymentModal = () => {
    setError("");
    setSuccess("");
    setSelectedServiceId("");
    setAmount("");
    setMethod("EFECTIVO");
    setShowModal(true);
  };


  const closePaymentModal = () => {
    if (saving) return;

    setShowModal(false);
    setSelectedServiceId("");
    setAmount("");
    setMethod("EFECTIVO");
  };


  const handleServiceChange = (event) => {
    const value = event.target.value;

    setSelectedServiceId(value);
    setAmount("");

    setError("");
  };


  const handleAmountChange = (event) => {
    const value = event.target.value;

    if (value === "") {
      setAmount("");
      return;
    }

    const numericValue = Number(value);

    if (Number.isNaN(numericValue)) {
      return;
    }

    if (selectedService && numericValue > selectedService.balance) {
      setAmount(selectedService.balance.toFixed(2));
      return;
    }

    setAmount(value);
  };


  const handleRegisterPayment = async (event) => {
    event.preventDefault();

    if (!selectedService) {
      setError("Selecciona un servicio.");
      return;
    }

    const numericAmount = Number(amount);

    if (!numericAmount || numericAmount <= 0) {
      setError("Ingresa un monto válido mayor que cero.");
      return;
    }

    if (numericAmount > selectedService.balance + 0.001) {
      setError(
        `El monto supera el saldo pendiente de ${formatCurrency(
          selectedService.balance
        )}.`
      );
      return;
    }

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      await api.post("/payments/", {
        servicio_id: Number(selectedService.id),
        monto: Number(numericAmount.toFixed(2)),
        metodo_pago: method,
      });

      setSuccess("Pago registrado correctamente.");

      await loadData();

      setTimeout(() => {
        closePaymentModal();
        setSuccess("");
      }, 700);
    } catch (err) {
      console.error(err);

      setError(
        err.response?.data?.detail ||
          "No se pudo registrar el pago."
      );
    } finally {
      setSaving(false);
    }
  };


  const handleCancelPayment = async (paymentId) => {
    const confirmed = window.confirm(
      "¿Seguro que deseas anular este pago? Esta acción cambiará su estado a ANULADO."
    );

    if (!confirmed) {
      return;
    }

    try {
      setCancelingId(paymentId);
      setError("");

      await api.patch(
        `/payments/${paymentId}/anular`
      );

      await loadData(true);
    } catch (err) {
      console.error(err);

      setError(
        err.response?.data?.detail ||
          "No se pudo anular el pago."
      );
    } finally {
      setCancelingId(null);
    }
  };


  const getClientName = (service) => {
    const client = clientMap.get(
      Number(service.cliente_id)
    );

    if (!client) {
      return `Cliente #${service.cliente_id}`;
    }

    return (
      client.nombre ||
      client.razon_social ||
      client.email ||
      `Cliente #${service.cliente_id}`
    );
  };


  const getPaymentMethodLabel = (methodValue) => {
    return (
      PAYMENT_METHODS.find(
        (methodItem) =>
          methodItem.value === methodValue
      )?.label || methodValue
    );
  };


  const getServicePayments = (serviceId) => {
    return payments
      .filter(
        (payment) =>
          Number(payment.servicio_id) ===
          Number(serviceId)
      )
      .sort(
        (a, b) =>
          new Date(b.fecha) -
          new Date(a.fecha)
      );
  };


  return (
    <div className="space-y-6">

      {/* HEADER */}

      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

        <div>
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <CreditCard className="h-4 w-4" />
            <span>Gestión financiera</span>
          </div>

          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
            Pagos
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Controla los pagos, saldos pendientes y estado financiero de los servicios.
          </p>
        </div>

        <div className="flex items-center gap-2">

          <button
            type="button"
            onClick={() => loadData(true)}
            disabled={refreshing}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCw
              className={`h-4 w-4 ${
                refreshing ? "animate-spin" : ""
              }`}
            />
            Actualizar
          </button>

          {canRegisterPayments && (
            <button
              type="button"
              onClick={openPaymentModal}
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-indigo-600/20 transition hover:bg-indigo-700"
            >
              <Plus className="h-4 w-4" />
              Registrar pago
            </button>
          )}

        </div>
      </div>


      {/* ERROR GLOBAL */}

      {error && !showModal && (
        <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />

          <div className="flex-1">
            {error}
          </div>

          <button
            type="button"
            onClick={() => setError("")}
            className="text-red-400 hover:text-red-600"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}


      {/* MÉTRICAS */}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">

        <MetricCard
          icon={Receipt}
          label="Total de servicios"
          value={formatCurrency(metrics.total)}
          description={`${serviceRows.length} servicios`}
        />

        <MetricCard
          icon={WalletCards}
          label="Total pagado"
          value={formatCurrency(metrics.paid)}
          description={`${metrics.paidServices} servicios pagados`}
          iconClass="bg-emerald-50 text-emerald-600"
        />

        <MetricCard
          icon={Clock3}
          label="Saldo pendiente"
          value={formatCurrency(metrics.balance)}
          description={`${metrics.partialServices} parciales · ${metrics.pendingServices} pendientes`}
          iconClass="bg-amber-50 text-amber-600"
        />

        <MetricCard
          icon={CreditCard}
          label="Pagos registrados"
          value={String(payments.length)}
          description="Incluye pagos anulados"
          iconClass="bg-indigo-50 text-indigo-600"
        />

      </div>


      {/* SERVICIOS */}

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

        <div className="border-b border-slate-100 px-5 py-4">

          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

            <div>
              <h2 className="text-base font-bold text-slate-900">
                Estado financiero por servicio
              </h2>

              <p className="mt-1 text-xs text-slate-500">
                El total se calcula como mano de obra más productos utilizados.
              </p>
            </div>

            <div className="relative w-full lg:w-80">

              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

              <input
                type="text"
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
                placeholder="Buscar servicio o cliente..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-4 text-sm outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100"
              />

            </div>

          </div>

        </div>


        {loading ? (
          <LoadingTable />
        ) : filteredServices.length === 0 ? (
          <EmptyState
            search={search}
            onCreate={
              canRegisterPayments
                ? openPaymentModal
                : undefined
            }
          />
        ) : (

          <div className="overflow-x-auto">

            <table className="min-w-[1000px] w-full">

              <thead className="border-b border-slate-100 bg-slate-50">

                <tr>

                  <TableHeader>
                    Servicio
                  </TableHeader>

                  <TableHeader>
                    Cliente
                  </TableHeader>

                  <TableHeader>
                    Total
                  </TableHeader>

                  <TableHeader>
                    Pagado
                  </TableHeader>

                  <TableHeader>
                    Saldo
                  </TableHeader>

                  <TableHeader>
                    Estado
                  </TableHeader>

                  <TableHeader align="right">
                    Acción
                  </TableHeader>

                </tr>

              </thead>

              <tbody className="divide-y divide-slate-100">

                {filteredServices.map((service) => {

                  const statusConfig =
                    getStatusConfig(
                      service.financialStatus
                    );

                  const StatusIcon =
                    statusConfig.icon;

                  const servicePayments =
                    getServicePayments(service.id);

                  return (
                    <tr
                      key={service.id}
                      className="transition hover:bg-slate-50/70"
                    >

                      <td className="px-5 py-4">

                        <div>
                          <p className="font-semibold text-slate-900">
                            Servicio #{service.id}
                          </p>

                          <p className="mt-0.5 text-xs text-slate-500">
                            {service.tipo_servicio || "Servicio"}
                          </p>
                        </div>

                      </td>


                      <td className="px-5 py-4">

                        <p className="text-sm font-medium text-slate-700">
                          {getClientName(service)}
                        </p>

                        <p className="mt-0.5 text-xs text-slate-400">
                          {servicePayments.length}{" "}
                          {servicePayments.length === 1
                            ? "pago"
                            : "pagos"}
                        </p>

                      </td>


                      <td className="px-5 py-4">

                        <p className="font-semibold text-slate-900">
                          {formatCurrency(service.total)}
                        </p>

                        <p className="mt-0.5 text-xs text-slate-400">
                          Mano de obra + productos
                        </p>

                      </td>


                      <td className="px-5 py-4">

                        <p className="font-semibold text-emerald-600">
                          {formatCurrency(service.paid)}
                        </p>

                      </td>


                      <td className="px-5 py-4">

                        <p
                          className={`font-semibold ${
                            service.balance > 0
                              ? "text-amber-600"
                              : "text-emerald-600"
                          }`}
                        >
                          {formatCurrency(service.balance)}
                        </p>

                      </td>


                      <td className="px-5 py-4">

                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${statusConfig.className}`}
                        >
                          <StatusIcon className="h-3.5 w-3.5" />
                          {statusConfig.label}
                        </span>

                      </td>


                      <td className="px-5 py-4 text-right">

                        {service.balance > 0 &&
                        canRegisterPayments ? (
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedServiceId(
                                String(service.id)
                              );
                              setAmount("");
                              setMethod("EFECTIVO");
                              setError("");
                              setSuccess("");
                              setShowModal(true);
                            }}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-2 text-xs font-semibold text-indigo-700 transition hover:bg-indigo-100"
                          >
                            <Plus className="h-3.5 w-3.5" />
                            Registrar
                          </button>
                        ) : service.financialStatus ===
                          "PAGADO" ? (
                          <span className="text-xs font-medium text-emerald-600">
                            Sin saldo
                          </span>
                        ) : (
                          <span className="text-xs text-slate-400">
                            —
                          </span>
                        )}

                      </td>

                    </tr>
                  );
                })}

              </tbody>

            </table>

          </div>

        )}

      </section>


      {/* HISTORIAL DE PAGOS */}

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

        <div className="border-b border-slate-100 px-5 py-4">

          <h2 className="text-base font-bold text-slate-900">
            Historial de pagos
          </h2>

          <p className="mt-1 text-xs text-slate-500">
            Registro de operaciones realizadas en los servicios.
          </p>

        </div>


        {payments.length === 0 ? (

          <div className="px-5 py-12 text-center">

            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100">
              <CreditCard className="h-6 w-6 text-slate-400" />
            </div>

            <h3 className="mt-4 text-sm font-semibold text-slate-800">
              Aún no hay pagos registrados
            </h3>

            <p className="mx-auto mt-1 max-w-md text-xs text-slate-500">
              Los pagos que registres aparecerán aquí junto con su método,
              estado y fecha.
            </p>

          </div>

        ) : (

          <div className="overflow-x-auto">

            <table className="min-w-[900px] w-full">

              <thead className="border-b border-slate-100 bg-slate-50">

                <tr>

                  <TableHeader>
                    Pago
                  </TableHeader>

                  <TableHeader>
                    Servicio
                  </TableHeader>

                  <TableHeader>
                    Método
                  </TableHeader>

                  <TableHeader>
                    Monto
                  </TableHeader>

                  <TableHeader>
                    Estado
                  </TableHeader>

                  <TableHeader>
                    Fecha
                  </TableHeader>

                  <TableHeader align="right">
                    Acción
                  </TableHeader>

                </tr>

              </thead>

              <tbody className="divide-y divide-slate-100">

                {[...payments]
                  .sort(
                    (a, b) =>
                      new Date(b.fecha) -
                      new Date(a.fecha)
                  )
                  .map((payment) => {

                    const status =
                      getPaymentStatusConfig(
                        payment.estado
                      );

                    return (
                      <tr
                        key={payment.id}
                        className="transition hover:bg-slate-50/70"
                      >

                        <td className="px-5 py-4">

                          <p className="font-semibold text-slate-900">
                            Pago #{payment.id}
                          </p>

                          <p className="mt-0.5 text-xs text-slate-400">
                            Usuario #{payment.usuario_id}
                          </p>

                        </td>


                        <td className="px-5 py-4">

                          <p className="text-sm font-semibold text-slate-700">
                            Servicio #{payment.servicio_id}
                          </p>

                          <p className="mt-0.5 text-xs text-slate-400">
                            {getClientName(
                              services.find(
                                (service) =>
                                  Number(service.id) ===
                                  Number(payment.servicio_id)
                              ) || {}
                            )}
                          </p>

                        </td>


                        <td className="px-5 py-4">

                          <span className="text-sm text-slate-600">
                            {getPaymentMethodLabel(
                              payment.metodo_pago
                            )}
                          </span>

                        </td>


                        <td className="px-5 py-4">

                          <span className="font-semibold text-slate-900">
                            {formatCurrency(payment.monto)}
                          </span>

                        </td>


                        <td className="px-5 py-4">

                          <span
                            className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${status.className}`}
                          >
                            {status.label}
                          </span>

                        </td>


                        <td className="px-5 py-4">

                          <span className="text-sm text-slate-500">
                            {formatDate(payment.fecha)}
                          </span>

                        </td>


                        <td className="px-5 py-4 text-right">

                          {payment.estado === "PAGADO" &&
                          canCancelPayments ? (
                            <button
                              type="button"
                              onClick={() =>
                                handleCancelPayment(
                                  payment.id
                                )
                              }
                              disabled={
                                cancelingId ===
                                payment.id
                              }
                              className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              <Ban className="h-3.5 w-3.5" />

                              {cancelingId ===
                              payment.id
                                ? "Anulando..."
                                : "Anular"}
                            </button>
                          ) : (
                            <span className="text-xs text-slate-400">
                              —
                            </span>
                          )}

                        </td>

                      </tr>
                    );
                  })}

              </tbody>

            </table>

          </div>

        )}

      </section>


      {/* MODAL REGISTRAR PAGO */}

      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/50 px-4 py-6 backdrop-blur-sm">

          <div className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl">

            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">

              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  Registrar pago
                </h2>

                <p className="mt-0.5 text-xs text-slate-500">
                  Registra un pago parcial o cancela el saldo pendiente.
                </p>
              </div>

              <button
                type="button"
                onClick={closePaymentModal}
                disabled={saving}
                className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50"
              >
                <X className="h-5 w-5" />
              </button>

            </div>


            <form
              onSubmit={handleRegisterPayment}
              className="space-y-5 p-6"
            >

              {error && (
                <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">

                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />

                  <span>{error}</span>

                </div>
              )}


              {success && (
                <div className="flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">

                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />

                  <span>{success}</span>

                </div>
              )}


              <div>

                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Servicio
                </label>

                <select
                  value={selectedServiceId}
                  onChange={handleServiceChange}
                  required
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-700 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                >

                  <option value="">
                    Selecciona un servicio
                  </option>

                  {availableServices.map((service) => (
                    <option
                      key={service.id}
                      value={service.id}
                    >
                      #{service.id} ·{" "}
                      {getClientName(service)} ·{" "}
                      Saldo{" "}
                      {formatCurrency(
                        service.balance
                      )}
                    </option>
                  ))}

                </select>

              </div>


              {selectedService && (
                <div className="rounded-xl border border-indigo-100 bg-indigo-50 p-4">

                  <div className="grid grid-cols-2 gap-4">

                    <div>
                      <p className="text-xs font-medium text-indigo-500">
                        Cliente
                      </p>

                      <p className="mt-1 text-sm font-semibold text-indigo-950">
                        {selectedClient?.nombre ||
                          `Cliente #${selectedService.cliente_id}`}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs font-medium text-indigo-500">
                        Servicio
                      </p>

                      <p className="mt-1 text-sm font-semibold text-indigo-950">
                        #{selectedService.id}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs font-medium text-indigo-500">
                        Total
                      </p>

                      <p className="mt-1 text-sm font-bold text-indigo-950">
                        {formatCurrency(
                          selectedService.total
                        )}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs font-medium text-indigo-500">
                        Saldo pendiente
                      </p>

                      <p className="mt-1 text-sm font-bold text-amber-600">
                        {formatCurrency(
                          selectedService.balance
                        )}
                      </p>
                    </div>

                  </div>

                </div>
              )}


              <div>

                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Monto del pago
                </label>

                <div className="relative">

                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-slate-400">
                    S/
                  </span>

                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    max={
                      selectedService?.balance ||
                      undefined
                    }
                    value={amount}
                    onChange={handleAmountChange}
                    required
                    placeholder="0.00"
                    className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-3 text-sm font-semibold text-slate-800 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                  />

                </div>

                {selectedService && (
                  <p className="mt-1.5 text-xs text-slate-500">
                    Máximo permitido:{" "}
                    <span className="font-semibold text-slate-700">
                      {formatCurrency(
                        selectedService.balance
                      )}
                    </span>
                  </p>
                )}

              </div>


              <div>

                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Método de pago
                </label>

                <select
                  value={method}
                  onChange={(event) =>
                    setMethod(event.target.value)
                  }
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-700 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                >

                  {PAYMENT_METHODS.map(
                    (paymentMethod) => (
                      <option
                        key={paymentMethod.value}
                        value={paymentMethod.value}
                      >
                        {paymentMethod.label}
                      </option>
                    )
                  )}

                </select>

              </div>


              <div className="flex justify-end gap-3 border-t border-slate-100 pt-5">

                <button
                  type="button"
                  onClick={closePaymentModal}
                  disabled={saving}
                  className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  disabled={
                    saving ||
                    !selectedService ||
                    !amount
                  }
                  className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
                >

                  <CreditCard className="h-4 w-4" />

                  {saving
                    ? "Registrando..."
                    : "Registrar pago"}

                </button>

              </div>

            </form>

          </div>

        </div>
      )}

    </div>
  );
}


/* ============================================================
   COMPONENTES AUXILIARES
============================================================ */

function MetricCard({
  icon: Icon,
  label,
  value,
  description,
  iconClass = "bg-slate-100 text-slate-600",
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

      <div className="flex items-start justify-between gap-4">

        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            {label}
          </p>

          <p className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
            {value}
          </p>

          <p className="mt-1 text-xs text-slate-500">
            {description}
          </p>
        </div>

        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${iconClass}`}
        >
          <Icon className="h-5 w-5" />
        </div>

      </div>

    </div>
  );
}


function TableHeader({
  children,
  align = "left",
}) {
  return (
    <th
      className={`px-5 py-3 text-xs font-bold uppercase tracking-wide text-slate-400 ${
        align === "right"
          ? "text-right"
          : "text-left"
      }`}
    >
      {children}
    </th>
  );
}


function LoadingTable() {
  return (
    <div className="divide-y divide-slate-100">

      {Array.from({ length: 5 }).map(
        (_, index) => (
          <div
            key={index}
            className="grid grid-cols-7 gap-4 px-5 py-5"
          >
            {Array.from({ length: 7 }).map(
              (_, cell) => (
                <div
                  key={cell}
                  className="h-4 animate-pulse rounded bg-slate-100"
                />
              )
            )}
          </div>
        )
      )}

    </div>
  );
}


function EmptyState({
  search,
  onCreate,
}) {
  return (
    <div className="px-5 py-14 text-center">

      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100">
        {search ? (
          <Search className="h-6 w-6 text-slate-400" />
        ) : (
          <CreditCard className="h-6 w-6 text-slate-400" />
        )}
      </div>

      <h3 className="mt-4 text-sm font-semibold text-slate-800">
        {search
          ? "No se encontraron servicios"
          : "No hay servicios disponibles"}
      </h3>

      <p className="mx-auto mt-1 max-w-md text-xs text-slate-500">
        {search
          ? "Prueba con otro término de búsqueda."
          : "Los servicios aparecerán aquí cuando existan en SIGES."}
      </p>

      {!search && onCreate && (
        <button
          type="button"
          onClick={onCreate}
          className="mt-5 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700"
        >
          <Plus className="h-4 w-4" />
          Registrar pago
        </button>
      )}

    </div>
  );
}
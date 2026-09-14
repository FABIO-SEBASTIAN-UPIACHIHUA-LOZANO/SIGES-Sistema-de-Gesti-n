import React from "react";
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
} from "lucide-react";

export function ServiceDetail() {
  const navigate = useNavigate();
  const { id } = useParams();

  const service = {
    id: id || "SRV-00124",
    status: "EN PROCESO",
    client: "Carlos Ramírez",
    phone: "+51 987 654 321",
    equipment: "Lenovo ThinkPad T14",
    type: "Mantenimiento",
    description:
      "Mantenimiento preventivo y revisión general del equipo.",
    amount: "S/ 280.00",
    created: "13 Sep 2026",
    estimated: "15 Sep 2026",
  };

  return (
    <div className="space-y-6">

      {/* Header */}

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
              {service.id}
            </h1>
          </div>

        </div>

        <span className="inline-flex w-fit items-center rounded-full border border-blue-100 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700">
          {service.status}
        </span>

      </div>

      {/* Main grid */}

      <div className="grid gap-6 xl:grid-cols-3">

        {/* Información principal */}

        <div className="space-y-6 xl:col-span-2">

          <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">

            <div className="border-b border-slate-100 p-6">

              <h2 className="font-semibold text-slate-900">
                Información del servicio
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Datos generales y descripción del trabajo.
              </p>

            </div>

            <div className="grid gap-6 p-6 sm:grid-cols-2">

              <InfoItem
                icon={User}
                label="Cliente"
                value={service.client}
              />

              <InfoItem
                icon={Wrench}
                label="Tipo de servicio"
                value={service.type}
              />

              <InfoItem
                icon={Package}
                label="Equipo"
                value={service.equipment}
              />

              <InfoItem
                icon={CreditCard}
                label="Monto"
                value={service.amount}
              />

              <InfoItem
                icon={CalendarDays}
                label="Fecha de ingreso"
                value={service.created}
              />

              <InfoItem
                icon={Clock3}
                label="Fecha estimada"
                value={service.estimated}
              />

            </div>

          </section>

          {/* Descripción */}

          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

            <h2 className="font-semibold text-slate-900">
              Descripción
            </h2>

            <p className="mt-3 text-sm leading-7 text-slate-600">
              {service.description}
            </p>

          </section>

          {/* Timeline */}

          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

            <h2 className="font-semibold text-slate-900">
              Seguimiento
            </h2>

            <div className="mt-6 space-y-6">

              <TimelineItem
                title="Servicio recibido"
                description="El equipo fue registrado correctamente."
                date="13 Sep · 09:20"
                active
              />

              <TimelineItem
                title="Diagnóstico"
                description="El equipo se encuentra en revisión."
                date="13 Sep · 10:15"
                active
              />

              <TimelineItem
                title="En proceso"
                description="Trabajo técnico actualmente en ejecución."
                date="13 Sep · 11:40"
                active
              />

              <TimelineItem
                title="Terminado"
                description="Pendiente de completar."
                date="Pendiente"
                active={false}
              />

            </div>

          </section>

        </div>

        {/* Sidebar */}

        <div className="space-y-6">

          {/* Cliente */}

          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

            <h2 className="font-semibold text-slate-900">
              Cliente
            </h2>

            <div className="mt-5 flex items-center gap-3">

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-100 font-bold text-indigo-700">
                CR
              </div>

              <div>
                <p className="text-sm font-semibold text-slate-800">
                  {service.client}
                </p>

                <p className="mt-0.5 text-xs text-slate-500">
                  {service.phone}
                </p>
              </div>

            </div>

            <button
              onClick={() => navigate("/clientes")}
              className="mt-5 w-full rounded-xl border border-slate-200 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
            >
              Ver cliente
            </button>

          </section>

          {/* Estado */}

          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

            <h2 className="font-semibold text-slate-900">
              Estado del servicio
            </h2>

            <select
              defaultValue={service.status}
              className="mt-4 h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-medium text-slate-700 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
            >
              <option>RECIBIDO</option>
              <option>DIAGNOSTICO</option>
              <option>EN PROCESO</option>
              <option>ESPERA</option>
              <option>TERMINADO</option>
              <option>ENTREGADO</option>
              <option>CANCELADO</option>
            </select>

            <button className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-600/20 hover:bg-indigo-700">
              <CheckCircle2 className="h-4 w-4" />
              Actualizar estado
            </button>

          </section>

        </div>

      </div>

    </div>
  );
}

function InfoItem({ icon: Icon, label, value }) {
  return (
    <div className="flex gap-3">

      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-50 text-slate-500">
        <Icon className="h-4 w-4" />
      </div>

      <div>
        <p className="text-xs font-medium text-slate-400">
          {label}
        </p>

        <p className="mt-1 text-sm font-semibold text-slate-800">
          {value}
        </p>
      </div>

    </div>
  );
}

function TimelineItem({
  title,
  description,
  date,
  active,
}) {
  return (
    <div className="flex gap-4">

      <div className="relative flex flex-col items-center">

        <div
          className={`flex h-8 w-8 items-center justify-center rounded-full ${
            active
              ? "bg-indigo-100 text-indigo-600"
              : "bg-slate-100 text-slate-400"
          }`}
        >
          <CheckCircle2 className="h-4 w-4" />
        </div>

      </div>

      <div className="pb-2">

        <div className="flex flex-wrap items-center gap-2">

          <p className="text-sm font-semibold text-slate-800">
            {title}
          </p>

          <span className="text-xs text-slate-400">
            {date}
          </span>

        </div>

        <p className="mt-1 text-sm text-slate-500">
          {description}
        </p>

      </div>

    </div>
  );
}
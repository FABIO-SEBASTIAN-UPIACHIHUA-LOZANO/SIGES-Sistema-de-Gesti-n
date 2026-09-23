import React, { useContext, useEffect, useState } from "react";
import {
  Users,
  Wrench,
  AlertTriangle,
  DollarSign,
  CheckCircle2,
  Clock3,
  Loader2,
  Activity
} from "lucide-react";
import { AuthContext } from "../context/AuthContext";
import api from "../services/api";

export function Dashboard() {
  const { user } = useContext(AuthContext);

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const role = String(user?.rol || "USUARIO").toUpperCase();
  const nombre = user?.nombre || user?.email || "Usuario";

  useEffect(() => {
    const cargarDashboard = async () => {
      try {
        const response = await api.get("/dashboard/stats");
        setData(response.data);
      } catch (err) {
        console.error(err);
        setError(
          err.response?.data?.detail ||
          "No se pudo cargar la información del dashboard."
        );
      } finally {
        setLoading(false);
      }
    };

    cargarDashboard();
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* HEADER */}
      <div>
        <p className="text-sm font-semibold text-indigo-600">Dashboard</p>
        <h1 className="mt-1 text-3xl font-bold text-slate-900">
          Bienvenido, {nombre}
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          Resumen operativo y financiero en tiempo real de SisTec.
        </p>
        <span className="mt-3 inline-flex rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">
          {role}
        </span>
      </div>

      {/* ERROR */}
      {error && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          {error}
        </div>
      )}

      {/* STATS PRINCIPALES (Basado estrictamente en DashboardStats real) */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
            <Users className="h-5 w-5" />
          </div>
          <p className="mt-5 text-sm font-medium text-slate-500">Total Clientes</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">
            {data?.total_clientes ?? 0}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
            <DollarSign className="h-5 w-5" />
          </div>
          <p className="mt-5 text-sm font-medium text-slate-500">Ingresos Hoy</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">
            S/ {Number(data?.ingresos_hoy || 0).toFixed(2)}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <p className="mt-5 text-sm font-medium text-slate-500">Productos con Stock Bajo</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">
            {data?.productos_stock_bajo ?? 0}
          </p>
        </div>
      </div>

      {/* ESTADOS DE SERVICIOS */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card
          icon={<Clock3 className="text-amber-500" />}
          title="Servicios Pendientes"
          value={data?.servicios_pendientes ?? 0}
        />

        <Card
          icon={<Activity className="text-blue-500" />}
          title="Servicios en Proceso"
          value={data?.servicios_en_proceso ?? 0}
        />

        <Card
          icon={<CheckCircle2 className="text-emerald-500" />}
          title="Servicios Terminados"
          value={data?.servicios_terminados ?? 0}
        />
      </div>
    </div>
  );
}

function Card({ icon, title, value }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100">
        {icon}
      </div>
      <p className="mt-4 text-sm text-slate-500">{title}</p>
      <p className="mt-1 text-xl font-bold text-slate-900">{value}</p>
    </div>
  );
}
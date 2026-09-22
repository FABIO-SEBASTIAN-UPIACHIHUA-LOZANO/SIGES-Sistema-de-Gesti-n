import React, { useContext, useEffect, useState } from "react";

import {
  Users,
  Wrench,
  Package,
  DollarSign,
  AlertCircle,
  CheckCircle2,
  Clock3,
} from "lucide-react";

import { AuthContext } from "../context/AuthContext";
import api from "../services/api";


export function Dashboard() {
  const { user } = useContext(AuthContext);

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");


  const role = (
    user?.rol ||
    user?.role ||
    user?.rol_nombre ||
    user?.role_name ||
    "USUARIO"
  )
    .toString()
    .toUpperCase();


  const nombre =
    user?.nombre ||
    user?.name ||
    user?.email ||
    "Usuario";


  useEffect(() => {
    const cargarDashboard = async () => {
      try {
        const response = await api.get("/dashboard");

        setData(response.data);

      } catch (err) {
        console.error(err);

        setError(
          err.response?.data?.detail ||
          "No se pudo cargar la información."
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
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-indigo-600" />
      </div>
    );
  }


  const stats = [
    {
      title: "Servicios",
      value: data?.total_servicios ?? "N/D",
      icon: Wrench,
    },
    {
      title: "Clientes",
      value: data?.total_clientes ?? "N/D",
      icon: Users,
    },
    {
      title: "Productos",
      value: data?.total_productos ?? "N/D",
      icon: Package,
    },
    {
      title: "Ingresos",
      value:
        data?.ingresos !== undefined
          ? `S/ ${Number(data.ingresos).toFixed(2)}`
          : "N/D",
      icon: DollarSign,
    },
  ];


  return (
    <div className="space-y-8">

      {/* HEADER */}

      <div>
        <p className="text-sm font-semibold text-indigo-600">
          Dashboard
        </p>

        <h1 className="mt-1 text-3xl font-bold text-slate-900">
          Bienvenido, {nombre}
        </h1>

        <p className="mt-2 text-sm text-slate-500">
          Resumen de actividad de SIGES.
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


      {/* KPIs */}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">

        {stats.map((stat) => {
          const Icon = stat.icon;

          return (
            <div
              key={stat.title}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                <Icon className="h-5 w-5" />
              </div>

              <p className="mt-5 text-sm font-medium text-slate-500">
                {stat.title}
              </p>

              <p className="mt-1 text-2xl font-bold text-slate-900">
                {stat.value}
              </p>
            </div>
          );
        })}

      </div>


      {/* RESUMEN */}

      <div className="grid gap-6 md:grid-cols-3">

        <Card
          icon={<Clock3 />}
          title="Servicios pendientes"
          value={data?.servicios_pendientes ?? "N/D"}
        />

        <Card
          icon={<CheckCircle2 />}
          title="Servicios terminados"
          value={data?.servicios_terminados ?? "N/D"}
        />

        <Card
          icon={<AlertCircle />}
          title="Stock bajo"
          value={data?.stock_bajo ?? "N/D"}
        />

      </div>


      {/* ACTIVIDAD */}

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

        <h2 className="font-semibold text-slate-900">
          Actividad reciente
        </h2>

        {!data?.actividad_reciente?.length ? (

          <div className="py-12 text-center text-sm text-slate-400">
            No hay actividad reciente.
          </div>

        ) : (

          <div className="mt-6 space-y-3">

            {data.actividad_reciente.map(
              (item, index) => (
                <div
                  key={item.id || index}
                  className="rounded-xl border border-slate-100 p-4"
                >
                  <p className="text-sm font-semibold text-slate-800">
                    {item.titulo || item.title || "Actividad"}
                  </p>

                  <p className="mt-1 text-xs text-slate-500">
                    {item.descripcion ||
                      item.description ||
                      ""}
                  </p>
                </div>
              )
            )}

          </div>
        )}

      </div>

    </div>
  );
}


function Card({
  icon,
  title,
  value,
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
        {React.cloneElement(icon, {
          className: "h-5 w-5",
        })}
      </div>

      <p className="mt-4 text-sm text-slate-500">
        {title}
      </p>

      <p className="mt-1 text-xl font-bold text-slate-900">
        {value}
      </p>

    </div>
  );
}
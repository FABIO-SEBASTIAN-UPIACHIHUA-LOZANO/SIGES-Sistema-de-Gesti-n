import React, { useState } from "react";
import {
  Search,
  ShieldCheck,
  UserRound,
  LogIn,
  Plus,
  Pencil,
  Trash2,
  Eye,
  Clock3,
} from "lucide-react";

const initialLogs = [
  {
    id: 1,
    user: "Administrador",
    action: "Inicio de sesión",
    module: "Autenticación",
    description: "Inicio de sesión realizado correctamente",
    date: "13 Sep 2026",
    time: "08:42",
    type: "login",
  },
  {
    id: 2,
    user: "Administrador",
    action: "Creación",
    module: "Clientes",
    description: "Se registró un nuevo cliente",
    date: "13 Sep 2026",
    time: "09:15",
    type: "create",
  },
  {
    id: 3,
    user: "Técnico",
    action: "Actualización",
    module: "Servicios",
    description: "Se actualizó el estado de un servicio",
    date: "13 Sep 2026",
    time: "10:21",
    type: "update",
  },
  {
    id: 4,
    user: "Administrador",
    action: "Eliminación",
    module: "Inventario",
    description: "Se eliminó un producto del inventario",
    date: "13 Sep 2026",
    time: "11:04",
    type: "delete",
  },
  {
    id: 5,
    user: "Técnico",
    action: "Consulta",
    module: "Equipos",
    description: "Se consultó la información de un equipo",
    date: "13 Sep 2026",
    time: "11:37",
    type: "view",
  },
];

function ActionIcon({ type }) {
  if (type === "login") {
    return <LogIn size={17} />;
  }

  if (type === "create") {
    return <Plus size={17} />;
  }

  if (type === "update") {
    return <Pencil size={17} />;
  }

  if (type === "delete") {
    return <Trash2 size={17} />;
  }

  return <Eye size={17} />;
}

function actionStyles(type) {
  switch (type) {
    case "login":
      return "bg-blue-50 text-blue-600";

    case "create":
      return "bg-emerald-50 text-emerald-600";

    case "update":
      return "bg-amber-50 text-amber-600";

    case "delete":
      return "bg-red-50 text-red-600";

    default:
      return "bg-slate-100 text-slate-600";
  }
}

function actionBadge(type) {
  switch (type) {
    case "login":
      return "bg-blue-50 text-blue-700";

    case "create":
      return "bg-emerald-50 text-emerald-700";

    case "update":
      return "bg-amber-50 text-amber-700";

    case "delete":
      return "bg-red-50 text-red-700";

    default:
      return "bg-slate-100 text-slate-600";
  }
}

export function Audit() {
  const [logs] = useState(initialLogs);
  const [search, setSearch] = useState("");

  const filteredLogs = logs.filter((log) => {
    const value = search.toLowerCase();

    return (
      log.user.toLowerCase().includes(value) ||
      log.action.toLowerCase().includes(value) ||
      log.module.toLowerCase().includes(value) ||
      log.description.toLowerCase().includes(value)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
            <ShieldCheck size={23} />
          </div>

          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Auditoría
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Registro de actividades realizadas dentro de SIGES.
            </p>
          </div>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">
                Eventos registrados
              </p>

              <p className="mt-2 text-2xl font-bold text-slate-900">
                {logs.length}
              </p>
            </div>

            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
              <ShieldCheck size={21} />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">
                Usuarios activos
              </p>

              <p className="mt-2 text-2xl font-bold text-slate-900">
                {new Set(logs.map((log) => log.user)).size}
              </p>
            </div>

            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
              <UserRound size={21} />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">
                Actividad reciente
              </p>

              <p className="mt-2 text-2xl font-bold text-slate-900">
                Hoy
              </p>
            </div>

            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <Clock3 size={21} />
            </div>
          </div>
        </div>
      </div>

      {/* Audit table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-4 border-b border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-semibold text-slate-900">
              Registro de actividades
            </h2>

            <p className="mt-1 text-xs text-slate-500">
              Historial de acciones realizadas en el sistema
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
              placeholder="Buscar actividad..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-100"
            />
          </div>
        </div>

        <div className="hidden overflow-x-auto md:block">
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr className="border-b border-slate-200">
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Usuario
                </th>

                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Acción
                </th>

                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Módulo
                </th>

                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Descripción
                </th>

                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Fecha
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {filteredLogs.map((log) => (
                <tr
                  key={log.id}
                  className="transition hover:bg-slate-50/70"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-600">
                        <UserRound size={17} />
                      </div>

                      <span className="text-sm font-semibold text-slate-700">
                        {log.user}
                      </span>
                    </div>
                  </td>

                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center gap-2 rounded-full px-2.5 py-1 text-xs font-semibold ${actionBadge(
                        log.type
                      )}`}
                    >
                      <ActionIcon type={log.type} />
                      {log.action}
                    </span>
                  </td>

                  <td className="px-6 py-4">
                    <span className="text-sm text-slate-600">
                      {log.module}
                    </span>
                  </td>

                  <td className="px-6 py-4">
                    <span className="text-sm text-slate-600">
                      {log.description}
                    </span>
                  </td>

                  <td className="px-6 py-4">
                    <p className="text-sm font-medium text-slate-700">
                      {log.date}
                    </p>

                    <p className="mt-0.5 text-xs text-slate-500">
                      {log.time}
                    </p>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile */}
        <div className="divide-y divide-slate-100 md:hidden">
          {filteredLogs.map((log) => (
            <div key={log.id} className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-xl ${actionStyles(
                      log.type
                    )}`}
                  >
                    <ActionIcon type={log.type} />
                  </div>

                  <div>
                    <p className="font-semibold text-slate-800">
                      {log.action}
                    </p>

                    <p className="text-xs text-slate-500">
                      {log.module}
                    </p>
                  </div>
                </div>

                <span className="text-xs text-slate-400">
                  {log.time}
                </span>
              </div>

              <div className="mt-3">
                <p className="text-sm text-slate-600">
                  {log.description}
                </p>

                <p className="mt-2 text-xs text-slate-500">
                  Usuario:{" "}
                  <span className="font-medium text-slate-700">
                    {log.user}
                  </span>
                </p>
              </div>
            </div>
          ))}
        </div>

        {filteredLogs.length === 0 && (
          <div className="p-12 text-center">
            <ShieldCheck
              className="mx-auto text-slate-300"
              size={42}
            />

            <p className="mt-3 font-medium text-slate-700">
              No se encontraron registros
            </p>

            <p className="mt-1 text-sm text-slate-500">
              Intenta realizar una búsqueda diferente.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
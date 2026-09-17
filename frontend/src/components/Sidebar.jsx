
import React, { useContext } from "react";
import {
  LayoutDashboard,
  Wrench,
  Users,
  ShoppingCart,
  MonitorSmartphone,
  ShieldCheck,
  UserCog,
  X,
  ChevronRight,
  Settings,
  HelpCircle,
  CreditCard,
  Bell,
  FileText,
} from "lucide-react";

import { NavLink } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

const menu = [
  {
    title: "Principal",
    items: [
      {
        name: "Dashboard",
        path: "/",
        icon: LayoutDashboard,
        roles: ["ADMIN", "TECNICO", "VENDEDOR"],
      },
    ],
  },

  {
    title: "Gestión",
    items: [
      {
        name: "Servicios",
        path: "/servicios",
        icon: Wrench,
        roles: ["ADMIN", "TECNICO"],
      },

      {
        name: "Clientes",
        path: "/clientes",
        icon: Users,
        roles: ["ADMIN", "TECNICO", "VENDEDOR"],
      },

      {
        name: "Equipos",
        path: "/equipos",
        icon: MonitorSmartphone,
        roles: ["ADMIN", "TECNICO"],
      },

      {
        name: "Productos",
        path: "/productos",
        icon: ShoppingCart,
        roles: ["ADMIN", "TECNICO", "VENDEDOR"],
      },

      {
        name: "Pagos",
        path: "/pagos",
        icon: CreditCard,
        roles: ["ADMIN", "VENDEDOR"],
      },

      {
        name: "Comprobantes",
        path: "/comprobantes",
        icon: FileText,
        roles: ["ADMIN", "VENDEDOR"],
      },


    ],
  },

  {
    title: "Administración",
    items: [
      {
        name: "Usuarios",
        path: "/usuarios",
        icon: UserCog,
        roles: ["ADMIN"],
      },

      {
        name: "Auditoría",
        path: "/auditoria",
        icon: ShieldCheck,
        roles: ["ADMIN"],
      },

      {
        name: "Notificaciones",
        path: "/notificaciones",
        icon: Bell,
        roles: ["ADMIN", "TECNICO", "VENDEDOR"],
      },
    ],
  },
];

const getRoleName = (user) => {
  return String(user?.rol || "USUARIO").toUpperCase();
};

export function Sidebar({ open, onClose }) {
  const { user } = useContext(AuthContext);

  const role = getRoleName(user);

  const visibleSections = menu
    .map((section) => {
      return {
        ...section,
        items: section.items.filter((item) =>
          item.roles.includes(role)
        ),
      };
    })
    .filter((section) => section.items.length > 0);

  const userName =
    user?.nombre ||
    user?.email ||
    "Usuario";

  return (
    <>
      {/* Fondo oscuro en móvil */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/40 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed
          left-0
          top-0
          z-50

          flex
          h-screen
          w-[270px]
          flex-col

          border-r
          border-slate-200
          bg-white

          transition-transform
          duration-300

          ${open ? "translate-x-0" : "-translate-x-full"}

          lg:translate-x-0
        `}
      >

        {/* ============================================================
            LOGO
        ============================================================ */}

        <div className="flex h-[72px] items-center justify-between border-b border-slate-100 px-6">

          <div className="flex items-center gap-3">

            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 shadow-lg shadow-indigo-600/20">
              <Wrench className="h-5 w-5 text-white" />
            </div>

            <div>
              <h1 className="text-lg font-bold tracking-tight text-slate-900">
                SIGES
              </h1>

              <p className="text-[10px] font-medium uppercase tracking-widest text-slate-400">
                Business Suite
              </p>
            </div>

          </div>

          {/* Botón cerrar en móvil */}

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 lg:hidden"
            aria-label="Cerrar menú"
          >
            <X className="h-5 w-5" />
          </button>

        </div>

        {/* ============================================================
            EMPRESA
        ============================================================ */}

        <div className="mx-4 mt-5 rounded-xl border border-slate-200 bg-slate-50 p-3">

          <div className="flex items-center gap-3">

            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white font-semibold text-indigo-600 shadow-sm">
              ME
            </div>

            <div className="min-w-0 flex-1">

              <p className="truncate text-sm font-semibold text-slate-800">
                Mi Empresa
              </p>

              <p className="truncate text-xs text-slate-500">
                Plan Profesional
              </p>

            </div>

            <ChevronRight className="h-4 w-4 text-slate-400" />

          </div>

        </div>

        {/* ============================================================
            NAVEGACIÓN
        ============================================================ */}

        <nav className="mt-6 flex-1 overflow-y-auto px-4 pb-6">

          {visibleSections.map((section) => (

            <div
              key={section.title}
              className="mb-7"
            >

              {/* Título de sección */}

              <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                {section.title}
              </p>

              {/* Items */}

              <div className="space-y-1">

                {section.items.map((item) => {

                  const Icon = item.icon;

                  return (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      end={item.path === "/"}
                      onClick={onClose}
                      className={({ isActive }) =>
                        `
                          group
                          flex
                          items-center
                          gap-3
                          rounded-xl
                          px-3
                          py-2.5
                          text-sm
                          font-medium
                          transition-all
                          duration-200

                          ${
                            isActive
                              ? "bg-indigo-50 text-indigo-700 shadow-sm"
                              : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                          }
                        `
                      }
                    >

                      {({ isActive }) => (

                        <>

                          {/* Icono */}

                          <Icon
                            className={`
                              h-[18px]
                              w-[18px]

                              ${
                                isActive
                                  ? "text-indigo-600"
                                  : "text-slate-400 group-hover:text-slate-600"
                              }
                            `}
                          />

                          {/* Nombre */}

                          <span>
                            {item.name}
                          </span>

                          {/* Indicador activo */}

                          {isActive && (
                            <span className="ml-auto h-1.5 w-1.5 rounded-full bg-indigo-600" />
                          )}

                        </>

                      )}

                    </NavLink>
                  );
                })}

              </div>

            </div>

          ))}

        </nav>

        {/* ============================================================
            USUARIO
        ============================================================ */}

        <div className="border-t border-slate-100 px-4 pt-3">

          <div className="mb-3 rounded-xl bg-slate-50 px-3 py-2.5">

            <div className="flex items-center gap-3">

              {/* Avatar */}

              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-100 text-sm font-semibold text-indigo-700">

                {String(userName)
                  .trim()
                  .charAt(0)
                  .toUpperCase()}

              </div>

              {/* Datos */}

              <div className="min-w-0 flex-1">

                <p className="truncate text-sm font-semibold text-slate-800">
                  {userName}
                </p>

                <p className="text-[11px] font-semibold uppercase tracking-wide text-indigo-600">
                  {role}
                </p>

              </div>

            </div>

          </div>

          {/* Configuración */}

          <button
            type="button"
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900"
          >

            <Settings className="h-[18px] w-[18px] text-slate-400" />

            <span>
              Configuración
            </span>

          </button>

          {/* Centro de ayuda */}

          <button
            type="button"
            className="mt-1 mb-4 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900"
          >

            <HelpCircle className="h-[18px] w-[18px] text-slate-400" />

            <span>
              Centro de ayuda
            </span>

          </button>

        </div>

      </aside>
    </>
  );
}


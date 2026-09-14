// src/components/Navbar.jsx
import React, { useContext } from "react";
import {
  Menu,
  Search,
  Bell,
  ChevronDown,
  LogOut,
} from "lucide-react";

import { AuthContext } from "../context/AuthContext";

export function Navbar({ onMenuClick }) {
  const { user, logout } = useContext(AuthContext);

  const roleName = String(user?.rol || "USUARIO").toUpperCase();
  const displayName = user?.nombre || "Usuario";
  const initials = displayName.slice(0, 2).toUpperCase();

  return (
    <header className="sticky top-0 z-30 flex h-[72px] items-center border-b border-slate-200 bg-white/90 px-4 backdrop-blur-xl sm:px-6">
      <div className="flex w-full items-center justify-between gap-4">
        {/* Left */}
        <div className="flex items-center gap-3">
          <button
            onClick={onMenuClick}
            className="rounded-xl p-2 text-slate-500 hover:bg-slate-100 lg:hidden"
          >
            <Menu className="h-5 w-5" />
          </button>

          <div className="relative hidden md:block">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

            <input
              placeholder="Buscar..."
              className="h-10 w-[280px] rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-500/10"
            />

            <span className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md border border-slate-200 bg-white px-1.5 py-0.5 text-[10px] text-slate-400">
              ⌘ K
            </span>
          </div>
        </div>

        {/* Right */}
        <div className="flex items-center gap-2">
          <button className="relative rounded-xl p-2.5 text-slate-500 hover:bg-slate-100">
            <Bell className="h-5 w-5" />
            <span className="absolute right-2 top-2 h-2 w-2 rounded-full border-2 border-white bg-red-500" />
          </button>

          <div className="mx-1 hidden h-8 w-px bg-slate-200 sm:block" />

          <button className="flex items-center gap-3 rounded-xl p-1.5 pr-2 hover:bg-slate-50">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-100 text-sm font-bold text-indigo-700">
              {initials}
            </div>

            <div className="hidden text-left sm:block">
              <p className="max-w-[130px] truncate text-sm font-semibold text-slate-800">
                {displayName}
              </p>

              <p className="text-xs font-semibold uppercase text-indigo-600">
                {roleName}
              </p>
            </div>

            <ChevronDown className="hidden h-4 w-4 text-slate-400 sm:block" />
          </button>

          <button
            onClick={logout}
            title="Cerrar sesión"
            className="rounded-xl p-2.5 text-slate-400 hover:bg-red-50 hover:text-red-600"
          >
            <LogOut className="h-5 w-5" />
          </button>
        </div>
      </div>
    </header>
  );
}
// src/components/Navbar.jsx
import React, { useContext, useEffect, useRef, useState } from "react";
import {
  Menu,
  Search,
  Bell,
  ChevronDown,
  LogOut,
  UserRound,
  Settings,
  HelpCircle,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import { AuthContext } from "../context/AuthContext";

export function Navbar({ onMenuClick }) {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef(null);

  const roleName = String(user?.rol || "USUARIO").toUpperCase();
  const displayName = user?.nombre || "Usuario";
  const initials = displayName.slice(0, 2).toUpperCase();

  useEffect(() => {
    const closeOnOutsideClick = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setProfileOpen(false);
      }
    };

    const closeOnEscape = (event) => {
      if (event.key === "Escape") setProfileOpen(false);
    };

    document.addEventListener("mousedown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);

    return () => {
      document.removeEventListener("mousedown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, []);

  const goTo = (path) => {
    setProfileOpen(false);
    navigate(path);
  };

  const handleLogout = () => {
    setProfileOpen(false);
    logout();
    navigate("/login", { replace: true });
  };

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

          <div className="relative" ref={profileRef}>
            <button
              type="button"
              onClick={() => setProfileOpen((open) => !open)}
              aria-label="Abrir menú de cuenta"
              aria-expanded={profileOpen}
              aria-haspopup="menu"
              className={`flex items-center gap-3 rounded-xl p-1.5 pr-2 transition ${
                profileOpen ? "bg-slate-100" : "hover:bg-slate-50"
              }`}
            >
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

              <ChevronDown
                className={`hidden h-4 w-4 text-slate-400 transition-transform sm:block ${
                  profileOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            {profileOpen && (
              <div
                role="menu"
                className="absolute right-0 top-[calc(100%+10px)] w-64 overflow-hidden rounded-2xl border border-slate-200 bg-white p-2 shadow-xl shadow-slate-900/10"
              >
                <div className="border-b border-slate-100 px-3 py-2.5 sm:hidden">
                  <p className="truncate text-sm font-semibold text-slate-900">{displayName}</p>
                  <p className="text-xs font-semibold uppercase text-indigo-600">{roleName}</p>
                </div>

                <ProfileMenuItem icon={UserRound} label="Cuenta" onClick={() => goTo("/cuenta")} />
                <ProfileMenuItem icon={Settings} label="Configuración" onClick={() => goTo("/configuracion")} />
                <ProfileMenuItem icon={HelpCircle} label="Centro de ayuda" onClick={() => goTo("/ayuda")} />

                <div className="my-1 border-t border-slate-100" />

                <ProfileMenuItem icon={LogOut} label="Cerrar sesión" onClick={handleLogout} danger />
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

function ProfileMenuItem({ icon: Icon, label, onClick, danger = false }) {
  return (
    <button
      type="button"
      role="menuitem"
      onClick={onClick}
      className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition ${
        danger
          ? "text-red-600 hover:bg-red-50"
          : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
      }`}
    >
      <Icon className={`h-[18px] w-[18px] ${danger ? "text-red-500" : "text-slate-400"}`} />
      {label}
    </button>
  );
}

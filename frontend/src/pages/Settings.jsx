import React, { useState } from "react";
import { BellRing, CheckCircle2, Monitor, Moon, Settings as SettingsIcon, Sun } from "lucide-react";
import { applyTheme, readPreferences, savePreferences } from "../utils/preferences";
import { useAuth } from "../context/AuthContext";

export function Settings() {
  const { user } = useAuth();
  const [preferences, setPreferences] = useState(() => {
    return readPreferences(user);
  });
  const [saved, setSaved] = useState(false);

  const toggle = (key) => {
    setSaved(false);
    setPreferences((current) => ({ ...current, [key]: !current[key] }));
  };

  const save = () => {
    savePreferences(user, preferences);
    setSaved(true);
  };

  // IMPLEMENTACIÓN: vista previa inmediata; Guardar cambios conserva la
  // elección para las siguientes sesiones en este dispositivo.
  const selectTheme = (theme) => {
    setSaved(false);
    setPreferences((current) => ({ ...current, theme }));
    applyTheme(theme);
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-semibold text-indigo-600">Preferencias</p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">Configuración</h1>
        <p className="mt-1 text-sm text-slate-500">Personaliza el comportamiento de tu experiencia en SIGES.</p>
      </div>

      <div className="max-w-3xl rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center gap-3 border-b border-slate-100 p-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
            <SettingsIcon className="h-5 w-5" />
          </div>
          <div>
            <h2 className="font-semibold text-slate-900">Preferencias generales</h2>
            <p className="text-sm text-slate-500">Se guardan para tu cuenta en este dispositivo.</p>
          </div>
        </div>

        <div className="divide-y divide-slate-100 px-6">
          <div className="py-5">
            <div className="flex items-start gap-3">
              <Monitor className="mt-0.5 h-5 w-5 shrink-0 text-slate-400" />
              <div className="w-full">
                <p className="text-sm font-semibold text-slate-800">Apariencia del sistema</p>
                <p className="mt-0.5 text-sm text-slate-500">Elige cómo quieres ver toda la interfaz de SIGES.</p>
                <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <ThemeOption icon={Sun} label="Claro" description="Fondo blanco" selected={preferences.theme === "light"} onClick={() => selectTheme("light")} />
                  <ThemeOption icon={Moon} label="Oscuro" description="Fondo negro" selected={preferences.theme === "dark"} onClick={() => selectTheme("dark")} />
                </div>
              </div>
            </div>
          </div>
          <Preference
            icon={BellRing}
            title="Notificaciones del sistema"
            description="Mostrar avisos sobre servicios, inventario y actividad importante."
            checked={preferences.notifications}
            onChange={() => toggle("notifications")}
          />
          <Preference
            icon={Monitor}
            title="Tablas compactas"
            description="Reducir el espacio vertical para visualizar más información."
            checked={preferences.compactTables}
            onChange={() => toggle("compactTables")}
          />
        </div>

        <div className="flex items-center justify-between gap-4 border-t border-slate-100 bg-slate-50/70 px-6 py-4">
          <p className="flex items-center gap-2 text-sm text-emerald-700" aria-live="polite">
            {saved && <><CheckCircle2 className="h-4 w-4" /> Preferencias guardadas</>}
          </p>
          <button type="button" onClick={save} className="rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700">
            Guardar cambios
          </button>
        </div>
      </div>
    </div>
  );
}

function ThemeOption({ icon: Icon, label, description, selected, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={`flex items-center gap-3 rounded-xl border p-3 text-left transition ${selected ? "border-indigo-500 bg-indigo-50 ring-2 ring-indigo-500/10" : "border-slate-200 bg-white hover:bg-slate-50"}`}
    >
      <span className={`flex h-9 w-9 items-center justify-center rounded-lg ${selected ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-500"}`}>
        <Icon className="h-4 w-4" />
      </span>
      <span>
        <span className="block text-sm font-semibold text-slate-800">{label}</span>
        <span className="block text-xs text-slate-500">{description}</span>
      </span>
      <span className={`ml-auto h-3 w-3 rounded-full border-2 ${selected ? "border-indigo-600 bg-indigo-600" : "border-slate-300"}`} />
    </button>
  );
}

function Preference({ icon: Icon, title, description, checked, onChange }) {
  return (
    <div className="flex items-center justify-between gap-5 py-5">
      <div className="flex items-start gap-3">
        <Icon className="mt-0.5 h-5 w-5 shrink-0 text-slate-400" />
        <div>
          <p className="text-sm font-semibold text-slate-800">{title}</p>
          <p className="mt-0.5 text-sm text-slate-500">{description}</p>
        </div>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={onChange}
        className={`relative h-6 w-11 shrink-0 rounded-full transition ${checked ? "bg-indigo-600" : "bg-slate-300"}`}
      >
        <span className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow-sm transition-all ${checked ? "left-6" : "left-1"}`} />
      </button>
    </div>
  );
}

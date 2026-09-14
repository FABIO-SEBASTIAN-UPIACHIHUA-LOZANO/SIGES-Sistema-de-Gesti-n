import { useContext, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  ShieldCheck,
  Wrench,
} from "lucide-react";

import { AuthContext } from "../context/AuthContext";

/**
 * Convierte los diferentes formatos de error
 * que puede devolver el backend en un mensaje de texto.
 */
function getErrorMessage(error) {
  const detail = error?.response?.data?.detail;

  // Errores de validación de FastAPI / Pydantic
  if (Array.isArray(detail)) {
    const messages = detail
      .map((item) => item?.msg)
      .filter(Boolean);

    if (messages.length > 0) {
      return messages.join(". ");
    }

    return "Los datos ingresados no son válidos.";
  }

  // Error normal enviado como string
  if (typeof detail === "string") {
    return detail;
  }

  // Otros errores
  if (typeof error?.message === "string" && error.message) {
    return error.message;
  }

  return "No fue posible iniciar sesión. Inténtalo nuevamente.";
}

export function Login() {
  const { user, login } = useContext(AuthContext);
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  /**
   * Si ya existe una sesión activa,
   * enviamos al usuario directamente al inicio.
   */
  if (user) {
    return <Navigate to="/" replace />;
  }

  async function handleSubmit(event) {
    event.preventDefault();

    // Evita múltiples envíos mientras se procesa el login
    if (loading) {
      return;
    }

    setError("");
    setLoading(true);

    try {
      await login(email.trim(), password);

      // Login exitoso
      navigate("/", { replace: true });
    } catch (error) {
      setError(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-950">
      <div className="grid min-h-screen lg:grid-cols-2">

        {/* =====================================================
            PANEL DE BRANDING
        ====================================================== */}

        <div className="relative hidden overflow-hidden lg:flex">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-700 via-indigo-900 to-slate-950" />

          <div className="absolute -left-32 -top-32 h-96 w-96 rounded-full bg-indigo-500/20 blur-3xl" />

          <div className="absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-purple-500/20 blur-3xl" />

          <div className="relative z-10 flex flex-col justify-between p-12 xl:p-16">

            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/10 ring-1 ring-white/20">
                <Wrench className="h-5 w-5 text-white" />
              </div>

              <span className="text-xl font-bold text-white">
                SIGES
              </span>
            </div>

            {/* Presentación */}
            <div className="max-w-xl">
              <p className="mb-4 text-sm font-semibold uppercase tracking-[0.25em] text-indigo-300">
                Business Management Platform
              </p>

              <h1 className="text-5xl font-bold leading-tight tracking-tight text-white xl:text-6xl">
                Gestiona tu negocio desde un solo lugar.
              </h1>

              <p className="mt-6 max-w-lg text-lg leading-8 text-indigo-100/70">
                Administra clientes, servicios, equipos, inventario,
                usuarios y operaciones de tu empresa con una plataforma
                centralizada.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <Feature text="Gestión de servicios" />
                <Feature text="Control de inventario" />
                <Feature text="Auditoría" />
              </div>
            </div>

            {/* Copyright */}
            <p className="text-sm text-white/40">
              © 2026 SIGES Business Suite
            </p>
          </div>
        </div>

        {/* =====================================================
            PANEL DE LOGIN
        ====================================================== */}

        <div className="flex items-center justify-center bg-white px-6 py-12">
          <div className="w-full max-w-md">

            {/* Logo móvil */}
            <div className="mb-10 lg:hidden">
              <div className="mb-6 flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-600">
                <Wrench className="h-5 w-5 text-white" />
              </div>

              <h1 className="text-2xl font-bold text-slate-900">
                SIGES
              </h1>
            </div>

            {/* Encabezado */}
            <div>
              <p className="text-sm font-semibold text-indigo-600">
                Bienvenido de nuevo
              </p>

              <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
                Iniciar sesión
              </h2>

              <p className="mt-2 text-sm text-slate-500">
                Ingresa tus credenciales para acceder al sistema.
              </p>
            </div>

            {/* Formulario */}
            <form
              onSubmit={handleSubmit}
              className="mt-8 space-y-5"
              noValidate={false}
            >

              {/* Error */}
              {error && (
                <div
                  role="alert"
                  className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700"
                >
                  {error}
                </div>
              )}

              {/* =================================================
                  EMAIL
              ================================================== */}

              <div>
                <label
                  htmlFor="email"
                  className="mb-2 block text-sm font-medium text-slate-700"
                >
                  Correo electrónico
                </label>

                <div className="relative">
                  <Mail
                    aria-hidden="true"
                    className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                  />

                  <input
                    id="email"
                    name="email"
                    type="email"
                    value={email}
                    onChange={(event) => {
                      setEmail(event.target.value);
                      setError("");
                    }}
                    placeholder="admin@empresa.com"
                    autoComplete="email"
                    required
                    disabled={loading}
                    className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 disabled:cursor-not-allowed disabled:opacity-60"
                  />
                </div>
              </div>

              {/* =================================================
                  PASSWORD
              ================================================== */}

              <div>
                <label
                  htmlFor="password"
                  className="mb-2 block text-sm font-medium text-slate-700"
                >
                  Contraseña
                </label>

                <div className="relative">
                  <LockKeyhole
                    aria-hidden="true"
                    className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                  />

                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(event) => {
                      setPassword(event.target.value);
                      setError("");
                    }}
                    placeholder="••••••••"
                    autoComplete="current-password"
                    required
                    disabled={loading}
                    className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 pl-11 pr-12 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 disabled:cursor-not-allowed disabled:opacity-60"
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword((value) => !value)}
                    disabled={loading}
                    aria-label={
                      showPassword
                        ? "Ocultar contraseña"
                        : "Mostrar contraseña"
                    }
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-slate-600 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* =================================================
                  OPCIONES
              ================================================== */}

              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-sm text-slate-500">
                  <input
                    type="checkbox"
                    disabled={loading}
                    className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 disabled:cursor-not-allowed"
                  />

                  Recordarme
                </label>

                <button
                  type="button"
                  disabled={loading}
                  className="text-sm font-semibold text-indigo-600 transition hover:text-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  ¿Olvidaste tu contraseña?
                </button>
              </div>

              {/* =================================================
                  BOTÓN LOGIN
              ================================================== */}

              <button
                type="submit"
                disabled={loading}
                className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 text-sm font-semibold text-white shadow-lg shadow-indigo-600/20 transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? (
                  <>
                    <span
                      aria-hidden="true"
                      className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white"
                    />

                    Iniciando sesión...
                  </>
                ) : (
                  <>
                    Ingresar al sistema

                    <ArrowRight
                      aria-hidden="true"
                      className="h-4 w-4"
                    />
                  </>
                )}
              </button>
            </form>

            {/* Seguridad */}
            <div className="mt-8 flex items-center justify-center gap-2 text-xs text-slate-400">
              <ShieldCheck className="h-4 w-4" />

              Conexión segura y protegida
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Etiqueta de característica del sistema.
 */
function Feature({ text }) {
  return (
    <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-indigo-100 backdrop-blur">
      {text}
    </span>
  );
}

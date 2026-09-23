import { useContext, useState, useEffect } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  ShieldCheck,
  Wrench,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  QrCode,
  CheckCircle2,
  Building2,
  Cpu
} from "lucide-react";

import { AuthContext } from "../context/AuthContext";

/**
 * Diapositivas para el carrusel interactivo del panel izquierdo
 */
const CAROUSEL_SLIDES = [
  {
    id: 1,
    tag: "Mantenimiento & Equipos",
    title: "Gestión técnica de alta precisión para tu empresa.",
    description:
      "Supervisa el ciclo de vida de cada equipo, historial de mantenimientos y órdenes de servicio con trazabilidad en tiempo real.",
    image:
      "https://images.unsplash.com/photo-1581092160607-ee22621dd758?q=80&w=1200&auto=format&fit=crop",
    features: ["Historial de Equipos", "Órdenes de Trabajo", "Alertas Preventivas"],
  },
  {
    id: 2,
    tag: "Innovación Móvil QR",
    title: "Captura fotos con tu celular sin instalar apps.",
    description:
      "Vincula la cámara de tu smartphone al instante escaneando un código QR dinámico y sube imágenes de equipos directo a la plataforma.",
    image:
      "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?q=80&w=1200&auto=format&fit=crop",
    features: ["Conexión QR Dinámica", "Subida en Tiempo Real", "0 Instalaciones"],
  },
  {
    id: 3,
    tag: "Control Multi-Empresa",
    title: "Auditoría, inventario y gestión centralizada.",
    description:
      "Administra múltiples sucursales, clientes, repuestos y perfiles de acceso garantizando máxima seguridad en tu operación.",
    image:
      "https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=1200&auto=format&fit=crop",
    features: ["Seguridad RBAC", "Registro de Auditoría", "Reportes Ejecutivos"],
  },
];

function getErrorMessage(error) {
  const detail = error?.response?.data?.detail;

  if (Array.isArray(detail)) {
    const messages = detail.map((item) => item?.msg).filter(Boolean);
    return messages.length > 0 ? messages.join(". ") : "Los datos ingresados no son válidos.";
  }

  if (typeof detail === "string") return detail;
  if (typeof error?.message === "string" && error.message) return error.message;

  return "No fue posible iniciar sesión. Inténtalo nuevamente.";
}

export function Login() {
  const { user, login } = useContext(AuthContext);
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Estado del carrusel
  const [currentSlide, setCurrentSlide] = useState(0);

  // Auto-play del carrusel cada 5.5 segundos
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % CAROUSEL_SLIDES.length);
    }, 5500);
    return () => clearInterval(timer);
  }, []);

  if (user) {
    if (String(user.rol).toUpperCase() === "SUPERADMIN") {
      return <Navigate to="/superadmin" replace />;
    }
    return <Navigate to="/" replace />;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (loading) return;

    setError("");
    setLoading(true);

    try {
      const userData = await login(email.trim(), password);
      if (String(userData?.rol).toUpperCase() === "SUPERADMIN") {
        navigate("/superadmin", { replace: true });
      } else {
        navigate("/", { replace: true });
      }
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen w-full bg-slate-950 font-sans selection:bg-indigo-500 selection:text-white">
      <div className="grid min-h-screen lg:grid-cols-12">

        {/* =====================================================
            PANEL IZQUIERDO: CARRUSEL VISUAL ELEGANTE (7 cols)
        ====================================================== */}
        <div className="relative hidden overflow-hidden lg:col-span-7 lg:flex flex-col justify-between p-12 xl:p-16 bg-slate-900">
          
          {/* Imágenes de fondo con transición de opacidad */}
          {CAROUSEL_SLIDES.map((slide, idx) => (
            <div
              key={slide.id}
              className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
                idx === currentSlide ? "opacity-100 z-0" : "opacity-0 -z-10"
              }`}
            >
              <img
                src={slide.image}
                alt={slide.title}
                className="h-full w-full object-cover object-center transform scale-105 transition-transform duration-10000"
              />
              {/* Overlays de gradiente para contraste y estilo */}
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/70 to-slate-950/30" />
              <div className="absolute inset-0 bg-gradient-to-r from-slate-950/90 via-slate-950/50 to-transparent" />
            </div>
          ))}

          {/* Luces ambientales Neón */}
          <div className="absolute -left-20 -top-20 h-80 w-80 rounded-full bg-indigo-600/30 blur-3xl pointer-events-none z-10" />
          <div className="absolute bottom-10 right-10 h-96 w-96 rounded-full bg-purple-600/20 blur-3xl pointer-events-none z-10" />

          {/* Superior: Logo y Tagline de marca */}
          <div className="relative z-20 flex items-center justify-between">
            <div className="flex items-center gap-3.5 rounded-2xl bg-white/10 px-4 py-2.5 backdrop-blur-xl border border-white/15 shadow-2xl">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-700 text-white shadow-lg shadow-indigo-500/30">
                <Wrench className="h-5 w-5" />
              </div>
              <div>
                <span className="text-xl font-bold tracking-tight text-white block leading-none">
                  SisTec
                </span>
                <span className="text-[10px] uppercase font-semibold text-indigo-200 tracking-wider">
                  Enterprise System
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 rounded-full bg-white/10 px-3.5 py-1.5 backdrop-blur-md border border-white/10 text-xs text-indigo-100">
              <Sparkles className="h-3.5 w-3.5 text-indigo-300" />
              <span>v2.4 Pro Edition</span>
            </div>
          </div>

          {/* Inferior: Información del Carrusel & Controles */}
          <div className="relative z-20 mt-auto pt-16">
            <div className="max-w-2xl backdrop-blur-md bg-slate-950/25 p-8 rounded-3xl border border-white/15 shadow-2xl">
              
              {/* Badge del slide */}
              <div className="inline-flex items-center gap-2 rounded-full bg-indigo-500/20 px-3.5 py-1 text-xs font-semibold text-indigo-300 border border-indigo-500/30 mb-4">
                <span className="h-1.5 w-1.5 rounded-full bg-indigo-400 animate-pulse" />
                {CAROUSEL_SLIDES[currentSlide].tag}
              </div>

              {/* Título animado */}
              <h2 className="text-3xl xl:text-4xl font-extrabold text-white leading-snug tracking-tight">
                {CAROUSEL_SLIDES[currentSlide].title}
              </h2>

              {/* Descripción */}
              <p className="mt-3 text-base text-slate-300 leading-relaxed">
                {CAROUSEL_SLIDES[currentSlide].description}
              </p>

              {/* Features Chips */}
              <div className="mt-6 flex flex-wrap gap-2.5">
                {CAROUSEL_SLIDES[currentSlide].features.map((feat, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-white/5 px-3 py-1.5 text-xs font-medium text-slate-200 border border-white/10 backdrop-blur-sm"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5 text-indigo-400" />
                    {feat}
                  </span>
                ))}
              </div>

              {/* Barra de Controles y Navegación del Carrusel */}
              <div className="mt-8 flex items-center justify-between border-t border-white/10 pt-5">
                
                {/* Indicadores / Dots */}
                <div className="flex items-center gap-2">
                  {CAROUSEL_SLIDES.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setCurrentSlide(i)}
                      className={`h-2 rounded-full transition-all duration-500 ${
                        i === currentSlide
                          ? "w-8 bg-indigo-500"
                          : "w-2 bg-white/20 hover:bg-white/40"
                      }`}
                      aria-label={`Ir a diapositiva ${i + 1}`}
                    />
                  ))}
                </div>

                {/* Flechas prev / next */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() =>
                      setCurrentSlide(
                        (prev) => (prev - 1 + CAROUSEL_SLIDES.length) % CAROUSEL_SLIDES.length
                      )
                    }
                    className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 text-white hover:bg-white/20 transition border border-white/10"
                    aria-label="Anterior"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() =>
                      setCurrentSlide((prev) => (prev + 1) % CAROUSEL_SLIDES.length)
                    }
                    className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 text-white hover:bg-white/20 transition border border-white/10"
                    aria-label="Siguiente"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </div>

              </div>

            </div>

            <p className="mt-6 text-xs text-slate-400 text-center lg:text-left">
              © 2026 SisTec Business Suite • Plataforma Centralizada de Servicios
            </p>
          </div>

        </div>

        {/* =====================================================
            PANEL DERECHO: FORMULARIO DE LOGIN ELEGANTE (5 cols)
        ====================================================== */}
        <div className="lg:col-span-5 flex items-center justify-center bg-slate-100/80 p-6 sm:p-10 lg:p-12 relative overflow-hidden">
          
          {/* Luces decorativas de fondo sutiles */}
          <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />
          <div className="absolute -left-20 -bottom-20 h-72 w-72 rounded-full bg-purple-500/10 blur-3xl pointer-events-none" />

          {/* Tarjeta / Cajita del Formulario */}
          <div className="relative z-10 w-full max-w-md rounded-3xl border border-slate-200/90 bg-white p-8 sm:p-10 shadow-2xl shadow-slate-300/40 space-y-8">

            {/* Header móvil */}
            <div className="flex items-center justify-between lg:hidden mb-2">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-md">
                  <Wrench className="h-5 w-5" />
                </div>
                <span className="text-xl font-bold text-slate-900">SisTec</span>
              </div>
              <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full border border-indigo-100">
                v2.4
              </span>
            </div>

            {/* Encabezado Principal */}
            <div>
              <div className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700 border border-indigo-100">
                <Building2 className="h-3.5 w-3.5" />
                Portal de Acceso Corporativo
              </div>
              <h1 className="mt-3 text-3xl font-extrabold text-slate-900 tracking-tight">
                Iniciar sesión
              </h1>
              <p className="mt-1.5 text-sm text-slate-500">
                Ingresa tus credenciales para administrar tus servicios y equipos.
              </p>
            </div>

            {/* Formulario */}
            <form onSubmit={handleSubmit} className="space-y-5" noValidate>

              {/* Mensaje de Error */}
              {error && (
                <div
                  role="alert"
                  className="animate-fade-in flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50/90 p-4 text-sm text-red-800 shadow-sm"
                >
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-red-200 text-red-700 font-bold text-xs">
                    !
                  </span>
                  <div>
                    <p className="font-semibold">Error de autenticación</p>
                    <p className="text-xs text-red-600 mt-0.5">{error}</p>
                  </div>
                </div>
              )}

              {/* Campo Email */}
              <div>
                <label htmlFor="email" className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-2">
                  Correo electrónico
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400 transition" />
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setError("");
                    }}
                    placeholder="ejemplo@sistec.com"
                    required
                    disabled={loading}
                    className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50/70 pl-11 pr-4 text-sm text-slate-900 outline-none shadow-sm transition placeholder:text-slate-400 focus:border-indigo-600 focus:bg-white focus:ring-4 focus:ring-indigo-600/10 disabled:bg-slate-100 disabled:cursor-not-allowed"
                  />
                </div>
              </div>

              {/* Campo Password */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label htmlFor="password" className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                    Contraseña
                  </label>
                  <button
                    type="button"
                    className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition"
                  >
                    ¿Olvidaste tu clave?
                  </button>
                </div>
                <div className="relative">
                  <LockKeyhole className="absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400 transition" />
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setError("");
                    }}
                    placeholder="••••••••••••"
                    required
                    disabled={loading}
                    className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50/70 pl-11 pr-12 text-sm text-slate-900 outline-none shadow-sm transition placeholder:text-slate-400 focus:border-indigo-600 focus:bg-white focus:ring-4 focus:ring-indigo-600/10 disabled:bg-slate-100 disabled:cursor-not-allowed"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={loading}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              {/* Checkbox Recordarme */}
              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-2 text-xs font-medium text-slate-600 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    disabled={loading}
                    className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>Recordar esta sesión</span>
                </label>
              </div>

              {/* Botón Iniciar Sesión */}
              <button
                type="submit"
                disabled={loading}
                className="group relative flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 text-sm font-bold text-white shadow-lg shadow-indigo-600/25 transition-all duration-200 hover:bg-indigo-700 hover:shadow-indigo-600/35 active:scale-[0.99] disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    Autenticando...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    Ingresar al sistema
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </span>
                )}
              </button>

            </form>

            {/* Footer de Seguridad */}
            <div className="pt-4 border-t border-slate-100 text-center space-y-2">
              <div className="inline-flex items-center gap-1.5 text-xs text-slate-400">
                <ShieldCheck className="h-4 w-4 text-emerald-500" />
                <span>Conexión encriptada SSL 256-bit</span>
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}


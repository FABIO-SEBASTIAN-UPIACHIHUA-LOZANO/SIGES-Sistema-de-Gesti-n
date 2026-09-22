import React, { useContext, useEffect, useState } from "react";
import {
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  LockKeyhole,
  Mail,
  RefreshCw,
  Save,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { AuthContext } from "../context/AuthContext";
import api from "../services/api";

const EMPTY_PASSWORD_FORM = {
  current_password: "",
  new_password: "",
  confirm_password: "",
};

function getErrorMessage(error, fallback) {
  const detail = error?.response?.data?.detail;
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail)) {
    return detail.map((item) => item?.msg).filter(Boolean).join(". ") || fallback;
  }
  return fallback;
}

export function Account() {
  const { user, setUser } = useContext(AuthContext);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [profile, setProfile] = useState(user);
  const [emailForm, setEmailForm] = useState({ email: user?.email || "", current_password: "" });
  const [passwordForm, setPasswordForm] = useState(EMPTY_PASSWORD_FORM);
  const [emailStatus, setEmailStatus] = useState({ saving: false, error: "", success: "" });
  const [passwordStatus, setPasswordStatus] = useState({ saving: false, error: "", success: "" });
  const [showPasswords, setShowPasswords] = useState({ current: false, next: false, confirm: false });

  const saveAccount = (account) => {
    setProfile(account);
    setUser(account);
    localStorage.setItem("user", JSON.stringify(account));
  };

  const loadProfile = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await api.get("/auth/me");
      const account = {
        ...user,
        ...response.data,
        rol: response.data?.rol?.nombre || user?.rol,
      };
      saveAccount(account);
      setEmailForm((current) => ({ ...current, email: account.email || "" }));
    } catch (requestError) {
      setError(getErrorMessage(requestError, "No se pudo actualizar la información de la cuenta."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const handleEmailSubmit = async (event) => {
    event.preventDefault();
    setEmailStatus({ saving: false, error: "", success: "" });
    const normalizedEmail = emailForm.email.trim().toLowerCase();

    if (!normalizedEmail || !emailForm.current_password) {
      setEmailStatus({ saving: false, error: "Completa el correo y tu contraseña actual.", success: "" });
      return;
    }

    try {
      setEmailStatus({ saving: true, error: "", success: "" });
      const response = await api.patch("/auth/me/email", {
        email: normalizedEmail,
        current_password: emailForm.current_password,
      });
      const account = {
        ...profile,
        ...response.data,
        rol: response.data?.rol?.nombre || profile?.rol,
      };
      saveAccount(account);
      setEmailForm({ email: account.email, current_password: "" });
      setEmailStatus({ saving: false, error: "", success: "Correo actualizado correctamente." });
    } catch (requestError) {
      setEmailStatus({
        saving: false,
        error: getErrorMessage(requestError, "No se pudo actualizar el correo electrónico."),
        success: "",
      });
    }
  };

  const handlePasswordSubmit = async (event) => {
    event.preventDefault();
    setPasswordStatus({ saving: false, error: "", success: "" });

    if (Object.values(passwordForm).some((value) => !value)) {
      setPasswordStatus({ saving: false, error: "Completa todos los campos de contraseña.", success: "" });
      return;
    }
    if (passwordForm.new_password.length < 8) {
      setPasswordStatus({ saving: false, error: "La nueva contraseña debe tener al menos 8 caracteres.", success: "" });
      return;
    }
    if (passwordForm.new_password !== passwordForm.confirm_password) {
      setPasswordStatus({ saving: false, error: "Las nuevas contraseñas no coinciden.", success: "" });
      return;
    }

    try {
      setPasswordStatus({ saving: true, error: "", success: "" });
      const response = await api.patch("/auth/me/password", passwordForm);
      setPasswordForm(EMPTY_PASSWORD_FORM);
      setShowPasswords({ current: false, next: false, confirm: false });
      setPasswordStatus({
        saving: false,
        error: "",
        success: response.data?.message || "Contraseña actualizada correctamente.",
      });
    } catch (requestError) {
      setPasswordStatus({
        saving: false,
        error: getErrorMessage(requestError, "No se pudo actualizar la contraseña."),
        success: "",
      });
    }
  };

  const name = profile?.nombre || "Usuario";
  const role = String(profile?.rol || "USUARIO").toUpperCase();
  const initials = name.split(" ").slice(0, 2).map((part) => part.charAt(0)).join("").toUpperCase();

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-semibold text-indigo-600">Mi perfil</p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">Cuenta</h1>
        <p className="mt-1 text-sm text-slate-500">Consulta y actualiza los datos de acceso de tu cuenta.</p>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="h-28 bg-gradient-to-r from-indigo-600 to-violet-600" />
        <div className="px-6 pb-7 sm:px-8">
          <div className="-mt-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex items-end gap-4">
              <div className="flex h-20 w-20 items-center justify-center rounded-2xl border-4 border-white bg-indigo-100 text-2xl font-bold text-indigo-700 shadow-sm">{initials}</div>
              <div className="pb-1">
                <h2 className="text-xl font-bold text-slate-900">{name}</h2>
                <p className="text-sm font-semibold text-indigo-600">{role}</p>
              </div>
            </div>

            <button type="button" onClick={loadProfile} disabled={loading} className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60">
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              Actualizar datos
            </button>
          </div>

          {error && <Alert type="error">{error}</Alert>}

          <div className="mt-7 grid gap-4 sm:grid-cols-2">
            <Info icon={UserRound} label="Nombre completo" value={name} />
            <Info icon={Mail} label="Correo electrónico" value={profile?.email || "No disponible"} />
            <Info icon={ShieldCheck} label="Rol de acceso" value={role} />
            <Info icon={ShieldCheck} label="Estado" value={profile?.activo === false ? "Inactivo" : "Activo"} />
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <AccountFormCard icon={Mail} title="Cambiar correo electrónico" description="Este correo se utilizará para iniciar sesión en SIGES.">
          <form onSubmit={handleEmailSubmit} className="space-y-4">
            {emailStatus.error && <Alert type="error">{emailStatus.error}</Alert>}
            {emailStatus.success && <Alert type="success">{emailStatus.success}</Alert>}

            <Field label="Nuevo correo electrónico" htmlFor="account-email">
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  id="account-email"
                  type="email"
                  value={emailForm.email}
                  onChange={(event) => {
                    setEmailForm((current) => ({ ...current, email: event.target.value }));
                    setEmailStatus((current) => ({ ...current, error: "", success: "" }));
                  }}
                  autoComplete="email"
                  required
                  disabled={emailStatus.saving}
                  className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10"
                />
              </div>
            </Field>

            <PasswordField id="email-current-password" label="Contraseña actual" value={emailForm.current_password} onChange={(value) => setEmailForm((current) => ({ ...current, current_password: value }))} autoComplete="current-password" />
            <SubmitButton loading={emailStatus.saving} label="Guardar nuevo correo" />
          </form>
        </AccountFormCard>

        <AccountFormCard icon={KeyRound} title="Cambiar contraseña" description="Usa una contraseña diferente y de al menos 8 caracteres.">
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            {passwordStatus.error && <Alert type="error">{passwordStatus.error}</Alert>}
            {passwordStatus.success && <Alert type="success">{passwordStatus.success}</Alert>}

            <PasswordField id="password-current" label="Contraseña actual" value={passwordForm.current_password} onChange={(value) => setPasswordForm((current) => ({ ...current, current_password: value }))} visible={showPasswords.current} onToggle={() => setShowPasswords((current) => ({ ...current, current: !current.current }))} autoComplete="current-password" />
            <PasswordField id="password-new" label="Nueva contraseña" value={passwordForm.new_password} onChange={(value) => setPasswordForm((current) => ({ ...current, new_password: value }))} visible={showPasswords.next} onToggle={() => setShowPasswords((current) => ({ ...current, next: !current.next }))} autoComplete="new-password" />
            <PasswordField id="password-confirm" label="Confirmar nueva contraseña" value={passwordForm.confirm_password} onChange={(value) => setPasswordForm((current) => ({ ...current, confirm_password: value }))} visible={showPasswords.confirm} onToggle={() => setShowPasswords((current) => ({ ...current, confirm: !current.confirm }))} autoComplete="new-password" />

            <SubmitButton loading={passwordStatus.saving} label="Actualizar contraseña" />
          </form>
        </AccountFormCard>
      </div>
    </div>
  );
}

function Info({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50/70 p-4">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-indigo-600 shadow-sm"><Icon className="h-5 w-5" /></div>
      <div className="min-w-0">
        <p className="text-xs font-medium text-slate-500">{label}</p>
        <p className="truncate text-sm font-semibold text-slate-900">{value}</p>
      </div>
    </div>
  );
}

function AccountFormCard({ icon: Icon, title, description, children }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-5 flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600"><Icon className="h-5 w-5" /></div>
        <div>
          <h2 className="font-semibold text-slate-900">{title}</h2>
          <p className="mt-0.5 text-sm text-slate-500">{description}</p>
        </div>
      </div>
      {children}
    </section>
  );
}

function Field({ label, htmlFor, children }) {
  return (
    <div>
      <label htmlFor={htmlFor} className="mb-1.5 block text-sm font-medium text-slate-700">{label}</label>
      {children}
    </div>
  );
}

function PasswordField({ id, label, value, onChange, visible = false, onToggle, autoComplete }) {
  return (
    <Field label={label} htmlFor={id}>
      <div className="relative">
        <LockKeyhole className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input id={id} type={visible ? "text" : "password"} value={value} onChange={(event) => onChange(event.target.value)} autoComplete={autoComplete} required className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-11 text-sm outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10" />
        {onToggle && (
          <button type="button" onClick={onToggle} aria-label={visible ? `Ocultar ${label.toLowerCase()}` : `Mostrar ${label.toLowerCase()}`} className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-400 hover:text-slate-600">
            {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        )}
      </div>
    </Field>
  );
}

function SubmitButton({ loading, label }) {
  return (
    <button type="submit" disabled={loading} className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto">
      {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
      {loading ? "Guardando..." : label}
    </button>
  );
}

function Alert({ type, children }) {
  const success = type === "success";
  return (
    <div role={success ? "status" : "alert"} className={`mt-4 flex items-start gap-2 rounded-xl px-4 py-3 text-sm ${success ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>
      {success && <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />}
      {children}
    </div>
  );
}

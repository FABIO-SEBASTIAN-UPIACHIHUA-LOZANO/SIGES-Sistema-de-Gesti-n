import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Building2, Plus, Users, ShieldAlert, CheckCircle2, XCircle, Search, Power, Edit3 } from 'lucide-react';

export function Superadmin() {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const [formData, setFormData] = useState({
    nombre: '',
    ruc_documento: '',
    email_contacto: '',
    telefono: '',
    direccion: '',
    limite_usuarios: 10,
    admin_nombre: '',
    admin_email: '',
    admin_password: '',
  });

  const fetchCompanies = async () => {
    try {
      setLoading(true);
      const res = await api.get('/companies/');
      setCompanies(res.data);
    } catch (err) {
      console.error('Error al cargar empresas:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompanies();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCreateCompany = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSubmitting(true);

    try {
      await api.post('/companies/', formData);
      setIsModalOpen(false);
      setFormData({
        nombre: '',
        ruc_documento: '',
        email_contacto: '',
        telefono: '',
        direccion: '',
        limite_usuarios: 10,
        admin_nombre: '',
        admin_email: '',
        admin_password: '',
      });
      fetchCompanies();
    } catch (err) {
      setErrorMsg(err.response?.data?.detail || 'Error al registrar la empresa');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (companyId) => {
    try {
      await api.patch(`/companies/${companyId}/toggle-status`);
      fetchCompanies();
    } catch (err) {
      alert(err.response?.data?.detail || 'Error al cambiar estado de la empresa');
    }
  };

  const filteredCompanies = companies.filter((c) =>
    c.nombre.toLowerCase().includes(search.toLowerCase()) ||
    (c.ruc_documento && c.ruc_documento.includes(search)) ||
    (c.email_contacto && c.email_contacto.toLowerCase().includes(search.toLowerCase()))
  );

  const totalEmpresas = companies.length;
  const empresasActivas = companies.filter((c) => c.activo).length;
  const empresasSuspendidas = totalEmpresas - empresasActivas;
  const totalUsuariosSaaS = companies.reduce((acc, c) => acc + (c.total_usuarios || 0), 0);

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <Building2 className="h-7 w-7 text-indigo-600" />
            Gestión Global de Empresas (SaaS Multi-Tenant)
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Administra las cuentas de empresas cliente, suscripciones y accesos globales de SisTec.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-600/25 transition-all hover:bg-indigo-700"
        >
          <Plus className="h-4 w-4" />
          Registrar Nueva Empresa
        </button>
      </div>

      {/* Tarjetas de Métricas SaaS */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500">Total Empresas</p>
              <p className="text-2xl font-bold text-slate-900">{totalEmpresas}</p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500">Empresas Activas</p>
              <p className="text-2xl font-bold text-slate-900">{empresasActivas}</p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-50 text-rose-600">
              <XCircle className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500">Suspendidas / Inactivas</p>
              <p className="text-2xl font-bold text-slate-900">{empresasSuspendidas}</p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500">Total Usuarios Plataforma</p>
              <p className="text-2xl font-bold text-slate-900">{totalUsuariosSaaS}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Barra de Búsqueda */}
      <div className="relative max-w-md">
        <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          placeholder="Buscar por nombre, RUC o email de contacto..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
        />
      </div>

      {/* Tabla de Empresas */}
      <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
        <table className="w-full text-left text-sm text-slate-600">
          <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500 border-b border-slate-200">
            <tr>
              <th className="px-6 py-4 font-semibold">Empresa / RUC</th>
              <th className="px-6 py-4 font-semibold">Contacto</th>
              <th className="px-6 py-4 font-semibold">Usuarios Activos</th>
              <th className="px-6 py-4 font-semibold">Límite</th>
              <th className="px-6 py-4 font-semibold">Estado</th>
              <th className="px-6 py-4 font-semibold text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan="6" className="py-8 text-center text-slate-400">
                  Cargando empresas cliente...
                </td>
              </tr>
            ) : filteredCompanies.length === 0 ? (
              <tr>
                <td colSpan="6" className="py-8 text-center text-slate-400">
                  No se encontraron empresas registradas.
                </td>
              </tr>
            ) : (
              filteredCompanies.map((comp) => (
                <tr key={comp.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="px-6 py-4 font-medium text-slate-900">
                    <div>{comp.nombre}</div>
                    <div className="text-xs text-slate-400 font-mono">RUC: {comp.ruc_documento || 'N/A'}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div>{comp.email_contacto || 'N/A'}</div>
                    <div className="text-xs text-slate-400">{comp.telefono || 'Sin teléfono'}</div>
                  </td>
                  <td className="px-6 py-4 font-semibold text-slate-700">
                    {comp.total_usuarios || 0} usuarios
                  </td>
                  <td className="px-6 py-4 text-xs font-medium text-slate-500">
                    Máx: {comp.limite_usuarios}
                  </td>
                  <td className="px-6 py-4">
                    {comp.activo ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Activa
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-700">
                        <XCircle className="h-3.5 w-3.5" />
                        Suspendida
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => handleToggleStatus(comp.id)}
                      className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                        comp.activo
                          ? 'bg-rose-50 text-rose-600 hover:bg-rose-100'
                          : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                      }`}
                    >
                      <Power className="h-3.5 w-3.5" />
                      {comp.activo ? 'Suspender' : 'Activar'}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal Registrar Empresa */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="w-full max-w-xl rounded-2xl bg-white p-6 shadow-2xl space-y-5 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Building2 className="h-5 w-5 text-indigo-600" />
                Registrar Nueva Empresa Cliente
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            {errorMsg && (
              <div className="rounded-xl bg-rose-50 p-3 text-xs font-medium text-rose-600 border border-rose-100">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleCreateCompany} className="space-y-4">
              <div className="space-y-3">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">Datos de la Empresa</h3>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Nombre de la Empresa *</label>
                    <input
                      type="text"
                      name="nombre"
                      required
                      value={formData.nombre}
                      onChange={handleInputChange}
                      placeholder="Ej. Comercializadora XYZ S.A.C."
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">RUC / Documento Fiscal</label>
                    <input
                      type="text"
                      name="ruc_documento"
                      value={formData.ruc_documento}
                      onChange={handleInputChange}
                      placeholder="Ej. 20601234567"
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Email Contacto</label>
                    <input
                      type="email"
                      name="email_contacto"
                      value={formData.email_contacto}
                      onChange={handleInputChange}
                      placeholder="contacto@empresa.com"
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Teléfono</label>
                    <input
                      type="text"
                      name="telefono"
                      value={formData.telefono}
                      onChange={handleInputChange}
                      placeholder="999888777"
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Límite Usuarios</label>
                    <input
                      type="number"
                      name="limite_usuarios"
                      min="1"
                      value={formData.limite_usuarios}
                      onChange={handleInputChange}
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-3 pt-3 border-t border-slate-100">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-indigo-600">Usuario Administrador Inicial de la Empresa</h3>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Nombre Completo Admin *</label>
                    <input
                      type="text"
                      name="admin_nombre"
                      required
                      value={formData.admin_nombre}
                      onChange={handleInputChange}
                      placeholder="Ej. Juan Pérez"
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Email del Admin *</label>
                    <input
                      type="email"
                      name="admin_email"
                      required
                      value={formData.admin_email}
                      onChange={handleInputChange}
                      placeholder="admin@empresa.com"
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Contraseña Inicial *</label>
                  <input
                    type="password"
                    name="admin_password"
                    required
                    minLength="6"
                    value={formData.admin_password}
                    onChange={handleInputChange}
                    placeholder="••••••••"
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-xl px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-xl bg-indigo-600 px-5 py-2 text-sm font-semibold text-white shadow-md hover:bg-indigo-700 disabled:opacity-50"
                >
                  {submitting ? 'Registrando...' : 'Crear Empresa & Admin'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}


import React, { useEffect, useMemo, useState } from "react";
import {
  Search,
  Plus,
  Package,
  AlertTriangle,
  Boxes,
  MoreHorizontal,
  X,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";

const EMPTY_FORM = {
  nombre: "",
  categoria: "",
  codigo: "",
  stock: "",
  stock_minimo: "2",
  precio_compra: "",
  precio_venta: "",
};

function StockBadge({ stock, minimum }) {
  if (stock <= 0) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-700">
        <AlertTriangle size={13} />
        Sin stock
      </span>
    );
  }

  if (stock <= minimum) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">
        <AlertTriangle size={13} />
        Stock bajo
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
      <CheckCircle2 size={13} />
      Disponible
    </span>
  );
}

function getErrorMessage(error) {
  const detail = error?.response?.data?.detail;

  if (typeof detail === "string") {
    return detail;
  }

  if (Array.isArray(detail)) {
    return detail
      .map((item) => item?.msg || "Error de validación")
      .join(", ");
  }

  if (error?.response?.status === 401) {
    return "Tu sesión ha expirado. Inicia sesión nuevamente.";
  }

  if (error?.response?.status === 403) {
    return "No tienes permisos para registrar productos.";
  }

  if (error?.response?.status === 400) {
    return "No se pudo registrar el producto. Verifica los datos.";
  }

  return "No se pudo conectar con el servidor.";
}

export function Inventory() {
  const { user } = useAuth();

  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState("");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState("");

  const [menuOpen, setMenuOpen] = useState(null);

  const isAdmin =
    user?.rol === "ADMIN" ||
    user?.role === "ADMIN" ||
    user?.rol?.nombre === "ADMIN";

  const loadProducts = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/products/");

      setProducts(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      console.error("Error cargando productos:", err);
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const filteredProducts = useMemo(() => {
    const value = search.trim().toLowerCase();

    if (!value) {
      return products;
    }

    return products.filter((product) => {
      return (
        product.nombre?.toLowerCase().includes(value) ||
        product.codigo?.toLowerCase().includes(value) ||
        product.categoria?.toLowerCase().includes(value)
      );
    });
  }, [products, search]);

  const lowStock = useMemo(() => {
    return products.filter(
      (product) =>
        Number(product.stock) > 0 &&
        Number(product.stock) <= Number(product.stock_minimo)
    ).length;
  }, [products]);

  const outOfStock = useMemo(() => {
    return products.filter((product) => Number(product.stock) <= 0).length;
  }, [products]);

  const totalUnits = useMemo(() => {
    return products.reduce(
      (total, product) => total + Number(product.stock || 0),
      0
    );
  }, [products]);

  const openModal = () => {
    setForm(EMPTY_FORM);
    setFormError("");
    setModalOpen(true);
  };

  const closeModal = () => {
    if (saving) return;

    setModalOpen(false);
    setFormError("");
    setForm(EMPTY_FORM);
  };

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));

    if (formError) {
      setFormError("");
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!isAdmin) {
      setFormError("Solo un usuario ADMIN puede registrar productos.");
      return;
    }

    const nombre = form.nombre.trim();
    const categoria = form.categoria.trim();
    const codigo = form.codigo.trim();

    const stock = Number(form.stock);
    const stockMinimo = Number(form.stock_minimo);
    const precioCompra = Number(form.precio_compra);
    const precioVenta = Number(form.precio_venta);

    if (!nombre) {
      setFormError("Ingresa el nombre del producto.");
      return;
    }

    if (!categoria) {
      setFormError("Ingresa la categoría del producto.");
      return;
    }

    if (!codigo) {
      setFormError("Ingresa el código del producto.");
      return;
    }

    if (!Number.isInteger(stock) || stock < 0) {
      setFormError("El stock debe ser un número entero mayor o igual a 0.");
      return;
    }

    if (!Number.isInteger(stockMinimo) || stockMinimo < 0) {
      setFormError(
        "El stock mínimo debe ser un número entero mayor o igual a 0."
      );
      return;
    }

    if (!Number.isFinite(precioCompra) || precioCompra < 0) {
      setFormError("Ingresa un precio de compra válido.");
      return;
    }

    if (!Number.isFinite(precioVenta) || precioVenta < 0) {
      setFormError("Ingresa un precio de venta válido.");
      return;
    }

    try {
      setSaving(true);
      setFormError("");

      const payload = {
        nombre,
        categoria,
        codigo,
        stock,
        stock_minimo: stockMinimo,
        precio_compra: precioCompra,
        precio_venta: precioVenta,
      };

      await api.post("/products/", payload);

      setModalOpen(false);
      setForm(EMPTY_FORM);

      await loadProducts();
    } catch (err) {
      console.error("Error registrando producto:", err);
      setFormError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Inventario
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Administra productos y existencias disponibles.
          </p>
        </div>

        {isAdmin && (
          <button
            type="button"
            onClick={openModal}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 active:scale-[0.98]"
          >
            <Plus size={18} />
            Nuevo producto
          </button>
        )}
      </div>

      {/* ERROR GENERAL */}
      {error && (
        <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
          <AlertCircle size={20} className="mt-0.5 shrink-0" />

          <div className="flex-1">
            <p className="font-semibold">No se pudo cargar el inventario</p>
            <p className="mt-1 text-sm">{error}</p>
          </div>

          <button
            type="button"
            onClick={loadProducts}
            className="rounded-lg border border-red-200 bg-white px-3 py-1.5 text-sm font-semibold text-red-700 hover:bg-red-50"
          >
            Reintentar
          </button>
        </div>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">
                Productos
              </p>

              <p className="mt-2 text-2xl font-bold text-slate-900">
                {loading ? "—" : products.length}
              </p>
            </div>

            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
              <Package size={21} />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">
                Unidades disponibles
              </p>

              <p className="mt-2 text-2xl font-bold text-slate-900">
                {loading ? "—" : totalUnits}
              </p>
            </div>

            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
              <Boxes size={21} />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">
                Stock bajo
              </p>

              <p className="mt-2 text-2xl font-bold text-slate-900">
                {loading ? "—" : lowStock}
              </p>
            </div>

            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
              <AlertTriangle size={21} />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">
                Sin stock
              </p>

              <p className="mt-2 text-2xl font-bold text-slate-900">
                {loading ? "—" : outOfStock}
              </p>
            </div>

            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-50 text-red-600">
              <AlertCircle size={21} />
            </div>
          </div>
        </div>
      </div>

      {/* INVENTARIO */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        {/* TOOLBAR */}
        <div className="flex flex-col gap-4 border-b border-slate-200 p-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="font-semibold text-slate-900">
              Productos registrados
            </h2>

            <p className="mt-1 text-xs text-slate-500">
              {loading
                ? "Cargando productos..."
                : `${filteredProducts.length} producto${
                    filteredProducts.length === 1 ? "" : "s"
                  } encontrado${
                    filteredProducts.length === 1 ? "" : "s"
                  }`}
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative w-full sm:w-80">
              <Search
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                type="text"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Buscar producto..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-100"
              />
            </div>
          </div>
        </div>

        {/* LOADING */}
        {loading && (
          <div className="divide-y divide-slate-100">
            {[1, 2, 3, 4].map((item) => (
              <div
                key={item}
                className="flex animate-pulse items-center gap-4 px-6 py-5"
              >
                <div className="h-10 w-10 rounded-xl bg-slate-100" />

                <div className="flex-1 space-y-2">
                  <div className="h-4 w-48 rounded bg-slate-100" />
                  <div className="h-3 w-24 rounded bg-slate-100" />
                </div>

                <div className="hidden h-4 w-20 rounded bg-slate-100 md:block" />
                <div className="hidden h-4 w-16 rounded bg-slate-100 md:block" />
              </div>
            ))}
          </div>
        )}

        {/* DESKTOP TABLE */}
        {!loading && (
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full">
              <thead className="bg-slate-50">
                <tr className="border-b border-slate-200">
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Producto
                  </th>

                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Categoría
                  </th>

                  <th className="px-6 py-4 text-center text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Stock
                  </th>

                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Precio
                  </th>

                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Estado
                  </th>

                  <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Acción
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {filteredProducts.map((product) => (
                  <tr
                    key={product.id}
                    className="transition hover:bg-slate-50/70"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                          <Package size={19} />
                        </div>

                        <div>
                          <p className="font-semibold text-slate-800">
                            {product.nombre}
                          </p>

                          <p className="mt-0.5 text-xs text-slate-500">
                            {product.codigo}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <span className="text-sm text-slate-600">
                        {product.categoria}
                      </span>
                    </td>

                    <td className="px-6 py-4 text-center">
                      <span
                        className={`text-sm font-bold ${
                          Number(product.stock) <=
                          Number(product.stock_minimo)
                            ? "text-red-600"
                            : "text-slate-800"
                        }`}
                      >
                        {product.stock}
                      </span>

                      <span className="ml-1 text-xs text-slate-400">
                        / mín. {product.stock_minimo}
                      </span>
                    </td>

                    <td className="px-6 py-4">
                      <div>
                        <span className="text-sm font-semibold text-slate-700">
                          S/ {Number(product.precio_venta).toFixed(2)}
                        </span>

                        <p className="mt-0.5 text-xs text-slate-400">
                          Compra: S/{" "}
                          {Number(product.precio_compra).toFixed(2)}
                        </p>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <StockBadge
                        stock={Number(product.stock)}
                        minimum={Number(product.stock_minimo)}
                      />
                    </td>

                    <td className="relative px-6 py-4 text-right">
                      <button
                        type="button"
                        onClick={() =>
                          setMenuOpen(
                            menuOpen === product.id ? null : product.id
                          )
                        }
                        className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                      >
                        <MoreHorizontal size={18} />
                      </button>

                      {menuOpen === product.id && (
                        <div className="absolute right-6 top-12 z-20 w-48 rounded-xl border border-slate-200 bg-white p-3 text-left shadow-xl">
                          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                            Producto #{product.id}
                          </p>

                          <p className="mt-2 text-sm text-slate-600">
                            Actualmente no hay operaciones de edición o
                            eliminación disponibles en el backend.
                          </p>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* MOBILE */}
        {!loading && (
          <div className="divide-y divide-slate-100 md:hidden">
            {filteredProducts.map((product) => (
              <div key={product.id} className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                      <Package size={19} />
                    </div>

                    <div>
                      <p className="font-semibold text-slate-800">
                        {product.nombre}
                      </p>

                      <p className="text-xs text-slate-500">
                        {product.codigo}
                      </p>
                    </div>
                  </div>

                  <StockBadge
                    stock={Number(product.stock)}
                    minimum={Number(product.stock_minimo)}
                  />
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-xs text-slate-400">Categoría</p>
                    <p className="mt-1 text-slate-700">
                      {product.categoria}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-slate-400">Stock</p>
                    <p className="mt-1 font-semibold text-slate-700">
                      {product.stock} unidades
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-slate-400">Precio venta</p>
                    <p className="mt-1 font-semibold text-slate-700">
                      S/ {Number(product.precio_venta).toFixed(2)}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-slate-400">Stock mínimo</p>
                    <p className="mt-1 text-slate-700">
                      {product.stock_minimo}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* EMPTY */}
        {!loading && filteredProducts.length === 0 && (
          <div className="p-12 text-center">
            <Package className="mx-auto text-slate-300" size={42} />

            <p className="mt-3 font-medium text-slate-700">
              {search
                ? "No se encontraron productos"
                : "Todavía no hay productos"}
            </p>

            <p className="mt-1 text-sm text-slate-500">
              {search
                ? "Intenta realizar una búsqueda diferente."
                : "Registra tu primer producto para comenzar."}
            </p>

            {!search && isAdmin && (
              <button
                type="button"
                onClick={openModal}
                className="mt-4 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700"
              >
                <Plus size={17} />
                Registrar producto
              </button>
            )}
          </div>
        )}
      </div>

      {/* MODAL */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !saving) {
              closeModal();
            }
          }}
        >
          <div className="w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl">
            {/* MODAL HEADER */}
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  Registrar producto
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Ingresa la información del nuevo producto.
                </p>
              </div>

              <button
                type="button"
                onClick={closeModal}
                disabled={saving}
                className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <X size={20} />
              </button>
            </div>

            {/* FORM */}
            <form onSubmit={handleSubmit}>
              <div className="max-h-[70vh] overflow-y-auto px-6 py-6">
                {formError && (
                  <div className="mb-5 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
                    <AlertCircle size={19} className="mt-0.5 shrink-0" />

                    <p className="text-sm font-medium">{formError}</p>
                  </div>
                )}

                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                  {/* NOMBRE */}
                  <div className="sm:col-span-2">
                    <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                      Nombre del producto
                    </label>

                    <input
                      type="text"
                      name="nombre"
                      value={form.nombre}
                      onChange={handleChange}
                      placeholder="Ej. Memoria RAM DDR4 8GB"
                      disabled={saving}
                      className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 disabled:bg-slate-50"
                    />
                  </div>

                  {/* CATEGORIA */}
                  <div>
                    <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                      Categoría
                    </label>

                    <input
                      type="text"
                      name="categoria"
                      value={form.categoria}
                      onChange={handleChange}
                      placeholder="Ej. Componentes"
                      disabled={saving}
                      className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 disabled:bg-slate-50"
                    />
                  </div>

                  {/* CODIGO */}
                  <div>
                    <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                      Código
                    </label>

                    <input
                      type="text"
                      name="codigo"
                      value={form.codigo}
                      onChange={handleChange}
                      placeholder="Ej. PRD-006"
                      disabled={saving}
                      className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm uppercase outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 disabled:bg-slate-50"
                    />
                  </div>

                  {/* STOCK */}
                  <div>
                    <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                      Stock inicial
                    </label>

                    <input
                      type="number"
                      name="stock"
                      min="0"
                      step="1"
                      value={form.stock}
                      onChange={handleChange}
                      placeholder="0"
                      disabled={saving}
                      className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 disabled:bg-slate-50"
                    />
                  </div>

                  {/* STOCK MINIMO */}
                  <div>
                    <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                      Stock mínimo
                    </label>

                    <input
                      type="number"
                      name="stock_minimo"
                      min="0"
                      step="1"
                      value={form.stock_minimo}
                      onChange={handleChange}
                      placeholder="2"
                      disabled={saving}
                      className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 disabled:bg-slate-50"
                    />
                  </div>

                  {/* PRECIO COMPRA */}
                  <div>
                    <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                      Precio de compra
                    </label>

                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-slate-400">
                        S/
                      </span>

                      <input
                        type="number"
                        name="precio_compra"
                        min="0"
                        step="0.01"
                        value={form.precio_compra}
                        onChange={handleChange}
                        placeholder="0.00"
                        disabled={saving}
                        className="w-full rounded-xl border border-slate-200 py-2.5 pl-10 pr-3.5 text-sm outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 disabled:bg-slate-50"
                      />
                    </div>
                  </div>

                  {/* PRECIO VENTA */}
                  <div>
                    <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                      Precio de venta
                    </label>

                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-slate-400">
                        S/
                      </span>

                      <input
                        type="number"
                        name="precio_venta"
                        min="0"
                        step="0.01"
                        value={form.precio_venta}
                        onChange={handleChange}
                        placeholder="0.00"
                        disabled={saving}
                        className="w-full rounded-xl border border-slate-200 py-2.5 pl-10 pr-3.5 text-sm outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 disabled:bg-slate-50"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* FOOTER */}
              <div className="flex flex-col-reverse gap-3 border-t border-slate-200 bg-slate-50 px-6 py-4 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={saving}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving ? (
                    <>
                      <Loader2 size={17} className="animate-spin" />
                      Registrando...
                    </>
                  ) : (
                    <>
                      <Plus size={17} />
                      Registrar producto
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}


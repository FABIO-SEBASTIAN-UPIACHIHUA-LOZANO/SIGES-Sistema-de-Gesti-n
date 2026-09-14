
import React, { useEffect, useMemo, useState } from "react";
import {
  Search,
  Plus,
  Package,
  AlertTriangle,
  XCircle,
  DollarSign,
  Loader2,
  RefreshCw,
  X,
  MoreHorizontal,
  Boxes,
} from "lucide-react";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";

const emptyForm = {
  nombre: "",
  categoria: "",
  codigo: "",
  stock: "",
  stock_minimo: "2",
  precio_compra: "",
  precio_venta: "",
};

function getErrorMessage(error) {
  const detail = error?.response?.data?.detail;

  if (typeof detail === "string") {
    return detail;
  }

  if (Array.isArray(detail)) {
    return detail
      .map((item) => item?.msg || String(item))
      .join(", ");
  }

  if (detail && typeof detail === "object") {
    return detail.msg || JSON.stringify(detail);
  }

  return (
    error?.response?.data?.message ||
    error?.message ||
    "Ocurrió un error inesperado."
  );
}

function formatCurrency(value) {
  const number = Number(value || 0);

  return new Intl.NumberFormat("es-PE", {
    style: "currency",
    currency: "PEN",
    minimumFractionDigits: 2,
  }).format(number);
}

function getStockStatus(product) {
  const stock = Number(product.stock || 0);
  const minimum = Number(product.stock_minimo || 0);

  if (stock <= 0) {
    return {
      label: "Sin stock",
      className: "bg-red-50 text-red-700",
    };
  }

  if (stock <= minimum) {
    return {
      label: "Stock bajo",
      className: "bg-amber-50 text-amber-700",
    };
  }

  return {
    label: "Stock normal",
    className: "bg-emerald-50 text-emerald-700",
  };
}

export function Products() {
  const { user } = useAuth();

  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState("");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState("");

  const [menuOpen, setMenuOpen] = useState(null);

  const role = String(user?.rol || "").toUpperCase();
  const canCreate = role === "ADMIN";

  const loadProducts = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/products/");

      setProducts(
        Array.isArray(response.data)
          ? response.data
          : []
      );
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
        String(product.nombre || "")
          .toLowerCase()
          .includes(value) ||
        String(product.categoria || "")
          .toLowerCase()
          .includes(value) ||
        String(product.codigo || "")
          .toLowerCase()
          .includes(value)
      );
    });
  }, [products, search]);

  const totalProducts = products.length;

  const lowStockProducts = products.filter((product) => {
    const stock = Number(product.stock || 0);
    const minimum = Number(product.stock_minimo || 0);

    return stock > 0 && stock <= minimum;
  }).length;

  const outOfStockProducts = products.filter(
    (product) => Number(product.stock || 0) <= 0
  ).length;

  const inventoryValue = products.reduce((total, product) => {
    return (
      total +
      Number(product.stock || 0) *
        Number(product.precio_compra || 0)
    );
  }, 0);

  const openModal = () => {
    setForm(emptyForm);
    setFormError("");
    setModalOpen(true);
  };

  const closeModal = () => {
    if (saving) return;

    setModalOpen(false);
    setForm(emptyForm);
    setFormError("");
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

  const validateForm = () => {
    if (!form.nombre.trim()) {
      return "Ingresa el nombre del producto.";
    }

    if (!form.categoria.trim()) {
      return "Ingresa la categoría del producto.";
    }

    if (!form.codigo.trim()) {
      return "Ingresa el código del producto.";
    }

    if (form.stock === "" || Number(form.stock) < 0) {
      return "El stock debe ser un número mayor o igual a 0.";
    }

    if (
      form.stock_minimo === "" ||
      Number(form.stock_minimo) < 0
    ) {
      return "El stock mínimo debe ser un número mayor o igual a 0.";
    }

    if (
      form.precio_compra === "" ||
      Number(form.precio_compra) < 0
    ) {
      return "Ingresa un precio de compra válido.";
    }

    if (
      form.precio_venta === "" ||
      Number(form.precio_venta) < 0
    ) {
      return "Ingresa un precio de venta válido.";
    }

    return "";
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const validationError = validateForm();

    if (validationError) {
      setFormError(validationError);
      return;
    }

    try {
      setSaving(true);
      setFormError("");

      const payload = {
        nombre: form.nombre.trim(),
        categoria: form.categoria.trim(),
        codigo: form.codigo.trim(),
        stock: Number(form.stock),
        stock_minimo: Number(form.stock_minimo),
        precio_compra: Number(form.precio_compra),
        precio_venta: Number(form.precio_venta),
      };

      await api.post("/products/", payload);

      setModalOpen(false);
      setForm(emptyForm);
      setFormError("");

      await loadProducts();
    } catch (err) {
      console.error("Error registrando producto:", err);
      setFormError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="space-y-6"
      onClick={() => {
        if (menuOpen !== null) {
          setMenuOpen(null);
        }
      }}
    >
      {/* HEADER */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Productos
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Gestiona productos, precios y niveles de inventario.
          </p>
        </div>

        {canCreate && (
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              openModal();
            }}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700"
          >
            <Plus size={18} />
            Registrar producto
          </button>
        )}
      </div>

      {/* KPIS */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {/* Total */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">
                Productos activos
              </p>

              <p className="mt-2 text-2xl font-bold text-slate-900">
                {loading ? "—" : totalProducts}
              </p>
            </div>

            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
              <Package size={21} />
            </div>
          </div>
        </div>

        {/* Bajo stock */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">
                Stock bajo
              </p>

              <p className="mt-2 text-2xl font-bold text-slate-900">
                {loading ? "—" : lowStockProducts}
              </p>
            </div>

            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
              <AlertTriangle size={21} />
            </div>
          </div>
        </div>

        {/* Sin stock */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">
                Sin stock
              </p>

              <p className="mt-2 text-2xl font-bold text-slate-900">
                {loading ? "—" : outOfStockProducts}
              </p>
            </div>

            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-50 text-red-600">
              <XCircle size={21} />
            </div>
          </div>
        </div>

        {/* Valor inventario */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">
                Valor de inventario
              </p>

              <p className="mt-2 text-xl font-bold text-slate-900">
                {loading
                  ? "—"
                  : formatCurrency(inventoryValue)}
              </p>
            </div>

            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <DollarSign size={21} />
            </div>
          </div>
        </div>
      </div>

      {/* ERROR */}
      {error && (
        <div className="flex flex-col gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-semibold text-red-800">
              No se pudieron cargar los productos
            </p>

            <p className="mt-1 text-sm text-red-700">
              {error}
            </p>
          </div>

          <button
            type="button"
            onClick={loadProducts}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-200 bg-white px-3 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-100"
          >
            <RefreshCw size={16} />
            Reintentar
          </button>
        </div>
      )}

      {/* TABLA */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        {/* TOOLBAR */}
        <div className="flex flex-col gap-4 border-b border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-semibold text-slate-900">
              Catálogo de productos
            </h2>

            <p className="mt-1 text-xs text-slate-500">
              {loading
                ? "Cargando productos..."
                : `${filteredProducts.length} productos encontrados`}
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
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="Buscar producto o código..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-100"
            />
          </div>
        </div>

        {/* LOADING */}
        {loading && (
          <div className="divide-y divide-slate-100">
            {[1, 2, 3].map((item) => (
              <div
                key={item}
                className="animate-pulse p-6"
              >
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-xl bg-slate-200" />

                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-52 rounded bg-slate-200" />
                    <div className="h-3 w-36 rounded bg-slate-100" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* DESKTOP */}
        {!loading && !error && (
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full">
              <thead className="bg-slate-50">
                <tr className="border-b border-slate-200">
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Producto
                  </th>

                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Código
                  </th>

                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Stock
                  </th>

                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Precios
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
                {filteredProducts.map((product) => {
                  const stockStatus =
                    getStockStatus(product);

                  return (
                    <tr
                      key={product.id}
                      className="transition hover:bg-slate-50/70"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                            <Boxes size={20} />
                          </div>

                          <div>
                            <p className="font-semibold text-slate-800">
                              {product.nombre}
                            </p>

                            <p className="mt-0.5 text-xs text-slate-500">
                              {product.categoria}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
                          {product.codigo}
                        </span>
                      </td>

                      <td className="px-6 py-4">
                        <p className="text-sm font-semibold text-slate-800">
                          {product.stock}
                        </p>

                        <p className="mt-1 text-xs text-slate-500">
                          Mínimo: {product.stock_minimo}
                        </p>
                      </td>

                      <td className="px-6 py-4">
                        <p className="text-sm font-medium text-slate-700">
                          Venta:{" "}
                          {formatCurrency(
                            product.precio_venta
                          )}
                        </p>

                        <p className="mt-1 text-xs text-slate-500">
                          Compra:{" "}
                          {formatCurrency(
                            product.precio_compra
                          )}
                        </p>
                      </td>

                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${stockStatus.className}`}
                        >
                          {stockStatus.label}
                        </span>
                      </td>

                      <td className="relative px-6 py-4 text-right">
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();

                            setMenuOpen(
                              menuOpen === product.id
                                ? null
                                : product.id
                            );
                          }}
                          className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                          title="Opciones"
                        >
                          <MoreHorizontal size={18} />
                        </button>

                        {menuOpen === product.id && (
                          <div
                            onClick={(event) =>
                              event.stopPropagation()
                            }
                            className="absolute right-6 top-12 z-20 w-48 rounded-xl border border-slate-200 bg-white p-3 text-left shadow-xl"
                          >
                            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                              Información
                            </p>

                            <p className="mt-1 text-sm font-medium text-slate-700">
                              Producto #{product.id}
                            </p>

                            <p className="mt-1 text-xs text-slate-500">
                              Registrado el{" "}
                              {new Date(
                                product.created_at
                              ).toLocaleDateString(
                                "es-PE"
                              )}
                            </p>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* MOBILE */}
        {!loading && !error && (
          <div className="divide-y divide-slate-100 md:hidden">
            {filteredProducts.map((product) => {
              const stockStatus =
                getStockStatus(product);

              return (
                <div
                  key={product.id}
                  className="p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                        <Boxes size={20} />
                      </div>

                      <div>
                        <p className="font-semibold text-slate-800">
                          {product.nombre}
                        </p>

                        <p className="text-xs text-slate-500">
                          {product.codigo} ·{" "}
                          {product.categoria}
                        </p>
                      </div>
                    </div>

                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-semibold ${stockStatus.className}`}
                    >
                      {stockStatus.label}
                    </span>
                  </div>

                  <div className="mt-4 space-y-2 text-sm text-slate-500">
                    <p>
                      <span className="font-medium text-slate-700">
                        Stock:
                      </span>{" "}
                      {product.stock}{" "}
                      <span className="text-xs">
                        (mín. {product.stock_minimo})
                      </span>
                    </p>

                    <p>
                      <span className="font-medium text-slate-700">
                        Precio venta:
                      </span>{" "}
                      {formatCurrency(
                        product.precio_venta
                      )}
                    </p>

                    <p>
                      <span className="font-medium text-slate-700">
                        Precio compra:
                      </span>{" "}
                      {formatCurrency(
                        product.precio_compra
                      )}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* EMPTY */}
        {!loading &&
          !error &&
          filteredProducts.length === 0 && (
            <div className="p-12 text-center">
              <Package
                className="mx-auto text-slate-300"
                size={42}
              />

              <p className="mt-3 font-medium text-slate-700">
                {search
                  ? "No se encontraron productos"
                  : "Todavía no hay productos registrados"}
              </p>

              <p className="mt-1 text-sm text-slate-500">
                {search
                  ? "Intenta realizar una búsqueda diferente."
                  : "Registra el primer producto para comenzar."}
              </p>

              {!search && canCreate && (
                <button
                  type="button"
                  onClick={openModal}
                  className="mt-4 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700"
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
            if (
              event.target === event.currentTarget &&
              !saving
            ) {
              closeModal();
            }
          }}
        >
          <div className="w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl">
            {/* HEADER */}
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  Registrar producto
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Registra un producto y define su stock
                  inicial y precios.
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
                  <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {formError}
                  </div>
                )}

                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                  {/* Nombre */}
                  <div className="sm:col-span-2">
                    <label
                      htmlFor="nombre"
                      className="mb-2 block text-sm font-semibold text-slate-700"
                    >
                      Nombre del producto{" "}
                      <span className="text-red-500">
                        *
                      </span>
                    </label>

                    <input
                      id="nombre"
                      name="nombre"
                      type="text"
                      value={form.nombre}
                      onChange={handleChange}
                      disabled={saving}
                      maxLength={150}
                      placeholder="Ej. Disco SSD 500GB Kingston"
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 disabled:bg-slate-50"
                    />
                  </div>

                  {/* Categoría */}
                  <div>
                    <label
                      htmlFor="categoria"
                      className="mb-2 block text-sm font-semibold text-slate-700"
                    >
                      Categoría{" "}
                      <span className="text-red-500">
                        *
                      </span>
                    </label>

                    <input
                      id="categoria"
                      name="categoria"
                      type="text"
                      value={form.categoria}
                      onChange={handleChange}
                      disabled={saving}
                      maxLength={50}
                      placeholder="Ej. Almacenamiento"
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 disabled:bg-slate-50"
                    />
                  </div>

                  {/* Código */}
                  <div>
                    <label
                      htmlFor="codigo"
                      className="mb-2 block text-sm font-semibold text-slate-700"
                    >
                      Código{" "}
                      <span className="text-red-500">
                        *
                      </span>
                    </label>

                    <input
                      id="codigo"
                      name="codigo"
                      type="text"
                      value={form.codigo}
                      onChange={handleChange}
                      disabled={saving}
                      maxLength={50}
                      placeholder="Ej. SSD-500-KING"
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 disabled:bg-slate-50"
                    />

                    <p className="mt-1.5 text-xs text-slate-400">
                      El código debe ser único.
                    </p>
                  </div>

                  {/* Stock */}
                  <div>
                    <label
                      htmlFor="stock"
                      className="mb-2 block text-sm font-semibold text-slate-700"
                    >
                      Stock inicial{" "}
                      <span className="text-red-500">
                        *
                      </span>
                    </label>

                    <input
                      id="stock"
                      name="stock"
                      type="number"
                      min="0"
                      value={form.stock}
                      onChange={handleChange}
                      disabled={saving}
                      placeholder="0"
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 disabled:bg-slate-50"
                    />
                  </div>

                  {/* Stock mínimo */}
                  <div>
                    <label
                      htmlFor="stock_minimo"
                      className="mb-2 block text-sm font-semibold text-slate-700"
                    >
                      Stock mínimo{" "}
                      <span className="text-red-500">
                        *
                      </span>
                    </label>

                    <input
                      id="stock_minimo"
                      name="stock_minimo"
                      type="number"
                      min="0"
                      value={form.stock_minimo}
                      onChange={handleChange}
                      disabled={saving}
                      placeholder="2"
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 disabled:bg-slate-50"
                    />
                  </div>

                  {/* Precio compra */}
                  <div>
                    <label
                      htmlFor="precio_compra"
                      className="mb-2 block text-sm font-semibold text-slate-700"
                    >
                      Precio de compra{" "}
                      <span className="text-red-500">
                        *
                      </span>
                    </label>

                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">
                        S/
                      </span>

                      <input
                        id="precio_compra"
                        name="precio_compra"
                        type="number"
                        min="0"
                        step="0.01"
                        value={form.precio_compra}
                        onChange={handleChange}
                        disabled={saving}
                        placeholder="0.00"
                        className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-sm text-slate-700 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 disabled:bg-slate-50"
                      />
                    </div>
                  </div>

                  {/* Precio venta */}
                  <div>
                    <label
                      htmlFor="precio_venta"
                      className="mb-2 block text-sm font-semibold text-slate-700"
                    >
                      Precio de venta{" "}
                      <span className="text-red-500">
                        *
                      </span>
                    </label>

                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">
                        S/
                      </span>

                      <input
                        id="precio_venta"
                        name="precio_venta"
                        type="number"
                        min="0"
                        step="0.01"
                        value={form.precio_venta}
                        onChange={handleChange}
                        disabled={saving}
                        placeholder="0.00"
                        className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-sm text-slate-700 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 disabled:bg-slate-50"
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
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving && (
                    <Loader2
                      size={17}
                      className="animate-spin"
                    />
                  )}

                  {saving
                    ? "Registrando..."
                    : "Registrar producto"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}


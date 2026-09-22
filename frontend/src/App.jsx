
import React, { useContext, useLayoutEffect } from "react";

import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";

import {
  AuthProvider,
  AuthContext,
} from "./context/AuthContext";

import { Layout } from "./components/Layout";

import { Login } from "./pages/Login";
import { Dashboard } from "./pages/Dashboard";
import { Services } from "./pages/Services";
import { Clients } from "./pages/Clients";
import { Equipment } from "./pages/Equipment";
import { Inventory } from "./pages/Inventory";
import { Users } from "./pages/Users";
import { Audit } from "./pages/Audit";
import { ServiceDetail } from "./pages/ServiceDetail";

import { Payments } from "./pages/Payments";

import { Invoices } from "./pages/Invoices";
import { Account } from "./pages/Account";
import { Settings } from "./pages/Settings";
import { HelpCenter } from "./pages/HelpCenter";
import { applyTheme, readPreferences } from "./utils/preferences";

function ThemeRouteController() {
  const { pathname } = useLocation();
  const { user } = useContext(AuthContext);

  useLayoutEffect(() => {
    // IMPLEMENTACIÓN: el tema elegido pertenece al sistema autenticado.
    // Login y recuperación de contraseña conservan siempre el diseño claro.
    const theme = pathname === "/login" || !user
      ? "light"
      : readPreferences(user).theme;
    applyTheme(theme);
  }, [pathname, user]);

  return null;
}

function getRole(user) {
  return (
    user?.rol ||
    user?.role ||
    user?.rol_nombre ||
    user?.role_name ||
    ""
  )
    .toString()
    .toUpperCase();
}


function ProtectedRoute({ children, roles }) {
  const { user, loading } = useContext(AuthContext);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-indigo-600" />

          <p className="mt-4 text-sm text-slate-500">
            Cargando SIGES...
          </p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (roles) {
    const role = getRole(user);

    if (!roles.includes(role)) {
      return <Navigate to="/" replace />;
    }
  }

  return children;
}


export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <ThemeRouteController />
        <Routes>

          {/* =========================
              LOGIN
          ========================== */}
          <Route
            path="/login"
            element={<Login />}
          />


          {/* =========================
              SISTEMA
          ========================== */}
          <Route
            path="/"
            element={
              <ProtectedRoute
                roles={[
                  "ADMIN",
                  "TECNICO",
                  "VENDEDOR",
                ]}
              >
                <Layout />
              </ProtectedRoute>
            }
          >

            {/* =========================
                DASHBOARD
            ========================== */}
            <Route
              index
              element={<Dashboard />}
            />


            {/* =========================
                SERVICIOS
                ADMIN + TECNICO
            ========================== */}
            <Route
              path="servicios"
              element={
                <ProtectedRoute
                  roles={[
                    "ADMIN",
                    "TECNICO",
                  ]}
                >
                  <Services />
                </ProtectedRoute>
              }
            />

            <Route
              path="servicios/:id"
              element={
                <ProtectedRoute
                  roles={[
                    "ADMIN",
                    "TECNICO",
                  ]}
                >
                  <ServiceDetail />
                </ProtectedRoute>
              }
            />


            {/* =========================
                CLIENTES
                ADMIN + TECNICO + VENDEDOR
            ========================== */}
            <Route
              path="clientes"
              element={
                <ProtectedRoute
                  roles={[
                    "ADMIN",
                    "TECNICO",
                    "VENDEDOR",
                  ]}
                >
                  <Clients />
                </ProtectedRoute>
              }
            />


            {/* =========================
                EQUIPOS
                ADMIN + TECNICO + VENDEDOR
            ========================== */}
            <Route
              path="equipos"
              element={
                <ProtectedRoute
                  roles={[
                    "ADMIN",
                    "TECNICO",
                    "VENDEDOR",
                  ]}
                >
                  <Equipment />
                </ProtectedRoute>
              }
            />


            {/* =========================
                PRODUCTOS / INVENTARIO
                TEMPORAL
            ========================== */}
            <Route
              path="productos"
              element={
                <ProtectedRoute
                  roles={[
                    "ADMIN",
                    "TECNICO",
                    "VENDEDOR",
                  ]}
                >
                  <Inventory />
                </ProtectedRoute>
              }
            />

            {/* =========================
                PAGOS
                ADMIN + VENDEDOR
            ========================== */}
            <Route
              path="pagos"
              element={
                <ProtectedRoute
                  roles={[
                    "ADMIN",
                    "VENDEDOR",
                  ]}
                >
                  <Payments />
                </ProtectedRoute>
              }
            />

            {/* =========================
                COMPROBANTES
                ADMIN + VENDEDOR
            ========================== */}
            <Route
              path="comprobantes"
              element={
                <ProtectedRoute
                  roles={[
                    "ADMIN",
                    "VENDEDOR",
                  ]}
                >
                  <Invoices />
                </ProtectedRoute>
              }
            />



            {/* =========================
                USUARIOS
                SOLO ADMIN
            ========================== */}
            <Route
              path="usuarios"
              element={
                <ProtectedRoute roles={["ADMIN"]}>
                  <Users />
                </ProtectedRoute>
              }
            />


            {/* =========================
                AUDITORÍA
                SOLO ADMIN
            ========================== */}
            <Route
              path="auditoria"
              element={
                <ProtectedRoute roles={["ADMIN"]}>
                  <Audit />
                </ProtectedRoute>
              }
            />

            <Route path="cuenta" element={<Account />} />
            <Route path="configuracion" element={<Settings />} />
            <Route path="ayuda" element={<HelpCenter />} />

          </Route>


          {/* =========================
              RUTA DESCONOCIDA
          ========================== */}
          <Route
            path="*"
            element={
              <Navigate
                to="/"
                replace
              />
            }
          />

        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

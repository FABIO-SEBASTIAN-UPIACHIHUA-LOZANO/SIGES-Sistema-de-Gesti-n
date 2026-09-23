
import React, { useContext } from "react";

import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
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
import { Superadmin } from "./pages/Superadmin";
import { Licenses } from "./pages/Licenses";
import { MobileCameraUpload } from "./pages/MobileCameraUpload";

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
            Cargando SisTec...
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
        <Routes>

          {/* =========================
              LOGIN & CAPTURA MÓVIL
          ========================== */}
          <Route
            path="/login"
            element={<Login />}
          />
          <Route
            path="/captura-movil/:sessionId"
            element={<MobileCameraUpload />}
          />


          {/* =========================
              SISTEMA
          ========================== */}
          <Route
            path="/"
            element={
              <ProtectedRoute
                roles={[
                  "SUPERADMIN",
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
                LICENCIAS DE SOFTWARE
            ========================== */}
            <Route
              path="licencias"
              element={
                <ProtectedRoute
                  roles={[
                    "ADMIN",
                    "TECNICO",
                    "VENDEDOR",
                  ]}
                >
                  <Licenses />
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
                ADMIN + SUPERADMIN
            ========================== */}
            <Route
              path="auditoria"
              element={
                <ProtectedRoute roles={["ADMIN", "SUPERADMIN"]}>
                  <Audit />
                </ProtectedRoute>
              }
            />

            {/* =========================
                SUPERADMIN PLATFORM
                SOLO SUPERADMIN
            ========================== */}
            <Route
              path="superadmin"
              element={
                <ProtectedRoute roles={["SUPERADMIN"]}>
                  <Superadmin />
                </ProtectedRoute>
              }
            />

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


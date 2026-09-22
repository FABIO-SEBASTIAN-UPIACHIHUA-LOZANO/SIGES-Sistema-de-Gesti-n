
// src/context/AuthContext.jsx
import React, {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";
import api from "../services/api";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem("user");
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [loading, setLoading] = useState(false);

  const login = async (email, password) => {
    setLoading(true);

    try {
      const res = await api.post("/auth/login", {
        email,
        password,
      });

      const userData = res.data;

      localStorage.setItem("token", userData.access_token);
      localStorage.setItem("user", JSON.stringify(userData));

      setUser(userData);

      return userData;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
  };

  const hasRole = (...roles) => {
    if (!user?.rol) {
      return false;
    }

    return roles
      .map((role) => role.toUpperCase())
      .includes(String(user.rol).toUpperCase());
  };

  const isAuthenticated = Boolean(
    user && localStorage.getItem("token")
  );

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      setUser(null);
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        setUser,
        login,
        logout,
        loading,
        hasRole,
        isAuthenticated,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// Hook para acceder fácilmente al contexto de autenticación
export const useAuth = () => {
  return useContext(AuthContext);
};


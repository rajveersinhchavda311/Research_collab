import { createContext, useContext, useMemo, useState } from "react";
import api from "./api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem("token") || "");

  const login = async (username, password) => {
    const { data } = await api.post("auth/token/", { username, password });
    localStorage.setItem("token", data.access);
    setToken(data.access);
  };

  const logout = () => {
    localStorage.removeItem("token");
    setToken("");
  };

  const value = useMemo(() => ({ token, login, logout, isAuthed: !!token }), [token]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
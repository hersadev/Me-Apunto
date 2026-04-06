// servicio de autenticacion
// gestiona el registro, login y logout de empresas

import api from "./api";

// registrar una nueva empresa
const registrar = async (datos) => {
  const response = await api.post("/auth/register", datos);
  return response.data;
};

// login de empresa
// guarda el token y los datos de la empresa en localStorage
const login = async (correo, contrasena) => {
  const response = await api.post("/auth/login", { correo, contrasena });
  const { token, empresa } = response.data;

  // guardamos el token y los datos de la empresa en localStorage
  // el interceptor de api.js los usara automaticamente
  localStorage.setItem("token", token);
  localStorage.setItem("empresa", JSON.stringify(empresa));

  return response.data;
};

// logout - limpiamos el localStorage
const logout = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("empresa");
};

// obtener los datos de la empresa logueada del localStorage
const getEmpresa = () => {
  const empresa = localStorage.getItem("empresa");
  return empresa ? JSON.parse(empresa) : null;
};

// comprobar si hay una empresa logueada
const estaLogueado = () => {
  return !!localStorage.getItem("token");
};

// obtener el perfil actualizado del backend
const getPerfil = async () => {
  const response = await api.get("/auth/perfil");
  return response.data;
};

const authService = {
  registrar,
  login,
  logout,
  getEmpresa,
  estaLogueado,
  getPerfil,
};

export default authService;

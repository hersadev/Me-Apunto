import api from "./api";

const registrar = async (datos) => {
  const response = await api.post("/auth/register", datos);
  // guardamos sólo los datos de la empresa (sin token - el token va en cookie httpOnly)
  localStorage.setItem("empresa", JSON.stringify(response.data.empresa));
  return response.data;
};

const login = async (correo, contrasena) => {
  const response = await api.post("/auth/login", { correo, contrasena });
  // el token queda en la cookie httpOnly - sólo guardamos datos no sensibles
  localStorage.setItem("empresa", JSON.stringify(response.data.empresa));
  return response.data;
};

const logout = async () => {
  try {
    await api.post("/auth/logout");
  } finally {
    localStorage.removeItem("empresa");
  }
};

const getEmpresa = () => {
  const empresa = localStorage.getItem("empresa");
  return empresa ? JSON.parse(empresa) : null;
};

const estaLogueado = () => {
  return !!localStorage.getItem("empresa");
};

const getPerfil = async () => {
  const response = await api.get("/auth/perfil");
  return response.data;
};

const solicitarRecuperacion = async (correo) => {
  const response = await api.post("/auth/recuperar", { correo });
  return response.data;
};

const cambiarContrasena = async (token, contrasena) => {
  const response = await api.post(`/auth/reset/${token}`, { contrasena });
  return response.data;
};

const authService = {
  registrar,
  login,
  logout,
  getEmpresa,
  estaLogueado,
  getPerfil,
  solicitarRecuperacion,
  cambiarContrasena,
};

export default authService;

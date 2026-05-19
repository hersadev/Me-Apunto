import api from "./api";

const registrar = async (datos) => {
  const response = await api.post("/auth/register", datos);
  localStorage.setItem("empresa", JSON.stringify(response.data.empresa));
  if (response.data.token) localStorage.setItem("token", response.data.token);
  return response.data;
};

const login = async (correo, contrasena) => {
  const response = await api.post("/auth/login", { correo, contrasena });
  localStorage.setItem("empresa", JSON.stringify(response.data.empresa));
  if (response.data.token) localStorage.setItem("token", response.data.token);
  return response.data;
};

const logout = async () => {
  try {
    await api.post("/auth/logout");
  } finally {
    localStorage.removeItem("empresa");
    localStorage.removeItem("token");
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

const eliminarCuenta = async () => {
  await api.delete("/auth/cuenta");
  localStorage.removeItem("empresa");
  localStorage.removeItem("token");
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
  eliminarCuenta,
};

export default authService;

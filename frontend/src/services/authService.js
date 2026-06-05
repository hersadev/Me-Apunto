import api from "./api";

const registrar = async (datos) => {
  const response = await api.post("/auth/register", datos);
  localStorage.setItem("empresa", JSON.stringify(response.data.empresa));
  return response.data;
};

const login = async (correo, contrasena) => {
  const response = await api.post("/auth/login", { correo, contrasena });
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
  if (!empresa) return null;
  try {
    return JSON.parse(empresa);
  } catch {
    localStorage.removeItem("empresa");
    return null;
  }
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

const actualizarPerfil = async (datos) => {
  const response = await api.put("/auth/perfil", datos);
  localStorage.setItem("empresa", JSON.stringify(response.data.empresa));
  return response.data;
};

const actualizarFotoPerfil = async (file) => {
  const formData = new FormData();
  formData.append("foto", file);
  const response = await api.put("/auth/foto-perfil", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  localStorage.setItem("empresa", JSON.stringify(response.data.empresa));
  return response.data;
};

const confirmarCambioCorreo = async (token) => {
  const response = await api.get(`/auth/confirmar-correo/${token}`);
  return response.data;
};

const eliminarCuenta = async () => {
  await api.delete("/auth/cuenta");
  localStorage.removeItem("empresa");
};

const authService = {
  registrar,
  login,
  logout,
  getEmpresa,
  estaLogueado,
  getPerfil,
  actualizarPerfil,
  actualizarFotoPerfil,
  confirmarCambioCorreo,
  solicitarRecuperacion,
  cambiarContrasena,
  eliminarCuenta,
};

export default authService;

import api from "./api";

const suscribirse = async ({ email, empresaId }) => {
  const response = await api.post("/suscripciones", { email, empresaId });
  return response.data;
};

const suscripcionEmpresaService = { suscribirse };

export default suscripcionEmpresaService;

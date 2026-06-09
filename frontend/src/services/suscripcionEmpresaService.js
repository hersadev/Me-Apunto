import api from "./api";

const suscribirse = async ({ email, empresaId }) => {
  const response = await api.post("/suscripciones", { email, empresaId });
  return response.data;
};

const getSuscriptores = async () => {
  const response = await api.get("/suscripciones/empresa");
  return response.data;
};

const enviarCorreoSuscriptores = async ({ asunto, mensaje, emails }) => {
  const response = await api.post("/suscripciones/empresa/correo", { asunto, mensaje, emails });
  return response.data;
};

const darDeBaja = async (token) => {
  const response = await api.patch(`/suscripciones/baja/${token}`);
  return response.data;
};

const suscripcionEmpresaService = { suscribirse, getSuscriptores, enviarCorreoSuscriptores, darDeBaja };

export default suscripcionEmpresaService;

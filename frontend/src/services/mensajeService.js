import api from "./api";

const enviarMensaje = async ({ de, nombre, empresaId, asunto, cuerpo, eventoId }) => {
  const response = await api.post("/mensajes", { de, nombre, empresaId, asunto, cuerpo, eventoId });
  return response.data;
};

const getMensajes = async () => {
  const response = await api.get("/mensajes");
  return response.data;
};

const marcarLeido = async (id) => {
  const response = await api.patch(`/mensajes/${id}/leer`);
  return response.data;
};

const marcarRespondido = async (id) => {
  const response = await api.patch(`/mensajes/${id}/respondido`);
  return response.data;
};

const eliminarMensaje = async (id) => {
  const response = await api.delete(`/mensajes/${id}`);
  return response.data;
};

const responderMensaje = async (id, respuesta) => {
  const response = await api.post(`/mensajes/${id}/responder`, { respuesta });
  return response.data;
};

export default { enviarMensaje, getMensajes, marcarLeido, marcarRespondido, eliminarMensaje, responderMensaje };

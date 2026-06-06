// servicio de contacto
// gestiona el envio de mensajes del formulario de contacto

import api from "./api";

const enviarMensaje = async (datos) => {
  const response = await api.post("/contacto", datos);
  return response.data;
};

const enviarMensajeEmpresa = async (datos) => {
  const response = await api.post("/contacto/empresa", datos);
  return response.data;
};

const contactoService = {
  enviarMensaje,
  enviarMensajeEmpresa,
};

export default contactoService;

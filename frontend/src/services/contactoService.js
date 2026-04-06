// servicio de contacto
// gestiona el envio de mensajes del formulario de contacto

import api from "./api";

// enviar mensaje de contacto
// ruta publica
const enviarMensaje = async (datos) => {
  const response = await api.post("/contacto", datos);
  return response.data;
};

const contactoService = {
  enviarMensaje,
};

export default contactoService;

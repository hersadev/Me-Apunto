
// servicio de inscripciones
// gestiona las inscripciones de usuarios a eventos

import api from "./api";

// crear una inscripcion a un evento
// ruta publica - no necesita token
const crearInscripcion = async (datos) => {
  const response = await api.post("/inscripciones", datos);
  return response.data;
};

// obtener las inscripciones de un evento
// ruta protegida - solo la empresa propietaria
const getInscripcionesEvento = async (eventoId) => {
  const response = await api.get(`/inscripciones/evento/${eventoId}`);
  return response.data;
};

const inscripcionService = {
  crearInscripcion,
  getInscripcionesEvento,
};

export default inscripcionService;
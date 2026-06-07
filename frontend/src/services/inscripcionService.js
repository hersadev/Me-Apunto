
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

// obtener datos de una inscripcion por token de cancelacion
const getInscripcionPorToken = async (token) => {
  const response = await api.get(`/inscripciones/cancelar/${token}`);
  return response.data;
};

// cancelar una inscripcion por token
const cancelarInscripcion = async (token) => {
  const response = await api.delete(`/inscripciones/cancelar/${token}`);
  return response.data;
};

const inscripcionService = {
  crearInscripcion,
  getInscripcionesEvento,
  getInscripcionPorToken,
  cancelarInscripcion,
};

export default inscripcionService;
import api from "./api";

const getNotificaciones = async () => {
  const response = await api.get("/notificaciones");
  return response.data;
};

const marcarLeida = async (id) => {
  const response = await api.patch(`/notificaciones/${id}/leida`);
  return response.data;
};

const marcarTodasLeidas = async () => {
  const response = await api.patch("/notificaciones/leidas");
  return response.data;
};

export default { getNotificaciones, marcarLeida, marcarTodasLeidas };

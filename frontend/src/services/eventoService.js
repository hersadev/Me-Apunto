
// servicio de eventos
// gestiona todas las peticiones relacionadas con eventos

import api from "./api";

// obtener todos los eventos con filtros y paginacion
// ruta publica - no necesita token
const getEventos = async (params = {}) => {
  const response = await api.get("/eventos", { params });
  return response.data;
};

// obtener un evento por su id
// ruta publica
const getEventoPorId = async (id) => {
  const response = await api.get(`/eventos/${id}`);
  return response.data;
};

// obtener los eventos de la empresa logueada
// ruta protegida - necesita token
const getMisEventos = async () => {
  const response = await api.get("/eventos/empresa/mis-eventos");
  return response.data;
};

// crear un nuevo evento con imagen opcional
// usamos FormData para poder enviar la imagen
// ruta protegida
const crearEvento = async (datos, imagen) => {
  // creamos un FormData para enviar los datos y la imagen juntos
  const formData = new FormData();

  // añadimos todos los campos de texto
  Object.keys(datos).forEach((key) => {
    if (datos[key] !== null && datos[key] !== undefined) {
      formData.append(key, datos[key]);
    }
  });

  // si hay imagen la añadimos al FormData
  if (imagen) {
    formData.append("imagen", imagen);
  }

  const response = await api.post("/eventos", formData, {
    headers: {
      // con FormData no ponemos Content-Type manualmente
      // axios lo detecta automaticamente
      "Content-Type": "multipart/form-data",
    },
  });

  return response.data;
};

// editar un evento existente
// ruta protegida
const editarEvento = async (id, datos, imagen) => {
  const formData = new FormData();

  Object.keys(datos).forEach((key) => {
    if (datos[key] !== null && datos[key] !== undefined) {
      formData.append(key, datos[key]);
    }
  });

  if (imagen) {
    formData.append("imagen", imagen);
  }

  const response = await api.put(`/eventos/${id}`, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  return response.data;
};

// eliminar un evento
// ruta protegida
const eliminarEvento = async (id) => {
  const response = await api.delete(`/eventos/${id}`);
  return response.data;
};

const eventoService = {
  getEventos,
  getEventoPorId,
  getMisEventos,
  crearEvento,
  editarEvento,
  eliminarEvento,
};

export default eventoService;
// controlador de eventos
// gestiona la creacion, edicion, eliminacion y consulta de eventos
// algunas rutas son publicas y otras requieren autenticacion

const { eliminarImagen } = require("../services/cloudinaryService");
const Evento = require("../models/Evento");
const Inscripcion = require("../models/Inscripcion");

// GET /api/eventos
// devuelve todos los eventos activos para la pagina principal
// ruta publica - no requiere token
const obtenerEventos = async (req, res) => {
  try {
    const pagina = Math.max(1, parseInt(req.query.pagina, 10) || 1);
    const limite = Math.min(50, Math.max(1, parseInt(req.query.limite, 10) || 8));
    const saltar = (pagina - 1) * limite;

    const filtro = { activo: true };
    const condicionesFecha = [];

    // filtrar eventos que no hayan pasado todavia
    const ahora = new Date();
    condicionesFecha.push({ fecha: { $gte: ahora } });

    // filtro por fecha
    if (req.query.fecha) {
      const hoy = new Date();

      if (req.query.fecha === "hoy") {
        const manana = new Date(hoy);
        manana.setDate(hoy.getDate() + 1);
        condicionesFecha.push({ fecha: { $gte: ahora, $lt: manana } });

      } else if (req.query.fecha === "semana") {
        const finSemana = new Date(hoy);
        finSemana.setDate(hoy.getDate() + 7);
        condicionesFecha.push({ fecha: { $gte: ahora, $lt: finSemana } });

      } else if (req.query.fecha === "mes") {
        const finMes = new Date(hoy);
        finMes.setMonth(hoy.getMonth() + 1);
        condicionesFecha.push({ fecha: { $gte: ahora, $lt: finMes } });
      }
    }

    if (condicionesFecha.length > 0) {
      filtro.$and = condicionesFecha;
    }

    const CATEGORIAS_VALIDAS = ["taller", "exposicion", "concurso", "concierto", "deporte", "gastronomia", "teatro", "otros"];
    const q = req.cleanQuery || req.query;

    if (q.categoria) {
      if (!CATEGORIAS_VALIDAS.includes(q.categoria)) {
        return res.status(400).json({ mensaje: "Categoría no válida" });
      }
      filtro.categoria = q.categoria;
    }

    if (q.tipo) {
      if (q.tipo === "gratuito") {
        filtro.precio = 0;
      } else if (q.tipo === "de-pago") {
        filtro.precio = { $gt: 0 };
      }
    }

    if (q.patrocinado === "true") {
      filtro.patrocinado = true;
    } else if (q.patrocinado === "false") {
      filtro.patrocinado = false;
    }

    if (q.busqueda) {
      const termino = q.busqueda.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      filtro.$or = [
        { titulo: { $regex: termino, $options: "i" } },
        { venue: { $regex: termino, $options: "i" } },
      ];
    }

    const eventosDocs = await Evento.find(filtro)
      .populate("empresa", "nombre correo")
      .sort({ patrocinado: -1, fechaInicioPatrocinio: 1, fecha: 1 })
      .skip(saltar)
      .limit(limite);

    const total = await Evento.countDocuments(filtro);

    // solo agregamos totalInscritos si algun evento tiene capacidadMaxima
    // para no lanzar una query de agregacion innecesaria en paginas sin aforo
    const hayCapacidad = eventosDocs.some((e) => e.capacidadMaxima !== null);
    const conteosMap = {};
    if (hayCapacidad) {
      const eventoIds = eventosDocs.map((e) => e._id);
      const conteosRaw = await Inscripcion.aggregate([
        { $match: { evento: { $in: eventoIds } } },
        { $group: { _id: "$evento", totalInscritos: { $sum: "$numPersonas" } } },
      ]);
      conteosRaw.forEach(({ _id, totalInscritos }) => {
        conteosMap[_id.toString()] = totalInscritos;
      });
    }
    const eventos = eventosDocs.map((e) => ({
      ...e.toObject(),
      totalInscritos: conteosMap[e._id.toString()] || 0,
    }));

    res.json({
      eventos,
      pagina,
      totalPaginas: Math.ceil(total / limite),
      total,
    });

  } catch (error) {
    console.error("Error al obtener eventos:", error);
    res.status(500).json({ mensaje: "Error interno del servidor" });
  }
};

// GET /api/eventos/:id
// devuelve un evento por su id
// ruta publica
const obtenerEventoPorId = async (req, res) => {
  try {
    const evento = await Evento.findById(req.params.id)
      .populate("empresa", "nombre correo fotoPerfil descripcion");

    if (!evento || !evento.activo) {
      return res.status(404).json({ mensaje: "Evento no encontrado" });
    }

    const conteoRaw = await Inscripcion.aggregate([
      { $match: { evento: evento._id } },
      { $group: { _id: null, total: { $sum: "$numPersonas" } } },
    ]);
    const totalInscritos = conteoRaw[0]?.total || 0;

    res.json({ evento: { ...evento.toObject(), totalInscritos } });

  } catch (error) {
    console.error("Error al obtener evento:", error);
    res.status(500).json({ mensaje: "Error interno del servidor" });
  }
};

// GET /api/eventos/empresa/mis-eventos
// devuelve todos los eventos de la empresa logueada separados por activos y pasados
// ruta protegida
const obtenerEventosEmpresa = async (req, res) => {
  try {
    const ahora = new Date();

    const [eventosActivosDocs, eventosPasadosDocs] = await Promise.all([
      Evento.find({ empresa: req.empresa._id, activo: true, fecha: { $gte: ahora } }).sort({ fecha: 1 }),
      Evento.find({ empresa: req.empresa._id, activo: true, fecha: { $lt: ahora } }).sort({ fecha: -1 }),
    ]);

    const todosIds = [
      ...eventosActivosDocs.map((e) => e._id),
      ...eventosPasadosDocs.map((e) => e._id),
    ];
    const conteosRaw = await Inscripcion.aggregate([
      { $match: { evento: { $in: todosIds } } },
      { $group: { _id: "$evento", totalInscritos: { $sum: "$numPersonas" } } },
    ]);
    const conteosMap = {};
    conteosRaw.forEach(({ _id, totalInscritos }) => {
      conteosMap[_id.toString()] = totalInscritos;
    });

    const eventosActivos = eventosActivosDocs.map((e) => ({
      ...e.toObject(),
      totalInscritos: conteosMap[e._id.toString()] || 0,
    }));
    const eventosPasados = eventosPasadosDocs.map((e) => ({
      ...e.toObject(),
      totalInscritos: conteosMap[e._id.toString()] || 0,
    }));

    res.json({ eventosActivos, eventosPasados });

  } catch (error) {
    console.error("Error al obtener eventos de empresa:", error);
    res.status(500).json({ mensaje: "Error interno del servidor" });
  }
};

// POST /api/eventos
// crea un nuevo evento
// ruta protegida
const crearEvento = async (req, res) => {
  try {
    const {
      titulo,
      descripcion,
      venue,
      direccion,
      fecha,
      hora,
      precio,
      maxPersonasPorInscripcion,
      capacidadMaxima,
      categoria,
    } = req.body;

    if (!req.empresa.descripcion || req.empresa.descripcion.trim() === "") {
      return res.status(403).json({ mensaje: "Debes completar la descripción de tu empresa en el perfil antes de publicar eventos." });
    }

    if (!titulo || !descripcion || !venue || !direccion || !fecha || !hora || !categoria) {
      return res.status(400).json({ mensaje: "Faltan campos obligatorios" });
    }

    const imagenUrl = req.file ? req.file.path : null;

    const evento = await Evento.create({
      titulo,
      descripcion,
      venue,
      direccion,
      fecha,
      hora,
      precio: precio || 0,
      imagen: imagenUrl,
      maxPersonasPorInscripcion: maxPersonasPorInscripcion || null,
      capacidadMaxima: capacidadMaxima || null,
      empresa: req.empresa._id,
      categoria,
    });

    res.status(201).json({
      mensaje: "Evento creado correctamente",
      evento,
    });

  } catch (error) {
    console.error("Error al crear evento:", error);
    res.status(500).json({ mensaje: "Error interno del servidor" });
  }
};

// PUT /api/eventos/:id
// edita un evento existente
// ruta protegida - solo la empresa propietaria puede editar
const editarEvento = async (req, res) => {
  try {
    const evento = await Evento.findById(req.params.id);

    if (!evento || !evento.activo) {
      return res.status(404).json({ mensaje: "Evento no encontrado" });
    }

    if (evento.empresa.toString() !== req.empresa._id.toString()) {
      return res.status(403).json({ mensaje: "No tienes permiso para editar este evento" });
    }

    const {
      titulo,
      descripcion,
      venue,
      direccion,
      fecha,
      hora,
      precio,
      maxPersonasPorInscripcion,
      capacidadMaxima,
      categoria,
    } = req.body;

    if (titulo) evento.titulo = titulo;
    if (descripcion) evento.descripcion = descripcion;
    if (venue) evento.venue = venue;
    if (direccion) evento.direccion = direccion;
    if (fecha) evento.fecha = fecha;
    if (hora) evento.hora = hora;
    if (precio !== undefined) evento.precio = precio;
    if (maxPersonasPorInscripcion !== undefined) {
      evento.maxPersonasPorInscripcion =
        maxPersonasPorInscripcion === "" || maxPersonasPorInscripcion === null
          ? null
          : parseInt(maxPersonasPorInscripcion, 10);
    }
    if (capacidadMaxima !== undefined) {
      evento.capacidadMaxima =
        capacidadMaxima === "" || capacidadMaxima === null
          ? null
          : (Number.isNaN(parseInt(capacidadMaxima, 10)) ? null : parseInt(capacidadMaxima, 10));
    }
    if (categoria !== undefined) {
      if (!categoria) {
        return res.status(400).json({ mensaje: "La categoría es obligatoria" });
      }
      evento.categoria = categoria;
    }

    if (req.file) {
      if (evento.imagen) {
        const publicId = evento.imagen
          .split("/")
          .slice(-2)
          .join("/")
          .split(".")[0];
        await eliminarImagen(publicId);
      }
      evento.imagen = req.file.path;
    }

    await evento.save();

    res.json({
      mensaje: "Evento actualizado correctamente",
      evento,
    });

  } catch (error) {
    console.error("Error al editar evento:", error);
    res.status(500).json({ mensaje: "Error interno del servidor" });
  }
};

// DELETE /api/eventos/:id
// envia el evento a la papelera (soft delete con timestamp)
// el evento se mantendra 30 dias y se podra recuperar antes de eliminarse definitivamente
// ruta protegida - solo la empresa propietaria puede eliminar
const eliminarEvento = async (req, res) => {
  try {
    const evento = await Evento.findById(req.params.id);

    if (!evento || !evento.activo) {
      return res.status(404).json({ mensaje: "Evento no encontrado" });
    }

    if (evento.empresa.toString() !== req.empresa._id.toString()) {
      return res.status(403).json({ mensaje: "No tienes permiso para eliminar este evento" });
    }

    evento.activo = false;
    evento.fechaEliminacion = new Date();
    await evento.save();

    res.json({ mensaje: "Evento enviado a la papelera" });

  } catch (error) {
    console.error("Error al eliminar evento:", error);
    res.status(500).json({ mensaje: "Error interno del servidor" });
  }
};

// GET /api/eventos/empresa/papelera
// devuelve los eventos de la empresa que estan en la papelera
// (eliminados hace menos de 30 dias)
// ruta protegida
const obtenerPapelera = async (req, res) => {
  try {
    const hace30dias = new Date();
    hace30dias.setDate(hace30dias.getDate() - 30);

    const eventos = await Evento.find({
      empresa: req.empresa._id,
      activo: false,
      fechaEliminacion: { $ne: null, $gte: hace30dias },
    }).sort({ fechaEliminacion: -1 });

    res.json({ eventos });

  } catch (error) {
    console.error("Error al obtener papelera:", error);
    res.status(500).json({ mensaje: "Error interno del servidor" });
  }
};

// PUT /api/eventos/:id/restaurar
// restaura un evento de la papelera permitiendo editar sus datos antes de republicar
// ruta protegida - solo la empresa propietaria
const restaurarEvento = async (req, res) => {
  try {
    const evento = await Evento.findById(req.params.id);

    if (!evento) {
      return res.status(404).json({ mensaje: "Evento no encontrado" });
    }

    if (evento.activo) {
      return res.status(400).json({ mensaje: "El evento ya está activo" });
    }

    if (evento.empresa.toString() !== req.empresa._id.toString()) {
      return res.status(403).json({ mensaje: "No tienes permiso para restaurar este evento" });
    }

    // si lleva mas de 30 dias en la papelera no se puede recuperar
    if (evento.fechaEliminacion) {
      const limite = new Date();
      limite.setDate(limite.getDate() - 30);
      if (evento.fechaEliminacion < limite) {
        return res.status(410).json({ mensaje: "El evento ya no se puede recuperar" });
      }
    }

    const {
      titulo,
      descripcion,
      venue,
      direccion,
      fecha,
      hora,
      precio,
      maxPersonasPorInscripcion,
      capacidadMaxima,
      categoria,
    } = req.body;

    if (titulo) evento.titulo = titulo;
    if (descripcion) evento.descripcion = descripcion;
    if (venue) evento.venue = venue;
    if (direccion) evento.direccion = direccion;
    if (fecha) evento.fecha = fecha;
    if (hora) evento.hora = hora;
    if (precio !== undefined) evento.precio = precio;
    if (maxPersonasPorInscripcion !== undefined) {
      evento.maxPersonasPorInscripcion =
        maxPersonasPorInscripcion === "" || maxPersonasPorInscripcion === null
          ? null
          : parseInt(maxPersonasPorInscripcion, 10);
    }
    if (capacidadMaxima !== undefined) {
      evento.capacidadMaxima =
        capacidadMaxima === "" || capacidadMaxima === null
          ? null
          : (Number.isNaN(parseInt(capacidadMaxima, 10)) ? null : parseInt(capacidadMaxima, 10));
    }
    if (categoria !== undefined) {
      if (!categoria) {
        return res.status(400).json({ mensaje: "La categoría es obligatoria" });
      }
      evento.categoria = categoria;
    }

    if (req.file) {
      if (evento.imagen) {
        const publicId = evento.imagen
          .split("/")
          .slice(-2)
          .join("/")
          .split(".")[0];
        await eliminarImagen(publicId);
      }
      evento.imagen = req.file.path;
    }

    evento.activo = true;
    evento.fechaEliminacion = null;
    await evento.save();

    res.json({
      mensaje: "Evento recuperado correctamente",
      evento,
    });

  } catch (error) {
    console.error("Error al restaurar evento:", error);
    res.status(500).json({ mensaje: "Error interno del servidor" });
  }
};

// DELETE /api/eventos/:id/permanente
// elimina definitivamente un evento que esta en la papelera
// ruta protegida - solo la empresa propietaria
const eliminarEventoDefinitivo = async (req, res) => {
  try {
    const evento = await Evento.findById(req.params.id);

    if (!evento) {
      return res.status(404).json({ mensaje: "Evento no encontrado" });
    }

    if (evento.activo) {
      return res.status(400).json({ mensaje: "No se puede eliminar un evento activo. Envíalo primero a la papelera." });
    }

    if (evento.empresa.toString() !== req.empresa._id.toString()) {
      return res.status(403).json({ mensaje: "No tienes permiso para eliminar este evento" });
    }

    if (evento.imagen) {
      try {
        const publicId = evento.imagen
          .split("/")
          .slice(-2)
          .join("/")
          .split(".")[0];
        await eliminarImagen(publicId);
      } catch (errImg) {
        console.error("Error al eliminar imagen de Cloudinary:", errImg);
      }
    }

    await evento.deleteOne();

    res.json({ mensaje: "Evento eliminado definitivamente" });

  } catch (error) {
    console.error("Error al eliminar definitivamente:", error);
    res.status(500).json({ mensaje: "Error interno del servidor" });
  }
};

// PATCH /api/eventos/:id/patrocinio
// activa o desactiva el patrocinio de un evento
// ruta protegida - solo la empresa propietaria puede cambiarlo
const togglePatrocinio = async (req, res) => {
  try {
    const evento = await Evento.findById(req.params.id);

    if (!evento || !evento.activo) {
      return res.status(404).json({ mensaje: "Evento no encontrado" });
    }

    if (evento.empresa.toString() !== req.empresa._id.toString()) {
      return res.status(403).json({ mensaje: "No tienes permiso para modificar este evento" });
    }

    if (!evento.patrocinado) {
      // activar patrocinio
      const ahora = new Date();
      const finPatrocinio = new Date(ahora);
      finPatrocinio.setMonth(finPatrocinio.getMonth() + 1);

      evento.patrocinado = true;
      evento.fechaInicioPatrocinio = ahora;
      evento.fechaFinPatrocinio = finPatrocinio;
      evento.cancelacionPatrocinio = false;
      evento.avisoPrevioEnviado = false;
    } else if (!evento.cancelacionPatrocinio) {
      // cancelar: el evento sigue patrocinado hasta fechaFinPatrocinio, no se renueva
      evento.cancelacionPatrocinio = true;
      evento.avisoPrevioEnviado = false;
    } else {
      // reactivar: volver a renovacion automatica
      evento.cancelacionPatrocinio = false;
      evento.avisoPrevioEnviado = false;
    }

    await evento.save();

    let mensaje;
    if (!evento.patrocinado) mensaje = "Patrocinio desactivado";
    else if (evento.cancelacionPatrocinio) mensaje = "Patrocinio cancelado - activo hasta " + evento.fechaFinPatrocinio.toLocaleDateString("es-ES");
    else mensaje = evento.fechaInicioPatrocinio ? "Patrocinio reactivado" : "Patrocinio activado";

    res.json({ mensaje, evento });

  } catch (error) {
    console.error("Error al cambiar patrocinio:", error);
    res.status(500).json({ mensaje: "Error interno del servidor" });
  }
};

module.exports = {
  obtenerEventos,
  obtenerEventoPorId,
  obtenerEventosEmpresa,
  crearEvento,
  editarEvento,
  eliminarEvento,
  obtenerPapelera,
  restaurarEvento,
  eliminarEventoDefinitivo,
  togglePatrocinio,
};
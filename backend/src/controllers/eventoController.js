// controlador de eventos
// gestiona la creacion, edicion, eliminacion y consulta de eventos
// algunas rutas son publicas y otras requieren autenticacion

const { eliminarImagen } = require("../services/cloudinaryService");
const Evento = require("../models/Evento");

// GET /api/eventos
// devuelve todos los eventos activos para la pagina principal
// ruta publica - no requiere token
const obtenerEventos = async (req, res) => {
  try {
    // parametros de paginacion
    const pagina = parseInt(req.query.pagina) || 1;
    const limite = parseInt(req.query.limite) || 8;
    const saltar = (pagina - 1) * limite;

    // filtros opcionales por categoria, fecha y tipo
    const filtro = { activo: true };

    if (req.query.categoria) {
      filtro.categoria = req.query.categoria;
    }

    if (req.query.tipo) {
      if (req.query.tipo === "gratuito") {
        filtro.precio = 0;
      } else if (req.query.tipo === "de-pago") {
        filtro.precio = { $gt: 0 };
      }
    }

    // buscador por titulo o venue
    if (req.query.busqueda) {
      filtro.$or = [
        { titulo: { $regex: req.query.busqueda, $options: "i" } },
        { venue: { $regex: req.query.busqueda, $options: "i" } },
      ];
    }

    // primero los patrocinados ordenados por fecha de patrocinio
    // luego el resto ordenados por fecha del evento
    const eventos = await Evento.find(filtro)
      .populate("empresa", "nombre correo")
      .sort({ patrocinado: -1, fechaInicioPatrocinio: 1, fecha: 1 })
      .skip(saltar)
      .limit(limite);

    // total de eventos para calcular las paginas
    const total = await Evento.countDocuments(filtro);

    res.json({
      eventos,
      pagina,
      totalPaginas: Math.ceil(total / limite),
      total,
    });

  } catch (error) {
    console.error("Error al obtener eventos:", error);
    res.status(500).json({
      mensaje: "Error interno del servidor"
    });
  }
};

// GET /api/eventos/:id
// devuelve un evento por su id
// ruta publica
const obtenerEventoPorId = async (req, res) => {
  try {
    const evento = await Evento.findById(req.params.id)
      .populate("empresa", "nombre correo");

    if (!evento || !evento.activo) {
      return res.status(404).json({
        mensaje: "Evento no encontrado"
      });
    }

    res.json({ evento });

  } catch (error) {
    console.error("Error al obtener evento:", error);
    res.status(500).json({
      mensaje: "Error interno del servidor"
    });
  }
};

// GET /api/eventos/empresa/mis-eventos
// devuelve todos los eventos de la empresa logueada
// ruta protegida
const obtenerEventosEmpresa = async (req, res) => {
  try {
    const eventos = await Evento.find({
      empresa: req.empresa._id,
      activo: true
    }).sort({ createdAt: -1 });

    res.json({ eventos });

  } catch (error) {
    console.error("Error al obtener eventos de empresa:", error);
    res.status(500).json({
      mensaje: "Error interno del servidor"
    });
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
    } = req.body;

    // comprobamos campos obligatorios
    if (!titulo || !descripcion || !venue || !direccion || !fecha || !hora) {
      return res.status(400).json({
        mensaje: "Faltan campos obligatorios"
      });
    }

    // si se subio una imagen la url viene en req.file
    // si no se subio imagen el campo imagen queda como null
    // y el frontend usara picsum como fallback
    const imagenUrl = req.file ? req.file.path : null;

    // creamos el evento asociado a la empresa logueada
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
      // la empresa es la que esta logueada
      empresa: req.empresa._id,
    });

    res.status(201).json({
      mensaje: "Evento creado correctamente",
      evento,
    });

  } catch (error) {
    console.error("Error al crear evento:", error);
    res.status(500).json({
      mensaje: "Error interno del servidor"
    });
  }
};

// PUT /api/eventos/:id
// edita un evento existente
// ruta protegida - solo la empresa propietaria puede editar
const editarEvento = async (req, res) => {
  try {
    const evento = await Evento.findById(req.params.id);

    if (!evento || !evento.activo) {
      return res.status(404).json({
        mensaje: "Evento no encontrado"
      });
    }

    // comprobamos que el evento pertenece a la empresa logueada
    if (evento.empresa.toString() !== req.empresa._id.toString()) {
      return res.status(403).json({
        mensaje: "No tienes permiso para editar este evento"
      });
    }

    // actualizamos los campos que vengan en el body
    const {
      titulo,
      descripcion,
      venue,
      direccion,
      fecha,
      hora,
      precio,
      maxPersonasPorInscripcion,
    } = req.body;

    if (titulo) evento.titulo = titulo;
    if (descripcion) evento.descripcion = descripcion;
    if (venue) evento.venue = venue;
    if (direccion) evento.direccion = direccion;
    if (fecha) evento.fecha = fecha;
    if (hora) evento.hora = hora;
    if (precio !== undefined) evento.precio = precio;
    if (maxPersonasPorInscripcion !== undefined) {
      evento.maxPersonasPorInscripcion = maxPersonasPorInscripcion;
    }

    // si se subio una nueva imagen actualizamos la url
    // y eliminamos la imagen anterior de cloudinary
    if (req.file) {
      if (evento.imagen) {
        // extraemos el public_id de la url de cloudinary
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
    res.status(500).json({
      mensaje: "Error interno del servidor"
    });
  }
};

// DELETE /api/eventos/:id
// elimina un evento (borrado logico - solo cambia activo a false)
// ruta protegida - solo la empresa propietaria puede eliminar
const eliminarEvento = async (req, res) => {
  try {
    const evento = await Evento.findById(req.params.id);

    if (!evento || !evento.activo) {
      return res.status(404).json({
        mensaje: "Evento no encontrado"
      });
    }

    // comprobamos que el evento pertenece a la empresa logueada
    if (evento.empresa.toString() !== req.empresa._id.toString()) {
      return res.status(403).json({
        mensaje: "No tienes permiso para eliminar este evento"
      });
    }

    // borrado logico - no borramos de la base de datos
    // solo marcamos como inactivo para conservar el historial
    evento.activo = false;
    await evento.save();

    res.json({
      mensaje: "Evento eliminado correctamente"
    });

  } catch (error) {
    console.error("Error al eliminar evento:", error);
    res.status(500).json({
      mensaje: "Error interno del servidor"
    });
  }
};

module.exports = {
  obtenerEventos,
  obtenerEventoPorId,
  obtenerEventosEmpresa,
  crearEvento,
  editarEvento,
  eliminarEvento,
};
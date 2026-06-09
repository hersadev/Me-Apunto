// controlador de eventos
// gestiona la creacion, edicion, eliminacion y consulta de eventos
// algunas rutas son publicas y otras requieren autenticacion

const { eliminarImagen } = require("../services/cloudinaryService");
const Evento = require("../models/Evento");
const Inscripcion = require("../models/Inscripcion");
const Suscripcion = require("../models/Suscripcion");

// GET /api/eventos
// devuelve todos los eventos activos para la pagina principal
// ruta publica - no requiere token
const obtenerEventos = async (req, res) => {
  try {
    // si se pasa rango de fechas para el calendario, el limite puede ser mas alto
    const tieneRango = req.query.fechaInicio && req.query.fechaFin;
    const limiteMax = tieneRango ? 500 : 50;
    const pagina = Math.max(1, parseInt(req.query.pagina, 10) || 1);
    const limite = Math.min(limiteMax, Math.max(1, parseInt(req.query.limite, 10) || 8));
    const saltar = (pagina - 1) * limite;

    const filtro = { activo: true };
    const condicionesFecha = [];

    if (tieneRango) {
      // rango explicito para el calendario: muestra eventos de ese mes completo
      const ini = new Date(req.query.fechaInicio);
      const fin = new Date(req.query.fechaFin);
      if (!isNaN(ini.getTime()) && !isNaN(fin.getTime())) {
        condicionesFecha.push({ fecha: { $gte: ini, $lte: fin } });
      }
    } else {
      // por defecto: solo eventos futuros
      const ahora = new Date();
      condicionesFecha.push({ fecha: { $gte: ahora } });

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
      const termino = q.busqueda.slice(0, 100).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      filtro.$or = [
        { titulo: { $regex: termino, $options: "i" } },
        { venue: { $regex: termino, $options: "i" } },
      ];
    }

    if (q.ciudad) {
      const terminoCiudad = q.ciudad.slice(0, 100).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      filtro.direccion = { $regex: terminoCiudad, $options: "i" };
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
      maxPersonasPorInscripcion: (parseInt(maxPersonasPorInscripcion, 10) > 0) ? parseInt(maxPersonasPorInscripcion, 10) : null,
      capacidadMaxima: (parseInt(capacidadMaxima, 10) > 0) ? parseInt(capacidadMaxima, 10) : null,
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
      const parsedMax = parseInt(maxPersonasPorInscripcion, 10);
      evento.maxPersonasPorInscripcion = parsedMax > 0 ? parsedMax : null;
    }
    if (capacidadMaxima !== undefined) {
      const parsedCap = parseInt(capacidadMaxima, 10);
      evento.capacidadMaxima = parsedCap > 0 ? parsedCap : null;
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
      const parsedMax = parseInt(maxPersonasPorInscripcion, 10);
      evento.maxPersonasPorInscripcion = parsedMax > 0 ? parsedMax : null;
    }
    if (capacidadMaxima !== undefined) {
      const parsedCap = parseInt(capacidadMaxima, 10);
      evento.capacidadMaxima = parsedCap > 0 ? parsedCap : null;
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
    if (evento.cancelacionPatrocinio) mensaje = "Patrocinio cancelado - activo hasta " + evento.fechaFinPatrocinio.toLocaleDateString("es-ES");
    else mensaje = evento.fechaInicioPatrocinio ? "Patrocinio reactivado" : "Patrocinio activado";

    res.json({ mensaje, evento });

  } catch (error) {
    console.error("Error al cambiar patrocinio:", error);
    res.status(500).json({ mensaje: "Error interno del servidor" });
  }
};

// PATCH /api/eventos/:id/vista
// ruta publica - incrementa el contador de vistas del evento
const registrarVista = async (req, res) => {
  try {
    const evento = await Evento.findOne({ _id: req.params.id, activo: true, fechaEliminacion: null });
    if (!evento) return res.status(404).json({ mensaje: "Evento no encontrado" });
    await Evento.updateOne({ _id: evento._id }, { $inc: { vistas: 1 } });
    res.json({ ok: true });
  } catch (error) {
    console.error("Error al registrar vista:", error);
    res.status(500).json({ mensaje: "Error interno del servidor" });
  }
};

// GET /api/eventos/empresa/analiticas
// ruta protegida - devuelve estadisticas agregadas de los eventos de la empresa
// usa la misma logica que obtenerEventosEmpresa:
//   activos = activo:true + fecha >= ahora
//   pasados = activo:true + fecha < ahora
//   papelera (activo:false) excluida completamente
const obtenerAnaliticasEmpresa = async (req, res) => {
  try {
    const empresaId = req.empresa._id;
    const ahora = new Date();

    // solo eventos no eliminados (activo:true excluye papelera)
    const eventos = await Evento.find({ empresa: empresaId, activo: true }).select(
      "titulo fecha vistas capacidadMaxima precio categoria createdAt"
    ).lean();

    const idsEventos = eventos.map((e) => e._id);

    // conteo de inscripciones por evento
    const inscripcionesRaw = await Inscripcion.aggregate([
      { $match: { evento: { $in: idsEventos } } },
      { $group: { _id: "$evento", inscritos: { $sum: "$numPersonas" } } },
    ]);
    const inscripcionesMap = {};
    inscripcionesRaw.forEach(({ _id, inscritos }) => {
      inscripcionesMap[_id.toString()] = inscritos;
    });

    const eventosConStats = eventos.map((e) => ({
      ...e,
      totalInscritos: inscripcionesMap[e._id.toString()] || 0,
    }));

    // misma logica que obtenerEventosEmpresa
    const eventosActivos = eventosConStats.filter((e) => new Date(e.fecha) >= ahora);
    const eventosPasados = eventosConStats.filter((e) => new Date(e.fecha) < ahora);

    const totalVistas = eventosConStats.reduce((acc, e) => acc + (e.vistas || 0), 0);
    const totalInscritos = eventosConStats.reduce((acc, e) => acc + e.totalInscritos, 0);
    const totalEventosPublicados = eventosActivos.length;

    // top 5 eventos por vistas
    const topPorVistas = [...eventosConStats]
      .sort((a, b) => (b.vistas || 0) - (a.vistas || 0))
      .slice(0, 5)
      .map((e) => ({ _id: e._id, titulo: e.titulo, vistas: e.vistas || 0, totalInscritos: e.totalInscritos }));

    // top 5 eventos por inscritos
    const topPorInscritos = [...eventosConStats]
      .sort((a, b) => b.totalInscritos - a.totalInscritos)
      .slice(0, 5)
      .map((e) => ({ _id: e._id, titulo: e.titulo, vistas: e.vistas || 0, totalInscritos: e.totalInscritos }));

    // tasa de conversión por evento (inscritos / vistas)
    const tasaConversion = [...eventosConStats]
      .filter((e) => Number(e.vistas) > 0)
      .map((e) => ({
        _id: e._id,
        titulo: e.titulo,
        vistas: e.vistas,
        inscritos: e.totalInscritos,
        tasa: parseFloat(((e.totalInscritos / Number(e.vistas)) * 100).toFixed(1)),
      }))
      .sort((a, b) => b.tasa - a.tasa)
      .slice(0, 10);

    // tasa de llenado por evento (inscritos / capacidadMaxima)
    const tasaLlenado = [...eventosConStats]
      .filter((e) => e.capacidadMaxima != null && e.capacidadMaxima > 0)
      .map((e) => ({
        _id: e._id,
        titulo: e.titulo,
        inscritos: e.totalInscritos,
        capacidadMaxima: e.capacidadMaxima,
        tasa: parseFloat(Math.min(100, (e.totalInscritos / e.capacidadMaxima) * 100).toFixed(1)),
      }))
      .sort((a, b) => b.tasa - a.tasa);

    // top ciudades por número de inscritos
    const ciudadesRaw = await Inscripcion.aggregate([
      { $match: { evento: { $in: idsEventos } } },
      { $group: { _id: "$ciudad", inscritos: { $sum: "$numPersonas" } } },
      { $sort: { inscritos: -1 } },
      { $limit: 10 },
    ]);
    const topCiudades = ciudadesRaw.map(({ _id, inscritos }) => ({ ciudad: _id, inscritos }));

    // evolución de inscripciones por semana (últimas 8 semanas)
    const haceOchoSemanas = new Date(ahora);
    haceOchoSemanas.setDate(haceOchoSemanas.getDate() - 56);
    const evolucionRaw = await Inscripcion.aggregate([
      { $match: { evento: { $in: idsEventos }, createdAt: { $gte: haceOchoSemanas } } },
      {
        $group: {
          _id: { anio: { $isoWeekYear: "$createdAt" }, semana: { $isoWeek: "$createdAt" } },
          inscritos: { $sum: "$numPersonas" },
        },
      },
      { $sort: { "_id.anio": 1, "_id.semana": 1 } },
    ]);
    const evolucionSemanal = evolucionRaw.map(({ _id, inscritos }) => ({
      semana: `Sem ${_id.semana}`,
      inscritos,
    }));

    // eventos próximos a llenarse (>= 80% y < 100% aforo, solo activos)
    const proximosALlenarse = eventosActivos
      .filter((e) => {
        if (e.capacidadMaxima == null || e.capacidadMaxima === 0) return false;
        const tasa = e.totalInscritos / e.capacidadMaxima;
        return tasa >= 0.8 && tasa < 1;
      })
      .map((e) => ({
        _id: e._id,
        titulo: e.titulo,
        inscritos: e.totalInscritos,
        capacidadMaxima: e.capacidadMaxima,
        fecha: e.fecha,
        tasa: parseFloat(((e.totalInscritos / e.capacidadMaxima) * 100).toFixed(1)),
      }))
      .sort((a, b) => b.tasa - a.tasa);

    // eventos con aforo completo (>= 100%, solo activos)
    const aforoCompleto = eventosActivos
      .filter((e) => e.capacidadMaxima != null && e.capacidadMaxima > 0 && e.totalInscritos >= e.capacidadMaxima)
      .map((e) => ({
        _id: e._id,
        titulo: e.titulo,
        inscritos: e.totalInscritos,
        capacidadMaxima: e.capacidadMaxima,
        fecha: e.fecha,
      }))
      .sort((a, b) => new Date(a.fecha) - new Date(b.fecha));

    // total de suscriptores activos a la empresa
    const totalSuscriptores = await Suscripcion.countDocuments({ empresa: empresaId, activa: true });

    // evolución de suscriptores nuevos por semana (últimas 8 semanas)
    const evolucionSuscriptoresRaw = await Suscripcion.aggregate([
      { $match: { empresa: empresaId, createdAt: { $gte: haceOchoSemanas } } },
      {
        $group: {
          _id: { anio: { $isoWeekYear: "$createdAt" }, semana: { $isoWeek: "$createdAt" } },
          nuevos: { $sum: 1 },
        },
      },
      { $sort: { "_id.anio": 1, "_id.semana": 1 } },
    ]);
    const evolucionSuscriptores = evolucionSuscriptoresRaw.map(({ _id, nuevos }) => ({
      semana: `Sem ${_id.semana}`,
      nuevos,
    }));

    // inscripciones totales por evento (todos, activos + pasados, ordenados por inscritos desc)
    const inscripcionesPorEvento = [...eventosConStats]
      .sort((a, b) => b.totalInscritos - a.totalInscritos)
      .map((e) => ({
        _id: e._id,
        titulo: e.titulo,
        fecha: e.fecha,
        totalInscritos: e.totalInscritos,
        capacidadMaxima: e.capacidadMaxima || null,
        activo: new Date(e.fecha) >= ahora,
      }));

    res.json({
      resumen: {
        totalVistas,
        totalInscritos,
        totalEventosPublicados,
        totalEventosPasados: eventosPasados.length,
        totalSuscriptores,
      },
      topPorVistas,
      topPorInscritos,
      tasaConversion,
      tasaLlenado,
      topCiudades,
      evolucionSemanal,
      proximosALlenarse,
      aforoCompleto,
      eventos: eventosConStats,
      evolucionSuscriptores,
      inscripcionesPorEvento,
    });
  } catch (error) {
    console.error("Error al obtener analíticas:", error);
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
  registrarVista,
  obtenerAnaliticasEmpresa,
};
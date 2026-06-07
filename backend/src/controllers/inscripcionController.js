// controlador de inscripciones
// gestiona las inscripciones de usuarios a eventos
// cuando el evento es de pago se aplica la comision del 5% para Me Apunto
// los datos de inscripcion se envian por correo a la empresa organizadora

const crypto = require("crypto");
const Inscripcion = require("../models/Inscripcion");
const Evento = require("../models/Evento");
const Empresa = require("../models/Empresa");
const { enviarCorreoInscripcion, enviarCorreoConfirmacionUsuario } = require("../services/emailService");

// POST /api/inscripciones
// crea una nueva inscripcion a un evento
// ruta publica - no requiere token porque los usuarios no tienen cuenta
const crearInscripcion = async (req, res) => {
  try {
    const { eventoId, nombre, correo, ciudad } = req.body;
    const numPersonas = parseInt(req.body.numPersonas, 10);

    // comprobamos campos obligatorios
    if (!eventoId || !nombre || !correo || !ciudad) {
      return res.status(400).json({
        mensaje: "Todos los campos son obligatorios"
      });
    }

    if (!Number.isInteger(numPersonas) || numPersonas < 1) {
      return res.status(400).json({ mensaje: "El número de personas debe ser un entero positivo" });
    }

    // buscamos el evento y comprobamos que existe y esta activo
    const evento = await Evento.findById(eventoId)
      .populate("empresa", "nombre correo");

    if (!evento || !evento.activo) {
      return res.status(404).json({
        mensaje: "Evento no encontrado"
      });
    }

    // comprobamos el limite de personas por inscripcion si lo hay
    // null significa sin limite
    if (
      evento.maxPersonasPorInscripcion !== null &&
      numPersonas > evento.maxPersonasPorInscripcion
    ) {
      return res.status(400).json({
        mensaje: `El máximo de personas por inscripción es ${evento.maxPersonasPorInscripcion}`
      });
    }

    // comprobamos la capacidad maxima total del evento si la tiene
    if (evento.capacidadMaxima !== null) {
      const conteoRaw = await Inscripcion.aggregate([
        { $match: { evento: evento._id } },
        { $group: { _id: null, total: { $sum: "$numPersonas" } } },
      ]);
      const actuales = conteoRaw[0]?.total || 0;
      const disponibles = evento.capacidadMaxima - actuales;
      if (disponibles <= 0) {
        return res.status(400).json({ mensaje: "El evento ha alcanzado su capacidad máxima" });
      }
      if (numPersonas > disponibles) {
        return res.status(400).json({
          mensaje: `Solo quedan ${disponibles} plaza${disponibles === 1 ? "" : "s"} disponible${disponibles === 1 ? "" : "s"}`
        });
      }
    }

    // calculamos el importe total y la comision
    const importeTotal = evento.precio * numPersonas;

    // comision del 5% para Me Apunto
    // solo aplica si el evento es de pago
    const comisionMeApunto = importeTotal * 0.05;
    const importeEmpresa = importeTotal * 0.95;

    // si el evento es de pago necesitamos procesar el pago con stripe
    // TODO: integrar stripe payment intent aqui
    // de momento solo gestionamos eventos gratuitos
    if (evento.precio > 0) {
      return res.status(400).json({
        mensaje: "Los pagos de eventos de pago se implementarán próximamente"
      });
    }

    const tokenCancelacion = crypto.randomBytes(32).toString("hex");
    const tokenExpiraEn = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 días

    // creamos la inscripcion en la base de datos
    const inscripcion = await Inscripcion.create({
      evento: eventoId,
      nombre,
      correo,
      ciudad,
      numPersonas,
      // si el evento es gratuito el estado es free
      // si es de pago sera completed cuando el pago se procese
      estadoPago: evento.precio === 0 ? "free" : "pending",
      importePagado: importeTotal,
      tokenCancelacion,
      tokenExpiraEn,
    });

    // re-verificamos la capacidad tras el insert para cubrir la ventana de concurrencia
    // si dos requests pasaron el check al mismo tiempo, el que llegue segundo hace rollback
    if (evento.capacidadMaxima !== null) {
      const recheckRaw = await Inscripcion.aggregate([
        { $match: { evento: evento._id } },
        { $group: { _id: null, total: { $sum: "$numPersonas" } } },
      ]);
      const totalActual = recheckRaw[0]?.total || 0;
      if (totalActual > evento.capacidadMaxima) {
        await inscripcion.deleteOne();
        return res.status(400).json({ mensaje: "El evento ha alcanzado su capacidad máxima. Inténtalo de nuevo." });
      }
    }

    // enviamos correo a la empresa con los datos de la inscripcion
    // si falla el correo no interrumpimos la inscripcion
    try {
      if (evento.empresa && evento.empresa.correo) {
        await enviarCorreoInscripcion({
          correoEmpresa: evento.empresa.correo,
          nombreEmpresa: evento.empresa.nombre,
          nombreEvento: evento.titulo,
          nombreUsuario: nombre,
          correoUsuario: correo,
          ciudad,
          numPersonas,
          importeTotal,
          comisionMeApunto,
          importeEmpresa,
        });
      }
    } catch (errorCorreo) {
      // el correo fallo pero la inscripcion se guardo correctamente
      console.error("Error al enviar correo de inscripcion:", errorCorreo.message);
    }

    // enviamos correo de confirmacion al usuario con el enlace de cancelacion
    // solo para eventos gratuitos - los de pago tienen su propio flujo de cancelacion
    if (evento.precio === 0) try {
      const fechaFormateada = new Date(evento.fecha).toLocaleDateString("es-ES", {
        day: "2-digit", month: "2-digit", year: "numeric"
      });
      await enviarCorreoConfirmacionUsuario({
        correoUsuario: correo,
        nombreUsuario: nombre,
        nombreEvento: evento.titulo,
        nombreEmpresa: evento.empresa?.nombre || "",
        fecha: fechaFormateada,
        hora: evento.hora,
        venue: evento.venue,
        numPersonas,
        tokenCancelacion,
      });
    } catch (errorCorreoUsuario) {
      console.error("Error al enviar correo de confirmacion al usuario:", errorCorreoUsuario.message);
    }

    res.status(201).json({
      mensaje: "Inscripción realizada correctamente",
      inscripcion: {
        id: inscripcion._id,
        evento: evento.titulo,
        nombre,
        correo,
        ciudad,
        numPersonas,
        importeTotal,
        comisionMeApunto,
        importeEmpresa,
      },
    });

  } catch (error) {
    console.error("Error al crear inscripcion:", error);
    res.status(500).json({
      mensaje: "Error interno del servidor"
    });
  }
};

// GET /api/inscripciones/evento/:eventoId
// devuelve todas las inscripciones de un evento
// ruta protegida - solo la empresa propietaria puede verlas
const obtenerInscripcionesEvento = async (req, res) => {
  try {
    // primero comprobamos que el evento pertenece a la empresa logueada
    const evento = await Evento.findById(req.params.eventoId);

    if (!evento) {
      return res.status(404).json({
        mensaje: "Evento no encontrado"
      });
    }

    // verificamos que la empresa logueada es la propietaria del evento
    if (evento.empresa.toString() !== req.empresa._id.toString()) {
      return res.status(403).json({
        mensaje: "No tienes permiso para ver estas inscripciones"
      });
    }

    // obtenemos todas las inscripciones del evento
    const inscripciones = await Inscripcion.find({
      evento: req.params.eventoId
    }).sort({ createdAt: -1 });

    // calculamos el total de personas inscritas
    const totalPersonas = inscripciones.reduce(
      (acc, insc) => acc + insc.numPersonas, 0
    );

    // calculamos el total recaudado y la comision total
    const totalRecaudado = inscripciones.reduce(
      (acc, insc) => acc + insc.importePagado, 0
    );
    const totalComision = totalRecaudado * 0.05;
    const totalEmpresa = totalRecaudado * 0.95;

    res.json({
      inscripciones,
      estadisticas: {
        totalInscripciones: inscripciones.length,
        totalPersonas,
        totalRecaudado,
        comisionMeApunto: totalComision,
        importeEmpresa: totalEmpresa,
      },
    });

  } catch (error) {
    console.error("Error al obtener inscripciones:", error);
    res.status(500).json({
      mensaje: "Error interno del servidor"
    });
  }
};

// GET /api/inscripciones/cancelar/:token
// devuelve los datos de la inscripcion para que el usuario confirme antes de cancelar
// ruta publica - el token actua como autenticacion
const obtenerInscripcionPorToken = async (req, res) => {
  try {
    const inscripcion = await Inscripcion.findOne({ tokenCancelacion: req.params.token })
      .populate("evento", "titulo fecha hora venue");

    if (!inscripcion) {
      return res.status(404).json({ mensaje: "Inscripción no encontrada o ya cancelada" });
    }

    if (inscripcion.tokenExpiraEn && inscripcion.tokenExpiraEn < new Date()) {
      return res.status(410).json({ mensaje: "El enlace de cancelación ha expirado" });
    }

    res.json({
      inscripcion: {
        id: inscripcion._id,
        nombre: inscripcion.nombre,
        numPersonas: inscripcion.numPersonas,
        evento: {
          titulo: inscripcion.evento?.titulo,
          fecha: inscripcion.evento?.fecha,
          hora: inscripcion.evento?.hora,
          venue: inscripcion.evento?.venue,
        },
      },
    });
  } catch (error) {
    console.error("Error al obtener inscripcion por token:", error);
    res.status(500).json({ mensaje: "Error interno del servidor" });
  }
};

// DELETE /api/inscripciones/cancelar/:token
// cancela (elimina) la inscripcion usando el token unico del usuario
// ruta publica - el token actua como autenticacion
const cancelarInscripcion = async (req, res) => {
  try {
    const inscripcion = await Inscripcion.findOne({ tokenCancelacion: req.params.token })
      .populate("evento", "titulo");

    if (!inscripcion) {
      return res.status(404).json({ mensaje: "Inscripción no encontrada o ya cancelada" });
    }

    if (inscripcion.tokenExpiraEn && inscripcion.tokenExpiraEn < new Date()) {
      return res.status(410).json({ mensaje: "El enlace de cancelación ha expirado" });
    }

    await inscripcion.deleteOne();

    res.json({ mensaje: "Inscripción cancelada correctamente" });
  } catch (error) {
    console.error("Error al cancelar inscripcion:", error);
    res.status(500).json({ mensaje: "Error interno del servidor" });
  }
};

module.exports = {
  crearInscripcion,
  obtenerInscripcionesEvento,
  obtenerInscripcionPorToken,
  cancelarInscripcion,
};
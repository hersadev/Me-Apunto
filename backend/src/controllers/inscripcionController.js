// controlador de inscripciones
// gestiona las inscripciones de usuarios a eventos
// cuando el evento es de pago se aplica la comision del 5% para Me Apunto
// los datos de inscripcion se envian por correo a la empresa organizadora

const Inscripcion = require("../models/Inscripcion");
const Evento = require("../models/Evento");
const Empresa = require("../models/Empresa");
const { enviarCorreoInscripcion } = require("../services/emailService");

// POST /api/inscripciones
// crea una nueva inscripcion a un evento
// ruta publica - no requiere token porque los usuarios no tienen cuenta
const crearInscripcion = async (req, res) => {
  try {
    const { eventoId, nombre, correo, ciudad, numPersonas } = req.body;

    // comprobamos campos obligatorios
    if (!eventoId || !nombre || !correo || !ciudad || !numPersonas) {
      return res.status(400).json({
        mensaje: "Todos los campos son obligatorios"
      });
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
    });

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

module.exports = {
  crearInscripcion,
  obtenerInscripcionesEvento,
};
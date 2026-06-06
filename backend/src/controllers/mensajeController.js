const Mensaje = require("../models/Mensaje");
const Empresa = require("../models/Empresa");
const { enviarCorreoRespuestaMensaje } = require("../services/emailService");

// POST /api/mensajes — enviar mensaje a una empresa (público)
const enviarMensaje = async (req, res) => {
  try {
    const { de, nombre, empresaId, asunto, cuerpo, eventoId } = req.body;

    const deTrim = typeof de === "string" ? de.trim() : "";
    const nombreTrim = typeof nombre === "string" ? nombre.trim() : "";
    const asuntoTrim = typeof asunto === "string" ? asunto.trim() : "";
    const cuerpoTrim = typeof cuerpo === "string" ? cuerpo.trim() : "";

    if (!deTrim || !nombreTrim || !empresaId || !asuntoTrim || !cuerpoTrim) {
      return res.status(400).json({ mensaje: "Todos los campos son obligatorios" });
    }

    const empresa = await Empresa.findById(empresaId);
    if (!empresa || !empresa.activa) {
      return res.status(404).json({ mensaje: "Empresa no encontrada" });
    }

    const mensaje = await Mensaje.create({
      de: deTrim.toLowerCase(),
      nombre: nombreTrim,
      empresa: empresaId,
      asunto: asuntoTrim,
      cuerpo: cuerpoTrim,
      evento: eventoId || null,
    });

    res.status(201).json({ mensaje: "Mensaje enviado correctamente", id: mensaje._id });
  } catch (err) {
    console.error("Error al enviar mensaje:", err);
    res.status(500).json({ mensaje: "Error interno del servidor" });
  }
};

// GET /api/mensajes — obtener mensajes de la empresa logueada (protegido)
const getMensajes = async (req, res) => {
  try {
    const mensajes = await Mensaje.find({
      empresa: req.empresa._id,
      eliminadoEn: null,
    }).populate("evento", "titulo").sort({ createdAt: -1 }).lean();

    res.json({ mensajes });
  } catch (err) {
    console.error("Error al obtener mensajes:", err);
    res.status(500).json({ mensaje: "Error interno del servidor" });
  }
};

// PATCH /api/mensajes/:id/leer — marcar como leído (protegido)
const marcarLeido = async (req, res) => {
  try {
    const result = await Mensaje.updateOne(
      { _id: req.params.id, empresa: req.empresa._id, eliminadoEn: null },
      { $set: { leido: true } }
    );
    if (result.matchedCount === 0) return res.status(404).json({ mensaje: "Mensaje no encontrado" });
    res.json({ mensaje: "Marcado como leído" });
  } catch (err) {
    res.status(500).json({ mensaje: "Error interno del servidor" });
  }
};

// PATCH /api/mensajes/:id/respondido — marcar como respondido (protegido)
const marcarRespondido = async (req, res) => {
  try {
    const mensaje = await Mensaje.findOne({ _id: req.params.id, empresa: req.empresa._id, eliminadoEn: null }).lean();
    if (!mensaje) return res.status(404).json({ mensaje: "Mensaje no encontrado" });

    const nuevoEstado = !mensaje.respondido;
    await Mensaje.updateOne(
      { _id: mensaje._id },
      { $set: { respondido: nuevoEstado, leido: nuevoEstado ? true : mensaje.leido } }
    );

    res.json({ mensaje: nuevoEstado ? "Marcado como respondido" : "Marcado como no respondido" });
  } catch (err) {
    res.status(500).json({ mensaje: "Error interno del servidor" });
  }
};

// DELETE /api/mensajes/:id — eliminar mensaje (soft delete, protegido)
const eliminarMensaje = async (req, res) => {
  try {
    const result = await Mensaje.updateOne(
      { _id: req.params.id, empresa: req.empresa._id, eliminadoEn: null },
      { $set: { eliminadoEn: new Date() } }
    );
    if (result.matchedCount === 0) return res.status(404).json({ mensaje: "Mensaje no encontrado" });
    res.json({ mensaje: "Mensaje eliminado" });
  } catch (err) {
    res.status(500).json({ mensaje: "Error interno del servidor" });
  }
};

// POST /api/mensajes/:id/responder — enviar respuesta por email (protegido)
const responderMensaje = async (req, res) => {
  try {
    const { respuesta } = req.body;
    if (!respuesta?.trim()) {
      return res.status(400).json({ mensaje: "La respuesta no puede estar vacía" });
    }

    const mensaje = await Mensaje.findOne({ _id: req.params.id, empresa: req.empresa._id, eliminadoEn: null });
    if (!mensaje) return res.status(404).json({ mensaje: "Mensaje no encontrado" });

    await enviarCorreoRespuestaMensaje({
      emailDestinatario: mensaje.de,
      nombreDestinatario: mensaje.nombre,
      nombreEmpresa: req.empresa.nombre,
      asuntoOriginal: mensaje.asunto,
      respuesta: respuesta.trim(),
    });

    await Mensaje.updateOne(
      { _id: mensaje._id },
      { $set: { respondido: true, leido: true } }
    );

    res.json({ mensaje: "Respuesta enviada correctamente" });
  } catch (err) {
    console.error("Error al responder mensaje:", err);
    res.status(500).json({ mensaje: "Error interno del servidor" });
  }
};

module.exports = { enviarMensaje, getMensajes, marcarLeido, marcarRespondido, eliminarMensaje, responderMensaje };

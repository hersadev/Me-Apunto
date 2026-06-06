const Suscripcion = require("../models/Suscripcion");
const Empresa = require("../models/Empresa");
const { enviarCorreoConfirmacionSuscripcion } = require("../services/emailService");

// POST /api/suscripciones
const suscribirse = async (req, res) => {
  try {
    const { email, empresaId } = req.body;

    if (!email || !empresaId) {
      return res.status(400).json({ mensaje: "El correo y la empresa son obligatorios" });
    }

    const empresa = await Empresa.findById(empresaId).select("nombre activa");
    if (!empresa || !empresa.activa) {
      return res.status(404).json({ mensaje: "Empresa no encontrada" });
    }

    const existente = await Suscripcion.findOne({ email, empresa: empresaId });

    if (existente) {
      if (existente.activa) {
        return res.status(409).json({ mensaje: "Ya estás suscrito a esta empresa" });
      }
      existente.activa = true;
      await existente.save();
    } else {
      await Suscripcion.create({ email, empresa: empresaId });
    }

    try {
      await enviarCorreoConfirmacionSuscripcion({ email, nombreEmpresa: empresa.nombre });
    } catch (errCorreo) {
      console.error("Error al enviar confirmación de suscripción:", errCorreo.message);
    }

    res.status(201).json({ mensaje: "Suscripción confirmada correctamente" });

  } catch (error) {
    console.error("Error al suscribirse:", error);
    res.status(500).json({ mensaje: "Error interno del servidor" });
  }
};

module.exports = { suscribirse };

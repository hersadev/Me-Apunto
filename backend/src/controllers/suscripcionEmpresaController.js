const crypto = require("crypto");
const { body, validationResult } = require("express-validator");
const Suscripcion = require("../models/Suscripcion");
const Empresa = require("../models/Empresa");
const Notificacion = require("../models/Notificacion");
const { enviarCorreoConfirmacionSuscripcion, enviarCorreoPersonalizadoSuscriptor } = require("../services/emailService");

const generarTokenBaja = () => crypto.randomBytes(32).toString("hex");

// POST /api/suscripciones
const suscribirse = async (req, res) => {
  try {
    const errores = validationResult(req);
    if (!errores.isEmpty()) {
      return res.status(400).json({ mensaje: errores.array()[0].msg });
    }

    const { email, empresaId } = req.body;

    if (!email || !empresaId) {
      return res.status(400).json({ mensaje: "El correo y la empresa son obligatorios" });
    }

    const empresa = await Empresa.findById(empresaId).select("nombre activa");
    if (!empresa || !empresa.activa) {
      return res.status(404).json({ mensaje: "Empresa no encontrada" });
    }

    const existente = await Suscripcion.findOne({ email, empresa: empresaId });

    let tokenBaja;
    if (existente) {
      if (existente.activa) {
        return res.status(409).json({ mensaje: "Ya estás suscrito a esta empresa" });
      }
      tokenBaja = generarTokenBaja();
      existente.activa = true;
      existente.tokenBaja = tokenBaja;
      await existente.save();
    } else {
      tokenBaja = generarTokenBaja();
      await Suscripcion.create({ email, empresa: empresaId, tokenBaja });
    }

    try {
      await enviarCorreoConfirmacionSuscripcion({ email, nombreEmpresa: empresa.nombre, tokenBaja });
    } catch (errCorreo) {
      console.error("Error al enviar confirmación de suscripción:", errCorreo.message);
    }

    Notificacion.create({
      empresa: empresaId,
      tipo: "suscripcion",
      datos: { correo: email },
    }).catch((err) => console.error("Error al crear notificación de suscripción:", err.message));

    res.status(201).json({ mensaje: "Suscripción confirmada correctamente" });

  } catch (error) {
    console.error("Error al suscribirse:", error);
    res.status(500).json({ mensaje: "Error interno del servidor" });
  }
};

// GET /api/suscripciones/empresa — lista suscriptores activos de la empresa logueada
const obtenerSuscriptoresEmpresa = async (req, res) => {
  try {
    const empresaId = req.empresa._id;
    const suscriptores = await Suscripcion.find({ empresa: empresaId, activa: true })
      .select("email createdAt")
      .sort({ createdAt: -1 })
      .lean();
    res.json({ suscriptores });
  } catch (error) {
    console.error("Error al obtener suscriptores:", error);
    res.status(500).json({ mensaje: "Error interno del servidor" });
  }
};

// POST /api/suscripciones/empresa/correo — envía email personalizado a suscriptores
const enviarCorreoSuscriptores = async (req, res) => {
  try {
    const empresaId = req.empresa._id;
    const { asunto, mensaje, emails } = req.body;

    if (!asunto?.trim() || !mensaje?.trim()) {
      return res.status(400).json({ mensaje: "El asunto y el mensaje son obligatorios" });
    }
    if (asunto.length > 150 || mensaje.length > 2000) {
      return res.status(400).json({ mensaje: "El asunto no puede superar 150 caracteres ni el mensaje 2000" });
    }

    const empresa = await Empresa.findById(empresaId).select("nombre").lean();
    if (!empresa) {
      return res.status(404).json({ mensaje: "Empresa no encontrada" });
    }

    let destinatarios;
    if (Array.isArray(emails)) {
      if (emails.length === 0) {
        return res.status(400).json({ mensaje: "Selecciona al menos un destinatario" });
      }
      const validos = await Suscripcion.find({
        empresa: empresaId,
        activa: true,
        email: { $in: emails },
      }).select("email tokenBaja").lean();
      destinatarios = validos;
    } else {
      const todos = await Suscripcion.find({ empresa: empresaId, activa: true }).select("email tokenBaja").lean();
      destinatarios = todos;
    }

    if (destinatarios.length === 0) {
      return res.status(400).json({ mensaje: "No hay destinatarios válidos" });
    }

    const resultados = await Promise.allSettled(
      destinatarios.map((suscriptor) =>
        enviarCorreoPersonalizadoSuscriptor({
          email: suscriptor.email,
          nombreEmpresa: empresa.nombre,
          asunto: asunto.trim(),
          mensaje: mensaje.trim(),
          tokenBaja: suscriptor.tokenBaja,
        })
      )
    );

    const enviados = resultados.filter((r) => r.status === "fulfilled").length;
    const fallidos = resultados.length - enviados;
    resultados.forEach((r, i) => {
      if (r.status === "rejected") {
        console.error(`Error al enviar correo a ${destinatarios[i].email}:`, r.reason?.message);
      }
    });

    const msg = fallidos > 0
      ? `Correo enviado a ${enviados} suscriptor${enviados !== 1 ? "es" : ""} (${fallidos} fallaron)`
      : `Correo enviado a ${enviados} suscriptor${enviados !== 1 ? "es" : ""}`;
    res.json({ mensaje: msg });
  } catch (error) {
    console.error("Error al enviar correos a suscriptores:", error);
    res.status(500).json({ mensaje: "Error interno del servidor" });
  }
};

// PATCH /api/suscripciones/baja/:token — da de baja sin autenticación (enlace del email)
const darDeBaja = async (req, res) => {
  try {
    const tokenBaja = req.params.token;
    if (!tokenBaja || tokenBaja.length !== 64 || !/^[0-9a-f]+$/.test(tokenBaja)) {
      return res.status(400).json({ mensaje: "Enlace de baja no válido" });
    }
    const suscripcion = await Suscripcion.findOne({ tokenBaja });
    if (!suscripcion) {
      return res.status(404).json({ mensaje: "Suscripción no encontrada" });
    }
    if (!suscripcion.activa) {
      return res.json({ mensaje: "Ya estabas dado de baja" });
    }
    suscripcion.activa = false;
    await suscripcion.save();
    res.json({ mensaje: "Te has dado de baja correctamente" });
  } catch (error) {
    console.error("Error al dar de baja:", error.message);
    res.status(500).json({ mensaje: "Error interno del servidor" });
  }
};

const validarSuscripcion = [
  body("email").trim().isEmail().withMessage("El correo no es válido")
    .isLength({ max: 200 }).withMessage("El correo no puede superar 200 caracteres"),
];

module.exports = { suscribirse, obtenerSuscriptoresEmpresa, enviarCorreoSuscriptores, darDeBaja, validarSuscripcion };

const { body, validationResult } = require("express-validator");
const { enviarCorreoContacto } = require("../services/emailService");

const validarContacto = [
  body("nombre").trim().notEmpty().withMessage("El nombre es obligatorio")
    .isLength({ max: 100 }).withMessage("El nombre no puede superar 100 caracteres"),
  body("email").trim().notEmpty().withMessage("El email es obligatorio")
    .isEmail().withMessage("El email no es válido")
    .isLength({ max: 200 }).withMessage("El email no puede superar 200 caracteres"),
  body("asunto").trim().notEmpty().withMessage("El asunto es obligatorio")
    .isLength({ max: 200 }).withMessage("El asunto no puede superar 200 caracteres"),
  body("contexto").trim().notEmpty().withMessage("El mensaje es obligatorio")
    .isLength({ max: 2000 }).withMessage("El mensaje no puede superar 2000 caracteres"),
];

const enviarMensajeContacto = async (req, res) => {
  try {
    const errores = validationResult(req);
    if (!errores.isEmpty()) {
      return res.status(400).json({ mensaje: errores.array()[0].msg });
    }

    const { nombre, email, asunto, contexto } = req.body;

    await enviarCorreoContacto({ nombre, email, asunto, contexto });

    res.json({ mensaje: "Mensaje enviado correctamente" });

  } catch (error) {
    console.error("Error al enviar mensaje de contacto:", error.message);
    res.status(500).json({ mensaje: "Error interno del servidor" });
  }
};

module.exports = { enviarMensajeContacto, validarContacto };

// rutas de inscripciones

const express = require("express");
const router = express.Router();
const { body } = require("express-validator");
const {
    crearInscripcion,
    obtenerInscripcionesEvento,
    obtenerInscripcionPorToken,
    cancelarInscripcion,
} = require("../controllers/inscripcionController");
const { protegerRuta } = require("../middleware/authMiddleware");
const validarCampos = require("../middleware/validarCampos");

const validarCrearInscripcion = [
  body("eventoId").notEmpty().withMessage("El evento es obligatorio")
    .isMongoId().withMessage("El evento no es válido"),
  body("nombre").trim().notEmpty().withMessage("El nombre es obligatorio")
    .isLength({ max: 200 }).withMessage("El nombre no puede superar los 200 caracteres"),
  body("correo").trim().notEmpty().withMessage("El correo es obligatorio")
    .isEmail().withMessage("El correo no es válido"),
  body("ciudad").trim().notEmpty().withMessage("La ciudad es obligatoria")
    .isLength({ max: 100 }).withMessage("La ciudad no puede superar los 100 caracteres"),
  body("numPersonas").isInt({ min: 1, max: 1000 })
    .withMessage("El número de personas debe ser un entero entre 1 y 1000"),
  validarCampos,
];

// POST /api/inscripciones - crear inscripcion (ruta publica)
router.post("/", validarCrearInscripcion, crearInscripcion);

// GET /api/inscripciones/evento/:eventoId
// ver inscripciones de un evento (ruta protegida)
router.get("/evento/:eventoId", protegerRuta, obtenerInscripcionesEvento);

// GET /api/inscripciones/cancelar/:token - obtener datos de inscripcion por token (ruta publica)
router.get("/cancelar/:token", obtenerInscripcionPorToken);

// DELETE /api/inscripciones/cancelar/:token - cancelar inscripcion por token (ruta publica)
router.delete("/cancelar/:token", cancelarInscripcion);

module.exports = router;
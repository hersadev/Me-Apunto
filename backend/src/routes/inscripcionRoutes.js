// rutas de inscripciones

const express = require("express");
const router = express.Router();
const {
    crearInscripcion,
    obtenerInscripcionesEvento,
} = require("../controllers/inscripcionController");
const { protegerRuta } = require("../middleware/authMiddleware");

// POST /api/inscripciones - crear inscripcion (ruta publica)
router.post("/", crearInscripcion);

// GET /api/inscripciones/evento/:eventoId
// ver inscripciones de un evento (ruta protegida)
router.get("/evento/:eventoId", protegerRuta, obtenerInscripcionesEvento);

module.exports = router;
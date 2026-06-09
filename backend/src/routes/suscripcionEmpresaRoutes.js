const express = require("express");
const router = express.Router();
const { protegerRuta } = require("../middleware/authMiddleware");
const { suscribirse, obtenerSuscriptoresEmpresa, enviarCorreoSuscriptores, darDeBaja, validarSuscripcion } = require("../controllers/suscripcionEmpresaController");

// POST /api/suscripciones
router.post("/", validarSuscripcion, suscribirse);

// GET /api/suscripciones/empresa — lista suscriptores activos (protegido)
router.get("/empresa", protegerRuta, obtenerSuscriptoresEmpresa);

// POST /api/suscripciones/empresa/correo — envía email a suscriptores (protegido)
router.post("/empresa/correo", protegerRuta, enviarCorreoSuscriptores);

// PATCH /api/suscripciones/baja/:token — baja sin autenticación (enlace del email con token opaco)
router.patch("/baja/:token", darDeBaja);

module.exports = router;

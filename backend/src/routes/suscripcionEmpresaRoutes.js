const express = require("express");
const router = express.Router();
const { protegerRuta } = require("../middleware/authMiddleware");
const { suscribirse, obtenerSuscriptoresEmpresa, enviarCorreoSuscriptores, darDeBaja } = require("../controllers/suscripcionEmpresaController");

// POST /api/suscripciones
router.post("/", suscribirse);

// GET /api/suscripciones/empresa — lista suscriptores activos (protegido)
router.get("/empresa", protegerRuta, obtenerSuscriptoresEmpresa);

// POST /api/suscripciones/empresa/correo — envía email a suscriptores (protegido)
router.post("/empresa/correo", protegerRuta, enviarCorreoSuscriptores);

// PATCH /api/suscripciones/baja/:id — baja sin autenticación (enlace del email)
router.patch("/baja/:id", darDeBaja);

module.exports = router;

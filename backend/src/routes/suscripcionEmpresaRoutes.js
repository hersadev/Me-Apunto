const express = require("express");
const router = express.Router();
const { suscribirse } = require("../controllers/suscripcionEmpresaController");

// POST /api/suscripciones
router.post("/", suscribirse);

module.exports = router;

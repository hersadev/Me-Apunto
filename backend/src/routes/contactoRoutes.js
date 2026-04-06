// rutas de contacto

const express = require("express");
const router = express.Router();
const {
    enviarMensajeContacto,
} = require("../controllers/contactoController");

// POST /api/contacto - enviar mensaje de contacto
router.post("/", enviarMensajeContacto);

module.exports = router;
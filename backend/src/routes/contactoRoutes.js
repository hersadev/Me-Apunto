// rutas de contacto

const express = require("express");
const router = express.Router();
const {
    enviarMensajeContacto,
    validarContacto,
} = require("../controllers/contactoController");

// POST /api/contacto - enviar mensaje de contacto
router.post("/", validarContacto, enviarMensajeContacto);

module.exports = router;
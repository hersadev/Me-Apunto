const express = require("express");
const router = express.Router();
const { enviarMensaje, getMensajes, marcarLeido, marcarRespondido, eliminarMensaje, responderMensaje } = require("../controllers/mensajeController");
const { protegerRuta } = require("../middleware/authMiddleware");

router.post("/", enviarMensaje);
router.get("/", protegerRuta, getMensajes);
router.patch("/:id/leer", protegerRuta, marcarLeido);
router.patch("/:id/respondido", protegerRuta, marcarRespondido);
router.post("/:id/responder", protegerRuta, responderMensaje);
router.delete("/:id", protegerRuta, eliminarMensaje);

module.exports = router;

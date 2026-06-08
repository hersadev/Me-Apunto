const express = require("express");
const router = express.Router();
const { getNotificaciones, marcarLeida, marcarTodasLeidas } = require("../controllers/notificacionController");
const { protegerRuta } = require("../middleware/authMiddleware");

router.get("/", protegerRuta, getNotificaciones);
router.patch("/leidas", protegerRuta, marcarTodasLeidas);
router.patch("/:id/leida", protegerRuta, marcarLeida);

module.exports = router;

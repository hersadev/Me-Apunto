// rutas de eventos
const express = require("express");
const router = express.Router();
const {
  obtenerEventos,
  obtenerEventoPorId,
  obtenerEventosEmpresa,
  crearEvento,
  editarEvento,
  eliminarEvento,
} = require("../controllers/eventoController");
const { protegerRuta } = require("../middleware/authMiddleware");
const { upload } = require("../services/cloudinaryService");

// rutas publicas
router.get("/", obtenerEventos);

// rutas especificas antes que /:id
router.get("/empresa/mis-eventos", protegerRuta, obtenerEventosEmpresa);

// POST /api/eventos - crear evento con imagen opcional
// upload.single("imagen") procesa el archivo antes del controlador
router.post("/", protegerRuta, upload.single("imagen"), crearEvento);

// PUT /api/eventos/:id - editar evento con imagen opcional
router.put("/:id", protegerRuta, upload.single("imagen"), editarEvento);

// DELETE /api/eventos/:id - eliminar evento
router.delete("/:id", protegerRuta, eliminarEvento);

// GET /api/eventos/:id - al final porque captura cualquier string
router.get("/:id", obtenerEventoPorId);

module.exports = router;
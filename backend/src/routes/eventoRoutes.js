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
  obtenerPapelera,
  restaurarEvento,
  eliminarEventoDefinitivo,
  togglePatrocinio,
  registrarVista,
  obtenerAnaliticasEmpresa,
} = require("../controllers/eventoController");
const { protegerRuta } = require("../middleware/authMiddleware");
const { upload } = require("../services/cloudinaryService");
const { validarCrearEvento, validarEditarEvento } = require("../middleware/eventoValidaciones");
const mongoSanitizeBody = require("../middleware/mongoSanitizeBody");
const xssSanitize = require("../middleware/xssSanitize");

// rutas publicas
router.get("/", obtenerEventos);

// rutas especificas antes que /:id
router.get("/empresa/mis-eventos", protegerRuta, obtenerEventosEmpresa);
router.get("/empresa/papelera", protegerRuta, obtenerPapelera);
router.get("/empresa/analiticas", protegerRuta, obtenerAnaliticasEmpresa);

// POST /api/eventos - crear evento con imagen opcional
// upload.single("imagen") procesa el archivo antes del controlador
// mongoSanitize y xssSanitize van después de multer porque multipart se parsea en ese punto
router.post("/", protegerRuta, upload.single("imagen"), mongoSanitizeBody, xssSanitize, validarCrearEvento, crearEvento);

// PUT /api/eventos/:id - editar evento con imagen opcional
router.put("/:id", protegerRuta, upload.single("imagen"), mongoSanitizeBody, xssSanitize, validarEditarEvento, editarEvento);

// PUT /api/eventos/:id/restaurar - recuperar de la papelera permitiendo editar
router.put("/:id/restaurar", protegerRuta, upload.single("imagen"), mongoSanitizeBody, xssSanitize, validarEditarEvento, restaurarEvento);

// DELETE /api/eventos/:id - enviar a la papelera (borrado logico)
router.delete("/:id", protegerRuta, eliminarEvento);

// DELETE /api/eventos/:id/permanente - eliminar definitivamente desde la papelera
router.delete("/:id/permanente", protegerRuta, eliminarEventoDefinitivo);

// PATCH /api/eventos/:id/patrocinio - activar o desactivar patrocinio
router.patch("/:id/patrocinio", protegerRuta, togglePatrocinio);

// PATCH /api/eventos/:id/vista - registrar visita al detalle del evento (publico)
router.patch("/:id/vista", registrarVista);

// GET /api/eventos/:id - al final porque captura cualquier string
router.get("/:id", obtenerEventoPorId);

module.exports = router;
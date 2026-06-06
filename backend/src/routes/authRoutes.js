const express = require("express");
const router = express.Router();
const {
    registrarEmpresa,
    loginEmpresa,
    logoutEmpresa,
    obtenerPerfil,
    actualizarPerfil,
    actualizarFotoPerfil,
    confirmarCambioCorreo,
    solicitarRecuperacion,
    cambiarContrasena,
    eliminarCuenta,
} = require("../controllers/authController");
const { uploadPerfil } = require("../services/cloudinaryService");
const { protegerRuta } = require("../middleware/authMiddleware");
const { validarRegistro, validarLogin, validarRecuperar, validarReset } = require("../middleware/authValidaciones");

router.post("/register", validarRegistro, registrarEmpresa);
router.post("/login", validarLogin, loginEmpresa);
router.post("/logout", logoutEmpresa);
router.post("/recuperar", validarRecuperar, solicitarRecuperacion);
router.post("/reset/:token", validarReset, cambiarContrasena);
router.get("/perfil", protegerRuta, obtenerPerfil);
router.put("/perfil", protegerRuta, actualizarPerfil);
router.put("/foto-perfil", protegerRuta, uploadPerfil.single("foto"), actualizarFotoPerfil);
router.get("/confirmar-correo/:token", confirmarCambioCorreo);
router.delete("/cuenta", protegerRuta, eliminarCuenta);

module.exports = router;

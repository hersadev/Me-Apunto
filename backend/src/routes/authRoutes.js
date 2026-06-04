const express = require("express");
const router = express.Router();
const {
    registrarEmpresa,
    loginEmpresa,
    logoutEmpresa,
    obtenerPerfil,
    solicitarRecuperacion,
    cambiarContrasena,
    eliminarCuenta,
} = require("../controllers/authController");
const { protegerRuta } = require("../middleware/authMiddleware");
const { validarRegistro, validarLogin, validarRecuperar, validarReset } = require("../middleware/authValidaciones");

router.post("/register", validarRegistro, registrarEmpresa);
router.post("/login", validarLogin, loginEmpresa);
router.post("/logout", logoutEmpresa);
router.post("/recuperar", validarRecuperar, solicitarRecuperacion);
router.post("/reset/:token", validarReset, cambiarContrasena);
router.get("/perfil", protegerRuta, obtenerPerfil);
router.delete("/cuenta", protegerRuta, eliminarCuenta);

module.exports = router;

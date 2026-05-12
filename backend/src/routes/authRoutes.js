const express = require("express");
const router = express.Router();
const {
    registrarEmpresa,
    loginEmpresa,
    logoutEmpresa,
    obtenerPerfil,
    solicitarRecuperacion,
    cambiarContrasena,
} = require("../controllers/authController");
const { protegerRuta } = require("../middleware/authMiddleware");

router.post("/register", registrarEmpresa);
router.post("/login", loginEmpresa);
router.post("/logout", logoutEmpresa);
router.post("/recuperar", solicitarRecuperacion);
router.post("/reset/:token", cambiarContrasena);
router.get("/perfil", protegerRuta, obtenerPerfil);

module.exports = router;

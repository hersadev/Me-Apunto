// rutas de autenticacion
// registro, login y perfil de empresas

const express = require("express");
const router = express.Router();
const {
    registrarEmpresa,
    loginEmpresa,
    obtenerPerfil,
    solicitarRecuperacion,
    cambiarContrasena,
} = require("../controllers/authController");
const { protegerRuta } = require("../middleware/authMiddleware");

// POST /api/auth/register - registro de nueva empresa
router.post("/register", registrarEmpresa);

// POST /api/auth/login - login de empresa
router.post("/login", loginEmpresa);

// POST /api/auth/recuperar - solicitar recuperación de contraseña
router.post("/recuperar", solicitarRecuperacion);

// POST /api/auth/reset/:token - cambiar contraseña con token
router.post("/reset/:token", cambiarContrasena);

// GET /api/auth/perfil - obtener perfil (ruta protegida)
router.get("/perfil", protegerRuta, obtenerPerfil);

module.exports = router;
// rutas de autenticacion
// registro, login y perfil de empresas

const express = require("express");
const router = express.Router();
const {
    registrarEmpresa,
    loginEmpresa,
    obtenerPerfil,
} = require("../controllers/authController");
const { protegerRuta } = require("../middleware/authMiddleware");

// POST /api/auth/register - registro de nueva empresa
router.post("/register", registrarEmpresa);

// POST /api/auth/login - login de empresa
router.post("/login", loginEmpresa);

// GET /api/auth/perfil - obtener perfil (ruta protegida)
router.get("/perfil", protegerRuta, obtenerPerfil);

module.exports = router;
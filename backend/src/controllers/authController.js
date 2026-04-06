// controlador de autenticacion
// gestiona el registro y login de empresas
// usa JWT para la autenticacion

const Empresa = require("../models/Empresa");
const jwt = require("jsonwebtoken");

// funcion para generar el token JWT
// recibe el id de la empresa y devuelve el token firmado
const generarToken = (id) => {
    return jwt.sign(
    { id },
    process.env.JWT_SECRET,
    // el token expira en 30 dias
    { expiresIn: "30d" }
    );
};

// POST /api/auth/register
// registra una nueva empresa en la plataforma
const registrarEmpresa = async (req, res) => {
    try {
    const { nombre, correo, contrasena } = req.body;

    // comprobamos que todos los campos esten presentes
    if (!nombre || !correo || !contrasena) {
        return res.status(400).json({
        mensaje: "Todos los campos son obligatorios"
        });
    }

    // comprobamos que no existe ya una empresa con ese correo
    const empresaExistente = await Empresa.findOne({ correo });
    if (empresaExistente) {
        return res.status(400).json({
        mensaje: "Ya existe una cuenta con ese correo"
        });
    }

    // comprobamos que la contraseña tenga al menos 6 caracteres
    if (contrasena.length < 6) {
        return res.status(400).json({
        mensaje: "La contraseña debe tener al menos 6 caracteres"
        });
    }

    // creamos la empresa - la contraseña se hashea automaticamente
    // gracias al middleware pre-save del modelo
    const empresa = await Empresa.create({
        nombre,
        correo,
        contrasena,
    });

    // devolvemos el token y los datos basicos de la empresa
    res.status(201).json({
        mensaje: "Empresa registrada correctamente",
        token: generarToken(empresa._id),
        empresa: {
        id: empresa._id,
        nombre: empresa.nombre,
        correo: empresa.correo,
        },
    });

    } catch (error) {
    console.error("Error en registro:", error);
    res.status(500).json({
        mensaje: "Error interno del servidor"
    });
    }
};

// POST /api/auth/login
// inicia sesion de una empresa con correo y contraseña
const loginEmpresa = async (req, res) => {
    try {
    const { correo, contrasena } = req.body;

    // comprobamos que los campos esten presentes
    if (!correo || !contrasena) {
        return res.status(400).json({
        mensaje: "El correo y la contraseña son obligatorios"
        });
    }

    // buscamos la empresa por correo
    const empresa = await Empresa.findOne({ correo });
    if (!empresa) {
        return res.status(401).json({
        mensaje: "Correo o contraseña incorrectos"
        });
    }

    // comprobamos que la empresa este activa
    if (!empresa.activa) {
        return res.status(401).json({
        mensaje: "Esta cuenta ha sido suspendida"
        });
    }

    // comparamos la contraseña introducida con la hasheada
    // usamos el metodo que definimos en el modelo
    const contrasenaCorrecta = await empresa.compararContrasena(contrasena);
    if (!contrasenaCorrecta) {
        return res.status(401).json({
        mensaje: "Correo o contraseña incorrectos"
        });
    }

    // devolvemos el token y los datos de la empresa
    res.json({
        mensaje: "Login correcto",
        token: generarToken(empresa._id),
        empresa: {
            id: empresa._id,
            nombre: empresa.nombre,
            correo: empresa.correo,
            tieneTarjeta: empresa.stripePaymentMethodId !== null,
        },
    });

    } catch (error) {
    console.error("Error en login:", error);
    res.status(500).json({
        mensaje: "Error interno del servidor"
    });
    }
};

// GET /api/auth/perfil
// devuelve los datos de la empresa logueada
// ruta protegida - requiere token JWT valido
const obtenerPerfil = async (req, res) => {
    try {
    // req.empresa viene del middleware de autenticacion
    const empresa = await Empresa.findById(req.empresa.id).select("-contrasena");

    if (!empresa) {
        return res.status(404).json({
        mensaje: "Empresa no encontrada"
        });
    }

    res.json({
        empresa: {
            id: empresa._id,
            nombre: empresa.nombre,
            correo: empresa.correo,
            tieneTarjeta: empresa.stripePaymentMethodId !== null,
            createdAt: empresa.createdAt,
        },
    });

    } catch (error) {
        console.error("Error al obtener perfil:", error);
        res.status(500).json({
        mensaje: "Error interno del servidor"
    });
    }
};

module.exports = {
    registrarEmpresa,
    loginEmpresa,
    obtenerPerfil,
};
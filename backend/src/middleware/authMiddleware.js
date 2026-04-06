// middleware de autenticacion
// verifica el token JWT en cada peticion a rutas protegidas
// si el token es valido añade los datos de la empresa a req.empresa

const jwt = require("jsonwebtoken");
const Empresa = require("../models/Empresa");

const protegerRuta = async (req, res, next) => {
    try {
        let token;

    // el token viene en el header Authorization con formato "Bearer TOKEN"
        if (
        req.headers.authorization &&
        req.headers.authorization.startsWith("Bearer")
    ) {
        // extraemos el token quitando el "Bearer "
        token = req.headers.authorization.split(" ")[1];
    }

    // si no hay token devolvemos error 401
        if (!token) {
        return res.status(401).json({
            mensaje: "No autorizado - token no encontrado"
        });
    }

    // verificamos el token con la clave secreta
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // buscamos la empresa en la base de datos
    // y la añadimos a req para que los controladores puedan usarla
    req.empresa = await Empresa.findById(decoded.id).select("-contrasena");

    if (!req.empresa) {
        return res.status(401).json({
        mensaje: "No autorizado - empresa no encontrada"
        });
    }

    // todo correcto - pasamos al siguiente middleware o controlador
    next();

    } catch (error) {
        console.error("Error en middleware de auth:", error);
        res.status(401).json({
        mensaje: "No autorizado - token inválido"
        });
    }
};

module.exports = { protegerRuta };
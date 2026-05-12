const jwt = require("jsonwebtoken");
const Empresa = require("../models/Empresa");

const protegerRuta = async (req, res, next) => {
    try {
        // primero buscamos el token en la cookie httpOnly
        // si no hay cookie aceptamos también el header Authorization (compatibilidad)
        let token = req.cookies?.token;

        if (!token && req.headers.authorization?.startsWith("Bearer")) {
            token = req.headers.authorization.split(" ")[1];
        }

        if (!token) {
            return res.status(401).json({ mensaje: "No autorizado - token no encontrado" });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        req.empresa = await Empresa.findById(decoded.id).select("-contrasena");

        if (!req.empresa) {
            return res.status(401).json({ mensaje: "No autorizado - empresa no encontrada" });
        }

        next();

    } catch (error) {
        res.status(401).json({ mensaje: "No autorizado - token inválido" });
    }
};

module.exports = { protegerRuta };

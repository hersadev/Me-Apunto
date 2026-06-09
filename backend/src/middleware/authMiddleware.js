const jwt = require("jsonwebtoken");
const Empresa = require("../models/Empresa");

const protegerRuta = async (req, res, next) => {
    try {
        const tokenCookie = req.cookies?.token;
        const authHeader = req.headers?.authorization;
        const tokenHeader = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
        const token = tokenCookie || tokenHeader;

        if (!token) {
            return res.status(401).json({ mensaje: "No autorizado - token no encontrado" });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        req.empresa = await Empresa.findById(decoded.id).select("-contrasena");

        if (!req.empresa) {
            return res.status(401).json({ mensaje: "No autorizado - empresa no encontrada" });
        }

        if (!req.empresa.activa) {
            return res.status(401).json({ mensaje: "Esta cuenta ha sido suspendida" });
        }

        if (req.empresa.contrasenaCambiadaEn && decoded.iat * 1000 < req.empresa.contrasenaCambiadaEn.getTime()) {
            return res.status(401).json({ mensaje: "No autorizado - sesión caducada, vuelve a iniciar sesión" });
        }

        next();

    } catch (error) {
        res.status(401).json({ mensaje: "No autorizado - token inválido" });
    }
};

module.exports = { protegerRuta };

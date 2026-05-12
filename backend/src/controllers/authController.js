const Empresa = require("../models/Empresa");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const { enviarCorreoBienvenida, enviarCorreoRecuperacion } = require("../services/emailService");

const COOKIE_OPTS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 días en ms
};

const generarToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "7d" });
};

// POST /api/auth/register
const registrarEmpresa = async (req, res) => {
  try {
    const { nombre, correo, contrasena, nifCif } = req.body;

    if (!nombre || !correo || !contrasena || !nifCif) {
      return res.status(400).json({ mensaje: "Todos los campos son obligatorios" });
    }

    const empresaExistente = await Empresa.findOne({ correo });
    if (empresaExistente) {
      return res.status(400).json({ mensaje: "Ya existe una cuenta con ese correo" });
    }

    const nifCifExistente = await Empresa.findOne({ nifCif: nifCif.toUpperCase() });
    if (nifCifExistente) {
      return res.status(400).json({ mensaje: "Ya existe una cuenta con ese NIF/CIF" });
    }

    if (contrasena.length < 6) {
      return res.status(400).json({ mensaje: "La contraseña debe tener al menos 6 caracteres" });
    }

    const empresa = await Empresa.create({
      nombre,
      correo,
      contrasena,
      nifCif: nifCif.toUpperCase(),
    });

    try {
      await enviarCorreoBienvenida({ correoEmpresa: correo, nombreEmpresa: nombre });
    } catch (errorCorreo) {
      console.error("Error al enviar correo de bienvenida:", errorCorreo.message);
    }

    res.cookie("token", generarToken(empresa._id), COOKIE_OPTS);

    res.status(201).json({
      mensaje: "Empresa registrada correctamente",
      empresa: {
        id: empresa._id,
        nombre: empresa.nombre,
        correo: empresa.correo,
        nifCif: empresa.nifCif,
      },
    });

  } catch (error) {
    console.error("Error en registro:", error);
    res.status(500).json({ mensaje: "Error interno del servidor" });
  }
};

// POST /api/auth/login
const loginEmpresa = async (req, res) => {
  try {
    const { correo, contrasena } = req.body;

    if (!correo || !contrasena) {
      return res.status(400).json({ mensaje: "El correo y la contraseña son obligatorios" });
    }

    const empresa = await Empresa.findOne({ correo });
    if (!empresa) {
      return res.status(401).json({ mensaje: "Correo o contraseña incorrectos" });
    }

    if (!empresa.activa) {
      return res.status(401).json({ mensaje: "Esta cuenta ha sido suspendida" });
    }

    const contrasenaCorrecta = await empresa.compararContrasena(contrasena);
    if (!contrasenaCorrecta) {
      return res.status(401).json({ mensaje: "Correo o contraseña incorrectos" });
    }

    res.cookie("token", generarToken(empresa._id), COOKIE_OPTS);

    res.json({
      mensaje: "Login correcto",
      empresa: {
        id: empresa._id,
        nombre: empresa.nombre,
        correo: empresa.correo,
        nifCif: empresa.nifCif,
        tieneTarjeta: empresa.stripePaymentMethodId !== null,
      },
    });

  } catch (error) {
    console.error("Error en login:", error);
    res.status(500).json({ mensaje: "Error interno del servidor" });
  }
};

// POST /api/auth/logout
const logoutEmpresa = (req, res) => {
  res.clearCookie("token", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
  });
  res.json({ mensaje: "Logout correcto" });
};

// GET /api/auth/perfil
const obtenerPerfil = async (req, res) => {
  try {
    const empresa = await Empresa.findById(req.empresa.id).select("-contrasena");

    if (!empresa) {
      return res.status(404).json({ mensaje: "Empresa no encontrada" });
    }

    res.json({
      empresa: {
        id: empresa._id,
        nombre: empresa.nombre,
        correo: empresa.correo,
        nifCif: empresa.nifCif,
        tieneTarjeta: empresa.stripePaymentMethodId !== null,
        createdAt: empresa.createdAt,
      },
    });

  } catch (error) {
    console.error("Error al obtener perfil:", error);
    res.status(500).json({ mensaje: "Error interno del servidor" });
  }
};

// POST /api/auth/recuperar
const solicitarRecuperacion = async (req, res) => {
  try {
    const { correo } = req.body;

    if (!correo) {
      return res.status(400).json({ mensaje: "El correo es obligatorio" });
    }

    const empresa = await Empresa.findOne({ correo });

    if (!empresa) {
      return res.status(404).json({ mensaje: "No existe ninguna cuenta con ese correo" });
    }

    if (!empresa.activa) {
      return res.status(401).json({ mensaje: "Esta cuenta ha sido suspendida" });
    }

    // generamos el token en texto plano (se envía por email)
    // y guardamos sólo su hash en la DB
    const resetToken = crypto.randomBytes(32).toString("hex");
    const hashedToken = crypto.createHash("sha256").update(resetToken).digest("hex");

    await Empresa.findOneAndUpdate(
      { correo },
      {
        resetToken: hashedToken,
        resetTokenExpiracion: new Date(Date.now() + 60 * 60 * 1000),
      }
    );

    try {
      await enviarCorreoRecuperacion({
        correoEmpresa: empresa.correo,
        nombreEmpresa: empresa.nombre,
        token: resetToken,
      });
    } catch (errorCorreo) {
      console.error("Error al enviar correo de recuperación:", errorCorreo.message);
    }

    res.json({ mensaje: "Se ha enviado un correo con las instrucciones para recuperar tu contraseña" });

  } catch (error) {
    console.error("Error en recuperación:", error);
    res.status(500).json({ mensaje: "Error interno del servidor" });
  }
};

// POST /api/auth/reset/:token
const cambiarContrasena = async (req, res) => {
  try {
    const { token } = req.params;
    const { contrasena } = req.body;

    if (!contrasena) {
      return res.status(400).json({ mensaje: "La contraseña es obligatoria" });
    }

    if (contrasena.length < 6) {
      return res.status(400).json({ mensaje: "La contraseña debe tener al menos 6 caracteres" });
    }

    // hasheamos el token recibido y buscamos su hash en la DB
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    const empresa = await Empresa.findOne({
      resetToken: hashedToken,
      resetTokenExpiracion: { $gt: Date.now() },
    });

    if (!empresa) {
      return res.status(400).json({ mensaje: "El enlace de recuperación ha expirado o es inválido" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedContrasena = await bcrypt.hash(contrasena, salt);

    await Empresa.findOneAndUpdate(
      { _id: empresa._id },
      {
        contrasena: hashedContrasena,
        resetToken: null,
        resetTokenExpiracion: null,
      }
    );

    res.json({ mensaje: "Contraseña actualizada correctamente" });

  } catch (error) {
    console.error("Error al cambiar contraseña:", error);
    res.status(500).json({ mensaje: "Error interno del servidor" });
  }
};

module.exports = {
  registrarEmpresa,
  loginEmpresa,
  logoutEmpresa,
  obtenerPerfil,
  solicitarRecuperacion,
  cambiarContrasena,
};

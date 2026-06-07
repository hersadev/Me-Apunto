const Empresa = require("../models/Empresa");
const Evento = require("../models/Evento");

function validarCIF(cif) {
  if (typeof cif !== "string" || !cif) return false;
  const upper = cif.toUpperCase();
  if (!/^[ABCDEFGHJNPQRSUVW]\d{7}[0-9A-J]$/.test(upper)) return false;

  const digits = upper.substring(1, 8);
  const control = upper[8];

  let sumImpar = 0;
  for (let i = 0; i < 7; i += 2) {
    const d = parseInt(digits[i]) * 2;
    sumImpar += Math.floor(d / 10) + (d % 10);
  }
  let sumPar = 0;
  for (let i = 1; i < 7; i += 2) sumPar += parseInt(digits[i]);

  const total = (sumImpar + sumPar) % 10;
  const digitoControl = total === 0 ? 0 : 10 - total;
  const letraControl = "JABCDEFGHI"[digitoControl];

  const soloDigito = "ABEH";
  const soloLetra = "KPQS";
  const letra = upper[0];

  if (soloDigito.includes(letra)) return control === String(digitoControl);
  if (soloLetra.includes(letra)) return control === letraControl;
  return control === String(digitoControl) || control === letraControl;
}
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const { enviarCorreoBienvenida, enviarCorreoRecuperacion, enviarCorreoConfirmacionCambio } = require("../services/emailService");

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

    if (!validarCIF(nifCif.trim())) {
      return res.status(400).json({ mensaje: "El CIF no es válido. Formato esperado: B12345678" });
    }

    const duplicado = await Empresa.findOne({
      $or: [{ correo }, { nifCif: nifCif.toUpperCase() }],
    });
    if (duplicado) {
      if (duplicado.correo === correo) {
        return res.status(400).json({ mensaje: "Ya existe una cuenta con ese correo" });
      }
      return res.status(400).json({ mensaje: "Ya existe una cuenta con ese CIF" });
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

    const token = generarToken(empresa._id);
    res.cookie("token", token, COOKIE_OPTS);

    res.status(201).json({
      mensaje: "Empresa registrada correctamente",
      token,
      empresa: {
        id: empresa._id,
        nombre: empresa.nombre,
        correo: empresa.correo,
        nifCif: empresa.nifCif,
        descripcion: empresa.descripcion || null,
        fotoPerfil: empresa.fotoPerfil || null,
        nombreCambiadoEn: empresa.nombreCambiadoEn || null,
        correoCambiadoEn: empresa.correoCambiadoEn || null,
        descripcionCambiadaEn: empresa.descripcionCambiadaEn || null,
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

    const token = generarToken(empresa._id);
    res.cookie("token", token, COOKIE_OPTS);

    res.json({
      mensaje: "Login correcto",
      token,
      empresa: {
        id: empresa._id,
        nombre: empresa.nombre,
        correo: empresa.correo,
        descripcion: empresa.descripcion || null,
        fotoPerfil: empresa.fotoPerfil || null,
        nombreCambiadoEn: empresa.nombreCambiadoEn || null,
        correoCambiadoEn: empresa.correoCambiadoEn || null,
        descripcionCambiadaEn: empresa.descripcionCambiadaEn || null,
        nifCif: empresa.nifCif,
        tieneTarjeta: !!empresa.stripePaymentMethodId,
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
        descripcion: empresa.descripcion || null,
        fotoPerfil: empresa.fotoPerfil || null,
        nombreCambiadoEn: empresa.nombreCambiadoEn || null,
        correoCambiadoEn: empresa.correoCambiadoEn || null,
        descripcionCambiadaEn: empresa.descripcionCambiadaEn || null,
        tieneTarjeta: !!empresa.stripePaymentMethodId,
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

    // siempre respondemos igual para no revelar si el correo existe o la cuenta está suspendida
    const mensajeGenerico = "Si existe una cuenta con ese correo, recibirás un enlace para recuperar tu contraseña.";

    if (empresa && empresa.activa) {
      const resetToken = crypto.randomBytes(32).toString("hex");
      const hashedToken = crypto.createHash("sha256").update(resetToken).digest("hex");

      empresa.resetToken = hashedToken;
      empresa.resetTokenExpiracion = new Date(Date.now() + 60 * 60 * 1000);
      await empresa.save();

      try {
        await enviarCorreoRecuperacion({
          correoEmpresa: empresa.correo,
          nombreEmpresa: empresa.nombre,
          token: resetToken,
        });
      } catch (errorCorreo) {
        console.error("Error al enviar correo de recuperación:", errorCorreo.message);
      }
    }

    res.json({ mensaje: mensajeGenerico });

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

    empresa.contrasena = contrasena;
    empresa.resetToken = null;
    empresa.resetTokenExpiracion = null;
    await empresa.save();

    res.json({ mensaje: "Contraseña actualizada correctamente" });

  } catch (error) {
    console.error("Error al cambiar contraseña:", error);
    res.status(500).json({ mensaje: "Error interno del servidor" });
  }
};

const sumarDosMeses = (fecha) => {
  const d = new Date(fecha);
  d.setMonth(d.getMonth() + 2);
  return d;
};

const puedeModificar = (fecha) => {
  if (!fecha) return true;
  return new Date() >= sumarDosMeses(fecha);
};

const proximaFechaPermitida = (fecha) => {
  return sumarDosMeses(fecha).toLocaleDateString("es-ES");
};

// PUT /api/auth/perfil
const actualizarPerfil = async (req, res) => {
  try {
    const { nombre, correo, descripcion, contrasena } = req.body;

    if (!contrasena) {
      return res.status(400).json({ mensaje: "Introduce tu contraseña para confirmar los cambios" });
    }
    if (!nombre && !correo && descripcion === undefined) {
      return res.status(400).json({ mensaje: "Indica al menos un campo a actualizar" });
    }

    const empresaActual = await Empresa.findById(req.empresa.id);

    if (!empresaActual) {
      return res.status(404).json({ mensaje: "Cuenta no encontrada" });
    }

    const contrasenaCorrecta = await empresaActual.compararContrasena(contrasena);
    if (!contrasenaCorrecta) {
      return res.status(401).json({ mensaje: "Contraseña incorrecta" });
    }

    const campos = {};
    let mensajeRespuesta = "";

    if (nombre && nombre.trim() !== empresaActual.nombre) {
      if (!puedeModificar(empresaActual.nombreCambiadoEn)) {
        return res.status(429).json({
          mensaje: `El nombre solo puede cambiarse una vez cada 2 meses. Podrás cambiarlo el ${proximaFechaPermitida(empresaActual.nombreCambiadoEn)}.`,
        });
      }
      campos.nombre = nombre.trim();
      campos.nombreCambiadoEn = new Date();
    }

    const correoNuevoNorm = correo ? correo.trim().toLowerCase() : null;
    const cambiandoCorreo = correoNuevoNorm && correoNuevoNorm !== empresaActual.correo;

    if (cambiandoCorreo) {
      if (!puedeModificar(empresaActual.correoCambiadoEn)) {
        return res.status(429).json({
          mensaje: `El correo solo puede cambiarse una vez cada 2 meses. Podrás cambiarlo el ${proximaFechaPermitida(empresaActual.correoCambiadoEn)}.`,
        });
      }
      const existente = await Empresa.findOne({ correo: correoNuevoNorm, _id: { $ne: req.empresa.id } });
      if (existente) {
        return res.status(400).json({ mensaje: "Ya existe una cuenta con ese correo" });
      }

      const tokenPlano = crypto.randomBytes(32).toString("hex");
      const tokenHash = crypto.createHash("sha256").update(tokenPlano).digest("hex");

      campos.correoNuevo = correoNuevoNorm;
      campos.correoToken = tokenHash;
      campos.correoTokenExpiracion = new Date(Date.now() + 24 * 60 * 60 * 1000);
      campos.correoCambiadoEn = new Date();

      if (descripcion !== undefined && descripcion.trim() !== (empresaActual.descripcion || "")) {
        if (!puedeModificar(empresaActual.descripcionCambiadaEn)) {
          return res.status(429).json({
            mensaje: `La descripción solo puede cambiarse una vez cada 2 meses. Podrás cambiarla el ${proximaFechaPermitida(empresaActual.descripcionCambiadaEn)}.`,
          });
        }
        campos.descripcion = descripcion.trim().slice(0, 500);
        campos.descripcionCambiadaEn = new Date();
      }

      await Empresa.findByIdAndUpdate(req.empresa.id, campos);

      try {
        await enviarCorreoConfirmacionCambio({
          correoNuevo: correoNuevoNorm,
          nombreEmpresa: empresaActual.nombre,
          token: tokenPlano,
        });
      } catch (e) {
        console.error("Error al enviar correo de confirmación:", e.message);
      }

      const empresaActualizada = await Empresa.findById(req.empresa.id);
      return res.json({
        mensaje: campos.nombre
          ? "Nombre actualizado. Revisa tu nuevo correo para confirmar el cambio de dirección."
          : "Te hemos enviado un correo de confirmación a la nueva dirección.",
        empresa: {
          id: empresaActualizada._id,
          nombre: empresaActualizada.nombre,
          correo: empresaActualizada.correo,
          nifCif: empresaActualizada.nifCif,
          descripcion: empresaActualizada.descripcion,
          fotoPerfil: empresaActualizada.fotoPerfil,
          nombreCambiadoEn: empresaActualizada.nombreCambiadoEn,
          correoCambiadoEn: empresaActualizada.correoCambiadoEn,
          descripcionCambiadaEn: empresaActualizada.descripcionCambiadaEn,
        },
      });
    }

    if (descripcion !== undefined && descripcion.trim() !== (empresaActual.descripcion || "")) {
      if (!puedeModificar(empresaActual.descripcionCambiadaEn)) {
        return res.status(429).json({
          mensaje: `La descripción solo puede cambiarse una vez cada 2 meses. Podrás cambiarla el ${proximaFechaPermitida(empresaActual.descripcionCambiadaEn)}.`,
        });
      }
      campos.descripcion = descripcion.trim().slice(0, 500);
      campos.descripcionCambiadaEn = new Date();
    }

    if (Object.keys(campos).length === 0) {
      return res.status(400).json({ mensaje: "No hay cambios que guardar" });
    }

    const empresa = await Empresa.findByIdAndUpdate(req.empresa.id, campos, { new: true });

    res.json({
      mensaje: "Perfil actualizado correctamente.",
      empresa: {
        id: empresa._id,
        nombre: empresa.nombre,
        correo: empresa.correo,
        nifCif: empresa.nifCif,
        descripcion: empresa.descripcion,
        fotoPerfil: empresa.fotoPerfil,
        nombreCambiadoEn: empresa.nombreCambiadoEn,
        correoCambiadoEn: empresa.correoCambiadoEn,
        descripcionCambiadaEn: empresa.descripcionCambiadaEn,
      },
    });

  } catch (error) {
    console.error("Error al actualizar perfil:", error);
    res.status(500).json({ mensaje: "Error interno del servidor" });
  }
};

// PUT /api/auth/foto-perfil
const actualizarFotoPerfil = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ mensaje: "No se recibió ninguna imagen" });
    }

    const empresa = await Empresa.findById(req.empresa.id);

    if (empresa.fotoPerfilPublicId) {
      try {
        await require("../services/cloudinaryService").eliminarImagen(empresa.fotoPerfilPublicId);
      } catch (err) {
        console.error("Error al eliminar foto anterior de Cloudinary:", err.message);
      }
    }

    empresa.fotoPerfil = req.file.path;
    empresa.fotoPerfilPublicId = req.file.filename;
    await empresa.save();

    res.json({
      mensaje: "Foto de perfil actualizada.",
      empresa: {
        id: empresa._id,
        nombre: empresa.nombre,
        correo: empresa.correo,
        nifCif: empresa.nifCif,
        descripcion: empresa.descripcion,
        fotoPerfil: empresa.fotoPerfil,
      },
    });
  } catch (error) {
    console.error("Error al actualizar foto de perfil:", error);
    res.status(500).json({ mensaje: "Error interno del servidor" });
  }
};

// GET /api/auth/confirmar-correo/:token
const confirmarCambioCorreo = async (req, res) => {
  try {
    const tokenHash = crypto.createHash("sha256").update(req.params.token).digest("hex");

    const empresa = await Empresa.findOne({
      correoToken: tokenHash,
      correoTokenExpiracion: { $gt: Date.now() },
    });

    if (!empresa) {
      return res.status(400).json({ mensaje: "El enlace de confirmación ha expirado o es inválido" });
    }

    const correoYaOcupado = await Empresa.findOne({ correo: empresa.correoNuevo, _id: { $ne: empresa._id } });
    if (correoYaOcupado) {
      return res.status(409).json({ mensaje: "El correo ya está en uso por otra cuenta. Por favor, solicita un nuevo cambio desde tu panel." });
    }

    empresa.correo = empresa.correoNuevo;
    empresa.correoCambiadoEn = new Date();
    empresa.correoNuevo = null;
    empresa.correoToken = null;
    empresa.correoTokenExpiracion = null;
    await empresa.save();

    res.json({ mensaje: "Correo actualizado correctamente. Ya puedes iniciar sesión con tu nueva dirección." });

  } catch (error) {
    console.error("Error al confirmar cambio de correo:", error);
    res.status(500).json({ mensaje: "Error interno del servidor" });
  }
};

// DELETE /api/auth/cuenta
const eliminarCuenta = async (req, res) => {
  try {
    const empresaId = req.empresa.id;

    const empresa = await Empresa.findById(empresaId);
    if (empresa?.fotoPerfilPublicId) {
      try {
        await require("../services/cloudinaryService").eliminarImagen(empresa.fotoPerfilPublicId);
      } catch (err) {
        console.error("Error al eliminar foto de perfil de Cloudinary:", err.message);
      }
    }

    await Evento.deleteMany({ empresa: empresaId });
    await Empresa.findByIdAndDelete(empresaId);

    res.clearCookie("token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    });

    res.json({ mensaje: "Cuenta eliminada correctamente" });

  } catch (error) {
    console.error("Error al eliminar cuenta:", error);
    res.status(500).json({ mensaje: "Error interno del servidor" });
  }
};

module.exports = {
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
};

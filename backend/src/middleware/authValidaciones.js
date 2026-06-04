const { body } = require("express-validator");
const validarCampos = require("./validarCampos");

const validarRegistro = [
  body("nombre").trim().notEmpty().withMessage("El nombre es obligatorio")
    .isLength({ max: 100 }).withMessage("El nombre no puede superar los 100 caracteres"),
  body("correo").trim().notEmpty().withMessage("El correo es obligatorio")
    .isEmail().withMessage("El correo no es válido"),
  body("contrasena").isLength({ min: 6, max: 100 })
    .withMessage("La contraseña debe tener entre 6 y 100 caracteres"),
  body("nifCif").trim().notEmpty().withMessage("El CIF es obligatorio")
    .isLength({ max: 20 }).withMessage("El CIF no es válido"),
  validarCampos,
];

const validarLogin = [
  body("correo").trim().notEmpty().withMessage("El correo es obligatorio")
    .isEmail().withMessage("El correo no es válido"),
  body("contrasena").notEmpty().withMessage("La contraseña es obligatoria"),
  validarCampos,
];

const validarRecuperar = [
  body("correo").trim().notEmpty().withMessage("El correo es obligatorio")
    .isEmail().withMessage("El correo no es válido"),
  validarCampos,
];

const validarReset = [
  body("contrasena").isLength({ min: 6, max: 100 })
    .withMessage("La contraseña debe tener entre 6 y 100 caracteres"),
  validarCampos,
];

module.exports = { validarRegistro, validarLogin, validarRecuperar, validarReset };

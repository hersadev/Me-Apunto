const { body } = require("express-validator");
const validarCampos = require("./validarCampos");

const CATEGORIAS = ["taller", "exposicion", "concurso", "concierto", "deporte", "gastronomia", "teatro", "otros"];

const validarCrearEvento = [
  body("titulo").trim().notEmpty().withMessage("El título es obligatorio")
    .isLength({ max: 200 }).withMessage("El título no puede superar los 200 caracteres"),
  body("descripcion").trim().notEmpty().withMessage("La descripción es obligatoria")
    .isLength({ max: 2000 }).withMessage("La descripción no puede superar los 2000 caracteres"),
  body("venue").trim().notEmpty().withMessage("El lugar es obligatorio")
    .isLength({ max: 200 }).withMessage("El lugar no puede superar los 200 caracteres"),
  body("direccion").trim().notEmpty().withMessage("La dirección es obligatoria")
    .isLength({ max: 300 }).withMessage("La dirección no puede superar los 300 caracteres"),
  body("fecha").isISO8601().withMessage("La fecha no es válida"),
  body("hora").matches(/^\d{2}:\d{2}$/).withMessage("La hora no es válida"),
  body("precio").optional({ checkFalsy: true }).isFloat({ min: 0 }).withMessage("El precio debe ser un número positivo"),
  body("categoria").isIn(CATEGORIAS).withMessage("La categoría no es válida"),
  body("maxPersonasPorInscripcion").optional({ checkFalsy: true })
    .isInt({ min: 1 }).withMessage("El límite debe ser un número entero mayor que 0"),
  validarCampos,
];

const validarEditarEvento = [
  body("titulo").optional().trim().notEmpty().withMessage("El título no puede estar vacío")
    .isLength({ max: 200 }).withMessage("El título no puede superar los 200 caracteres"),
  body("descripcion").optional().trim().notEmpty().withMessage("La descripción no puede estar vacía")
    .isLength({ max: 2000 }).withMessage("La descripción no puede superar los 2000 caracteres"),
  body("venue").optional().trim().notEmpty().withMessage("El lugar no puede estar vacío")
    .isLength({ max: 200 }).withMessage("El lugar no puede superar los 200 caracteres"),
  body("direccion").optional().trim().notEmpty().withMessage("La dirección no puede estar vacía")
    .isLength({ max: 300 }).withMessage("La dirección no puede superar los 300 caracteres"),
  body("fecha").optional().isISO8601().withMessage("La fecha no es válida"),
  body("hora").optional().matches(/^\d{2}:\d{2}$/).withMessage("La hora no es válida"),
  body("precio").optional({ checkFalsy: true }).isFloat({ min: 0 }).withMessage("El precio debe ser un número positivo"),
  body("categoria").optional().isIn(CATEGORIAS).withMessage("La categoría no es válida"),
  body("maxPersonasPorInscripcion").optional({ checkFalsy: true })
    .isInt({ min: 1 }).withMessage("El límite debe ser un número entero mayor que 0"),
  validarCampos,
];

module.exports = { validarCrearEvento, validarEditarEvento };

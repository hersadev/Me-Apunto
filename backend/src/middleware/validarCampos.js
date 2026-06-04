const { validationResult } = require("express-validator");

module.exports = (req, res, next) => {
  const errores = validationResult(req);
  if (!errores.isEmpty()) {
    return res.status(422).json({ mensaje: errores.array()[0].msg });
  }
  next();
};

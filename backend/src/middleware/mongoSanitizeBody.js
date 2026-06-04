const mongoSanitize = require("express-mongo-sanitize");

// express-mongo-sanitize intenta reasignar req.query, que en Express 5
// es un getter de solo lectura y lanza error en todos los endpoints.
// Este wrapper aplica la misma sanitizacion solo al body.
module.exports = (req, res, next) => {
  if (req.body) req.body = mongoSanitize.sanitize(req.body);
  next();
};

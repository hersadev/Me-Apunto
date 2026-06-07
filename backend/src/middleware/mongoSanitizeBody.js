const mongoSanitize = require("express-mongo-sanitize");

// express-mongo-sanitize intenta reasignar req.query, que en Express 5
// es un getter de solo lectura y lanza error en todos los endpoints.
// Sanitizamos body directamente y guardamos una copia limpia de query en
// req.cleanQuery para que los controladores la usen si necesitan filtros dinámicos.
module.exports = (req, res, next) => {
  if (req.body) req.body = mongoSanitize.sanitize(req.body);
  req.cleanQuery = mongoSanitize.sanitize({ ...req.query });
  next();
};

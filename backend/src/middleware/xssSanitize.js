const xss = require("xss");

function sanitizar(valor) {
  if (typeof valor === "string") return xss(valor);
  if (Array.isArray(valor)) return valor.map(sanitizar);
  if (valor && typeof valor === "object") {
    return Object.fromEntries(Object.entries(valor).map(([k, v]) => [k, sanitizar(v)]));
  }
  return valor;
}

module.exports = (req, res, next) => {
  if (req.body) req.body = sanitizar(req.body);
  if (req.query) req.query = sanitizar(req.query);
  next();
};

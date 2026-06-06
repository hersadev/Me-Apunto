const mongoose = require("mongoose");

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const mensajeSchema = new mongoose.Schema({
  de: {
    type: String, required: true, lowercase: true, trim: true,
    validate: { validator: (v) => emailRegex.test(v), message: "Email no válido" },
  },
  nombre: { type: String, required: true, trim: true },
  empresa: { type: mongoose.Schema.Types.ObjectId, ref: "Empresa", required: true, index: true },
  asunto: { type: String, required: true, trim: true, maxlength: 120 },
  cuerpo: { type: String, required: true, trim: true, maxlength: 2000 },
  evento: { type: mongoose.Schema.Types.ObjectId, ref: "Evento", default: null },
  leido: { type: Boolean, default: false },
  respondido: { type: Boolean, default: false },
  eliminadoEn: { type: Date, default: null },
}, { timestamps: true });

module.exports = mongoose.model("Mensaje", mensajeSchema);

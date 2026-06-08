const mongoose = require("mongoose");

const notificacionSchema = new mongoose.Schema({
  empresa: { type: mongoose.Schema.Types.ObjectId, ref: "Empresa", required: true, index: true },
  tipo: {
    type: String,
    enum: ["inscripcion", "cancelacion_inscripcion", "suscripcion", "mensaje"],
    required: true,
  },
  leida: { type: Boolean, default: false },
  datos: {
    nombre: { type: String, default: "" },
    correo: { type: String, default: "" },
    eventoTitulo: { type: String, default: "" },
    numPersonas: { type: Number, default: null },
    motivoCancelacion: { type: String, default: null },
  },
}, { timestamps: true });

notificacionSchema.index({ createdAt: 1 }, { expireAfterSeconds: 7776000 }); // 90 días

module.exports = mongoose.model("Notificacion", notificacionSchema);

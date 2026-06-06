const mongoose = require("mongoose");

const suscripcionSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    empresa: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Empresa",
      required: true,
    },
    activa: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

// un email solo puede suscribirse una vez a cada empresa
suscripcionSchema.index({ email: 1, empresa: 1 }, { unique: true });

module.exports = mongoose.model("Suscripcion", suscripcionSchema);

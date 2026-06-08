// modelo de inscripcion - representa cada inscripcion de un usuario a un evento
// los usuarios no tienen cuenta - solo se guardan sus datos en cada inscripcion

const mongoose = require("mongoose");

const inscripcionSchema = new mongoose.Schema(
    {
    // evento al que se inscribe
    evento: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Evento",
        required: true,
    },

    // datos del usuario que se inscribe
    // no tiene cuenta - guardamos sus datos directamente
    nombre: {
        type: String,
        required: [true, "El nombre es obligatorio"],
        trim: true,
    },

    correo: {
        type: String,
        required: [true, "El correo es obligatorio"],
        lowercase: true,
        trim: true,
    },

    ciudad: {
        type: String,
        required: [true, "La ciudad es obligatoria"],
        trim: true,
    },

    // numero de personas que se apuntan con esta inscripcion
    numPersonas: {
        type: Number,
        required: true,
        min: [1, "El número mínimo de personas es 1"],
        default: 1,
    },

    // estado del pago si el evento es de pago
    // pending - pendiente de pago
    // completed - pago completado
    // free - evento gratuito
    estadoPago: {
        type: String,
        enum: ["pending", "completed", "free"],
        default: "free",
    },

    // id del pago en stripe si el evento es de pago
    stripePaymentIntentId: {
        type: String,
        default: null,
    },

    // importe pagado en euros
    importePagado: {
        type: Number,
        default: 0,
    },

    // token unico para que el usuario pueda cancelar su inscripcion sin cuenta
    tokenCancelacion: {
        type: String,
        unique: true,
        sparse: true,
    },

    // fecha de expiracion del token de cancelacion (30 dias)
    tokenExpiraEn: {
        type: Date,
        default: null,
    },

    // motivo opcional que el usuario escribe al cancelar su inscripcion
    motivoCancelacion: {
        type: String,
        trim: true,
        maxlength: 500,
        default: null,
    },

    // indica si ya se envio el recordatorio del dia anterior al evento
    // evita enviar duplicados si el cron se ejecuta varias veces
    recordatorioEnviado: {
        type: Boolean,
        default: false,
    },
},
    {
    timestamps: true,
    }
);

inscripcionSchema.index({ evento: 1, createdAt: -1 });
inscripcionSchema.index({ evento: 1, estadoPago: 1, recordatorioEnviado: 1 });
inscripcionSchema.index({ tokenCancelacion: 1 }, { sparse: true });

module.exports = mongoose.model("Inscripcion", inscripcionSchema);
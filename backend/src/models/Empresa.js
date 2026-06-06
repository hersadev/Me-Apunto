// modelo de empresa - representa a las empresas registradas en la plataforma
// las empresas son las unicas que tienen cuenta y pueden publicar eventos

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const empresaSchema = new mongoose.Schema(
    {
    // nombre de la empresa
    nombre: {
        type: String,
        required: [true, "El nombre de empresa es obligatorio"],
        trim: true,
    },

    // correo de la empresa - se usa para login y para recibir inscripciones
    correo: {
        type: String,
        required: [true, "El correo es obligatorio"],
        unique: true,
        lowercase: true,
        trim: true,
    },

        // cif de la empresa - obligatorio y unico (B12345678)
    nifCif: {
    type: String,
    required: [true, "El CIF es obligatorio"],
    unique: true,
    trim: true,
    uppercase: true,
    },

    // contraseña hasheada - nunca guardamos la contraseña en texto plano
    contrasena: {
        type: String,
        required: [true, "La contraseña es obligatoria"],
        minlength: [6, "La contraseña debe tener al menos 6 caracteres"],
    },

    // id del cliente en stripe - se guarda cuando añade metodo de pago
    // null hasta que activa su primer patrocinio
    stripeCustomerId: {
        type: String,
        default: null,
    },

    // metodo de pago guardado en stripe
    // null hasta que introduce su tarjeta
    stripePaymentMethodId: {
        type: String,
        default: null,
    },

    // indica si la empresa esta activa o ha sido suspendida
    activa: {
        type: Boolean,
        default: true,
    },

    // fechas de ultimo cambio de campos sensibles (limite: 1 vez cada 2 meses)
    nombreCambiadoEn: {
        type: Date,
        default: null,
    },
    correoCambiadoEn: {
        type: Date,
        default: null,
    },
    descripcionCambiadaEn: {
        type: Date,
        default: null,
    },

    // foto de perfil de la empresa
    fotoPerfil: {
        type: String,
        default: null,
    },
    fotoPerfilPublicId: {
        type: String,
        default: null,
    },

    // descripcion publica de la empresa
    descripcion: {
        type: String,
        default: null,
        maxlength: 500,
    },

    // cambio de correo pendiente de confirmacion
    correoNuevo: {
        type: String,
        default: null,
    },
    correoToken: {
        type: String,
        default: null,
    },
    correoTokenExpiracion: {
        type: Date,
        default: null,
    },

    // token para recuperar contraseña
    resetToken: {
        type: String,
        default: null,
    },

    // fecha de expiracion del token de recuperacion
    resetTokenExpiracion: {
        type: Date,
        default: null,
    },
    },
    {
    // añade automaticamente createdAt y updatedAt
    timestamps: true,
    }
);

// antes de guardar la empresa hasheamos la contraseña
empresaSchema.pre("save", async function () {
  // solo hasheamos si la contraseña ha cambiado
    if (!this.isModified("contrasena")) return;

  // generamos el salt y hasheamos la contraseña
    const salt = await bcrypt.genSalt(10);
    this.contrasena = await bcrypt.hash(this.contrasena, salt);
});

// metodo para comparar contraseñas al hacer login
// lo añadimos al schema para poder usarlo como empresa.compararContrasena()
empresaSchema.methods.compararContrasena = async function (contrasenaIntroducida) {
    return await bcrypt.compare(contrasenaIntroducida, this.contrasena);
};

module.exports = mongoose.model("Empresa", empresaSchema);
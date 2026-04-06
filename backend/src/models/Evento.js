// modelo de evento - representa cada evento publicado por una empresa

const mongoose = require("mongoose");

const eventoSchema = new mongoose.Schema(
    {
    // titulo del evento
    titulo: {
        type: String,
        required: [true, "El título es obligatorio"],
        trim: true,
    },

    // descripcion larga del evento
    descripcion: {
        type: String,
        required: [true, "La descripción es obligatoria"],
    },

    // url de la imagen del evento
    // si es null se usara una imagen de picsum en el frontend
    imagen: {
        type: String,
        default: null,
    },

    // nombre del lugar donde se celebra
    venue: {
        type: String,
        required: [true, "El venue es obligatorio"],
        trim: true,
    },

    // direccion completa del lugar
    direccion: {
        type: String,
        required: [true, "La dirección es obligatoria"],
    },

    // coordenadas para el mapa
    ubicacion: {
        lat: { type: Number, default: null },
        lng: { type: Number, default: null },
    },

    // fecha del evento
    fecha: {
        type: Date,
        required: [true, "La fecha es obligatoria"],
    },

    // hora del evento en formato HH:MM
    hora: {
        type: String,
        required: [true, "La hora es obligatoria"],
    },

    // precio en euros - 0 si es gratuito
    precio: {
        type: Number,
        default: 0,
        min: [0, "El precio no puede ser negativo"],
    },

    // empresa que publica el evento
    // referencia al modelo Empresa
    empresa: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Empresa",
        required: true,
    },

    // sistema de patrocinio
    patrocinado: {
        type: Boolean,
        default: false,
    },

    // fecha en que se activo el patrocinio
    fechaInicioPatrocinio: {
        type: Date,
        default: null,
    },

    // fecha en que expira el patrocinio actual
    fechaFinPatrocinio: {
        type: Date,
        default: null,
    },

    // id de la suscripcion en stripe para el patrocinio
    stripeSubscriptionId: {
        type: String,
        default: null,
    },

    // indica si el aviso de renovacion ya fue enviado
    // se resetea cada mes cuando se renueva
    avisoPrevioEnviado: {
        type: Boolean,
        default: false,
    },

    // numero maximo de personas por inscripcion
    // null significa sin limite
    maxPersonasPorInscripcion: {
        type: Number,
        default: null,
    },

    // indica si el evento esta activo o ha sido eliminado
    activo: {
        type: Boolean,
        default: true,
    },
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model("Evento", eventoSchema);
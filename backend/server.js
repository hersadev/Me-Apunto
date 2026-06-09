const dotenv = require("dotenv");
dotenv.config({ override: true });

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const cookieParser = require("cookie-parser");
const { rateLimit } = require("express-rate-limit");
const mongoSanitizeBody = require("./src/middleware/mongoSanitizeBody");
const xssSanitize = require("./src/middleware/xssSanitize");
const conectarDB = require("./src/config/db");
const { iniciarCron } = require("./src/services/cronService");

conectarDB();

const app = express();

// redirige HTTP -> HTTPS en producción (Railway/Render pasan el protocolo original en x-forwarded-proto)
if (process.env.NODE_ENV === "production") {
  app.use((req, res, next) => {
    if (req.headers["x-forwarded-proto"] !== "https") {
      return res.redirect(301, "https://" + req.headers.host + req.url);
    }
    next();
  });
}

app.use(helmet({
  hsts: { maxAge: 31536000, includeSubDomains: true, preload: true },
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https://res.cloudinary.com", "https://picsum.photos"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      styleSrc: ["'self'", "https://fonts.googleapis.com"],
      frameSrc: ["https://www.google.com"],
    },
  },
}));

app.use(cors({
  origin: [
    "http://localhost:3000",
    "https://me-apunto-alpha.vercel.app"
  ],
  credentials: true
}));

app.use(cookieParser());
app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true, limit: "10kb" }));
app.use(mongoSanitizeBody);
app.use(xssSanitize);

// limita a 10 intentos por IP cada 15 minutos en rutas de autenticación
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  message: { mensaje: "Demasiados intentos. Inténtalo de nuevo en 15 minutos." },
  standardHeaders: "draft-7",
  legacyHeaders: false,
});

// limita el formulario de contacto a 5 mensajes por hora
const contactoLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 5,
  message: { mensaje: "Has enviado demasiados mensajes. Inténtalo más tarde." },
  standardHeaders: "draft-7",
  legacyHeaders: false,
});

// limita suscripciones a 20 por hora por IP
const suscripcionLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 20,
  message: { mensaje: "Demasiadas suscripciones. Inténtalo más tarde." },
  standardHeaders: "draft-7",
  legacyHeaders: false,
});

// limita bajas de suscripción a 20 por hora por IP
const bajaLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 20,
  message: { mensaje: "Demasiadas peticiones. Inténtalo más tarde." },
  standardHeaders: "draft-7",
  legacyHeaders: false,
});

// limita envío de mensajes a empresas a 10 por hora por IP
const mensajeLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 10,
  message: { mensaje: "Has enviado demasiados mensajes. Inténtalo más tarde." },
  standardHeaders: "draft-7",
  legacyHeaders: false,
});

// limita el endpoint de reset de contraseña a 5 intentos por 15 minutos
const resetLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  message: { mensaje: "Demasiados intentos. Inténtalo de nuevo en 15 minutos." },
  standardHeaders: "draft-7",
  legacyHeaders: false,
});

// limita el contador de vistas de eventos: 10 por minuto por IP
const vistaLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 10,
  message: { mensaje: "Demasiadas peticiones." },
  standardHeaders: "draft-7",
  legacyHeaders: false,
});

// limita la cancelación de inscripciones por enlace: 20 por hora por IP
const cancelarInscripcionLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 20,
  message: { mensaje: "Demasiadas peticiones. Inténtalo más tarde." },
  standardHeaders: "draft-7",
  legacyHeaders: false,
});


app.use("/api/auth/login", authLimiter);
app.use("/api/auth/register", authLimiter);
app.use("/api/auth/recuperar", authLimiter);
app.use("/api/auth/reset", resetLimiter);
app.use("/api/inscripciones/cancelar", cancelarInscripcionLimiter);
app.use("/api/contacto", contactoLimiter);

app.use("/api/auth", require("./src/routes/authRoutes"));
app.use("/api/eventos", require("./src/routes/eventoRoutes"));
app.use("/api/inscripciones", require("./src/routes/inscripcionRoutes"));
app.use("/api/contacto", require("./src/routes/contactoRoutes"));
app.use("/api/suscripciones/baja", bajaLimiter);
app.use("/api/suscripciones", suscripcionLimiter, require("./src/routes/suscripcionEmpresaRoutes"));
app.use("/api/mensajes", mensajeLimiter, require("./src/routes/mensajeRoutes"));
app.use("/api/notificaciones", require("./src/routes/notificacionRoutes"));

app.get("/", (req, res) => {
    res.json({ mensaje: "API de Me Apunto funcionando correctamente" });
});

app.use((req, res) => {
    res.status(404).json({ mensaje: "Ruta no encontrada" });
});

// manejo de errores global - captura errores de multer y cloudinary
app.use((err, req, res, next) => {
    console.error("Error capturado:", err.message || err);

    if (err.name === "MulterError") {
        if (err.code === "LIMIT_FILE_SIZE") {
            return res.status(400).json({ mensaje: "La imagen no puede superar los 5MB" });
        }
        return res.status(400).json({ mensaje: "Error al procesar la imagen" });
    }

    if (err.message === "Solo se permiten imágenes") {
        return res.status(400).json({ mensaje: "Solo se permiten archivos de imagen (jpg, png, webp)" });
    }

    if (err.http_code) {
        return res.status(400).json({ mensaje: "Error al subir la imagen" });
    }

    console.error("Error no controlado:", err);
    res.status(500).json({ mensaje: "Error interno del servidor" });
});

iniciarCron();

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Servidor arrancado en puerto ${PORT}`);
});

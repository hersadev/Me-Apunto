const dotenv = require("dotenv");
dotenv.config({ override: true });

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const cookieParser = require("cookie-parser");
const { rateLimit } = require("express-rate-limit");
const conectarDB = require("./src/config/db");
const { iniciarCron } = require("./src/services/cronService");

conectarDB();

const app = express();

app.use(helmet());

app.use(cors({
  origin: [
    "http://localhost:3000",
    "https://me-apunto-alpha.vercel.app"
  ],
  credentials: true
}));

app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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

app.use("/api/auth/login", authLimiter);
app.use("/api/auth/register", authLimiter);
app.use("/api/auth/recuperar", authLimiter);
app.use("/api/contacto", contactoLimiter);

app.use("/api/auth", require("./src/routes/authRoutes"));
app.use("/api/eventos", require("./src/routes/eventoRoutes"));
app.use("/api/inscripciones", require("./src/routes/inscripcionRoutes"));
app.use("/api/contacto", require("./src/routes/contactoRoutes"));

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
        return res.status(400).json({ mensaje: "Error al subir la imagen a Cloudinary: " + err.message });
    }

    res.status(500).json({ mensaje: err.message || "Error interno del servidor" });
});

iniciarCron();

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Servidor arrancado en puerto ${PORT}`);
});

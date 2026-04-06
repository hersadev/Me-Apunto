// servidor principal de la aplicacion
const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const conectarDB = require("./src/config/db");
const { iniciarCron } = require("./src/services/cronService");

dotenv.config();
conectarDB();

const app = express();

app.use(cors({
  origin: [
    "http://localhost:3000",
    "https://me-apunto-alpha.vercel.app"
  ],
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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

// iniciamos las tareas programadas
iniciarCron();

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Servidor arrancado en puerto ${PORT}`);
});
    // controlador de contacto
    const { enviarCorreoContacto } = require("../services/emailService");

    const enviarMensajeContacto = async (req, res) => {
    try {
        const { nombre, email, asunto, contexto } = req.body;

        if (!nombre || !email || !asunto || !contexto) {
        return res.status(400).json({
            mensaje: "Todos los campos son obligatorios"
        });
        }

        // enviamos el correo real a juanjosehersa@gmail.com
        await enviarCorreoContacto({ nombre, email, asunto, contexto });

        console.log("mensaje de contacto enviado de:", email);

        res.json({
        mensaje: "Mensaje enviado correctamente"
        });

    } catch (error) {
        console.error("Error al enviar mensaje de contacto:", error);
        res.status(500).json({
        mensaje: "Error interno del servidor"
        });
    }
    };

    module.exports = { enviarMensajeContacto };
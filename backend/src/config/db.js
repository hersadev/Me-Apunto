
    // configuracion de la conexion a MongoDB
    // usamos mongoose como ODM para manejar los modelos

    const mongoose = require("mongoose");

    // funcion que conecta con la base de datos
    // se llama una sola vez al arrancar el servidor
    const conectarDB = async () => {
    try {
        // usamos la URI del archivo .env
        const conn = await mongoose.connect(process.env.MONGODB_URI);
        console.log(`MongoDB conectado: ${conn.connection.host}`);
    } catch (error) {
        // si falla la conexion cerramos el proceso
        console.error("Error al conectar MongoDB:", error.message);
        process.exit(1);
    }
    };

    module.exports = conectarDB;
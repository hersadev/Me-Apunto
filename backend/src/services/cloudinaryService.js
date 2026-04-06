    // servicio de cloudinary - gestiona la subida de imagenes de eventos
    // las imagenes se suben desde el backend y se guarda la URL en MongoDB
    // si la empresa no sube imagen el frontend usa picsum como fallback

    const cloudinary = require("cloudinary").v2;
    const { CloudinaryStorage } = require("multer-storage-cloudinary");
    const multer = require("multer");

    // configuracion de cloudinary con las credenciales del .env
    cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    });

    // configuracion del storage de multer con cloudinary
    // las imagenes se guardan en la carpeta "meapunto/eventos" de cloudinary
    const storage = new CloudinaryStorage({
    cloudinary,
    params: {
        folder: "meapunto/eventos",
        // permitimos jpg, png y webp
        allowed_formats: ["jpg", "jpeg", "png", "webp"],
        // transformacion automatica - redimensionamos a 800x600 maximo
        // para no guardar imagenes enormes innecesariamente
        transformation: [{ width: 800, height: 600, crop: "limit" }],
    },
    });

    // middleware de multer con el storage de cloudinary
    // limite de 5MB por imagen
    const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        // solo permitimos imagenes
        if (file.mimetype.startsWith("image/")) {
        cb(null, true);
        } else {
        cb(new Error("Solo se permiten imágenes"), false);
        }
    },
    });

    // funcion para eliminar una imagen de cloudinary
    // se llama cuando la empresa edita o elimina un evento
    const eliminarImagen = async (publicId) => {
    try {
        await cloudinary.uploader.destroy(publicId);
        console.log(`Imagen eliminada de Cloudinary: ${publicId}`);
    } catch (error) {
        console.error("Error al eliminar imagen de Cloudinary:", error);
    }
    };

    module.exports = { upload, eliminarImagen, cloudinary };
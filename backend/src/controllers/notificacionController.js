const Notificacion = require("../models/Notificacion");

// GET /api/notificaciones — obtiene notificaciones de la empresa logueada
const getNotificaciones = async (req, res) => {
  try {
    const notificaciones = await Notificacion.find({ empresa: req.empresa._id })
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();
    const noLeidas = await Notificacion.countDocuments({ empresa: req.empresa._id, leida: false });
    res.json({ notificaciones, noLeidas });
  } catch (err) {
    console.error("Error al obtener notificaciones:", err);
    res.status(500).json({ mensaje: "Error interno del servidor" });
  }
};

// PATCH /api/notificaciones/:id/leida — marca una notificación como leída
const marcarLeida = async (req, res) => {
  try {
    const result = await Notificacion.updateOne(
      { _id: req.params.id, empresa: req.empresa._id },
      { $set: { leida: true } }
    );
    if (result.matchedCount === 0) return res.status(404).json({ mensaje: "Notificación no encontrada" });
    res.json({ mensaje: "Notificación marcada como leída" });
  } catch (err) {
    res.status(500).json({ mensaje: "Error interno del servidor" });
  }
};

// PATCH /api/notificaciones/leidas — marca todas como leídas
const marcarTodasLeidas = async (req, res) => {
  try {
    await Notificacion.updateMany({ empresa: req.empresa._id, leida: false }, { $set: { leida: true } });
    res.json({ mensaje: "Todas marcadas como leídas" });
  } catch (err) {
    res.status(500).json({ mensaje: "Error interno del servidor" });
  }
};

module.exports = { getNotificaciones, marcarLeida, marcarTodasLeidas };

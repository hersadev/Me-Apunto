// panel de empresa - pagina privada para gestionar eventos
// conectado con el backend usando eventoService y authService

import React, { useState, useEffect, useRef } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import Cropper from "react-easy-crop";

import { useTranslation } from "react-i18next";

import Navbar from "../components/Navbar";
import Hero from "../components/Hero";
import Footer from "../components/Footer";

import authService from "../services/authService";
import eventoService from "../services/eventoService";
import mensajeService from "../services/mensajeService";
import suscripcionEmpresaService from "../services/suscripcionEmpresaService";
import notificacionService from "../services/notificacionService";
import inscripcionService from "../services/inscripcionService";

const POR_PAGINA = 8;

function ControlPagina({ pagina, total, setPagina }) {
  const totalPaginas = Math.ceil(total / POR_PAGINA);
  if (totalPaginas <= 1) return null;
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "12px", marginTop: "24px" }}>
      <button
        onClick={() => setPagina((p) => Math.max(1, p - 1))}
        disabled={pagina === 1}
        aria-label="Página anterior"
        style={{
          width: "36px", height: "36px", borderRadius: "50%",
          border: "1px solid #d4c4a8", backgroundColor: pagina === 1 ? "#f5f0e8" : "white",
          color: pagina === 1 ? "#c0b090" : "#91703d",
          cursor: pagina === 1 ? "default" : "pointer",
          fontSize: "18px", fontWeight: "700",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}
      >‹</button>
      <span style={{ fontFamily: "'Baloo Bhai 2', Helvetica", fontSize: "14px", color: "#4a4a4a" }}>
        {pagina} / {totalPaginas}
      </span>
      <button
        onClick={() => setPagina((p) => Math.min(totalPaginas, p + 1))}
        disabled={pagina === totalPaginas}
        aria-label="Página siguiente"
        style={{
          width: "36px", height: "36px", borderRadius: "50%",
          border: "1px solid #d4c4a8", backgroundColor: pagina === totalPaginas ? "#f5f0e8" : "white",
          color: pagina === totalPaginas ? "#c0b090" : "#91703d",
          cursor: pagina === totalPaginas ? "default" : "pointer",
          fontSize: "18px", fontWeight: "700",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}
      >›</button>
    </div>
  );
}

function crearImagen(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.addEventListener("load", () => resolve(img));
    img.addEventListener("error", reject);
    img.setAttribute("crossOrigin", "anonymous");
    img.src = url;
  });
}

const MAX_ANCHO_SALIDA = 1200;

async function recortarImagen(imageSrc, pixelCrop) {
  const image = await crearImagen(imageSrc);
  const canvas = document.createElement("canvas");

  // escalar al maximo util — por encima de 1200px no aporta calidad visible
  const escala = Math.min(1, MAX_ANCHO_SALIDA / pixelCrop.width);
  canvas.width = Math.round(pixelCrop.width * escala);
  canvas.height = Math.round(pixelCrop.height * escala);

  const ctx = canvas.getContext("2d");
  ctx.drawImage(
    image,
    pixelCrop.x, pixelCrop.y, pixelCrop.width, pixelCrop.height,
    0, 0, canvas.width, canvas.height
  );
  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), "image/jpeg", 0.82);
  });
}

function CompanyPanel({ setEstaLogueado }) {

  const navegar = useNavigate();
  const { t, i18n } = useTranslation();

  const [empresa, setEmpresa] = useState(authService.getEmpresa());

  const [eventosActivos, setEventosActivos] = useState([]);
  const [eventosPasados, setEventosPasados] = useState([]);
  const [eventosPapelera, setEventosPapelera] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  const [mensajes, setMensajes] = useState([]);
  const [cargandoMensajes, setCargandoMensajes] = useState(false);
  const [errorMensajes, setErrorMensajes] = useState("");
  const [mensajeSeleccionado, setMensajeSeleccionado] = useState(null);
  const [textoRespuesta, setTextoRespuesta] = useState("");
  const [enviandoRespuesta, setEnviandoRespuesta] = useState(false);
  const [respuestaExitosa, setRespuestaExitosa] = useState(false);
  const [errorRespuesta, setErrorRespuesta] = useState("");

  const [paginaActivos, setPaginaActivos] = useState(1);
  const [paginaPasados, setPaginaPasados] = useState(1);
  const [paginaPapelera, setPaginaPapelera] = useState(1);

  const [analiticas, setAnaliticas] = useState(null);
  const [cargandoAnaliticas, setCargandoAnaliticas] = useState(false);

  const [suscriptores, setSuscriptores] = useState(null);
  const [cargandoSuscriptores, setCargandoSuscriptores] = useState(false);
  const [seleccionados, setSeleccionados] = useState(new Set());
  const [asuntoCorreo, setAsuntoCorreo] = useState("");
  const [mensajeCorreo, setMensajeCorreo] = useState("");
  const [enviandoCorreo, setEnviandoCorreo] = useState(false);
  const [resultadoCorreo, setResultadoCorreo] = useState(null);

  const [notificaciones, setNotificaciones] = useState([]);
  const [cargandoNotificaciones, setCargandoNotificaciones] = useState(false);
  const [notificacionesNoLeidas, setNotificacionesNoLeidas] = useState(0);
  const [filtroNotificaciones, setFiltroNotificaciones] = useState("todas");

  const [modalDetalleEvento, setModalDetalleEvento] = useState(null);
  const [inscripcionesDetalle, setInscripcionesDetalle] = useState([]);
  const [cargandoDetalle, setCargandoDetalle] = useState(false);

  const [formularioAbierto, setFormularioAbierto] = useState(false);
  const [eventosPasadosAbierto, setEventosPasadosAbierto] = useState(false);
  const [papeleraAbierta, setPapeleraAbierta] = useState(false);
  const [editandoId, setEditandoId] = useState(null);
  const [restaurandoId, setRestaurandoId] = useState(null);
  const [modalEliminarDefinitivo, setModalEliminarDefinitivo] = useState(null);
  const [formEvento, setFormEvento] = useState({
    titulo: "",
    descripcion: "",
    venue: "",
    direccion: "",
    fecha: "",
    hora: "",
    precio: 0,
    categoria: "",
    maxPersonasPorInscripcion: "",
    capacidadMaxima: "",
  });

  const [imagenFile, setImagenFile] = useState(null);
  const [previewRecorte, setPreviewRecorte] = useState(null);
  const [modalRecorteAbierto, setModalRecorteAbierto] = useState(false);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [modalEliminar, setModalEliminar] = useState(null);
  const [modalEliminarMensaje, setModalEliminarMensaje] = useState(null);
  const [modalPatrocinio, setModalPatrocinio] = useState(null);
  const [pasoEliminarCuenta, setPasoEliminarCuenta] = useState(0);
  const SECCIONES_VALIDAS = ["eventos", "mensajes", "analiticas", "suscriptores", "notificaciones", "perfil"];

  const leerHash = () => {
    const h = window.location.hash.slice(1);
    return SECCIONES_VALIDAS.includes(h) ? h : "eventos";
  };

  const [seccionActiva, setSeccionActiva] = useState(leerHash);

  useEffect(() => {
    const onHashChange = () => setSeccionActiva(leerHash());
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const cambiarSeccion = (id) => {
    window.location.hash = id;
  };
  const [formPerfil, setFormPerfil] = useState({ nombre: "", correo: "", descripcion: "", contrasena: "" });
  const [perfilGuardando, setPerfilGuardando] = useState(false);
  const [perfilExito, setPerfilExito] = useState("");
  const [perfilError, setPerfilError] = useState("");
  const [fotoSubiendo, setFotoSubiendo] = useState(false);
  const [fotoError, setFotoError] = useState("");
  const [previewRecortePerfil, setPreviewRecortePerfil] = useState(null);
  const [modalRecortePerfilAbierto, setModalRecortePerfilAbierto] = useState(false);
  const [cropPerfil, setCropPerfil] = useState({ x: 0, y: 0 });
  const [zoomPerfil, setZoomPerfil] = useState(1);
  const [croppedAreaPixelsPerfil, setCroppedAreaPixelsPerfil] = useState(null);
  const [recortando, setRecortando] = useState(false);
  const [anchoVentana, setAnchoVentana] = useState(window.innerWidth);
  const esMobil = anchoVentana < 768;
  const fotoInputRef = useRef(null);
  const respuestaTimerRef = useRef(null);

  const modalEliminarRef = useRef(null);
  const modalCuentaRef = useRef(null);
  const modalPatrocinioRef = useRef(null);
  const imagenInputRef = useRef(null);

  useEffect(() => {
    if (modalEliminar === null || !modalEliminarRef.current) return;
    const focusable = modalEliminarRef.current.querySelectorAll(
      'button, input, textarea, select, [tabindex]:not([tabindex="-1"])'
    );
    if (focusable.length) focusable[0].focus();
  }, [modalEliminar]);

  useEffect(() => {
    if (pasoEliminarCuenta === 0 || !modalCuentaRef.current) return;
    const focusable = modalCuentaRef.current.querySelectorAll(
      'button, input, textarea, select, [tabindex]:not([tabindex="-1"])'
    );
    if (focusable.length) focusable[0].focus();
  }, [pasoEliminarCuenta]);

  useEffect(() => {
    if (modalPatrocinio === null || !modalPatrocinioRef.current) return;
    const focusable = modalPatrocinioRef.current.querySelectorAll(
      'button, input, textarea, select, [tabindex]:not([tabindex="-1"])'
    );
    if (focusable.length) focusable[0].focus();
  }, [modalPatrocinio]);

  const makeTrapHandler = (ref, onClose) => (e) => {
    if (e.key === "Escape") { onClose(); return; }
    if (e.key !== "Tab" || !ref.current) return;
    const focusable = Array.from(ref.current.querySelectorAll(
      'button, input, textarea, select, [tabindex]:not([tabindex="-1"])'
    ));
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault(); last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault(); first.focus();
    }
  };

  useEffect(() => {
    cargarEventos();
    cargarNotificaciones();
    return () => clearTimeout(respuestaTimerRef.current);
  }, []);

  useEffect(() => {
    const handler = () => setAnchoVentana(window.innerWidth);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);

  useEffect(() => {
    if (seccionActiva === "perfil") {
      setFormPerfil({ nombre: empresa?.nombre || "", correo: empresa?.correo || "", descripcion: empresa?.descripcion || "", contrasena: "" });
      setFotoError("");
      setPerfilExito("");
      setPerfilError("");
    }
    if (seccionActiva === "mensajes") {
      cargarMensajes();
    }
    if (seccionActiva === "analiticas" && !analiticas) {
      cargarAnaliticas();
    }
    if (seccionActiva === "suscriptores" && !suscriptores) {
      cargarSuscriptores();
    }
    if (seccionActiva === "notificaciones") {
      cargarNotificaciones();
    }
  }, [seccionActiva]);

  const cargarMensajes = async () => {
    setCargandoMensajes(true);
    setErrorMensajes("");
    try {
      const data = await mensajeService.getMensajes();
      setMensajes(data.mensajes || []);
    } catch (err) {
      if (err.response?.status !== 401) {
        setErrorMensajes("Error al cargar los mensajes. Inténtalo de nuevo.");
      }
    } finally {
      setCargandoMensajes(false);
    }
  };

  const cargarAnaliticas = async () => {
    setCargandoAnaliticas(true);
    setAnaliticas(null);
    try {
      const data = await eventoService.getAnaliticas();
      setAnaliticas(data);
    } catch (err) {
      console.error("Error al cargar analíticas:", err);
      setAnaliticas(null);
    } finally {
      setCargandoAnaliticas(false);
    }
  };

  const cargarSuscriptores = async () => {
    setCargandoSuscriptores(true);
    setSuscriptores(null);
    try {
      const data = await suscripcionEmpresaService.getSuscriptores();
      setSuscriptores(data.suscriptores || []);
    } catch (err) {
      console.error("Error al cargar suscriptores:", err);
      setSuscriptores(null);
    } finally {
      setCargandoSuscriptores(false);
    }
  };

  const cargarNotificaciones = async () => {
    setCargandoNotificaciones(true);
    try {
      const data = await notificacionService.getNotificaciones();
      setNotificaciones(data.notificaciones || []);
      setNotificacionesNoLeidas(data.noLeidas || 0);
    } catch (err) {
      if (err.response?.status !== 401) {
        console.error("Error al cargar notificaciones:", err);
      }
    } finally {
      setCargandoNotificaciones(false);
    }
  };

  const handleMarcarNotificacionLeida = async (id) => {
    try {
      await notificacionService.marcarLeida(id);
      setNotificaciones((prev) => prev.map((n) => n._id === id ? { ...n, leida: true } : n));
      setNotificacionesNoLeidas((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error("Error al marcar notificación:", err);
    }
  };

  const handleMarcarTodasLeidas = async () => {
    try {
      await notificacionService.marcarTodasLeidas();
      setNotificaciones((prev) => prev.map((n) => ({ ...n, leida: true })));
      setNotificacionesNoLeidas(0);
    } catch (err) {
      console.error("Error al marcar todas las notificaciones:", err);
    }
  };

  const handleEnviarCorreoSuscriptores = async () => {
    if (!asuntoCorreo.trim() || !mensajeCorreo.trim()) return;
    setEnviandoCorreo(true);
    setResultadoCorreo(null);
    try {
      const emails = seleccionados.size > 0 ? [...seleccionados] : [];
      const data = await suscripcionEmpresaService.enviarCorreoSuscriptores({
        asunto: asuntoCorreo,
        mensaje: mensajeCorreo,
        emails,
      });
      setResultadoCorreo({ ok: true, texto: data.mensaje });
      setAsuntoCorreo("");
      setMensajeCorreo("");
      setSeleccionados(new Set());
    } catch (err) {
      setResultadoCorreo({ ok: false, texto: err.response?.data?.mensaje || "Error al enviar" });
    } finally {
      setEnviandoCorreo(false);
    }
  };

  const handleMarcarLeido = async (id) => {
    try {
      await mensajeService.marcarLeido(id);
      setMensajes((prev) => prev.map((m) => m._id === id ? { ...m, leido: true } : m));
    } catch (err) {
      console.error("Error al marcar mensaje como leído:", err);
      cargarMensajes();
    }
  };

  const handleToggleRespondido = async (id) => {
    try {
      await mensajeService.marcarRespondido(id);
      setMensajes((prev) => prev.map((m) => m._id === id ? { ...m, respondido: !m.respondido, leido: true } : m));
    } catch (err) {
      console.error("Error al actualizar estado del mensaje:", err);
      cargarMensajes();
    }
  };

  const handleEliminarMensaje = async (id) => {
    try {
      await mensajeService.eliminarMensaje(id);
      setMensajes((prev) => prev.filter((m) => m._id !== id));
      if (mensajeSeleccionado?._id === id) setMensajeSeleccionado(null);
    } catch {
      setErrorMensajes("No se pudo eliminar el mensaje. Inténtalo de nuevo.");
    }
  };

  const handleResponder = async (id) => {
    if (!textoRespuesta.trim()) return;
    setEnviandoRespuesta(true);
    setErrorRespuesta("");
    try {
      await mensajeService.responderMensaje(id, textoRespuesta);
      setMensajes((prev) => prev.map((m) => m._id === id ? { ...m, respondido: true, leido: true } : m));
      setMensajeSeleccionado((prev) => prev?._id === id ? { ...prev, respondido: true, leido: true } : prev);
      setTextoRespuesta("");
      setRespuestaExitosa(true);
      clearTimeout(respuestaTimerRef.current);
      respuestaTimerRef.current = setTimeout(() => setRespuestaExitosa(false), 3000);
    } catch (err) {
      setErrorRespuesta(err.response?.data?.mensaje || "Error al enviar la respuesta");
    } finally {
      setEnviandoRespuesta(false);
    }
  };

  const cargarEventos = async () => {
    try {
      setCargando(true);
      const [resEventos, resPapelera] = await Promise.allSettled([
        eventoService.getMisEventos(),
        eventoService.getPapelera(),
      ]);

      if (resEventos.status === "fulfilled") {
        const activos = resEventos.value.eventosActivos;
        const pasados = resEventos.value.eventosPasados;
        setEventosActivos(activos);
        setEventosPasados(pasados);
        setPaginaActivos((p) => Math.min(p, Math.max(1, Math.ceil(activos.length / POR_PAGINA))));
        setPaginaPasados((p) => Math.min(p, Math.max(1, Math.ceil(pasados.length / POR_PAGINA))));
      } else {
        setError("Error al cargar los eventos");
        console.error(resEventos.reason);
      }

      if (resPapelera.status === "fulfilled") {
        const papel = resPapelera.value.eventos || [];
        setEventosPapelera(papel);
        setPaginaPapelera((p) => Math.min(p, Math.max(1, Math.ceil(papel.length / POR_PAGINA))));
      } else {
        console.error("Error al cargar la papelera:", resPapelera.reason);
      }
    } catch (err) {
      setError("Error al cargar los eventos");
      console.error(err);
    } finally {
      setCargando(false);
    }
  };

  const handleFormChange = (e) => {
    const { name, value, files } = e.target;
    if (name === "imagen") {
      const file = files[0];
      if (!file) return;
      if (previewRecorte) URL.revokeObjectURL(previewRecorte);
      const url = URL.createObjectURL(file);
      setPreviewRecorte(url);
      setCrop({ x: 0, y: 0 });
      setZoom(1);
      setModalRecorteAbierto(true);
    } else {
      setFormEvento((prev) => ({ ...prev, [name]: value }));
    }
  };

  const confirmarRecorte = async () => {
    if (recortando || !croppedAreaPixels) return;
    setRecortando(true);
    try {
      const blob = await recortarImagen(previewRecorte, croppedAreaPixels);
      const file = new File([blob], "imagen.jpg", { type: "image/jpeg" });
      setImagenFile(file);
      setModalRecorteAbierto(false);
      URL.revokeObjectURL(previewRecorte);
      setPreviewRecorte(null);
    } catch (err) {
      console.error("Error al recortar imagen:", err);
    } finally {
      setRecortando(false);
    }
  };

  const cancelarRecorte = () => {
    setModalRecorteAbierto(false);
    URL.revokeObjectURL(previewRecorte);
    setPreviewRecorte(null);
    if (imagenInputRef.current) imagenInputRef.current.value = "";
  };

  const abrirFormularioNuevo = () => {
    if (!empresa?.descripcion || empresa.descripcion.trim() === "") {
      setError("No puedes publicar eventos porque tu empresa no tiene descripción. Ve a Perfil y complétala primero.");
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    setError("");
    setEditandoId(null);
    setRestaurandoId(null);
    setFormEvento({
      titulo: "",
      descripcion: "",
      venue: empresa?.nombre || "",
      direccion: "",
      fecha: "",
      hora: "",
      precio: 0,
      categoria: "",
      maxPersonasPorInscripcion: "",
      capacidadMaxima: "",
    });
    setImagenFile(null);
    setFormularioAbierto(true);
    requestAnimationFrame(() => {
      document.getElementById("formulario-evento")?.scrollIntoView({ behavior: "smooth" });
    });
  };

const abrirFormularioEditar = (evento) => {
  setEditandoId(evento._id);
  setRestaurandoId(null);
  setFormEvento({
    titulo: evento.titulo,
    descripcion: evento.descripcion || "",
    venue: evento.venue,
    direccion: evento.direccion || "",
    fecha: evento.fecha ? evento.fecha.split("T")[0] : "",
    hora: evento.hora,
    precio: evento.precio,
    categoria: evento.categoria || "",
    maxPersonasPorInscripcion: evento.maxPersonasPorInscripcion || "",
    capacidadMaxima: evento.capacidadMaxima || "",
  });
  setImagenFile(null);
  setFormularioAbierto(true);
  setTimeout(() => {
    document.getElementById("formulario-evento")?.scrollIntoView({ behavior: "smooth" });
  }, 100);
};

const abrirFormularioRestaurar = (evento) => {
  setEditandoId(null);
  setRestaurandoId(evento._id);
  setFormEvento({
    titulo: evento.titulo,
    descripcion: evento.descripcion || "",
    venue: evento.venue,
    direccion: evento.direccion || "",
    fecha: evento.fecha ? evento.fecha.split("T")[0] : "",
    hora: evento.hora,
    precio: evento.precio,
    categoria: evento.categoria || "",
    maxPersonasPorInscripcion: evento.maxPersonasPorInscripcion || "",
    capacidadMaxima: evento.capacidadMaxima || "",
  });
  setImagenFile(null);
  setFormularioAbierto(true);
  setTimeout(() => {
    document.getElementById("formulario-evento")?.scrollIntoView({ behavior: "smooth" });
  }, 100);
};

  const handleSubmitEvento = async (e) => {
    e.preventDefault();
    setError("");

    try {
      if (restaurandoId !== null) {
        await eventoService.restaurarEvento(restaurandoId, formEvento, imagenFile);
      } else if (editandoId !== null) {
        await eventoService.editarEvento(editandoId, formEvento, imagenFile);
      } else {
        await eventoService.crearEvento(formEvento, imagenFile);
      }

      await cargarEventos();
      setFormularioAbierto(false);
      setEditandoId(null);
      setRestaurandoId(null);

    } catch (err) {
      setError(err.response?.data?.mensaje || "Error al guardar el evento");
    }
  };

  const eliminarEventoDefinitivo = async () => {
    try {
      await eventoService.eliminarEventoDefinitivo(modalEliminarDefinitivo);
      await cargarEventos();
      setModalEliminarDefinitivo(null);
    } catch (err) {
      setError(err.response?.data?.mensaje || "Error al eliminar el evento");
      setModalEliminarDefinitivo(null);
    }
  };

  const diasRestantesPapelera = (fechaEliminacion) => {
    if (!fechaEliminacion) return 30;
    const eliminado = new Date(fechaEliminacion);
    if (isNaN(eliminado.getTime())) return 30;
    const expira = new Date(eliminado);
    expira.setDate(expira.getDate() + 30);
    const diff = Math.ceil((expira - new Date()) / (1000 * 60 * 60 * 24));
    return Math.max(diff, 0);
  };

  const activosPagina = eventosActivos.slice((paginaActivos - 1) * POR_PAGINA, paginaActivos * POR_PAGINA);
  const pasadosPagina = eventosPasados.slice((paginaPasados - 1) * POR_PAGINA, paginaPasados * POR_PAGINA);
  const papeleraPagina = eventosPapelera.slice((paginaPapelera - 1) * POR_PAGINA, paginaPapelera * POR_PAGINA);

  const eliminarEvento = async () => {
    try {
      await eventoService.eliminarEvento(modalEliminar);
      await cargarEventos();
      setModalEliminar(null);
    } catch (err) {
      setError("Error al eliminar el evento");
    }
  };

  const confirmarPatrocinio = async () => {
    try {
      await eventoService.togglePatrocinio(modalPatrocinio._id);
      await cargarEventos();
      setModalPatrocinio(null);
    } catch (err) {
      setError("Error al cambiar el patrocinio");
      setModalPatrocinio(null);
    }
  };

  const handleSubirFoto = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFotoError("");
    const url = URL.createObjectURL(file);
    setPreviewRecortePerfil(url);
    setCropPerfil({ x: 0, y: 0 });
    setZoomPerfil(1);
    setModalRecortePerfilAbierto(true);
    if (fotoInputRef.current) fotoInputRef.current.value = "";
  };

  const confirmarRecortePerfil = async () => {
    if (fotoSubiendo || !croppedAreaPixelsPerfil) return;
    setFotoSubiendo(true);
    try {
      const blob = await recortarImagen(previewRecortePerfil, croppedAreaPixelsPerfil);
      const file = new File([blob], "foto-perfil.jpg", { type: "image/jpeg" });
      setModalRecortePerfilAbierto(false);
      URL.revokeObjectURL(previewRecortePerfil);
      setPreviewRecortePerfil(null);
      const res = await authService.actualizarFotoPerfil(file);
      setEmpresa(res.empresa);
    } catch (err) {
      setFotoError(err.response?.data?.mensaje || "Error al subir la foto");
    } finally {
      setFotoSubiendo(false);
    }
  };

  const cancelarRecortePerfil = () => {
    setModalRecortePerfilAbierto(false);
    URL.revokeObjectURL(previewRecortePerfil);
    setPreviewRecortePerfil(null);
  };

  const handleGuardarPerfil = async (e) => {
    e.preventDefault();
    setPerfilError("");
    setPerfilExito("");
    setPerfilGuardando(true);
    try {
      if (!formPerfil.contrasena.trim()) {
        setPerfilError("Debes introducir tu contraseña actual para guardar cambios.");
        setPerfilGuardando(false);
        return;
      }
      const datos = { contrasena: formPerfil.contrasena };
      if (formPerfil.nombre !== empresa?.nombre) datos.nombre = formPerfil.nombre;
      if (formPerfil.correo !== empresa?.correo) datos.correo = formPerfil.correo;
      if (formPerfil.descripcion !== (empresa?.descripcion || "")) datos.descripcion = formPerfil.descripcion;
      if (Object.keys(datos).filter((k) => k !== "contrasena").length === 0) {
        setPerfilExito("No hay cambios que guardar.");
        setPerfilGuardando(false);
        return;
      }
      const res = await authService.actualizarPerfil(datos);
      setEmpresa(res.empresa);
      setFormPerfil((p) => ({ ...p, contrasena: "" }));
      setPerfilExito(res.mensaje);
    } catch (err) {
      setPerfilError(err.response?.data?.mensaje || "Error al actualizar el perfil");
    } finally {
      setPerfilGuardando(false);
    }
  };

  const descargarCSV = (filas, nombre) => {
    const csv = filas
      .map((fila) => fila.map((v) => `"${String(v ?? "").replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = nombre;
    a.click();
    URL.revokeObjectURL(url);
  };

  const descargarPDF = async (titulo, cabeceras, filas, subtitulo) => {
    const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      const fontBuffer = await fetch(`${process.env.PUBLIC_URL}/fonts/Butterpop.ttf`, { signal: controller.signal })
        .then((r) => r.arrayBuffer())
        .finally(() => clearTimeout(timeoutId));
      const base64 = btoa(String.fromCharCode(...new Uint8Array(fontBuffer)));
      doc.addFileToVFS("Butterpop.ttf", base64);
      doc.addFont("Butterpop.ttf", "Butterpop", "normal");
    } catch { /* usa helvetica si no carga la fuente */ }

    const usaButterpop = doc.getFontList()["Butterpop"];

    const fechaDescarga = new Date().toLocaleDateString("es-ES", { day: "2-digit", month: "2-digit", year: "numeric" });
    const nombreEmpresa = empresa?.nombre || "";
    const anchoPage = doc.internal.pageSize.getWidth();

    // cabecera: "ME APUNTO" en dorado + empresa y fecha a la derecha
    doc.setFont(usaButterpop ? "Butterpop" : "helvetica", "normal");
    doc.setFontSize(20);
    doc.setTextColor(145, 112, 61);
    doc.text("ME APUNTO", 14, 16);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(80, 80, 80);
    if (nombreEmpresa) {
      doc.text(nombreEmpresa, anchoPage - 14, 12, { align: "right" });
    }
    doc.text(`Descargado el ${fechaDescarga}`, anchoPage - 14, nombreEmpresa ? 18 : 14, { align: "right" });

    // línea separadora
    doc.setDrawColor(210, 190, 160);
    doc.setLineWidth(0.3);
    doc.line(14, 21, anchoPage - 14, 21);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.setTextColor(30, 30, 30);
    doc.text(titulo, 14, 28);

    if (subtitulo) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      doc.text(subtitulo, 14, 34);
    }

    autoTable(doc, {
      head: [cabeceras],
      body: filas.map((f) => f.map((c) => String(c ?? ""))),
      startY: subtitulo ? 39 : 33,
      styles: { font: "helvetica", fontSize: 10, cellPadding: 4 },
      headStyles: { fillColor: [145, 112, 61], textColor: 255, fontStyle: "bold" },
      alternateRowStyles: { fillColor: [250, 246, 240] },
      margin: { left: 14, right: 14 },
    });

    const nombreFichero = titulo
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "") + ".pdf";
    doc.save(nombreFichero);
  };

  const abrirDetalleEvento = async (evento) => {
    setModalDetalleEvento(evento);
    setCargandoDetalle(true);
    setInscripcionesDetalle([]);
    try {
      const data = await inscripcionService.getInscripcionesEvento(evento._id);
      setInscripcionesDetalle(data.inscripciones || []);
    } catch (err) {
      console.error("Error al cargar inscripciones:", err);
    } finally {
      setCargandoDetalle(false);
    }
  };

  const cerrarSesion = async () => {
    await authService.logout();
    setEstaLogueado(false);
    navegar("/");
  };

  const eliminarCuenta = async () => {
    try {
      await authService.eliminarCuenta();
      setEstaLogueado(false);
      navegar("/");
    } catch (err) {
      setError("Error al eliminar la cuenta");
      setPasoEliminarCuenta(0);
    }
  };

  const estiloBotonPrimario = {
    backgroundColor: "#91703d",
    color: "white",
    fontFamily: "'Baloo Bhai 2', Helvetica",
    fontWeight: "700",
    fontSize: "16px",
    padding: "10px 24px",
    borderRadius: "999px",
    border: "none",
    cursor: "pointer",
    transition: "background-color 0.15s ease",
    minHeight: "44px"
  };

  const estiloBotonPeligro = {
    backgroundColor: "#c0392b",
    color: "white",
    fontFamily: "'Baloo Bhai 2', Helvetica",
    fontWeight: "700",
    fontSize: "13px",
    padding: "7px 16px",
    borderRadius: "999px",
    border: "none",
    cursor: "pointer",
    transition: "background-color 0.15s ease",
    minHeight: "44px"
  };

  const estiloBotonSecundario = {
    backgroundColor: "#b79868",
    color: "white",
    fontFamily: "'Baloo Bhai 2', Helvetica",
    fontWeight: "700",
    fontSize: "13px",
    padding: "7px 16px",
    borderRadius: "999px",
    border: "none",
    cursor: "pointer",
    transition: "background-color 0.15s ease",
    minHeight: "44px"
  };

  const estiloLabel = {
    fontFamily: "'Baloo Bhai 2', Helvetica",
    fontSize: "16px",
    fontWeight: "600",
    color: "#1a1a1a",
    display: "block",
    marginBottom: "4px"
  };

  const estiloInput = {
    width: "100%",
    height: "46px",
    backgroundColor: "#f8f8f8",
    paddingLeft: "12px",
    paddingRight: "12px",
    fontFamily: "'Baloo Bhai 2', Helvetica",
    fontSize: "15px",
    color: "#1a1a1a",
    border: "1px solid #d4b896",
    borderRadius: "8px",
    outline: "none"
  };

  return (
    <div style={{
      minHeight: "100vh",
      backgroundColor: "#f0e8dc",
      display: "flex",
      flexDirection: "column"
    }}>

      <Helmet>
        <title>Mi Panel | Me Apunto</title>
        <meta name="description" content="Gestiona tus eventos, consulta las inscripciones y activa el patrocinio de tus eventos en Me Apunto." />
        <meta property="og:title" content="Panel de Empresa | Me Apunto" />
        <meta property="og:description" content="Gestiona tus eventos en Me Apunto." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://me-apunto-alpha.vercel.app/panel" />
        <meta name="robots" content="noindex, nofollow" />
        <html lang="es" />
      </Helmet>

      <div style={{ position: "relative" }}>
        <Navbar mostrarInicio={true} estaLogueado={true} enPanel={true} />
        <Hero mostrarBuscador={false} compacto={true} />
      </div>

      <main id="main-content" style={{
        flex: 1,
        width: "100%",
        maxWidth: "1100px",
        margin: "0 auto",
        padding: esMobil ? "24px 16px" : "40px 24px",
        boxSizing: "border-box"
      }}>

        {!empresa?.descripcion && (
          <div role="alert" style={{
            backgroundColor: "#fff8e1",
            border: "1px solid #ffe082",
            borderRadius: "10px",
            padding: "12px 20px",
            marginBottom: "20px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "12px"
          }}>
            <span style={{
              fontFamily: "'Baloo Bhai 2', Helvetica",
              fontSize: "14px",
              color: "#5d4037",
              lineHeight: "1.4"
            }}>
              {t("panel.noDescription")}
            </span>
            <button
              onClick={() => cambiarSeccion("perfil")}
              style={{
                backgroundColor: "#91703d",
                color: "white",
                fontFamily: "'Baloo Bhai 2', Helvetica",
                fontWeight: "700",
                fontSize: "13px",
                padding: "6px 16px",
                borderRadius: "999px",
                border: "none",
                cursor: "pointer",
                flexShrink: 0
              }}
            >
              {t("panel.goToProfile")}
            </button>
          </div>
        )}

        {error && (
          <div role="alert" style={{
            backgroundColor: "#fdecea",
            borderRadius: "8px",
            padding: "12px 16px",
            marginBottom: "20px",
            textAlign: "center"
          }}>
            <span style={{
              fontFamily: "'Baloo Bhai 2', Helvetica",
              fontSize: "15px",
              color: "#c0392b"
            }}>
              {error}
            </span>
          </div>
        )}

        {/* cabecera de empresa */}
        <h1 style={{
          fontFamily: "'Baloo Bhai 2', Helvetica",
          fontSize: "26px",
          fontWeight: "700",
          color: "#1a1a1a",
          margin: 0,
          marginBottom: "24px"
        }}>
          {t("panel.hello", { nombre: empresa?.nombre || "…" })}
        </h1>

        {/* tabs de navegación */}
        {(() => {
          const tabs = [
            { id: "eventos", label: t("panel.tabEvents") },
            { id: "mensajes", label: t("panel.tabMessages"), badge: mensajes.filter((m) => !m.leido).length || 0 },
            { id: "analiticas", label: t("panel.tabAnalytics") },
            { id: "suscriptores", label: t("panel.tabSubscribers") },
            { id: "notificaciones", label: t("panel.tabNotifications"), badge: notificacionesNoLeidas },
            { id: "perfil", label: t("panel.tabProfile") },
          ];
          return (
            <div style={{
              display: "flex",
              gap: esMobil ? "4px" : "8px",
              flexWrap: esMobil ? "nowrap" : "wrap",
              overflowX: esMobil ? "auto" : "visible",
              WebkitOverflowScrolling: "touch",
              marginBottom: "36px",
              backgroundColor: "white",
              borderRadius: esMobil ? "16px" : "999px",
              padding: "6px",
              boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
              width: esMobil ? "100%" : "fit-content",
              margin: "0 auto 36px auto",
              boxSizing: "border-box"
            }}>
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => cambiarSeccion(tab.id)}
                  style={{
                    fontFamily: "'Baloo Bhai 2', Helvetica",
                    fontWeight: "700",
                    fontSize: esMobil ? "12px" : "14px",
                    padding: esMobil ? "8px 12px" : "8px 20px",
                    borderRadius: "999px",
                    border: "none",
                    cursor: "pointer",
                    transition: "background-color 0.15s ease, color 0.15s ease",
                    backgroundColor: seccionActiva === tab.id ? "#91703d" : "transparent",
                    color: seccionActiva === tab.id ? "white" : "#4a4a4a",
                    flexShrink: 0,
                    minHeight: "44px",
                    whiteSpace: "nowrap",
                  }}
                >
                  <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    {tab.label}
                    {tab.badge > 0 && (
                      <span style={{
                        backgroundColor: seccionActiva === tab.id ? "white" : "#e53e3e",
                        color: seccionActiva === tab.id ? "#91703d" : "white",
                        borderRadius: "999px",
                        fontSize: "11px",
                        fontWeight: "700",
                        padding: "1px 7px",
                        lineHeight: "18px",
                        minWidth: "18px",
                        textAlign: "center"
                      }}>
                        {tab.badge}
                      </span>
                    )}
                  </span>
                </button>
              ))}
            </div>
          );
        })()}

        {/* formulario de evento — modal */}
        {formularioAbierto && (
          <div
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setFormularioAbierto(false);
                setEditandoId(null);
                setRestaurandoId(null);
              }
            }}
            style={{
              position: "fixed",
              inset: 0,
              backgroundColor: "rgba(0,0,0,0.5)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 1000,
              padding: "16px"
            }}
          >
          <div
            id="formulario-evento"
            style={{
              backgroundColor: "#c9aa80",
              borderRadius: "20px",
              padding: esMobil ? "20px 16px" : "28px 32px",
              boxShadow: "0 8px 32px rgba(0,0,0,0.25)",
              width: "100%",
              maxWidth: esMobil ? "calc(100vw - 32px)" : "960px",
              maxHeight: "96vh",
              overflowY: "auto",
              position: "relative"
            }}
          >
            <button
              type="button"
              onClick={() => {
                setFormularioAbierto(false);
                setEditandoId(null);
                setRestaurandoId(null);
              }}
              style={{
                position: "absolute",
                top: "16px",
                right: "20px",
                background: "none",
                border: "none",
                fontSize: "22px",
                cursor: "pointer",
                color: "#4a4a4a",
                lineHeight: 1,
                padding: "4px"
              }}
              aria-label="Cerrar formulario"
            >
              ✕
            </button>
            <h2 style={{
              fontFamily: "'Baloo Bhai 2', Helvetica",
              fontSize: "22px",
              fontWeight: "700",
              color: "#1a1a1a",
              marginBottom: "24px"
            }}>
              {restaurandoId !== null
                ? t("panel.formTitleRestore")
                : editandoId !== null
                  ? t("panel.formTitleEdit")
                  : t("panel.formTitleNew")}
            </h2>
            {restaurandoId !== null && (
              <p style={{
                fontFamily: "'Baloo Bhai 2', Helvetica",
                fontSize: "14px",
                color: "#4a4a4a",
                marginTop: "-16px",
                marginBottom: "20px"
              }}>
                {t("panel.formRestoreHint")}
              </p>
            )}

            <form
              onSubmit={handleSubmitEvento}
              style={{
                display: "grid",
                gridTemplateColumns: esMobil ? "1fr" : anchoVentana < 900 ? "1fr 1fr" : "1fr 1fr 1fr 1fr",
                gap: "12px"
              }}
            >

              {/* titulo */}
              <div style={{ gridColumn: "1 / -1", display: "flex", flexDirection: "column", gap: "4px" }}>
                <label style={estiloLabel} htmlFor="titulo">{t("panel.formTitleLabel")}</label>
                <input
                  id="titulo"
                  type="text"
                  name="titulo"
                  value={formEvento.titulo}
                  onChange={handleFormChange}
                  required
                  placeholder={t("panel.formTitlePlaceholder")}
                  style={estiloInput}
                />
              </div>

              {/* venue */}
              <div style={{ gridColumn: "span 2", display: "flex", flexDirection: "column", gap: "4px" }}>
                <label style={estiloLabel} htmlFor="venue">{t("panel.formVenueLabel")}</label>
                <input
                  id="venue"
                  type="text"
                  name="venue"
                  value={formEvento.venue}
                  onChange={handleFormChange}
                  required
                  placeholder={t("panel.formVenuePlaceholder")}
                  style={estiloInput}
                />
              </div>

              {/* direccion */}
              <div style={{ gridColumn: "span 2", display: "flex", flexDirection: "column", gap: "4px" }}>
                <label style={estiloLabel} htmlFor="direccion">{t("panel.formAddressLabel")}</label>
                <input
                  id="direccion"
                  type="text"
                  name="direccion"
                  value={formEvento.direccion}
                  onChange={handleFormChange}
                  required
                  placeholder={t("panel.formAddressPlaceholder")}
                  style={estiloInput}
                />
              </div>

              {/* fecha */}
              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                <label style={estiloLabel} htmlFor="fecha">{t("panel.formDateLabel")}</label>
                <input
                  id="fecha"
                  type="date"
                  name="fecha"
                  value={formEvento.fecha}
                  onChange={handleFormChange}
                  required
                  style={estiloInput}
                />
              </div>

              {/* hora */}
              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                <label style={estiloLabel} htmlFor="hora">{t("panel.formTimeLabel")}</label>
                <input
                  id="hora"
                  type="time"
                  name="hora"
                  value={formEvento.hora}
                  onChange={handleFormChange}
                  required
                  style={estiloInput}
                />
              </div>

              {/* precio */}
              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <label style={estiloLabel} htmlFor="precio">{t("panel.formPriceLabel")}</label>
                  <div
                    tabIndex={0}
                    role="img"
                    aria-label={t("panel.formPriceTooltip")}
                    onMouseEnter={(e) => { const t = e.currentTarget.querySelector("[data-tooltip]"); if (t) t.style.display = "block"; }}
                    onMouseLeave={(e) => { const t = e.currentTarget.querySelector("[data-tooltip]"); if (t) t.style.display = "none"; }}
                    onFocus={(e) => { const t = e.currentTarget.querySelector("[data-tooltip]"); if (t) t.style.display = "block"; }}
                    onBlur={(e) => { const t = e.currentTarget.querySelector("[data-tooltip]"); if (t) t.style.display = "none"; }}
                    style={{
                      position: "relative",
                      width: "16px", height: "16px",
                      borderRadius: "50%",
                      backgroundColor: "#b79868",
                      color: "white",
                      fontSize: "11px", fontWeight: "700",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      cursor: "default",
                      fontFamily: "'Baloo Bhai 2', Helvetica",
                      flexShrink: 0,
                    }}
                  >
                    ?
                    <div
                      data-tooltip
                      style={{
                        display: "none",
                        position: "absolute",
                        bottom: "calc(100% + 6px)",
                        left: "50%",
                        transform: "translateX(-50%)",
                        backgroundColor: "#3a2e1e",
                        color: "white",
                        fontSize: "12px",
                        fontFamily: "'Baloo Bhai 2', Helvetica",
                        padding: "6px 10px",
                        borderRadius: "8px",
                        whiteSpace: "nowrap",
                        boxShadow: "0 4px 12px rgba(0,0,0,0.25)",
                        pointerEvents: "none",
                        zIndex: 10,
                      }}
                    >
                      {t("panel.formPriceTooltip")}
                      <div style={{
                        position: "absolute",
                        top: "100%", left: "50%",
                        transform: "translateX(-50%)",
                        width: 0, height: 0,
                        borderLeft: "5px solid transparent",
                        borderRight: "5px solid transparent",
                        borderTop: "5px solid #3a2e1e",
                      }} />
                    </div>
                  </div>
                </div>
                <input
                  id="precio"
                  type="number"
                  name="precio"
                  value={formEvento.precio}
                  onChange={handleFormChange}
                  min="0"
                  step="0.01"
                  placeholder={t("panel.formPricePlaceholder")}
                  style={estiloInput}
                />
              </div>

              {/* categoria */}
              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                <label style={estiloLabel} htmlFor="categoria">{t("panel.formCategoryLabel")}</label>
                <select
                  id="categoria"
                  name="categoria"
                  value={formEvento.categoria}
                  onChange={handleFormChange}
                  required
                  style={estiloInput}
                >
                  <option value="" disabled hidden>{t("panel.formCategorySelect")}</option>
                  <option value="taller">{t("categories.taller")}</option>
                  <option value="exposicion">{t("categories.exposicion")}</option>
                  <option value="concurso">{t("categories.concurso")}</option>
                  <option value="concierto">{t("categories.concierto")}</option>
                  <option value="deporte">{t("categories.deporte")}</option>
                  <option value="gastronomia">{t("categories.gastronomia")}</option>
                  <option value="teatro">{t("categories.teatro")}</option>
                  <option value="otros">{t("categories.otros")}</option>
                </select>
              </div>

              {/* limite de personas por inscripcion */}
              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                <label style={estiloLabel} htmlFor="maxPersonasPorInscripcion">
                  {t("panel.formMaxPerLabel")}
                </label>
                <input
                  id="maxPersonasPorInscripcion"
                  type="number"
                  name="maxPersonasPorInscripcion"
                  value={formEvento.maxPersonasPorInscripcion}
                  onChange={handleFormChange}
                  min="1"
                  placeholder={t("panel.formMaxPerPlaceholder")}
                  style={estiloInput}
                />
              </div>

              {/* capacidad maxima total del evento */}
              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                <label style={estiloLabel} htmlFor="capacidadMaxima">
                  {t("panel.formCapacityLabel")}
                </label>
                <input
                  id="capacidadMaxima"
                  type="number"
                  name="capacidadMaxima"
                  value={formEvento.capacidadMaxima}
                  onChange={handleFormChange}
                  min="1"
                  placeholder={t("panel.formMaxPerPlaceholder")}
                  style={estiloInput}
                />
              </div>

              {/* imagen */}
              <div style={{ gridColumn: "span 2", display: "flex", flexDirection: "column", gap: "4px" }}>
                <label style={estiloLabel} htmlFor="imagen">{t("panel.formImageLabel")}</label>
                {imagenFile ? (
                  <div style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    backgroundColor: "#f8f8f8",
                    border: "1px solid #d4b896",
                    borderRadius: "8px",
                    padding: "10px 12px"
                  }}>
                    <span style={{
                      fontFamily: "'Baloo Bhai 2', Helvetica",
                      fontSize: "14px",
                      color: "#1a1a1a",
                      flex: 1,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap"
                    }}>
                      {imagenFile.name}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setImagenFile(null);
                        if (imagenInputRef.current) imagenInputRef.current.value = "";
                      }}
                      style={{
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        fontSize: "16px",
                        color: "#7a5c2e",
                        padding: "0 2px",
                        lineHeight: 1,
                        flexShrink: 0
                      }}
                      aria-label="Eliminar imagen seleccionada"
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <input
                    ref={imagenInputRef}
                    id="imagen"
                    type="file"
                    name="imagen"
                    accept="image/*"
                    onChange={handleFormChange}
                    title="Si no subes imagen se usará una imagen aleatoria automáticamente"
                    style={{ ...estiloInput, height: "auto", padding: "10px 12px", cursor: "pointer" }}
                  />
                )}
              </div>

              {/* descripcion */}
              <div style={{ gridColumn: "1 / -1", display: "flex", flexDirection: "column", gap: "4px" }}>
                <label style={estiloLabel} htmlFor="descripcion">{t("panel.formDescLabel")}</label>
                <textarea
                  id="descripcion"
                  name="descripcion"
                  value={formEvento.descripcion}
                  onChange={handleFormChange}
                  required
                  placeholder={t("panel.formDescPlaceholder")}
                  rows={3}
                  style={{
                    width: "100%",
                    backgroundColor: "#f8f8f8",
                    padding: "12px",
                    fontFamily: "'Baloo Bhai 2', Helvetica",
                    fontSize: "15px",
                    color: "#1a1a1a",
                    border: "1px solid #d4b896",
                    borderRadius: "8px",
                    outline: "none",
                    resize: "vertical"
                  }}
                />
              </div>

              {/* botones formulario */}
              <div style={{
                gridColumn: "1 / -1",
                display: "flex",
                flexDirection: esMobil ? "column" : "row",
                gap: "12px",
                justifyContent: "flex-end",
                marginTop: "4px"
              }}>
                <button
                  type="button"
                  onClick={() => {
                    setFormularioAbierto(false);
                    setEditandoId(null);
                    setRestaurandoId(null);
                  }}
                  style={{ ...estiloBotonPrimario, backgroundColor: "#818181" }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#5a5a5a"}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "#818181"}
                >
                  {t("panel.formCancel")}
                </button>

                <button
                  type="submit"
                  style={estiloBotonPrimario}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#7a5c2e"}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "#91703d"}
                >
                  {restaurandoId !== null
                    ? t("panel.formSubmitRestore")
                    : editandoId !== null
                      ? t("panel.formSubmitEdit")
                      : t("panel.formSubmitNew")}
                </button>
              </div>

            </form>
          </div>
          </div>
        )}

        {/* gestión de eventos */}
        {seccionActiva === "eventos" && (
        <div>
          <div style={{ display: "flex", flexDirection: esMobil ? "column" : "row", alignItems: esMobil ? "flex-start" : "center", justifyContent: "space-between", flexWrap: "wrap", gap: "12px", marginBottom: "20px" }}>
            <h2 style={{
              fontFamily: "'Baloo Bhai 2', Helvetica",
              fontSize: "22px",
              fontWeight: "700",
              color: "#1a1a1a",
              margin: 0
            }}>
              {t("panel.eventsTitle", { n: eventosActivos.length })}
            </h2>
            <button
              onClick={abrirFormularioNuevo}
              style={estiloBotonPrimario}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#7a5c2e"}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "#91703d"}
            >
              {t("panel.publishBtn")}
            </button>
          </div>

          {cargando && (
            <div style={{
              textAlign: "center",
              padding: "48px 0",
              color: "#818181",
              fontFamily: "'Baloo Bhai 2', Helvetica",
              fontSize: "18px"
            }}>
              {t("panel.loadingEvents")}
            </div>
          )}

          {!cargando && eventosActivos.length === 0 && (
            <div style={{
              textAlign: "center",
              padding: "48px 0",
              color: "#818181",
              fontFamily: "'Baloo Bhai 2', Helvetica",
              fontSize: "18px"
            }}>
              {t("panel.noEvents")}
            </div>
          )}

          {!cargando && eventosActivos.length > 0 && (
            <>
            <div style={{
              display: "grid",
              gridTemplateColumns: esMobil ? "1fr" : "repeat(auto-fill, minmax(240px, 1fr))",
              gap: "24px"
            }}>
              {activosPagina.map((evento) => (
                <div
                  key={evento._id}
                  style={{
                    backgroundColor: "white",
                    borderRadius: "16px",
                    overflow: "hidden",
                    boxShadow: "0 2px 12px rgba(0,0,0,0.08)",
                    display: "flex",
                    flexDirection: "column"
                  }}
                >
                  <div style={{ width: "100%", height: "160px", overflow: "hidden" }}>
                    <img
                      src={evento.imagen
                        ? evento.imagen
                        : `https://picsum.photos/seed/${evento._id}/400/300`
                      }
                      alt={evento.titulo}
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                  </div>

                  <div style={{ padding: "16px", flex: 1, display: "flex", flexDirection: "column", gap: "8px" }}>

                    <div style={{
                      fontFamily: "'Baloo Bhai 2', Helvetica",
                      fontSize: "15px",
                      fontWeight: "700",
                      color: "#1a1a1a",
                      lineHeight: "1.3"
                    }}>
                      {evento.titulo}
                    </div>

                    <div style={{
                      fontFamily: "'Baloo Bhai 2', Helvetica",
                      fontSize: "13px",
                      color: "#818181"
                    }}>
                      {evento.venue}
                    </div>

                    <div style={{
                      fontFamily: "'Baloo Bhai 2', Helvetica",
                      fontSize: "13px",
                      color: "#4a4a4a"
                    }}>
                      {evento.fecha ? new Date(evento.fecha).toLocaleDateString(i18n.language) : t("panel.noDate")} — {evento.hora}
                    </div>

                    {/* categoria badge */}
                    {evento.categoria && (
                      <div style={{
                        backgroundColor: "#f0e8dc",
                        color: "#91703d",
                        fontFamily: "'Baloo Bhai 2', Helvetica",
                        fontSize: "11px",
                        fontWeight: "700",
                        padding: "3px 10px",
                        borderRadius: "999px",
                        display: "inline-block",
                        alignSelf: "flex-start"
                      }}>
                        {t(`categories.${evento.categoria}`, { defaultValue: evento.categoria })}
                      </div>
                    )}

                    <div style={{
                      fontFamily: "'Baloo Bhai 2', Helvetica",
                      fontSize: "13px",
                      fontWeight: "600",
                      color: (evento.precio ?? 0) === 0 ? "#2e7d32" : "#91703d"
                    }}>
                      {(evento.precio ?? 0) === 0 ? t("panel.free") : `${evento.precio}€`}
                    </div>

                    {evento.capacidadMaxima && (
                      <div style={{
                        fontFamily: "'Baloo Bhai 2', Helvetica",
                        fontSize: "13px",
                        fontWeight: "600",
                        color: (evento.totalInscritos || 0) >= evento.capacidadMaxima ? "#c0392b" : "#4a4a4a"
                      }}>
                        👥 {evento.totalInscritos || 0}/{evento.capacidadMaxima} {t("panel.inscribed")}
                        {(evento.totalInscritos || 0) >= evento.capacidadMaxima && ` · ${t("panel.full")}`}
                      </div>
                    )}

                    {evento.patrocinado && (
                      <div style={{
                        backgroundColor: evento.cancelacionPatrocinio ? "#818181" : "#b79868",
                        color: "white",
                        fontFamily: "'Baloo Bhai 2', Helvetica",
                        fontSize: "11px",
                        fontWeight: "700",
                        padding: "3px 10px",
                        borderRadius: "999px",
                        display: "inline-block",
                        alignSelf: "flex-start"
                      }}>
                        {t("panel.sponsored")}{evento.cancelacionPatrocinio && evento.fechaFinPatrocinio
                          ? ` · ${t("panel.sponsoredUntil", { fecha: new Date(evento.fechaFinPatrocinio).toLocaleDateString(i18n.language) })}`
                          : ""}
                      </div>
                    )}

                    <div style={{ height: "1px", backgroundColor: "#f0e8dc", margin: "4px 0" }} />

                    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                      <div style={{ display: "flex", gap: "8px" }}>
                        <button
                          aria-label={`Editar evento: ${evento.titulo}`}
                          onClick={() => abrirFormularioEditar(evento)}
                          style={estiloBotonSecundario}
                          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#91703d"}
                          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "#b79868"}
                        >
                          <span aria-hidden="true">✏️</span> {t("panel.editBtn")}
                        </button>

                        <button
                          aria-label={`${t("panel.editBtn")}: ${evento.titulo}`}
                          onClick={() => setModalEliminar(evento._id)}
                          style={estiloBotonPeligro}
                          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#922b21"}
                          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "#c0392b"}
                        >
                          <span aria-hidden="true">🗑️</span> {t("panel.deleteBtn")}
                        </button>
                      </div>

                      <button
                        aria-label={
                          !evento.patrocinado
                            ? `Activar patrocinio de: ${evento.titulo} (10€/mes)`
                            : evento.cancelacionPatrocinio
                              ? `Reactivar patrocinio de: ${evento.titulo}`
                              : `Cancelar patrocinio de: ${evento.titulo}`
                        }
                        onClick={() => setModalPatrocinio(evento)}
                        style={{
                          ...estiloBotonSecundario,
                          backgroundColor: !evento.patrocinado
                            ? "#91703d"
                            : evento.cancelacionPatrocinio
                              ? "#2e7d32"
                              : "#818181",
                          width: "100%"
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.opacity = "0.85"}
                        onMouseLeave={(e) => e.currentTarget.style.opacity = "1"}
                      >
                        <span aria-hidden="true">⭐</span>{" "}
                        {!evento.patrocinado
                          ? t("panel.activateSponsor")
                          : evento.cancelacionPatrocinio
                            ? t("panel.reactivateSponsor")
                            : t("panel.cancelSponsor")}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <ControlPagina pagina={paginaActivos} total={eventosActivos.length} setPagina={setPaginaActivos} />
            </>
          )}

          {/* Eventos pasados */}
          {!cargando && eventosPasados.length > 0 && (
            <>
              <button
                type="button"
                onClick={() => setEventosPasadosAbierto((prev) => !prev)}
                aria-expanded={eventosPasadosAbierto}
                aria-controls="lista-eventos-pasados"
                style={{
                  background: "none",
                  border: "none",
                  padding: 0,
                  marginTop: "40px",
                  marginBottom: "20px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  fontFamily: "'Baloo Bhai 2', Helvetica",
                  fontSize: "22px",
                  fontWeight: "700",
                  color: "#1a1a1a"
                }}
              >
                <span
                  aria-hidden="true"
                  style={{
                    display: "inline-block",
                    transition: "transform 0.2s ease",
                    transform: eventosPasadosAbierto ? "rotate(90deg)" : "rotate(0deg)",
                    fontSize: "18px"
                  }}
                >
                  ▶
                </span>
                {t("panel.pastEvents", { n: eventosPasados.length })}
              </button>

              {eventosPasadosAbierto && (
                <>
                  <div
                    id="lista-eventos-pasados"
                    style={{
                      display: "grid",
                      gridTemplateColumns: esMobil ? "1fr" : "repeat(auto-fill, minmax(240px, 1fr))",
                      gap: "24px",
                      opacity: 0.75
                    }}
                  >
                    {pasadosPagina.map((evento) => (
                      <div
                        key={evento._id}
                        style={{
                          backgroundColor: "#f5f5f5",
                          borderRadius: "16px",
                          overflow: "hidden",
                          boxShadow: "0 2px 12px rgba(0,0,0,0.08)",
                          display: "flex",
                          flexDirection: "column"
                        }}
                      >
                        <div style={{ width: "100%", height: "160px", overflow: "hidden" }}>
                          <img
                            src={evento.imagen
                              ? evento.imagen
                              : `https://picsum.photos/seed/${evento._id}/400/300`
                            }
                            alt={evento.titulo}
                            style={{ width: "100%", height: "100%", objectFit: "cover", filter: "grayscale(30%)" }}
                          />
                        </div>

                        <div style={{ padding: "16px", flex: 1, display: "flex", flexDirection: "column", gap: "8px" }}>
                          <div style={{
                            fontFamily: "'Baloo Bhai 2', Helvetica",
                            fontSize: "15px",
                            fontWeight: "700",
                            color: "#1a1a1a",
                            lineHeight: "1.3"
                          }}>
                            {evento.titulo}
                          </div>

                          <div style={{
                            fontFamily: "'Baloo Bhai 2', Helvetica",
                            fontSize: "13px",
                            color: "#818181"
                          }}>
                            📅 {evento.fecha ? new Date(evento.fecha).toLocaleDateString(i18n.language) : t("panel.noDate")}
                            {evento.hora && ` · ${evento.hora.slice(0, 5)}`}
                          </div>

                          <div style={{
                            fontFamily: "'Baloo Bhai 2', Helvetica",
                            fontSize: "13px",
                            color: "#818181"
                          }}>
                            📍 {evento.venue}
                          </div>

                          <div style={{
                            fontFamily: "'Baloo Bhai 2', Helvetica",
                            fontSize: "13px",
                            color: "#818181"
                          }}>
                            👥 {evento.totalInscritos || 0} {t("panel.inscribed")}
                            {evento.capacidadMaxima && ` / ${evento.capacidadMaxima}`}
                          </div>

                          <div style={{
                            fontFamily: "'Baloo Bhai 2', Helvetica",
                            fontSize: "12px",
                            color: "#a0a0a0",
                            fontStyle: "italic"
                          }}>
                            {t("panel.eventEnded")}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <ControlPagina pagina={paginaPasados} total={eventosPasados.length} setPagina={setPaginaPasados} />
                </>
              )}
            </>
          )}

          {/* Papelera */}
          {!cargando && eventosPapelera.length > 0 && (
            <>
              <button
                type="button"
                onClick={() => setPapeleraAbierta((prev) => !prev)}
                aria-expanded={papeleraAbierta}
                aria-controls="lista-papelera"
                style={{
                  background: "none",
                  border: "none",
                  padding: 0,
                  marginTop: "40px",
                  marginBottom: "8px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  fontFamily: "'Baloo Bhai 2', Helvetica",
                  fontSize: "22px",
                  fontWeight: "700",
                  color: "#1a1a1a"
                }}
              >
                <span
                  aria-hidden="true"
                  style={{
                    display: "inline-block",
                    transition: "transform 0.2s ease",
                    transform: papeleraAbierta ? "rotate(90deg)" : "rotate(0deg)",
                    fontSize: "18px"
                  }}
                >
                  ▶
                </span>
                <span aria-hidden="true">🗑️</span> {t("panel.trashTitle", { n: eventosPapelera.length })}
              </button>

              <p style={{
                fontFamily: "'Baloo Bhai 2', Helvetica",
                fontSize: "13px",
                color: "#6a6a6a",
                marginBottom: "20px"
              }}>
                {t("panel.trashInfo")}
              </p>

              {papeleraAbierta && (
                <>
                <div
                  id="lista-papelera"
                  style={{
                    display: "grid",
                    gridTemplateColumns: esMobil ? "1fr" : "repeat(auto-fill, minmax(240px, 1fr))",
                    gap: "24px"
                  }}
                >
                  {papeleraPagina.map((evento) => {
                    const dias = diasRestantesPapelera(evento.fechaEliminacion);
                    return (
                      <div
                        key={evento._id}
                        style={{
                          backgroundColor: "#fdecea",
                          borderRadius: "16px",
                          overflow: "hidden",
                          boxShadow: "0 2px 12px rgba(0,0,0,0.08)",
                          display: "flex",
                          flexDirection: "column",
                          border: "1px solid #f5c6c2"
                        }}
                      >
                        <div style={{ width: "100%", height: "140px", overflow: "hidden" }}>
                          <img
                            src={evento.imagen
                              ? evento.imagen
                              : `https://picsum.photos/seed/${evento._id}/400/300`
                            }
                            alt={evento.titulo}
                            style={{ width: "100%", height: "100%", objectFit: "cover", filter: "grayscale(60%)" }}
                          />
                        </div>

                        <div style={{ padding: "16px", flex: 1, display: "flex", flexDirection: "column", gap: "8px" }}>
                          <div style={{
                            fontFamily: "'Baloo Bhai 2', Helvetica",
                            fontSize: "15px",
                            fontWeight: "700",
                            color: "#1a1a1a",
                            lineHeight: "1.3"
                          }}>
                            {evento.titulo}
                          </div>

                          <div style={{
                            fontFamily: "'Baloo Bhai 2', Helvetica",
                            fontSize: "13px",
                            color: "#818181"
                          }}>
                            📅 {evento.fecha ? new Date(evento.fecha).toLocaleDateString(i18n.language) : t("panel.noDate")}
                            {evento.hora && ` · ${evento.hora.slice(0, 5)}`}
                          </div>

                          <div style={{
                            fontFamily: "'Baloo Bhai 2', Helvetica",
                            fontSize: "13px",
                            color: "#818181"
                          }}>
                            📍 {evento.venue}
                          </div>

                          <div style={{
                            backgroundColor: dias <= 7 ? "#c0392b" : "#b79868",
                            color: "white",
                            fontFamily: "'Baloo Bhai 2', Helvetica",
                            fontSize: "12px",
                            fontWeight: "700",
                            padding: "4px 10px",
                            borderRadius: "999px",
                            display: "inline-block",
                            alignSelf: "flex-start"
                          }}>
                            {dias === 0
                              ? t("panel.trashToday")
                              : dias === 1
                                ? t("panel.trashOneDay")
                                : t("panel.trashDays", { n: dias })}
                          </div>

                          <div style={{ height: "1px", backgroundColor: "#f5c6c2", margin: "4px 0" }} />

                          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                            <button
                              aria-label={`Recuperar evento: ${evento.titulo}`}
                              onClick={() => abrirFormularioRestaurar(evento)}
                              style={estiloBotonSecundario}
                              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#91703d"}
                              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "#b79868"}
                            >
                              <span aria-hidden="true">♻️</span> {t("panel.restoreBtn")}
                            </button>

                            <button
                              aria-label={`${t("panel.deleteNowBtn")}: ${evento.titulo}`}
                              onClick={() => setModalEliminarDefinitivo(evento._id)}
                              style={estiloBotonPeligro}
                              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#922b21"}
                              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "#c0392b"}
                            >
                              <span aria-hidden="true">🗑️</span> {t("panel.deleteNowBtn")}
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <ControlPagina pagina={paginaPapelera} total={eventosPapelera.length} setPagina={setPaginaPapelera} />
                </>
              )}
            </>
          )}
        </div>
        )}

        {/* mensajes */}
        {seccionActiva === "mensajes" && (
          <div style={{ fontFamily: "'Baloo Bhai 2', Helvetica" }}>
            <h2 style={{ fontSize: "22px", fontWeight: "700", color: "#1a1a1a", marginBottom: "24px" }}>
              {t("panel.msgTitle")}
            </h2>

            {cargandoMensajes ? (
              <div style={{ textAlign: "center", padding: "48px 0", color: "#818181", fontSize: "18px" }}>
                {t("panel.msgLoading")}
              </div>
            ) : errorMensajes ? (
              <div style={{ textAlign: "center", padding: "48px 0", color: "#c0392b", fontSize: "16px", fontFamily: "'Baloo Bhai 2', Helvetica" }}>
                {errorMensajes}
                <br />
                <button onClick={cargarMensajes} style={{ marginTop: "12px", background: "none", border: "none", color: "#91703d", fontWeight: "700", cursor: "pointer", fontSize: "14px", fontFamily: "'Baloo Bhai 2', Helvetica" }}>
                  {t("panel.msgRetry")}
                </button>
              </div>
            ) : mensajes.length === 0 ? (
              <div style={{ textAlign: "center", padding: "80px 0", color: "#818181", fontSize: "18px" }}>
                <div style={{ fontSize: "48px", marginBottom: "16px" }}>💬</div>
                {t("panel.msgEmpty")}
              </div>
            ) : (
              <div style={{ backgroundColor: "white", borderRadius: "16px", boxShadow: "0 2px 12px rgba(0,0,0,0.08)", overflow: "hidden" }}>
                <div style={{ overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
                  <table style={{ width: "100%", minWidth: esMobil ? "600px" : "auto", borderCollapse: "collapse" }}>
                    <thead>
                      <tr style={{ backgroundColor: "#f7f0e8", borderBottom: "1px solid #e8ddd0" }}>
                        <th style={{ width: "8px", padding: "12px 8px 12px 16px" }} />
                        <th style={{ padding: "12px 12px", textAlign: "left", fontSize: "13px", fontWeight: "700", color: "#818181" }}>{t("panel.msgColSender")}</th>
                        <th style={{ padding: "12px 12px", textAlign: "left", fontSize: "13px", fontWeight: "700", color: "#818181" }}>{t("panel.msgColSubject")}</th>
                        <th style={{ padding: "12px 12px", textAlign: "left", fontSize: "13px", fontWeight: "700", color: "#818181" }}>{t("panel.msgColEvent")}</th>
                        <th style={{ padding: "12px 12px", textAlign: "left", fontSize: "13px", fontWeight: "700", color: "#818181" }}>{t("panel.msgColStatus")}</th>
                        <th style={{ padding: "12px 16px 12px 12px", textAlign: "left", fontSize: "13px", fontWeight: "700", color: "#818181" }}>{t("panel.msgColDate")}</th>
                        <th style={{ padding: "12px 16px", textAlign: "right", fontSize: "13px", fontWeight: "700", color: "#818181" }}>{t("panel.msgColActions")}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {mensajes.map((m, i) => {
                        const expandido = mensajeSeleccionado?._id === m._id;
                        return (
                          <React.Fragment key={m._id}>
                            <tr
                              onClick={() => {
                                setMensajeSeleccionado(expandido ? null : m);
                                setTextoRespuesta("");
                                setErrorRespuesta("");
                                setRespuestaExitosa(false);
                                if (!m.leido) handleMarcarLeido(m._id);
                              }}
                              style={{
                                borderBottom: expandido ? "none" : (i < mensajes.length - 1 ? "1px solid #f0e8dc" : "none"),
                                backgroundColor: expandido ? "#fdf5eb" : "white",
                                cursor: "pointer",
                                transition: "background-color 0.1s ease",
                              }}
                              onMouseEnter={(e) => { if (!expandido) e.currentTarget.style.backgroundColor = "#fafafa"; }}
                              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = expandido ? "#fdf5eb" : "white"; }}
                            >
                              {/* punto no leído */}
                              <td style={{ padding: "14px 8px 14px 16px" }}>
                                {!m.leido && (
                                  <span style={{ display: "inline-block", width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "#3182ce" }} />
                                )}
                              </td>

                              {/* remitente */}
                              <td style={{ padding: "14px 12px" }}>
                                <span style={{ fontSize: "14px", fontWeight: m.leido ? "400" : "700", color: "#1a1a1a", display: "block" }}>
                                  {m.nombre}
                                </span>
                                <span style={{ fontSize: "12px", color: "#818181" }}>{m.de}</span>
                              </td>

                              {/* asunto */}
                              <td style={{ padding: "14px 12px", maxWidth: "180px" }}>
                                <span style={{ fontSize: "14px", fontWeight: m.leido ? "400" : "700", color: "#1a1a1a", display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                  {m.asunto}
                                </span>
                              </td>

                              {/* evento */}
                              <td style={{ padding: "14px 12px", maxWidth: "160px" }}>
                                {m.evento?.titulo ? (
                                  <span style={{ fontSize: "13px", color: "#91703d", fontWeight: "600", display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                    {m.evento.titulo}
                                  </span>
                                ) : (
                                  <span style={{ fontSize: "13px", color: "#ccc" }}>—</span>
                                )}
                              </td>

                              {/* estado */}
                              <td style={{ padding: "14px 12px" }}>
                                <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                                  {!m.leido && (
                                    <span style={{ fontSize: "11px", fontWeight: "700", padding: "2px 8px", borderRadius: "999px", backgroundColor: "#ebf4ff", color: "#2b6cb0" }}>
                                      {t("panel.msgUnread")}
                                    </span>
                                  )}
                                  {!m.respondido && (
                                    <span style={{ fontSize: "11px", fontWeight: "700", padding: "2px 8px", borderRadius: "999px", backgroundColor: "#fff5f5", color: "#c53030" }}>
                                      {t("panel.msgUnreplied")}
                                    </span>
                                  )}
                                  {m.respondido && (
                                    <span style={{ fontSize: "11px", fontWeight: "700", padding: "2px 8px", borderRadius: "999px", backgroundColor: "#f0fff4", color: "#276749" }}>
                                      {t("panel.msgReplied")}
                                    </span>
                                  )}
                                </div>
                              </td>

                              {/* fecha */}
                              <td style={{ padding: "14px 16px 14px 12px", whiteSpace: "nowrap" }}>
                                <span style={{ fontSize: "13px", color: "#818181" }}>
                                  {new Date(m.createdAt).toLocaleDateString("es-ES", { day: "2-digit", month: "short" })}
                                </span>
                              </td>

                              {/* acciones */}
                              <td style={{ padding: "14px 16px", textAlign: "right" }} onClick={(e) => e.stopPropagation()}>
                                <div style={{ display: "flex", gap: "6px", justifyContent: "flex-end" }}>
                                  {!m.leido && (
                                    <button
                                      title={t("panel.msgMarkRead")}
                                      onClick={() => handleMarcarLeido(m._id)}
                                      style={{ background: "none", border: "1px solid #d4b896", borderRadius: "6px", padding: "4px 8px", fontSize: "13px", cursor: "pointer", color: "#818181" }}
                                    >
                                      {t("panel.msgMarkRead")}
                                    </button>
                                  )}
                                  <button
                                    title={m.respondido ? t("panel.msgUnmark") : t("panel.msgMarkReplied")}
                                    onClick={() => handleToggleRespondido(m._id)}
                                    style={{ background: "none", border: `1px solid ${m.respondido ? "#c6f6d5" : "#d4b896"}`, borderRadius: "6px", padding: "4px 8px", fontSize: "13px", cursor: "pointer", color: m.respondido ? "#276749" : "#818181" }}
                                  >
                                    {m.respondido ? t("panel.msgUnmark") : t("panel.msgMarkReplied")}
                                  </button>
                                  <button
                                    title="Eliminar"
                                    onClick={() => setModalEliminarMensaje(m._id)}
                                    style={{ background: "none", border: "1px solid #fed7d7", borderRadius: "6px", padding: "4px 8px", fontSize: "13px", cursor: "pointer", color: "#c53030" }}
                                  >
                                    🗑
                                  </button>
                                </div>
                              </td>
                            </tr>

                            {/* fila expandida */}
                            {expandido && (
                              <tr style={{ backgroundColor: "#fdf5eb", borderBottom: i < mensajes.length - 1 ? "1px solid #f0e8dc" : "none" }}>
                                <td colSpan={7} style={{ padding: "0 20px 20px" }}>
                                  <div style={{ borderTop: "1px solid #ecdcc8", paddingTop: "16px" }}>

                                    {/* meta */}
                                    <div style={{ marginBottom: "16px", paddingBottom: "16px", borderBottom: "1px solid #ecdcc8" }}>
                                      <p style={{ fontSize: "14px", fontWeight: "700", color: "#1a1a1a", margin: "0 0 2px" }}>
                                        {m.nombre}
                                      </p>
                                      <p style={{ fontSize: "13px", color: "#818181", margin: "0 0 4px" }}>
                                        {m.de}
                                      </p>
                                      {m.evento?.titulo && (
                                        <p style={{ fontSize: "13px", color: "#91703d", margin: "0 0 4px", fontWeight: "600" }}>
                                          📅 {t("panel.msgFromEvent")} {m.evento.titulo}
                                        </p>
                                      )}
                                      <p style={{ fontSize: "12px", color: "#aaa", margin: 0 }}>
                                        {new Date(m.createdAt).toLocaleDateString("es-ES", { day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                                      </p>
                                    </div>

                                    {/* cuerpo */}
                                    <p style={{ fontSize: "14px", color: "#1a1a1a", lineHeight: "1.6", whiteSpace: "pre-wrap", margin: "0 0 20px" }}>
                                      {m.cuerpo}
                                    </p>

                                    {/* formulario respuesta */}
                                    <div style={{ borderTop: "1px solid #ecdcc8", paddingTop: "16px" }}>
                                      <label style={{ fontFamily: "'Baloo Bhai 2', Helvetica", fontSize: "13px", fontWeight: "700", color: "#1a1a1a", display: "block", marginBottom: "8px" }}>
                                        {t("panel.msgReplyTo", { nombre: m.nombre })}
                                      </label>
                                      <textarea
                                        value={textoRespuesta}
                                        onChange={(e) => setTextoRespuesta(e.target.value)}
                                        placeholder={t("panel.msgReplyPlaceholder")}
                                        rows={4}
                                        maxLength={2000}
                                        style={{ width: "100%", backgroundColor: "#f8f8f8", padding: "10px 12px", fontFamily: "'Baloo Bhai 2', Helvetica", fontSize: "14px", color: "#1a1a1a", border: "1px solid #d4b896", borderRadius: "8px", outline: "none", resize: "vertical", boxSizing: "border-box", marginBottom: "8px" }}
                                      />
                                      {errorRespuesta && (
                                        <p style={{ fontSize: "13px", color: "#c53030", margin: "0 0 8px", fontFamily: "'Baloo Bhai 2', Helvetica" }}>
                                          {errorRespuesta}
                                        </p>
                                      )}
                                      {respuestaExitosa && (
                                        <p style={{ fontSize: "13px", color: "#276749", margin: "0 0 8px", fontFamily: "'Baloo Bhai 2', Helvetica" }}>
                                          {t("panel.msgReplySent")}
                                        </p>
                                      )}
                                      <div style={{ display: "flex", gap: "8px" }}>
                                        <button
                                          onClick={() => handleResponder(m._id)}
                                          disabled={enviandoRespuesta || !textoRespuesta.trim()}
                                          style={{ flex: 1, padding: "10px 0", backgroundColor: enviandoRespuesta || !textoRespuesta.trim() ? "#ccc" : "#91703d", color: "white", border: "none", borderRadius: "999px", fontFamily: "'Baloo Bhai 2', Helvetica", fontWeight: "700", fontSize: "14px", cursor: enviandoRespuesta || !textoRespuesta.trim() ? "not-allowed" : "pointer" }}
                                        >
                                          {enviandoRespuesta ? t("panel.msgSending") : t("panel.msgSendReply")}
                                        </button>
                                        <button
                                          onClick={() => setModalEliminarMensaje(m._id)}
                                          style={{ padding: "10px 14px", backgroundColor: "#fff5f5", color: "#c53030", border: "1px solid #fed7d7", borderRadius: "999px", fontFamily: "'Baloo Bhai 2', Helvetica", fontWeight: "700", fontSize: "14px", cursor: "pointer" }}
                                        >
                                          🗑
                                        </button>
                                      </div>
                                    </div>

                                  </div>
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* analíticas */}
        {seccionActiva === "analiticas" && (
          <div style={{ fontFamily: "'Baloo Bhai 2', Helvetica" }}>
            <h2 style={{ fontSize: "22px", fontWeight: "700", color: "#1a1a1a", marginBottom: "24px" }}>
              {t("panel.analyticsTitle")}
            </h2>

            {cargandoAnaliticas && (
              <div style={{ textAlign: "center", padding: "48px 0", color: "#818181", fontSize: "18px" }}>
                {t("panel.analyticsLoading")}
              </div>
            )}

            {!cargandoAnaliticas && analiticas && (
              <>
                {/* tarjetas KPI */}
                <div style={{
                  display: "grid",
                  gridTemplateColumns: esMobil ? "1fr 1fr" : "repeat(5, 1fr)",
                  gap: "16px",
                  marginBottom: "36px"
                }}>
                  {[
                    { label: t("panel.kpiViews"), valor: analiticas.resumen.totalVistas, icono: "👁️" },
                    { label: t("panel.kpiSignups"), valor: analiticas.resumen.totalInscritos, icono: "✅" },
                    { label: t("panel.kpiSubscribers"), valor: analiticas.resumen.totalSuscriptores ?? 0, icono: "🔔" },
                    { label: t("panel.kpiActiveEvents"), valor: analiticas.resumen.totalEventosPublicados, icono: "📅" },
                    { label: t("panel.kpiPastEvents"), valor: analiticas.resumen.totalEventosPasados, icono: "🏁" },
                  ].map((kpi) => (
                    <div key={kpi.label} style={{
                      backgroundColor: "white",
                      borderRadius: "16px",
                      padding: "20px",
                      boxShadow: "0 2px 12px rgba(0,0,0,0.08)",
                      display: "flex",
                      flexDirection: "column",
                      gap: "6px"
                    }}>
                      <span style={{ fontSize: "28px" }}>{kpi.icono}</span>
                      <span style={{ fontSize: "32px", fontWeight: "700", color: "#91703d", lineHeight: 1 }}>
                        {kpi.valor.toLocaleString("es-ES")}
                      </span>
                      <span style={{ fontSize: "13px", color: "#818181", fontWeight: "600" }}>
                        {kpi.label}
                      </span>
                    </div>
                  ))}
                </div>

                {/* top eventos */}
                <div style={{
                  display: "grid",
                  gridTemplateColumns: esMobil ? "1fr" : "1fr 1fr",
                  gap: "24px"
                }}>
                  {/* top por vistas */}
                  <div style={{
                    backgroundColor: "white",
                    borderRadius: "16px",
                    padding: "20px 24px",
                    boxShadow: "0 2px 12px rgba(0,0,0,0.08)"
                  }}>
                    <h3 style={{ fontSize: "16px", fontWeight: "700", color: "#1a1a1a", marginBottom: "16px" }}>
                      {t("panel.topByViews")}
                    </h3>
                    {analiticas.topPorVistas.length === 0 ? (
                      <p style={{ fontSize: "14px", color: "#818181" }}>{t("panel.noDataYet")}</p>
                    ) : (
                      <ol style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: "10px" }}>
                        {analiticas.topPorVistas.map((ev, i) => (
                          <li key={ev._id} style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                            <span style={{
                              width: "24px", height: "24px", borderRadius: "50%",
                              backgroundColor: i === 0 ? "#91703d" : "#f0e8dc",
                              color: i === 0 ? "white" : "#91703d",
                              fontSize: "12px", fontWeight: "700",
                              display: "flex", alignItems: "center", justifyContent: "center",
                              flexShrink: 0
                            }}>{i + 1}</span>
                            <span style={{ flex: 1, fontSize: "14px", color: "#1a1a1a", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                              {ev.titulo}
                            </span>
                            <span style={{ fontSize: "14px", fontWeight: "700", color: "#91703d", flexShrink: 0 }}>
                              {ev.vistas.toLocaleString("es-ES")}
                            </span>
                          </li>
                        ))}
                      </ol>
                    )}
                  </div>

                  {/* top por inscritos */}
                  <div style={{
                    backgroundColor: "white",
                    borderRadius: "16px",
                    padding: "20px 24px",
                    boxShadow: "0 2px 12px rgba(0,0,0,0.08)"
                  }}>
                    <h3 style={{ fontSize: "16px", fontWeight: "700", color: "#1a1a1a", marginBottom: "16px" }}>
                      {t("panel.topBySignups")}
                    </h3>
                    {analiticas.topPorInscritos.length === 0 ? (
                      <p style={{ fontSize: "14px", color: "#818181" }}>{t("panel.noDataYet")}</p>
                    ) : (
                      <ol style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: "10px" }}>
                        {analiticas.topPorInscritos.map((ev, i) => (
                          <li key={ev._id} style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                            <span style={{
                              width: "24px", height: "24px", borderRadius: "50%",
                              backgroundColor: i === 0 ? "#91703d" : "#f0e8dc",
                              color: i === 0 ? "white" : "#91703d",
                              fontSize: "12px", fontWeight: "700",
                              display: "flex", alignItems: "center", justifyContent: "center",
                              flexShrink: 0
                            }}>{i + 1}</span>
                            <span style={{ flex: 1, fontSize: "14px", color: "#1a1a1a", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                              {ev.titulo}
                            </span>
                            <span style={{ fontSize: "14px", fontWeight: "700", color: "#91703d", flexShrink: 0 }}>
                              {ev.totalInscritos.toLocaleString("es-ES")}
                            </span>
                          </li>
                        ))}
                      </ol>
                    )}
                  </div>
                </div>

                {/* tasa de conversión y tasa de llenado */}
                <div style={{
                  display: "grid",
                  gridTemplateColumns: esMobil ? "1fr" : "1fr 1fr",
                  gap: "24px",
                  marginTop: "24px"
                }}>
                  {/* tasa de conversión */}
                  <div style={{ backgroundColor: "white", borderRadius: "16px", padding: "20px 24px", boxShadow: "0 2px 12px rgba(0,0,0,0.08)" }}>
                    <h3 style={{ fontSize: "16px", fontWeight: "700", color: "#1a1a1a", marginBottom: "4px" }}>
                      {t("panel.conversionRate")}
                    </h3>
                    <p style={{ fontSize: "12px", color: "#818181", marginBottom: "16px", marginTop: 0 }}>{t("panel.conversionSubtitle")}</p>
                    {analiticas.tasaConversion.length === 0 ? (
                      <p style={{ fontSize: "14px", color: "#818181" }}>{t("panel.noDataYet")}</p>
                    ) : (
                      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                        {analiticas.tasaConversion.map((ev) => (
                          <div key={String(ev._id)}>
                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                              <span style={{ fontSize: "13px", color: "#1a1a1a", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginRight: "8px" }}>
                                {ev.titulo}
                              </span>
                              <span style={{ fontSize: "13px", fontWeight: "700", color: "#91703d", flexShrink: 0 }}>
                                {ev.tasa}%
                              </span>
                            </div>
                            <div style={{ backgroundColor: "#f0e8dc", borderRadius: "4px", height: "6px" }}>
                              <div style={{ width: `${Math.min(100, ev.tasa)}%`, backgroundColor: "#91703d", borderRadius: "4px", height: "100%" }} />
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* tasa de llenado */}
                  <div style={{ backgroundColor: "white", borderRadius: "16px", padding: "20px 24px", boxShadow: "0 2px 12px rgba(0,0,0,0.08)" }}>
                    <h3 style={{ fontSize: "16px", fontWeight: "700", color: "#1a1a1a", marginBottom: "4px" }}>
                      {t("panel.fillRate")}
                    </h3>
                    <p style={{ fontSize: "12px", color: "#818181", marginBottom: "16px", marginTop: 0 }}>{t("panel.fillSubtitle")}</p>
                    {analiticas.tasaLlenado.length === 0 ? (
                      <p style={{ fontSize: "14px", color: "#818181" }}>{t("panel.noCapacityData")}</p>
                    ) : (
                      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                        {analiticas.tasaLlenado.slice(0, 8).map((ev) => (
                          <div key={String(ev._id)}>
                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "3px" }}>
                              <span style={{ fontSize: "13px", color: "#1a1a1a", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginRight: "8px" }}>
                                {ev.titulo}
                              </span>
                              <span style={{ fontSize: "13px", fontWeight: "700", color: ev.tasa >= 80 ? "#c0392b" : "#91703d", flexShrink: 0 }}>
                                {ev.tasa}%
                              </span>
                            </div>
                            <div style={{ backgroundColor: "#f0e8dc", borderRadius: "4px", height: "6px", marginBottom: "2px" }}>
                              <div style={{ width: `${ev.tasa}%`, backgroundColor: ev.tasa >= 80 ? "#e74c3c" : "#91703d", borderRadius: "4px", height: "100%" }} />
                            </div>
                            <span style={{ fontSize: "11px", color: "#818181" }}>{ev.inscritos}/{ev.capacidadMaxima} personas</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* top ciudades y evolución semanal */}
                <div style={{
                  display: "grid",
                  gridTemplateColumns: esMobil ? "1fr" : "1fr 1fr",
                  gap: "24px",
                  marginTop: "24px"
                }}>
                  {/* top ciudades */}
                  <div style={{ backgroundColor: "white", borderRadius: "16px", padding: "20px 24px", boxShadow: "0 2px 12px rgba(0,0,0,0.08)" }}>
                    <h3 style={{ fontSize: "16px", fontWeight: "700", color: "#1a1a1a", marginBottom: "4px" }}>
                      {t("panel.topCities")}
                    </h3>
                    <p style={{ fontSize: "12px", color: "#818181", marginBottom: "16px", marginTop: 0 }}>{t("panel.topCitiesSubtitle")}</p>
                    {analiticas.topCiudades.length === 0 ? (
                      <p style={{ fontSize: "14px", color: "#818181" }}>{t("panel.noDataYet")}</p>
                    ) : (
                      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                        {(() => {
                          const maxCiudad = analiticas.topCiudades[0]?.inscritos || 0;
                          return analiticas.topCiudades.map((c, i) => (
                            <div key={c.ciudad}>
                              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                                <span style={{ fontSize: "13px", color: "#1a1a1a", display: "flex", alignItems: "center", gap: "5px" }}>
                                  {i === 0 && <span>🥇</span>}
                                  {i === 1 && <span>🥈</span>}
                                  {i === 2 && <span>🥉</span>}
                                  {c.ciudad}
                                </span>
                                <span style={{ fontSize: "13px", fontWeight: "700", color: "#91703d", flexShrink: 0 }}>
                                  {c.inscritos.toLocaleString("es-ES")}
                                </span>
                              </div>
                              <div style={{ backgroundColor: "#f0e8dc", borderRadius: "4px", height: "6px" }}>
                                <div style={{ width: `${(c.inscritos / maxCiudad) * 100}%`, backgroundColor: "#91703d", borderRadius: "4px", height: "100%" }} />
                              </div>
                            </div>
                          ));
                        })()}
                      </div>
                    )}
                  </div>

                  {/* evolución de inscripciones por semana */}
                  <div style={{ backgroundColor: "white", borderRadius: "16px", padding: "20px 24px", boxShadow: "0 2px 12px rgba(0,0,0,0.08)" }}>
                    <h3 style={{ fontSize: "16px", fontWeight: "700", color: "#1a1a1a", marginBottom: "4px" }}>
                      {t("panel.weeklySignups")}
                    </h3>
                    <p style={{ fontSize: "12px", color: "#818181", marginBottom: "16px", marginTop: 0 }}>{t("panel.weeklySignupsSubtitle")}</p>
                    {analiticas.evolucionSemanal.length === 0 ? (
                      <p style={{ fontSize: "14px", color: "#818181" }}>{t("panel.noDataYet")}</p>
                    ) : (() => {
                      const maxSem = Math.max(...analiticas.evolucionSemanal.map((s) => s.inscritos));
                      return (
                        <div style={{ display: "flex", alignItems: "flex-end", gap: "6px", height: "120px", borderBottom: "1px solid #f0e8dc", paddingBottom: "4px" }}>
                          {analiticas.evolucionSemanal.map((s) => {
                            const pct = maxSem > 0 ? (s.inscritos / maxSem) * 100 : 0;
                            return (
                              <div key={s.semana} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", height: "100%", justifyContent: "flex-end" }}>
                                <span style={{ fontSize: "9px", color: "#91703d", fontWeight: "700", marginBottom: "2px" }}>{s.inscritos}</span>
                                <div style={{ width: "100%", height: `${pct}%`, backgroundColor: "#91703d", borderRadius: "3px 3px 0 0", minHeight: "4px" }} />
                                <span style={{ fontSize: "8px", color: "#818181", marginTop: "4px", whiteSpace: "nowrap" }}>{s.semana}</span>
                              </div>
                            );
                          })}
                        </div>
                      );
                    })()}
                  </div>
                </div>

                {/* eventos próximos a llenarse */}
                {analiticas.proximosALlenarse.length > 0 && (
                  <div style={{ backgroundColor: "white", borderRadius: "16px", padding: "20px 24px", boxShadow: "0 2px 12px rgba(0,0,0,0.08)", marginTop: "24px" }}>
                    <h3 style={{ fontSize: "16px", fontWeight: "700", color: "#1a1a1a", marginBottom: "4px" }}>
                      {t("panel.nearlyFull")}
                    </h3>
                    <p style={{ fontSize: "12px", color: "#818181", marginBottom: "16px", marginTop: 0 }}>{t("panel.nearlyFullSubtitle")}</p>
                    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                      {analiticas.proximosALlenarse.map((ev) => (
                        <div key={String(ev._id)} style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "12px",
                          padding: "12px",
                          backgroundColor: ev.tasa >= 95 ? "#fff5f5" : "#fffbf5",
                          borderRadius: "10px",
                          border: `1px solid ${ev.tasa >= 95 ? "#f5c6c6" : "#f0e8dc"}`
                        }}>
                          <div style={{
                            width: "46px", height: "46px", borderRadius: "50%",
                            backgroundColor: ev.tasa >= 95 ? "#e74c3c" : "#f39c12",
                            color: "white", fontSize: "12px", fontWeight: "700",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            flexShrink: 0
                          }}>
                            {ev.tasa}%
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={{ fontSize: "14px", fontWeight: "700", color: "#1a1a1a", margin: "0 0 2px 0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                              {ev.titulo}
                            </p>
                            <p style={{ fontSize: "12px", color: "#818181", margin: 0 }}>
                              {ev.inscritos}/{ev.capacidadMaxima} personas · {new Date(ev.fecha).toLocaleDateString("es-ES", { day: "numeric", month: "short" })}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* suscriptores: evolución semanal */}
                <div style={{
                  display: "grid",
                  gridTemplateColumns: esMobil ? "1fr" : "1fr 1fr",
                  gap: "24px",
                  marginTop: "24px"
                }}>
                  <div style={{ backgroundColor: "white", borderRadius: "16px", padding: "20px 24px", boxShadow: "0 2px 12px rgba(0,0,0,0.08)" }}>
                    <h3 style={{ fontSize: "16px", fontWeight: "700", color: "#1a1a1a", marginBottom: "4px" }}>
                      {t("panel.newSubscribers")}
                    </h3>
                    <p style={{ fontSize: "12px", color: "#818181", marginBottom: "16px", marginTop: 0 }}>{t("panel.newSubscribersSubtitle")}</p>
                    {(!analiticas.evolucionSuscriptores || analiticas.evolucionSuscriptores.length === 0) ? (
                      <p style={{ fontSize: "14px", color: "#818181" }}>{t("panel.noDataYet")}</p>
                    ) : (() => {
                      const maxSem = Math.max(...analiticas.evolucionSuscriptores.map((s) => s.nuevos));
                      return (
                        <div style={{ display: "flex", alignItems: "flex-end", gap: "6px", height: "120px", borderBottom: "1px solid #f0e8dc", paddingBottom: "4px" }}>
                          {analiticas.evolucionSuscriptores.map((s) => {
                            const pct = maxSem > 0 ? (s.nuevos / maxSem) * 100 : 0;
                            return (
                              <div key={s.semana} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", height: "100%", justifyContent: "flex-end" }}>
                                <span style={{ fontSize: "9px", color: "#b79868", fontWeight: "700", marginBottom: "2px" }}>{s.nuevos}</span>
                                <div style={{ width: "100%", height: `${pct}%`, backgroundColor: "#b79868", borderRadius: "3px 3px 0 0", minHeight: "4px" }} />
                                <span style={{ fontSize: "8px", color: "#818181", marginTop: "4px", whiteSpace: "nowrap" }}>{s.semana}</span>
                              </div>
                            );
                          })}
                        </div>
                      );
                    })()}
                  </div>

                  {/* inscripciones por evento — tabla completa */}
                  <div style={{ backgroundColor: "white", borderRadius: "16px", padding: "20px 24px", boxShadow: "0 2px 12px rgba(0,0,0,0.08)" }}>
                    <h3 style={{ fontSize: "16px", fontWeight: "700", color: "#1a1a1a", marginBottom: "4px" }}>
                      {t("panel.signupsByEvent")}
                    </h3>
                    <p style={{ fontSize: "12px", color: "#818181", marginBottom: "16px", marginTop: 0 }}>{t("panel.signupsByEventSubtitle")}</p>
                    {(!analiticas.inscripcionesPorEvento || analiticas.inscripcionesPorEvento.length === 0) ? (
                      <p style={{ fontSize: "14px", color: "#818181" }}>{t("panel.noEventsYet")}</p>
                    ) : (
                      <div style={{ display: "flex", flexDirection: "column", gap: "8px", maxHeight: "300px", overflowY: "auto" }}>
                        {analiticas.inscripcionesPorEvento.map((ev, i) => (
                          <div key={String(ev._id)} style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                            <span style={{
                              width: "22px", height: "22px", borderRadius: "50%", flexShrink: 0,
                              backgroundColor: i === 0 ? "#91703d" : "#f0e8dc",
                              color: i === 0 ? "white" : "#91703d",
                              fontSize: "11px", fontWeight: "700",
                              display: "flex", alignItems: "center", justifyContent: "center",
                            }}>{i + 1}</span>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <p style={{ fontSize: "13px", color: "#1a1a1a", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                {ev.titulo}
                              </p>
                              <p style={{ fontSize: "11px", color: "#a0a0a0", margin: 0 }}>
                                {ev.activo ? t("panel.active") : t("panel.past")} · {new Date(ev.fecha).toLocaleDateString(i18n.language, { day: "numeric", month: "short", year: "numeric" })}
                              </p>
                            </div>
                            <span style={{ fontSize: "14px", fontWeight: "700", color: "#91703d", flexShrink: 0 }}>
                              {ev.totalInscritos}
                              {ev.capacidadMaxima ? <span style={{ fontSize: "11px", color: "#a0a0a0", fontWeight: "400" }}>/{ev.capacidadMaxima}</span> : ""}
                            </span>
                            <button
                              onClick={() => abrirDetalleEvento(ev)}
                              title="Ver lista de inscritos"
                              style={{
                                backgroundColor: "#f0e8dc", color: "#91703d",
                                border: "none", borderRadius: "8px",
                                fontSize: "11px", fontWeight: "700",
                                padding: "4px 8px", cursor: "pointer",
                                fontFamily: "'Baloo Bhai 2', Helvetica",
                                flexShrink: 0,
                              }}
                            >
                              {t("panel.viewList")}
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* eventos con aforo completo */}
                {analiticas.aforoCompleto.length > 0 && (
                  <div style={{ backgroundColor: "white", borderRadius: "16px", padding: "20px 24px", boxShadow: "0 2px 12px rgba(0,0,0,0.08)", marginTop: "24px" }}>
                    <h3 style={{ fontSize: "16px", fontWeight: "700", color: "#1a1a1a", marginBottom: "4px" }}>
                      {t("panel.capacityFull")}
                    </h3>
                    <p style={{ fontSize: "12px", color: "#818181", marginBottom: "16px", marginTop: 0 }}>{t("panel.capacityFullSubtitle")}</p>
                    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                      {analiticas.aforoCompleto.map((ev) => (
                        <div key={String(ev._id)} style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "12px",
                          padding: "12px",
                          backgroundColor: "#fff5f5",
                          borderRadius: "10px",
                          border: "1px solid #f5c6c6"
                        }}>
                          <div style={{
                            width: "46px", height: "46px", borderRadius: "50%",
                            backgroundColor: "#c0392b",
                            color: "white", fontSize: "11px", fontWeight: "700",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            flexShrink: 0
                          }}>
                            {t("panel.fullBadge")}
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={{ fontSize: "14px", fontWeight: "700", color: "#1a1a1a", margin: "0 0 2px 0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                              {ev.titulo}
                            </p>
                            <p style={{ fontSize: "12px", color: "#818181", margin: 0 }}>
                              {ev.inscritos}/{ev.capacidadMaxima} personas · {new Date(ev.fecha).toLocaleDateString("es-ES", { day: "numeric", month: "short" })}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}

            {!cargandoAnaliticas && !analiticas && (
              <div style={{ textAlign: "center", padding: "48px 0", color: "#818181", fontSize: "16px" }}>
                {t("panel.analyticsError")}{" "}
                <button
                  onClick={cargarAnaliticas}
                  style={{ background: "none", border: "none", color: "#91703d", fontWeight: "700", cursor: "pointer", fontSize: "14px", fontFamily: "'Baloo Bhai 2', Helvetica" }}
                >
                  {t("panel.analyticsRetry")}
                </button>
              </div>
            )}
          </div>
        )}

        {/* suscriptores */}
        {seccionActiva === "suscriptores" && (
          <div style={{ fontFamily: "'Baloo Bhai 2', Helvetica" }}>
            <h2 style={{ fontSize: "22px", fontWeight: "700", color: "#1a1a1a", marginBottom: "24px" }}>
              {t("panel.subscribersTitle")}
            </h2>

            {cargandoSuscriptores && (
              <div style={{ textAlign: "center", padding: "48px 0", color: "#818181", fontSize: "18px" }}>
                {t("panel.subscribersLoading")}
              </div>
            )}

            {!cargandoSuscriptores && suscriptores === null && (
              <div style={{ textAlign: "center", padding: "48px 0", color: "#818181", fontSize: "16px" }}>
                {t("panel.subscribersError")}{" "}
                <button
                  onClick={cargarSuscriptores}
                  style={{ background: "none", border: "none", color: "#91703d", fontWeight: "700", cursor: "pointer", fontSize: "14px", fontFamily: "'Baloo Bhai 2', Helvetica" }}
                >
                  {t("panel.subscribersRetry")}
                </button>
              </div>
            )}

            {!cargandoSuscriptores && suscriptores !== null && (
              <div style={{ display: "grid", gridTemplateColumns: esMobil ? "1fr" : "1fr 1fr", gap: "24px", alignItems: "start" }}>

                {/* lista de suscriptores */}
                <div style={{ backgroundColor: "white", borderRadius: "16px", padding: "20px 24px", boxShadow: "0 2px 12px rgba(0,0,0,0.08)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexWrap: "wrap", gap: "8px" }}>
                    <h3 style={{ fontSize: "16px", fontWeight: "700", color: "#1a1a1a", margin: 0 }}>
                      👥 {suscriptores.length} suscriptor{suscriptores.length !== 1 ? "es" : ""}
                    </h3>
                    {suscriptores.length > 0 && (
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                        <button
                          onClick={() => {
                            if (seleccionados.size === suscriptores.length) {
                              setSeleccionados(new Set());
                            } else {
                              setSeleccionados(new Set(suscriptores.map((s) => s.email)));
                            }
                          }}
                          style={{ background: "none", border: "none", color: "#91703d", fontWeight: "700", cursor: "pointer", fontSize: "13px", fontFamily: "'Baloo Bhai 2', Helvetica" }}
                        >
                          {seleccionados.size === suscriptores.length ? t("panel.deselectAll") : t("panel.selectAll")}
                        </button>
                        <button
                          onClick={() => {
                            const filas = [
                              ["Email", "Fecha de suscripción"],
                              ...suscriptores.map((s) => [
                                s.email,
                                new Date(s.createdAt).toLocaleDateString("es-ES"),
                              ]),
                            ];
                            descargarCSV(filas, `suscriptores-${empresa?.nombre || "empresa"}.csv`);
                          }}
                          style={{ backgroundColor: "#f0e8dc", color: "#91703d", border: "none", borderRadius: "8px", fontSize: "12px", fontWeight: "700", padding: "5px 10px", cursor: "pointer", fontFamily: "'Baloo Bhai 2', Helvetica" }}
                        >
                          ↓ CSV
                        </button>
                        <button
                          onClick={() => {
                            descargarPDF(
                              `Suscriptores — ${empresa?.nombre || ""}`,
                              ["Email", "Fecha de suscripción"],
                              suscriptores.map((s) => [s.email, new Date(s.createdAt).toLocaleDateString("es-ES")]),
                              `Total: ${suscriptores.length} suscriptor${suscriptores.length !== 1 ? "es" : ""}`
                            );
                          }}
                          style={{ backgroundColor: "#91703d", color: "white", border: "none", borderRadius: "8px", fontSize: "12px", fontWeight: "700", padding: "5px 10px", cursor: "pointer", fontFamily: "'Baloo Bhai 2', Helvetica" }}
                        >
                          ↓ PDF
                        </button>
                      </div>
                    )}
                  </div>

                  {!suscriptores || suscriptores.length === 0 ? (
                    <p style={{ fontSize: "14px", color: "#818181" }}>{t("panel.noSubscribers")}</p>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: "6px", maxHeight: "400px", overflowY: "auto" }}>
                      {suscriptores.map((s) => (
                        <label key={s.email} style={{ display: "flex", alignItems: "center", gap: "10px", padding: "8px 10px", borderRadius: "8px", cursor: "pointer", backgroundColor: seleccionados.has(s.email) ? "#f0e8dc" : "transparent", transition: "background 0.15s" }}>
                          <input
                            type="checkbox"
                            checked={seleccionados.has(s.email)}
                            onChange={() => {
                              const nuevo = new Set(seleccionados);
                              if (nuevo.has(s.email)) nuevo.delete(s.email);
                              else nuevo.add(s.email);
                              setSeleccionados(nuevo);
                            }}
                            style={{ accentColor: "#91703d", width: "16px", height: "16px", flexShrink: 0 }}
                          />
                          <span style={{ fontSize: "13px", color: "#1a1a1a", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {s.email}
                          </span>
                          <span style={{ fontSize: "11px", color: "#818181", flexShrink: 0 }}>
                            {new Date(s.createdAt).toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" })}
                          </span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>

                {/* formulario de envío */}
                <div style={{ backgroundColor: "white", borderRadius: "16px", padding: "20px 24px", boxShadow: "0 2px 12px rgba(0,0,0,0.08)" }}>
                  <h3 style={{ fontSize: "16px", fontWeight: "700", color: "#1a1a1a", marginBottom: "4px" }}>
                    {t("panel.emailFormTitle")}
                  </h3>
                  <p style={{ fontSize: "12px", color: "#818181", marginBottom: "16px", marginTop: 0 }}>
                    {seleccionados.size > 0
                      ? `${seleccionados.size} ${t("panel.tabSubscribers").toLowerCase()}`
                      : suscriptores.length > 0 ? t("panel.emailFormToAll", { n: suscriptores.length }) : t("panel.emailFormNoSubs")}
                  </p>

                  <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                    <div>
                      <label style={{ fontSize: "13px", fontWeight: "600", color: "#1a1a1a", display: "block", marginBottom: "6px" }}>{t("panel.emailSubjectLabel")}</label>
                      <input
                        type="text"
                        value={asuntoCorreo}
                        onChange={(e) => setAsuntoCorreo(e.target.value)}
                        placeholder={t("panel.emailSubjectPlaceholder")}
                        maxLength={150}
                        style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid #e0d5c5", fontSize: "13px", fontFamily: "'Baloo Bhai 2', Helvetica", boxSizing: "border-box", outline: "none" }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: "13px", fontWeight: "600", color: "#1a1a1a", display: "block", marginBottom: "6px" }}>{t("panel.emailBodyLabel")}</label>
                      <textarea
                        value={mensajeCorreo}
                        onChange={(e) => setMensajeCorreo(e.target.value)}
                        placeholder={t("panel.emailBodyPlaceholder")}
                        rows={6}
                        maxLength={2000}
                        style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid #e0d5c5", fontSize: "13px", fontFamily: "'Baloo Bhai 2', Helvetica", resize: "vertical", boxSizing: "border-box", outline: "none" }}
                      />
                      <span style={{ fontSize: "11px", color: "#818181" }}>{mensajeCorreo.length}/2000</span>
                    </div>

                    {resultadoCorreo && (
                      <div style={{ padding: "10px 14px", borderRadius: "8px", backgroundColor: resultadoCorreo.ok ? "#f0fff4" : "#fff5f5", border: `1px solid ${resultadoCorreo.ok ? "#a3d9a5" : "#f5c6c6"}`, fontSize: "13px", color: resultadoCorreo.ok ? "#276749" : "#c0392b", fontWeight: "600" }}>
                        {resultadoCorreo.texto}
                      </div>
                    )}

                    <button
                      onClick={handleEnviarCorreoSuscriptores}
                      disabled={enviandoCorreo || !asuntoCorreo.trim() || !mensajeCorreo.trim() || !suscriptores || suscriptores.length === 0}
                      style={{
                        backgroundColor: "#91703d",
                        color: "white",
                        border: "none",
                        borderRadius: "10px",
                        padding: "12px",
                        fontSize: "14px",
                        fontWeight: "700",
                        fontFamily: "'Baloo Bhai 2', Helvetica",
                        cursor: enviandoCorreo || !asuntoCorreo.trim() || !mensajeCorreo.trim() || !suscriptores || suscriptores.length === 0 ? "not-allowed" : "pointer",
                        opacity: enviandoCorreo || !asuntoCorreo.trim() || !mensajeCorreo.trim() || !suscriptores || suscriptores.length === 0 ? 0.6 : 1,
                      }}
                    >
                      {enviandoCorreo ? t("panel.emailSending") : seleccionados.size > 0 ? t("panel.emailSendToSelected", { n: seleccionados.size }) : t("panel.emailSendToAll", { n: suscriptores.length })}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* notificaciones */}
        {seccionActiva === "notificaciones" && (
          <div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "12px", marginBottom: "16px" }}>
              <h2 style={{ fontFamily: "'Baloo Bhai 2', Helvetica", fontSize: "22px", fontWeight: "700", color: "#1a1a1a", margin: 0 }}>
                {t("panel.notifTitle")} {notificacionesNoLeidas > 0 && (
                  <span style={{ fontFamily: "'Baloo Bhai 2', Helvetica", fontSize: "14px", fontWeight: "700", backgroundColor: "#e53e3e", color: "white", borderRadius: "999px", padding: "2px 10px", marginLeft: "8px", verticalAlign: "middle" }}>
                    {notificacionesNoLeidas}
                  </span>
                )}
              </h2>
              {notificacionesNoLeidas > 0 && (
                <button
                  onClick={handleMarcarTodasLeidas}
                  style={{ ...estiloBotonSecundario, fontSize: "13px" }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#91703d"}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "#b79868"}
                >
                  {t("panel.notifMarkAllRead")}
                </button>
              )}
            </div>

            {/* filtros */}
            {!cargandoNotificaciones && notificaciones.length > 0 && (() => {
              const filtros = [
                { id: "todas", label: t("panel.notifFilterAll") },
                { id: "no_leidas", label: t("panel.notifFilterUnread") },
                { id: "inscripcion", label: t("panel.notifFilterSignup") },
                { id: "cancelacion_inscripcion", label: t("panel.notifFilterCancel") },
                { id: "suscripcion", label: t("panel.notifFilterSub") },
                { id: "mensaje", label: t("panel.notifFilterMsg") },
              ];
              return (
                <div style={{
                  display: "flex",
                  gap: "6px",
                  flexWrap: "wrap",
                  marginBottom: "20px",
                }}>
                  {filtros.map((f) => (
                    <button
                      key={f.id}
                      onClick={() => setFiltroNotificaciones(f.id)}
                      style={{
                        fontFamily: "'Baloo Bhai 2', Helvetica",
                        fontSize: "13px",
                        fontWeight: "600",
                        padding: "6px 14px",
                        borderRadius: "999px",
                        border: filtroNotificaciones === f.id ? "none" : "1px solid #d4c4a8",
                        backgroundColor: filtroNotificaciones === f.id ? "#91703d" : "white",
                        color: filtroNotificaciones === f.id ? "white" : "#4a4a4a",
                        cursor: "pointer",
                        transition: "all 0.15s ease",
                        minHeight: "36px",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              );
            })()}

            {cargandoNotificaciones && (
              <div style={{ textAlign: "center", padding: "48px 0", color: "#818181", fontFamily: "'Baloo Bhai 2', Helvetica", fontSize: "16px" }}>
                {t("panel.notifLoading")}
              </div>
            )}

            {!cargandoNotificaciones && notificaciones.length === 0 && (
              <div style={{ textAlign: "center", padding: "80px 0" }}>
                <div style={{ fontSize: "48px", marginBottom: "16px" }}>🔔</div>
                <p style={{ fontFamily: "'Baloo Bhai 2', Helvetica", fontSize: "16px", color: "#818181" }}>
                  {t("panel.notifEmpty")}
                </p>
              </div>
            )}

            {!cargandoNotificaciones && notificaciones.length > 0 && (() => {
              const notifFiltradas = notificaciones.filter((n) => {
                if (filtroNotificaciones === "todas") return true;
                if (filtroNotificaciones === "no_leidas") return !n.leida;
                return n.tipo === filtroNotificaciones;
              });
              return (
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {notifFiltradas.length === 0 && (
                  <div style={{ textAlign: "center", padding: "48px 0", color: "#818181", fontFamily: "'Baloo Bhai 2', Helvetica", fontSize: "15px" }}>
                    {t("panel.notifNoResults")}
                  </div>
                )}
                {notifFiltradas.map((n) => {
                  const icono = n.tipo === "inscripcion" ? "✅" : n.tipo === "cancelacion_inscripcion" ? "❌" : n.tipo === "suscripcion" ? "🔔" : "✉️";
                  const textoTipo = n.tipo === "inscripcion"
                    ? t("panel.notifTypeSignup")
                    : n.tipo === "cancelacion_inscripcion"
                    ? t("panel.notifTypeCancel")
                    : n.tipo === "suscripcion"
                    ? t("panel.notifTypeSub")
                    : t("panel.notifTypeMsg");

                  const fechaFormateada = new Date(n.createdAt).toLocaleDateString(i18n.language, { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });

                  return (
                    <div
                      key={n._id}
                      onClick={() => !n.leida && handleMarcarNotificacionLeida(n._id)}
                      style={{
                        backgroundColor: n.leida ? "white" : "#fffbf2",
                        border: n.leida ? "1px solid #e8e0d4" : "1px solid #f0c060",
                        borderRadius: "12px",
                        padding: esMobil ? "14px" : "16px 20px",
                        display: "flex",
                        alignItems: "flex-start",
                        gap: "14px",
                        cursor: n.leida ? "default" : "pointer",
                        transition: "background-color 0.15s ease",
                        boxShadow: n.leida ? "none" : "0 2px 8px rgba(240,192,96,0.15)",
                      }}
                    >
                      <div style={{ fontSize: "24px", flexShrink: 0, lineHeight: 1, paddingTop: "2px" }}>{icono}</div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap", marginBottom: "4px" }}>
                          <span style={{ fontFamily: "'Baloo Bhai 2', Helvetica", fontSize: "14px", fontWeight: "700", color: "#1a1a1a" }}>
                            {textoTipo}
                          </span>
                          {!n.leida && (
                            <span style={{ backgroundColor: "#e53e3e", color: "white", borderRadius: "999px", fontSize: "10px", fontWeight: "700", padding: "1px 7px", fontFamily: "'Baloo Bhai 2', Helvetica" }}>
                              {t("panel.notifNEW")}
                            </span>
                          )}
                        </div>

                        {(n.tipo === "inscripcion" || n.tipo === "cancelacion_inscripcion") && (
                          <>
                            <p style={{ fontFamily: "'Baloo Bhai 2', Helvetica", fontSize: "13px", color: "#4a4a4a", margin: "0 0 2px 0" }}>
                              <strong>{n.datos.nombre}</strong> ({n.datos.correo})
                              {n.datos.numPersonas > 1 && ` · ${n.datos.numPersonas} personas`}
                              {n.datos.eventoTitulo && <> · <em>{n.datos.eventoTitulo}</em></>}
                            </p>
                            {n.tipo === "cancelacion_inscripcion" && n.datos.motivoCancelacion && (
                              <p style={{
                                fontFamily: "'Baloo Bhai 2', Helvetica",
                                fontSize: "12px",
                                color: "#5a5a5a",
                                backgroundColor: "#f5f0e8",
                                borderRadius: "8px",
                                padding: "6px 10px",
                                margin: "4px 0 2px 0",
                                borderLeft: "3px solid #b79868",
                                fontStyle: "italic",
                              }}>
                                "{n.datos.motivoCancelacion}"
                              </p>
                            )}
                          </>
                        )}

                        {n.tipo === "suscripcion" && (
                          <p style={{ fontFamily: "'Baloo Bhai 2', Helvetica", fontSize: "13px", color: "#4a4a4a", margin: "0 0 2px 0" }}>
                            {t("panel.notifSubscribed", { email: n.datos.correo })}
                          </p>
                        )}

                        {n.tipo === "mensaje" && (
                          <p style={{ fontFamily: "'Baloo Bhai 2', Helvetica", fontSize: "13px", color: "#4a4a4a", margin: "0 0 2px 0" }}>
                            {t("panel.notifSentMsg", { nombre: n.datos.nombre, email: n.datos.correo })}
                          </p>
                        )}

                        <p style={{ fontFamily: "'Baloo Bhai 2', Helvetica", fontSize: "11px", color: "#a0a0a0", margin: 0 }}>
                          {fechaFormateada}
                          {!n.leida && <span style={{ marginLeft: "8px", color: "#b79868" }}>{t("panel.notifClickRead")}</span>}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
              );
            })()}
          </div>
        )}

        {/* perfil */}
        {seccionActiva === "perfil" && (
          <div>
            <h2 style={{
              fontFamily: "'Baloo Bhai 2', Helvetica",
              fontSize: "22px",
              fontWeight: "700",
              color: "#1a1a1a",
              marginBottom: "24px"
            }}>
              {t("panel.profileTitle")}
            </h2>

            <div style={{
              display: "grid",
              gridTemplateColumns: esMobil ? "1fr" : "1fr 260px",
              gap: "24px",
              alignItems: "start",
              marginBottom: "24px"
            }}>

            {/* columna izquierda — datos */}
            <form
              onSubmit={handleGuardarPerfil}
              style={{
                backgroundColor: "white",
                borderRadius: "16px",
                padding: "20px",
                boxShadow: "0 2px 12px rgba(0,0,0,0.08)",
                display: "flex",
                flexDirection: "column",
                gap: "12px",
                marginBottom: "24px"
              }}
            >
              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                <label style={{ ...estiloLabel, fontSize: "13px" }} htmlFor="perfil-nombre">{t("panel.profileNameLabel")}</label>
                <input
                  id="perfil-nombre"
                  type="text"
                  value={formPerfil.nombre}
                  onChange={(e) => setFormPerfil((p) => ({ ...p, nombre: e.target.value }))}
                  required
                  style={{ ...estiloInput, height: "38px", fontSize: "14px" }}
                />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                <label style={{ ...estiloLabel, fontSize: "13px" }} htmlFor="perfil-correo">{t("panel.profileEmailLabel")}</label>
                <input
                  id="perfil-correo"
                  type="email"
                  value={formPerfil.correo}
                  onChange={(e) => setFormPerfil((p) => ({ ...p, correo: e.target.value }))}
                  required
                  style={{ ...estiloInput, height: "38px", fontSize: "14px" }}
                />
              </div>

              {(() => {
                const bloqueadaHasta = empresa?.descripcionCambiadaEn
                  ? (() => {
                      const d = new Date(empresa.descripcionCambiadaEn);
                      if (isNaN(d.getTime())) return null;
                      d.setMonth(d.getMonth() + 2);
                      return new Date() < d ? d : null;
                    })()
                  : null;
                return (
                  <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                    <label style={{ ...estiloLabel, fontSize: "13px" }} htmlFor="perfil-descripcion">{t("panel.profileDescLabel")}</label>
                    <textarea
                      id="perfil-descripcion"
                      value={formPerfil.descripcion}
                      onChange={(e) => setFormPerfil((p) => ({ ...p, descripcion: e.target.value }))}
                      maxLength={500}
                      rows={3}
                      placeholder={t("panel.profileDescPlaceholder")}
                      style={{
                        width: "100%",
                        backgroundColor: "#f8f8f8",
                        padding: "10px 12px",
                        fontFamily: "'Baloo Bhai 2', Helvetica",
                        fontSize: "14px",
                        color: "#1a1a1a",
                        border: "1px solid #d4b896",
                        borderRadius: "8px",
                        outline: "none",
                        resize: "vertical",
                        boxSizing: "border-box"
                      }}
                    />
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      {bloqueadaHasta ? (
                        <span style={{ fontFamily: "'Baloo Bhai 2', Helvetica", fontSize: "11px", color: "#b79868" }}>
                          {t("panel.profileDescLocked", { fecha: bloqueadaHasta.toLocaleDateString(i18n.language) })}
                        </span>
                      ) : <span />}
                      <span style={{ fontFamily: "'Baloo Bhai 2', Helvetica", fontSize: "11px", color: "#b0b0b0" }}>
                        {formPerfil.descripcion.length}/500
                      </span>
                    </div>
                  </div>
                );
              })()}

              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                <label style={{ ...estiloLabel, fontSize: "13px" }} htmlFor="perfil-contrasena">{t("panel.profilePasswordLabel")}</label>
                <input
                  id="perfil-contrasena"
                  type="password"
                  value={formPerfil.contrasena}
                  onChange={(e) => setFormPerfil((p) => ({ ...p, contrasena: e.target.value }))}
                  required
                  placeholder={t("panel.profilePasswordPlaceholder")}
                  style={{ ...estiloInput, height: "38px", fontSize: "14px" }}
                />
              </div>

              <p style={{
                fontFamily: "'Baloo Bhai 2', Helvetica",
                fontSize: "12px",
                color: "#818181",
                margin: 0,
                lineHeight: "1.4"
              }}>
                {t("panel.profileChangeFreq")}
              </p>

              {perfilExito && (
                <div style={{
                  backgroundColor: "#e8f5e9",
                  borderRadius: "8px",
                  padding: "8px 12px",
                  fontFamily: "'Baloo Bhai 2', Helvetica",
                  fontSize: "13px",
                  color: "#2e7d32"
                }}>
                  {perfilExito}
                </div>
              )}
              {perfilError && (
                <div style={{
                  backgroundColor: "#fdecea",
                  borderRadius: "8px",
                  padding: "8px 12px",
                  fontFamily: "'Baloo Bhai 2', Helvetica",
                  fontSize: "13px",
                  color: "#c0392b"
                }}>
                  {perfilError}
                </div>
              )}

              <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <button
                  type="submit"
                  disabled={perfilGuardando}
                  style={{ ...estiloBotonPrimario, fontSize: "14px", padding: "8px 20px", opacity: perfilGuardando ? 0.7 : 1 }}
                  onMouseEnter={(e) => { if (!perfilGuardando) e.currentTarget.style.backgroundColor = "#7a5c2e"; }}
                  onMouseLeave={(e) => { if (!perfilGuardando) e.currentTarget.style.backgroundColor = "#91703d"; }}
                >
                  {perfilGuardando ? t("panel.profileSaving") : t("panel.profileSaveBtn")}
                </button>
              </div>
            </form>

            {/* columna derecha — foto de perfil */}
            <div style={{
              backgroundColor: "white",
              borderRadius: "16px",
              padding: "20px",
              boxShadow: "0 2px 12px rgba(0,0,0,0.08)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "16px"
            }}>
              <div style={{
                width: "120px", height: "120px",
                borderRadius: "50%",
                overflow: "hidden",
                border: "3px solid #d4b896",
                backgroundColor: "#f0e8dc",
                flexShrink: 0
              }}>
                {empresa?.fotoPerfil ? (
                  <img
                    src={empresa.fotoPerfil}
                    alt={t("panel.profilePhotoAlt")}
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
                ) : (
                  <div style={{
                    width: "100%", height: "100%",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: "40px", color: "#b79868"
                  }}>
                    🏢
                  </div>
                )}
              </div>

              <input
                ref={fotoInputRef}
                type="file"
                accept="image/*"
                onChange={handleSubirFoto}
                style={{ display: "none" }}
                id="foto-perfil-input"
              />
              <button
                type="button"
                onClick={() => fotoInputRef.current?.click()}
                disabled={fotoSubiendo}
                style={{
                  ...estiloBotonSecundario,
                  fontSize: "13px",
                  padding: "7px 18px",
                  opacity: fotoSubiendo ? 0.7 : 1,
                  width: "100%"
                }}
                onMouseEnter={(e) => { if (!fotoSubiendo) e.currentTarget.style.backgroundColor = "#91703d"; }}
                onMouseLeave={(e) => { if (!fotoSubiendo) e.currentTarget.style.backgroundColor = "#b79868"; }}
              >
                {fotoSubiendo ? t("panel.profileUploading") : t("panel.profileChangePhoto")}
              </button>

              {fotoError && (
                <p style={{
                  fontFamily: "'Baloo Bhai 2', Helvetica",
                  fontSize: "12px", color: "#c0392b",
                  margin: 0, textAlign: "center"
                }}>
                  {fotoError}
                </p>
              )}
            </div>

            </div>{/* fin grid */}

            <div style={{
              backgroundColor: "#fdecea",
              borderRadius: "12px",
              padding: "14px 18px",
              border: "1px solid #f5c6c2",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "16px",
              flexWrap: "wrap"
            }}>
              <div>
                <p style={{
                  fontFamily: "'Baloo Bhai 2', Helvetica",
                  fontSize: "14px",
                  fontWeight: "700",
                  color: "#c0392b",
                  margin: "0 0 2px 0"
                }}>
                  {t("panel.dangerTitle")}
                </p>
                <p style={{
                  fontFamily: "'Baloo Bhai 2', Helvetica",
                  fontSize: "13px",
                  color: "#4a4a4a",
                  margin: 0,
                  lineHeight: "1.4"
                }}>
                  {t("panel.dangerDesc")}
                </p>
              </div>
              <button
                onClick={() => setPasoEliminarCuenta(1)}
                style={{ ...estiloBotonPrimario, backgroundColor: "#c0392b", flexShrink: 0 }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#922b21"}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "#c0392b"}
              >
                {t("panel.dangerBtn")}
              </button>
            </div>
          </div>
        )}

      </main>

      <Footer />

      {/* modal recorte de imagen */}
      {modalRecorteAbierto && previewRecorte && (
        <div
          style={{
            position: "fixed", inset: 0,
            backgroundColor: "rgba(0,0,0,0.85)",
            zIndex: 1100, display: "flex",
            flexDirection: "column",
            alignItems: "center", justifyContent: "center",
            padding: "16px", gap: "16px"
          }}
        >
          <p style={{
            fontFamily: "'Baloo Bhai 2', Helvetica",
            fontSize: "16px", fontWeight: "700",
            color: "white", margin: 0
          }}>
            {t("panel.cropAdjust")}
          </p>

          {/* contenedor del recortador */}
          <div style={{ position: "relative", width: "100%", maxWidth: "600px", height: esMobil ? "220px" : "360px" }}>
            <Cropper
              image={previewRecorte}
              crop={crop}
              zoom={zoom}
              aspect={4 / 3}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={(_, pixels) => setCroppedAreaPixels(pixels)}
            />
          </div>

          {/* zoom slider */}
          <div style={{ display: "flex", alignItems: "center", gap: "12px", width: "100%", maxWidth: "600px" }}>
            <span style={{ color: "white", fontFamily: "'Baloo Bhai 2', Helvetica", fontSize: "13px", whiteSpace: "nowrap" }}>
              {t("panel.cropZoom")}
            </span>
            <input
              type="range"
              min={1} max={3} step={0.05}
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              style={{ flex: 1, accentColor: "#b79868" }}
            />
          </div>

          {/* botones */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: "12px", justifyContent: "center" }}>
            <button
              onClick={cancelarRecorte}
              style={{
                backgroundColor: "#818181", color: "white",
                fontFamily: "'Baloo Bhai 2', Helvetica", fontWeight: "700",
                fontSize: "15px", padding: "10px 24px",
                borderRadius: "999px", border: "none", cursor: "pointer",
                minHeight: "44px"
              }}
            >
              {t("panel.cropCancel")}
            </button>
            <button
              onClick={confirmarRecorte}
              disabled={recortando}
              style={{
                backgroundColor: "#b79868", color: "white",
                fontFamily: "'Baloo Bhai 2', Helvetica", fontWeight: "700",
                fontSize: "15px", padding: "10px 24px",
                borderRadius: "999px", border: "none",
                cursor: recortando ? "not-allowed" : "pointer",
                opacity: recortando ? 0.7 : 1,
                minHeight: "44px"
              }}
            >
              {recortando ? t("panel.cropProcessing") : t("panel.cropUse")}
            </button>
          </div>
        </div>
      )}

      {/* modal eliminar */}
      {modalEliminar !== null && (
        <div
          onClick={() => setModalEliminar(null)}
          style={{
            position: "fixed", inset: 0,
            backgroundColor: "rgba(0,0,0,0.65)",
            zIndex: 100, display: "flex",
            alignItems: "center", justifyContent: "center", padding: "16px"
          }}
        >
          <div
            ref={modalEliminarRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-eliminar-titulo"
            onKeyDown={makeTrapHandler(modalEliminarRef, () => setModalEliminar(null))}
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: "#f0e8dc", borderRadius: "20px",
              padding: esMobil ? "24px 16px" : "36px",
              maxWidth: esMobil ? "calc(100vw - 32px)" : "420px",
              width: "100%",
              textAlign: "center", boxShadow: "0 8px 32px rgba(0,0,0,0.2)"
            }}
          >
            <div aria-hidden="true" style={{ fontSize: "48px", marginBottom: "16px" }}>🗑️</div>
            <h3 id="modal-eliminar-titulo" style={{
              fontFamily: "'Baloo Bhai 2', Helvetica",
              fontSize: "20px", fontWeight: "700",
              color: "#1a1a1a", marginBottom: "12px"
            }}>
              {t("panel.modalTrashTitle")}
            </h3>
            <p style={{
              fontFamily: "'Baloo Bhai 2', Helvetica",
              fontSize: "15px", color: "#4a4a4a",
              marginBottom: "24px", lineHeight: "1.5"
            }}>
              {t("panel.modalTrashBody")}
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "12px", justifyContent: "center" }}>
              <button
                onClick={() => setModalEliminar(null)}
                style={{ ...estiloBotonPrimario, backgroundColor: "#818181", minHeight: "44px" }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#5a5a5a"}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "#818181"}
              >
                {t("panel.formCancel")}
              </button>
              <button
                onClick={eliminarEvento}
                style={{ ...estiloBotonPrimario, backgroundColor: "#c0392b", minHeight: "44px" }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#922b21"}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "#c0392b"}
              >
                {t("panel.modalTrashConfirm")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* modal eliminar definitivamente (desde papelera) */}
      {modalEliminarDefinitivo !== null && (
        <div
          onClick={() => setModalEliminarDefinitivo(null)}
          style={{
            position: "fixed", inset: 0,
            backgroundColor: "rgba(0,0,0,0.65)",
            zIndex: 100, display: "flex",
            alignItems: "center", justifyContent: "center", padding: "16px"
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-eliminar-def-titulo"
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => { if (e.key === "Escape") setModalEliminarDefinitivo(null); }}
            style={{
              backgroundColor: "#f0e8dc", borderRadius: "20px",
              padding: esMobil ? "24px 16px" : "36px",
              maxWidth: esMobil ? "calc(100vw - 32px)" : "420px",
              width: "100%",
              textAlign: "center", boxShadow: "0 8px 32px rgba(0,0,0,0.2)"
            }}
          >
            <div aria-hidden="true" style={{ fontSize: "48px", marginBottom: "16px" }}>⚠️</div>
            <h3 id="modal-eliminar-def-titulo" style={{
              fontFamily: "'Baloo Bhai 2', Helvetica",
              fontSize: "20px", fontWeight: "700",
              color: "#c0392b", marginBottom: "12px"
            }}>
              {t("panel.modalDeleteTitle")}
            </h3>
            <p style={{
              fontFamily: "'Baloo Bhai 2', Helvetica",
              fontSize: "15px", color: "#4a4a4a",
              marginBottom: "24px", lineHeight: "1.5"
            }}>
              {t("panel.modalDeleteBody")}
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "12px", justifyContent: "center" }}>
              <button
                onClick={() => setModalEliminarDefinitivo(null)}
                style={{ ...estiloBotonPrimario, backgroundColor: "#818181", minHeight: "44px" }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#5a5a5a"}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "#818181"}
              >
                {t("panel.formCancel")}
              </button>
              <button
                onClick={eliminarEventoDefinitivo}
                style={{ ...estiloBotonPrimario, backgroundColor: "#922b21", minHeight: "44px" }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#7b241c"}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "#922b21"}
              >
                {t("panel.modalDeleteConfirm")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* modal confirmar eliminar mensaje */}
      {modalEliminarMensaje !== null && (
        <div
          onClick={() => setModalEliminarMensaje(null)}
          style={{
            position: "fixed", inset: 0,
            backgroundColor: "rgba(0,0,0,0.65)",
            zIndex: 100, display: "flex",
            alignItems: "center", justifyContent: "center", padding: "16px"
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-eliminar-mensaje-titulo"
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => { if (e.key === "Escape") setModalEliminarMensaje(null); }}
            style={{
              backgroundColor: "#f0e8dc", borderRadius: "20px",
              padding: esMobil ? "24px 16px" : "36px",
              maxWidth: esMobil ? "calc(100vw - 32px)" : "420px",
              width: "100%",
              textAlign: "center", boxShadow: "0 8px 32px rgba(0,0,0,0.2)"
            }}
          >
            <div aria-hidden="true" style={{ fontSize: "48px", marginBottom: "16px" }}>🗑️</div>
            <h3 id="modal-eliminar-mensaje-titulo" style={{
              fontFamily: "'Baloo Bhai 2', Helvetica",
              fontSize: "20px", fontWeight: "700",
              color: "#1a1a1a", marginBottom: "12px"
            }}>
              {t("panel.modalMsgDeleteTitle")}
            </h3>
            <p style={{
              fontFamily: "'Baloo Bhai 2', Helvetica",
              fontSize: "15px", color: "#4a4a4a",
              marginBottom: "24px", lineHeight: "1.5"
            }}>
              {t("panel.modalMsgDeleteBody")}
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "12px", justifyContent: "center" }}>
              <button
                onClick={() => setModalEliminarMensaje(null)}
                style={{ ...estiloBotonPrimario, backgroundColor: "#818181", minHeight: "44px" }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#5a5a5a"}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "#818181"}
              >
                {t("panel.formCancel")}
              </button>
              <button
                onClick={() => { handleEliminarMensaje(modalEliminarMensaje); setModalEliminarMensaje(null); }}
                style={{ ...estiloBotonPrimario, backgroundColor: "#c0392b", minHeight: "44px" }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#922b21"}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "#c0392b"}
              >
                {t("panel.modalMsgDeleteConfirm")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* modal eliminar cuenta - paso 1 */}
      {pasoEliminarCuenta === 1 && (
        <div
          onClick={() => setPasoEliminarCuenta(0)}
          style={{
            position: "fixed", inset: 0,
            backgroundColor: "rgba(0,0,0,0.65)",
            zIndex: 100, display: "flex",
            alignItems: "center", justifyContent: "center", padding: "16px"
          }}
        >
          <div
            ref={modalCuentaRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-cuenta-titulo"
            onKeyDown={makeTrapHandler(modalCuentaRef, () => setPasoEliminarCuenta(0))}
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: "#f0e8dc", borderRadius: "20px",
              padding: esMobil ? "24px 16px" : "36px",
              maxWidth: esMobil ? "calc(100vw - 32px)" : "420px",
              width: "100%",
              textAlign: "center", boxShadow: "0 8px 32px rgba(0,0,0,0.2)"
            }}
          >
            <div aria-hidden="true" style={{ fontSize: "48px", marginBottom: "16px" }}>⚠️</div>
            <h3 id="modal-cuenta-titulo" style={{
              fontFamily: "'Baloo Bhai 2', Helvetica",
              fontSize: "20px", fontWeight: "700",
              color: "#1a1a1a", marginBottom: "12px"
            }}>
              {t("panel.modalAccountTitle1")}
            </h3>
            <p style={{
              fontFamily: "'Baloo Bhai 2', Helvetica",
              fontSize: "15px", color: "#4a4a4a",
              marginBottom: "24px", lineHeight: "1.5"
            }}>
              {t("panel.modalAccountBody1")}
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "12px", justifyContent: "center" }}>
              <button
                onClick={() => setPasoEliminarCuenta(0)}
                style={{ ...estiloBotonPrimario, backgroundColor: "#818181", minHeight: "44px" }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#5a5a5a"}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "#818181"}
              >
                {t("panel.formCancel")}
              </button>
              <button
                onClick={() => setPasoEliminarCuenta(2)}
                style={{ ...estiloBotonPrimario, backgroundColor: "#c0392b", minHeight: "44px" }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#922b21"}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "#c0392b"}
              >
                {t("panel.modalAccountConfirm1")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* modal eliminar cuenta - paso 2 */}
      {pasoEliminarCuenta === 2 && (
        <div
          onClick={() => setPasoEliminarCuenta(0)}
          style={{
            position: "fixed", inset: 0,
            backgroundColor: "rgba(0,0,0,0.65)",
            zIndex: 100, display: "flex",
            alignItems: "center", justifyContent: "center", padding: "16px"
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-cuenta2-titulo"
            onKeyDown={makeTrapHandler(modalCuentaRef, () => setPasoEliminarCuenta(0))}
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: "#f0e8dc", borderRadius: "20px",
              padding: esMobil ? "24px 16px" : "36px",
              maxWidth: esMobil ? "calc(100vw - 32px)" : "420px",
              width: "100%",
              textAlign: "center", boxShadow: "0 8px 32px rgba(0,0,0,0.2)"
            }}
          >
            <div aria-hidden="true" style={{ fontSize: "48px", marginBottom: "16px" }}>🗑️</div>
            <h3 id="modal-cuenta2-titulo" style={{
              fontFamily: "'Baloo Bhai 2', Helvetica",
              fontSize: "20px", fontWeight: "700",
              color: "#c0392b", marginBottom: "12px"
            }}>
              {t("panel.modalAccountTitle2")}
            </h3>
            <p style={{
              fontFamily: "'Baloo Bhai 2', Helvetica",
              fontSize: "15px", color: "#4a4a4a",
              marginBottom: "24px", lineHeight: "1.5"
            }}>
              {t("panel.modalAccountBody2", { nombre: empresa?.nombre })}
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "12px", justifyContent: "center" }}>
              <button
                onClick={() => setPasoEliminarCuenta(0)}
                style={{ ...estiloBotonPrimario, backgroundColor: "#818181", minHeight: "44px" }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#5a5a5a"}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "#818181"}
              >
                {t("panel.formCancel")}
              </button>
              <button
                onClick={eliminarCuenta}
                style={{ ...estiloBotonPrimario, backgroundColor: "#922b21", minHeight: "44px" }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#7b241c"}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "#922b21"}
              >
                {t("panel.modalAccountConfirm2")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* modal patrocinio */}
      {modalPatrocinio !== null && (
        <div
          onClick={() => setModalPatrocinio(null)}
          style={{
            position: "fixed", inset: 0,
            backgroundColor: "rgba(0,0,0,0.65)",
            zIndex: 100, display: "flex",
            alignItems: "center", justifyContent: "center", padding: "16px"
          }}
        >
          <div
            ref={modalPatrocinioRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-patrocinio-titulo"
            onKeyDown={makeTrapHandler(modalPatrocinioRef, () => setModalPatrocinio(null))}
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: "#f0e8dc", borderRadius: "20px",
              padding: esMobil ? "24px 16px" : "36px",
              maxWidth: esMobil ? "calc(100vw - 32px)" : "440px",
              width: "100%",
              textAlign: "center", boxShadow: "0 8px 32px rgba(0,0,0,0.2)"
            }}
          >
            <div aria-hidden="true" style={{ fontSize: "48px", marginBottom: "16px" }}>⭐</div>
            <h3 id="modal-patrocinio-titulo" style={{
              fontFamily: "'Baloo Bhai 2', Helvetica",
              fontSize: "20px", fontWeight: "700",
              color: "#1a1a1a", marginBottom: "12px"
            }}>
              {!modalPatrocinio.patrocinado
                ? t("panel.modalSponsorTitleActivate")
                : modalPatrocinio.cancelacionPatrocinio
                  ? t("panel.modalSponsorTitleReactivate")
                  : t("panel.modalSponsorTitleCancel")}
            </h3>
            <p style={{
              fontFamily: "'Baloo Bhai 2', Helvetica",
              fontSize: "15px", color: "#4a4a4a",
              marginBottom: "24px", lineHeight: "1.5"
            }}>
              {!modalPatrocinio.patrocinado
                ? t("panel.modalSponsorBodyActivate")
                : modalPatrocinio.cancelacionPatrocinio
                  ? t("panel.modalSponsorBodyReactivate")
                  : t("panel.modalSponsorBodyCancel", { fecha: new Date(modalPatrocinio.fechaFinPatrocinio).toLocaleDateString(i18n.language) })}
            </p>
            {(!modalPatrocinio.patrocinado || modalPatrocinio.cancelacionPatrocinio) && (
              <div style={{
                backgroundColor: "#e8f5e9", borderRadius: "8px",
                padding: "10px 16px", marginBottom: "20px"
              }}>
                <span style={{
                  fontFamily: "'Baloo Bhai 2', Helvetica",
                  fontSize: "16px", fontWeight: "700", color: "#2e7d32"
                }}>
                  {t("panel.modalSponsorPrice")}
                </span>
              </div>
            )}
            <div style={{ display: "flex", flexWrap: "wrap", gap: "12px", justifyContent: "center" }}>
              <button
                onClick={() => setModalPatrocinio(null)}
                style={{ ...estiloBotonPrimario, backgroundColor: "#818181", minHeight: "44px" }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#5a5a5a"}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "#818181"}
              >
                {t("panel.formCancel")}
              </button>
              <button
                onClick={confirmarPatrocinio}
                style={{ ...estiloBotonPrimario, minHeight: "44px" }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#7a5c2e"}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "#91703d"}
              >
                {!modalPatrocinio.patrocinado
                  ? t("panel.modalSponsorConfirmActivate")
                  : modalPatrocinio.cancelacionPatrocinio
                    ? t("panel.modalSponsorConfirmReactivate")
                    : t("panel.modalSponsorConfirmCancel")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* modal recorte foto de perfil */}
      {modalRecortePerfilAbierto && previewRecortePerfil && (
        <div style={{
          position: "fixed", inset: 0,
          backgroundColor: "rgba(0,0,0,0.85)",
          zIndex: 1100, display: "flex",
          flexDirection: "column",
          alignItems: "center", justifyContent: "center",
          padding: "16px", gap: "16px"
        }}>
          <p style={{
            fontFamily: "'Baloo Bhai 2', Helvetica",
            fontSize: "16px", fontWeight: "700",
            color: "white", margin: 0
          }}>
            {t("panel.cropAdjustProfile")}
          </p>

          <div style={{ position: "relative", width: "280px", height: "280px" }}>
            <Cropper
              image={previewRecortePerfil}
              crop={cropPerfil}
              zoom={zoomPerfil}
              aspect={1}
              cropShape="round"
              showGrid={false}
              onCropChange={setCropPerfil}
              onZoomChange={setZoomPerfil}
              onCropComplete={(_, pixels) => setCroppedAreaPixelsPerfil(pixels)}
            />
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "12px", width: "100%", maxWidth: "280px" }}>
            <span style={{ color: "white", fontFamily: "'Baloo Bhai 2', Helvetica", fontSize: "13px", whiteSpace: "nowrap" }}>
              {t("panel.cropZoom")}
            </span>
            <input
              type="range"
              min={1} max={3} step={0.05}
              value={zoomPerfil}
              onChange={(e) => setZoomPerfil(Number(e.target.value))}
              style={{ flex: 1, accentColor: "#b79868" }}
            />
          </div>

          <div style={{ display: "flex", flexWrap: "wrap", gap: "12px", justifyContent: "center" }}>
            <button
              onClick={cancelarRecortePerfil}
              style={{
                backgroundColor: "#818181", color: "white",
                fontFamily: "'Baloo Bhai 2', Helvetica", fontWeight: "700",
                fontSize: "15px", padding: "10px 24px",
                borderRadius: "999px", border: "none", cursor: "pointer",
                minHeight: "44px"
              }}
            >
              {t("panel.cropCancel")}
            </button>
            <button
              onClick={confirmarRecortePerfil}
              disabled={fotoSubiendo}
              style={{
                backgroundColor: "#b79868", color: "white",
                fontFamily: "'Baloo Bhai 2', Helvetica", fontWeight: "700",
                fontSize: "15px", padding: "10px 24px",
                borderRadius: "999px", border: "none",
                cursor: fotoSubiendo ? "not-allowed" : "pointer",
                opacity: fotoSubiendo ? 0.7 : 1,
                minHeight: "44px"
              }}
            >
              {fotoSubiendo ? t("panel.profileUploading") : t("panel.cropUse")}
            </button>
          </div>
        </div>
      )}

      {/* modal detalle inscripciones por evento */}
      {modalDetalleEvento && (
        <div
          onClick={() => setModalDetalleEvento(null)}
          style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.6)", zIndex: 1200, display: "flex", alignItems: "center", justifyContent: "center", padding: "16px" }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => { if (e.key === "Escape") setModalDetalleEvento(null); }}
            role="dialog"
            aria-modal="true"
            style={{
              backgroundColor: "white", borderRadius: "20px",
              padding: esMobil ? "20px 16px" : "28px 32px",
              width: "100%", maxWidth: "760px",
              maxHeight: "90vh", overflowY: "auto",
              boxShadow: "0 8px 40px rgba(0,0,0,0.25)",
              position: "relative",
            }}
          >
            <button
              onClick={() => setModalDetalleEvento(null)}
              style={{ position: "absolute", top: "16px", right: "20px", background: "none", border: "none", fontSize: "22px", cursor: "pointer", color: "#4a4a4a", lineHeight: 1 }}
              aria-label="Cerrar"
            >✕</button>

            <h2 style={{ fontFamily: "'Baloo Bhai 2', Helvetica", fontSize: "18px", fontWeight: "700", color: "#1a1a1a", marginBottom: "4px", paddingRight: "32px" }}>
              {t("panel.modalDetalleTitle", { titulo: modalDetalleEvento.titulo })}
            </h2>
            <p style={{ fontFamily: "'Baloo Bhai 2', Helvetica", fontSize: "13px", color: "#818181", marginBottom: "20px", marginTop: 0 }}>
              {new Date(modalDetalleEvento.fecha).toLocaleDateString(i18n.language, { day: "numeric", month: "long", year: "numeric" })}
            </p>

            {cargandoDetalle && (
              <p style={{ fontFamily: "'Baloo Bhai 2', Helvetica", fontSize: "15px", color: "#818181", textAlign: "center", padding: "32px 0" }}>
                {t("panel.modalDetalleLoading")}
              </p>
            )}

            {!cargandoDetalle && inscripcionesDetalle.length === 0 && (
              <p style={{ fontFamily: "'Baloo Bhai 2', Helvetica", fontSize: "15px", color: "#818181", textAlign: "center", padding: "32px 0" }}>
                {t("panel.modalDetalleEmpty")}
              </p>
            )}

            {!cargandoDetalle && inscripcionesDetalle.length > 0 && (
              <>
                <div style={{ display: "flex", gap: "8px", marginBottom: "16px", flexWrap: "wrap", alignItems: "center" }}>
                  <span style={{ fontFamily: "'Baloo Bhai 2', Helvetica", fontSize: "13px", color: "#4a4a4a" }}>
                    {inscripcionesDetalle.length} {t("panel.modalDetalleRegistrations", { count: inscripcionesDetalle.length })} · {inscripcionesDetalle.reduce((a, i) => a + i.numPersonas, 0)} {t("panel.modalDetallePersons", { count: inscripcionesDetalle.reduce((a, i) => a + i.numPersonas, 0) })}
                  </span>
                  <div style={{ marginLeft: "auto", display: "flex", gap: "8px" }}>
                    <button
                      onClick={() => {
                        const filas = [
                          [t("panel.modalDetalleColName"), t("panel.modalDetalleColEmail"), t("panel.modalDetalleColCity"), t("panel.modalDetalleColPersons"), t("panel.modalDetalleColDate")],
                          ...inscripcionesDetalle.map((i) => [
                            i.nombre, i.correo, i.ciudad, i.numPersonas,
                            new Date(i.createdAt).toLocaleDateString(i18n.language),
                          ]),
                        ];
                        descargarCSV(filas, `inscritos-${modalDetalleEvento.titulo.slice(0, 30)}.csv`);
                      }}
                      style={{ backgroundColor: "#f0e8dc", color: "#91703d", border: "none", borderRadius: "8px", fontSize: "13px", fontWeight: "700", padding: "6px 12px", cursor: "pointer", fontFamily: "'Baloo Bhai 2', Helvetica" }}
                    >
                      ↓ CSV
                    </button>
                    <button
                      onClick={() => {
                        const totalPers = inscripcionesDetalle.reduce((a, i) => a + i.numPersonas, 0);
                        descargarPDF(
                          t("panel.modalDetalleTitle", { titulo: modalDetalleEvento.titulo }),
                          [t("panel.modalDetalleColName"), t("panel.modalDetalleColEmail"), t("panel.modalDetalleColCity"), t("panel.modalDetalleColPersons"), t("panel.modalDetalleColDate")],
                          inscripcionesDetalle.map((i) => [
                            i.nombre, i.correo, i.ciudad, i.numPersonas,
                            new Date(i.createdAt).toLocaleDateString(i18n.language),
                          ]),
                          `${inscripcionesDetalle.length} ${t("panel.modalDetalleRegistrations", { count: inscripcionesDetalle.length })} · ${totalPers} ${t("panel.modalDetallePersons", { count: totalPers })}`
                        );
                      }}
                      style={{ backgroundColor: "#91703d", color: "white", border: "none", borderRadius: "8px", fontSize: "13px", fontWeight: "700", padding: "6px 12px", cursor: "pointer", fontFamily: "'Baloo Bhai 2', Helvetica" }}
                    >
                      ↓ PDF
                    </button>
                  </div>
                </div>

                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: "'Baloo Bhai 2', Helvetica", fontSize: "13px" }}>
                    <thead>
                      <tr style={{ backgroundColor: "#f0e8dc" }}>
                        {[t("panel.modalDetalleColName"), t("panel.modalDetalleColEmail"), t("panel.modalDetalleColCity"), t("panel.modalDetalleColPersons"), t("panel.modalDetalleColDate")].map((h) => (
                          <th key={h} style={{ padding: "8px 12px", textAlign: "left", fontWeight: "700", color: "#91703d", whiteSpace: "nowrap" }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {inscripcionesDetalle.map((ins) => (
                        <tr key={ins._id} style={{ borderBottom: "1px solid #f0e8dc" }}>
                          <td style={{ padding: "8px 12px", color: "#1a1a1a" }}>{ins.nombre}</td>
                          <td style={{ padding: "8px 12px", color: "#4a4a4a" }}>{ins.correo}</td>
                          <td style={{ padding: "8px 12px", color: "#4a4a4a" }}>{ins.ciudad}</td>
                          <td style={{ padding: "8px 12px", color: "#4a4a4a", textAlign: "center" }}>{ins.numPersonas}</td>
                          <td style={{ padding: "8px 12px", color: "#818181", whiteSpace: "nowrap" }}>
                            {new Date(ins.createdAt).toLocaleDateString(i18n.language, { day: "2-digit", month: "2-digit", year: "numeric" })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        </div>
      )}

    </div>
  );
}

export default CompanyPanel;
// panel de empresa - pagina privada para gestionar eventos
// conectado con el backend usando eventoService y authService

import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import Cropper from "react-easy-crop";

import Navbar from "../components/Navbar";
import Hero from "../components/Hero";
import Footer from "../components/Footer";

import authService from "../services/authService";
import eventoService from "../services/eventoService";

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

  const [empresa, setEmpresa] = useState(authService.getEmpresa());

  const [eventosActivos, setEventosActivos] = useState([]);
  const [eventosPasados, setEventosPasados] = useState([]);
  const [eventosPapelera, setEventosPapelera] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

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
  });

  const [imagenFile, setImagenFile] = useState(null);
  const [previewRecorte, setPreviewRecorte] = useState(null);
  const [modalRecorteAbierto, setModalRecorteAbierto] = useState(false);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [modalEliminar, setModalEliminar] = useState(null);
  const [modalPatrocinio, setModalPatrocinio] = useState(null);
  const [pasoEliminarCuenta, setPasoEliminarCuenta] = useState(0);
  const [seccionActiva, setSeccionActiva] = useState("eventos");
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
  const fotoInputRef = useRef(null);

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
  }, [seccionActiva]);

  const cargarEventos = async () => {
    try {
      setCargando(true);
      const [data, papelera] = await Promise.all([
        eventoService.getMisEventos(),
        eventoService.getPapelera(),
      ]);
      setEventosActivos(data.eventosActivos);
      setEventosPasados(data.eventosPasados);
      setEventosPapelera(papelera.eventos || []);
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
    });
    setImagenFile(null);
    setFormularioAbierto(true);
    setTimeout(() => {
      document.getElementById("formulario-evento")?.scrollIntoView({ behavior: "smooth" });
    }, 100);
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
    const expira = new Date(eliminado);
    expira.setDate(expira.getDate() + 30);
    const diff = Math.ceil((expira - new Date()) / (1000 * 60 * 60 * 24));
    return Math.max(diff, 0);
  };

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
    transition: "background-color 0.15s ease"
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
    transition: "background-color 0.15s ease"
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
    transition: "background-color 0.15s ease"
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
        <Navbar mostrarInicio={true} estaLogueado={true} />
        <Hero mostrarBuscador={false} compacto={true} />
      </div>

      <main id="main-content" style={{
        flex: 1,
        width: "100%",
        maxWidth: "1100px",
        margin: "0 auto",
        padding: "40px 24px"
      }}>

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
          Hola, {empresa?.nombre || "empresa"}
        </h1>

        {/* tabs de navegación */}
        {(() => {
          const tabs = [
            { id: "eventos", label: "Gestión de eventos" },
            { id: "analiticas", label: "Analíticas" },
            { id: "notificaciones", label: "Notificaciones" },
            { id: "perfil", label: "Perfil" },
          ];
          return (
            <div style={{
              display: "flex",
              gap: "8px",
              flexWrap: "wrap",
              marginBottom: "36px",
              backgroundColor: "white",
              borderRadius: "999px",
              padding: "6px",
              boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
              width: "fit-content",
              margin: "0 auto 36px auto"
            }}>
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setSeccionActiva(tab.id)}
                  style={{
                    fontFamily: "'Baloo Bhai 2', Helvetica",
                    fontWeight: "700",
                    fontSize: "14px",
                    padding: "8px 20px",
                    borderRadius: "999px",
                    border: "none",
                    cursor: "pointer",
                    transition: "background-color 0.15s ease, color 0.15s ease",
                    backgroundColor: seccionActiva === tab.id ? "#91703d" : "transparent",
                    color: seccionActiva === tab.id ? "white" : "#4a4a4a",
                  }}
                >
                  {tab.label}
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
              padding: "28px 32px",
              boxShadow: "0 8px 32px rgba(0,0,0,0.25)",
              width: "100%",
              maxWidth: "960px",
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
                ? "Recuperar evento de la papelera"
                : editandoId !== null
                  ? "Editar evento"
                  : "Publicar nuevo evento"}
            </h2>
            {restaurandoId !== null && (
              <p style={{
                fontFamily: "'Baloo Bhai 2', Helvetica",
                fontSize: "14px",
                color: "#4a4a4a",
                marginTop: "-16px",
                marginBottom: "20px"
              }}>
                Revisa y modifica los datos antes de publicarlo de nuevo.
              </p>
            )}

            <form
              onSubmit={handleSubmitEvento}
              style={{
                display: "grid",
                gridTemplateColumns: anchoVentana < 600 ? "1fr 1fr" : "1fr 1fr 1fr 1fr",
                gap: "12px"
              }}
            >

              {/* titulo */}
              <div style={{ gridColumn: "1 / -1", display: "flex", flexDirection: "column", gap: "4px" }}>
                <label style={estiloLabel} htmlFor="titulo">Título del evento *</label>
                <input
                  id="titulo"
                  type="text"
                  name="titulo"
                  value={formEvento.titulo}
                  onChange={handleFormChange}
                  required
                  placeholder="Nombre del evento"
                  style={estiloInput}
                />
              </div>

              {/* venue */}
              <div style={{ gridColumn: "span 2", display: "flex", flexDirection: "column", gap: "4px" }}>
                <label style={estiloLabel} htmlFor="venue">Lugar / Venue *</label>
                <input
                  id="venue"
                  type="text"
                  name="venue"
                  value={formEvento.venue}
                  onChange={handleFormChange}
                  required
                  placeholder="Nombre del lugar"
                  style={estiloInput}
                />
              </div>

              {/* direccion */}
              <div style={{ gridColumn: "span 2", display: "flex", flexDirection: "column", gap: "4px" }}>
                <label style={estiloLabel} htmlFor="direccion">Dirección *</label>
                <input
                  id="direccion"
                  type="text"
                  name="direccion"
                  value={formEvento.direccion}
                  onChange={handleFormChange}
                  required
                  placeholder="Calle, número, ciudad"
                  style={estiloInput}
                />
              </div>

              {/* fecha */}
              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                <label style={estiloLabel} htmlFor="fecha">Fecha *</label>
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
                <label style={estiloLabel} htmlFor="hora">Hora *</label>
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
                <label style={estiloLabel} htmlFor="precio">Precio (€)</label>
                <input
                  id="precio"
                  type="number"
                  name="precio"
                  value={formEvento.precio}
                  onChange={handleFormChange}
                  min="0"
                  step="0.01"
                  placeholder="0 = gratuito"
                  style={estiloInput}
                />
              </div>

              {/* categoria */}
              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                <label style={estiloLabel} htmlFor="categoria">Categoría *</label>
                <select
                  id="categoria"
                  name="categoria"
                  value={formEvento.categoria}
                  onChange={handleFormChange}
                  required
                  style={estiloInput}
                >
                  <option value="" disabled hidden>Selecciona...</option>
                  <option value="taller">Taller</option>
                  <option value="exposicion">Exposición</option>
                  <option value="concurso">Concurso</option>
                  <option value="concierto">Concierto</option>
                  <option value="deporte">Deporte</option>
                  <option value="gastronomia">Gastronomía</option>
                  <option value="teatro">Teatro</option>
                  <option value="otros">Otros</option>
                </select>
              </div>

              {/* limite de personas por inscripcion */}
              <div style={{ gridColumn: "span 2", display: "flex", flexDirection: "column", gap: "4px" }}>
                <label style={estiloLabel} htmlFor="maxPersonasPorInscripcion">
                  Límite de personas por inscripción
                </label>
                <input
                  id="maxPersonasPorInscripcion"
                  type="number"
                  name="maxPersonasPorInscripcion"
                  value={formEvento.maxPersonasPorInscripcion}
                  onChange={handleFormChange}
                  min="1"
                  placeholder="Sin límite"
                  style={estiloInput}
                />
              </div>

              {/* imagen */}
              <div style={{ gridColumn: "span 2", display: "flex", flexDirection: "column", gap: "4px" }}>
                <label style={estiloLabel} htmlFor="imagen">Imagen del evento</label>
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
                <label style={estiloLabel} htmlFor="descripcion">Descripción *</label>
                <textarea
                  id="descripcion"
                  name="descripcion"
                  value={formEvento.descripcion}
                  onChange={handleFormChange}
                  required
                  placeholder="Describe tu evento..."
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
                  Cancelar
                </button>

                <button
                  type="submit"
                  style={estiloBotonPrimario}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#7a5c2e"}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "#91703d"}
                >
                  {restaurandoId !== null
                    ? "Recuperar y publicar"
                    : editandoId !== null
                      ? "Guardar cambios"
                      : "Publicar evento"}
                </button>
              </div>

            </form>
          </div>
          </div>
        )}

        {/* gestión de eventos */}
        {seccionActiva === "eventos" && (
        <div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "12px", marginBottom: "20px" }}>
            <h2 style={{
              fontFamily: "'Baloo Bhai 2', Helvetica",
              fontSize: "22px",
              fontWeight: "700",
              color: "#1a1a1a",
              margin: 0
            }}>
              Mis eventos ({eventosActivos.length})
            </h2>
            <button
              onClick={abrirFormularioNuevo}
              style={estiloBotonPrimario}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#7a5c2e"}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "#91703d"}
            >
              + Publicar evento
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
              Cargando eventos...
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
              No tienes eventos publicados todavía.
              Pulsa "Publicar evento" para crear el primero.
            </div>
          )}

          {!cargando && eventosActivos.length > 0 && (
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
              gap: "24px"
            }}>
              {eventosActivos.map((evento) => (
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
                      {new Date(evento.fecha).toLocaleDateString("es-ES")} — {evento.hora}
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
                        alignSelf: "flex-start",
                        textTransform: "capitalize"
                      }}>
                        {evento.categoria}
                      </div>
                    )}

                    <div style={{
                      fontFamily: "'Baloo Bhai 2', Helvetica",
                      fontSize: "13px",
                      fontWeight: "600",
                      color: evento.precio === 0 ? "#2e7d32" : "#91703d"
                    }}>
                      {evento.precio === 0 ? "Gratuito" : `${evento.precio}€`}
                    </div>

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
                        ★ Patrocinado{evento.cancelacionPatrocinio && evento.fechaFinPatrocinio
                          ? ` · hasta ${new Date(evento.fechaFinPatrocinio).toLocaleDateString("es-ES")}`
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
                          <span aria-hidden="true">✏️</span> Editar
                        </button>

                        <button
                          aria-label={`Eliminar evento: ${evento.titulo}`}
                          onClick={() => setModalEliminar(evento._id)}
                          style={estiloBotonPeligro}
                          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#922b21"}
                          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "#c0392b"}
                        >
                          <span aria-hidden="true">🗑️</span> Eliminar
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
                          ? "Activar patrocinio (10€/mes)"
                          : evento.cancelacionPatrocinio
                            ? "Reactivar patrocinio"
                            : "Cancelar patrocinio"}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
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
                Eventos pasados ({eventosPasados.length})
              </button>

              {eventosPasadosAbierto && (
              <div
                id="lista-eventos-pasados"
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
                  gap: "24px",
                  opacity: 0.75
                }}
              >
                {eventosPasados.map((evento) => (
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
                        📅 {new Date(evento.fecha).toLocaleDateString("es-ES")}
                        {evento.hora && ` · ${evento.hora.slice(0, 5)}`}
                      </div>

                      <div style={{
                        fontFamily: "'Baloo Bhai 2', Helvetica",
                        fontSize: "13px",
                        color: "#818181"
                      }}>
                        📍 {evento.venue}
                      </div>

                      {evento.inscripciones && (
                        <div style={{
                          fontFamily: "'Baloo Bhai 2', Helvetica",
                          fontSize: "13px",
                          color: "#818181"
                        }}>
                          👥 {evento.inscripciones.length} inscripciones
                        </div>
                      )}

                      <div style={{
                        fontFamily: "'Baloo Bhai 2', Helvetica",
                        fontSize: "12px",
                        color: "#a0a0a0",
                        fontStyle: "italic"
                      }}>
                        Este evento ha finalizado
                      </div>
                    </div>
                  </div>
                ))}
              </div>
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
                <span aria-hidden="true">🗑️</span> Papelera ({eventosPapelera.length})
              </button>

              <p style={{
                fontFamily: "'Baloo Bhai 2', Helvetica",
                fontSize: "13px",
                color: "#6a6a6a",
                marginBottom: "20px"
              }}>
                Los eventos eliminados se conservan 30 días. Después se borran definitivamente.
              </p>

              {papeleraAbierta && (
                <div
                  id="lista-papelera"
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
                    gap: "24px"
                  }}
                >
                  {eventosPapelera.map((evento) => {
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
                            📅 {new Date(evento.fecha).toLocaleDateString("es-ES")}
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
                              ? "Se eliminará hoy"
                              : dias === 1
                                ? "Queda 1 día"
                                : `Quedan ${dias} días`}
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
                              <span aria-hidden="true">♻️</span> Recuperar
                            </button>

                            <button
                              aria-label={`Eliminar definitivamente: ${evento.titulo}`}
                              onClick={() => setModalEliminarDefinitivo(evento._id)}
                              style={estiloBotonPeligro}
                              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#922b21"}
                              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "#c0392b"}
                            >
                              <span aria-hidden="true">🗑️</span> Eliminar ya
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>
        )}

        {/* analíticas */}
        {seccionActiva === "analiticas" && (
          <div style={{
            textAlign: "center",
            padding: "80px 0",
            color: "#818181",
            fontFamily: "'Baloo Bhai 2', Helvetica",
            fontSize: "18px"
          }}>
            <div style={{ fontSize: "48px", marginBottom: "16px" }}>📊</div>
            Analíticas próximamente
          </div>
        )}

        {/* notificaciones */}
        {seccionActiva === "notificaciones" && (
          <div style={{
            textAlign: "center",
            padding: "80px 0",
            color: "#818181",
            fontFamily: "'Baloo Bhai 2', Helvetica",
            fontSize: "18px"
          }}>
            <div style={{ fontSize: "48px", marginBottom: "16px" }}>🔔</div>
            Notificaciones próximamente
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
              Información del perfil
            </h2>

            <div style={{
              display: "grid",
              gridTemplateColumns: "1fr 260px",
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
                <label style={{ ...estiloLabel, fontSize: "13px" }} htmlFor="perfil-nombre">Nombre de empresa</label>
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
                <label style={{ ...estiloLabel, fontSize: "13px" }} htmlFor="perfil-correo">Correo electrónico</label>
                <input
                  id="perfil-correo"
                  type="email"
                  value={formPerfil.correo}
                  onChange={(e) => setFormPerfil((p) => ({ ...p, correo: e.target.value }))}
                  required
                  style={{ ...estiloInput, height: "38px", fontSize: "14px" }}
                />
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                <label style={{ ...estiloLabel, fontSize: "13px" }} htmlFor="perfil-descripcion">Descripción</label>
                <textarea
                  id="perfil-descripcion"
                  value={formPerfil.descripcion}
                  onChange={(e) => setFormPerfil((p) => ({ ...p, descripcion: e.target.value }))}
                  maxLength={500}
                  rows={3}
                  placeholder="Cuéntanos sobre tu empresa..."
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
                <span style={{ fontFamily: "'Baloo Bhai 2', Helvetica", fontSize: "11px", color: "#b0b0b0", textAlign: "right" }}>
                  {formPerfil.descripcion.length}/500
                </span>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                <label style={{ ...estiloLabel, fontSize: "13px" }} htmlFor="perfil-contrasena">Contraseña actual</label>
                <input
                  id="perfil-contrasena"
                  type="password"
                  value={formPerfil.contrasena}
                  onChange={(e) => setFormPerfil((p) => ({ ...p, contrasena: e.target.value }))}
                  required
                  placeholder="Introduce tu contraseña para confirmar"
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
                Cada campo solo puede modificarse una vez cada 2 meses.
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
                  {perfilGuardando ? "Guardando..." : "Guardar cambios"}
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
                    alt="Foto de perfil"
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
                {fotoSubiendo ? "Subiendo..." : "Cambiar foto"}
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
                  Zona de peligro
                </p>
                <p style={{
                  fontFamily: "'Baloo Bhai 2', Helvetica",
                  fontSize: "13px",
                  color: "#4a4a4a",
                  margin: 0,
                  lineHeight: "1.4"
                }}>
                  Eliminar la cuenta borrará todos tus eventos. Esta acción no se puede deshacer.
                </p>
              </div>
              <button
                onClick={() => setPasoEliminarCuenta(1)}
                style={{ ...estiloBotonPrimario, backgroundColor: "#c0392b", flexShrink: 0 }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#922b21"}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "#c0392b"}
              >
                Eliminar perfil
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
            Ajusta el encuadre de la imagen
          </p>

          {/* contenedor del recortador */}
          <div style={{ position: "relative", width: "100%", maxWidth: "600px", height: "360px" }}>
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
              Zoom
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
          <div style={{ display: "flex", gap: "12px" }}>
            <button
              onClick={cancelarRecorte}
              style={{
                backgroundColor: "#818181", color: "white",
                fontFamily: "'Baloo Bhai 2', Helvetica", fontWeight: "700",
                fontSize: "15px", padding: "10px 24px",
                borderRadius: "999px", border: "none", cursor: "pointer"
              }}
            >
              Cancelar
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
                opacity: recortando ? 0.7 : 1
              }}
            >
              {recortando ? "Procesando..." : "Usar este encuadre"}
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
              padding: "36px", maxWidth: "420px", width: "100%",
              textAlign: "center", boxShadow: "0 8px 32px rgba(0,0,0,0.2)"
            }}
          >
            <div aria-hidden="true" style={{ fontSize: "48px", marginBottom: "16px" }}>🗑️</div>
            <h3 id="modal-eliminar-titulo" style={{
              fontFamily: "'Baloo Bhai 2', Helvetica",
              fontSize: "20px", fontWeight: "700",
              color: "#1a1a1a", marginBottom: "12px"
            }}>
              ¿Enviar este evento a la papelera?
            </h3>
            <p style={{
              fontFamily: "'Baloo Bhai 2', Helvetica",
              fontSize: "15px", color: "#4a4a4a",
              marginBottom: "24px", lineHeight: "1.5"
            }}>
              Podrás recuperarlo durante 30 días desde la papelera. Después se eliminará definitivamente.
            </p>
            <div style={{ display: "flex", gap: "12px", justifyContent: "center" }}>
              <button
                onClick={() => setModalEliminar(null)}
                style={{ ...estiloBotonPrimario, backgroundColor: "#818181" }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#5a5a5a"}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "#818181"}
              >
                Cancelar
              </button>
              <button
                onClick={eliminarEvento}
                style={{ ...estiloBotonPrimario, backgroundColor: "#c0392b" }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#922b21"}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "#c0392b"}
              >
                Sí, a la papelera
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
              padding: "36px", maxWidth: "420px", width: "100%",
              textAlign: "center", boxShadow: "0 8px 32px rgba(0,0,0,0.2)"
            }}
          >
            <div aria-hidden="true" style={{ fontSize: "48px", marginBottom: "16px" }}>⚠️</div>
            <h3 id="modal-eliminar-def-titulo" style={{
              fontFamily: "'Baloo Bhai 2', Helvetica",
              fontSize: "20px", fontWeight: "700",
              color: "#c0392b", marginBottom: "12px"
            }}>
              ¿Eliminar definitivamente?
            </h3>
            <p style={{
              fontFamily: "'Baloo Bhai 2', Helvetica",
              fontSize: "15px", color: "#4a4a4a",
              marginBottom: "24px", lineHeight: "1.5"
            }}>
              El evento se borrará para siempre. Esta acción no se puede deshacer.
            </p>
            <div style={{ display: "flex", gap: "12px", justifyContent: "center" }}>
              <button
                onClick={() => setModalEliminarDefinitivo(null)}
                style={{ ...estiloBotonPrimario, backgroundColor: "#818181" }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#5a5a5a"}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "#818181"}
              >
                Cancelar
              </button>
              <button
                onClick={eliminarEventoDefinitivo}
                style={{ ...estiloBotonPrimario, backgroundColor: "#922b21" }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#7b241c"}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "#922b21"}
              >
                Sí, eliminar para siempre
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
              padding: "36px", maxWidth: "420px", width: "100%",
              textAlign: "center", boxShadow: "0 8px 32px rgba(0,0,0,0.2)"
            }}
          >
            <div aria-hidden="true" style={{ fontSize: "48px", marginBottom: "16px" }}>⚠️</div>
            <h3 id="modal-cuenta-titulo" style={{
              fontFamily: "'Baloo Bhai 2', Helvetica",
              fontSize: "20px", fontWeight: "700",
              color: "#1a1a1a", marginBottom: "12px"
            }}>
              ¿Eliminar tu perfil de empresa?
            </h3>
            <p style={{
              fontFamily: "'Baloo Bhai 2', Helvetica",
              fontSize: "15px", color: "#4a4a4a",
              marginBottom: "24px", lineHeight: "1.5"
            }}>
              Se eliminarán tu cuenta y todos tus eventos publicados. Esta acción no se puede deshacer.
            </p>
            <div style={{ display: "flex", gap: "12px", justifyContent: "center" }}>
              <button
                onClick={() => setPasoEliminarCuenta(0)}
                style={{ ...estiloBotonPrimario, backgroundColor: "#818181" }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#5a5a5a"}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "#818181"}
              >
                Cancelar
              </button>
              <button
                onClick={() => setPasoEliminarCuenta(2)}
                style={{ ...estiloBotonPrimario, backgroundColor: "#c0392b" }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#922b21"}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "#c0392b"}
              >
                Sí, quiero eliminarlo
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
              padding: "36px", maxWidth: "420px", width: "100%",
              textAlign: "center", boxShadow: "0 8px 32px rgba(0,0,0,0.2)"
            }}
          >
            <div aria-hidden="true" style={{ fontSize: "48px", marginBottom: "16px" }}>🗑️</div>
            <h3 id="modal-cuenta2-titulo" style={{
              fontFamily: "'Baloo Bhai 2', Helvetica",
              fontSize: "20px", fontWeight: "700",
              color: "#c0392b", marginBottom: "12px"
            }}>
              Confirmación final
            </h3>
            <p style={{
              fontFamily: "'Baloo Bhai 2', Helvetica",
              fontSize: "15px", color: "#4a4a4a",
              marginBottom: "24px", lineHeight: "1.5"
            }}>
              ¿Confirmas que quieres eliminar definitivamente la cuenta de <strong>{empresa?.nombre}</strong> y todos sus eventos?
            </p>
            <div style={{ display: "flex", gap: "12px", justifyContent: "center" }}>
              <button
                onClick={() => setPasoEliminarCuenta(0)}
                style={{ ...estiloBotonPrimario, backgroundColor: "#818181" }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#5a5a5a"}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "#818181"}
              >
                Cancelar
              </button>
              <button
                onClick={eliminarCuenta}
                style={{ ...estiloBotonPrimario, backgroundColor: "#922b21" }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#7b241c"}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "#922b21"}
              >
                Eliminar definitivamente
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
              padding: "36px", maxWidth: "440px", width: "100%",
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
                ? "¿Activar el patrocinio?"
                : modalPatrocinio.cancelacionPatrocinio
                  ? "¿Reactivar el patrocinio?"
                  : "¿Cancelar el patrocinio?"}
            </h3>
            <p style={{
              fontFamily: "'Baloo Bhai 2', Helvetica",
              fontSize: "15px", color: "#4a4a4a",
              marginBottom: "24px", lineHeight: "1.5"
            }}>
              {!modalPatrocinio.patrocinado
                ? "Tu evento aparecerá en la sección destacada. El coste es de 10€/mes."
                : modalPatrocinio.cancelacionPatrocinio
                  ? "Tu evento volverá a renovarse automáticamente cada mes (10€/mes)."
                  : `El evento seguirá apareciendo en la sección destacada hasta el ${new Date(modalPatrocinio.fechaFinPatrocinio).toLocaleDateString("es-ES")}. Después no se renovará.`}
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
                  10€ / mes por este evento
                </span>
              </div>
            )}
            <div style={{ display: "flex", gap: "12px", justifyContent: "center" }}>
              <button
                onClick={() => setModalPatrocinio(null)}
                style={{ ...estiloBotonPrimario, backgroundColor: "#818181" }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#5a5a5a"}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "#818181"}
              >
                Cancelar
              </button>
              <button
                onClick={confirmarPatrocinio}
                style={estiloBotonPrimario}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#7a5c2e"}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "#91703d"}
              >
                {!modalPatrocinio.patrocinado
                  ? "Sí, activar"
                  : modalPatrocinio.cancelacionPatrocinio
                    ? "Sí, reactivar"
                    : "Sí, cancelar"}
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
            Ajusta el encuadre de tu foto
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
              Zoom
            </span>
            <input
              type="range"
              min={1} max={3} step={0.05}
              value={zoomPerfil}
              onChange={(e) => setZoomPerfil(Number(e.target.value))}
              style={{ flex: 1, accentColor: "#b79868" }}
            />
          </div>

          <div style={{ display: "flex", gap: "12px" }}>
            <button
              onClick={cancelarRecortePerfil}
              style={{
                backgroundColor: "#818181", color: "white",
                fontFamily: "'Baloo Bhai 2', Helvetica", fontWeight: "700",
                fontSize: "15px", padding: "10px 24px",
                borderRadius: "999px", border: "none", cursor: "pointer"
              }}
            >
              Cancelar
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
                opacity: fotoSubiendo ? 0.7 : 1
              }}
            >
              {fotoSubiendo ? "Subiendo..." : "Usar este encuadre"}
            </button>
          </div>
        </div>
      )}

    </div>
  );
}

export default CompanyPanel;
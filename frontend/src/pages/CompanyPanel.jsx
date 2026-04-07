// panel de empresa - pagina privada para gestionar eventos
// conectado con el backend usando eventoService y authService

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";

import Navbar from "../components/Navbar";
import Hero from "../components/Hero";
import Footer from "../components/Footer";

import authService from "../services/authService";
import eventoService from "../services/eventoService";

function CompanyPanel({ setEstaLogueado }) {

  const navegar = useNavigate();

  const empresa = authService.getEmpresa();

  const [eventos, setEventos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  const [formularioAbierto, setFormularioAbierto] = useState(false);
  const [editandoId, setEditandoId] = useState(null);
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
  const [modalEliminar, setModalEliminar] = useState(null);
  const [modalPatrocinio, setModalPatrocinio] = useState(null);

  useEffect(() => {
    cargarEventos();
  }, []);

  const cargarEventos = async () => {
    try {
      setCargando(true);
      const data = await eventoService.getMisEventos();
      setEventos(data.eventos);
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
      setImagenFile(files[0]);
    } else {
      setFormEvento((prev) => ({ ...prev, [name]: value }));
    }
  };

  const abrirFormularioNuevo = () => {
    setEditandoId(null);
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
      if (editandoId !== null) {
        await eventoService.editarEvento(editandoId, formEvento, imagenFile);
      } else {
        await eventoService.crearEvento(formEvento, imagenFile);
      }

      await cargarEventos();
      setFormularioAbierto(false);
      setEditandoId(null);

    } catch (err) {
      setError(err.response?.data?.mensaje || "Error al guardar el evento");
    }
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
    console.log("toggle patrocinio:", modalPatrocinio._id);
    setModalPatrocinio(null);
  };

  const cerrarSesion = () => {
    authService.logout();
    setEstaLogueado(false);
    navegar("/");
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
        <Hero mostrarBuscador={false} />
      </div>

      <main style={{
        flex: 1,
        width: "100%",
        maxWidth: "1100px",
        margin: "0 auto",
        padding: "40px 24px"
      }}>

        {error && (
          <div style={{
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
        <div style={{
          backgroundColor: "#c9aa80",
          borderRadius: "20px",
          padding: "28px 36px",
          marginBottom: "36px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "16px",
          boxShadow: "0 4px 16px rgba(0,0,0,0.1)"
        }}>
          <div>
            <h1 style={{
              fontFamily: "'Baloo Bhai 2', Helvetica",
              fontSize: "26px",
              fontWeight: "700",
              color: "#1a1a1a",
              margin: 0,
              marginBottom: "4px"
            }}>
              {empresa?.nombre || "Mi empresa"}
            </h1>
            <span style={{
              fontFamily: "'Baloo Bhai 2', Helvetica",
              fontSize: "15px",
              color: "#4a4a4a"
            }}>
              {empresa?.correo || ""}
            </span>
          </div>

          <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
            <button
              onClick={abrirFormularioNuevo}
              style={estiloBotonPrimario}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#7a5c2e"}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "#91703d"}
            >
              + Publicar evento
            </button>

            <button
              onClick={cerrarSesion}
              style={{ ...estiloBotonPrimario, backgroundColor: "#7a5c2e" }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#5c3d1a"}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "#7a5c2e"}
            >
              Cerrar sesión
            </button>
          </div>
        </div>

        {/* formulario de evento */}
        {formularioAbierto && (
          <div
            id="formulario-evento"
            style={{
              backgroundColor: "#c9aa80",
              borderRadius: "20px",
              padding: "32px 36px",
              marginBottom: "36px",
              boxShadow: "0 4px 16px rgba(0,0,0,0.1)"
            }}
          >
            <h2 style={{
              fontFamily: "'Baloo Bhai 2', Helvetica",
              fontSize: "22px",
              fontWeight: "700",
              color: "#1a1a1a",
              marginBottom: "24px"
            }}>
              {editandoId !== null ? "Editar evento" : "Publicar nuevo evento"}
            </h2>

            <form
              onSubmit={handleSubmitEvento}
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "16px"
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
              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
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
              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
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
                <label style={estiloLabel} htmlFor="precio">Precio (€) — 0 si es gratuito</label>
                <input
                  id="precio"
                  type="number"
                  name="precio"
                  value={formEvento.precio}
                  onChange={handleFormChange}
                  min="0"
                  step="0.01"
                  placeholder="0"
                  style={estiloInput}
                />
              </div>

              {/* categoria */}
              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                <label style={estiloLabel} htmlFor="categoria">Categoría</label>
                <select
                  id="categoria"
                  name="categoria"
                  value={formEvento.categoria}
                  onChange={handleFormChange}
                  style={estiloInput}
                >
                  <option value="">Sin categoría</option>
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
                <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                  <label style={estiloLabel} htmlFor="maxPersonasPorInscripcion">
                    Límite de personas por inscripción
                  </label>
                  <span style={{
                    fontFamily: "'Baloo Bhai 2', Helvetica",
                    fontSize: "13px", color: "#4a4a4a", marginBottom: "4px"
                  }}>
                    Déjalo vacío para sin límite
                  </span>
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
              <div style={{ gridColumn: "1 / -1", display: "flex", flexDirection: "column", gap: "4px" }}>
                <label style={estiloLabel} htmlFor="imagen">Imagen del evento</label>
                <span style={{
                  fontFamily: "'Baloo Bhai 2', Helvetica",
                  fontSize: "13px",
                  color: "#4a4a4a",
                  marginBottom: "4px"
                }}>
                  Si no subes imagen se usará una imagen aleatoria automáticamente
                </span>
                <input
                  id="imagen"
                  type="file"
                  name="imagen"
                  accept="image/*"
                  onChange={handleFormChange}
                  style={{ ...estiloInput, height: "auto", padding: "10px 12px", cursor: "pointer" }}
                />
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
                  rows={5}
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
                    resize: "vertical",
                    minHeight: "120px"
                  }}
                />
              </div>

              {/* botones formulario */}
              <div style={{
                gridColumn: "1 / -1",
                display: "flex",
                gap: "12px",
                justifyContent: "flex-end",
                marginTop: "8px"
              }}>
                <button
                  type="button"
                  onClick={() => setFormularioAbierto(false)}
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
                  {editandoId !== null ? "Guardar cambios" : "Publicar evento"}
                </button>
              </div>

            </form>
          </div>
        )}

        {/* mis eventos */}
        <div>
          <h2 style={{
            fontFamily: "'Baloo Bhai 2', Helvetica",
            fontSize: "22px",
            fontWeight: "700",
            color: "#1a1a1a",
            marginBottom: "20px"
          }}>
            Mis eventos ({eventos.length})
          </h2>

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

          {!cargando && eventos.length === 0 && (
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

          {!cargando && (
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
              gap: "24px"
            }}>
              {eventos.map((evento) => (
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
                        backgroundColor: "#b79868",
                        color: "white",
                        fontFamily: "'Baloo Bhai 2', Helvetica",
                        fontSize: "11px",
                        fontWeight: "700",
                        padding: "3px 10px",
                        borderRadius: "999px",
                        display: "inline-block",
                        alignSelf: "flex-start"
                      }}>
                        ★ Patrocinado
                      </div>
                    )}

                    <div style={{ height: "1px", backgroundColor: "#f0e8dc", margin: "4px 0" }} />

                    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                      <div style={{ display: "flex", gap: "8px" }}>
                        <button
                          onClick={() => abrirFormularioEditar(evento)}
                          style={estiloBotonSecundario}
                          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#91703d"}
                          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "#b79868"}
                        >
                          ✏️ Editar
                        </button>

                        <button
                          onClick={() => setModalEliminar(evento._id)}
                          style={estiloBotonPeligro}
                          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#922b21"}
                          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "#c0392b"}
                        >
                          🗑️ Eliminar
                        </button>
                      </div>

                      <button
                        onClick={() => setModalPatrocinio(evento)}
                        style={{
                          ...estiloBotonSecundario,
                          backgroundColor: evento.patrocinado ? "#818181" : "#91703d",
                          width: "100%"
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.opacity = "0.85"}
                        onMouseLeave={(e) => e.currentTarget.style.opacity = "1"}
                      >
                        {evento.patrocinado ? "⭐ Desactivar patrocinio" : "⭐ Activar patrocinio (10€/mes)"}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </main>

      <Footer />

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
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: "#f0e8dc", borderRadius: "20px",
              padding: "36px", maxWidth: "420px", width: "100%",
              textAlign: "center", boxShadow: "0 8px 32px rgba(0,0,0,0.2)"
            }}
          >
            <div style={{ fontSize: "48px", marginBottom: "16px" }}>⚠️</div>
            <h3 style={{
              fontFamily: "'Baloo Bhai 2', Helvetica",
              fontSize: "20px", fontWeight: "700",
              color: "#1a1a1a", marginBottom: "12px"
            }}>
              ¿Eliminar este evento?
            </h3>
            <p style={{
              fontFamily: "'Baloo Bhai 2', Helvetica",
              fontSize: "15px", color: "#4a4a4a",
              marginBottom: "24px", lineHeight: "1.5"
            }}>
              Esta acción no se puede deshacer. El evento se eliminará permanentemente.
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
                Sí, eliminar
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
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: "#f0e8dc", borderRadius: "20px",
              padding: "36px", maxWidth: "440px", width: "100%",
              textAlign: "center", boxShadow: "0 8px 32px rgba(0,0,0,0.2)"
            }}
          >
            <div style={{ fontSize: "48px", marginBottom: "16px" }}>⭐</div>
            <h3 style={{
              fontFamily: "'Baloo Bhai 2', Helvetica",
              fontSize: "20px", fontWeight: "700",
              color: "#1a1a1a", marginBottom: "12px"
            }}>
              {modalPatrocinio.patrocinado
                ? "¿Desactivar el patrocinio?"
                : "¿Activar el patrocinio?"}
            </h3>
            <p style={{
              fontFamily: "'Baloo Bhai 2', Helvetica",
              fontSize: "15px", color: "#4a4a4a",
              marginBottom: "24px", lineHeight: "1.5"
            }}>
              {modalPatrocinio.patrocinado
                ? "El evento dejará de aparecer en la sección destacada al finalizar el período mensual."
                : "Tu evento aparecerá en la sección destacada. El coste es de 10€/mes."}
            </p>
            {!modalPatrocinio.patrocinado && (
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
                {modalPatrocinio.patrocinado ? "Sí, desactivar" : "Sí, activar"}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default CompanyPanel;
// pagina de detalle de evento
// ahora conectada con el backend usando eventoService e inscripcionService
// carga el evento real de la base de datos por su id

import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";

import Navbar from "../components/Navbar";
import Hero from "../components/Hero";
import Footer from "../components/Footer";

import eventoService from "../services/eventoService";
import inscripcionService from "../services/inscripcionService";

function EventDetail({ estaLogueado }) {

  const { id } = useParams();
  const navegar = useNavigate();

  // estado del evento cargado del backend
  const [evento, setEvento] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  // estado del modal de inscripcion
  const [modalAbierto, setModalAbierto] = useState(false);
  const modalRef = useRef(null);

  useEffect(() => {
    if (!modalAbierto) return;
    const focusable = modalRef.current?.querySelectorAll(
      'button, input, textarea, select, [tabindex]:not([tabindex="-1"])'
    );
    if (focusable?.length) focusable[0].focus();
  }, [modalAbierto]);

  const handleModalKeyDown = (e) => {
    if (e.key === "Escape") { setModalAbierto(false); return; }
    if (e.key !== "Tab") return;
    const focusable = Array.from(modalRef.current?.querySelectorAll(
      'button, input, textarea, select, [tabindex]:not([tabindex="-1"])'
    ) || []);
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault(); last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault(); first.focus();
    }
  };

  // estado del formulario de inscripcion
  const [formInscripcion, setFormInscripcion] = useState({
    nombre: "",
    correo: "",
    ciudad: "",
    numPersonas: 1,
  });

  // estado de carga y error del formulario de inscripcion
  const [enviando, setEnviando] = useState(false);
  const [errorInscripcion, setErrorInscripcion] = useState("");
  const [inscripcionExitosa, setInscripcionExitosa] = useState(false);

  // cargamos el evento al montar el componente
  useEffect(() => {
    cargarEvento();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const cargarEvento = async () => {
    try {
      setCargando(true);
      setError("");
      const data = await eventoService.getEventoPorId(id);
      setEvento(data.evento);
    } catch (err) {
      setError("Evento no encontrado");
      console.error(err);
    } finally {
      setCargando(false);
    }
  };

  // manejador de cambios del formulario de inscripcion
  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormInscripcion((prev) => ({ ...prev, [name]: value }));
  };

  // enviar inscripcion al backend
  const handleInscripcion = async (e) => {
    e.preventDefault();
    setErrorInscripcion("");
    setEnviando(true);

    try {
      await inscripcionService.crearInscripcion({
        eventoId: evento._id,
        nombre: formInscripcion.nombre,
        correo: formInscripcion.correo,
        ciudad: formInscripcion.ciudad,
        numPersonas: parseInt(formInscripcion.numPersonas),
      });

      // inscripcion exitosa
      setInscripcionExitosa(true);
      setFormInscripcion({ nombre: "", correo: "", ciudad: "", numPersonas: 1 });

      // cerramos el modal despues de 2 segundos
      setTimeout(() => {
        setModalAbierto(false);
        setInscripcionExitosa(false);
      }, 2000);

    } catch (err) {
      setErrorInscripcion(
        err.response?.data?.mensaje || "Error al procesar la inscripción"
      );
    } finally {
      setEnviando(false);
    }
  };

  // pantalla de carga
  if (cargando) {
    return (
      <div style={{
        minHeight: "100vh",
        backgroundColor: "#f0e8dc",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center"
      }}>
        <p style={{
          fontFamily: "'Baloo Bhai 2', Helvetica",
          fontSize: "24px",
          color: "#818181"
        }}>
          Cargando evento...
        </p>
      </div>
    );
  }

  // pantalla de error
  if (error || !evento) {
    return (
      <div style={{
        minHeight: "100vh",
        backgroundColor: "#f0e8dc",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "16px"
      }}>
        <p style={{
          fontFamily: "'Baloo Bhai 2', Helvetica",
          fontSize: "24px",
          color: "#818181"
        }}>
          Evento no encontrado
        </p>
        <button
          onClick={() => navegar("/")}
          style={{
            backgroundColor: "#b79868",
            color: "white",
            fontFamily: "'Baloo Bhai 2', Helvetica",
            fontWeight: "700",
            fontSize: "16px",
            padding: "10px 28px",
            borderRadius: "999px",
            border: "none",
            cursor: "pointer"
          }}
        >
          Volver al inicio
        </button>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: "100vh",
      backgroundColor: "#f0e8dc",
      display: "flex",
      flexDirection: "column"
    }}>

      <Helmet>
        <title>{evento.titulo} | Me Apunto</title>
        <meta name="description" content={`${evento.descripcion?.substring(0, 155)}...`} />
        <meta property="og:title" content={`${evento.titulo} | Me Apunto`} />
        <meta property="og:description" content={evento.descripcion?.substring(0, 155)} />
        <meta property="og:type" content="event" />
        <meta property="og:url" content={`https://me-apunto-alpha.vercel.app/evento/${evento._id}`} />
        {evento.imagen && <meta property="og:image" content={evento.imagen} />}
        <meta name="robots" content="index, follow" />
        <html lang="es" />
      </Helmet>

      {/* hero con navbar */}
      <div style={{ position: "relative" }}>
        <Navbar mostrarInicio={true} estaLogueado={estaLogueado} />
        <Hero mostrarBuscador={true} />
      </div>

      {/* contenido principal */}
      <main id="main-content" style={{
        flex: 1,
        width: "100%",
        maxWidth: "1100px",
        margin: "0 auto",
        padding: "48px 24px"
      }}>

        {/* titulo del evento */}
        <h1 style={{
          fontFamily: "'Baloo Bhai 2', Helvetica",
          fontSize: "28px",
          fontWeight: "700",
          color: "#1a1a1a",
          marginBottom: "24px",
          textTransform: "uppercase"
        }}>
          {evento.titulo}
        </h1>

        {/* layout dos columnas */}
        <div style={{
          display: "flex",
          flexDirection: "row",
          gap: "40px",
          marginBottom: "32px",
          flexWrap: "wrap"
        }}>

          {/* columna izquierda - datos del evento */}
          <div style={{
            flex: 1,
            minWidth: "260px",
            display: "flex",
            flexDirection: "column",
            gap: "0"
          }}>

            {/* tabla de datos compacta */}
            <div style={{
              backgroundColor: "white",
              borderRadius: "14px",
              overflow: "hidden",
              boxShadow: "0 2px 12px rgba(0,0,0,0.07)",
              marginBottom: "16px"
            }}>
              {[
                { label: "📍 Lugar", value: evento.venue },
                { label: "🗺️ Dirección", value: evento.direccion },
                {
                  label: "📅 Fecha y hora",
                  value: `${new Date(evento.fecha).toLocaleDateString("es-ES", { day: "2-digit", month: "2-digit", year: "numeric" })} · ${evento.hora}`
                },
                {
                  label: "💰 Precio",
                  value: evento.precio === 0 ? "Gratuito" : `${evento.precio}€`,
                  valueColor: evento.precio === 0 ? "#2e7d32" : "#91703d"
                },
                evento.categoria && {
                  label: "🏷️ Categoría",
                  value: evento.categoria,
                  capitalize: true
                },
                { label: "🏢 Organiza", value: evento.empresa?.nombre },
              ].filter(Boolean).map((fila, i, arr) => (
                <div
                  key={fila.label}
                  style={{
                    display: "flex",
                    alignItems: "baseline",
                    gap: "8px",
                    padding: "10px 16px",
                    borderBottom: i < arr.length - 1 ? "1px solid #f0e8dc" : "none"
                  }}
                >
                  <span style={{
                    fontFamily: "'Baloo Bhai 2', Helvetica",
                    fontSize: "13px",
                    fontWeight: "700",
                    color: "#818181",
                    whiteSpace: "nowrap",
                    minWidth: "120px"
                  }}>
                    {fila.label}
                  </span>
                  <span style={{
                    fontFamily: "'Baloo Bhai 2', Helvetica",
                    fontSize: "15px",
                    fontWeight: "600",
                    color: fila.valueColor || "#1a1a1a",
                    textTransform: fila.capitalize ? "capitalize" : "none"
                  }}>
                    {fila.value}
                  </span>
                </div>
              ))}
            </div>

            {/* descripcion */}
            <div style={{
              backgroundColor: "white",
              borderRadius: "14px",
              padding: "16px",
              boxShadow: "0 2px 12px rgba(0,0,0,0.07)"
            }}>
              <h2 style={{
                fontFamily: "'Baloo Bhai 2', Helvetica",
                fontSize: "15px",
                fontWeight: "700",
                color: "#818181",
                marginBottom: "8px"
              }}>
                📝 Descripción
              </h2>
              <p style={{
                fontFamily: "'Baloo Bhai 2', Helvetica",
                fontSize: "15px",
                color: "#444444",
                lineHeight: "1.6",
                margin: 0
              }}>
                {evento.descripcion}
              </p>
            </div>

          </div>

          {/* columna derecha - imagen + boton + mapa */}
          <div style={{
            flex: 1,
            minWidth: "260px",
            maxWidth: "520px",
            display: "flex",
            flexDirection: "column",
            gap: "16px"
          }}>
            <img
              src={evento.imagen
                ? evento.imagen
                : `https://picsum.photos/seed/${evento._id}/800/600`
              }
              alt={evento.titulo}
              style={{
                width: "100%",
                aspectRatio: "4/3",
                objectFit: "cover",
                borderRadius: "14px",
                boxShadow: "0 4px 20px rgba(0,0,0,0.12)"
              }}
            />

            {/* boton me apunto */}
            <button
              onClick={() => setModalAbierto(true)}
              style={{
                backgroundColor: "#b79868",
                color: "white",
                fontFamily: "'Baloo Bhai 2', Helvetica",
                fontWeight: "700",
                fontSize: "22px",
                padding: "14px 0",
                borderRadius: "999px",
                border: "none",
                cursor: "pointer",
                width: "100%",
                transition: "background-color 0.15s ease",
                boxShadow: "0 4px 16px rgba(183,152,104,0.4)"
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#91703d"}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "#b79868"}
            >
              ¡Me apunto!
            </button>

            {/* mapa */}
            <div style={{
              backgroundColor: "#818181",
              padding: "8px",
              borderRadius: "12px",
              boxShadow: "0 2px 12px rgba(0,0,0,0.1)"
            }}>
              <iframe
                title="mapa del evento"
                width="100%"
                height="260"
                style={{ border: 0, borderRadius: "8px", display: "block" }}
                loading="lazy"
                allowFullScreen
                referrerPolicy="no-referrer-when-downgrade"
                src={`https://www.google.com/maps?q=${encodeURIComponent(evento.direccion)}&output=embed`}
              />
            </div>
          </div>

        </div>

      </main>

      <Footer />

      {/* modal de inscripcion */}
      {modalAbierto && (
        <div
          onClick={() => setModalAbierto(false)}
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0,0,0,0.65)",
            zIndex: 100,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "16px"
          }}
        >
          <div
            ref={modalRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-inscripcion-titulo"
            onKeyDown={handleModalKeyDown}
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: "#f0e8dc",
              borderRadius: "24px",
              boxShadow: "0 8px 40px rgba(0,0,0,0.25)",
              width: "100%",
              maxWidth: "480px",
              padding: "36px",
              display: "flex",
              flexDirection: "column",
              gap: "16px"
            }}
          >

            {/* cabecera modal */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h2 id="modal-inscripcion-titulo" style={{
                fontFamily: "'Baloo Bhai 2', Helvetica",
                fontSize: "20px",
                fontWeight: "700",
                color: "#1a1a1a"
              }}>
                ¡Me apunto a {evento.titulo}!
              </h2>
              <button
                aria-label="Cerrar modal de inscripción"
                onClick={() => setModalAbierto(false)}
                style={{
                  background: "none", border: "none", fontSize: "28px",
                  cursor: "pointer", color: "#818181", lineHeight: 1
                }}
              >
                <span aria-hidden="true">×</span>
              </button>
            </div>

            {/* precio del evento */}
            <div style={{
              backgroundColor: evento.precio === 0 ? "#e8f5e9" : "#fff3e0",
              borderRadius: "8px",
              padding: "10px 16px"
            }}>
              <span style={{
                fontFamily: "'Baloo Bhai 2', Helvetica",
                fontSize: "15px",
                fontWeight: "600",
                color: evento.precio === 0 ? "#2e7d32" : "#91703d"
              }}>
                {evento.precio === 0
                  ? "✓ Evento gratuito"
                  : `💳 Precio: ${evento.precio}€ por persona`
                }
              </span>
            </div>

            {/* mensaje de exito */}
            {inscripcionExitosa && (
              <div style={{
                backgroundColor: "#e8f5e9",
                borderRadius: "8px",
                padding: "16px",
                textAlign: "center"
              }}>
                <span style={{
                  fontFamily: "'Baloo Bhai 2', Helvetica",
                  fontSize: "16px",
                  fontWeight: "600",
                  color: "#2e7d32"
                }}>
                  ✓ ¡Inscripción realizada correctamente!
                </span>
              </div>
            )}

            {/* formulario */}
            {!inscripcionExitosa && (
              <form
                onSubmit={handleInscripcion}
                style={{ display: "flex", flexDirection: "column", gap: "14px" }}
              >

                {/* error inscripcion */}
                {errorInscripcion && (
                  <div role="alert" style={{
                    backgroundColor: "#fdecea",
                    borderRadius: "8px",
                    padding: "10px 14px",
                    textAlign: "center"
                  }}>
                    <span style={{
                      fontFamily: "'Baloo Bhai 2', Helvetica",
                      fontSize: "14px",
                      color: "#c0392b"
                    }}>
                      {errorInscripcion}
                    </span>
                  </div>
                )}

                {/* nombre */}
                <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                  <label htmlFor="insc-nombre" style={{
                    fontFamily: "'Baloo Bhai 2', Helvetica",
                    fontSize: "16px",
                    fontWeight: "600",
                    color: "#1a1a1a"
                  }}>
                    Nombre completo
                  </label>
                  <input
                    id="insc-nombre"
                    type="text"
                    name="nombre"
                    value={formInscripcion.nombre}
                    onChange={handleFormChange}
                    required
                    placeholder="Tu nombre completo"
                    style={{
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
                    }}
                  />
                </div>

                {/* correo */}
                <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                  <label htmlFor="insc-correo" style={{
                    fontFamily: "'Baloo Bhai 2', Helvetica",
                    fontSize: "16px",
                    fontWeight: "600",
                    color: "#1a1a1a"
                  }}>
                    Correo electrónico
                  </label>
                  <input
                    id="insc-correo"
                    type="email"
                    name="correo"
                    value={formInscripcion.correo}
                    onChange={handleFormChange}
                    required
                    placeholder="tu@correo.com"
                    style={{
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
                    }}
                  />
                </div>

                {/* ciudad */}
                <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                  <label htmlFor="insc-ciudad" style={{
                    fontFamily: "'Baloo Bhai 2', Helvetica",
                    fontSize: "16px",
                    fontWeight: "600",
                    color: "#1a1a1a"
                  }}>
                    Ciudad
                  </label>
                  <input
                    id="insc-ciudad"
                    type="text"
                    name="ciudad"
                    value={formInscripcion.ciudad}
                    onChange={handleFormChange}
                    required
                    placeholder="Tu ciudad"
                    style={{
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
                    }}
                  />
                </div>

                {/* numero de personas */}
                <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                  <label htmlFor="insc-numPersonas" style={{
                    fontFamily: "'Baloo Bhai 2', Helvetica",
                    fontSize: "16px",
                    fontWeight: "600",
                    color: "#1a1a1a"
                  }}>
                    Número de personas
                  </label>
                  <span style={{
                    fontFamily: "'Baloo Bhai 2', Helvetica",
                    fontSize: "12px",
                    color: "#818181"
                  }}>
                    {evento.maxPersonasPorInscripcion
                      ? `Máximo ${evento.maxPersonasPorInscripcion} personas por inscripción`
                      : "Por defecto 1 — la empresa puede permitir más"
                    }
                  </span>
                  <input
                    id="insc-numPersonas"
                    type="number"
                    name="numPersonas"
                    value={formInscripcion.numPersonas}
                    onChange={handleFormChange}
                    required
                    min="1"
                    max={evento.maxPersonasPorInscripcion || 10}
                    style={{
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
                    }}
                  />
                </div>

                {/* boton confirmar */}
                <button
                  type="submit"
                  disabled={enviando}
                  style={{
                    marginTop: "8px",
                    width: "100%",
                    padding: "14px 0",
                    backgroundColor: enviando ? "#c9aa80" : "#b79868",
                    color: "white",
                    fontFamily: "'Baloo Bhai 2', Helvetica",
                    fontWeight: "700",
                    fontSize: "18px",
                    borderRadius: "999px",
                    border: "none",
                    cursor: enviando ? "not-allowed" : "pointer",
                    transition: "background-color 0.15s ease"
                  }}
                  onMouseEnter={(e) => {
                    if (!enviando) e.currentTarget.style.backgroundColor = "#91703d";
                  }}
                  onMouseLeave={(e) => {
                    if (!enviando) e.currentTarget.style.backgroundColor = "#b79868";
                  }}
                >
                  {enviando ? "Procesando..." : "¡Confirmar inscripción!"}
                </button>

              </form>
            )}

          </div>
        </div>
      )}

    </div>
  );
}

export default EventDetail;
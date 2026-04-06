// pagina de detalle de evento
// ahora conectada con el backend usando eventoService e inscripcionService
// carga el evento real de la base de datos por su id

import { useState, useEffect } from "react";
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
      </Helmet>

      {/* hero con navbar */}
      <div style={{ position: "relative" }}>
        <Navbar mostrarInicio={true} estaLogueado={estaLogueado} />
        <Hero mostrarBuscador={true} />
      </div>

      {/* contenido principal */}
      <main style={{
        flex: 1,
        width: "100%",
        maxWidth: "1100px",
        margin: "0 auto",
        padding: "48px 24px"
      }}>

        {/* titulo del evento */}
        <h1 style={{
          fontFamily: "'Baloo Bhai 2', Helvetica",
          fontSize: "36px",
          fontWeight: "700",
          color: "#1a1a1a",
          marginBottom: "32px",
          textTransform: "uppercase"
        }}>
          {evento.titulo}
        </h1>

        {/* layout dos columnas */}
        <div style={{
          display: "flex",
          flexDirection: "row",
          gap: "48px",
          marginBottom: "40px",
          flexWrap: "wrap"
        }}>

          {/* columna izquierda - datos del evento */}
          <div style={{
            flex: 1,
            minWidth: "280px",
            display: "flex",
            flexDirection: "column",
            gap: "24px"
          }}>

            {/* lugar */}
            <div>
              <span style={{
                fontFamily: "'Baloo Bhai 2', Helvetica",
                fontSize: "22px",
                fontWeight: "700",
                color: "#1a1a1a",
                display: "block",
                marginBottom: "4px"
              }}>
                Lugar:
              </span>
              <span style={{
                fontFamily: "'Baloo Bhai 2', Helvetica",
                fontSize: "20px",
                color: "#333333"
              }}>
                {evento.venue}
              </span>
            </div>

            {/* direccion */}
            <div>
              <span style={{
                fontFamily: "'Baloo Bhai 2', Helvetica",
                fontSize: "22px",
                fontWeight: "700",
                color: "#1a1a1a",
                display: "block",
                marginBottom: "4px"
              }}>
                Dirección:
              </span>
              <span style={{
                fontFamily: "'Baloo Bhai 2', Helvetica",
                fontSize: "20px",
                color: "#333333"
              }}>
                {evento.direccion}
              </span>
            </div>

            {/* fecha */}
            <div>
              <span style={{
                fontFamily: "'Baloo Bhai 2', Helvetica",
                fontSize: "22px",
                fontWeight: "700",
                color: "#1a1a1a",
                display: "block",
                marginBottom: "4px"
              }}>
                Fecha:
              </span>
              <span style={{
                fontFamily: "'Baloo Bhai 2', Helvetica",
                fontSize: "20px",
                color: "#333333"
              }}>
                {new Date(evento.fecha).toLocaleDateString("es-ES", {
                  day: "2-digit",
                  month: "2-digit",
                  year: "numeric"
                })}
              </span>
            </div>

            {/* hora */}
            <div>
              <span style={{
                fontFamily: "'Baloo Bhai 2', Helvetica",
                fontSize: "22px",
                fontWeight: "700",
                color: "#1a1a1a",
                display: "block",
                marginBottom: "4px"
              }}>
                Hora:
              </span>
              <span style={{
                fontFamily: "'Baloo Bhai 2', Helvetica",
                fontSize: "20px",
                color: "#333333"
              }}>
                {evento.hora}
              </span>
            </div>

            {/* precio */}
            <div>
              <span style={{
                fontFamily: "'Baloo Bhai 2', Helvetica",
                fontSize: "22px",
                fontWeight: "700",
                color: "#1a1a1a",
                display: "block",
                marginBottom: "4px"
              }}>
                Precio:
              </span>
              <span style={{
                fontFamily: "'Baloo Bhai 2', Helvetica",
                fontSize: "20px",
                fontWeight: "600",
                color: evento.precio === 0 ? "#2e7d32" : "#91703d"
              }}>
                {evento.precio === 0 ? "Gratuito" : `${evento.precio}€`}
              </span>
            </div>

            {/* organizador */}
            <div>
              <span style={{
                fontFamily: "'Baloo Bhai 2', Helvetica",
                fontSize: "22px",
                fontWeight: "700",
                color: "#1a1a1a",
                display: "block",
                marginBottom: "4px"
              }}>
                Organiza:
              </span>
              <span style={{
                fontFamily: "'Baloo Bhai 2', Helvetica",
                fontSize: "20px",
                color: "#333333"
              }}>
                {evento.empresa?.nombre}
              </span>
            </div>

          </div>

          {/* columna derecha - imagen */}
          <div style={{ flex: 1, minWidth: "280px", maxWidth: "550px" }}>
            <img
              src={evento.imagen
                ? evento.imagen
                : `https://picsum.photos/seed/${evento._id}/800/600`
              }
              alt={evento.titulo}
              style={{
                width: "100%",
                height: "460px",
                objectFit: "cover",
                borderRadius: "16px",
                boxShadow: "0 4px 20px rgba(0,0,0,0.12)"
              }}
            />
          </div>

        </div>

        {/* descripcion */}
        <div style={{ marginBottom: "40px" }}>
          <h2 style={{
            fontFamily: "'Baloo Bhai 2', Helvetica",
            fontSize: "26px",
            fontWeight: "700",
            color: "#1a1a1a",
            marginBottom: "12px"
          }}>
            Descripción:
          </h2>
          <p style={{
            fontFamily: "'Baloo Bhai 2', Helvetica",
            fontSize: "18px",
            color: "#444444",
            lineHeight: "1.7",
            textAlign: "justify",
            maxWidth: "900px"
          }}>
            {evento.descripcion}
          </p>
        </div>

        {/* boton me apunto */}
        <div style={{ display: "flex", justifyContent: "center", marginBottom: "48px" }}>
          <button
            onClick={() => setModalAbierto(true)}
            style={{
              backgroundColor: "#b79868",
              color: "white",
              fontFamily: "'Baloo Bhai 2', Helvetica",
              fontWeight: "700",
              fontSize: "28px",
              padding: "18px 64px",
              borderRadius: "999px",
              border: "none",
              cursor: "pointer",
              transition: "background-color 0.15s ease",
              boxShadow: "0 4px 16px rgba(183,152,104,0.4)"
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#91703d"}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "#b79868"}
          >
            ¡Me apunto!
          </button>
        </div>

        {/* mapa */}
        <div style={{ display: "flex", justifyContent: "center", marginBottom: "32px" }}>
          <div style={{
            width: "100%",
            maxWidth: "700px",
            backgroundColor: "#818181",
            padding: "12px",
            borderRadius: "12px",
            boxShadow: "0 2px 12px rgba(0,0,0,0.1)"
          }}>
            <iframe
              title="mapa del evento"
              width="100%"
              height="380"
              style={{ border: 0, borderRadius: "8px" }}
              loading="lazy"
              allowFullScreen
              referrerPolicy="no-referrer-when-downgrade"
              src={`https://www.google.com/maps?q=${encodeURIComponent(evento.direccion)}&output=embed`}
            />
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
              <h2 style={{
                fontFamily: "'Baloo Bhai 2', Helvetica",
                fontSize: "20px",
                fontWeight: "700",
                color: "#1a1a1a"
              }}>
                ¡Me apunto a {evento.titulo}!
              </h2>
              <button
                onClick={() => setModalAbierto(false)}
                style={{
                  background: "none", border: "none", fontSize: "28px",
                  cursor: "pointer", color: "#818181", lineHeight: 1
                }}
              >
                ×
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
                  <div style={{
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
                  <label style={{
                    fontFamily: "'Baloo Bhai 2', Helvetica",
                    fontSize: "16px",
                    fontWeight: "600",
                    color: "#1a1a1a"
                  }}>
                    Nombre completo
                  </label>
                  <input
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
                  <label style={{
                    fontFamily: "'Baloo Bhai 2', Helvetica",
                    fontSize: "16px",
                    fontWeight: "600",
                    color: "#1a1a1a"
                  }}>
                    Correo electrónico
                  </label>
                  <input
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
                  <label style={{
                    fontFamily: "'Baloo Bhai 2', Helvetica",
                    fontSize: "16px",
                    fontWeight: "600",
                    color: "#1a1a1a"
                  }}>
                    Ciudad
                  </label>
                  <input
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
                  <label style={{
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
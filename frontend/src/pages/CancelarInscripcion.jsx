import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import inscripcionService from "../services/inscripcionService";

function CancelarInscripcion() {
  const { token } = useParams();
  const navegar = useNavigate();

  const [inscripcion, setInscripcion] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [cancelando, setCancelando] = useState(false);
  const [cancelada, setCancelada] = useState(false);

  useEffect(() => {
    const cargar = async () => {
      try {
        const data = await inscripcionService.getInscripcionPorToken(token);
        setInscripcion(data.inscripcion);
      } catch (err) {
        setError(err.response?.data?.mensaje || "Inscripción no encontrada o ya cancelada");
        if (err.response?.status === 410) setError("El enlace de cancelación ha expirado. Contacta con el organizador.");
      } finally {
        setCargando(false);
      }
    };
    cargar();
  }, [token]);

  const handleCancelar = async () => {
    setCancelando(true);
    try {
      await inscripcionService.cancelarInscripcion(token);
      setCancelada(true);
    } catch (err) {
      setError(err.response?.data?.mensaje || "Error al cancelar la inscripción");
    } finally {
      setCancelando(false);
    }
  };

  const fechaRaw = inscripcion?.evento?.fecha ? new Date(inscripcion.evento.fecha) : null;
  const fechaFormateada = fechaRaw && !isNaN(fechaRaw.getTime())
    ? fechaRaw.toLocaleDateString("es-ES", { day: "2-digit", month: "2-digit", year: "numeric" })
    : "";

  return (
    <>
      <Helmet>
        <title>Cancelar inscripción – Me Apunto</title>
      </Helmet>

      <Navbar estaLogueado={false} />

      <main
        id="main-content"
        style={{
          minHeight: "100vh",
          backgroundColor: "#f0e8dc",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "40px 16px",
        }}
      >
        <div style={{
          backgroundColor: "white",
          borderRadius: "20px",
          boxShadow: "0 4px 32px rgba(0,0,0,0.10)",
          padding: "40px 32px",
          maxWidth: "480px",
          width: "100%",
          textAlign: "center",
        }}>

          {/* cabecera */}
          <div style={{
            width: "64px", height: "64px",
            borderRadius: "50%",
            backgroundColor: cancelada ? "#e8f5e9" : cargando ? "#f0e8dc" : error ? "#fdecea" : "#fff3e0",
            display: "flex", alignItems: "center", justifyContent: "center",
            margin: "0 auto 20px auto",
            fontSize: "32px",
          }}>
            {cancelada ? "✓" : cargando ? "⏳" : error ? "✕" : "⚠️"}
          </div>

          {cargando && (
            <p style={{
              fontFamily: "'Baloo Bhai 2', Helvetica",
              fontSize: "18px", color: "#818181"
            }}>
              Cargando...
            </p>
          )}

          {!cargando && error && (
            <>
              <h1 style={{
                fontFamily: "'Baloo Bhai 2', Helvetica",
                fontSize: "22px", fontWeight: "700", color: "#c0392b",
                marginBottom: "12px"
              }}>
                Inscripción no encontrada
              </h1>
              <p style={{
                fontFamily: "'Baloo Bhai 2', Helvetica",
                fontSize: "15px", color: "#818181", marginBottom: "24px"
              }}>
                {error}
              </p>
              <button
                onClick={() => navegar("/")}
                style={{
                  backgroundColor: "#b79868", color: "white",
                  fontFamily: "'Baloo Bhai 2', Helvetica",
                  fontWeight: "700", fontSize: "16px",
                  padding: "12px 32px", borderRadius: "999px",
                  border: "none", cursor: "pointer",
                }}
              >
                Volver al inicio
              </button>
            </>
          )}

          {!cargando && !error && cancelada && (
            <>
              <h1 style={{
                fontFamily: "'Baloo Bhai 2', Helvetica",
                fontSize: "22px", fontWeight: "700", color: "#2e7d32",
                marginBottom: "12px"
              }}>
                Inscripción cancelada
              </h1>
              <p style={{
                fontFamily: "'Baloo Bhai 2', Helvetica",
                fontSize: "15px", color: "#4a4a4a", marginBottom: "8px"
              }}>
                Tu plaza en <strong>{inscripcion?.evento?.titulo}</strong> ha sido liberada.
              </p>
              <p style={{
                fontFamily: "'Baloo Bhai 2', Helvetica",
                fontSize: "14px", color: "#818181", marginBottom: "28px"
              }}>
                Esperamos verte en otro evento pronto.
              </p>
              <button
                onClick={() => navegar("/")}
                style={{
                  backgroundColor: "#b79868", color: "white",
                  fontFamily: "'Baloo Bhai 2', Helvetica",
                  fontWeight: "700", fontSize: "16px",
                  padding: "12px 32px", borderRadius: "999px",
                  border: "none", cursor: "pointer",
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#91703d"}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "#b79868"}
              >
                Ver más eventos
              </button>
            </>
          )}

          {!cargando && !error && !cancelada && inscripcion && (
            <>
              <h1 style={{
                fontFamily: "'Baloo Bhai 2', Helvetica",
                fontSize: "22px", fontWeight: "700", color: "#1a1a1a",
                marginBottom: "8px"
              }}>
                ¿Cancelar tu inscripción?
              </h1>
              <p style={{
                fontFamily: "'Baloo Bhai 2', Helvetica",
                fontSize: "15px", color: "#4a4a4a", marginBottom: "24px"
              }}>
                Estás a punto de cancelar tu plaza en el siguiente evento:
              </p>

              <div style={{
                backgroundColor: "#f0e8dc",
                borderRadius: "12px",
                padding: "20px",
                marginBottom: "28px",
                textAlign: "left",
              }}>
                <p style={{
                  fontFamily: "'Baloo Bhai 2', Helvetica",
                  fontSize: "17px", fontWeight: "700", color: "#1a1a1a",
                  margin: "0 0 12px 0"
                }}>
                  {inscripcion.evento.titulo}
                </p>
                <p style={{
                  fontFamily: "'Baloo Bhai 2', Helvetica",
                  fontSize: "14px", color: "#4a4a4a", margin: "4px 0"
                }}>
                  📅 {fechaFormateada} · {inscripcion.evento.hora}
                </p>
                <p style={{
                  fontFamily: "'Baloo Bhai 2', Helvetica",
                  fontSize: "14px", color: "#4a4a4a", margin: "4px 0"
                }}>
                  📍 {inscripcion.evento.venue}
                </p>
                <p style={{
                  fontFamily: "'Baloo Bhai 2', Helvetica",
                  fontSize: "14px", color: "#4a4a4a", margin: "4px 0"
                }}>
                  👤 {inscripcion.nombre} · {inscripcion.numPersonas} persona{inscripcion.numPersonas !== 1 ? "s" : ""}
                </p>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <button
                  onClick={handleCancelar}
                  disabled={cancelando}
                  style={{
                    backgroundColor: cancelando ? "#e57373" : "#c0392b",
                    color: "white",
                    fontFamily: "'Baloo Bhai 2', Helvetica",
                    fontWeight: "700", fontSize: "16px",
                    padding: "14px 0", borderRadius: "999px",
                    border: "none",
                    cursor: cancelando ? "not-allowed" : "pointer",
                    transition: "background-color 0.15s ease",
                  }}
                  onMouseEnter={(e) => { if (!cancelando) e.currentTarget.style.backgroundColor = "#922b21"; }}
                  onMouseLeave={(e) => { if (!cancelando) e.currentTarget.style.backgroundColor = "#c0392b"; }}
                >
                  {cancelando ? "Cancelando..." : "Sí, cancelar mi inscripción"}
                </button>

                <button
                  onClick={() => navegar("/")}
                  style={{
                    backgroundColor: "transparent",
                    color: "#818181",
                    fontFamily: "'Baloo Bhai 2', Helvetica",
                    fontWeight: "600", fontSize: "15px",
                    padding: "10px 0", borderRadius: "999px",
                    border: "2px solid #d4b896",
                    cursor: "pointer",
                    transition: "border-color 0.15s ease, color 0.15s ease",
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#b79868"; e.currentTarget.style.color = "#b79868"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#d4b896"; e.currentTarget.style.color = "#818181"; }}
                >
                  No, mantener mi plaza
                </button>
              </div>
            </>
          )}

        </div>
      </main>

      <Footer />
    </>
  );
}

export default CancelarInscripcion;

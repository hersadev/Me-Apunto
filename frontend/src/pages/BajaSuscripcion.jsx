import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import suscripcionEmpresaService from "../services/suscripcionEmpresaService";

function BajaSuscripcion() {
  const { id } = useParams();
  const [estado, setEstado] = useState("cargando"); // cargando | exito | error

  useEffect(() => {
    const procesar = async () => {
      try {
        await suscripcionEmpresaService.darDeBaja(id);
        setEstado("exito");
      } catch (err) {
        setEstado("error");
      }
    };
    procesar();
  }, [id]);

  return (
    <>
      <Helmet>
        <title>Baja de suscripción · Me Apunto</title>
      </Helmet>
      <Navbar estaLogueado={false} />
      <main id="main-content" style={{ minHeight: "70vh", backgroundColor: "#f5f0e8", display: "flex", alignItems: "center", justifyContent: "center", padding: "48px 16px" }}>
        <div style={{ backgroundColor: "white", borderRadius: "20px", padding: "48px 40px", maxWidth: "480px", width: "100%", boxShadow: "0 4px 24px rgba(0,0,0,0.08)", textAlign: "center", fontFamily: "'Baloo Bhai 2', Helvetica" }}>
          {estado === "cargando" && (
            <>
              <div style={{ fontSize: "48px", marginBottom: "20px" }}>⏳</div>
              <p style={{ fontSize: "16px", color: "#818181" }}>Procesando tu baja...</p>
            </>
          )}
          {estado === "exito" && (
            <>
              <div style={{ fontSize: "48px", marginBottom: "20px" }}>✅</div>
              <h1 style={{ fontSize: "22px", fontWeight: "700", color: "#1a1a1a", marginBottom: "12px" }}>
                Baja completada
              </h1>
              <p style={{ fontSize: "15px", color: "#818181", lineHeight: "1.6", marginBottom: "28px" }}>
                Has dejado de recibir mensajes de esta empresa. Si fue un error, puedes volver a suscribirte desde su página.
              </p>
              <Link to="/" style={{ display: "inline-block", backgroundColor: "#91703d", color: "white", borderRadius: "10px", padding: "12px 28px", fontWeight: "700", fontSize: "14px", textDecoration: "none" }}>
                Volver al inicio
              </Link>
            </>
          )}
          {estado === "error" && (
            <>
              <div style={{ fontSize: "48px", marginBottom: "20px" }}>❌</div>
              <h1 style={{ fontSize: "22px", fontWeight: "700", color: "#1a1a1a", marginBottom: "12px" }}>
                Enlace no válido
              </h1>
              <p style={{ fontSize: "15px", color: "#818181", lineHeight: "1.6", marginBottom: "28px" }}>
                El enlace de baja no es válido o ya has sido dado de baja anteriormente.
              </p>
              <Link to="/" style={{ display: "inline-block", backgroundColor: "#91703d", color: "white", borderRadius: "10px", padding: "12px 28px", fontWeight: "700", fontSize: "14px", textDecoration: "none" }}>
                Volver al inicio
              </Link>
            </>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}

export default BajaSuscripcion;

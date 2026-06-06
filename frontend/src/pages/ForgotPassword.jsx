import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";

import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import AuthCard from "../components/AuthCard";
import authService from "../services/authService";

function ForgotPassword() {
  const navegar = useNavigate();

  const [anchoVentana, setAnchoVentana] = useState(window.innerWidth);
  useEffect(() => {
    const h = () => setAnchoVentana(window.innerWidth);
    window.addEventListener("resize", h);
    return () => window.removeEventListener("resize", h);
  }, []);
  const esMobil = anchoVentana < 768;

  const [correo, setCorreo] = useState("");
  const [cargando, setCargando] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMensaje("");
    setCargando(true);

    try {
      await authService.solicitarRecuperacion(correo);
      setMensaje("Se ha enviado un correo con las instrucciones para recuperar tu contraseña");
      setCorreo("");
    } catch (err) {
      setError(err.response?.data?.mensaje || "Error al procesar la solicitud");
    } finally {
      setCargando(false);
    }
  };

  return (
    <div style={{
      minHeight: "100vh",
      backgroundColor: "#f0e8dc",
      display: "flex",
      flexDirection: "column"
    }}>

      <Helmet>
        <title>Recuperar Contraseña | Me Apunto</title>
        <meta name="description" content="Recupera el acceso a tu cuenta de empresa en Me Apunto." />
        <meta property="og:title" content="Recuperar Contraseña | Me Apunto" />
        <meta property="og:type" content="website" />
        <meta name="robots" content="noindex, nofollow" />
        <html lang="es" />
      </Helmet>

      <div style={{ position: "relative" }}>
        <Navbar mostrarInicio={true} />
      </div>

      <main style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: esMobil ? "16px 12px" : "40px 20px"
      }}>
        <AuthCard>

          <span style={{
            fontFamily: "'Baloo Bhai 2', Helvetica",
            fontSize: esMobil ? "24px" : "30px",
            fontWeight: "700",
            color: "#2c2c2c",
            marginBottom: "4px",
            textAlign: "center"
          }}>
            Recuperar Contraseña
          </span>

          <p style={{
            fontFamily: "'Baloo Bhai 2', Helvetica",
            fontSize: "16px",
            color: "#5c5c5c",
            marginBottom: "16px",
            textAlign: "center"
          }}>
            Introduce tu correo electrónico y te enviaremos un enlace para restablecer tu contraseña.
          </p>

          {mensaje && (
            <div style={{
              width: "100%",
              backgroundColor: "#e8f5e9",
              borderRadius: "8px",
              padding: "12px 14px",
              textAlign: "center",
              marginBottom: "16px"
            }}>
              <span style={{
                fontFamily: "'Baloo Bhai 2', Helvetica",
                fontSize: "15px",
                color: "#2e7d32"
              }}>
                {mensaje}
              </span>
            </div>
          )}

          {error && (
            <div style={{
              width: "100%",
              backgroundColor: "#fdecea",
              borderRadius: "8px",
              padding: "10px 14px",
              textAlign: "center",
              marginBottom: "16px"
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

          <form
            onSubmit={handleSubmit}
            style={{
              width: "100%",
              display: "flex",
              flexDirection: "column",
              gap: "16px"
            }}
          >
            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              <label
                htmlFor="correo"
                style={{
                  fontFamily: "'Baloo Bhai 2', Helvetica",
                  fontSize: esMobil ? "17px" : "20px",
                  fontWeight: "600",
                  color: "#1a1a1a"
                }}
              >
                Correo electrónico
              </label>
              <input
                id="correo"
                type="email"
                value={correo}
                onChange={(e) => setCorreo(e.target.value)}
                required
                placeholder="empresa@correo.com"
                disabled={cargando}
                style={{
                  width: "100%",
                  height: "44px",
                  backgroundColor: "#f8f8f8",
                  paddingLeft: "12px",
                  paddingRight: "12px",
                  fontFamily: "'Baloo Bhai 2', Helvetica",
                  fontSize: esMobil ? "16px" : "20px",
                  color: "#1a1a1a",
                  border: "none",
                  outline: "none",
                  borderRadius: "6px",
                  boxSizing: "border-box"
                }}
                autoComplete="email"
              />
            </div>

            <button
              type="submit"
              disabled={cargando}
              style={{
                width: "100%",
                padding: "11px 0",
                backgroundColor: cargando ? "#c9aa80" : "#91703d",
                color: "white",
                fontFamily: "'Baloo Bhai 2', Helvetica",
                fontWeight: "700",
                fontSize: "20px",
                borderRadius: "999px",
                border: "none",
                cursor: cargando ? "not-allowed" : "pointer",
                transition: "background-color 0.15s ease"
              }}
              onMouseEnter={(e) => {
                if (!cargando) e.currentTarget.style.backgroundColor = "#7a5c2e";
              }}
              onMouseLeave={(e) => {
                if (!cargando) e.currentTarget.style.backgroundColor = "#91703d";
              }}
            >
              {cargando ? "Enviando..." : "Enviar enlace"}
            </button>
          </form>

          <div style={{
            width: "100%",
            textAlign: "center",
            marginTop: "16px"
          }}>
            <button
              type="button"
              onClick={() => navegar("/login")}
              style={{
                fontFamily: "'Baloo Bhai 2', Helvetica",
                fontSize: "16px",
                color: "#5c3d1a",
                background: "none",
                border: "none",
                cursor: "pointer"
              }}
              onMouseEnter={(e) => e.currentTarget.style.textDecoration = "underline"}
              onMouseLeave={(e) => e.currentTarget.style.textDecoration = "none"}
            >
              Volver al inicio de sesión
            </button>
          </div>

        </AuthCard>
      </main>

      <Footer />

    </div>
  );
}

export default ForgotPassword;
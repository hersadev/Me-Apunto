import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";

import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import AuthCard from "../components/AuthCard";
import PasswordInput from "../components/PasswordInput";
import authService from "../services/authService";

function ResetPassword() {
  const { token } = useParams();
  const navegar = useNavigate();

  const [anchoVentana, setAnchoVentana] = useState(window.innerWidth);
  useEffect(() => {
    const h = () => setAnchoVentana(window.innerWidth);
    window.addEventListener("resize", h);
    return () => window.removeEventListener("resize", h);
  }, []);
  const esMobil = anchoVentana < 768;

  const [contrasena, setContrasena] = useState("");
  const [confirmarContrasena, setConfirmarContrasena] = useState("");
  const [cargando, setCargando] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMensaje("");

    if (contrasena !== confirmarContrasena) {
      setError("Las contraseñas no coinciden");
      return;
    }

    if (contrasena.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres");
      return;
    }

    setCargando(true);

    try {
      await authService.cambiarContrasena(token, contrasena);
      setMensaje("Contraseña actualizada correctamente");
      setTimeout(() => {
        navegar("/login");
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.mensaje || "Error al cambiar la contraseña");
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
        <title>Nueva Contraseña | Me Apunto</title>
        <meta name="description" content="Establece una nueva contraseña para tu cuenta de empresa." />
        <meta property="og:title" content="Nueva Contraseña | Me Apunto" />
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
            Nueva Contraseña
          </span>

          <p style={{
            fontFamily: "'Baloo Bhai 2', Helvetica",
            fontSize: "16px",
            color: "#5c5c5c",
            marginBottom: "16px",
            textAlign: "center"
          }}>
            Introduce tu nueva contraseña.
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
              gap: "12px"
            }}
          >
            <PasswordInput
              nombre="contrasena"
              label="Nueva contraseña"
              valor={contrasena}
              onChange={(e) => setContrasena(e.target.value)}
            />

            <PasswordInput
              nombre="confirmarContrasena"
              label="Confirmar contraseña"
              valor={confirmarContrasena}
              onChange={(e) => setConfirmarContrasena(e.target.value)}
              disabled={cargando}
            />

            <button
              type="submit"
              disabled={cargando}
              style={{
                marginTop: "8px",
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
              {cargando ? "Guardando..." : "Guardar contraseña"}
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

export default ResetPassword;
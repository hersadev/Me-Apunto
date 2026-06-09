import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { useTranslation } from "react-i18next";
import authService from "../services/authService";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

function ConfirmarCorreo() {
  const { t } = useTranslation();
  const { token } = useParams();
  const navegar = useNavigate();
  const [estado, setEstado] = useState("cargando");
  const [mensaje, setMensaje] = useState("");
  const llamadaHecha = useRef(false);

  // deteccion de ancho para responsividad movil
  const [anchoVentana, setAnchoVentana] = useState(window.innerWidth);
  useEffect(() => {
    const h = () => setAnchoVentana(window.innerWidth);
    window.addEventListener("resize", h);
    return () => window.removeEventListener("resize", h);
  }, []);
  const esMobil = anchoVentana < 768;

  useEffect(() => {
    if (llamadaHecha.current) return;
    llamadaHecha.current = true;

    const confirmar = async () => {
      try {
        const res = await authService.confirmarCambioCorreo(token);
        setMensaje(res.mensaje);
        setEstado("ok");
      } catch (err) {
        setMensaje(err.response?.data?.mensaje || "El enlace ha expirado o es inválido.");
        setEstado("error");
      }
    };
    confirmar();
  }, [token]);

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f0e8dc", display: "flex", flexDirection: "column" }}>
      <Helmet>
        <title>Confirmar correo | Me Apunto</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      <Navbar />

      <main style={{
        flex: 1,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: esMobil ? "24px 16px" : "40px 24px"
      }}>
        <div style={{
          backgroundColor: "white",
          borderRadius: "20px",
          padding: esMobil ? "28px 20px" : "40px 36px",
          maxWidth: "440px",
          width: "100%",
          textAlign: "center",
          boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
          boxSizing: "border-box"
        }}>
          {estado === "cargando" && (
            <p style={{ fontFamily: "'Baloo Bhai 2', Helvetica", fontSize: "16px", color: "#818181" }}>
              {t("confirmEmail.verifying")}
            </p>
          )}

          {estado === "ok" && (
            <>
              <div style={{ fontSize: "48px", marginBottom: "16px" }}>✅</div>
              <h1 style={{
                fontFamily: "'Baloo Bhai 2', Helvetica",
                fontSize: esMobil ? "20px" : "22px", fontWeight: "700",
                color: "#1a1a1a", marginBottom: "12px",
                wordBreak: "break-word"
              }}>
                {t("confirmEmail.confirmed")}
              </h1>
              <p style={{
                fontFamily: "'Baloo Bhai 2', Helvetica",
                fontSize: "15px", color: "#4a4a4a",
                marginBottom: "28px", lineHeight: "1.5",
                wordBreak: "break-word"
              }}>
                {mensaje}
              </p>
              <button
                onClick={() => navegar("/login")}
                style={{
                  backgroundColor: "#91703d", color: "white",
                  fontFamily: "'Baloo Bhai 2', Helvetica", fontWeight: "700",
                  fontSize: "15px", padding: "12px 28px",
                  minHeight: "44px",
                  borderRadius: "999px", border: "none", cursor: "pointer",
                  width: esMobil ? "100%" : "auto"
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#7a5c2e"}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "#91703d"}
              >
                {t("confirmEmail.goToLogin")}
              </button>
            </>
          )}

          {estado === "error" && (
            <>
              <div style={{ fontSize: "48px", marginBottom: "16px" }}>⚠️</div>
              <h1 style={{
                fontFamily: "'Baloo Bhai 2', Helvetica",
                fontSize: esMobil ? "20px" : "22px", fontWeight: "700",
                color: "#c0392b", marginBottom: "12px",
                wordBreak: "break-word"
              }}>
                {t("confirmEmail.invalidLink")}
              </h1>
              <p style={{
                fontFamily: "'Baloo Bhai 2', Helvetica",
                fontSize: "15px", color: "#4a4a4a",
                marginBottom: "28px", lineHeight: "1.5",
                wordBreak: "break-word"
              }}>
                {mensaje}
              </p>
              <button
                onClick={() => navegar("/panel")}
                style={{
                  backgroundColor: "#91703d", color: "white",
                  fontFamily: "'Baloo Bhai 2', Helvetica", fontWeight: "700",
                  fontSize: "15px", padding: "12px 28px",
                  minHeight: "44px",
                  borderRadius: "999px", border: "none", cursor: "pointer",
                  width: esMobil ? "100%" : "auto"
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#7a5c2e"}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "#91703d"}
              >
                {t("confirmEmail.backToPanel")}
              </button>
            </>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default ConfirmarCorreo;

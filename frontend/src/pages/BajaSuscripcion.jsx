import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { useTranslation } from "react-i18next";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import suscripcionEmpresaService from "../services/suscripcionEmpresaService";

function BajaSuscripcion() {
  const { t } = useTranslation();
  const { token } = useParams();
  const [estado, setEstado] = useState("cargando"); // cargando | exito | error

  useEffect(() => {
    const procesar = async () => {
      try {
        await suscripcionEmpresaService.darDeBaja(token);
        setEstado("exito");
      } catch (err) {
        setEstado("error");
      }
    };
    procesar();
  }, [token]);

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
              <p style={{ fontSize: "16px", color: "#818181" }}>{t("unsubscribe.processing")}</p>
            </>
          )}
          {estado === "exito" && (
            <>
              <div style={{ fontSize: "48px", marginBottom: "20px" }}>✅</div>
              <h1 style={{ fontSize: "22px", fontWeight: "700", color: "#1a1a1a", marginBottom: "12px" }}>
                {t("unsubscribe.done")}
              </h1>
              <p style={{ fontSize: "15px", color: "#818181", lineHeight: "1.6", marginBottom: "28px" }}>
                {t("unsubscribe.doneInfo")}
              </p>
              <Link to="/" style={{ display: "inline-block", backgroundColor: "#91703d", color: "white", borderRadius: "10px", padding: "12px 28px", fontWeight: "700", fontSize: "14px", textDecoration: "none" }}>
                {t("unsubscribe.backHome")}
              </Link>
            </>
          )}
          {estado === "error" && (
            <>
              <div style={{ fontSize: "48px", marginBottom: "20px" }}>❌</div>
              <h1 style={{ fontSize: "22px", fontWeight: "700", color: "#1a1a1a", marginBottom: "12px" }}>
                {t("unsubscribe.invalidLink")}
              </h1>
              <p style={{ fontSize: "15px", color: "#818181", lineHeight: "1.6", marginBottom: "28px" }}>
                {t("unsubscribe.invalidInfo")}
              </p>
              <Link to="/" style={{ display: "inline-block", backgroundColor: "#91703d", color: "white", borderRadius: "10px", padding: "12px 28px", fontWeight: "700", fontSize: "14px", textDecoration: "none" }}>
                {t("unsubscribe.backHome")}
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

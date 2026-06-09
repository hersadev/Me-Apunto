import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";

function Footer() {

  const navegar = useNavigate();
  const { pathname } = useLocation();
  const { t } = useTranslation();
  const [esMobil, setEsMobil] = useState(() => window.innerWidth < 768);

  useEffect(() => {
    const handler = () => setEsMobil(window.innerWidth < 768);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);

  const estiloEnlace = {
    color: "#f8f8f8",
    fontSize: esMobil ? "14px" : "15px",
    background: "none",
    border: "none",
    cursor: "pointer",
    fontFamily: "'Baloo Bhai 2', Helvetica",
    transition: "opacity 0.15s ease",
    padding: esMobil ? "10px 8px" : "0 4px",
    minHeight: esMobil ? "44px" : "auto",
    display: "inline-flex",
    alignItems: "center",
  };

  const enlaces = [
    { ruta: "/contacto", label: t("footer.contact") },
    { ruta: "/cookies",  label: t("footer.cookies") },
    { ruta: "/terminos", label: t("footer.terms") },
  ].filter((enlace) => enlace.ruta !== pathname);

  return (
    <footer
      style={{
        backgroundColor: "#bca27a",
        width: "100%",
        padding: esMobil ? "12px 16px" : "0 24px",
        minHeight: "70px",
        display: "flex",
        flexDirection: esMobil ? "column" : "row",
        alignItems: "center",
        justifyContent: "center",
        gap: esMobil ? "0px" : "8px",
        marginTop: "auto",
        flexWrap: esMobil ? "nowrap" : "wrap",
        boxSizing: "border-box",
      }}
    >
      {enlaces.map((enlace, i) => (
        <span key={enlace.ruta} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          {i > 0 && !esMobil && <span aria-hidden="true" style={{ color: "#f0e0c8", fontSize: "14px" }}>|</span>}
          <button
            onClick={() => navegar(enlace.ruta)}
            style={estiloEnlace}
            onMouseEnter={(e) => e.currentTarget.style.textDecoration = "underline"}
            onMouseLeave={(e) => e.currentTarget.style.textDecoration = "none"}
          >
            {enlace.label}
          </button>
        </span>
      ))}
    </footer>
  );
}

export default Footer;
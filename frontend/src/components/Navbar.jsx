// navbar - barra de navegacion superior
// responsive para movil y escritorio

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import authService from "../services/authService";

const colorBoton = "#b79868";

const IDIOMAS = [
  { code: "es", label: "ES", flag: "/flags/es.svg" },
  { code: "en", label: "EN", flag: "/flags/en.svg" },
  { code: "ca", label: "CA", flag: "/flags/ca.svg" },
];

const FlagImg = ({ src, alt }) => (
  <img src={src} alt={alt} style={{ width: "18px", height: "13px", objectFit: "cover", borderRadius: "2px", display: "inline-block", verticalAlign: "middle" }} />
);

function SelectorIdioma({ esMobil }) {
  const { i18n } = useTranslation();
  const [abierto, setAbierto] = useState(false);
  const actual = IDIOMAS.find((l) => l.code === i18n.language) || IDIOMAS[0];

  const cambiar = (code) => {
    i18n.changeLanguage(code);
    setAbierto(false);
  };

  return (
    <div style={{ position: "relative" }}>
      <button
        onClick={() => setAbierto((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={abierto}
        style={{
          backgroundColor: "rgba(0,0,0,0.35)",
          color: "white",
          fontWeight: "bold",
          fontSize: esMobil ? "11px" : "14px",
          padding: esMobil ? "5px 8px" : "7px 12px",
          borderRadius: "999px",
          border: "1px solid rgba(255,255,255,0.6)",
          cursor: "pointer",
          fontFamily: "'Baloo Bhai 2', Helvetica",
          whiteSpace: "nowrap",
          display: "flex",
          alignItems: "center",
          gap: "6px",
          backdropFilter: "blur(4px)",
        }}
      >
        <FlagImg src={actual.flag} alt={actual.label} /> {actual.label}
      </button>

      {abierto && (
        <ul
          role="listbox"
          style={{
            position: "absolute",
            top: "calc(100% + 6px)",
            right: 0,
            backgroundColor: "white",
            borderRadius: "8px",
            boxShadow: "0 4px 16px rgba(0,0,0,0.15)",
            overflow: "hidden",
            zIndex: 100,
            minWidth: "80px",
            listStyle: "none",
            margin: 0,
            padding: 0,
          }}
        >
          {IDIOMAS.map((lang) => (
            <li key={lang.code}>
              <button
                role="option"
                aria-selected={lang.code === i18n.language}
                onClick={() => cambiar(lang.code)}
                style={{
                  display: "block",
                  width: "100%",
                  padding: "8px 16px",
                  textAlign: "left",
                  border: "none",
                  backgroundColor: lang.code === i18n.language ? "#f5ead8" : "white",
                  color: lang.code === i18n.language ? "#b79868" : "#3a2e1e",
                  fontWeight: lang.code === i18n.language ? "700" : "400",
                  fontSize: "14px",
                  fontFamily: "'Baloo Bhai 2', Helvetica",
                  cursor: "pointer",
                }}
                onMouseEnter={(e) => { if (lang.code !== i18n.language) e.currentTarget.style.backgroundColor = "#f9f6f1"; }}
                onMouseLeave={(e) => { if (lang.code !== i18n.language) e.currentTarget.style.backgroundColor = "white"; }}
              >
                <FlagImg src={lang.flag} alt={lang.label} /> {lang.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Navbar({ mostrarInicio = false, estaLogueado, enPanel = false }) {
  const navegar = useNavigate();
  const { t } = useTranslation();
  const [esMobil, setEsMobil] = useState(() => window.innerWidth < 768);

  useEffect(() => {
    let timer;
    const handler = () => {
      clearTimeout(timer);
      timer = setTimeout(() => setEsMobil(window.innerWidth < 768), 100);
    };
    window.addEventListener("resize", handler);
    return () => { window.removeEventListener("resize", handler); clearTimeout(timer); };
  }, []);

  const estiloBoton = {
    backgroundColor: colorBoton,
    color: "white",
    fontWeight: "bold",
    fontSize: esMobil ? "11px" : "16px",
    padding: esMobil ? "5px 10px" : "10px 28px",
    borderRadius: "999px",
    border: "none",
    cursor: "pointer",
    fontFamily: "'Baloo Bhai 2', Helvetica",
    transition: "background-color 0.15s ease",
    whiteSpace: "nowrap",
  };

  const logueado = estaLogueado !== undefined
    ? estaLogueado
    : (() => { try { return !!localStorage.getItem("empresa"); } catch { return false; } })();

  return(
    <nav
      aria-label="Navegación principal"
      style={{
      position: "absolute",
      top: 0,
      left: 0,
      width: "100%",
      zIndex: 50,
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      paddingTop: esMobil ? "10px" : "16px",
      paddingBottom: esMobil ? "10px" : "16px",
      paddingLeft: "20px",
      paddingRight: "0px",
      pointerEvents: "none",
    }}>

      <div />

      {/* botones derecha */}
      <div style={{
        pointerEvents: "auto",
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        gap: esMobil ? "4px" : "10px",
        marginRight: esMobil ? "10px" : "50px",
      }}>

        <SelectorIdioma esMobil={esMobil} />

        {logueado ? (
          <>
            {mostrarInicio && (
              <button
                onClick={() => navegar("/")}
                style={estiloBoton}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#91703d"}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = colorBoton}
              >
                {t("nav.home")}
              </button>
            )}
            {!enPanel && (
              <button
                onClick={() => navegar("/panel")}
                style={estiloBoton}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#91703d"}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = colorBoton}
              >
                {t("nav.panel")}
              </button>
            )}

            <button
            onClick={async () => {
              try { await authService.logout(); } catch { /* token ya expirado */ }
              window.location.href = "/";
            }}
              style={{ ...estiloBoton, backgroundColor: "#91703d" }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#7a5c2e"}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "#91703d"}
            >
              {t("nav.logout")}
            </button>
          </>
        ) : (
          <>
            <button
              onClick={() => navegar("/login")}
              style={estiloBoton}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#91703d"}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = colorBoton}
            >
              {t("nav.login")}
            </button>

            <button
              onClick={() => navegar("/register")}
              style={estiloBoton}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#91703d"}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = colorBoton}
            >
              {t("nav.register")}
            </button>
          </>
        )}

      </div>
    </nav>
  );
}

export default Navbar;

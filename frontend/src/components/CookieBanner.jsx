import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

function CookieBanner() {

  const navegar = useNavigate();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const consentimiento = localStorage.getItem("cookie_consent");
    if (!consentimiento) {
      setVisible(true);
    }
  }, []);

  const aceptar = () => {
    localStorage.setItem("cookie_consent", "accepted");
    setVisible(false);
  };

  const rechazar = () => {
    localStorage.setItem("cookie_consent", "rejected");
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div style={{
      position: "fixed",
      bottom: 0,
      left: 0,
      right: 0,
      backgroundColor: "#2c2c2c",
      color: "#f8f8f8",
      padding: "18px 24px",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      flexWrap: "wrap",
      gap: "16px",
      zIndex: 9999,
      boxShadow: "0 -2px 12px rgba(0,0,0,0.25)"
    }}>
      <p style={{
        fontFamily: "'Baloo Bhai 2', Helvetica",
        fontSize: "14px",
        margin: 0,
        flex: "1 1 300px",
        lineHeight: "1.6",
        color: "#e0d8cc"
      }}>
        Utilizamos cookies técnicas esenciales para el funcionamiento de la plataforma.
        No usamos cookies de seguimiento ni publicidad.{" "}
        <button
          onClick={() => navegar("/cookies")}
          style={{
            background: "none",
            border: "none",
            color: "#d4b896",
            cursor: "pointer",
            padding: 0,
            fontFamily: "'Baloo Bhai 2', Helvetica",
            fontSize: "14px",
            textDecoration: "underline"
          }}
        >
          Más información
        </button>
      </p>

      <div style={{ display: "flex", gap: "10px", flexShrink: 0 }}>
        <button
          onClick={rechazar}
          style={{
            backgroundColor: "transparent",
            color: "#e0d8cc",
            fontFamily: "'Baloo Bhai 2', Helvetica",
            fontWeight: "600",
            fontSize: "14px",
            padding: "8px 20px",
            borderRadius: "999px",
            border: "1px solid #818181",
            cursor: "pointer",
            transition: "all 0.15s ease"
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = "#e0d8cc";
            e.currentTarget.style.color = "white";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = "#818181";
            e.currentTarget.style.color = "#e0d8cc";
          }}
        >
          Rechazar
        </button>

        <button
          onClick={aceptar}
          style={{
            backgroundColor: "#b79868",
            color: "white",
            fontFamily: "'Baloo Bhai 2', Helvetica",
            fontWeight: "700",
            fontSize: "14px",
            padding: "8px 20px",
            borderRadius: "999px",
            border: "none",
            cursor: "pointer",
            transition: "background-color 0.15s ease"
          }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#91703d"}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "#b79868"}
        >
          Aceptar
        </button>
      </div>
    </div>
  );
}

export default CookieBanner;

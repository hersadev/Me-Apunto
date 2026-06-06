// tarjeta de autenticacion - reutilizada en login y registro
// separada del hero con margen superior y con mas padding interno

import { useState, useEffect } from "react";
import usuarioIcon from "../assets/icons/iconoUsuario.svg";

function AuthCard({ children }) {

  const [anchoVentana, setAnchoVentana] = useState(window.innerWidth);
  useEffect(() => {
    const h = () => setAnchoVentana(window.innerWidth);
    window.addEventListener("resize", h);
    return () => window.removeEventListener("resize", h);
  }, []);
  const esMobil = anchoVentana < 768;

  return (
    // margen superior para separar del hero
    <div style={{
      display: "flex",
      justifyContent: "center",
      alignItems: "start",
      width: "100%",
      padding: esMobil ? "64px 12px 40px 12px" : "80px 16px 60px 16px"
    }}>

      {/* contenedor relativo para el icono que sobresale */}
      <div style={{ position: "relative", width: "100%", maxWidth: "460px" }}>

        {/* icono de usuario sobresaliendo por arriba */}
        <div style={{
          position: "absolute",
          top: esMobil ? "-48px" : "-56px",
          left: "50%",
          transform: "translateX(-50%)",
          zIndex: 10
        }}>
          <div style={{
            backgroundColor: "#b79868",
            width: esMobil ? "90px" : "110px",
            height: esMobil ? "90px" : "110px",
            borderRadius: "999px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 4px 12px rgba(0,0,0,0.15)"
          }}>
            <img
              src={usuarioIcon}
              alt="usuario"
              style={{ width: esMobil ? "52px" : "64px", height: esMobil ? "52px" : "64px" }}
            />
          </div>
        </div>

        {/* tarjeta dorada */}
        <div style={{
          backgroundColor: "#c9aa80",
          borderRadius: "28px",
          boxShadow: "0 8px 32px rgba(0,0,0,0.15)",
          paddingTop: esMobil ? "60px" : "80px",
          paddingBottom: esMobil ? "28px" : "36px",
          paddingLeft: esMobil ? "20px" : "40px",
          paddingRight: esMobil ? "20px" : "40px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "12px",
          width: "100%",
          boxSizing: "border-box"
        }}>
          {children}
        </div>

      </div>
    </div>
  );
}

export default AuthCard;

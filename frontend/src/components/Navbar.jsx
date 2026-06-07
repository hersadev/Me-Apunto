// navbar - barra de navegacion superior
// responsive para movil y escritorio

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import authService from "../services/authService";

const colorBoton = "#b79868";

function Navbar({ mostrarInicio = false, estaLogueado, enPanel = false }) {
  const navegar = useNavigate();
  const [esMobil, setEsMobil] = useState(() => window.innerWidth < 768);

  useEffect(() => {
    const handler = () => setEsMobil(window.innerWidth < 768);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
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
    : !!localStorage.getItem("empresa");

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

        {logueado ? (
          <>
            {mostrarInicio && (
              <button
                onClick={() => navegar("/")}
                style={estiloBoton}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#91703d"}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = colorBoton}
              >
                Inicio
              </button>
            )}
            {!enPanel && (
              <button
                onClick={() => navegar("/panel")}
                style={estiloBoton}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#91703d"}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = colorBoton}
              >
                Mi panel
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
              {esMobil ? "Salir" : "Cerrar sesión"}
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
              Acceso
            </button>

            <button
              onClick={() => navegar("/register")}
              style={estiloBoton}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#91703d"}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = colorBoton}
            >
              Registrarse
            </button>
          </>
        )}

      </div>
    </nav>
  );
}

export default Navbar;
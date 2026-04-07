// navbar - barra de navegacion superior
// responsive para movil y escritorio

import { useNavigate } from "react-router-dom";

const colorBoton = "#b79868";

const estiloBoton = {
  backgroundColor: colorBoton,
  color: "white",
  fontWeight: "bold",
  fontSize: window.innerWidth < 768 ? "12px" : "16px",
  padding: window.innerWidth < 768 ? "6px 12px" : "10px 28px",
  borderRadius: "999px",
  border: "none",
  cursor: "pointer",
  fontFamily: "'Baloo Bhai 2', Helvetica",
  transition: "background-color 0.15s ease"
};

function Navbar({ mostrarInicio = false, estaLogueado = false }) {
  const navegar = useNavigate();

  return(
    <div style={{
      position: "absolute",
      top: 0,
      left: 0,
      width: "100%",
      zIndex: 50,
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      paddingTop: window.innerWidth < 768 ? "10px" : "16px",
      paddingBottom: window.innerWidth < 768 ? "10px" : "16px",
      paddingLeft: "20px",
      paddingRight: "0px",
    }}>

      {/* boton inicio */}
      {mostrarInicio ? (
        <button
          onClick={() => navegar("/")}
          style={estiloBoton}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#91703d"}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = colorBoton}
        >
          Inicio
        </button>
      ) : (
        <div />
      )}

      {/* botones derecha */}
      <div style={{ display: "flex", gap: window.innerWidth < 768 ? "6px" : "10px", marginRight: window.innerWidth < 768 ? "10px" : "50px" }}>

        {estaLogueado ? (
          <>
            <button
              onClick={() => navegar("/panel")}
              style={estiloBoton}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#91703d"}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = colorBoton}
            >
              Mi panel
            </button>

            <button
            onClick={() => {
              localStorage.removeItem("token");
              localStorage.removeItem("empresa");
              window.location.href = "/";
}}
              style={{ ...estiloBoton, backgroundColor: "#91703d" }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#7a5c2e"}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "#91703d"}
            >
              Cerrar sesión
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
    </div>
  );
}

export default Navbar;
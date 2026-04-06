// tarjeta de autenticacion - reutilizada en login y registro
// separada del hero con margen superior y con mas padding interno

import usuarioIcon from "../assets/icons/iconoUsuario.svg";

function AuthCard({ children }) {

  return (
    // margen superior para separar del hero
    <div style={{
      display: "flex",
      justifyContent: "center",
      alignItems: "start",
      width: "100%",
      padding: "80px 16px 60px 16px"
    }}>

      {/* contenedor relativo para el icono que sobresale */}
      <div style={{ position: "relative", width: "100%", maxWidth: "460px" }}>

        {/* icono de usuario sobresaliendo por arriba */}
        <div style={{
          position: "absolute",
          top: "-56px",
          left: "50%",
          transform: "translateX(-50%)",
          zIndex: 10
        }}>
          <div style={{
            backgroundColor: "#b79868",
            width: "110px",
            height: "110px",
            borderRadius: "999px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 4px 12px rgba(0,0,0,0.15)"
          }}>
            <img
              src={usuarioIcon}
              alt="usuario"
              style={{ width: "64px", height: "64px" }}
            />
          </div>
        </div>

        {/* tarjeta dorada */}
        <div style={{
          backgroundColor: "#c9aa80",
          borderRadius: "28px",
          boxShadow: "0 8px 32px rgba(0,0,0,0.15)",
          paddingTop: "80px",
          paddingBottom: "36px",
          paddingLeft: "40px",
          paddingRight: "40px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "12px",
          width: "100%"
        }}>
          {children}
        </div>

      </div>
    </div>
  );
}

export default AuthCard;
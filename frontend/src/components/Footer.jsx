import { useNavigate, useLocation } from "react-router-dom";

function Footer() {

  const navegar = useNavigate();
  const { pathname } = useLocation();

  const estiloEnlace = {
    color: "#f8f8f8",
    fontSize: "15px",
    background: "none",
    border: "none",
    cursor: "pointer",
    fontFamily: "'Baloo Bhai 2', Helvetica",
    transition: "opacity 0.15s ease",
    padding: "0 4px"
  };

  const enlaces = [
    { ruta: "/contacto", label: "Contacte con nosotros" },
    { ruta: "/cookies",  label: "Política de Cookies" },
    { ruta: "/terminos", label: "Términos y Condiciones" },
  ].filter((enlace) => enlace.ruta !== pathname);

  return (
    <footer
      style={{
        backgroundColor: "#bca27a",
        width: "100%",
        padding: "0 24px",
        minHeight: "70px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "8px",
        marginTop: "auto",
        flexWrap: "wrap"
      }}
    >
      {enlaces.map((enlace, i) => (
        <span key={enlace.ruta} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          {i > 0 && <span aria-hidden="true" style={{ color: "#f0e0c8", fontSize: "14px" }}>|</span>}
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
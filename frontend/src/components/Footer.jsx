import { useNavigate } from "react-router-dom";

function Footer() {

  const navegar = useNavigate();

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
      <button
        onClick={() => navegar("/contacto")}
        style={estiloEnlace}
        onMouseEnter={(e) => e.currentTarget.style.textDecoration = "underline"}
        onMouseLeave={(e) => e.currentTarget.style.textDecoration = "none"}
      >
        Contacte con nosotros
      </button>

      <span style={{ color: "#f0e0c8", fontSize: "14px" }}>|</span>

      <button
        onClick={() => navegar("/cookies")}
        style={estiloEnlace}
        onMouseEnter={(e) => e.currentTarget.style.textDecoration = "underline"}
        onMouseLeave={(e) => e.currentTarget.style.textDecoration = "none"}
      >
        Política de Cookies
      </button>

      <span style={{ color: "#f0e0c8", fontSize: "14px" }}>|</span>

      <button
        onClick={() => navegar("/terminos")}
        style={estiloEnlace}
        onMouseEnter={(e) => e.currentTarget.style.textDecoration = "underline"}
        onMouseLeave={(e) => e.currentTarget.style.textDecoration = "none"}
      >
        Términos y Condiciones
      </button>
    </footer>
  );
}

export default Footer;
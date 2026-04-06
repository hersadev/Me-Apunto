    // footer - pie de pagina dorado
    // el boton de contacto ahora navega a la pagina de contacto
    import { useNavigate } from "react-router-dom";

    function Footer() {

    const navegar = useNavigate();

    return(
        <footer
        style={{
            backgroundColor: "#bca27a",
            width: "100%",
            height: "70px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginTop: "auto"
        }}
        >
        <button
            onClick={() => navegar("/contacto")}
            style={{
            color: "#f8f8f8",
            fontSize: "16px",
            background: "none",
            border: "none",
            cursor: "pointer",
            fontFamily: "'Baloo Bhai 2', Helvetica",
            transition: "opacity 0.15s ease"
            }}
            onMouseEnter={(e) => e.currentTarget.style.textDecoration = "underline"}
            onMouseLeave={(e) => e.currentTarget.style.textDecoration = "none"}
        >
            Contacte con nosotros
        </button>
        </footer>
    );
    }

    export default Footer;
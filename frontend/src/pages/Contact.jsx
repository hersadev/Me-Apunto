    // pagina de contacto - formulario para que cualquiera pueda escribirnos
    // ahora conectado con el backend usando contactoService
    // los mensajes llegan a juanjosehersa@gmail.com

    import { useState } from "react";
    import { Helmet } from "react-helmet-async";
    import { useNavigate } from "react-router-dom";

    import Navbar from "../components/Navbar";
    import Hero from "../components/Hero";
    import Footer from "../components/Footer";

    // servicio de contacto con axios
    import contactoService from "../services/contactoService";

    function Contact() {

    const navegar = useNavigate();

    // estado del formulario
    const [formData, setFormData] = useState({
        nombre: "",
        email: "",
        asunto: "",
        contexto: "",
    });

    // estados de carga, error y exito
    const [cargando, setCargando] = useState(false);
    const [error, setError] = useState("");
    const [enviado, setEnviado] = useState(false);

    // manejador generico para todos los campos
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    // funcion que se llama al enviar el formulario
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setCargando(true);

        try {
        // llamamos al backend con los datos del formulario
        await contactoService.enviarMensaje(formData);

        // mostramos mensaje de exito y limpiamos el formulario
        setEnviado(true);
        setFormData({ nombre: "", email: "", asunto: "", contexto: "" });

        } catch (err) {
        setError(
            err.response?.data?.mensaje || "Error al enviar el mensaje"
        );
        } finally {
        setCargando(false);
        }
    };

    // estilos compartidos
    const estiloLabel = {
        fontFamily: "'Baloo Bhai 2', Helvetica",
        fontSize: "18px",
        fontWeight: "600",
        color: "#1a1a1a",
        marginBottom: "4px",
        display: "block"
    };

    const estiloInput = {
        width: "100%",
        height: "50px",
        backgroundColor: "#f8f8f8",
        paddingLeft: "14px",
        paddingRight: "14px",
        fontFamily: "'Baloo Bhai 2', Helvetica",
        fontSize: "16px",
        color: "#1a1a1a",
        border: "none",
        outline: "none",
        borderRadius: "6px"
    };

    return (
        <div style={{
        minHeight: "100vh",
        backgroundColor: "#f0e8dc",
        display: "flex",
        flexDirection: "column"
        }}>

        <Helmet>
            <title>Contacto | Me Apunto</title>
        </Helmet>

        {/* hero con navbar */}
        <div style={{ position: "relative" }}>
            <Navbar mostrarInicio={true} />
            <Hero mostrarBuscador={false} />
        </div>

        {/* contenido principal */}
        <main style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            padding: "60px 16px"
        }}>

            {/* tarjeta de contacto */}
            <div style={{
            width: "100%",
            maxWidth: "560px",
            backgroundColor: "#c9aa80",
            borderRadius: "28px",
            boxShadow: "0 8px 32px rgba(0,0,0,0.15)",
            padding: "40px",
            display: "flex",
            flexDirection: "column",
            gap: "20px"
            }}>

            {/* titulo */}
            <h1 style={{
                fontFamily: "'Baloo Bhai 2', Helvetica",
                fontSize: "24px",
                fontWeight: "700",
                color: "#2c2c2c",
                textAlign: "center",
                margin: 0
            }}>
                Contacte con nosotros
            </h1>

            {/* subtitulo */}
            <p style={{
                fontFamily: "'Baloo Bhai 2', Helvetica",
                fontSize: "15px",
                color: "#4a4a4a",
                textAlign: "center",
                margin: 0,
                lineHeight: "1.5"
            }}>
                ¿Tienes alguna pregunta o sugerencia? Escríbenos y te
                responderemos lo antes posible.
            </p>

            {/* mensaje de error */}
            {error && (
                <div style={{
                backgroundColor: "#fdecea",
                borderRadius: "8px",
                padding: "12px 16px",
                textAlign: "center"
                }}>
                <span style={{
                    fontFamily: "'Baloo Bhai 2', Helvetica",
                    fontSize: "15px",
                    color: "#c0392b"
                }}>
                    {error}
                </span>
                </div>
            )}

            {/* mensaje de exito */}
            {enviado && (
                <div style={{
                backgroundColor: "#e8f5e9",
                borderRadius: "8px",
                padding: "16px",
                textAlign: "center"
                }}>
                <span style={{
                    fontFamily: "'Baloo Bhai 2', Helvetica",
                    fontSize: "16px",
                    color: "#2e7d32",
                    fontWeight: "600"
                }}>
                    ✓ Mensaje enviado correctamente. ¡Gracias por escribirnos!
                </span>
                </div>
            )}

            {/* formulario - se oculta cuando se ha enviado */}
            {!enviado && (
                <form
                onSubmit={handleSubmit}
                style={{ display: "flex", flexDirection: "column", gap: "16px" }}
                >

                {/* nombre */}
                <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                    <label style={estiloLabel} htmlFor="nombre">
                    Nombre
                    </label>
                    <input
                    id="nombre"
                    type="text"
                    name="nombre"
                    value={formData.nombre}
                    onChange={handleChange}
                    required
                    placeholder="Tu nombre completo"
                    style={estiloInput}
                    autoComplete="name"
                    />
                </div>

                {/* email */}
                <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                    <label style={estiloLabel} htmlFor="email">
                    Email
                    </label>
                    <input
                    id="email"
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    placeholder="tu@correo.com"
                    style={estiloInput}
                    autoComplete="email"
                    />
                </div>

                {/* asunto */}
                <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                    <label style={estiloLabel} htmlFor="asunto">
                    Asunto
                    </label>
                    <input
                    id="asunto"
                    type="text"
                    name="asunto"
                    value={formData.asunto}
                    onChange={handleChange}
                    required
                    placeholder="¿En qué podemos ayudarte?"
                    style={estiloInput}
                    />
                </div>

                {/* mensaje */}
                <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                    <label style={estiloLabel} htmlFor="contexto">
                    Mensaje
                    </label>
                    <textarea
                    id="contexto"
                    name="contexto"
                    value={formData.contexto}
                    onChange={handleChange}
                    required
                    placeholder="Escribe aquí tu mensaje..."
                    rows={6}
                    style={{
                        width: "100%",
                        backgroundColor: "#f8f8f8",
                        paddingLeft: "14px",
                        paddingRight: "14px",
                        paddingTop: "12px",
                        paddingBottom: "12px",
                        fontFamily: "'Baloo Bhai 2', Helvetica",
                        fontSize: "16px",
                        color: "#1a1a1a",
                        border: "none",
                        outline: "none",
                        borderRadius: "6px",
                        resize: "vertical",
                        minHeight: "140px"
                    }}
                    />
                </div>

                {/* boton enviar */}
                <button
                    type="submit"
                    disabled={cargando}
                    style={{
                    marginTop: "4px",
                    width: "100%",
                    padding: "13px 0",
                    backgroundColor: cargando ? "#c9aa80" : "#91703d",
                    color: "white",
                    fontFamily: "'Baloo Bhai 2', Helvetica",
                    fontWeight: "700",
                    fontSize: "18px",
                    borderRadius: "999px",
                    border: "none",
                    cursor: cargando ? "not-allowed" : "pointer",
                    transition: "background-color 0.15s ease"
                    }}
                    onMouseEnter={(e) => {
                    if (!cargando) e.currentTarget.style.backgroundColor = "#7a5c2e";
                    }}
                    onMouseLeave={(e) => {
                    if (!cargando) e.currentTarget.style.backgroundColor = "#91703d";
                    }}
                >
                    {cargando ? "Enviando..." : "Enviar mensaje"}
                </button>

                </form>
            )}

            {/* boton volver - siempre visible */}
            <button
                type="button"
                onClick={() => navegar("/")}
                style={{
                fontFamily: "'Baloo Bhai 2', Helvetica",
                fontSize: "14px",
                color: "#5c3d1a",
                background: "none",
                border: "none",
                cursor: "pointer",
                textAlign: "center"
                }}
                onMouseEnter={(e) => e.currentTarget.style.textDecoration = "underline"}
                onMouseLeave={(e) => e.currentTarget.style.textDecoration = "none"}
            >
                Volver al inicio
            </button>

            </div>

        </main>

        <Footer />

        </div>
    );
    }

    export default Contact;
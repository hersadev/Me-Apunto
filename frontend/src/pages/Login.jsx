    // pagina de login - acceso exclusivo para empresas
    // ahora conectado con el backend usando authService
    // guarda el token en localStorage al hacer login

    import { useState } from "react";
    import { useNavigate } from "react-router-dom";
    import { Helmet } from "react-helmet-async";

    import Navbar from "../components/Navbar";
    import Hero from "../components/Hero";
    import Footer from "../components/Footer";
    import AuthCard from "../components/AuthCard";
    import PasswordInput from "../components/PasswordInput";

    // servicio de autenticacion con axios
    import authService from "../services/authService";

    function Login({ setEstaLogueado }) {

    const navegar = useNavigate();

    const [correo, setCorreo] = useState("");
    const [contrasena, setContrasena] = useState("");

    // estado de carga para deshabilitar el boton mientras se procesa
    const [cargando, setCargando] = useState(false);

    // estado de error para mostrar mensajes al usuario
    const [error, setError] = useState("");

    const handleLogin = async (e) => {
        e.preventDefault();
        setError("");
        setCargando(true);

        try {
        // llamamos al backend con las credenciales
        // el token se guarda automaticamente en localStorage
        await authService.login(correo, contrasena);

        // actualizamos el estado global de login
        setEstaLogueado(true);

        // redirigimos al panel de empresa
        navegar("/panel");

        } catch (err) {
        // mostramos el mensaje de error del backend
        setError(
            err.response?.data?.mensaje || "Error al iniciar sesión"
        );
        } finally {
        setCargando(false);
        }
    };

    return (
        <div style={{
        minHeight: "100vh",
        backgroundColor: "#f0e8dc",
        display: "flex",
        flexDirection: "column"
        }}>

        <Helmet>
        <title>Acceso Empresas | Me Apunto</title>
        <meta name="description" content="Accede a tu panel de empresa en Me Apunto para gestionar tus eventos y ver las inscripciones recibidas." />
        <meta property="og:title" content="Acceso Empresas | Me Apunto" />
        <meta property="og:description" content="Accede a tu panel de empresa en Me Apunto." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://me-apunto-alpha.vercel.app/login" />
        <meta name="robots" content="noindex, nofollow" />
        <html lang="es" />
        </Helmet>

        <div style={{ position: "relative" }}>
            <Navbar mostrarInicio={true} />
            <Hero mostrarBuscador={false} />
        </div>

        <main style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center"
        }}>
            <AuthCard>

            <span style={{
                fontFamily: "'Baloo Bhai 2', Helvetica",
                fontSize: "30px",
                fontWeight: "700",
                color: "#2c2c2c",
                marginBottom: "4px"
            }}>
                Acceso Empresas
            </span>

            {/* mensaje de error - solo aparece si hay error */}
            {error && (
                <div style={{
                width: "100%",
                backgroundColor: "#fdecea",
                borderRadius: "8px",
                padding: "10px 14px",
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

            <form
                onSubmit={handleLogin}
                style={{
                width: "100%",
                display: "flex",
                flexDirection: "column",
                gap: "12px"
                }}
            >

                {/* correo */}
                <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                <label
                    htmlFor="correo"
                    style={{
                    fontFamily: "'Baloo Bhai 2', Helvetica",
                    fontSize: "20px",
                    fontWeight: "600",
                    color: "#1a1a1a"
                    }}
                >
                    Correo de empresa
                </label>
                <input
                    id="correo"
                    type="email"
                    value={correo}
                    onChange={(e) => setCorreo(e.target.value)}
                    required
                    placeholder="empresa@correo.com"
                    style={{
                    width: "100%",
                    height: "44px",
                    backgroundColor: "#f8f8f8",
                    paddingLeft: "12px",
                    paddingRight: "12px",
                    fontFamily: "'Baloo Bhai 2', Helvetica",
                    fontSize: "20px",
                    color: "#1a1a1a",
                    border: "none",
                    outline: "none",
                    borderRadius: "6px"
                    }}
                    autoComplete="email"
                />
                </div>

                {/* contraseña */}
                <PasswordInput
                nombre="contrasena"
                label="Contraseña"
                valor={contrasena}
                onChange={(e) => setContrasena(e.target.value)}
                />

                {/* boton acceder - se deshabilita mientras carga */}
                <button
                type="submit"
                disabled={cargando}
                style={{
                    marginTop: "8px",
                    width: "100%",
                    padding: "11px 0",
                    backgroundColor: cargando ? "#c9aa80" : "#91703d",
                    color: "white",
                    fontFamily: "'Baloo Bhai 2', Helvetica",
                    fontWeight: "700",
                    fontSize: "20px",
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
                {cargando ? "Accediendo..." : "Acceder"}
                </button>

            </form>

            {/* separador */}
            <div style={{
                width: "100%",
                height: "1px",
                backgroundColor: "rgba(0,0,0,0.2)",
                margin: "4px 0"
            }} />

            {/* enlaces */}
            <div style={{
                width: "100%",
                display: "flex",
                justifyContent: "space-between"
            }}>
                <button
                type="button"
                onClick={() => console.log("recuperar")}
                style={{
                    fontFamily: "'Baloo Bhai 2', Helvetica",
                    fontSize: "16px",
                    color: "#5c3d1a",
                    background: "none",
                    border: "none",
                    cursor: "pointer"
                }}
                onMouseEnter={(e) => e.currentTarget.style.textDecoration = "underline"}
                onMouseLeave={(e) => e.currentTarget.style.textDecoration = "none"}
                >
                ¿Olvidaste tu contraseña?
                </button>

                <button
                type="button"
                onClick={() => navegar("/register")}
                style={{
                    fontFamily: "'Baloo Bhai 2', Helvetica",
                    fontSize: "16px",
                    color: "#5c3d1a",
                    background: "none",
                    border: "none",
                    cursor: "pointer"
                }}
                onMouseEnter={(e) => e.currentTarget.style.textDecoration = "underline"}
                onMouseLeave={(e) => e.currentTarget.style.textDecoration = "none"}
                >
                ¿No tienes cuenta de empresa?
                </button>
            </div>

            </AuthCard>
        </main>

        <Footer />

        </div>
    );
    }

    export default Login;
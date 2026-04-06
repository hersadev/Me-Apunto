    // hero - cabecera con foto y titulo
    // responsive para movil y escritorio

    import headerImg from "../assets/images/header_.png";

    function Hero({ mostrarBuscador = false, onBuscar }) {

    return(
        <div style={{
        position: "relative",
        width: "100%",
        // altura diferente segun el tamaño de pantalla
        height: window.innerWidth < 768 ? "160px" : "300px",
        overflow: "hidden"
        }}>

        {/* imagen de fondo */}
        <img
            src={headerImg}
            alt="Me Apunto cabecera"
            style={{
            position: "absolute",
            top: 0, left: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
            objectPosition: "center"
            }}
        />

        {/* capa oscura */}
        <div style={{
            position: "absolute",
            top: 0, left: 0,
            width: "100%", height: "100%",
            backgroundColor: "rgba(0,0,0,0)"
        }} />

        {/* titulo y buscador */}
        <div style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: window.innerWidth < 768 ? "8px" : "16px"
        }}>

            {/* titulo mas pequeño en movil */}
            <h1
            onClick={() => window.location.href = "/"}
            style={{
                fontSize: window.innerWidth < 768 ? "32px" : "56px",
                color: "white",
                textShadow: "2px 2px 8px rgba(0,0,0,0.5)",
                margin: 0,
                cursor: "pointer",
                transition: "opacity 0.15s ease",
                fontFamily: "'Butterpop', Helvetica, sans-serif"
            }}
            onMouseEnter={(e) => e.currentTarget.style.opacity = "1"}
            onMouseLeave={(e) => e.currentTarget.style.opacity = "1"}
            >
            ME APUNTO
            </h1>

            {/* buscador mas pequeño en movil */}
            {mostrarBuscador && (
            <div style={{
                display: "flex",
                width: "100%",
                maxWidth: window.innerWidth < 768 ? "320px" : "500px",
                padding: "0 16px"
            }}>
                <input
                type="text"
                placeholder="Buscar evento o categoría"
                onChange={(e) => onBuscar && onBuscar(e.target.value)}
                style={{
                    flex: 1,
                    backgroundColor: "rgba(255,255,255,0.6)",
                    padding: window.innerWidth < 768 ? "6px 10px" : "10px 14px",
                    fontSize: window.innerWidth < 768 ? "13px" : "16px",
                    outline: "none",
                    border: "none"
                }}
                className="font-baloo text-gray-700"
                />
                <button
                style={{
                    backgroundColor: "#b79868",
                    color: "white",
                    padding: window.innerWidth < 768 ? "6px 14px" : "10px 24px",
                    fontSize: window.innerWidth < 768 ? "13px" : "16px",
                    fontWeight: "bold",
                    border: "none",
                    cursor: "pointer"
                }}
                className="font-baloo"
                >
                Buscar
                </button>
            </div>
            )}

        </div>
        </div>
    );
    }

    export default Hero;
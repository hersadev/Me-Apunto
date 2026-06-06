import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import headerImg from "../assets/images/header_.png";
import eventoService from "../services/eventoService";

function Hero({ mostrarBuscador = false, compacto = false, onBuscar, onSubmit }) {
  const navegar = useNavigate();
  const [esMobil, setEsMobil] = useState(() => window.innerWidth < 768);
  const [valor, setValor] = useState("");
  const [sugerencias, setSugerencias] = useState([]);
  const [mostrarSugerencias, setMostrarSugerencias] = useState(false);
  const [indiceActivo, setIndiceActivo] = useState(-1);
  const debounceRef = useRef(null);
  const contenedorRef = useRef(null);
  const listboxId = "hero-sugerencias-listbox";

  useEffect(() => {
    const handler = () => setEsMobil(window.innerWidth < 768);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);

  // cierra el dropdown al hacer clic fuera
  useEffect(() => {
    const handler = (e) => {
      if (contenedorRef.current && !contenedorRef.current.contains(e.target)) {
        setMostrarSugerencias(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleChange = (e) => {
    const v = e.target.value;
    setValor(v);
    onBuscar && onBuscar(v);

    if (v.length < 3) {
      setSugerencias([]);
      setMostrarSugerencias(false);
      clearTimeout(debounceRef.current);
      return;
    }

    if (debounceRef.current?.abort) debounceRef.current.abort();
    const controller = new AbortController();
    const timeoutId = setTimeout(async () => {
      try {
        const data = await eventoService.getEventos({ busqueda: v, limite: 6 }, { signal: controller.signal });
        setSugerencias(data.eventos || []);
        setMostrarSugerencias((data.eventos || []).length > 0);
        setIndiceActivo(-1);
      } catch (err) {
        if (err.name !== "CanceledError" && err.name !== "AbortError") {
          setSugerencias([]);
          setMostrarSugerencias(false);
        }
      }
    }, 300);
    debounceRef.current = { abort: () => { clearTimeout(timeoutId); controller.abort(); } };
  };

  const handleSubmit = () => {
    setMostrarSugerencias(false);
    setIndiceActivo(-1);
    onSubmit && onSubmit();
  };

  const handleKeyDown = (e) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (!mostrarSugerencias || sugerencias.length === 0) return;
      setIndiceActivo((prev) => (prev < sugerencias.length - 1 ? prev + 1 : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (!mostrarSugerencias || sugerencias.length === 0) return;
      setIndiceActivo((prev) => (prev > 0 ? prev - 1 : sugerencias.length - 1));
    } else if (e.key === "Escape") {
      setMostrarSugerencias(false);
      setIndiceActivo(-1);
    } else if (e.key === "Enter") {
      if (indiceActivo >= 0 && sugerencias[indiceActivo]) {
        handleSeleccionar(sugerencias[indiceActivo]);
      } else {
        handleSubmit();
      }
    }
  };

  const handleSeleccionar = (evento) => {
    setMostrarSugerencias(false);
    setIndiceActivo(-1);
    navegar(`/evento/${evento._id}`);
  };

  return (
    <div style={{
      position: "relative",
      width: "100%",
      height: compacto ? (esMobil ? "70px" : "100px") : (esMobil ? "160px" : "300px"),
    }}>

      {/* imagen de fondo recortada */}
      <div style={{ position: "absolute", inset: 0, overflow: "hidden" }}>
        <img
          src={headerImg}
          alt="Me Apunto cabecera"
          style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center" }}
        />
        <div style={{ position: "absolute", inset: 0, backgroundColor: "rgba(0,0,0,0)" }} />
      </div>

      {/* titulo compacto */}
      {compacto && (
        <div style={{
          position: "absolute", inset: 0, zIndex: 60,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <h1
            onClick={() => window.location.href = "/"}
            onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); window.location.href = "/"; } }}
            tabIndex={0}
            role="link"
            aria-label="Me Apunto — ir a la página de inicio"
            style={{
              fontSize: esMobil ? "22px" : "32px",
              color: "white",
              textShadow: "2px 2px 8px rgba(0,0,0,0.5)",
              margin: 0, cursor: "pointer",
              fontFamily: "'Butterpop', Helvetica, sans-serif"
            }}
          >
            ME APUNTO
          </h1>
        </div>
      )}

      {/* titulo y buscador encima de la imagen */}
      {!compacto && <div style={{
        position: "absolute", inset: 0, zIndex: 10,
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        gap: esMobil ? "8px" : "16px",
      }}>
        <h1
          onClick={() => window.location.href = "/"}
          onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); window.location.href = "/"; } }}
          tabIndex={0}
          role="link"
          aria-label="Me Apunto — ir a la página de inicio"
          style={{
            fontSize: esMobil ? "32px" : "56px",
            color: "white",
            textShadow: "2px 2px 8px rgba(0,0,0,0.5)",
            margin: 0, cursor: "pointer",
            fontFamily: "'Butterpop', Helvetica, sans-serif"
          }}
        >
          ME APUNTO
        </h1>

        {mostrarBuscador && (
          <div
            ref={contenedorRef}
            style={{
              position: "relative",
              width: "100%",
              maxWidth: esMobil ? "100%" : "500px",
              padding: esMobil ? "0 20px" : "0 16px",
              boxSizing: "border-box",
            }}
          >
            {/* fila input + botón */}
            <div style={{ display: "flex" }}>
              <input
                type="text"
                role="combobox"
                aria-label="Buscar evento o categoría"
                aria-expanded={mostrarSugerencias}
                aria-haspopup="listbox"
                aria-controls={listboxId}
                aria-autocomplete="list"
                aria-activedescendant={indiceActivo >= 0 ? `sugerencia-${indiceActivo}` : undefined}
                value={valor}
                placeholder="Buscar evento o categoría"
                onChange={handleChange}
                onKeyDown={handleKeyDown}
                style={{
                  flex: 1,
                  backgroundColor: "rgba(255,255,255,0.6)",
                  padding: esMobil ? "6px 10px" : "10px 14px",
                  fontSize: esMobil ? "13px" : "16px",
                  outline: "none", border: "none",
                  fontFamily: "'Baloo Bhai 2', Helvetica",
                  borderRadius: "4px 0 0 4px",
                }}
              />
              <button
                onClick={handleSubmit}
                style={{
                  backgroundColor: "#b79868", color: "white",
                  padding: esMobil ? "6px 14px" : "10px 24px",
                  fontSize: esMobil ? "13px" : "16px",
                  fontWeight: "bold", border: "none", cursor: "pointer",
                  fontFamily: "'Baloo Bhai 2', Helvetica",
                  borderRadius: "0 4px 4px 0",
                  whiteSpace: "nowrap",
                }}
              >
                Buscar
              </button>
            </div>

            {/* dropdown de sugerencias */}
            {mostrarSugerencias && sugerencias.length > 0 && (
              <div
                id={listboxId}
                role="listbox"
                aria-label="Sugerencias de eventos"
                style={{
                position: "absolute",
                top: "100%",
                left: esMobil ? "20px" : "16px",
                right: esMobil ? "20px" : "16px",
                backgroundColor: "white",
                borderRadius: "0 0 8px 8px",
                boxShadow: "0 8px 24px rgba(0,0,0,0.15)",
                zIndex: 100,
                overflow: "hidden",
              }}>
                {sugerencias.map((evento, i) => (
                  <div
                    key={evento._id}
                    id={`sugerencia-${i}`}
                    role="option"
                    aria-selected={i === indiceActivo}
                    tabIndex={-1}
                    onClick={() => handleSeleccionar(evento)}
                    onKeyDown={(e) => { if (e.key === "Enter") handleSeleccionar(evento); }}
                    style={{
                      display: "flex", alignItems: "center", gap: "10px",
                      padding: "10px 14px", cursor: "pointer",
                      borderTop: i > 0 ? "1px solid #f0e8dc" : "none",
                      transition: "background-color 0.1s ease",
                      backgroundColor: i === indiceActivo ? "#fdf6ec" : "white",
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#fdf6ec"}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = i === indiceActivo ? "#fdf6ec" : "white"}
                  >
                    {/* miniatura */}
                    <img
                      src={evento.imagen || `https://picsum.photos/seed/${evento._id}/40/40`}
                      alt=""
                      style={{ width: "36px", height: "36px", objectFit: "cover", borderRadius: "6px", flexShrink: 0 }}
                    />
                    <div style={{ minWidth: 0 }}>
                      <div style={{
                        fontFamily: "'Baloo Bhai 2', Helvetica",
                        fontSize: "14px", fontWeight: "600", color: "#1a1a1a",
                        overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                      }}>
                        {evento.titulo}
                      </div>
                      <div style={{
                        fontFamily: "'Baloo Bhai 2', Helvetica",
                        fontSize: "12px", color: "#818181",
                        overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                      }}>
                        {evento.venue} · {new Date(evento.fecha).toLocaleDateString("es-ES")}
                      </div>
                    </div>
                    {evento.precio === 0 ? (
                      <span style={{
                        marginLeft: "auto", flexShrink: 0,
                        fontSize: "12px", fontWeight: "700",
                        color: "#2e7d32", fontFamily: "'Baloo Bhai 2', Helvetica"
                      }}>Gratis</span>
                    ) : (
                      <span style={{
                        marginLeft: "auto", flexShrink: 0,
                        fontSize: "12px", fontWeight: "700",
                        color: "#91703d", fontFamily: "'Baloo Bhai 2', Helvetica"
                      }}>{evento.precio}€</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>}
    </div>
  );
}

export default Hero;

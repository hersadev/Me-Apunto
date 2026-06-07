// pagina principal - la primera que ve el usuario
// ahora conectada con el backend usando eventoService
// calendario con vista de mes y semana funcionales
// al hacer click en un dia con evento navega al detalle

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { Helmet } from "react-helmet-async";
import { useNavigate } from "react-router-dom";

import Navbar from "../components/Navbar";
import Hero from "../components/Hero";
import Footer from "../components/Footer";
import EventCard from "../components/EventCard";

import eventoService from "../services/eventoService";

const EVENTOS_POR_PAGINA = 8;

const nombresMeses = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
];

const nombresDias = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

const COLORES_CATEGORIA = {
  taller: "#e67e22",
  exposicion: "#9b59b6",
  concurso: "#e74c3c",
  concierto: "#3498db",
  deporte: "#27ae60",
  gastronomia: "#f39c12",
  teatro: "#d35400",
  otros: "#b79868",
};

function CirculoEvento({ evento, navegar, size = 10 }) {
  const color = COLORES_CATEGORIA[evento.categoria] ?? "#b79868";
  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={`Ver evento: ${evento.titulo}`}
      onClick={(e) => { e.stopPropagation(); navegar(`/evento/${evento._id}`); }}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); navegar(`/evento/${evento._id}`); } }}
      onMouseEnter={(e) => { const t = e.currentTarget.querySelector("[data-tooltip]"); if (t) t.style.display = "block"; }}
      onMouseLeave={(e) => { const t = e.currentTarget.querySelector("[data-tooltip]"); if (t) t.style.display = "none"; }}
      style={{ position: "relative", display: "inline-flex", cursor: "pointer", flexShrink: 0 }}
    >
      <div style={{ width: `${size}px`, height: `${size}px`, backgroundColor: color, borderRadius: "999px" }} />
      <div data-tooltip style={{
        display: "none", position: "absolute",
        bottom: "calc(100% + 4px)", left: "50%", transform: "translateX(-50%)",
        backgroundColor: "#3a2e1e", color: "white",
        fontSize: "11px", fontFamily: "'Baloo Bhai 2', Helvetica",
        padding: "4px 8px", borderRadius: "6px",
        whiteSpace: "nowrap", boxShadow: "0 2px 8px rgba(0,0,0,0.25)",
        pointerEvents: "none", zIndex: 20,
      }}>
        {evento.hora} · {evento.titulo}
        <div style={{
          position: "absolute", top: "100%", left: "50%", transform: "translateX(-50%)",
          width: 0, height: 0,
          borderLeft: "4px solid transparent", borderRight: "4px solid transparent",
          borderTop: "4px solid #3a2e1e",
        }} />
      </div>
    </div>
  );
}

function Home({ estaLogueado }) {

  const navegar = useNavigate();

  // ── detección de ancho reactiva ──
  const [anchoVentana, setAnchoVentana] = useState(window.innerWidth);
  useEffect(() => {
    const h = () => setAnchoVentana(window.innerWidth);
    window.addEventListener("resize", h);
    return () => window.removeEventListener("resize", h);
  }, []);
  const esMobil = anchoVentana < 768;

  const [eventos, setEventos] = useState([]);
  const [eventosPatrocinados, setEventosPatrocinados] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [busqueda, setBusqueda] = useState("");
  const [categoria, setCategoria] = useState("");
  const [fecha, setFecha] = useState("");
  const [tipo, setTipo] = useState("");
  const [paginaActual, setPaginaActual] = useState(1);
  const [totalPaginas, setTotalPaginas] = useState(1);

  const [indiceCarrusel, setIndiceCarrusel] = useState(0);
  const carruselTimer = useRef(null);
  const carruselRef = useRef(null);
  const [anchoSlide, setAnchoSlide] = useState(0);

  const GAP = 24;
  const tarjetasPorVista = esMobil ? 1 : 3;
  const anchoTarjeta = anchoSlide > 0 ? Math.floor((anchoSlide - GAP * (tarjetasPorVista - 1)) / tarjetasPorVista) : 0;
  const anchoStep = anchoTarjeta + GAP;

  useEffect(() => {
    const actualizar = () => {
      if (carruselRef.current) setAnchoSlide(carruselRef.current.offsetWidth);
    };
    actualizar();
    window.addEventListener("resize", actualizar);
    return () => window.removeEventListener("resize", actualizar);
  }, [eventosPatrocinados]);

  const avanzarCarrusel = useCallback(() => {
    setIndiceCarrusel((prev) => {
      const maxIndice = Math.max(0, eventosPatrocinados.length - tarjetasPorVista);
      return prev >= maxIndice ? 0 : prev + 1;
    });
  }, [eventosPatrocinados.length, tarjetasPorVista]);

  useEffect(() => {
    if (eventosPatrocinados.length <= tarjetasPorVista) return;
    carruselTimer.current = setInterval(avanzarCarrusel, 4000);
    return () => clearInterval(carruselTimer.current);
  }, [eventosPatrocinados.length, avanzarCarrusel, tarjetasPorVista]);

  const irASlide = (indice) => {
    setIndiceCarrusel(indice);
    clearInterval(carruselTimer.current);
    carruselTimer.current = setInterval(avanzarCarrusel, 4000);
  };

  const hayFlechas = eventosPatrocinados.length > tarjetasPorVista;
  const paddingFlechas = hayFlechas ? (esMobil ? "20px" : "28px") : "0";

  const irAAnterior = () => {
    const max = Math.max(0, eventosPatrocinados.length - tarjetasPorVista);
    irASlide(indiceCarrusel === 0 ? max : indiceCarrusel - 1);
  };
  const irASiguiente = () => {
    const max = Math.max(0, eventosPatrocinados.length - tarjetasPorVista);
    irASlide(indiceCarrusel >= max ? 0 : indiceCarrusel + 1);
  };

  const [mesCalendario, setMesCalendario] = useState(new Date().getMonth());
  const [anioCalendario, setAnioCalendario] = useState(new Date().getFullYear());
  const [vistaCalendario, setVistaCalendario] = useState("Mes");

  const [lunesSemana, setLunesSemana] = useState(() => {
    const hoy = new Date();
    const dia = hoy.getDay();
    const lunes = new Date(hoy);
    lunes.setDate(hoy.getDate() - (dia === 0 ? 6 : dia - 1));
    lunes.setHours(0, 0, 0, 0);
    return lunes;
  });

  useEffect(() => {
    cargarEventos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paginaActual, tipo]);

  // recarga cuando se limpian todos los filtros
  useEffect(() => {
    if (!busqueda && !categoria && !fecha && !tipo) {
      cargarEventos();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [busqueda, categoria, fecha, tipo]);

  const cargarEventos = async () => {
    try {
      setCargando(true);
      setError("");

      const params = { pagina: paginaActual, limite: EVENTOS_POR_PAGINA };
      if (busqueda) params.busqueda = busqueda;
      if (tipo) params.tipo = tipo;
      if (categoria) params.categoria = categoria;
      if (fecha) params.fecha = fecha;

      const dataNormales = await eventoService.getEventos({ ...params, patrocinado: "false" });
      const dataPatrocinados = await eventoService.getEventos({ limite: 100, patrocinado: "true" });

      setEventos(dataNormales.eventos);
      setTotalPaginas(dataNormales.totalPaginas);
      setEventosPatrocinados(dataPatrocinados.eventos);

    } catch (err) {
      setError("Error al cargar los eventos");
      console.error(err);
    } finally {
      setCargando(false);
    }
  };

  const handleBuscar = () => {
    setPaginaActual(1);
    cargarEventos();
  };

  const limpiarFiltros = () => {
    setBusqueda("");
    setCategoria("");
    setFecha("");
    setTipo("");
    setPaginaActual(1);
  };

  const hayFiltros = busqueda || categoria || fecha || tipo;

  const mesPrevio = () => {
    if (mesCalendario === 0) {
      setMesCalendario(11);
      setAnioCalendario(anioCalendario - 1);
    } else {
      setMesCalendario(mesCalendario - 1);
    }
  };

  const mesSiguiente = () => {
    if (mesCalendario === 11) {
      setMesCalendario(0);
      setAnioCalendario(anioCalendario + 1);
    } else {
      setMesCalendario(mesCalendario + 1);
    }
  };

  const primerDiaMes = () => {
    const dia = new Date(anioCalendario, mesCalendario, 1).getDay();
    return dia === 0 ? 6 : dia - 1;
  };

  const diasEnMes = () => {
    return new Date(anioCalendario, mesCalendario + 1, 0).getDate();
  };

  const semanaPrevia = () => {
    const nuevaFecha = new Date(lunesSemana);
    nuevaFecha.setDate(lunesSemana.getDate() - 7);
    setLunesSemana(nuevaFecha);
  };

  const semanaSiguiente = () => {
    const nuevaFecha = new Date(lunesSemana);
    nuevaFecha.setDate(lunesSemana.getDate() + 7);
    setLunesSemana(nuevaFecha);
  };

  const eventosIndexados = useMemo(() => {
    const map = {};
    [...eventos, ...eventosPatrocinados].forEach((e) => {
      const key = new Date(e.fecha).toDateString();
      if (!map[key]) map[key] = [];
      map[key].push(e);
    });
    return map;
  }, [eventos, eventosPatrocinados]);

  const eventosDelDia = (fecha) => eventosIndexados[fecha.toDateString()] || [];

  const diasDeLaSemana = useMemo(() => {
    return [...Array(7)].map((_, i) => {
      const dia = new Date(lunesSemana);
      dia.setDate(lunesSemana.getDate() + i);
      return dia;
    });
  }, [lunesSemana]);

  const tituloSemana = useMemo(() => {
    const primero = diasDeLaSemana[0];
    const ultimo = diasDeLaSemana[6];
    if (primero.getMonth() === ultimo.getMonth()) {
      return `${primero.getDate()} - ${ultimo.getDate()} ${nombresMeses[primero.getMonth()]} ${primero.getFullYear()}`;
    } else {
      return `${primero.getDate()} ${nombresMeses[primero.getMonth()]} - ${ultimo.getDate()} ${nombresMeses[ultimo.getMonth()]} ${ultimo.getFullYear()}`;
    }
  }, [diasDeLaSemana]);

  const handleClickDia = (eventosDelDiaArr) => {
    if (eventosDelDiaArr.length > 0) {
      navegar(`/evento/${eventosDelDiaArr[0]._id}`);
    }
  };

  const filaUno = eventos.slice(0, 4);
  const filaDos = eventos.slice(4, 8);


  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f0e8dc", display: "flex", flexDirection: "column" }}>

      <Helmet>
        <title>Me Apunto | Descubre eventos cerca de ti</title>
        <meta name="description" content="Descubre y apúntate a los mejores eventos de tu ciudad. Talleres, exposiciones, conciertos y mucho más. Gratis o de pago." />
        <meta name="keywords" content="eventos, talleres, exposiciones, conciertos, actividades, ocio, cultura" />
        <meta property="og:title" content="Me Apunto | Descubre eventos cerca de ti" />
        <meta property="og:description" content="Descubre y apúntate a los mejores eventos de tu ciudad." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://me-apunto-alpha.vercel.app" />
        <meta name="robots" content="index, follow" />
        <html lang="es" />
      </Helmet>

      <div style={{ position: "relative" }}>
        <Navbar mostrarInicio={false} estaLogueado={estaLogueado} />
        <Hero mostrarBuscador={true} onBuscar={(valor) => setBusqueda(valor)} onSubmit={handleBuscar} />
      </div>

      <main id="main-content" style={{
        flex: 1, width: "100%", maxWidth: "1200px",
        margin: "0 auto",
        padding: esMobil ? "16px 12px" : "24px 16px"
      }}>

        {/* filtros */}
        <div style={{
          display: "flex",
          gap: esMobil ? "8px" : "12px",
          justifyContent: "center",
          marginBottom: esMobil ? "24px" : "40px",
          flexWrap: "wrap",
          alignItems: "center",
          padding: esMobil ? "0 4px" : "0"
        }}>
          <select aria-label="Filtrar por categoría" value={categoria} onChange={(e) => setCategoria(e.target.value)} style={{
            backgroundColor: "#f9f6f1", border: "1px solid #afacac",
            fontSize: esMobil ? "14px" : "20px",
            padding: esMobil ? "6px 10px" : "8px 16px",
            width: esMobil ? "calc(50% - 4px)" : "auto",
            minWidth: esMobil ? "0" : "150px",
            cursor: "pointer",
            fontFamily: "'Baloo Bhai 2', Helvetica"
          }}>
            <option value="">Todo evento</option>
            <option value="taller">Taller</option>
            <option value="exposicion">Exposición</option>
            <option value="concurso">Concurso</option>
            <option value="concierto">Concierto</option>
            <option value="deporte">Deporte</option>
            <option value="gastronomia">Gastronomía</option>
            <option value="teatro">Teatro</option>
            <option value="otros">Otros</option>
          </select>

          <select aria-label="Filtrar por fecha" value={fecha} onChange={(e) => setFecha(e.target.value)} style={{
            backgroundColor: "#f9f6f1", border: "1px solid #afacac",
            fontSize: esMobil ? "14px" : "20px",
            padding: esMobil ? "6px 10px" : "8px 16px",
            width: esMobil ? "calc(50% - 4px)" : "auto",
            minWidth: esMobil ? "0" : "150px",
            cursor: "pointer",
            fontFamily: "'Baloo Bhai 2', Helvetica"
          }}>
            <option value="">Toda Fecha</option>
            <option value="hoy">Hoy</option>
            <option value="semana">Esta semana</option>
            <option value="mes">Este mes</option>
          </select>

          <select aria-label="Filtrar por tipo" value={tipo} onChange={(e) => setTipo(e.target.value)} style={{
            backgroundColor: "#f9f6f1", border: "1px solid #afacac",
            fontSize: esMobil ? "14px" : "20px",
            padding: esMobil ? "6px 10px" : "8px 16px",
            width: esMobil ? "calc(50% - 4px)" : "auto",
            minWidth: esMobil ? "0" : "150px",
            cursor: "pointer",
            fontFamily: "'Baloo Bhai 2', Helvetica"
          }}>
            <option value="">Todo Tipo</option>
            <option value="gratuito">Gratuito</option>
            <option value="de-pago">De pago</option>
          </select>

          <button onClick={handleBuscar} style={{
            backgroundColor: "#b79868", color: "white", fontWeight: "bold",
            fontSize: esMobil ? "14px" : "20px",
            padding: esMobil ? "8px 0" : "8px 24px",
            width: esMobil ? "calc(50% - 4px)" : "auto",
            borderRadius: "999px", border: "none", cursor: "pointer",
            fontFamily: "'Baloo Bhai 2', Helvetica", transition: "background-color 0.15s ease"
          }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#91703d"}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "#b79868"}
          >
            Aplicar filtros
          </button>

          {hayFiltros && (
            <button
              onClick={limpiarFiltros}
              style={{
                backgroundColor: "transparent",
                color: "#c0392b",
                fontWeight: "bold",
                fontSize: esMobil ? "14px" : "18px",
                padding: esMobil ? "8px 0" : "8px 20px",
                width: esMobil ? "100%" : "auto",
                borderRadius: "999px",
                border: "2px solid #c0392b",
                cursor: "pointer",
                fontFamily: "'Baloo Bhai 2', Helvetica",
                transition: "all 0.15s ease"
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "#c0392b";
                e.currentTarget.style.color = "white";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "transparent";
                e.currentTarget.style.color = "#c0392b";
              }}
            >
              ✕ Limpiar filtros
            </button>
          )}
        </div>

        {/* estado de carga */}
        {cargando && (
          <div style={{
            textAlign: "center", padding: "64px 0",
            color: "#818181", fontFamily: "'Baloo Bhai 2', Helvetica", fontSize: "20px"
          }}>
            Cargando eventos...
          </div>
        )}

        {/* error */}
        {error && (
          <div style={{
            textAlign: "center", padding: "64px 0",
            color: "#c0392b", fontFamily: "'Baloo Bhai 2', Helvetica", fontSize: "20px"
          }}>
            {error}
          </div>
        )}

        {/* eventos */}
        {!cargando && !error && (
          <>
            {/* ── CARRUSEL PATROCINADOS ── */}
            {eventosPatrocinados.length > 0 && (
              <div style={{ marginBottom: esMobil ? "32px" : "48px" }}>
                <div style={{
                  display: "flex", alignItems: "center",
                  justifyContent: "center", gap: "8px",
                  marginBottom: esMobil ? "16px" : "24px"
                }}>
                  <span style={{
                    fontFamily: "'Baloo Bhai 2', Helvetica",
                    fontSize: esMobil ? "16px" : "20px",
                    fontWeight: "700", color: "#b79868"
                  }}>
                    ★ Eventos Destacados
                  </span>
                </div>

                <div style={{ position: "relative", padding: `0 ${paddingFlechas}` }}>
                  {/* flecha izquierda */}
                  {hayFlechas && (
                    <button aria-label="Evento destacado anterior" onClick={irAAnterior} style={{
                      position: "absolute", left: 0, top: "50%", transform: "translateY(-50%)",
                      width: paddingFlechas, height: "48px", zIndex: 2,
                      backgroundColor: "#b79868", border: "none", cursor: "pointer",
                      color: "white", fontSize: "20px", display: "flex",
                      alignItems: "center", justifyContent: "center",
                      borderRadius: "6px", boxShadow: "0 2px 8px rgba(0,0,0,0.15)"
                    }} aria-hidden={false}><span aria-hidden="true">‹</span></button>
                  )}

                  {/* ventana del carrusel */}
                  <div ref={carruselRef} style={{ overflow: "hidden" }}>
                    <div style={{
                      display: "flex",
                      gap: `${GAP}px`,
                      transform: anchoTarjeta > 0 ? `translateX(-${indiceCarrusel * anchoStep}px)` : "none",
                      transition: "transform 0.4s ease",
                    }}>
                      {eventosPatrocinados.map((evento) => (
                        <div key={evento._id} style={{
                          flexShrink: 0,
                          width: anchoTarjeta > 0 ? `${anchoTarjeta}px` : "300px"
                        }}>
                          <EventCard evento={evento} destacado={true} />
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* flecha derecha */}
                  {hayFlechas && (
                    <button aria-label="Evento destacado siguiente" onClick={irASiguiente} style={{
                      position: "absolute", right: 0, top: "50%", transform: "translateY(-50%)",
                      width: paddingFlechas, height: "48px", zIndex: 2,
                      backgroundColor: "#b79868", border: "none", cursor: "pointer",
                      color: "white", fontSize: "20px", display: "flex",
                      alignItems: "center", justifyContent: "center",
                      borderRadius: "6px", boxShadow: "0 2px 8px rgba(0,0,0,0.15)"
                    }}><span aria-hidden="true">›</span></button>
                  )}
                </div>

                {/* puntos indicadores */}
                {hayFlechas && (
                  <div style={{ display: "flex", justifyContent: "center", gap: "8px", marginTop: "16px" }}>
                    {[...Array(Math.max(0, eventosPatrocinados.length - tarjetasPorVista + 1))].map((_, i) => (
                      <button key={i} aria-label={`Ir al evento destacado ${i + 1}`} aria-current={i === indiceCarrusel ? "true" : undefined} onClick={() => irASlide(i)} style={{
                        width: i === indiceCarrusel ? "20px" : "8px",
                        height: "8px", borderRadius: "999px",
                        backgroundColor: i === indiceCarrusel ? "#b79868" : "#d4b896",
                        border: "none", cursor: "pointer", padding: 0,
                        transition: "all 0.3s ease"
                      }} />
                    ))}
                  </div>
                )}

                <div style={{
                  width: "100%", height: "1px",
                  backgroundColor: "#d4b896", marginTop: "40px", opacity: 0.5
                }} />
              </div>
            )}

            {/* ── EVENTOS NORMALES ── */}
            {filaUno.length > 0 && (
              <div style={{
                display: "flex", flexWrap: "wrap",
                gap: esMobil ? "16px" : "28px",
                justifyContent: "center",
                marginBottom: esMobil ? "16px" : "40px"
              }}>
                {filaUno.map((evento) => (
                  <EventCard key={evento._id} evento={evento} />
                ))}
              </div>
            )}

            {filaDos.length > 0 && (
              <div style={{
                display: "flex", flexWrap: "wrap",
                gap: esMobil ? "16px" : "28px",
                justifyContent: "center",
                marginBottom: esMobil ? "16px" : "32px"
              }}>
                {filaDos.map((evento) => (
                  <EventCard key={evento._id} evento={evento} />
                ))}
              </div>
            )}

            {/* paginacion */}
            {totalPaginas > 1 && (
              <div style={{
                display: "flex", justifyContent: "center",
                alignItems: "center", gap: "8px", margin: "32px 0"
              }}>
                <button
                  aria-label="Primera página"
                  onClick={() => setPaginaActual(1)}
                  disabled={paginaActual === 1}
                  style={{
                    fontSize: "22px", color: "#b79868", fontWeight: "bold",
                    cursor: paginaActual === 1 ? "default" : "pointer",
                    background: "none", border: "none",
                    opacity: paginaActual === 1 ? 0.3 : 1,
                    fontFamily: "'Baloo Bhai 2', Helvetica", lineHeight: 1,
                  }}
                >
                  &laquo;
                </button>
                <button
                  aria-label="Página anterior"
                  onClick={() => setPaginaActual((p) => Math.max(p - 1, 1))}
                  disabled={paginaActual === 1}
                  style={{
                    fontSize: "28px", color: "#b79868", fontWeight: "bold",
                    cursor: paginaActual === 1 ? "default" : "pointer",
                    background: "none", border: "none",
                    opacity: paginaActual === 1 ? 0.3 : 1,
                    fontFamily: "'Baloo Bhai 2', Helvetica"
                  }}
                >
                  &lt;
                </button>
                <span style={{
                  fontSize: "22px", color: "#818181", fontWeight: "bold",
                  fontFamily: "'Baloo Bhai 2', Helvetica", minWidth: "64px", textAlign: "center"
                }}>
                  {paginaActual} / {totalPaginas}
                </span>
                <button
                  aria-label="Página siguiente"
                  onClick={() => setPaginaActual((p) => Math.min(p + 1, totalPaginas))}
                  disabled={paginaActual === totalPaginas}
                  style={{
                    fontSize: "28px", color: "#b79868", fontWeight: "bold",
                    cursor: paginaActual === totalPaginas ? "default" : "pointer",
                    background: "none", border: "none",
                    opacity: paginaActual === totalPaginas ? 0.3 : 1,
                    fontFamily: "'Baloo Bhai 2', Helvetica"
                  }}
                >
                  &gt;
                </button>
                <button
                  aria-label="Última página"
                  onClick={() => setPaginaActual(totalPaginas)}
                  disabled={paginaActual === totalPaginas}
                  style={{
                    fontSize: "22px", color: "#b79868", fontWeight: "bold",
                    cursor: paginaActual === totalPaginas ? "default" : "pointer",
                    background: "none", border: "none",
                    opacity: paginaActual === totalPaginas ? 0.3 : 1,
                    fontFamily: "'Baloo Bhai 2', Helvetica", lineHeight: 1,
                  }}
                >
                  &raquo;
                </button>
              </div>
            )}

            {eventos.length === 0 && eventosPatrocinados.length === 0 && (
              <div style={{
                textAlign: "center", color: "#818181", fontSize: "20px",
                padding: "64px 0", fontFamily: "'Baloo Bhai 2', Helvetica"
              }}>
                No se encontraron eventos
              </div>
            )}
          </>
        )}

        {/* calendario */}
        <div style={{ marginTop: esMobil ? "24px" : "40px", marginBottom: "16px" }}>
          <div translate="no" style={{
            width: "100%", maxWidth: "700px", margin: "0 auto",
            backgroundColor: "white", borderRadius: "12px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.1)", overflow: "hidden"
          }}>

            <div style={{
              padding: esMobil ? "10px 10px" : "12px 16px",
              display: "flex", alignItems: "center",
              justifyContent: "space-between", borderBottom: "1px solid #e5e7eb"
            }}>
              <div style={{ display: "flex", gap: "4px", alignItems: "center" }}>
                <button
                  aria-label={vistaCalendario === "Mes" ? "Mes anterior" : "Semana anterior"}
                  onClick={vistaCalendario === "Mes" ? mesPrevio : semanaPrevia}
                  style={{
                    background: "none", border: "none", cursor: "pointer",
                    color: "#6b7280", fontSize: "16px",
                    padding: esMobil ? "6px 6px" : "4px 8px",
                    fontFamily: "'Baloo Bhai 2', Helvetica",
                    minWidth: "32px", minHeight: "32px"
                  }}
                ><span aria-hidden="true">&lt;</span></button>
                <button
                  aria-label={vistaCalendario === "Mes" ? "Mes siguiente" : "Semana siguiente"}
                  onClick={vistaCalendario === "Mes" ? mesSiguiente : semanaSiguiente}
                  style={{
                    background: "none", border: "none", cursor: "pointer",
                    color: "#6b7280", fontSize: "16px",
                    padding: esMobil ? "6px 6px" : "4px 8px",
                    fontFamily: "'Baloo Bhai 2', Helvetica",
                    minWidth: "32px", minHeight: "32px"
                  }}
                ><span aria-hidden="true">&gt;</span></button>
                <button onClick={() => {
                  setMesCalendario(new Date().getMonth());
                  setAnioCalendario(new Date().getFullYear());
                  const hoy = new Date();
                  const dia = hoy.getDay();
                  const lunes = new Date(hoy);
                  lunes.setDate(hoy.getDate() - (dia === 0 ? 6 : dia - 1));
                  lunes.setHours(0, 0, 0, 0);
                  setLunesSemana(lunes);
                }} style={{
                  background: "none", border: "none", cursor: "pointer",
                  color: "#b79868", fontSize: "13px", marginLeft: "4px",
                  fontFamily: "'Baloo Bhai 2', Helvetica", fontWeight: "600"
                }}>Hoy</button>
              </div>

              <span style={{
                fontWeight: "bold", color: "#374151",
                fontSize: esMobil ? "11px" : "15px",
                fontFamily: "'Baloo Bhai 2', Helvetica",
                textAlign: "center", flex: 1,
                margin: esMobil ? "0 4px" : "0 8px",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap"
              }}>
                {vistaCalendario === "Mes"
                  ? `${nombresMeses[mesCalendario]} de ${anioCalendario}`
                  : tituloSemana}
              </span>

              {!esMobil && (
                <select aria-label="Vista del calendario" value={vistaCalendario} onChange={(e) => setVistaCalendario(e.target.value)} style={{
                  fontSize: "13px", border: "1px solid #d1d5db",
                  padding: "4px 8px", borderRadius: "4px",
                  fontFamily: "'Baloo Bhai 2', Helvetica", cursor: "pointer"
                }}>
                  <option>Mes</option>
                  <option>Semana</option>
                </select>
              )}

              {esMobil && (
                <div style={{ display: "flex", gap: "4px", flexShrink: 0 }}>
                  <button onClick={() => setVistaCalendario("Mes")} style={{
                    fontSize: "11px", padding: "6px 8px", borderRadius: "4px",
                    border: "1px solid #d1d5db", cursor: "pointer",
                    fontFamily: "'Baloo Bhai 2', Helvetica",
                    minHeight: "32px",
                    backgroundColor: vistaCalendario === "Mes" ? "#b79868" : "white",
                    color: vistaCalendario === "Mes" ? "white" : "#6b7280"
                  }}>Mes</button>
                  <button onClick={() => setVistaCalendario("Semana")} style={{
                    fontSize: "11px", padding: "6px 8px", borderRadius: "4px",
                    border: "1px solid #d1d5db", cursor: "pointer",
                    fontFamily: "'Baloo Bhai 2', Helvetica",
                    minHeight: "32px",
                    backgroundColor: vistaCalendario === "Semana" ? "#b79868" : "white",
                    color: vistaCalendario === "Semana" ? "white" : "#6b7280"
                  }}>Sem</button>
                </div>
              )}
            </div>

            {/* ── VISTA MES ── */}
            {vistaCalendario === "Mes" && (
              <>
                <div style={{
                  display: "grid", gridTemplateColumns: "repeat(7, 1fr)",
                  textAlign: "center", borderBottom: "1px solid #e5e7eb"
                }}>
                  {(esMobil
                    ? ["L", "M", "X", "J", "V", "S", "D"]
                    : ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"]
                  ).map((dia) => (
                    <div key={dia} style={{
                      fontSize: "11px", fontWeight: "600", color: "#6b7280",
                      padding: "8px 0", fontFamily: "'Baloo Bhai 2', Helvetica"
                    }}>{dia}</div>
                  ))}
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)" }}>
                  {[...Array(primerDiaMes())].map((_, i) => (
                    <div key={`vacio-${i}`} style={{
                      border: "1px solid #f3f4f6",
                      minHeight: esMobil ? "36px" : "50px", padding: "2px"
                    }} />
                  ))}

                  {[...Array(diasEnMes())].map((_, i) => {
                    const dia = i + 1;
                    const diaDate = new Date(anioCalendario, mesCalendario, dia);
                    const evsDia = eventosIndexados[diaDate.toDateString()] || [];
                    const hoy = new Date();
                    const esHoy = dia === hoy.getDate() &&
                      mesCalendario === hoy.getMonth() &&
                      anioCalendario === hoy.getFullYear();
                    const tieneEventos = evsDia.length > 0;

                    return (
                      <div key={dia}
                        role={tieneEventos ? "button" : undefined}
                        tabIndex={tieneEventos ? 0 : undefined}
                        aria-label={tieneEventos ? `${dia} de ${nombresMeses[mesCalendario]}, ${evsDia.length} evento${evsDia.length > 1 ? "s" : ""}` : undefined}
                        onClick={() => tieneEventos && handleClickDia(evsDia)}
                        onKeyDown={(e) => { if (tieneEventos && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); handleClickDia(evsDia); } }}
                        style={{
                          border: "1px solid #f3f4f6",
                          minHeight: esMobil ? "36px" : "50px", padding: "2px",
                          backgroundColor: esHoy ? "#fdf6ec" : "transparent",
                          cursor: tieneEventos ? "pointer" : "default",
                          transition: "background-color 0.15s ease"
                        }}
                        onMouseEnter={(e) => { if (tieneEventos) e.currentTarget.style.backgroundColor = "#f5ead8"; }}
                        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = esHoy ? "#fdf6ec" : "transparent"; }}
                      >
                        <span style={{
                          fontSize: "10px", color: esHoy ? "#b79868" : "#6b7280",
                          fontWeight: esHoy ? "700" : "400", fontFamily: "'Baloo Bhai 2', Helvetica"
                        }}>{dia}</span>

                        {tieneEventos && (
                          <div style={{ display: "flex", flexWrap: "wrap", gap: "2px", marginTop: "2px" }}>
                            {evsDia.map((ev) => (
                              <CirculoEvento key={ev._id} evento={ev} navegar={navegar} size={esMobil ? 6 : 10} />
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </>
            )}

            {/* ── VISTA SEMANA ── */}
            {vistaCalendario === "Semana" && (
              <>
                <div style={{
                  display: "grid", gridTemplateColumns: "repeat(7, 1fr)",
                  borderBottom: "1px solid #e5e7eb"
                }}>
                  {diasDeLaSemana.map((diaFecha, i) => {
                    const hoy = new Date();
                    const esHoy = diaFecha.getDate() === hoy.getDate() &&
                      diaFecha.getMonth() === hoy.getMonth() &&
                      diaFecha.getFullYear() === hoy.getFullYear();
                    return (
                      <div key={i} style={{
                        textAlign: "center",
                        padding: esMobil ? "6px 2px" : "8px 4px",
                        borderRight: i < 6 ? "1px solid #f3f4f6" : "none",
                        backgroundColor: esHoy ? "#fdf6ec" : "transparent"
                      }}>
                        <div style={{
                          fontSize: esMobil ? "9px" : "11px",
                          fontWeight: "600",
                          color: esHoy ? "#b79868" : "#6b7280",
                          fontFamily: "'Baloo Bhai 2', Helvetica"
                        }}>{esMobil ? nombresDias[i].charAt(0) : nombresDias[i]}</div>
                        <div style={{
                          fontSize: esMobil ? "11px" : "16px",
                          fontWeight: esHoy ? "700" : "400",
                          color: esHoy ? "#b79868" : "#374151",
                          fontFamily: "'Baloo Bhai 2', Helvetica", marginTop: "2px"
                        }}>{diaFecha.getDate()}</div>
                      </div>
                    );
                  })}
                </div>

                <div style={{
                  display: "grid", gridTemplateColumns: "repeat(7, 1fr)",
                  minHeight: esMobil ? "80px" : "120px"
                }}>
                  {diasDeLaSemana.map((diaFecha, i) => {
                    const evsDia = eventosDelDia(diaFecha);
                    const hoy = new Date();
                    const esHoy = diaFecha.getDate() === hoy.getDate() &&
                      diaFecha.getMonth() === hoy.getMonth() &&
                      diaFecha.getFullYear() === hoy.getFullYear();
                    return (
                      <div key={i} style={{
                        padding: esMobil ? "2px" : "4px",
                        borderRight: i < 6 ? "1px solid #f3f4f6" : "none",
                        borderTop: "1px solid #f3f4f6",
                        minHeight: esMobil ? "56px" : "80px",
                        backgroundColor: esHoy ? "#fdf6ec" : "transparent"
                      }}>
                        {evsDia.length === 0 ? (
                          <div style={{ height: "100%" }} />
                        ) : (
                          <div style={{ display: "flex", flexWrap: "wrap", gap: "3px", padding: "2px" }}>
                            {evsDia.map((ev) => (
                              <CirculoEvento key={ev._id} evento={ev} navegar={navegar} size={esMobil ? 8 : 12} />
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {diasDeLaSemana.every((d) => eventosDelDia(d).length === 0) && (
                  <div style={{
                    textAlign: "center", padding: "16px", color: "#818181",
                    fontSize: "13px", fontFamily: "'Baloo Bhai 2', Helvetica",
                    borderTop: "1px solid #f3f4f6"
                  }}>
                    No hay eventos esta semana
                  </div>
                )}
              </>
            )}

          </div>
        </div>

      </main>

      <Footer />

    </div>
  );
}

export default Home;

// pagina principal - la primera que ve el usuario
// ahora conectada con el backend usando eventoService
// calendario con vista de mes y semana funcionales
// al hacer click en un dia con evento navega al detalle

import { useState, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { useNavigate } from "react-router-dom";

import Navbar from "../components/Navbar";
import Hero from "../components/Hero";
import Footer from "../components/Footer";
import EventCard from "../components/EventCard";

import eventoService from "../services/eventoService";

const EVENTOS_POR_PAGINA = 8;

const esMobil = window.innerWidth < 768;

const nombresMeses = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
];

const nombresDias = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

function Home({ estaLogueado }) {

  const navegar = useNavigate();

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
  }, [paginaActual, tipo]);

  const cargarEventos = async () => {
    try {
      setCargando(true);
      setError("");

      const params = { pagina: paginaActual, limite: EVENTOS_POR_PAGINA };
      if (busqueda) params.busqueda = busqueda;
      if (tipo) params.tipo = tipo;
      if (categoria) params.categoria = categoria;

      // peticion de eventos normales (no patrocinados) - el backend filtra
      const dataNormales = await eventoService.getEventos({ ...params, patrocinado: "false" });

      // peticion de eventos patrocinados - todos sin paginar
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

  const diasDeLaSemana = () => {
    return [...Array(7)].map((_, i) => {
      const dia = new Date(lunesSemana);
      dia.setDate(lunesSemana.getDate() + i);
      return dia;
    });
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

  const eventosDelDia = (fecha) => {
    return [...eventos, ...eventosPatrocinados].filter((e) => {
      const fechaEvento = new Date(e.fecha);
      return (
        fechaEvento.getDate() === fecha.getDate() &&
        fechaEvento.getMonth() === fecha.getMonth() &&
        fechaEvento.getFullYear() === fecha.getFullYear()
      );
    });
  };

  const tituloSemana = () => {
    const dias = diasDeLaSemana();
    const primero = dias[0];
    const ultimo = dias[6];
    if (primero.getMonth() === ultimo.getMonth()) {
      return `${primero.getDate()} - ${ultimo.getDate()} ${nombresMeses[primero.getMonth()]} ${primero.getFullYear()}`;
    } else {
      return `${primero.getDate()} ${nombresMeses[primero.getMonth()]} - ${ultimo.getDate()} ${nombresMeses[ultimo.getMonth()]} ${ultimo.getFullYear()}`;
    }
  };

  const handleClickEvento = (evento) => {
    navegar(`/evento/${evento._id}`);
  };

  const handleClickDia = (eventosDelDiaArr) => {
    if (eventosDelDiaArr.length > 0) {
      navegar(`/evento/${eventosDelDiaArr[0]._id}`);
    }
  };

  const filaUno = eventos.slice(0, 4);
  const filaDos = eventos.slice(4, 8);

  const estiloEvento = {
    fontSize: "11px",
    backgroundColor: "#b79868",
    color: "white",
    borderRadius: "4px",
    padding: "4px 6px",
    marginTop: "4px",
    cursor: "pointer",
    fontFamily: "'Baloo Bhai 2', Helvetica",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    transition: "background-color 0.15s ease"
  };

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
        <Hero mostrarBuscador={true} onBuscar={(valor) => setBusqueda(valor)} />
      </div>

      <main style={{
        flex: 1, width: "100%", maxWidth: "1200px",
        margin: "0 auto", padding: "24px 16px"
      }}>

        {/* filtros */}
        <div style={{
          display: "flex", gap: "12px", justifyContent: "center",
          marginBottom: "40px", flexWrap: "wrap", alignItems: "center"
        }}>
          <select value={categoria} onChange={(e) => setCategoria(e.target.value)} style={{
            backgroundColor: "#f9f6f1", border: "1px solid #afacac",
            fontSize: esMobil ? "14px" : "20px", padding: esMobil ? "6px 10px" : "8px 16px",
            minWidth: esMobil ? "100px" : "150px", cursor: "pointer",
            fontFamily: "'Baloo Bhai 2', Helvetica"
          }}>
            <option value="">Categoría</option>
            <option value="taller">Taller</option>
            <option value="exposicion">Exposición</option>
            <option value="concurso">Concurso</option>
          </select>

          <select value={fecha} onChange={(e) => setFecha(e.target.value)} style={{
            backgroundColor: "#f9f6f1", border: "1px solid #afacac",
            fontSize: esMobil ? "14px" : "20px", padding: esMobil ? "6px 10px" : "8px 16px",
            minWidth: esMobil ? "100px" : "150px", cursor: "pointer",
            fontFamily: "'Baloo Bhai 2', Helvetica"
          }}>
            <option value="">Fecha</option>
            <option value="hoy">Hoy</option>
            <option value="semana">Esta semana</option>
            <option value="mes">Este mes</option>
          </select>

          <select value={tipo} onChange={(e) => setTipo(e.target.value)} style={{
            backgroundColor: "#f9f6f1", border: "1px solid #afacac",
            fontSize: esMobil ? "14px" : "20px", padding: esMobil ? "6px 10px" : "8px 16px",
            minWidth: esMobil ? "100px" : "150px", cursor: "pointer",
            fontFamily: "'Baloo Bhai 2', Helvetica"
          }}>
            <option value="">Tipo</option>
            <option value="gratuito">Gratuito</option>
            <option value="de-pago">De pago</option>
          </select>

          <button onClick={handleBuscar} style={{
            backgroundColor: "#b79868", color: "white", fontWeight: "bold",
            fontSize: esMobil ? "14px" : "20px", padding: esMobil ? "6px 16px" : "8px 24px",
            borderRadius: "999px", border: "none", cursor: "pointer",
            fontFamily: "'Baloo Bhai 2', Helvetica", transition: "background-color 0.15s ease"
          }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#91703d"}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "#b79868"}
          >
            Aplicar filtros
          </button>
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
            {/* ── FILA PATROCINADOS - solo aparece si hay patrocinados ── */}
            {eventosPatrocinados.length > 0 && (
              <div style={{ marginBottom: "48px" }}>

                <div style={{
                  display: "flex", alignItems: "center",
                  justifyContent: "center", gap: "8px", marginBottom: "24px"
                }}>
                  <span style={{
                    fontFamily: "'Baloo Bhai 2', Helvetica",
                    fontSize: "20px", fontWeight: "700", color: "#b79868"
                  }}>
                    ★ Eventos Destacados
                  </span>
                </div>

                {/* scroll horizontal con el raton */}
                <div style={{
                  display: "flex",
                  gap: "28px",
                  overflowX: "auto",
                  paddingBottom: "12px",
                  paddingLeft: "8px",
                  paddingRight: "8px",
                  scrollbarWidth: "thin",
                  scrollbarColor: "#b79868 #f0e8dc",
                  justifyContent: eventosPatrocinados.length <= 4 ? "center" : "flex-start"
                }}>
                  {eventosPatrocinados.map((evento) => (
                    <div key={evento._id} style={{ flexShrink: 0 }}>
                      <EventCard evento={evento} destacado={true} />
                    </div>
                  ))}
                </div>

                <div style={{
                  width: "100%", height: "1px",
                  backgroundColor: "#d4b896", marginTop: "40px", opacity: 0.5
                }} />
              </div>
            )}

            {/* ── EVENTOS NORMALES ── */}
            {filaUno.length > 0 && (
              <div style={{
                display: "flex", flexWrap: "wrap", gap: "28px",
                justifyContent: "center", marginBottom: "40px"
              }}>
                {filaUno.map((evento) => (
                  <EventCard key={evento._id} evento={evento} />
                ))}
              </div>
            )}

            {filaDos.length > 0 && (
              <div style={{
                display: "flex", flexWrap: "wrap", gap: "28px",
                justifyContent: "center", marginBottom: "32px"
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
                alignItems: "center", gap: "16px", margin: "32px 0"
              }}>
                <button
                  onClick={() => setPaginaActual((p) => Math.max(p - 1, 1))}
                  disabled={paginaActual === 1}
                  style={{
                    fontSize: "28px", color: "#b79868", fontWeight: "bold",
                    cursor: "pointer", background: "none", border: "none",
                    opacity: paginaActual === 1 ? 0.3 : 1,
                    fontFamily: "'Baloo Bhai 2', Helvetica"
                  }}
                >
                  &lt;
                </button>
                <span style={{
                  fontSize: "22px", color: "#818181", fontWeight: "bold",
                  fontFamily: "'Baloo Bhai 2', Helvetica"
                }}>
                  {paginaActual} / {totalPaginas}
                </span>
                <button
                  onClick={() => setPaginaActual((p) => Math.min(p + 1, totalPaginas))}
                  disabled={paginaActual === totalPaginas}
                  style={{
                    fontSize: "28px", color: "#b79868", fontWeight: "bold",
                    cursor: "pointer", background: "none", border: "none",
                    opacity: paginaActual === totalPaginas ? 0.3 : 1,
                    fontFamily: "'Baloo Bhai 2', Helvetica"
                  }}
                >
                  &gt;
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
        <div style={{ marginTop: "40px", marginBottom: "16px" }}>
          <div translate="no" style={{
            width: "100%", maxWidth: "700px", margin: "0 auto",
            backgroundColor: "white", borderRadius: "12px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.1)", overflow: "hidden"
          }}>

            <div style={{
              padding: "12px 16px", display: "flex", alignItems: "center",
              justifyContent: "space-between", borderBottom: "1px solid #e5e7eb"
            }}>
              <div style={{ display: "flex", gap: "4px", alignItems: "center" }}>
                <button onClick={vistaCalendario === "Mes" ? mesPrevio : semanaPrevia} style={{
                  background: "none", border: "none", cursor: "pointer",
                  color: "#6b7280", fontSize: "16px", padding: "4px 8px",
                  fontFamily: "'Baloo Bhai 2', Helvetica"
                }}>&lt;</button>
                <button onClick={vistaCalendario === "Mes" ? mesSiguiente : semanaSiguiente} style={{
                  background: "none", border: "none", cursor: "pointer",
                  color: "#6b7280", fontSize: "16px", padding: "4px 8px",
                  fontFamily: "'Baloo Bhai 2', Helvetica"
                }}>&gt;</button>
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
                fontSize: esMobil ? "12px" : "15px",
                fontFamily: "'Baloo Bhai 2', Helvetica",
                textAlign: "center", flex: 1, margin: "0 8px"
              }}>
                {vistaCalendario === "Mes"
                  ? `${nombresMeses[mesCalendario]} de ${anioCalendario}`
                  : tituloSemana()}
              </span>

              {!esMobil && (
                <select value={vistaCalendario} onChange={(e) => setVistaCalendario(e.target.value)} style={{
                  fontSize: "13px", border: "1px solid #d1d5db",
                  padding: "4px 8px", borderRadius: "4px",
                  fontFamily: "'Baloo Bhai 2', Helvetica", cursor: "pointer"
                }}>
                  <option>Mes</option>
                  <option>Semana</option>
                </select>
              )}

              {esMobil && (
                <div style={{ display: "flex", gap: "4px" }}>
                  <button onClick={() => setVistaCalendario("Mes")} style={{
                    fontSize: "11px", padding: "4px 8px", borderRadius: "4px",
                    border: "1px solid #d1d5db", cursor: "pointer",
                    fontFamily: "'Baloo Bhai 2', Helvetica",
                    backgroundColor: vistaCalendario === "Mes" ? "#b79868" : "white",
                    color: vistaCalendario === "Mes" ? "white" : "#6b7280"
                  }}>Mes</button>
                  <button onClick={() => setVistaCalendario("Semana")} style={{
                    fontSize: "11px", padding: "4px 8px", borderRadius: "4px",
                    border: "1px solid #d1d5db", cursor: "pointer",
                    fontFamily: "'Baloo Bhai 2', Helvetica",
                    backgroundColor: vistaCalendario === "Semana" ? "#b79868" : "white",
                    color: vistaCalendario === "Semana" ? "white" : "#6b7280"
                  }}>Semana</button>
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
                  {["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"].map((dia) => (
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
                    const todosEventos = [...eventos, ...eventosPatrocinados];
                    const evsDia = todosEventos.filter((e) => {
                      const fe = new Date(e.fecha);
                      return (
                        fe.getDate() === dia &&
                        fe.getMonth() === mesCalendario &&
                        fe.getFullYear() === anioCalendario
                      );
                    });
                    const hoy = new Date();
                    const esHoy = dia === hoy.getDate() &&
                      mesCalendario === hoy.getMonth() &&
                      anioCalendario === hoy.getFullYear();
                    const tieneEventos = evsDia.length > 0;

                    return (
                      <div key={dia}
                        onClick={() => tieneEventos && handleClickDia(evsDia)}
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

                        {esMobil ? (
                          tieneEventos && (
                            <div style={{
                              width: "6px", height: "6px", backgroundColor: "#b79868",
                              borderRadius: "999px", margin: "2px auto"
                            }} />
                          )
                        ) : (
                          evsDia.map((ev) => (
                            <div key={ev._id} style={estiloEvento}
                              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#91703d"}
                              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "#b79868"}
                            >
                              {ev.hora} {ev.titulo}
                            </div>
                          ))
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
                  {diasDeLaSemana().map((diaFecha, i) => {
                    const hoy = new Date();
                    const esHoy = diaFecha.getDate() === hoy.getDate() &&
                      diaFecha.getMonth() === hoy.getMonth() &&
                      diaFecha.getFullYear() === hoy.getFullYear();
                    return (
                      <div key={i} style={{
                        textAlign: "center", padding: "8px 4px",
                        borderRight: i < 6 ? "1px solid #f3f4f6" : "none",
                        backgroundColor: esHoy ? "#fdf6ec" : "transparent"
                      }}>
                        <div style={{
                          fontSize: "11px", fontWeight: "600",
                          color: esHoy ? "#b79868" : "#6b7280",
                          fontFamily: "'Baloo Bhai 2', Helvetica"
                        }}>{nombresDias[i]}</div>
                        <div style={{
                          fontSize: esMobil ? "12px" : "16px",
                          fontWeight: esHoy ? "700" : "400",
                          color: esHoy ? "#b79868" : "#374151",
                          fontFamily: "'Baloo Bhai 2', Helvetica", marginTop: "2px"
                        }}>{diaFecha.getDate()}</div>
                      </div>
                    );
                  })}
                </div>

                <div style={{
                  display: "grid", gridTemplateColumns: "repeat(7, 1fr)", minHeight: "120px"
                }}>
                  {diasDeLaSemana().map((diaFecha, i) => {
                    const evsDia = eventosDelDia(diaFecha);
                    const hoy = new Date();
                    const esHoy = diaFecha.getDate() === hoy.getDate() &&
                      diaFecha.getMonth() === hoy.getMonth() &&
                      diaFecha.getFullYear() === hoy.getFullYear();
                    return (
                      <div key={i} style={{
                        padding: "4px",
                        borderRight: i < 6 ? "1px solid #f3f4f6" : "none",
                        borderTop: "1px solid #f3f4f6", minHeight: "80px",
                        backgroundColor: esHoy ? "#fdf6ec" : "transparent"
                      }}>
                        {evsDia.length === 0 ? (
                          <div style={{ height: "100%" }} />
                        ) : (
                          evsDia.map((ev) => (
                            <div key={ev._id} onClick={() => handleClickEvento(ev)}
                              style={{ ...estiloEvento, whiteSpace: "normal", lineHeight: "1.3" }}
                              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#91703d"}
                              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "#b79868"}
                            >
                              <div style={{ fontWeight: "700" }}>{ev.hora}</div>
                              <div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                {ev.titulo}
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    );
                  })}
                </div>

                {diasDeLaSemana().every((d) => eventosDelDia(d).length === 0) && (
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
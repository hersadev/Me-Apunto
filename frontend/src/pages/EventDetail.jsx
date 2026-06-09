// pagina de detalle de evento
// ahora conectada con el backend usando eventoService e inscripcionService
// carga el evento real de la base de datos por su id

import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { useTranslation } from "react-i18next";

import Navbar from "../components/Navbar";
import Hero from "../components/Hero";
import Footer from "../components/Footer";

import eventoService from "../services/eventoService";
import inscripcionService from "../services/inscripcionService";
import suscripcionEmpresaService from "../services/suscripcionEmpresaService";
import mensajeService from "../services/mensajeService";

function EventDetail({ estaLogueado }) {

  const { t } = useTranslation();
  const { id } = useParams();
  const navegar = useNavigate();

  // estado del evento cargado del backend
  const [evento, setEvento] = useState(null);
  const [totalInscritos, setTotalInscritos] = useState(0);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  // estado del modal de inscripcion
  const [modalAbierto, setModalAbierto] = useState(false);
  const modalRef = useRef(null);

  useEffect(() => {
    if (!modalAbierto) return;
    const focusable = modalRef.current?.querySelectorAll(
      'button, input, textarea, select, [tabindex]:not([tabindex="-1"])'
    );
    if (focusable?.length) focusable[0].focus();
  }, [modalAbierto]);

  const handleModalKeyDown = (e) => {
    if (e.key === "Escape") { setModalAbierto(false); return; }
    if (e.key !== "Tab") return;
    const focusable = Array.from(modalRef.current?.querySelectorAll(
      'button, input, textarea, select, [tabindex]:not([tabindex="-1"])'
    ) || []);
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault(); last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault(); first.focus();
    }
  };

  const [formInscripcion, setFormInscripcion] = useState({
    nombre: "",
    correo: "",
    ciudad: "",
    numPersonas: 1,
  });

  const [enviando, setEnviando] = useState(false);
  const [errorInscripcion, setErrorInscripcion] = useState("");
  const [inscripcionExitosa, setInscripcionExitosa] = useState(false);

  const [modalContactoAbierto, setModalContactoAbierto] = useState(false);
  const [formContacto, setFormContacto] = useState({ nombre: "", email: "", asunto: "", mensaje: "" });
  const [contactoExitoso, setContactoExitoso] = useState(false);
  const [enviandoContacto, setEnviandoContacto] = useState(false);
  const [errorContacto, setErrorContacto] = useState("");

  const [modalSuscripcionAbierto, setModalSuscripcionAbierto] = useState(false);
  const [emailSuscripcion, setEmailSuscripcion] = useState("");
  const [enviandoSuscripcion, setEnviandoSuscripcion] = useState(false);
  const [suscripcionExitosa, setSuscripcionExitosa] = useState(false);
  const [errorSuscripcion, setErrorSuscripcion] = useState("");

  const [botonFlotanteVisible, setBotonFlotanteVisible] = useState(false);

  const [anchoVentana, setAnchoVentana] = useState(window.innerWidth);
  useEffect(() => {
    const h = () => setAnchoVentana(window.innerWidth);
    window.addEventListener("resize", h);
    return () => window.removeEventListener("resize", h);
  }, []);
  const esMobil = anchoVentana < 768;

  useEffect(() => {
    const onScroll = () => setBotonFlotanteVisible(window.scrollY > 180);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // cargamos el evento al montar el componente
  useEffect(() => {
    cargarEvento();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const cargarEvento = async () => {
    try {
      setCargando(true);
      setError("");
      const data = await eventoService.getEventoPorId(id);
      setEvento(data.evento);
      setTotalInscritos(data.evento.totalInscritos || 0);
      const vistaKey = `vista_${id}`;
      if (!sessionStorage.getItem(vistaKey)) {
        sessionStorage.setItem(vistaKey, "1");
        eventoService.registrarVista(id);
      }
    } catch (err) {
      setError("Evento no encontrado");
      console.error(err);
    } finally {
      setCargando(false);
    }
  };

  // manejador de cambios del formulario de inscripcion
  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormInscripcion((prev) => ({ ...prev, [name]: value }));
  };

  // enviar inscripcion al backend
  const handleInscripcion = async (e) => {
    e.preventDefault();
    setErrorInscripcion("");
    setEnviando(true);

    try {
      const numPersonas = parseInt(formInscripcion.numPersonas, 10);
      if (isNaN(numPersonas) || numPersonas < 1) {
        setErrorInscripcion("Número de personas no válido");
        return;
      }

      await inscripcionService.crearInscripcion({
        eventoId: evento._id,
        nombre: formInscripcion.nombre,
        correo: formInscripcion.correo,
        ciudad: formInscripcion.ciudad,
        numPersonas,
      });

      // inscripcion exitosa
      setInscripcionExitosa(true);
      setTotalInscritos((prev) => prev + numPersonas);
      setFormInscripcion({ nombre: "", correo: "", ciudad: "", numPersonas: 1 });

      // cerramos el modal despues de 2 segundos
      setTimeout(() => {
        setModalAbierto(false);
        setInscripcionExitosa(false);
      }, 2000);

    } catch (err) {
      setErrorInscripcion(
        err.response?.data?.mensaje || "Error al procesar la inscripción"
      );
    } finally {
      setEnviando(false);
    }
  };

  const handleSuscripcion = async (e) => {
    e.preventDefault();
    setErrorSuscripcion("");
    setEnviandoSuscripcion(true);
    try {
      if (!evento?.empresa?._id) {
        setErrorSuscripcion("No se puede suscribir: empresa no disponible");
        return;
      }
      await suscripcionEmpresaService.suscribirse({ email: emailSuscripcion, empresaId: evento.empresa._id });
      setSuscripcionExitosa(true);
      setEmailSuscripcion("");
      setTimeout(() => { setModalSuscripcionAbierto(false); setSuscripcionExitosa(false); }, 2500);
    } catch (err) {
      setErrorSuscripcion(err.response?.data?.mensaje || "Error al suscribirse");
    } finally {
      setEnviandoSuscripcion(false);
    }
  };

  const handleContactoEmpresa = async (e) => {
    e.preventDefault();
    setEnviandoContacto(true);
    setErrorContacto("");
    try {
      if (!evento?.empresa?._id) {
        setErrorContacto("No se puede enviar: empresa no disponible");
        return;
      }
      await mensajeService.enviarMensaje({
        de: formContacto.email,
        nombre: formContacto.nombre,
        empresaId: evento.empresa._id,
        asunto: formContacto.asunto,
        cuerpo: formContacto.mensaje,
        eventoId: evento._id,
      });
      setContactoExitoso(true);
      setFormContacto({ nombre: "", email: "", asunto: "", mensaje: "" });
      setTimeout(() => {
        setModalContactoAbierto(false);
        setContactoExitoso(false);
      }, 2500);
    } catch (err) {
      setErrorContacto(err.response?.data?.mensaje || "Error al enviar el mensaje. Inténtalo de nuevo.");
    } finally {
      setEnviandoContacto(false);
    }
  };

  // pantalla de carga
  if (cargando) {
    return (
      <div style={{
        minHeight: "100vh",
        backgroundColor: "#f0e8dc",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center"
      }}>
        <p style={{
          fontFamily: "'Baloo Bhai 2', Helvetica",
          fontSize: "24px",
          color: "#818181"
        }}>
          {t("eventDetail.loading")}
        </p>
      </div>
    );
  }

  // pantalla de error
  if (error || !evento) {
    return (
      <div style={{
        minHeight: "100vh",
        backgroundColor: "#f0e8dc",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "16px"
      }}>
        <p style={{
          fontFamily: "'Baloo Bhai 2', Helvetica",
          fontSize: "24px",
          color: "#818181"
        }}>
          {t("eventDetail.notFound")}
        </p>
        <button
          onClick={() => navegar("/")}
          style={{
            backgroundColor: "#b79868",
            color: "white",
            fontFamily: "'Baloo Bhai 2', Helvetica",
            fontWeight: "700",
            fontSize: "16px",
            padding: "10px 28px",
            borderRadius: "999px",
            border: "none",
            cursor: "pointer"
          }}
        >
          {t("eventDetail.backHome")}
        </button>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: "100vh",
      backgroundColor: "#f0e8dc",
      display: "flex",
      flexDirection: "column"
    }}>

      <Helmet>
        <title>{evento.titulo} | Me Apunto</title>
        <meta name="description" content={`${evento.descripcion?.substring(0, 155)}...`} />
        <meta property="og:title" content={`${evento.titulo} | Me Apunto`} />
        <meta property="og:description" content={evento.descripcion?.substring(0, 155)} />
        <meta property="og:type" content="event" />
        <meta property="og:url" content={`https://me-apunto-alpha.vercel.app/evento/${evento._id}`} />
        {evento.imagen && <meta property="og:image" content={evento.imagen} />}
        <meta name="robots" content="index, follow" />
        <html lang="es" />
      </Helmet>

      {/* hero con navbar */}
      <div style={{ position: "relative" }}>
        <Navbar mostrarInicio={true} estaLogueado={estaLogueado} />
        <Hero mostrarBuscador={true} />
      </div>

      {/* contenido principal */}
      <main id="main-content" style={{
        flex: 1,
        width: "100%",
        maxWidth: "1100px",
        margin: "0 auto",
        padding: esMobil ? "24px 16px" : "48px 24px"
      }}>

        {/* titulo del evento */}
        <h1 style={{
          fontFamily: "'Baloo Bhai 2', Helvetica",
          fontSize: esMobil ? "22px" : "28px",
          fontWeight: "700",
          color: "#1a1a1a",
          marginBottom: esMobil ? "16px" : "24px",
          textTransform: "uppercase"
        }}>
          {evento.titulo}
        </h1>

        {/* layout dos columnas */}
        <div style={{
          display: "flex",
          flexDirection: esMobil ? "column" : "row",
          gap: esMobil ? "20px" : "40px",
          marginBottom: esMobil ? "20px" : "32px",
          flexWrap: "wrap"
        }}>

          {/* columna izquierda - datos del evento */}
          <div style={{
            flex: 1,
            minWidth: esMobil ? "0" : "260px",
            width: esMobil ? "100%" : undefined,
            display: "flex",
            flexDirection: "column",
            gap: "0"
          }}>

            {/* tabla de datos compacta */}
            <div style={{
              backgroundColor: "white",
              borderRadius: "14px",
              overflow: "hidden",
              boxShadow: "0 2px 12px rgba(0,0,0,0.07)",
              marginBottom: "16px"
            }}>
              {[
                { label: `📍 ${t("eventDetail.place")}`, value: evento.venue },
                { label: `🗺️ ${t("eventDetail.address")}`, value: evento.direccion },
                {
                  label: `📅 ${t("eventDetail.dateTime")}`,
                  value: (() => {
                    const d = evento.fecha ? new Date(evento.fecha) : null;
                    const fecha = d && !isNaN(d.getTime()) ? d.toLocaleDateString("es-ES", { day: "2-digit", month: "2-digit", year: "numeric" }) : "—";
                    return `${fecha} · ${evento.hora || ""}`;
                  })()
                },
                {
                  label: `💰 ${t("eventDetail.price")}`,
                  value: evento.precio === 0 ? t("eventDetail.free") : `${evento.precio}€`,
                  valueColor: evento.precio === 0 ? "#2e7d32" : "#91703d"
                },
                evento.capacidadMaxima && {
                  label: `👥 ${t("eventDetail.capacity")}`,
                  value: totalInscritos >= evento.capacidadMaxima
                    ? `${totalInscritos}/${evento.capacidadMaxima} — ${t("eventDetail.full")}`
                    : `${totalInscritos}/${evento.capacidadMaxima}`,
                  valueColor: totalInscritos >= evento.capacidadMaxima ? "#c0392b" : "#1a1a1a"
                },
                evento.categoria && {
                  label: `🏷️ ${t("eventDetail.category")}`,
                  value: evento.categoria,
                  capitalize: true
                },
                { label: `🏢 ${t("eventDetail.organizer")}`, value: evento.empresa?.nombre },
              ].filter(Boolean).map((fila, i, arr) => (
                <div
                  key={fila.label}
                  style={{
                    display: "flex",
                    alignItems: "baseline",
                    gap: "8px",
                    padding: "10px 16px",
                    borderBottom: i < arr.length - 1 ? "1px solid #f0e8dc" : "none"
                  }}
                >
                  <span style={{
                    fontFamily: "'Baloo Bhai 2', Helvetica",
                    fontSize: "13px",
                    fontWeight: "700",
                    color: "#818181",
                    whiteSpace: "nowrap",
                    minWidth: "120px"
                  }}>
                    {fila.label}
                  </span>
                  <span style={{
                    fontFamily: "'Baloo Bhai 2', Helvetica",
                    fontSize: "15px",
                    fontWeight: "600",
                    color: fila.valueColor || "#1a1a1a",
                    textTransform: fila.capitalize ? "capitalize" : "none"
                  }}>
                    {fila.value}
                  </span>
                </div>
              ))}
            </div>

            {/* descripcion */}
            <div style={{
              backgroundColor: "white",
              borderRadius: "14px",
              padding: "16px",
              boxShadow: "0 2px 12px rgba(0,0,0,0.07)",
              marginBottom: "16px"
            }}>
              <h2 style={{
                fontFamily: "'Baloo Bhai 2', Helvetica",
                fontSize: "15px",
                fontWeight: "700",
                color: "#818181",
                marginBottom: "8px"
              }}>
                📝 {t("eventDetail.description")}
              </h2>
              <p style={{
                fontFamily: "'Baloo Bhai 2', Helvetica",
                fontSize: "15px",
                color: "#444444",
                lineHeight: "1.6",
                margin: 0
              }}>
                {evento.descripcion}
              </p>
            </div>

            {/* mapa */}
            <div style={{
              backgroundColor: "#818181",
              padding: "8px",
              borderRadius: "12px",
              boxShadow: "0 2px 12px rgba(0,0,0,0.1)"
            }}>
              <iframe
                title="mapa del evento"
                width="100%"
                height="260"
                style={{ border: 0, borderRadius: "8px", display: "block" }}
                loading="lazy"
                allowFullScreen
                referrerPolicy="no-referrer-when-downgrade"
                src={`https://www.google.com/maps?q=${encodeURIComponent(evento.direccion)}&output=embed`}
              />
            </div>

          </div>

          {/* columna derecha - ficha empresa + imagen + boton */}
          <div style={{
            flex: 1,
            minWidth: esMobil ? "0" : "260px",
            maxWidth: esMobil ? "100%" : "520px",
            width: esMobil ? "100%" : undefined,
            display: "flex",
            flexDirection: "column",
            gap: "16px"
          }}>

            {/* ficha de la empresa */}
            {evento.empresa && (
              <div style={{
                backgroundColor: "white",
                borderRadius: "14px",
                padding: "16px",
                boxShadow: "0 2px 12px rgba(0,0,0,0.07)",
                display: "flex",
                flexDirection: "column",
                gap: "12px"
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <div style={{
                    width: "52px", height: "52px",
                    borderRadius: "50%",
                    overflow: "hidden",
                    border: "2px solid #d4b896",
                    backgroundColor: "#f0e8dc",
                    flexShrink: 0,
                    display: "flex", alignItems: "center", justifyContent: "center"
                  }}>
                    {evento.empresa.fotoPerfil ? (
                      <img
                        src={evento.empresa.fotoPerfil}
                        alt={evento.empresa.nombre}
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      />
                    ) : (
                      <span style={{ fontSize: "24px" }}>🏢</span>
                    )}
                  </div>
                  <div>
                    <p style={{
                      fontFamily: "'Baloo Bhai 2', Helvetica",
                      fontSize: "11px", fontWeight: "700", color: "#818181",
                      margin: "0 0 2px 0", textTransform: "uppercase", letterSpacing: "0.5px"
                    }}>
                      {t("eventDetail.organizedBy")}
                    </p>
                    <p style={{
                      fontFamily: "'Baloo Bhai 2', Helvetica",
                      fontSize: "16px", fontWeight: "700", color: "#1a1a1a", margin: 0
                    }}>
                      {evento.empresa.nombre}
                    </p>
                  </div>
                </div>

                {evento.empresa.descripcion && (
                  <p style={{
                    fontFamily: "'Baloo Bhai 2', Helvetica",
                    fontSize: "13px", color: "#4a4a4a", lineHeight: "1.6", margin: 0
                  }}>
                    {evento.empresa.descripcion}
                  </p>
                )}

                <div style={{ display: "flex", flexDirection: esMobil ? "column" : "row", gap: "8px" }}>
                  <button
                    onClick={() => setModalContactoAbierto(true)}
                    style={{
                      flex: 1,
                      backgroundColor: "#91703d", color: "white",
                      fontFamily: "'Baloo Bhai 2', Helvetica",
                      fontWeight: "700", fontSize: "13px",
                      padding: "10px 0", borderRadius: "999px",
                      border: "none", cursor: "pointer",
                      transition: "background-color 0.15s ease"
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#7a5c2e"}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "#91703d"}
                  >
                    {t("eventDetail.contact")}
                  </button>
                  <button
                    onClick={() => { setModalSuscripcionAbierto(true); setErrorSuscripcion(""); setSuscripcionExitosa(false); }}
                    style={{
                      flex: 1,
                      backgroundColor: "white", color: "#91703d",
                      fontFamily: "'Baloo Bhai 2', Helvetica",
                      fontWeight: "700", fontSize: "13px",
                      padding: "10px 0", borderRadius: "999px",
                      border: "2px solid #91703d", cursor: "pointer",
                      transition: "background-color 0.15s ease, color 0.15s ease"
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "#91703d"; e.currentTarget.style.color = "white"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "white"; e.currentTarget.style.color = "#91703d"; }}
                  >
                    {t("eventDetail.subscribe")}
                  </button>
                </div>
              </div>
            )}

            <img
              src={evento.imagen
                ? evento.imagen
                : `https://picsum.photos/seed/${evento._id}/800/600`
              }
              alt={evento.titulo}
              style={{
                width: "100%",
                aspectRatio: esMobil ? "16/9" : "2/3",
                objectFit: "cover",
                borderRadius: "14px",
                boxShadow: "0 4px 20px rgba(0,0,0,0.12)"
              }}
            />

          </div>

        </div>

      </main>

      <Footer />

      {/* modal de inscripcion */}
      {modalAbierto && (
        <div
          onClick={() => setModalAbierto(false)}
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0,0,0,0.65)",
            zIndex: 100,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "16px"
          }}
        >
          <div
            ref={modalRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-inscripcion-titulo"
            onKeyDown={handleModalKeyDown}
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: "#f0e8dc",
              borderRadius: "24px",
              boxShadow: "0 8px 40px rgba(0,0,0,0.25)",
              width: "100%",
              maxWidth: esMobil ? "calc(100vw - 32px)" : "480px",
              padding: esMobil ? "20px 16px" : "36px",
              display: "flex",
              flexDirection: "column",
              gap: "16px"
            }}
          >

            {/* cabecera modal */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h2 id="modal-inscripcion-titulo" style={{
                fontFamily: "'Baloo Bhai 2', Helvetica",
                fontSize: esMobil ? "16px" : "20px",
                fontWeight: "700",
                color: "#1a1a1a",
                marginRight: "8px"
              }}>
                {t("eventDetail.signUpTitle", { titulo: evento.titulo })}
              </h2>
              <button
                aria-label="Cerrar modal de inscripción"
                onClick={() => setModalAbierto(false)}
                style={{
                  background: "none", border: "none", fontSize: "28px",
                  cursor: "pointer", color: "#818181", lineHeight: 1
                }}
              >
                <span aria-hidden="true">×</span>
              </button>
            </div>

            {/* precio del evento */}
            <div style={{
              backgroundColor: evento.precio === 0 ? "#e8f5e9" : "#fff3e0",
              borderRadius: "8px",
              padding: "10px 16px"
            }}>
              <span style={{
                fontFamily: "'Baloo Bhai 2', Helvetica",
                fontSize: "15px",
                fontWeight: "600",
                color: evento.precio === 0 ? "#2e7d32" : "#91703d"
              }}>
                {evento.precio === 0
                  ? t("eventDetail.freeEvent")
                  : t("eventDetail.pricePerPerson", { precio: evento.precio })
                }
              </span>
            </div>

            {/* mensaje de exito */}
            {inscripcionExitosa && (
              <div style={{
                backgroundColor: "#e8f5e9",
                borderRadius: "8px",
                padding: "16px",
                textAlign: "center"
              }}>
                <span style={{
                  fontFamily: "'Baloo Bhai 2', Helvetica",
                  fontSize: "16px",
                  fontWeight: "600",
                  color: "#2e7d32"
                }}>
                  {t("eventDetail.successInscription")}
                </span>
              </div>
            )}

            {/* formulario */}
            {!inscripcionExitosa && (
              <form
                onSubmit={handleInscripcion}
                style={{ display: "flex", flexDirection: "column", gap: "14px" }}
              >

                {/* error inscripcion */}
                {errorInscripcion && (
                  <div role="alert" style={{
                    backgroundColor: "#fdecea",
                    borderRadius: "8px",
                    padding: "10px 14px",
                    textAlign: "center"
                  }}>
                    <span style={{
                      fontFamily: "'Baloo Bhai 2', Helvetica",
                      fontSize: "14px",
                      color: "#c0392b"
                    }}>
                      {errorInscripcion}
                    </span>
                  </div>
                )}

                {/* nombre */}
                <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                  <label htmlFor="insc-nombre" style={{
                    fontFamily: "'Baloo Bhai 2', Helvetica",
                    fontSize: "16px",
                    fontWeight: "600",
                    color: "#1a1a1a"
                  }}>
                    {t("eventDetail.fullName")}
                  </label>
                  <input
                    id="insc-nombre"
                    type="text"
                    name="nombre"
                    value={formInscripcion.nombre}
                    onChange={handleFormChange}
                    required
                    placeholder={t("eventDetail.fullNamePlaceholder")}
                    style={{
                      width: "100%",
                      height: "46px",
                      backgroundColor: "#f8f8f8",
                      paddingLeft: "12px",
                      paddingRight: "12px",
                      fontFamily: "'Baloo Bhai 2', Helvetica",
                      fontSize: "15px",
                      color: "#1a1a1a",
                      border: "1px solid #d4b896",
                      borderRadius: "8px",
                      outline: "none",
                      boxSizing: "border-box"
                    }}
                  />
                </div>

                {/* correo */}
                <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                  <label htmlFor="insc-correo" style={{
                    fontFamily: "'Baloo Bhai 2', Helvetica",
                    fontSize: "16px",
                    fontWeight: "600",
                    color: "#1a1a1a"
                  }}>
                    {t("eventDetail.email")}
                  </label>
                  <input
                    id="insc-correo"
                    type="email"
                    name="correo"
                    value={formInscripcion.correo}
                    onChange={handleFormChange}
                    required
                    placeholder={t("eventDetail.emailPlaceholder")}
                    style={{
                      width: "100%",
                      height: "46px",
                      backgroundColor: "#f8f8f8",
                      paddingLeft: "12px",
                      paddingRight: "12px",
                      fontFamily: "'Baloo Bhai 2', Helvetica",
                      fontSize: "15px",
                      color: "#1a1a1a",
                      border: "1px solid #d4b896",
                      borderRadius: "8px",
                      outline: "none",
                      boxSizing: "border-box"
                    }}
                  />
                </div>

                {/* ciudad */}
                <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                  <label htmlFor="insc-ciudad" style={{
                    fontFamily: "'Baloo Bhai 2', Helvetica",
                    fontSize: "16px",
                    fontWeight: "600",
                    color: "#1a1a1a"
                  }}>
                    {t("eventDetail.city")}
                  </label>
                  <input
                    id="insc-ciudad"
                    type="text"
                    name="ciudad"
                    value={formInscripcion.ciudad}
                    onChange={handleFormChange}
                    required
                    placeholder={t("eventDetail.cityPlaceholder")}
                    style={{
                      width: "100%",
                      height: "46px",
                      backgroundColor: "#f8f8f8",
                      paddingLeft: "12px",
                      paddingRight: "12px",
                      fontFamily: "'Baloo Bhai 2', Helvetica",
                      fontSize: "15px",
                      color: "#1a1a1a",
                      border: "1px solid #d4b896",
                      borderRadius: "8px",
                      outline: "none",
                      boxSizing: "border-box"
                    }}
                  />
                </div>

                {/* numero de personas */}
                <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                  <label htmlFor="insc-numPersonas" style={{
                    fontFamily: "'Baloo Bhai 2', Helvetica",
                    fontSize: "16px",
                    fontWeight: "600",
                    color: "#1a1a1a"
                  }}>
                    {t("eventDetail.numPersons")}
                  </label>
                  <span style={{
                    fontFamily: "'Baloo Bhai 2', Helvetica",
                    fontSize: "12px",
                    color: "#818181"
                  }}>
                    {evento.maxPersonasPorInscripcion
                      ? t("eventDetail.maxPersons", { n: evento.maxPersonasPorInscripcion })
                      : t("eventDetail.defaultPersons")
                    }
                  </span>
                  <input
                    id="insc-numPersonas"
                    type="number"
                    name="numPersonas"
                    value={formInscripcion.numPersonas}
                    onChange={handleFormChange}
                    required
                    min="1"
                    max={evento.maxPersonasPorInscripcion || 10}
                    style={{
                      width: "100%",
                      height: "46px",
                      backgroundColor: "#f8f8f8",
                      paddingLeft: "12px",
                      paddingRight: "12px",
                      fontFamily: "'Baloo Bhai 2', Helvetica",
                      fontSize: "15px",
                      color: "#1a1a1a",
                      border: "1px solid #d4b896",
                      borderRadius: "8px",
                      outline: "none",
                      boxSizing: "border-box"
                    }}
                  />
                </div>

                {/* boton confirmar */}
                <button
                  type="submit"
                  disabled={enviando}
                  style={{
                    marginTop: "8px",
                    width: "100%",
                    padding: "14px 0",
                    backgroundColor: enviando ? "#c9aa80" : "#b79868",
                    color: "white",
                    fontFamily: "'Baloo Bhai 2', Helvetica",
                    fontWeight: "700",
                    fontSize: "18px",
                    borderRadius: "999px",
                    border: "none",
                    cursor: enviando ? "not-allowed" : "pointer",
                    transition: "background-color 0.15s ease"
                  }}
                  onMouseEnter={(e) => {
                    if (!enviando) e.currentTarget.style.backgroundColor = "#91703d";
                  }}
                  onMouseLeave={(e) => {
                    if (!enviando) e.currentTarget.style.backgroundColor = "#b79868";
                  }}
                >
                  {enviando ? t("eventDetail.processing") : t("eventDetail.confirmInscription")}
                </button>

              </form>
            )}

          </div>
        </div>
      )}

      {/* boton flotante me apunto */}
      <div style={{
        position: "fixed",
        bottom: "28px",
        left: "50%",
        transform: `translateX(-50%) translateY(${botonFlotanteVisible ? "0" : "24px"})`,
        opacity: botonFlotanteVisible ? 1 : 0,
        transition: "opacity 0.25s ease, transform 0.25s ease",
        pointerEvents: botonFlotanteVisible ? "auto" : "none",
        zIndex: 50
      }}>
        <button
          onClick={() => { if (!evento?.capacidadMaxima || totalInscritos < evento.capacidadMaxima) setModalAbierto(true); }}
          disabled={!!(evento?.capacidadMaxima && totalInscritos >= evento.capacidadMaxima)}
          style={{
            backgroundColor: evento?.capacidadMaxima && totalInscritos >= evento.capacidadMaxima ? "#9e9e9e" : "#b79868",
            color: "white",
            fontFamily: "'Baloo Bhai 2', Helvetica",
            fontWeight: "700",
            fontSize: esMobil ? "16px" : "20px",
            padding: esMobil ? "12px 32px" : "14px 48px",
            borderRadius: "999px",
            border: "none",
            cursor: evento?.capacidadMaxima && totalInscritos >= evento.capacidadMaxima ? "not-allowed" : "pointer",
            boxShadow: "0 8px 28px rgba(145,112,61,0.45)",
            whiteSpace: "nowrap",
            transition: "background-color 0.15s ease"
          }}
          onMouseEnter={(e) => { if (!(evento?.capacidadMaxima && totalInscritos >= evento.capacidadMaxima)) e.currentTarget.style.backgroundColor = "#91703d"; }}
          onMouseLeave={(e) => { if (!(evento?.capacidadMaxima && totalInscritos >= evento.capacidadMaxima)) e.currentTarget.style.backgroundColor = "#b79868"; }}
        >
          {evento?.capacidadMaxima && totalInscritos >= evento.capacidadMaxima ? t("eventDetail.capacityFull") : t("eventDetail.signUpBtn")}
        </button>
      </div>

      {/* modal suscripcion empresa */}
      {modalSuscripcionAbierto && (
        <div
          onClick={() => { setModalSuscripcionAbierto(false); setSuscripcionExitosa(false); }}
          style={{
            position: "fixed", inset: 0,
            backgroundColor: "rgba(0,0,0,0.65)",
            zIndex: 100, display: "flex",
            alignItems: "center", justifyContent: "center", padding: "16px"
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-suscripcion-titulo"
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => { if (e.key === "Escape") { setModalSuscripcionAbierto(false); setSuscripcionExitosa(false); } }}
            style={{
              backgroundColor: "#f0e8dc",
              borderRadius: "24px",
              boxShadow: "0 8px 40px rgba(0,0,0,0.25)",
              width: "100%",
              maxWidth: esMobil ? "calc(100vw - 32px)" : "420px",
              padding: esMobil ? "20px 16px" : "36px",
              display: "flex",
              flexDirection: "column",
              gap: "16px"
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h2 id="modal-suscripcion-titulo" style={{
                fontFamily: "'Baloo Bhai 2', Helvetica",
                fontSize: esMobil ? "16px" : "20px", fontWeight: "700", color: "#1a1a1a", margin: 0, marginRight: "8px"
              }}>
                {t("eventDetail.subscribeTitle", { nombre: evento.empresa?.nombre })}
              </h2>
              <button
                aria-label="Cerrar"
                onClick={() => { setModalSuscripcionAbierto(false); setSuscripcionExitosa(false); }}
                style={{ background: "none", border: "none", fontSize: "28px", cursor: "pointer", color: "#818181", lineHeight: 1 }}
              >
                <span aria-hidden="true">×</span>
              </button>
            </div>

            {suscripcionExitosa ? (
              <div style={{ backgroundColor: "#e8f5e9", borderRadius: "10px", padding: "24px", textAlign: "center" }}>
                <p style={{
                  fontFamily: "'Baloo Bhai 2', Helvetica",
                  fontSize: "16px", fontWeight: "600", color: "#2e7d32", margin: "0 0 8px 0"
                }}>
                  {t("eventDetail.subscribed")}
                </p>
                <p style={{ fontFamily: "'Baloo Bhai 2', Helvetica", fontSize: "13px", color: "#4a4a4a", margin: 0 }}>
                  {t("eventDetail.subscribedInfo", { nombre: evento.empresa?.nombre })}
                </p>
              </div>
            ) : (
              <>
                <div style={{ backgroundColor: "white", borderRadius: "10px", padding: "14px 16px" }}>
                  <p style={{ fontFamily: "'Baloo Bhai 2', Helvetica", fontSize: "13px", color: "#4a4a4a", margin: "0 0 6px 0" }}>
                    {t("eventDetail.subscribeInfo")}
                  </p>
                  <p style={{ fontFamily: "'Baloo Bhai 2', Helvetica", fontSize: "13px", color: "#4a4a4a", margin: "4px 0" }}>
                    {t("eventDetail.subscribeNew", { nombre: evento.empresa?.nombre })}
                  </p>
                  <p style={{ fontFamily: "'Baloo Bhai 2', Helvetica", fontSize: "13px", color: "#4a4a4a", margin: "4px 0" }}>
                    {t("eventDetail.subscribeChanges")}
                  </p>
                </div>

                {errorSuscripcion && (
                  <div role="alert" style={{
                    backgroundColor: "#fdecea", borderRadius: "8px", padding: "10px 14px",
                    fontFamily: "'Baloo Bhai 2', Helvetica", fontSize: "13px", color: "#c0392b"
                  }}>
                    {errorSuscripcion}
                  </div>
                )}

                <form onSubmit={handleSuscripcion} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  <input
                    type="email"
                    value={emailSuscripcion}
                    onChange={(e) => setEmailSuscripcion(e.target.value)}
                    required
                    placeholder="tu@correo.com"
                    style={{
                      width: "100%", height: "46px",
                      backgroundColor: "#f8f8f8",
                      paddingLeft: "12px", paddingRight: "12px",
                      fontFamily: "'Baloo Bhai 2', Helvetica",
                      fontSize: "15px", color: "#1a1a1a",
                      border: "1px solid #d4b896", borderRadius: "8px", outline: "none",
                      boxSizing: "border-box"
                    }}
                  />
                  <button
                    type="submit"
                    disabled={enviandoSuscripcion}
                    style={{
                      width: "100%", padding: "13px 0",
                      backgroundColor: enviandoSuscripcion ? "#c9aa80" : "#b79868",
                      color: "white",
                      fontFamily: "'Baloo Bhai 2', Helvetica",
                      fontWeight: "700", fontSize: "16px",
                      borderRadius: "999px", border: "none",
                      cursor: enviandoSuscripcion ? "not-allowed" : "pointer",
                      transition: "background-color 0.15s ease"
                    }}
                    onMouseEnter={(e) => { if (!enviandoSuscripcion) e.currentTarget.style.backgroundColor = "#91703d"; }}
                    onMouseLeave={(e) => { if (!enviandoSuscripcion) e.currentTarget.style.backgroundColor = "#b79868"; }}
                  >
                    {enviandoSuscripcion ? t("eventDetail.subscribing") : t("eventDetail.subscribeBtn")}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      )}

      {/* modal contacto empresa */}
      {modalContactoAbierto && (
        <div
          onClick={() => { setModalContactoAbierto(false); setContactoExitoso(false); }}
          style={{
            position: "fixed", inset: 0,
            backgroundColor: "rgba(0,0,0,0.65)",
            zIndex: 100, display: "flex",
            alignItems: "center", justifyContent: "center", padding: "16px"
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-contacto-titulo"
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => { if (e.key === "Escape") { setModalContactoAbierto(false); setContactoExitoso(false); } }}
            style={{
              backgroundColor: "#f0e8dc",
              borderRadius: "24px",
              boxShadow: "0 8px 40px rgba(0,0,0,0.25)",
              width: "100%",
              maxWidth: esMobil ? "calc(100vw - 32px)" : "460px",
              padding: esMobil ? "20px 16px" : "36px",
              display: "flex",
              flexDirection: "column",
              gap: "16px"
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h2 id="modal-contacto-titulo" style={{
                fontFamily: "'Baloo Bhai 2', Helvetica",
                fontSize: esMobil ? "16px" : "20px", fontWeight: "700", color: "#1a1a1a", margin: 0, marginRight: "8px"
              }}>
                {t("eventDetail.contactTitle", { nombre: evento.empresa?.nombre })}
              </h2>
              <button
                aria-label="Cerrar"
                onClick={() => { setModalContactoAbierto(false); setContactoExitoso(false); }}
                style={{ background: "none", border: "none", fontSize: "28px", cursor: "pointer", color: "#818181", lineHeight: 1 }}
              >
                <span aria-hidden="true">×</span>
              </button>
            </div>

            {contactoExitoso ? (
              <div style={{
                backgroundColor: "#e8f5e9", borderRadius: "10px",
                padding: "24px", textAlign: "center"
              }}>
                <p style={{
                  fontFamily: "'Baloo Bhai 2', Helvetica",
                  fontSize: "16px", fontWeight: "600", color: "#2e7d32", margin: 0
                }}>
                  {t("eventDetail.messageSent")}
                </p>
              </div>
            ) : (
              <form onSubmit={handleContactoEmpresa} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                  <label style={{ fontFamily: "'Baloo Bhai 2', Helvetica", fontSize: "14px", fontWeight: "600", color: "#1a1a1a" }}>
                    {t("eventDetail.yourName")}
                  </label>
                  <input
                    type="text"
                    value={formContacto.nombre}
                    onChange={(e) => setFormContacto((p) => ({ ...p, nombre: e.target.value }))}
                    required
                    placeholder={t("eventDetail.namePlaceholder")}
                    style={{
                      width: "100%", height: "44px", backgroundColor: "#f8f8f8",
                      paddingLeft: "12px", paddingRight: "12px",
                      fontFamily: "'Baloo Bhai 2', Helvetica", fontSize: "14px", color: "#1a1a1a",
                      border: "1px solid #d4b896", borderRadius: "8px", outline: "none", boxSizing: "border-box"
                    }}
                  />
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                  <label style={{ fontFamily: "'Baloo Bhai 2', Helvetica", fontSize: "14px", fontWeight: "600", color: "#1a1a1a" }}>
                    {t("eventDetail.yourEmail")}
                  </label>
                  <input
                    type="email"
                    value={formContacto.email}
                    onChange={(e) => setFormContacto((p) => ({ ...p, email: e.target.value }))}
                    required
                    placeholder={t("eventDetail.emailPlaceholder")}
                    style={{
                      width: "100%", height: "44px", backgroundColor: "#f8f8f8",
                      paddingLeft: "12px", paddingRight: "12px",
                      fontFamily: "'Baloo Bhai 2', Helvetica", fontSize: "14px", color: "#1a1a1a",
                      border: "1px solid #d4b896", borderRadius: "8px", outline: "none", boxSizing: "border-box"
                    }}
                  />
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                  <label style={{ fontFamily: "'Baloo Bhai 2', Helvetica", fontSize: "14px", fontWeight: "600", color: "#1a1a1a" }}>
                    {t("eventDetail.subject")}
                  </label>
                  <input
                    type="text"
                    value={formContacto.asunto}
                    onChange={(e) => setFormContacto((p) => ({ ...p, asunto: e.target.value }))}
                    required
                    maxLength={120}
                    placeholder={t("eventDetail.subjectPlaceholder")}
                    style={{
                      width: "100%", height: "44px", backgroundColor: "#f8f8f8",
                      paddingLeft: "12px", paddingRight: "12px",
                      fontFamily: "'Baloo Bhai 2', Helvetica", fontSize: "14px", color: "#1a1a1a",
                      border: "1px solid #d4b896", borderRadius: "8px", outline: "none", boxSizing: "border-box"
                    }}
                  />
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                  <label style={{ fontFamily: "'Baloo Bhai 2', Helvetica", fontSize: "14px", fontWeight: "600", color: "#1a1a1a" }}>
                    {t("eventDetail.message")}
                  </label>
                  <textarea
                    value={formContacto.mensaje}
                    onChange={(e) => setFormContacto((p) => ({ ...p, mensaje: e.target.value }))}
                    required
                    maxLength={2000}
                    placeholder={t("eventDetail.messagePlaceholder")}
                    rows={4}
                    style={{
                      width: "100%", backgroundColor: "#f8f8f8", padding: "10px 12px",
                      fontFamily: "'Baloo Bhai 2', Helvetica", fontSize: "14px", color: "#1a1a1a",
                      border: "1px solid #d4b896", borderRadius: "8px", outline: "none",
                      resize: "vertical", boxSizing: "border-box"
                    }}
                  />
                </div>

                {errorContacto && (
                  <p style={{ fontFamily: "'Baloo Bhai 2', Helvetica", fontSize: "13px", color: "#c0392b", margin: 0 }}>
                    {errorContacto}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={enviandoContacto}
                  style={{
                    marginTop: "4px", width: "100%", padding: "13px 0",
                    backgroundColor: enviandoContacto ? "#ccc" : "#b79868",
                    color: "white", fontFamily: "'Baloo Bhai 2', Helvetica",
                    fontWeight: "700", fontSize: "16px", borderRadius: "999px",
                    border: "none", cursor: enviandoContacto ? "not-allowed" : "pointer",
                    transition: "background-color 0.15s ease"
                  }}
                  onMouseEnter={(e) => { if (!enviandoContacto) e.currentTarget.style.backgroundColor = "#91703d"; }}
                  onMouseLeave={(e) => { if (!enviandoContacto) e.currentTarget.style.backgroundColor = "#b79868"; }}
                >
                  {enviandoContacto ? t("eventDetail.sending") : t("eventDetail.sendMessage")}
                </button>
              </form>
            )}
          </div>
        </div>
      )}

    </div>
  );
}

export default EventDetail;
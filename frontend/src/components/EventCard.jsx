import { useState, memo } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import calendarioIcon from "../assets/icons/iconoCalendario.svg";
import relojIcon from "../assets/icons/iconoReloj.svg";

function EventCard({ evento, destacado = false, esMobil: esMobilProp }) {
  const navegar = useNavigate();
  const { t, i18n } = useTranslation();
  const [hovered, setHovered] = useState(false);
  const esMobil = esMobilProp !== undefined ? esMobilProp : window.innerWidth < 768;

  const handleKeyDown = (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      navegar(`/evento/${evento._id}`);
    }
  };

  return (
    <div
      role="link"
      tabIndex={0}
      aria-label={`Ver evento: ${evento.titulo}`}
      onClick={() => navegar(`/evento/${evento._id}`)}
      onKeyDown={handleKeyDown}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        width: destacado ? "100%" : (esMobil ? "100%" : "260px"),
        maxWidth: destacado ? "100%" : (esMobil ? "360px" : "260px"),
        cursor: "pointer",
        position: "relative",
        transition: "box-shadow 0.2s ease, translate 0.2s ease",
        translate: hovered ? "0 -4px" : "0 0",
        borderRadius: "14px",
        boxShadow: hovered ? "0 12px 28px rgba(0,0,0,0.15)" : "none",
        boxSizing: "border-box",
      }}
      className="flex flex-col mx-auto"
    >

      {/* imagen */}
      <div style={{
        width: "100%",
        height: destacado ? (esMobil ? "200px" : "260px") : (esMobil ? "180px" : "220px"),
        overflow: "hidden",
        borderRadius: "14px",
        position: "relative",
      }}>
        <img
          src={evento.imagen || `https://picsum.photos/seed/${evento._id}/400/300`}
          alt={evento.titulo}
          loading="lazy"
          style={{ width: "100%", height: "100%", objectFit: "cover", maxWidth: "100%", display: "block" }}
        />

        {/* badge patrocinado */}
        {evento.patrocinado && (
          <div style={{
            position: "absolute", top: "10px", left: "10px",
            backgroundColor: "#b79868", color: "white",
            fontFamily: "'Baloo Bhai 2', Helvetica",
            fontSize: "12px", fontWeight: "700",
            padding: "4px 10px", borderRadius: "999px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.2)"
          }}>
            {t("eventCard.featured")}
          </div>
        )}

        {/* badge precio */}
        <div style={{
          position: "absolute", bottom: "10px", right: "10px",
          backgroundColor: evento.precio === 0 ? "rgba(46,125,50,0.9)" : "rgba(145,112,61,0.9)",
          color: "white",
          fontFamily: "'Baloo Bhai 2', Helvetica",
          fontSize: "12px", fontWeight: "700",
          padding: "3px 10px", borderRadius: "999px",
          boxShadow: "0 2px 6px rgba(0,0,0,0.2)"
        }}>
          {evento.precio === 0 ? t("eventCard.free") : `${evento.precio}€`}
        </div>

        {/* badge aforo */}
        {evento.capacidadMaxima && (
          <div style={{
            position: "absolute", bottom: "10px", left: "10px",
            backgroundColor: (evento.totalInscritos || 0) >= evento.capacidadMaxima
              ? "rgba(180,30,30,0.9)"
              : "rgba(0,0,0,0.55)",
            color: "white",
            fontFamily: "'Baloo Bhai 2', Helvetica",
            fontSize: "11px", fontWeight: "700",
            padding: "3px 8px", borderRadius: "999px",
            boxShadow: "0 2px 6px rgba(0,0,0,0.2)"
          }}>
            {(evento.totalInscritos || 0) >= evento.capacidadMaxima
              ? t("eventCard.full")
              : `${evento.totalInscritos || 0}/${evento.capacidadMaxima}`
            }
          </div>
        )}
      </div>

      {/* titulo */}
      <div style={{
        fontSize: destacado ? "16px" : "15px",
        fontWeight: "600", textAlign: "center",
        marginTop: "10px", lineHeight: "1.3",
        fontFamily: "'Baloo Bhai 2', Helvetica",
        overflowWrap: "break-word",
        wordBreak: "break-word",
        padding: "0 4px",
      }} className="text-black px-1">
        {evento.titulo}
      </div>

      {/* venue */}
      <div style={{
        fontSize: "13px", fontWeight: "600",
        textAlign: "center", marginTop: "4px",
        fontFamily: "'Baloo Bhai 2', Helvetica",
      }} className="text-black">
        {evento.venue}
      </div>

      {/* categoria */}
      {evento.categoria && (
        <div style={{
          backgroundColor: "#f0e8dc", color: "#91703d",
          fontFamily: "'Baloo Bhai 2', Helvetica",
          fontSize: "11px", fontWeight: "700",
          padding: "2px 10px", borderRadius: "999px",
          display: "inline-block", alignSelf: "center",
          textAlign: "center", marginTop: "4px",
          textTransform: "capitalize",
        }}>
          {evento.categoria}
        </div>
      )}

      {/* fecha */}
      <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "8px", paddingLeft: "8px" }}>
        <img src={calendarioIcon} alt="fecha" style={{ width: "14px", height: "14px" }} />
        <span style={{ fontSize: "13px", fontFamily: "'Baloo Bhai 2', Helvetica" }} className="text-black">
          {new Date(evento.fecha).toLocaleDateString(i18n.language)}
        </span>
      </div>

      {/* hora */}
      <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "4px", paddingLeft: "8px" }}>
        <img src={relojIcon} alt="hora" style={{ width: "14px", height: "14px" }} />
        <span style={{ fontSize: "13px", fontFamily: "'Baloo Bhai 2', Helvetica" }} className="text-black">
          {evento.hora}
        </span>
      </div>

    </div>
  );
}

export default memo(EventCard);

// tarjeta de evento - tamaños forzados con style inline
import { useNavigate } from "react-router-dom";
import calendarioIcon from "../assets/icons/iconoCalendario.svg";
import relojIcon from "../assets/icons/iconoReloj.svg";

function EventCard({ evento, destacado = false }) {
  const navegar = useNavigate();

  const irADetalle = () => {
    navegar(`/evento/${evento._id}`);
  };

  return(
    <div
      onClick={irADetalle}
      style={{
        width: destacado ? "300px" : "260px",
        cursor: "pointer",
        transition: "transform 0.15s ease",
        position: "relative",
      }}
      className="flex flex-col mx-auto"
      onMouseEnter={(e) => e.currentTarget.style.transform = "scale(1.06)"}
      onMouseLeave={(e) => e.currentTarget.style.transform = "scale(1)"}
    >

      {/* imagen con altura fija */}
      <div style={{
        width: destacado ? "300px" : "260px",
        height: destacado ? "260px" : "220px",
        overflow: "hidden",
        borderRadius: "14px",
        position: "relative"
      }}>
        <img
          src={evento.imagen
            ? evento.imagen
            : `https://picsum.photos/seed/${evento._id}/400/300`
          }
          alt={evento.titulo}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />

        {/* badge patrocinado */}
        {evento.patrocinado && (
          <div style={{
            position: "absolute",
            top: "10px",
            left: "10px",
            backgroundColor: "#b79868",
            color: "white",
            fontFamily: "'Baloo Bhai 2', Helvetica",
            fontSize: "12px",
            fontWeight: "700",
            padding: "4px 10px",
            borderRadius: "999px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.2)"
          }}>
            ★ Destacado
          </div>
        )}
      </div>

      {/* titulo */}
      <div style={{
        fontSize: destacado ? "16px" : "15px",
        fontWeight: "600",
        textAlign: "center",
        marginTop: "10px",
        lineHeight: "1.3",
        fontFamily: "'Baloo Bhai 2', Helvetica"
      }}
        className="text-black px-1">
        {evento.titulo}
      </div>

      {/* venue */}
      <div style={{
        fontSize: "13px",
        fontWeight: "600",
        textAlign: "center",
        marginTop: "4px",
        fontFamily: "'Baloo Bhai 2', Helvetica"
      }}
        className="text-black">
        {evento.venue}
      </div>

      {/* fecha */}
      <div style={{
        display: "flex",
        alignItems: "center",
        gap: "6px",
        marginTop: "8px",
        paddingLeft: "8px"
      }}>
        <img src={calendarioIcon} alt="fecha" style={{ width: "14px", height: "14px" }} />
        <span style={{
          fontSize: "13px",
          fontFamily: "'Baloo Bhai 2', Helvetica"
        }} className="text-black">
          {new Date(evento.fecha).toLocaleDateString("es-ES")}
        </span>
      </div>

      {/* hora */}
      <div style={{
        display: "flex",
        alignItems: "center",
        gap: "6px",
        marginTop: "4px",
        paddingLeft: "8px"
      }}>
        <img src={relojIcon} alt="hora" style={{ width: "14px", height: "14px" }} />
        <span style={{
          fontSize: "13px",
          fontFamily: "'Baloo Bhai 2', Helvetica"
        }} className="text-black">
          {evento.hora}
        </span>
      </div>

    </div>
  );
}

export default EventCard;
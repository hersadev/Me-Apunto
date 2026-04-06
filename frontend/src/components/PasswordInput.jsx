// input de contraseña con toggle de visibilidad
// fondo blanco en el input para que se vea bien dentro de la tarjeta dorada

import { useState } from "react";
import ojoPng from "../assets/icons/iconoOjo.svg";

function PasswordInput({ nombre, label, valor, onChange }) {

  const [verContrasena, setVerContrasena] = useState(false);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "4px", width: "100%" }}>

      {/* label */}
      <label
        htmlFor={nombre}
        style={{
          fontFamily: "'Baloo Bhai 2', Helvetica",
          fontSize: "20px",
          fontWeight: "600",
          color: "#1a1a1a"
        }}
      >
        {label}
      </label>

      {/* contenedor input + ojito */}
      <div style={{ position: "relative", width: "100%" }}>

        <input
          id={nombre}
          name={nombre}
          type={verContrasena ? "text" : "password"}
          value={valor}
          onChange={onChange}
          placeholder="contraseña secreta"
          style={{
            width: "100%",
            height: "44px",
            // fondo blanco para que contraste con la tarjeta dorada
            backgroundColor: "#f8f8f8",
            paddingLeft: "12px",
            // padding derecho para que el texto no quede debajo del ojito
            paddingRight: "44px",
            fontFamily: "'Baloo Bhai 2', Helvetica",
            fontSize: "20px",
            color: "#1a1a1a",
            border: "none",
            outline: "none",
            borderRadius: "6px"
          }}
          autoComplete={nombre === "contrasena" ? "current-password" : "new-password"}
        />

        {/* ojito para mostrar/ocultar */}
        <button
          type="button"
          onClick={() => setVerContrasena(!verContrasena)}
          style={{
            position: "absolute",
            right: "10px",
            top: "50%",
            transform: "translateY(-50%)",
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: "4px",
            display: "flex",
            alignItems: "center"
          }}
          aria-label={verContrasena ? "Ocultar contraseña" : "Mostrar contraseña"}
        >
          <img
            src={ojoPng}
            alt="toggle contraseña"
            style={{
              width: "22px",
              height: "22px",
              opacity: verContrasena ? 0.4 : 0.8,
              transition: "opacity 0.15s ease"
            }}
          />
        </button>

      </div>
    </div>
  );
}

export default PasswordInput;
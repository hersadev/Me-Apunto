// pagina de registro - solo para empresas que quieran publicar eventos
// ahora conectado con el backend usando authService

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

function Register() {

  const navegar = useNavigate();

  const [formData, setFormData] = useState({
    nombreEmpresa: "",
    correoEmpresa: "",
    nifCif: "",
    contrasena: "",
    repiteContrasena: "",
    aceptaTerminos: false,
  });

  // estado de carga y error
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // validaciones en el frontend antes de llamar al backend
    if (formData.contrasena !== formData.repiteContrasena) {
      setError("Las contraseñas no coinciden");
      return;
    }

    if (!formData.aceptaTerminos) {
      setError("Debes aceptar los términos y condiciones");
      return;
    }

    if (formData.contrasena.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres");
      return;
    }

    setCargando(true);

    try {
      // llamamos al backend con los datos de la empresa
      await authService.registrar({
        nombre: formData.nombreEmpresa,
        correo: formData.correoEmpresa,
        contrasena: formData.contrasena,
        nifCif: formData.nifCif,
      });

      // registro exitoso - redirigimos al login
      alert("¡Empresa registrada correctamente! Ahora puedes iniciar sesión.");
      navegar("/login");

    } catch (err) {
      setError(
        err.response?.data?.mensaje || "Error al registrar la empresa"
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
        <title>Registro de Empresa | Me Apunto</title>
      </Helmet>

      <div style={{ position: "relative" }}>
        <Navbar mostrarInicio={true} />
        <Hero mostrarBuscador={false} />
      </div>

      <main style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "start"
      }}>
        <AuthCard>

          <div style={{ textAlign: "center", marginBottom: "8px" }}>
            <span style={{
              fontFamily: "'Baloo Bhai 2', Helvetica",
              fontSize: "24px",
              fontWeight: "700",
              color: "#2c2c2c"
            }}>
              Registro de Empresa
            </span>
          </div>

          {/* mensaje de error */}
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
            onSubmit={handleSubmit}
            style={{ width: "100%", display: "flex", flexDirection: "column", gap: "14px" }}
          >

            {/* nombre de empresa */}
            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              <label
                htmlFor="nombreEmpresa"
                style={{
                  fontFamily: "'Baloo Bhai 2', Helvetica",
                  fontSize: "20px",
                  fontWeight: "600",
                  color: "#1a1a1a"
                }}
              >
                Nombre de empresa
              </label>
              <input
                id="nombreEmpresa"
                type="text"
                name="nombreEmpresa"
                value={formData.nombreEmpresa}
                onChange={handleChange}
                required
                placeholder="Mi Empresa S.L."
                style={{
                  width: "100%",
                  height: "50px",
                  backgroundColor: "#f8f8f8",
                  paddingLeft: "14px",
                  paddingRight: "14px",
                  fontFamily: "'Baloo Bhai 2', Helvetica",
                  fontSize: "20px",
                  color: "#1a1a1a",
                  border: "none",
                  outline: "none",
                  borderRadius: "6px"
                }}
                autoComplete="organization"
              />
            </div>

            {/* correo de empresa */}
            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              <label
                htmlFor="correoEmpresa"
                style={{
                  fontFamily: "'Baloo Bhai 2', Helvetica",
                  fontSize: "20px",
                  fontWeight: "600",
                  color: "#1a1a1a"
                }}
              >
                Correo de empresa
              </label>
              <span style={{
                fontFamily: "'Baloo Bhai 2', Helvetica",
                fontSize: "14px",
                color: "#818181",
                marginTop: "-2px"
              }}>
                Aquí recibirás las inscripciones de los usuarios
              </span>
              <input
                id="correoEmpresa"
                type="email"
                name="correoEmpresa"
                value={formData.correoEmpresa}
                onChange={handleChange}
                required
                placeholder="empresa@correo.com"
                style={{
                  width: "100%",
                  height: "50px",
                  backgroundColor: "#f8f8f8",
                  paddingLeft: "14px",
                  paddingRight: "14px",
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

            {/* nif/cif */}
            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              <label
                htmlFor="nifCif"
                style={{
                  fontFamily: "'Baloo Bhai 2', Helvetica",
                  fontSize: "20px",
                  fontWeight: "600",
                  color: "#1a1a1a"
                }}
              >
                NIF/CIF
              </label>
              <span style={{
                fontFamily: "'Baloo Bhai 2', Helvetica",
                fontSize: "14px",
                color: "#818181",
                marginTop: "-2px"
              }}>
                NIF para autónomos (12345678Z) o CIF para sociedades (B12345678)
              </span>
              <input
                id="nifCif"
                type="text"
                name="nifCif"
                value={formData.nifCif}
                onChange={handleChange}
                required
                placeholder="B12345678"
                style={{
                  width: "100%",
                  height: "50px",
                  backgroundColor: "#f8f8f8",
                  paddingLeft: "14px",
                  paddingRight: "14px",
                  fontFamily: "'Baloo Bhai 2', Helvetica",
                  fontSize: "20px",
                  color: "#1a1a1a",
                  border: "none",
                  outline: "none",
                  borderRadius: "6px"
                }}
                autoComplete="off"
              />
            </div>

            {/* contraseña */}
            <PasswordInput
              nombre="contrasena"
              label="Contraseña"
              valor={formData.contrasena}
              onChange={handleChange}
            />

            {/* repetir contraseña */}
            <PasswordInput
              nombre="repiteContrasena"
              label="Repite contraseña"
              valor={formData.repiteContrasena}
              onChange={handleChange}
            />

            {/* checkbox terminos */}
            <label style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "10px",
              cursor: "pointer",
              marginTop: "4px"
            }}>
              <input
                type="checkbox"
                name="aceptaTerminos"
                checked={formData.aceptaTerminos}
                onChange={handleChange}
                style={{
                  width: "20px",
                  height: "20px",
                  cursor: "pointer",
                  accentColor: "#b79868",
                  flexShrink: 0
                }}
              />
              <span style={{
                fontFamily: "'Baloo Bhai 2', Helvetica",
                fontSize: "20px",
                fontWeight: "600",
                color: "#1a1a1a"
              }}>
                Acepto los términos y condiciones
              </span>
            </label>

            {/* boton registro */}
            <button
              type="submit"
              disabled={cargando}
              style={{
                marginTop: "8px",
                width: "100%",
                padding: "12px 0",
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
              {cargando ? "Registrando..." : "Registrar empresa"}
            </button>

          </form>

          {/* separador */}
          <div style={{
            width: "100%",
            height: "1px",
            backgroundColor: "rgba(0,0,0,0.15)",
            margin: "8px 0"
          }} />

          {/* enlace ya tienes cuenta */}
          <button
            type="button"
            onClick={() => navegar("/login")}
            style={{
              fontFamily: "'Baloo Bhai 2', Helvetica",
              fontSize: "16px",
              color: "#91703d",
              background: "none",
              border: "none",
              cursor: "pointer",
              textDecoration: "none"
            }}
            onMouseEnter={(e) => e.currentTarget.style.textDecoration = "underline"}
            onMouseLeave={(e) => e.currentTarget.style.textDecoration = "none"}
          >
            ¿Ya tienes cuenta de empresa?
          </button>

          {/* enlace terminos */}
          <button
            type="button"
            onClick={() => navegar("/terminos")}
            style={{
              fontFamily: "'Baloo Bhai 2', Helvetica",
              fontSize: "14px",
              color: "#5c3d1a",
              background: "none",
              border: "none",
              cursor: "pointer",
              textDecoration: "none",
              marginTop: "4px"
            }}
            onMouseEnter={(e) => e.currentTarget.style.textDecoration = "underline"}
            onMouseLeave={(e) => e.currentTarget.style.textDecoration = "none"}
          >
            Ver términos y condiciones
          </button>

        </AuthCard>
      </main>

      <Footer />

    </div>
  );
}

export default Register;
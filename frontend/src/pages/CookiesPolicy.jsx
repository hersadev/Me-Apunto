import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import Hero from "../components/Hero";

function CookiesPolicy() {

  const navegar = useNavigate();

  const Seccion = ({ numero, titulo, children }) => (
    <div style={{ marginBottom: "28px" }}>
      <h2 style={{
        fontFamily: "'Baloo Bhai 2', Helvetica",
        fontSize: "20px",
        fontWeight: "700",
        color: "#91703d",
        marginBottom: "10px"
      }}>
        {numero}. {titulo}
      </h2>
      <div style={{
        fontFamily: "'Baloo Bhai 2', Helvetica",
        fontSize: "16px",
        color: "#333333",
        lineHeight: "1.7"
      }}>
        {children}
      </div>
    </div>
  );

  const P = ({ children }) => (
    <p style={{ marginBottom: "10px" }}>{children}</p>
  );

  const Tabla = ({ filas }) => (
    <div style={{ overflowX: "auto", marginBottom: "10px" }}>
      <table style={{
        width: "100%",
        borderCollapse: "collapse",
        fontFamily: "'Baloo Bhai 2', Helvetica",
        fontSize: "14px"
      }}>
        <thead>
          <tr style={{ backgroundColor: "#b79868", color: "white" }}>
            <th style={{ padding: "10px 12px", textAlign: "left", borderRadius: "0" }}>Nombre</th>
            <th style={{ padding: "10px 12px", textAlign: "left" }}>Finalidad</th>
            <th style={{ padding: "10px 12px", textAlign: "left" }}>Duración</th>
            <th style={{ padding: "10px 12px", textAlign: "left" }}>Tipo</th>
          </tr>
        </thead>
        <tbody>
          {filas.map((fila, i) => (
            <tr key={i} style={{ backgroundColor: i % 2 === 0 ? "#faf6f0" : "white" }}>
              <td style={{ padding: "8px 12px", color: "#333" }}>{fila.nombre}</td>
              <td style={{ padding: "8px 12px", color: "#333" }}>{fila.finalidad}</td>
              <td style={{ padding: "8px 12px", color: "#333" }}>{fila.duracion}</td>
              <td style={{ padding: "8px 12px", color: "#333" }}>{fila.tipo}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const cookiesEsenciales = [
    {
      nombre: "empresa",
      finalidad: "Almacena la sesión activa de la empresa autenticada",
      duracion: "Sesión",
      tipo: "Técnica esencial"
    },
    {
      nombre: "token",
      finalidad: "Token JWT para autenticación en el panel de empresa",
      duracion: "Sesión",
      tipo: "Técnica esencial"
    },
    {
      nombre: "cookie_consent",
      finalidad: "Guarda la preferencia del usuario sobre el uso de cookies",
      duracion: "1 año",
      tipo: "Técnica esencial"
    }
  ];

  return (
    <div style={{
      minHeight: "100vh",
      backgroundColor: "#f0e8dc",
      display: "flex",
      flexDirection: "column"
    }}>

      <Helmet>
        <title>Política de Cookies | Me Apunto</title>
      </Helmet>

      <div style={{ position: "relative" }}>
        <Navbar mostrarInicio={true} />
        <Hero mostrarBuscador={false} />
      </div>

      <main style={{
        flex: 1,
        width: "100%",
        maxWidth: "900px",
        margin: "0 auto",
        padding: "60px 24px"
      }}>

        <h1 style={{
          fontFamily: "'Baloo Bhai 2', Helvetica",
          fontSize: "32px",
          fontWeight: "700",
          color: "#2c2c2c",
          marginBottom: "8px"
        }}>
          Política de Cookies
        </h1>
        <p style={{
          fontFamily: "'Baloo Bhai 2', Helvetica",
          fontSize: "14px",
          color: "#818181",
          marginBottom: "40px"
        }}>
          Última actualización: mayo de 2026
        </p>

        <Seccion numero="1" titulo="¿Qué son las cookies?">
          <P>
            Las cookies son pequeños archivos de texto que los sitios web almacenan en el
            dispositivo del usuario cuando este los visita. Permiten que el sitio recuerde
            información sobre la visita, como el idioma preferido y otras opciones, lo que
            facilita la siguiente visita y hace que el sitio sea más útil.
          </P>
          <P>
            La presente Política de Cookies se aplica a la plataforma web Me Apunto
            (en adelante, "la Plataforma"), accesible a través de internet. El responsable
            del tratamiento de los datos obtenidos a través de las cookies es Me Apunto,
            en cumplimiento de la Ley 34/2002, de 11 de julio, de Servicios de la Sociedad
            de la Información y Comercio Electrónico (LSSI-CE) y el Reglamento General de
            Protección de Datos (RGPD).
          </P>
        </Seccion>

        <Seccion numero="2" titulo="Tipos de cookies que utilizamos">
          <P>
            Me Apunto utiliza únicamente cookies técnicas y esenciales, estrictamente
            necesarias para el correcto funcionamiento de la Plataforma. No se utilizan
            cookies de seguimiento, analíticas ni publicitarias de terceros.
          </P>
          <P>
            <strong>Cookies técnicas o esenciales:</strong> Son aquellas que permiten al
            usuario la navegación a través de la Plataforma y la utilización de las
            diferentes opciones o servicios que en ella existen. Sin estas cookies,
            determinadas funcionalidades — como el acceso al panel de empresa — no
            estarían disponibles.
          </P>
          <Tabla filas={cookiesEsenciales} />
          <P>
            Dado que estas cookies son estrictamente necesarias para la prestación del
            servicio, no requieren el consentimiento del usuario. No obstante, el
            usuario puede configurar su navegador para bloquear o eliminar estas
            cookies, aunque ello podría afectar al funcionamiento de la Plataforma.
          </P>
        </Seccion>

        <Seccion numero="3" titulo="Cookies de terceros">
          <P>
            Actualmente, Me Apunto no utiliza cookies de terceros para análisis,
            publicidad ni ninguna otra finalidad. En caso de incorporar en el futuro
            servicios de terceros que impliquen el uso de cookies, esta política
            será actualizada con la debida antelación y se solicitará el consentimiento
            del usuario cuando sea necesario.
          </P>
        </Seccion>

        <Seccion numero="4" titulo="¿Cómo gestionar o deshabilitar las cookies?">
          <P>
            El usuario puede permitir, bloquear o eliminar las cookies instaladas en su
            dispositivo a través de la configuración de su navegador. A continuación se
            indican los enlaces a las instrucciones de los principales navegadores:
          </P>
          <ul style={{ paddingLeft: "20px", marginBottom: "10px" }}>
            <li style={{ marginBottom: "6px" }}>
              <strong>Google Chrome:</strong> Configuración → Privacidad y seguridad → Cookies y otros datos de sitios
            </li>
            <li style={{ marginBottom: "6px" }}>
              <strong>Mozilla Firefox:</strong> Opciones → Privacidad y seguridad → Cookies y datos del sitio
            </li>
            <li style={{ marginBottom: "6px" }}>
              <strong>Safari:</strong> Preferencias → Privacidad → Gestionar datos de sitios web
            </li>
            <li style={{ marginBottom: "6px" }}>
              <strong>Microsoft Edge:</strong> Configuración → Cookies y permisos del sitio → Cookies y datos del sitio
            </li>
          </ul>
          <P>
            Tenga en cuenta que deshabilitar las cookies técnicas puede afectar al
            correcto funcionamiento de la Plataforma, en especial al acceso al panel
            de gestión de empresas.
          </P>
        </Seccion>

        <Seccion numero="5" titulo="Consentimiento y revocación">
          <P>
            Al acceder por primera vez a Me Apunto, se muestra un aviso informativo sobre
            el uso de cookies. El usuario puede aceptar o rechazar el uso de cookies no
            esenciales mediante el panel de preferencias disponible en dicho aviso.
          </P>
          <P>
            El consentimiento otorgado puede ser revocado en cualquier momento eliminando
            las cookies almacenadas desde la configuración del navegador o haciendo clic
            en el botón correspondiente del aviso de cookies, que puede reactivarse
            eliminando la cookie <strong>cookie_consent</strong> de su navegador.
          </P>
        </Seccion>

        <Seccion numero="6" titulo="Protección de datos y derechos del usuario">
          <P>
            Los datos obtenidos a través de las cookies técnicas son tratados conforme
            a lo establecido en la Política de Privacidad de Me Apunto y en el
            Reglamento (UE) 2016/679 (RGPD). Dichos datos no son cedidos a terceros
            ni utilizados con fines distintos a los indicados en la presente política.
          </P>
          <P>
            El usuario tiene derecho a acceder, rectificar, suprimir, limitar el
            tratamiento y oponerse al tratamiento de sus datos personales. Para ejercer
            estos derechos puede ponerse en contacto con nosotros a través del formulario
            de contacto disponible en la Plataforma.
          </P>
        </Seccion>

        <Seccion numero="7" titulo="Actualizaciones de esta política">
          <P>
            Me Apunto se reserva el derecho de modificar la presente Política de Cookies
            para adaptarla a cambios legislativos o técnicos. Se recomienda al usuario
            revisar esta política periódicamente. Los cambios relevantes serán comunicados
            mediante aviso visible en la Plataforma.
          </P>
        </Seccion>

        <div style={{
          display: "flex",
          gap: "16px",
          flexWrap: "wrap",
          marginTop: "16px"
        }}>
          <button
            onClick={() => navegar("/")}
            style={{
              backgroundColor: "#b79868",
              color: "white",
              fontFamily: "'Baloo Bhai 2', Helvetica",
              fontWeight: "700",
              fontSize: "16px",
              padding: "12px 32px",
              borderRadius: "999px",
              border: "none",
              cursor: "pointer",
              transition: "background-color 0.15s ease"
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#91703d"}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "#b79868"}
          >
            Volver al inicio
          </button>

          <button
            onClick={() => navegar("/terminos")}
            style={{
              backgroundColor: "transparent",
              color: "#91703d",
              fontFamily: "'Baloo Bhai 2', Helvetica",
              fontWeight: "700",
              fontSize: "16px",
              padding: "12px 32px",
              borderRadius: "999px",
              border: "2px solid #91703d",
              cursor: "pointer",
              transition: "all 0.15s ease"
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "#91703d";
              e.currentTarget.style.color = "white";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "transparent";
              e.currentTarget.style.color = "#91703d";
            }}
          >
            Términos y Condiciones
          </button>
        </div>

      </main>

      <Footer />

    </div>
  );
}

export default CookiesPolicy;

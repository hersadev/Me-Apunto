    // pagina de terminos y condiciones
    // registro y publicacion gratuitos
    // patrocinio 10€/mes por evento
    // comision 5% en eventos de pago

    import { useNavigate } from "react-router-dom";
    import { Helmet } from "react-helmet-async";
    import Navbar from "../components/Navbar";
    import Footer from "../components/Footer";
    import Hero from "../components/Hero";

    function TermsAndConditions() {

    const navegar = useNavigate();

    // componente reutilizable para cada seccion
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

    // parrafo reutilizable dentro de cada seccion
    const P = ({ children }) => (
        <p style={{ marginBottom: "10px" }}>{children}</p>
    );

    return (
        <div style={{
        minHeight: "100vh",
        backgroundColor: "#f0e8dc",
        display: "flex",
        flexDirection: "column"
        }}>

        <Helmet>
            <title>Términos y Condiciones | Me Apunto</title>
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

            {/* titulo y fecha */}
            <h1 style={{
            fontFamily: "'Baloo Bhai 2', Helvetica",
            fontSize: "32px",
            fontWeight: "700",
            color: "#2c2c2c",
            marginBottom: "8px"
            }}>
            Términos y Condiciones
            </h1>
            <p style={{
            fontFamily: "'Baloo Bhai 2', Helvetica",
            fontSize: "14px",
            color: "#818181",
            marginBottom: "40px"
            }}>
            Última actualización: marzo de 2026
            </p>

            <Seccion numero="1" titulo="Objeto del servicio">
            <P>
                Me Apunto es una plataforma web que permite a empresas publicar eventos
                y actividades de forma gratuita, y a usuarios registrarse en ellos sin
                necesidad de crear una cuenta. El uso de la plataforma implica la
                aceptación de los presentes términos y condiciones en su totalidad.
            </P>
            <P>
                Me Apunto actúa exclusivamente como intermediario entre empresas
                organizadoras y usuarios interesados, sin responsabilidad directa
                sobre el desarrollo, cancelación o modificación de los eventos publicados.
            </P>
            </Seccion>

            <Seccion numero="2" titulo="Registro de empresas">
            <P>
                Para publicar eventos en Me Apunto, la empresa debe registrarse
                proporcionando un nombre de empresa válido y un correo electrónico
                activo. Este correo será utilizado para recibir las inscripciones
                de los usuarios que se apunten a sus eventos.
            </P>
            <P>
                La empresa es responsable de mantener sus datos actualizados y de
                la confidencialidad de sus credenciales de acceso. Me Apunto no se
                hace responsable del uso indebido de una cuenta por parte de terceros.
            </P>
            </Seccion>

            <Seccion numero="3" titulo="Registro y publicación de eventos">
            <P>
                El registro en Me Apunto es completamente gratuito para todas las
                empresas. No existe límite en el número de eventos que una empresa
                puede publicar, pudiendo hacerlo sin coste alguno de forma indefinida.
            </P>
            <P>
                Los eventos publicados de forma gratuita aparecerán en el listado
                general de la plataforma ordenados por fecha, sin posibilidad de
                destacado ni promoción.
            </P>
            </Seccion>

            <Seccion numero="4" titulo="Facturación y pagos">
            <P>
                La facturación del servicio de eventos patrocinados se realizará
                mensualmente por cada evento activo con patrocinio, mediante los
                métodos de pago disponibles en la plataforma. El pago se realizará
                por adelantado al inicio de cada período mensual.
            </P>
            <P>
                En caso de impago, Me Apunto se reserva el derecho de desactivar
                el patrocinio del evento afectado hasta que el pago sea regularizado.
                No se realizarán reembolsos por períodos parcialmente utilizados
                salvo que la legislación vigente lo exija expresamente.
            </P>
            </Seccion>

            <Seccion numero="5" titulo="Eventos patrocinados">
            <P>
                Me Apunto ofrece la posibilidad de destacar eventos en la parte superior
                del listado principal mediante el sistema de eventos patrocinados.
                El coste de este servicio es de{" "}
                <strong>10€ al mes por cada evento promocionado</strong>,
                facturándose mensualmente mientras el evento permanezca activo y patrocinado.
            </P>
            <P>
                Los eventos patrocinados aparecerán en una sección destacada en la parte
                superior de la plataforma, claramente identificados como patrocinados.
                Cuando haya más de 4 eventos patrocinados activos simultáneamente, estos
                se mostrarán en formato carrusel con rotación automática cada 5 segundos,
                pudiendo el usuario navegar entre ellos manualmente mediante flechas de
                navegación.
            </P>
            <P>
                El orden de aparición dentro del carrusel se establecerá por fecha de
                contratación — las empresas que contraten antes el patrocinio tendrán
                prioridad de posición. Cuando un patrocinio caduca, el siguiente en la
                lista de espera ocupa automáticamente su lugar.
            </P>
            <P>
                Me Apunto se reserva el derecho de rechazar cualquier evento que no cumpla
                con sus políticas de contenido, sin derecho a reembolso. La empresa puede
                activar o desactivar el patrocinio de un evento en cualquier momento desde
                su panel de gestión. La desactivación tendrá efecto al finalizar el período
                mensual en curso.
            </P>
            </Seccion>

            <Seccion numero="6" titulo="Comisiones por eventos de pago">
            <P>
                Para eventos de pago gestionados a través de Me Apunto, la plataforma
                aplicará una comisión del{" "}
                <strong>5% sobre el importe total de cada inscripción completada</strong>.
                Esta comisión se descontará automáticamente del importe abonado por
                el usuario en el momento de la inscripción.
            </P>
            <P>
                Los eventos gratuitos no están sujetos a ninguna comisión. Me Apunto
                se reserva el derecho de modificar el porcentaje de comisión con un
                preaviso mínimo de 30 días mediante notificación al correo registrado.
                Las comisiones ya aplicadas a inscripciones completadas no serán
                modificadas retroactivamente.
            </P>
            </Seccion>

            <Seccion numero="7" titulo="Publicación de eventos">
            <P>
                Las empresas se comprometen a publicar únicamente eventos reales y
                verídicos. Me Apunto se reserva el derecho de eliminar cualquier
                evento que incumpla estas condiciones o que contenga información
                falsa, engañosa o inapropiada, sin derecho a reembolso por parte
                de la empresa en caso de tener patrocinio activo.
            </P>
            <P>
                Las imágenes publicadas deben ser propiedad de la empresa o contar
                con los derechos de uso correspondientes. Me Apunto no se hace
                responsable de posibles reclamaciones por uso indebido de imágenes.
            </P>
            </Seccion>

            <Seccion numero="8" titulo="Protección de datos">
            <P>
                Los datos personales de los usuarios que se inscriban a los eventos
                (nombre, correo electrónico y dirección) serán compartidos únicamente
                con la empresa organizadora del evento en cuestión.
            </P>
            <P>
                Me Apunto no cederá estos datos a terceros ni los utilizará con
                fines comerciales. El tratamiento de datos se realiza conforme al
                Reglamento General de Protección de Datos (RGPD) y la Ley Orgánica
                de Protección de Datos (LOPDGDD).
            </P>
            <P>
                Las empresas se comprometen a tratar los datos de los usuarios
                inscritos conforme a la normativa vigente y únicamente para la
                gestión del evento en cuestión, no pudiendo utilizarlos para otras
                finalidades sin el consentimiento expreso del usuario.
            </P>
            </Seccion>

            <Seccion numero="9" titulo="Cancelación de la cuenta">
            <P>
                La empresa puede cancelar su cuenta en cualquier momento desde su
                panel de gestión. La cancelación no generará reembolso del período
                de patrocinio en curso. Los eventos publicados serán eliminados de
                la plataforma en un plazo máximo de 48 horas tras la cancelación.
            </P>
            <P>
                Me Apunto se reserva el derecho de cancelar o suspender cuentas de
                empresas que incumplan los presentes términos, sin previo aviso y
                sin derecho a reembolso de patrocinios activos.
            </P>
            </Seccion>

            <Seccion numero="10" titulo="Modificaciones de los términos">
            <P>
                Me Apunto se reserva el derecho de modificar los presentes términos
                y condiciones en cualquier momento. Las empresas registradas serán
                notificadas por correo electrónico de cualquier cambio relevante
                con un mínimo de 15 días de antelación.
            </P>
            <P>
                El uso continuado de la plataforma tras la fecha de entrada en vigor
                de los nuevos términos implica la aceptación de los mismos. En caso
                de no aceptar los nuevos términos, la empresa deberá proceder a la
                cancelación de su cuenta antes de la fecha indicada.
            </P>
            </Seccion>

            {/* botones de navegacion */}
            <div style={{
            display: "flex",
            gap: "16px",
            flexWrap: "wrap",
            marginTop: "16px"
            }}>

            {/* volver al registro */}
            <button
                onClick={() => navegar("/register")}
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
                Volver al registro
            </button>

            {/* volver al inicio */}
            <button
                onClick={() => navegar("/")}
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
                Volver al inicio
            </button>

            </div>

        </main>

        <Footer />

        </div>
    );
    }

    export default TermsAndConditions;
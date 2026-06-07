// archivo principal de la app - aqui se definen todas las rutas
import { useState, lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import CookieBanner from "./components/CookieBanner";
import ScrollToTop from "./components/ScrollToTop";

const Home = lazy(() => import("./pages/Home"));
const Login = lazy(() => import("./pages/Login"));
const Register = lazy(() => import("./pages/Register"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const EventDetail = lazy(() => import("./pages/EventDetail"));
const TermsAndConditions = lazy(() => import("./pages/TermsAndConditions"));
const Contact = lazy(() => import("./pages/Contact"));
const CompanyPanel = lazy(() => import("./pages/CompanyPanel"));
const CookiesPolicy = lazy(() => import("./pages/CookiesPolicy"));
const ConfirmarCorreo = lazy(() => import("./pages/ConfirmarCorreo"));
const CancelarInscripcion = lazy(() => import("./pages/CancelarInscripcion"));

function App() {

  // simulamos el estado de login hasta que el backend este listo
  // TODO: sustituir por el estado real del JWT
    const [estaLogueado, setEstaLogueado] = useState(!!localStorage.getItem("empresa"));

  return (
    <HelmetProvider>
      <a href="#main-content" className="skip-link">Saltar al contenido principal</a>
      <BrowserRouter>
        <ScrollToTop />
        <Suspense fallback={<div style={{ minHeight: "100vh", backgroundColor: "#f0e8dc" }} />}>
          <Routes>

            {/* pagina principal */}
            <Route path="/" element={<Home estaLogueado={estaLogueado} />} />

            {/* acceso empresas - al hacer login cambiamos estaLogueado a true */}
            <Route path="/login" element={<Login setEstaLogueado={setEstaLogueado} />} />

            {/* registro empresas */}
            <Route path="/register" element={<Register />} />

            {/* recuperar contraseña */}
            <Route path="/forgot-password" element={<ForgotPassword />} />

            {/* reset contraseña con token */}
            <Route path="/reset-password/:token" element={<ResetPassword />} />

            {/* detalle de evento */}
            <Route path="/evento/:id" element={<EventDetail estaLogueado={estaLogueado} />} />

            {/* terminos y condiciones */}
            <Route path="/terminos" element={<TermsAndConditions />} />

            {/* contacto */}
            <Route path="/contacto" element={<Contact />} />

            {/* panel de empresa */}
            <Route path="/panel" element={<CompanyPanel setEstaLogueado={setEstaLogueado} />} />

            {/* politica de cookies */}
            <Route path="/cookies" element={<CookiesPolicy />} />

            {/* confirmacion de cambio de correo */}
            <Route path="/confirmar-correo/:token" element={<ConfirmarCorreo />} />

            {/* cancelacion de inscripcion por enlace del email */}
            <Route path="/cancelar-inscripcion/:token" element={<CancelarInscripcion />} />

          </Routes>
        </Suspense>
        <CookieBanner />
      </BrowserRouter>
    </HelmetProvider>
  );
}

export default App;

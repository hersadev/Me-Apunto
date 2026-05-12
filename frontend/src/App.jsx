// archivo principal de la app - aqui se definen todas las rutas
import { useState } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";

import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import EventDetail from "./pages/EventDetail";
import TermsAndConditions from "./pages/TermsAndConditions";
import Contact from "./pages/Contact";
import CompanyPanel from "./pages/CompanyPanel";
import CookiesPolicy from "./pages/CookiesPolicy";
import CookieBanner from "./components/CookieBanner";
import ScrollToTop from "./components/ScrollToTop";

function App() {

  // simulamos el estado de login hasta que el backend este listo
  // TODO: sustituir por el estado real del JWT
    const [estaLogueado, setEstaLogueado] = useState(!!localStorage.getItem("empresa"));

  return (
    <HelmetProvider>
      <BrowserRouter>
        <ScrollToTop />
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

        </Routes>
        <CookieBanner />
      </BrowserRouter>
    </HelmetProvider>
  );
}

export default App;
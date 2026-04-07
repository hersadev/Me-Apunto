// archivo principal de la app - aqui se definen todas las rutas
import { useState } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";

import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import EventDetail from "./pages/EventDetail";
import TermsAndConditions from "./pages/TermsAndConditions";
import Contact from "./pages/Contact";
import CompanyPanel from "./pages/CompanyPanel";

function App() {

  // simulamos el estado de login hasta que el backend este listo
  // TODO: sustituir por el estado real del JWT
    const [estaLogueado, setEstaLogueado] = useState(!!localStorage.getItem("token"));

  return (
    <HelmetProvider>
      <BrowserRouter>
        <Routes>

          {/* pagina principal */}
          <Route path="/" element={<Home estaLogueado={estaLogueado} />} />

          {/* acceso empresas - al hacer login cambiamos estaLogueado a true */}
          <Route path="/login" element={<Login setEstaLogueado={setEstaLogueado} />} />

          {/* registro empresas */}
          <Route path="/register" element={<Register />} />

          {/* detalle de evento */}
          <Route path="/evento/:id" element={<EventDetail estaLogueado={estaLogueado} />} />

          {/* terminos y condiciones */}
          <Route path="/terminos" element={<TermsAndConditions />} />

          {/* contacto */}
          <Route path="/contacto" element={<Contact />} />

          {/* panel de empresa */}
          <Route path="/panel" element={<CompanyPanel setEstaLogueado={setEstaLogueado} />} />

        </Routes>
      </BrowserRouter>
    </HelmetProvider>
  );
}

export default App;
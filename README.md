# Me Apunto 🎟️

Plataforma web para el descubrimiento y gestión de eventos locales. Las empresas pueden publicar sus eventos y los usuarios pueden inscribirse sin necesidad de crear una cuenta.

🌐 **Web en producción:** [me-apunto-alpha.vercel.app](https://me-apunto-alpha.vercel.app)

---

## ¿Qué es Me Apunto?

Me Apunto conecta empresas y organizadores de eventos con personas interesadas en actividades culturales, deportivas y de ocio. Las empresas se registran, publican sus eventos y reciben las inscripciones directamente por correo. Los usuarios simplemente se apuntan rellenando un formulario rápido, sin necesidad de registrarse.

---

## Funcionalidades

### Para usuarios
- Explorar eventos por categoría, fecha y tipo (gratuito / de pago)
- Buscador de eventos por título o lugar
- Calendario interactivo con vista de mes y semana
- Inscribirse a eventos con un formulario rápido
- Ver el detalle de cada evento con mapa integrado de Google Maps

### Para empresas
- Registro con NIF/CIF obligatorio
- Panel privado para gestionar eventos
- Crear, editar y eliminar eventos
- Subir imágenes propias (almacenadas en Cloudinary)
- Recibir inscripciones por correo automáticamente
- Activar patrocinio para destacar eventos (pendiente Stripe)

---

## Stack tecnológico

### Frontend
- **React** — interfaz de usuario
- **React Router DOM** — navegación entre páginas
- **Axios** — comunicación con el backend
- **React Helmet Async** — metaetiquetas SEO
- **Tailwind CSS** — estilos

### Backend
- **Node.js + Express** — servidor y API REST
- **MongoDB + Mongoose** — base de datos
- **JWT + bcrypt** — autenticación y seguridad
- **Resend** — envío de correos
- **Multer + Cloudinary** — subida y almacenamiento de imágenes
- **node-cron** — tareas programadas

### Infraestructura
- **Vercel** — despliegue del frontend
- **Railway** — despliegue del backend
- **MongoDB Atlas** — base de datos en la nube
- **GitHub** — control de versiones

---

## Estructura del proyecto

```
me-apunto/
├── frontend/
│   └── src/
│       ├── components/     # Navbar, Hero, Footer, EventCard...
│       ├── pages/          # Home, Login, Register, EventDetail...
│       └── services/       # api.js, authService, eventoService...
└── backend/
    └── src/
        ├── controllers/    # authController, eventoController...
        ├── models/         # Empresa.js, Evento.js, Inscripcion.js
        ├── routes/         # authRoutes, eventoRoutes...
        ├── middleware/     # authMiddleware.js
        └── services/       # emailService, cloudinaryService...
```

---

## Variables de entorno

### Backend (.env)
```
PORT=5000
MONGODB_URI=mongodb+srv://...
JWT_SECRET=...
RESEND_API_KEY=...
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
FRONTEND_URL=http://localhost:3000
```

### Frontend (.env)
```
REACT_APP_API_URL=http://localhost:5000/api
```

---

## Arrancar en local

**Requisitos:** Node.js, MongoDB

```bash
# Terminal 1 — Base de datos
mongod --dbpath "C:\data\db"

# Terminal 2 — Backend
cd backend
npm install
npm run dev

# Terminal 3 — Frontend
cd frontend
npm install
npm start
```

La web estará disponible en `http://localhost:3000`

---

## API — Endpoints principales

| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| POST | `/api/auth/register` | Registrar empresa | No |
| POST | `/api/auth/login` | Iniciar sesión | No |
| GET | `/api/eventos` | Listar eventos públicos | No |
| GET | `/api/eventos/:id` | Detalle de un evento | No |
| POST | `/api/eventos` | Crear evento | Sí |
| PUT | `/api/eventos/:id` | Editar evento | Sí |
| DELETE | `/api/eventos/:id` | Eliminar evento | Sí |
| POST | `/api/inscripciones` | Inscribirse a un evento | No |
| POST | `/api/contacto` | Enviar mensaje de contacto | No |

---

## Modelo de negocio

- **Publicación de eventos:** gratuita
- **Eventos patrocinados:** 10€/mes por evento (fila destacada en la página principal)
- **Comisión eventos de pago:** 5% sobre el importe total *(pendiente de implementar con Stripe)*

---

## Pendiente

- [ ] Integración con Stripe para pagos y patrocinios
- [ ] Dominio propio para envío de correos a cualquier dirección
- [ ] Página de error 404
- [ ] Recuperación de contraseña
- [ ] Cascade delete al eliminar una empresa

---

## Autor

Desarrollado por **HerSaDev**  
🔗 [github.com/hersadev](https://github.com/hersadev)

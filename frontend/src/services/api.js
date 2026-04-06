    // configuracion base de axios
    // todas las peticiones al backend pasan por aqui
    // se añade automaticamente el token JWT si existe

    import axios from "axios";

    // url base del backend
    // en desarrollo apunta a localhost, en produccion a la url real
    const BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:5000/api";

    // creamos una instancia de axios con la url base
    const api = axios.create({
    baseURL: BASE_URL,
    });

    // interceptor de peticiones
    // antes de cada peticion añadimos el token JWT al header
    // si no hay token la peticion se envia sin autenticacion
    api.interceptors.request.use(
    (config) => {
        // buscamos el token en localStorage
        const token = localStorage.getItem("token");
        if (token) {
        config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
    );

    // interceptor de respuestas
    // si el servidor devuelve 401 significa que el token ha expirado
    // limpiamos el localStorage y redirigimos al login
    api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
        // token expirado o invalido - limpiamos y redirigimos
        localStorage.removeItem("token");
        localStorage.removeItem("empresa");
        window.location.href = "/login";
        }
        return Promise.reject(error);
    }
    );

    export default api;
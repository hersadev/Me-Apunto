import axios from "axios";

const BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:5001/api";

const api = axios.create({
  baseURL: BASE_URL,
  // necesario para que el navegador envíe la cookie httpOnly en cada petición
  withCredentials: true,
});

// adjunta el token como Bearer si existe en localStorage (fallback para Safari)
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// si el servidor devuelve 401 limpiamos los datos locales y redirigimos al login
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const url = error.config?.url || "";
    if (error.response?.status === 401 && !url.includes("/auth/")) {
      localStorage.removeItem("empresa");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export default api;

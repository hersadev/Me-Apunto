// ── DATOS DE PRUEBA (MOCK DATA) ──────────────────────────────────────────────
// Estos eventos simulan lo que vendrá de la base de datos cuando el backend
// esté conectado. Cada objeto representa un evento publicado por una empresa.

import coffeImg from "../assets/images/coffe.png";
import comicImg from "../assets/images/comic.png";
import velasImg from "../assets/images/velas.png";
import exposicionImg from "../assets/images/exposicion.png";

export const mockEvents = [
    {
    id: 1,
    title: "Elabora tu propio café",
    venue: "Café La Unión",
    date: "10/03/2026",
    time: "18:00",
    image: coffeImg,
    description:
        "Lorem ipsum dolor sit amet consectetur. Egestas varius ut magna ut. Urna sit massa nisi sed amet a aliquam. Laoreet nibh scelerisque ultrices faucibus dignissim tellus fermentum.",
    location: { lat: 37.9922, lng: -1.1307 }, // Coordenadas para el mapa
    },
    {
    id: 2,
    title: "Concurso de Manga",
    venue: "Cuartel de Artillería",
    date: "17/03/2026",
    time: "17:00",
    image: comicImg,
    description:
        "Lorem ipsum dolor sit amet consectetur. Egestas varius ut magna ut. Urna sit massa nisi sed amet a aliquam. Laoreet nibh scelerisque ultrices faucibus dignissim tellus fermentum.",
    location: { lat: 37.9845, lng: -1.1289 },
    },
    {
    id: 3,
    title: "Taller de velas artesanales",
    venue: "PureClub",
    date: "04/04/2026",
    time: "18:15",
    image: velasImg,
    description:
        "Lorem ipsum dolor sit amet consectetur. Egestas varius ut magna ut. Urna sit massa nisi sed amet a aliquam. Laoreet nibh scelerisque ultrices faucibus dignissim tellus fermentum.",
    location: { lat: 37.9901, lng: -1.1350 },
    },
    {
    id: 4,
    title: "Exposición La luz del mundo",
    venue: "CajaMurcia",
    date: "14/06/2026",
    time: "11:00",
    image: exposicionImg,
    description:
        "Lorem ipsum dolor sit amet consectetur. Egestas varius ut magna ut. Urna sit massa nisi sed amet a aliquam. Laoreet nibh scelerisque ultrices faucibus dignissim tellus fermentum.",
    location: { lat: 37.9878, lng: -1.1301 },
    },
    {
    id: 5,
    title: "Elabora tu propio café",
    venue: "Café La Unión",
    date: "10/03/2026",
    time: "18:00",
    image: coffeImg,
    description:
        "Lorem ipsum dolor sit amet consectetur. Egestas varius ut magna ut. Urna sit massa nisi sed amet a aliquam. Laoreet nibh scelerisque ultrices faucibus dignissim tellus fermentum.",
    location: { lat: 37.9922, lng: -1.1307 },
    },
    {
    id: 6,
    title: "Concurso de Manga",
    venue: "Cuartel de Artillería",
    date: "17/03/2026",
    time: "17:00",
    image: comicImg,
    description:
        "Lorem ipsum dolor sit amet consectetur. Egestas varius ut magna ut. Urna sit massa nisi sed amet a aliquam. Laoreet nibh scelerisque ultrices faucibus dignissim tellus fermentum.",
    location: { lat: 37.9845, lng: -1.1289 },
    },
    {
    id: 7,
    title: "Taller de velas artesanales",
    venue: "PureClub",
    date: "04/04/2026",
    time: "18:15",
    image: velasImg,
    description:
        "Lorem ipsum dolor sit amet consectetur. Egestas varius ut magna ut. Urna sit massa nisi sed amet a aliquam. Laoreet nibh scelerisque ultrices faucibus dignissim tellus fermentum.",
    location: { lat: 37.9901, lng: -1.1350 },
    },
    {
    id: 8,
    title: "Exposición La luz del mundo",
    venue: "CajaMurcia",
    date: "14/06/2026",
    time: "11:00",
    image: exposicionImg,
    description:
        "Lorem ipsum dolor sit amet consectetur. Egestas varius ut magna ut. Urna sit massa nisi sed amet a aliquam. Laoreet nibh scelerisque ultrices faucibus dignissim tellus fermentum.",
    location: { lat: 37.9878, lng: -1.1301 },
    },
];
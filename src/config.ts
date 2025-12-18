// API Configuration
const isDevelopment = import.meta.env.MODE === 'development';

export const API_URL = isDevelopment
    ? 'http://localhost:3000'
    : 'https://chess-elo.onrender.com';

export const SOCKET_URL = isDevelopment
    ? 'http://localhost:3000'
    : 'https://chess-elo.onrender.com';

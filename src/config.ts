// API Configuration
// Check if running on localhost (development) or production
const isLocalhost = typeof window !== 'undefined' &&
    (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

const isDevelopment = import.meta.env.MODE === 'development' || isLocalhost;

export const API_URL = isDevelopment
    ? 'http://localhost:3000'
    : 'https://chess-elo.onrender.com';

export const SOCKET_URL = isDevelopment
    ? 'http://localhost:3000'
    : 'https://chess-elo.onrender.com';

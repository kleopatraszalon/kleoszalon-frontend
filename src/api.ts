import axios from "axios";

// Axios példány backend URL-lel és cookie-k engedélyezésével
const api = axios.create({
  baseURL: "http://localhost:5000/api", // backend port
  withCredentials: true,                // ha cookie-kat is szeretnél kezelni
});

export default api;
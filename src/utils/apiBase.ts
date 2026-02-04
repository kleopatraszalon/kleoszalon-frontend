// src/utils/apiBase.ts
// FEJLESZTÉSBEN: minden API hívás a 5000-es backendre megy.
//
//   Backend:  http://localhost:5000
//   API:      http://localhost:5000/api/...

const withBase = (path: string) => {
  const base =
    window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"
      ? "http://localhost:5000/api"
      : "https://kleoszalon-api-1.onrender.com/api";
  return `${base}/${path.replace(/^\/+/, "")}`;
};
export default withBase;

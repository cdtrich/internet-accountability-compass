// Automatically detects dev vs production
export const basePath =
  window.location.hostname === "127.0.0.1" ||
  window.location.hostname === "localhost"
    ? "" // Local dev: no base path
    : "/internet-accountability-compass"; // Production: with base path

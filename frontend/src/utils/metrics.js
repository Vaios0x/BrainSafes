import io from "socket.io-client";
import axios from "axios";

const socket = io("http://localhost:4000");

export function trackMetric({ type, user, value, details }) {
  const data = { type, user, value, details, timestamp: new Date() };
  // Enviar por REST
  axios.post("/metrics", data).catch(() => {});
  // Enviar por Socket.io
  socket.emit("metric", data);
} 
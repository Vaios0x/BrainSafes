import React, { useEffect, useState } from "react";
import io from "socket.io-client";
import axios from "axios";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
  Tooltip,
  Legend
} from "chart.js";
ChartJS.register(LineElement, CategoryScale, LinearScale, PointElement, Tooltip, Legend);

const socket = io("http://localhost:4000");

export default function RealtimeDashboard() {
  const [metrics, setMetrics] = useState([]);
  const [agg, setAgg] = useState([]);
  const [type, setType] = useState("");

  useEffect(() => {
    // Cargar métricas recientes
    axios.get("/metrics").then(res => setMetrics(res.data));
    // Cargar agregados
    axios.get("/metrics/aggregate").then(res => setAgg(res.data));
    // Socket.io para métricas en tiempo real
    socket.on("metric", (data) => {
      setMetrics(m => [data, ...m.slice(0, 99)]);
    });
    return () => socket.off("metric");
  }, []);

  // Filtrar por tipo
  const filtered = type ? metrics.filter(m => m.type === type) : metrics;

  // Datos para gráfica
  const chartData = {
    labels: agg.map(a => a._id),
    datasets: [{
      label: "Eventos",
      data: agg.map(a => a.count),
      fill: false,
      borderColor: "#36a2eb"
    }]
  };

  return (
    <div style={{ maxWidth: 900, margin: "auto" }}>
      <h2>Dashboard de Métricas en Tiempo Real</h2>
      <div style={{ marginBottom: 20 }}>
        <label>Filtrar por tipo: </label>
        <input value={type} onChange={e => setType(e.target.value)} placeholder="login, tx, error..." />
      </div>
      <Line data={chartData} />
      <h3>Eventos recientes</h3>
      <table border="1" cellPadding={4} style={{ width: "100%", marginTop: 20 }}>
        <thead>
          <tr>
            <th>Tipo</th>
            <th>Usuario</th>
            <th>Valor</th>
            <th>Timestamp</th>
            <th>Detalles</th>
          </tr>
        </thead>
        <tbody>
          {filtered.slice(0, 20).map((m, i) => (
            <tr key={i}>
              <td>{m.type}</td>
              <td>{m.user}</td>
              <td>{m.value}</td>
              <td>{new Date(m.timestamp).toLocaleString()}</td>
              <td>{JSON.stringify(m.details)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
} 
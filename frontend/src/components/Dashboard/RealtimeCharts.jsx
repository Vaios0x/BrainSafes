import React, { useState, useEffect } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip as ChartTooltip, CartesianGrid, ResponsiveContainer, } from "recharts";
import { useTheme, useMediaQuery, Tooltip, Fade } from "@mui/material";
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import ShowChartIcon from '@mui/icons-material/ShowChart';

const usuariosSimulados = ["all", "0x123", "0x456", "0x789"];

const generateData = (usuario) =>
  Array.from({ length: 20 }, (_, i) => ({
    time: `${i + 1}m`,
    txs: 100 + Math.floor(Math.random() * 50) + (usuario !== "all" ? usuariosSimulados.indexOf(usuario) * 10 : 0),
    volume: 10 + Math.random() * 5 + (usuario !== "all" ? usuariosSimulados.indexOf(usuario) : 0),
    usuario: usuariosSimulados[i % usuariosSimulados.length],
  }));

const RealtimeCharts = ({ filtros }) => {
  const [data, setData] = useState(generateData(filtros.usuario));
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [hovered, setHovered] = useState(-1);

  useEffect(() => {
    const interval = setInterval(() => {
      setData(generateData(filtros.usuario));
    }, 5000);
    return () => clearInterval(interval);
  }, [filtros.usuario]);

  let filteredData = data;
  if (filtros.usuario !== "all") {
    filteredData = filteredData.filter((d) => d.usuario === filtros.usuario);
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: isMobile ? 'column' : 'row',
        gap: isMobile ? '1.5rem' : '2rem',
        marginBottom: isMobile ? '1.5rem' : '2rem',
        width: '100%',
      }}
    >
      <div
        style={{
          flex: 1,
          minWidth: 0,
          boxShadow: hovered === 0 ? theme.shadows[6] : theme.shadows[2],
          borderRadius: 8,
          background: theme.palette.background.paper,
          transition: 'box-shadow 0.3s, transform 0.2s',
          transform: hovered === 0 ? 'scale(1.03)' : 'scale(1)',
          padding: isMobile ? 8 : 16,
        }}
        onMouseEnter={() => setHovered(0)}
        onMouseLeave={() => setHovered(-1)}
      >
        <Tooltip title="Actividad de la red: muestra el número de transacciones por minuto." arrow>
          <h4 style={{ color: theme.palette.text.primary, fontSize: isMobile ? 16 : 20, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
            <TrendingUpIcon color="primary" /> Actividad de la red
          </h4>
        </Tooltip>
        <ResponsiveContainer width="100%" height={isMobile ? 160 : 200}>
          <LineChart data={filteredData}>
            <XAxis dataKey="time" stroke={theme.palette.text.secondary} fontSize={isMobile ? 11 : 13} />
            <YAxis stroke={theme.palette.text.secondary} fontSize={isMobile ? 11 : 13} />
            <ChartTooltip contentStyle={{ background: theme.palette.background.paper, color: theme.palette.text.primary, border: `1px solid ${theme.palette.divider}` }} />
            <CartesianGrid stroke={theme.palette.divider} />
            <Line type="monotone" dataKey="txs" stroke={theme.palette.primary.main} dot={false} isAnimationActive={true} />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div
        style={{
          flex: 1,
          minWidth: 0,
          boxShadow: hovered === 1 ? theme.shadows[6] : theme.shadows[2],
          borderRadius: 8,
          background: theme.palette.background.paper,
          transition: 'box-shadow 0.3s, transform 0.2s',
          transform: hovered === 1 ? 'scale(1.03)' : 'scale(1)',
          padding: isMobile ? 8 : 16,
        }}
        onMouseEnter={() => setHovered(1)}
        onMouseLeave={() => setHovered(-1)}
      >
        <Tooltip title="Volumen de transacciones: ETH movido por minuto." arrow>
          <h4 style={{ color: theme.palette.text.primary, fontSize: isMobile ? 16 : 20, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
            <ShowChartIcon color="secondary" /> Volumen de transacciones
          </h4>
        </Tooltip>
        <ResponsiveContainer width="100%" height={isMobile ? 160 : 200}>
          <LineChart data={filteredData}>
            <XAxis dataKey="time" stroke={theme.palette.text.secondary} fontSize={isMobile ? 11 : 13} />
            <YAxis stroke={theme.palette.text.secondary} fontSize={isMobile ? 11 : 13} />
            <ChartTooltip contentStyle={{ background: theme.palette.background.paper, color: theme.palette.text.primary, border: `1px solid ${theme.palette.divider}` }} />
            <CartesianGrid stroke={theme.palette.divider} />
            <Line type="monotone" dataKey="volume" stroke={theme.palette.secondary.main} dot={false} isAnimationActive={true} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default RealtimeCharts; 
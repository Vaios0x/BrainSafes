import React, { useState } from "react";
import MetricsSummary from "./MetricsSummary";
import RealtimeCharts from "./RealtimeCharts";
import AlertsPanel from "./AlertsPanel";
import QuickLinks from "./QuickLinks";
import FiltersBar from "./FiltersBar";
import { Container, useTheme, useMediaQuery } from "@mui/material";

const filtrosIniciales = {
  fecha: "",
  tipoEvento: "all",
  usuario: "all",
};

const Dashboard = () => {
  const [filtros, setFiltros] = useState(filtrosIniciales);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  return (
    <Container
      maxWidth="lg"
      disableGutters={isMobile}
      style={{
        padding: isMobile ? '1rem 0.5rem' : '2.5rem 2rem',
        background: theme.palette.background.default,
        minHeight: '100vh',
      }}
    >
      <h1 style={{
        color: theme.palette.text.primary,
        fontSize: isMobile ? 24 : 32,
        fontWeight: 700,
        marginBottom: isMobile ? 18 : 28,
      }}>
        Panel Principal
      </h1>
      <FiltersBar filtros={filtros} setFiltros={setFiltros} />
      <MetricsSummary />
      <RealtimeCharts filtros={filtros} />
      <AlertsPanel filtros={filtros} />
      <QuickLinks />
    </Container>
  );
};

export default Dashboard; 
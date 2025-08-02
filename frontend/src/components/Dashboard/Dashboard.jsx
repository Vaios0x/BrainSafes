import React, { useState } from "react";
import MetricsSummary from "./MetricsSummary";
import RealtimeCharts from "./RealtimeCharts";
import AlertsPanel from "./AlertsPanel";
import QuickLinks from "./QuickLinks";
import FiltersBar from "./FiltersBar";
import { 
  Container, 
  useTheme, 
  useMediaQuery, 
  Box, 
  Typography, 
  Grid,
  Paper,
  Fade
} from "@mui/material";

const filtrosIniciales = {
  fecha: "",
  tipoEvento: "all",
  usuario: "all",
};

const Dashboard = () => {
  const [filtros, setFiltros] = useState(filtrosIniciales);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));

  return (
    <Box
      sx={{
        background: theme.palette.background.default,
        minHeight: '100vh',
        py: { xs: 2, sm: 3, md: 4 },
        px: { xs: 1, sm: 2, md: 3 }
      }}
    >
      <Container 
        maxWidth="xl" 
        disableGutters={isMobile}
        sx={{
          px: { xs: 1, sm: 2, md: 3 }
        }}
      >
        {/* Header */}
        <Fade in timeout={600}>
          <Box sx={{ mb: { xs: 2, sm: 3, md: 4 } }}>
            <Typography 
              variant="h1" 
              component="h1"
              sx={{
                color: theme.palette.text.primary,
                fontSize: { xs: '1.75rem', sm: '2rem', md: '2.5rem' },
                fontWeight: 700,
                mb: { xs: 1, sm: 2 },
                textAlign: { xs: 'center', sm: 'left' }
              }}
            >
              Panel Principal
            </Typography>
            <Typography 
              variant="body1"
              sx={{
                color: theme.palette.text.secondary,
                fontSize: { xs: '0.875rem', sm: '1rem' },
                textAlign: { xs: 'center', sm: 'left' },
                opacity: 0.8
              }}
            >
              Bienvenido a tu dashboard personalizado
            </Typography>
          </Box>
        </Fade>

        {/* Filters */}
        <Fade in timeout={800}>
          <Box sx={{ mb: { xs: 2, sm: 3 } }}>
            <FiltersBar filtros={filtros} setFiltros={setFiltros} />
          </Box>
        </Fade>

        {/* Main Content Grid */}
        <Grid container spacing={{ xs: 2, sm: 3, md: 4 }}>
          {/* Metrics Summary */}
          <Grid item xs={12}>
            <Fade in timeout={1000}>
              <Paper 
                elevation={0}
                sx={{
                  borderRadius: 3,
                  overflow: 'hidden',
                  border: `1px solid ${theme.palette.divider}`,
                  backgroundColor: theme.palette.background.paper
                }}
              >
                <MetricsSummary />
              </Paper>
            </Fade>
          </Grid>

          {/* Charts and Alerts Row */}
          <Grid item xs={12} lg={8}>
            <Fade in timeout={1200}>
              <Paper 
                elevation={0}
                sx={{
                  borderRadius: 3,
                  overflow: 'hidden',
                  border: `1px solid ${theme.palette.divider}`,
                  backgroundColor: theme.palette.background.paper,
                  height: '100%',
                  minHeight: { xs: 400, sm: 500, md: 600 }
                }}
              >
                <RealtimeCharts filtros={filtros} />
              </Paper>
            </Fade>
          </Grid>

          {/* Alerts Panel */}
          <Grid item xs={12} lg={4}>
            <Fade in timeout={1400}>
              <Paper 
                elevation={0}
                sx={{
                  borderRadius: 3,
                  overflow: 'hidden',
                  border: `1px solid ${theme.palette.divider}`,
                  backgroundColor: theme.palette.background.paper,
                  height: '100%',
                  minHeight: { xs: 300, sm: 400, md: 600 }
                }}
              >
                <AlertsPanel filtros={filtros} />
              </Paper>
            </Fade>
          </Grid>

          {/* Quick Links */}
          <Grid item xs={12}>
            <Fade in timeout={1600}>
              <Paper 
                elevation={0}
                sx={{
                  borderRadius: 3,
                  overflow: 'hidden',
                  border: `1px solid ${theme.palette.divider}`,
                  backgroundColor: theme.palette.background.paper
                }}
              >
                <QuickLinks />
              </Paper>
            </Fade>
          </Grid>
        </Grid>

        {/* Mobile Optimizations */}
        {isMobile && (
          <Box sx={{ mt: 3 }}>
            <Typography 
              variant="body2" 
              sx={{ 
                textAlign: 'center', 
                color: theme.palette.text.secondary,
                opacity: 0.7
              }}
            >
              Desliza hacia abajo para ver más contenido
            </Typography>
          </Box>
        )}
      </Container>
    </Box>
  );
};

export default Dashboard; 
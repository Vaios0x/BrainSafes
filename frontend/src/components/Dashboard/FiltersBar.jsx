import React from "react";
import { Box, TextField, MenuItem, Select, InputLabel, FormControl, useTheme, useMediaQuery, Tooltip, InputAdornment } from "@mui/material";
import { useTranslation } from "react-i18next";
import EventIcon from '@mui/icons-material/Event';
import FilterListIcon from '@mui/icons-material/FilterList';
import PersonIcon from '@mui/icons-material/Person';

const usuariosSimulados = [
  { id: "all", nombre: "Todos" },
  { id: "0x123", nombre: "Alice" },
  { id: "0x456", nombre: "Bob" },
  { id: "0x789", nombre: "Charlie" },
];

const FiltersBar = ({ filtros, setFiltros }) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const tiposEvento = [
    { value: "all", label: t('dashboard.filters.all') },
    { value: "error", label: t('dashboard.filters.error') },
    { value: "warning", label: t('dashboard.filters.warning') },
    { value: "info", label: t('dashboard.filters.info') },
  ];
  const usuarios = usuariosSimulados.map(u => ({ ...u, nombre: u.id === "all" ? t('dashboard.filters.all') : u.nombre }));

  const handleChange = (e) => {
    setFiltros({ ...filtros, [e.target.name]: e.target.value });
  };

  return (
    <Box
      display="flex"
      flexDirection={isMobile ? 'column' : 'row'}
      gap={isMobile ? 2 : 3}
      mb={isMobile ? 2 : 3}
      alignItems={isMobile ? 'stretch' : 'center'}
      aria-label="Barra de filtros"
      width="100%"
    >
      <Tooltip title={t('Filtrar por fecha de evento.')} arrow>
        <TextField
          label={t('dashboard.filters.date')}
          type="date"
          name="fecha"
          value={filtros.fecha}
          onChange={handleChange}
          InputLabelProps={{ shrink: true }}
          inputProps={{ 'aria-label': t('dashboard.filters.date') }}
          size={isMobile ? 'small' : 'medium'}
          sx={{ minWidth: isMobile ? 120 : 160 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <EventIcon color="primary" />
              </InputAdornment>
            ),
          }}
        />
      </Tooltip>
      <Tooltip title={t('Filtrar por tipo de evento.')} arrow>
        <FormControl sx={{ minWidth: isMobile ? 120 : 160 }} size={isMobile ? 'small' : 'medium'}>
          <InputLabel id="tipo-evento-label">{t('dashboard.filters.eventType')}</InputLabel>
          <Select
            labelId="tipo-evento-label"
            name="tipoEvento"
            value={filtros.tipoEvento}
            label={t('dashboard.filters.eventType')}
            onChange={handleChange}
            inputProps={{ 'aria-label': t('dashboard.filters.eventType') }}
            startAdornment={
              <InputAdornment position="start">
                <FilterListIcon color="primary" />
              </InputAdornment>
            }
          >
            {tiposEvento.map((tipo) => (
              <MenuItem key={tipo.value} value={tipo.value}>{tipo.label}</MenuItem>
            ))}
          </Select>
        </FormControl>
      </Tooltip>
      <Tooltip title={t('Filtrar por usuario.')} arrow>
        <FormControl sx={{ minWidth: isMobile ? 120 : 160 }} size={isMobile ? 'small' : 'medium'}>
          <InputLabel id="usuario-label">{t('dashboard.filters.user')}</InputLabel>
          <Select
            labelId="usuario-label"
            name="usuario"
            value={filtros.usuario}
            label={t('dashboard.filters.user')}
            onChange={handleChange}
            inputProps={{ 'aria-label': t('dashboard.filters.user') }}
            startAdornment={
              <InputAdornment position="start">
                <PersonIcon color="primary" />
              </InputAdornment>
            }
          >
            {usuarios.map((u) => (
              <MenuItem key={u.id} value={u.id}>{u.nombre}</MenuItem>
            ))}
          </Select>
        </FormControl>
      </Tooltip>
    </Box>
  );
};

export default FiltersBar; 
import React, { useState } from 'react';
import { Box, TextField, MenuItem, Select, InputLabel, FormControl, useTheme, useMediaQuery, Tooltip, InputAdornment, Fade, IconButton } from '@mui/material';
import FilterListIcon from '@mui/icons-material/FilterList';
import SearchIcon from '@mui/icons-material/Search';
import CategoryIcon from '@mui/icons-material/Category';
import TuneIcon from '@mui/icons-material/Tune';

const estados = [
  { value: 'todas', label: 'Todas' },
  { value: 'abierta', label: 'Abierta' },
  { value: 'cerrada', label: 'Cerrada' },
];
const tipos = [
  { value: 'todas', label: 'Todos' },
  { value: 'Economía', label: 'Economía' },
  { value: 'Educación', label: 'Educación' },
  { value: 'Gobernanza', label: 'Gobernanza' },
];

export default function ProposalsFilterBar({ filter, setFilter, visible = true }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [showFilters, setShowFilters] = useState(true);
  const handleChange = (e) => {
    setFilter({ ...filter, [e.target.name]: e.target.value });
  };
  return (
    <Fade in={visible && showFilters} timeout={400}>
      <Box
        display="flex"
        flexDirection={isMobile ? 'column' : 'row'}
        gap={isMobile ? 2 : 3}
        mb={isMobile ? 2 : 3}
        alignItems={isMobile ? 'stretch' : 'center'}
        aria-label="Barra de filtros de propuestas"
        width="100%"
        boxShadow={2}
        borderRadius={2}
        p={isMobile ? 1 : 2}
        bgcolor={theme.palette.background.paper}
        style={{ transition: 'box-shadow 0.3s, background 0.3s' }}
        role="region"
      >
        <Tooltip title="Filtrar por estado" arrow enterDelay={300} leaveDelay={100} describeChild>
          <FormControl sx={{ minWidth: isMobile ? 120 : 160 }} size={isMobile ? 'small' : 'medium'}>
            <InputLabel id="estado-label">Estado</InputLabel>
            <Select
              labelId="estado-label"
              name="status"
              value={filter.status}
              label="Estado"
              onChange={handleChange}
              startAdornment={
                <InputAdornment position="start">
                  <FilterListIcon color="primary" />
                </InputAdornment>
              }
              inputProps={{ tabIndex: 0, 'aria-label': 'Filtrar por estado', style: { outline: 'none' }, role: 'combobox' }}
              role="combobox"
            >
              {estados.map((e) => (
                <MenuItem key={e.value} value={e.value} tabIndex={0} aria-label={e.label}>
                  {e.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Tooltip>
        <Tooltip title="Filtrar por tipo de propuesta" arrow enterDelay={300} leaveDelay={100} describeChild>
          <FormControl sx={{ minWidth: isMobile ? 120 : 160 }} size={isMobile ? 'small' : 'medium'}>
            <InputLabel id="tipo-label">Tipo</InputLabel>
            <Select
              labelId="tipo-label"
              name="type"
              value={filter.type}
              label="Tipo"
              onChange={handleChange}
              startAdornment={
                <InputAdornment position="start">
                  <CategoryIcon color="primary" />
                </InputAdornment>
              }
              inputProps={{ tabIndex: 0, 'aria-label': 'Filtrar por tipo de propuesta', style: { outline: 'none' }, role: 'combobox' }}
              role="combobox"
            >
              {tipos.map((t) => (
                <MenuItem key={t.value} value={t.value} tabIndex={0} aria-label={t.label}>
                  {t.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Tooltip>
        <Tooltip title="Buscar propuesta por nombre o palabra clave" arrow enterDelay={300} leaveDelay={100} describeChild>
          <TextField
            label="Buscar"
            name="search"
            value={filter.search}
            onChange={handleChange}
            size={isMobile ? 'small' : 'medium'}
            sx={{ minWidth: isMobile ? 120 : 160, outline: 'none' }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon color="primary" />
                </InputAdornment>
              ),
              inputProps: {
                tabIndex: 0,
                'aria-label': 'Buscar propuesta',
                style: { outline: 'none' },
              },
            }}
            inputProps={{ tabIndex: 0, 'aria-label': 'Buscar propuesta', style: { outline: 'none' } }}
            autoComplete="off"
            role="searchbox"
          />
        </Tooltip>
        <Tooltip title={showFilters ? 'Ocultar filtros' : 'Mostrar filtros'} arrow enterDelay={300} leaveDelay={100} describeChild>
          <span>
            <IconButton
              color="primary"
              onClick={() => setShowFilters(f => !f)}
              style={{ alignSelf: isMobile ? 'flex-end' : 'center', outline: 'none' }}
              aria-label={showFilters ? 'Ocultar filtros' : 'Mostrar filtros'}
              tabIndex={0}
              role="button"
              onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') setShowFilters(f => !f); }}
            >
              <TuneIcon />
            </IconButton>
          </span>
        </Tooltip>
      </Box>
    </Fade>
  );
} 
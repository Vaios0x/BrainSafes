import React, { useState } from 'react';
import { Box, TextField, MenuItem, Select, InputLabel, FormControl, useTheme, useMediaQuery, Tooltip, InputAdornment, Fade, IconButton } from '@mui/material';
import FilterListIcon from '@mui/icons-material/FilterList';
import SearchIcon from '@mui/icons-material/Search';
import StarIcon from '@mui/icons-material/Star';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import TuneIcon from '@mui/icons-material/Tune';

const rarezas = [
  { value: 'all', label: 'Todas' },
  { value: 'Legendario', label: 'Legendario' },
  { value: 'Raro', label: 'Raro' },
  { value: 'Común', label: 'Común' },
];
const estados = [
  { value: 'all', label: 'Todos' },
  { value: 'en venta', label: 'En venta' },
  { value: 'vendido', label: 'Vendido' },
];

export default function MarketplaceFilters({ filtros, setFiltros, visible = true }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [showFilters, setShowFilters] = useState(true);

  const handleChange = (e) => {
    setFiltros({ ...filtros, [e.target.name]: e.target.value });
  };

  return (
    <Fade in={visible && showFilters} timeout={400}>
      <Box
        display="flex"
        flexDirection={isMobile ? 'column' : 'row'}
        gap={isMobile ? 2 : 3}
        mb={isMobile ? 2 : 3}
        alignItems={isMobile ? 'stretch' : 'center'}
        aria-label="Barra de filtros de NFTs"
        width="100%"
        boxShadow={2}
        borderRadius={2}
        p={isMobile ? 1 : 2}
        bgcolor={theme.palette.background.paper}
        style={{ transition: 'box-shadow 0.3s, background 0.3s' }}
        role="region"
      >
        <Tooltip title="Buscar NFT por nombre" arrow enterDelay={300} leaveDelay={100} describeChild>
          <TextField
            label="Buscar"
            name="nombre"
            value={filtros.nombre}
            onChange={handleChange}
            size={isMobile ? 'small' : 'medium'}
            sx={{ minWidth: isMobile ? 120 : 180, outline: 'none' }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon color="primary" />
                </InputAdornment>
              ),
              inputProps: {
                tabIndex: 0,
                'aria-label': 'Buscar NFT por nombre',
                style: { outline: 'none' },
              },
            }}
            inputProps={{ tabIndex: 0, 'aria-label': 'Buscar NFT por nombre', style: { outline: 'none' } }}
            autoComplete="off"
            role="searchbox"
          />
        </Tooltip>
        <Tooltip title="Filtrar por rareza" arrow enterDelay={300} leaveDelay={100} describeChild>
          <FormControl sx={{ minWidth: isMobile ? 120 : 160 }} size={isMobile ? 'small' : 'medium'}>
            <InputLabel id="rareza-label">Rareza</InputLabel>
            <Select
              labelId="rareza-label"
              name="rareza"
              value={filtros.rareza}
              label="Rareza"
              onChange={handleChange}
              startAdornment={
                <InputAdornment position="start">
                  <StarIcon color="primary" />
                </InputAdornment>
              }
              inputProps={{ tabIndex: 0, 'aria-label': 'Filtrar por rareza', style: { outline: 'none' }, role: 'combobox' }}
              role="combobox"
            >
              {rarezas.map((r) => (
                <MenuItem key={r.value} value={r.value} tabIndex={0} aria-label={r.label}>
                  {r.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Tooltip>
        <Tooltip title="Filtrar por estado" arrow enterDelay={300} leaveDelay={100} describeChild>
          <FormControl sx={{ minWidth: isMobile ? 120 : 160 }} size={isMobile ? 'small' : 'medium'}>
            <InputLabel id="estado-label">Estado</InputLabel>
            <Select
              labelId="estado-label"
              name="estado"
              value={filtros.estado}
              label="Estado"
              onChange={handleChange}
              startAdornment={
                <InputAdornment position="start">
                  <LocalOfferIcon color="primary" />
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
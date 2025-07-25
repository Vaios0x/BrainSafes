import React, { useState } from 'react';
import { Card, CardMedia, CardContent, Typography, Grid, Chip, Button, Fade, useTheme, useMediaQuery, Tooltip, IconButton, Snackbar, Alert, CircularProgress, Skeleton, Box } from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import StarIcon from '@mui/icons-material/Star';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import VisibilityIcon from '@mui/icons-material/Visibility';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import FavoriteIcon from '@mui/icons-material/Favorite';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import SentimentDissatisfiedIcon from '@mui/icons-material/SentimentDissatisfied';

export default function NFTGallery({ nfts, isMobile: isMobileProp }) {
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(false);
  const [actionMsg, setActionMsg] = useState('');
  const [hovered, setHovered] = useState(-1);
  const [nftsLoading, setNftsLoading] = useState(false); // Simulación de carga
  const [favorites, setFavorites] = useState([]);
  const [favLoading, setFavLoading] = useState(null); // id del NFT en loading
  const theme = useTheme();
  const isMobile = isMobileProp ?? useMediaQuery(theme.breakpoints.down('sm'));

  // Simular carga de NFTs
  React.useEffect(() => {
    setNftsLoading(true);
    const timer = setTimeout(() => setNftsLoading(false), 1200);
    return () => clearTimeout(timer);
  }, []);

  const handleViewDetail = (nft) => {
    setLoading(true);
    setTimeout(() => {
      setSelected(nft);
      setLoading(false);
      setSuccess(true);
      setActionMsg('Detalle mostrado (simulado)');
      setTimeout(() => setSuccess(false), 2000);
    }, 800);
  };
  const handleBuy = (nft) => {
    setLoading(true);
    // Simular error aleatorio
    const fail = Math.random() < 0.2;
    setTimeout(() => {
      setLoading(false);
      if (fail) {
        setError(true);
        setActionMsg('Error al comprar el NFT. Intenta de nuevo.');
        setTimeout(() => setError(false), 2000);
      } else {
        setSuccess(true);
        setActionMsg('¡Compra realizada (simulada)!');
        setTimeout(() => setSuccess(false), 2000);
      }
    }, 1200);
  };
  const handleFavorite = (nft) => {
    setFavLoading(nft.id);
    // Simular error aleatorio
    const fail = Math.random() < 0.15;
    setTimeout(() => {
      setFavLoading(null);
      if (fail) {
        setError(true);
        setActionMsg('Error al actualizar favoritos.');
        setTimeout(() => setError(false), 2000);
      } else {
        setFavorites(favs => favs.includes(nft.id) ? favs.filter(id => id !== nft.id) : [...favs, nft.id]);
        setSuccess(true);
        setActionMsg(favorites.includes(nft.id) ? 'Eliminado de favoritos' : 'Añadido a favoritos');
        setTimeout(() => setSuccess(false), 2000);
      }
    }, 900);
  };

  if (!nftsLoading && nfts.length === 0) {
    return (
      <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" minHeight={220} width="100%" mt={4}>
        <SentimentDissatisfiedIcon color="disabled" sx={{ fontSize: 56, mb: 1 }} />
        <Typography variant="h6" color="textSecondary">No se encontraron NFTs con los filtros seleccionados.</Typography>
      </Box>
    );
  }

  return (
    <Grid container spacing={isMobile ? 2 : 3}>
      {nftsLoading
        ? Array.from({ length: 3 }).map((_, i) => (
            <Grid item xs={12} sm={6} md={4} key={i}>
              <Skeleton variant="rectangular" height={isMobile ? 180 : 260} animation="wave" style={{ borderRadius: 16 }} aria-busy="true" aria-label="Cargando NFT" />
            </Grid>
          ))
        : nfts.map((nft, idx) => (
            <Grid item xs={12} sm={6} md={4} key={nft.id}>
              <Fade in timeout={500}>
                <Card
                  onClick={() => handleViewDetail(nft)}
                  style={{
                    cursor: 'pointer',
                    border: selected && selected.id === nft.id ? `2px solid ${theme.palette.primary.main}` : undefined,
                    background: theme.palette.background.paper,
                    borderRadius: theme.shape.borderRadius,
                    boxShadow: hovered === idx ? theme.shadows[6] : theme.shadows[2],
                    padding: isMobile ? 6 : 12,
                    transition: 'box-shadow 0.3s, transform 0.2s',
                    transform: hovered === idx ? 'scale(1.04)' : 'scale(1)',
                    position: 'relative',
                    outline: hovered === idx ? `2px solid ${theme.palette.primary.main}` : 'none',
                  }}
                  tabIndex={0}
                  onFocus={() => setHovered(idx)}
                  onBlur={() => setHovered(-1)}
                  onMouseEnter={() => setHovered(idx)}
                  onMouseLeave={() => setHovered(-1)}
                  aria-label={`Tarjeta NFT: ${nft.name}`}
                  role="button"
                  onKeyDown={e => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      handleViewDetail(nft);
                    }
                  }}
                >
                  {/* Botón de favoritos en la esquina superior derecha */}
                  <Tooltip title={favorites.includes(nft.id) ? 'Quitar de favoritos' : 'Agregar a favoritos'} arrow enterDelay={300} leaveDelay={100} describeChild>
                    <span>
                      <IconButton
                        color={favorites.includes(nft.id) ? 'error' : 'default'}
                        size="small"
                        style={{ position: 'absolute', top: 8, right: 8, background: theme.palette.background.paper, boxShadow: theme.shadows[2], zIndex: 2, transition: 'box-shadow 0.3s, transform 0.2s', transform: hovered === idx ? 'scale(1.1)' : 'scale(1)', outline: 'none' }}
                        onClick={e => { e.stopPropagation(); handleFavorite(nft); }}
                        aria-label={favorites.includes(nft.id) ? 'Quitar de favoritos' : 'Agregar a favoritos'}
                        tabIndex={0}
                        disabled={favLoading === nft.id}
                        onFocus={e => e.currentTarget.style.boxShadow = theme.shadows[6]}
                        onBlur={e => e.currentTarget.style.boxShadow = theme.shadows[2]}
                        onKeyDown={e => { if ((e.key === 'Enter' || e.key === ' ') && !favLoading) { e.stopPropagation(); handleFavorite(nft); } }}
                        role="button"
                      >
                        {favLoading === nft.id ? <CircularProgress size={18} aria-label="Cargando favorito" /> : favorites.includes(nft.id) ? <FavoriteIcon /> : <FavoriteBorderIcon />}
                      </IconButton>
                    </span>
                  </Tooltip>
                  <CardMedia
                    component="img"
                    height={isMobile ? 140 : 200}
                    image={nft.image}
                    alt={nft.name}
                    style={{ objectFit: 'cover', borderRadius: theme.shape.borderRadius }}
                  />
                  <CardContent style={{ padding: isMobile ? 8 : 16 }}>
                    <Typography variant="h6" gutterBottom style={{ color: theme.palette.text.primary, fontSize: isMobile ? 15 : 18 }}>
                      {nft.name}
                    </Typography>
                    <Tooltip title="Propietario de este NFT" arrow enterDelay={300} leaveDelay={100} describeChild>
                      <Typography variant="body2" style={{ color: theme.palette.text.secondary, fontSize: isMobile ? 12 : 14, display: 'flex', alignItems: 'center', gap: 4 }} aria-label={`Propietario: ${nft.owner}`}> <PersonIcon fontSize="small" color="primary" /> {nft.owner} </Typography>
                    </Tooltip>
                    <Typography variant="body2" style={{ color: theme.palette.text.secondary, fontSize: isMobile ? 12 : 14, display: 'flex', alignItems: 'center', gap: 4 }} aria-label={`Precio: ${nft.price} ETH`}> <LocalOfferIcon fontSize="small" color="primary" /> Precio: {nft.price} ETH </Typography>
                    <Tooltip title={`Estado: ${nft.status}`} arrow enterDelay={300} leaveDelay={100} describeChild>
                      <Chip label={nft.status} color={nft.status === 'en venta' ? 'success' : 'default'} size="small" style={{ marginTop: 8, fontSize: isMobile ? 11 : 13 }} icon={<LocalOfferIcon fontSize="small" />} aria-label={`Estado: ${nft.status}`} tabIndex={0} />
                    </Tooltip>
                    <Tooltip title={`Rareza: ${nft.rarity}`} arrow enterDelay={300} leaveDelay={100} describeChild>
                      <Chip label={nft.rarity} color="info" size="small" style={{ marginTop: 8, marginLeft: 8, fontSize: isMobile ? 11 : 13 }} icon={<StarIcon fontSize="small" />} aria-label={`Rareza: ${nft.rarity}`} tabIndex={0} />
                    </Tooltip>
                    <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                      <Tooltip title="Ver detalles del NFT" arrow enterDelay={300} leaveDelay={100} describeChild>
                        <span>
                          <Button
                            variant="outlined"
                            size={isMobile ? 'small' : 'medium'}
                            style={{
                              color: theme.palette.primary.main,
                              borderColor: theme.palette.primary.main,
                              fontSize: isMobile ? 13 : 15,
                              boxShadow: theme.shadows[2],
                              transition: 'box-shadow 0.3s, transform 0.2s',
                              transform: hovered === idx ? 'scale(1.04)' : 'scale(1)',
                              outline: 'none',
                            }}
                            startIcon={<VisibilityIcon />}
                            onClick={e => { e.stopPropagation(); handleViewDetail(nft); }}
                            onMouseEnter={e => e.currentTarget.style.boxShadow = theme.shadows[6]}
                            onMouseLeave={e => e.currentTarget.style.boxShadow = theme.shadows[2]}
                            onFocus={e => e.currentTarget.style.boxShadow = theme.shadows[6]}
                            onBlur={e => e.currentTarget.style.boxShadow = theme.shadows[2]}
                            onKeyDown={e => { if ((e.key === 'Enter' || e.key === ' ') && !loading) { e.stopPropagation(); handleViewDetail(nft); } }}
                            disabled={loading}
                            aria-label="Ver detalles del NFT"
                            tabIndex={0}
                            role="button"
                          >
                            {loading && selected && selected.id === nft.id ? <CircularProgress size={16} aria-label="Cargando detalle" /> : 'Ver Detalle'}
                          </Button>
                        </span>
                      </Tooltip>
                      <Tooltip title="Comprar NFT (simulado)" arrow enterDelay={300} leaveDelay={100} describeChild>
                        <span>
                          <Button
                            variant="contained"
                            color="primary"
                            size={isMobile ? 'small' : 'medium'}
                            style={{ fontSize: isMobile ? 13 : 15, boxShadow: theme.shadows[2], transition: 'box-shadow 0.3s, transform 0.2s', outline: 'none' }}
                            startIcon={<ShoppingCartIcon />}
                            onClick={e => { e.stopPropagation(); handleBuy(nft); }}
                            onKeyDown={e => { if ((e.key === 'Enter' || e.key === ' ') && !loading) { e.stopPropagation(); handleBuy(nft); } }}
                            disabled={loading}
                            aria-label="Comprar NFT"
                            tabIndex={0}
                            role="button"
                          >
                            {loading ? <CircularProgress size={16} aria-label="Cargando compra" /> : 'Comprar'}
                          </Button>
                        </span>
                      </Tooltip>
                    </div>
                  </CardContent>
                </Card>
              </Fade>
            </Grid>
          ))}
      <Snackbar open={success} autoHideDuration={2000} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert severity="success" sx={{ width: '100%' }} role="status">{actionMsg || 'Acción realizada correctamente.'}</Alert>
      </Snackbar>
      <Snackbar open={error} autoHideDuration={2000} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert severity="error" sx={{ width: '100%' }} role="alert">{actionMsg || 'Ocurrió un error.'}</Alert>
      </Snackbar>
    </Grid>
  );
} 
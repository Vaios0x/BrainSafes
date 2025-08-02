import React, { useState } from 'react';
import NFTGallery from './NFTGallery';
import MarketplaceFilters from './MarketplaceFilters';
import { 
  Container, 
  useTheme, 
  useMediaQuery, 
  Box, 
  Typography, 
  Paper,
  Fade,
  Grid
} from '@mui/material';

// NFTs simulados
const nftsEjemplo = [
  {
    id: 1,
    name: 'Brain NFT #1',
    image: 'https://placekitten.com/300/300',
    owner: '0x1234...abcd',
    price: 1.2,
    status: 'en venta',
    rarity: 'Legendario',
    attributes: [
      { trait_type: 'Color', value: 'Azul' },
      { trait_type: 'Nivel', value: '5' },
    ],
    description: 'NFT único de la colección BrainSafes.',
    history: [
      { from: '0x0000...0000', to: '0x1234...abcd', date: '2024-07-01', price: 1.2 },
    ],
  },
  {
    id: 2,
    name: 'Brain NFT #2',
    image: 'https://placekitten.com/301/301',
    owner: '0x5678...efgh',
    price: 0.8,
    status: 'vendido',
    rarity: 'Raro',
    attributes: [
      { trait_type: 'Color', value: 'Rojo' },
      { trait_type: 'Nivel', value: '3' },
    ],
    description: 'NFT especial de la colección BrainSafes.',
    history: [
      { from: '0x0000...0000', to: '0x5678...efgh', date: '2024-06-15', price: 0.8 },
    ],
  },
];

const filtrosIniciales = {
  nombre: '',
  rareza: 'all',
  estado: 'all',
};

export default function MarketplacePanel() {
  const [nfts] = useState(nftsEjemplo);
  const [filtros, setFiltros] = useState(filtrosIniciales);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));

  // Filtrado de NFTs
  const filteredNFTs = nfts.filter(nft => {
    const matchNombre = filtros.nombre === '' || nft.name.toLowerCase().includes(filtros.nombre.toLowerCase());
    const matchRareza = filtros.rareza === 'all' || nft.rarity === filtros.rareza;
    const matchEstado = filtros.estado === 'all' || nft.status === filtros.estado;
    return matchNombre && matchRareza && matchEstado;
  });

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
                fontWeight: 700,
                fontSize: { xs: '1.75rem', sm: '2rem', md: '2.5rem' },
                mb: { xs: 1, sm: 2 },
                color: theme.palette.text.primary,
                textAlign: { xs: 'center', sm: 'left' }
              }}
            >
              Marketplace de NFTs
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
              Descubre, compra y vende NFTs únicos de la colección BrainSafes
            </Typography>
          </Box>
        </Fade>

        {/* Filters */}
        <Fade in timeout={800}>
          <Paper 
            elevation={0}
            sx={{
              mb: { xs: 2, sm: 3 },
              borderRadius: 3,
              border: `1px solid ${theme.palette.divider}`,
              backgroundColor: theme.palette.background.paper,
              overflow: 'hidden'
            }}
          >
            <MarketplaceFilters filtros={filtros} setFiltros={setFiltros} />
          </Paper>
        </Fade>

        {/* Gallery */}
        <Fade in timeout={1000}>
          <Paper 
            elevation={0}
            sx={{
              borderRadius: 3,
              border: `1px solid ${theme.palette.divider}`,
              backgroundColor: theme.palette.background.paper,
              overflow: 'hidden',
              minHeight: { xs: 400, sm: 500, md: 600 }
            }}
          >
            <NFTGallery nfts={filteredNFTs} isMobile={isMobile} />
          </Paper>
        </Fade>

        {/* Mobile Stats */}
        {isMobile && (
          <Fade in timeout={1200}>
            <Box sx={{ mt: 3, textAlign: 'center' }}>
              <Typography 
                variant="body2" 
                sx={{ 
                  color: theme.palette.text.secondary,
                  opacity: 0.7
                }}
              >
                {filteredNFTs.length} NFTs encontrados
              </Typography>
            </Box>
          </Fade>
        )}

        {/* Tablet/Desktop Stats */}
        {!isMobile && (
          <Fade in timeout={1200}>
            <Box sx={{ mt: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography 
                variant="body2" 
                sx={{ 
                  color: theme.palette.text.secondary,
                  opacity: 0.7
                }}
              >
                {filteredNFTs.length} NFTs encontrados
              </Typography>
              
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Typography 
                  variant="body2" 
                  sx={{ 
                    color: theme.palette.text.secondary,
                    opacity: 0.7
                  }}
                >
                  Precio total: {filteredNFTs.reduce((sum, nft) => sum + nft.price, 0).toFixed(2)} ETH
                </Typography>
              </Box>
            </Box>
          </Fade>
        )}
      </Container>
    </Box>
  );
} 